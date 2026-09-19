const {
  getDatabase
} = require("../firestore");

function guildRef(guildId) {
  return getDatabase()
    .collection("guilds")
    .doc(guildId);
}

async function getGuildSettings(guildId) {
  const snapshot = await guildRef(guildId).get();

  if (!snapshot.exists) {
    return {};
  }

  return snapshot.data() || {};
}

async function updateGuildSettings(guildId, changes) {
  await guildRef(guildId).set(
    {
      ...changes,
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  );

  return getGuildSettings(guildId);
}

async function setAiChannel(guildId, channelId) {
  return updateGuildSettings(guildId, {
    aiChannelId: channelId,
    aiEnabled: true
  });
}

async function disableAiChannel(guildId) {
  return updateGuildSettings(guildId, {
    aiChannelId: null,
    aiEnabled: false
  });
}

module.exports = {
  getGuildSettings,
  updateGuildSettings,
  setAiChannel,
  disableAiChannel
};