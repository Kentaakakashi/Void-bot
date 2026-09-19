const { getDatabase } = require("../firestore");

function accountRef(guildId, userId) {
  return getDatabase()
    .collection("guilds")
    .doc(guildId)
    .collection("users")
    .doc(userId)
    .collection("coc");
}

async function getLinkedAccount(guildId, userId) {
  const snapshot = await accountRef(guildId, userId)
    .doc("primary")
    .get();

  return snapshot.exists ? snapshot.data() : null;
}

async function linkAccount(guildId, userId, playerTag) {
  await accountRef(guildId, userId)
    .doc("primary")
    .set(
      {
        playerTag: playerTag.toUpperCase(),
        linkedAt: new Date().toISOString()
      },
      { merge: true }
    );

  return getLinkedAccount(guildId, userId);
}

async function unlinkAccount(guildId, userId) {
  await accountRef(guildId, userId)
    .doc("primary")
    .delete();
}

module.exports = {
  getLinkedAccount,
  linkAccount,
  unlinkAccount
};