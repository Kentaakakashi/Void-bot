const openai = require("./client");

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
const GEMINI_MODEL = "gemini-3.8-flash";

function buildMessageContent(content, imageUrls = []) {
  const parts = [];

  if (content) {
    parts.push({
      type: "text",
      text: content
    });
  }

  for (const url of imageUrls) {
    parts.push({
      type: "image_url",
      image_url: {
        url
      }
    });
  }

  if (!parts.length) {
    parts.push({
      type: "text",
      text: "Hello."
    });
  }

  return parts;
}

function toChatTools(tools) {
  return tools.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
      ...(tool.strict === undefined
        ? {}
        : { strict: tool.strict })
    }
  }));
}

function getAssistantMessage(response) {
  return response?.choices?.[0]?.message || null;
}

function getToolCalls(message) {
  return Array.isArray(message?.tool_calls)
    ? message.tool_calls.filter(
        (call) =>
          call?.type === "function" &&
          call?.function?.name &&
          call?.id
      )
    : [];
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

  let messages = [
    {
      role: "system",
      content: SYSTEM_INSTRUCTIONS
    },
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
    response = await openai.chat.completions.create({
      model: GEMINI_MODEL,
      messages,
      tools: toChatTools(getAvailableTools())
    });

    const assistantMessage = getAssistantMessage(response);

    if (!assistantMessage) {
      throw new Error(
        "The AI returned no assistant message."
      );
    }

    const calls = getToolCalls(assistantMessage);

    messages = [
      ...messages,
      assistantMessage
    ];

    if (calls.length === 0) {
      break;
    }

    for (const call of calls) {
      let output;

      try {
        output = await executeTool(
          call.function.name,
          call.function.arguments,
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

      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(output)
      });
    }
  }

  const output =
    String(
      getAssistantMessage(response)?.content || ""
    ).trim();

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
