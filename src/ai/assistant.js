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
    throw new Error("VØID can only operate inside a server.");
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
    `\nCurrent message: ${message.content || "[image-only message]"}`;

  const input = [
    ...history,
    {
      role: "user",
      content: buildMessageContent(userText, imageUrls)
    }
  ];

  const response = await openai.responses.create({
    model: config.openai.model,
    instructions: SYSTEM_INSTRUCTIONS,
    input,
    tools: getAvailableTools(),
    store: false
  });

  const output = String(response.output_text || "").trim();

  if (!output) {
    throw new Error("The AI returned an empty response.");
  }

  await rememberUserMessage({
    guildId: message.guild.id,
    userId: message.author.id,
    username: message.author.username,
    content: message.content || "[image-only message]"
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