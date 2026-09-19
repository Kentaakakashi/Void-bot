const {
  getUserMemory,
  setUserMemory,
  clearUserMemory
} = require("../database/repositories/memory");

async function loadMemory(guildId, userId) {
  return getUserMemory(guildId, userId);
}

async function saveMemory(guildId, userId, memory) {
  return setUserMemory(guildId, userId, memory);
}

async function clearMemory(guildId, userId) {
  return clearUserMemory(guildId, userId);
}

module.exports = {
  loadMemory,
  saveMemory,
  clearMemory
};