const config = require("../config/config");

const {
  getRecentConversation,
  saveConversationMessage
} = require("../database/repositories/conversations");

const { truncate } = require("../utils/format");

async function loadHistory(guildId, userId) {
  const rows = await getRecentConversation(
    guildId,
    userId,
    config.openai.maxHistory
  );

  return rows.map((row) => ({
    role: row.role === "assistant" ? "assistant" : "user",
    content: truncate(row.content || "", 3500)
  }));
}

async function rememberUserMessage({
  guildId,
  userId,
  username,
  content
}) {
  await saveConversationMessage({
    guildId,
    userId,
    username,
    role: "user",
    content
  });
}

async function rememberAssistantMessage({
  guildId,
  userId,
  content
}) {
  await saveConversationMessage({
    guildId,
    userId,
    username: "VØID",
    role: "assistant",
    content
  });
}

module.exports = {
  loadHistory,
  rememberUserMessage,
  rememberAssistantMessage
};