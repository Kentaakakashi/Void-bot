const openai = require("./client");
const config = require("../config/config");

const {
  SYSTEM_INSTRUCTIONS
} = require("./personality");

const {
  buildUserContext
} = require("./context");

const {
  loadHistory,
  rememberUserMessage,
  rememberAssistantMessage
} = require("./conversation");

const { loadMemory } = require("./memory");
const { getAvailableTools } = require("./tools");
const { executeTool } = require("./toolHandlers");

const MAX_TOOL_ROUNDS = 4;

function buildMessageContent(content, imageUrls = []) {
  const parts = [];

  if (content) {
    parts.push({
      type: "input_text",
      text: content
    });
  }

  for (const url of imageUrls) {
    parts.push({
      type: "input_image",
      image_url: url
    });
  }

  if (!parts.length) {
    parts.push({
      type: "input_text",
      text: "Hello."
    });
  }

  return parts;
}

async function generateReply({
  message,
  imageUrls = []
}) {
  if (!message.guild) {
    throw new Error(
      "VØID can only operate inside a server."
    );
  }

  const memory = await loadMemory(
    message.guild.id,
    message.author.id
  );

  const history = await loadHistory(
    message.guild.id,
    message.author.id
  );

  const userText =
    buildUserContext({
      message,
      memory
    }) +
    "\nCurrent message: " +
    (message.content || "[image-only message]");

  let input = [
    ...history,
    {
      role: "user",
      content: buildMessageContent(
        userText,
        imageUrls
      )
    }
  ];

  let response;

  for (
    let round = 0;
    round < MAX_TOOL_ROUNDS;
    round += 1
  ) {
    response = await openai.responses.create({
      model: config.openai.model,
      instructions: SYSTEM_INSTRUCTIONS,
      input,
      tools: getAvailableTools(),
      store: false
    });

    const calls = (response.output || [])
      .filter((item) => item.type === "function_call");

    if (calls.length === 0) {
      break;
    }

    input = [
      ...input,
      ...response.output
    ];

    for (const call of calls) {
      let output;

      try {
        output = await executeTool(
          call.name,
          call.arguments,
          {
            guildId: message.guild.id,
            userId: message.author.id
          }
        );
      } catch (error) {
        output = {
          error:
            error.message ||
            "The requested Clash of Clans tool failed."
        };
      }

      input.push({
        type: "function_call_output",
        call_id: call.call_id,
        output: JSON.stringify(output)
      });
    }
  }

  const output =
    String(response?.output_text || "").trim();

  if (!output) {
    throw new Error(
      "The AI returned an empty response."
    );
  }

  await rememberUserMessage({
    guildId: message.guild.id,
    userId: message.author.id,
    username: message.author.username,
    content:
      message.content ||
      "[image-only message]"
  });

  await rememberAssistantMessage({
    guildId: message.guild.id,
    userId: message.author.id,
    content: output
  });

  return output;
}

module.exports = {
  generateReply
};