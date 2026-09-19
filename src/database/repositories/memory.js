const {
  getDatabase
} = require("../firestore");

function memoryRef(guildId, userId) {
  return getDatabase()
    .collection("guilds")
    .doc(guildId)
    .collection("users")
    .doc(userId)
    .collection("memory")
    .doc("profile");
}

async function getUserMemory(guildId, userId) {
  const snapshot = await memoryRef(guildId, userId).get();

  if (!snapshot.exists) {
    return {};
  }

  return snapshot.data() || {};
}

async function setUserMemory(guildId, userId, memory) {
  await memoryRef(guildId, userId).set(
    {
      ...memory,
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  );

  return getUserMemory(guildId, userId);
}

async function clearUserMemory(guildId, userId) {
  await memoryRef(guildId, userId).delete();
}

module.exports = {
  getUserMemory,
  setUserMemory,
  clearUserMemory
};