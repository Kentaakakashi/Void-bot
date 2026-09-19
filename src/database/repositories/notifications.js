const { getDatabase } = require("../firestore");

function settingsRef(guildId) {
  return getDatabase().collection("guilds").doc(guildId).collection("notificationConfig").doc("main");
}

function stateRef(guildId) {
  return getDatabase().collection("guilds").doc(guildId).collection("notificationState").doc("main");
}

const DEFAULT_SETTINGS = {
  enabled: false,
  channelId: null,
  clanTag: null,
  events: {
    warStart: true,
    warEnd: true,
    missedAttacks: true
  },
  updatedAt: null
};

async function getNotificationSettings(guildId) {
  const snapshot = await settingsRef(guildId).get();

  if (!snapshot.exists) return { ...DEFAULT_SETTINGS, events: { ...DEFAULT_SETTINGS.events } };

  const data = snapshot.data() || {};
  return {
    ...DEFAULT_SETTINGS,
    ...data,
    events: {
      ...DEFAULT_SETTINGS.events,
      ...(data.events || {})
    }
  };
}

async function setNotificationSettings(guildId, changes) {
  const data = {
    ...changes,
    updatedAt: new Date().toISOString()
  };

  await settingsRef(guildId).set(data, { merge: true });
  return getNotificationSettings(guildId);
}

async function disableNotifications(guildId) {
  return setNotificationSettings(guildId, { enabled: false });
}

async function getNotificationState(guildId) {
  const snapshot = await stateRef(guildId).get();
  return snapshot.exists ? snapshot.data() || {} : {};
}

async function setNotificationState(guildId, state) {
  await stateRef(guildId).set(
    { ...state, updatedAt: new Date().toISOString() },
    { merge: true }
  );

  return getNotificationState(guildId);
}

module.exports = {
  getNotificationSettings,
  setNotificationSettings,
  disableNotifications,
  getNotificationState,
  setNotificationState
};