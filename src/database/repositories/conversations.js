const {
  getDatabase
} = require("../firestore");

function messagesRef(guildId, userId) {
  return getDatabase()
    .collection("guilds")
    .doc(guildId)
    .collection("users")
    .doc(userId)
    .collection("aiMessages");
}

async function saveConversationMessage({
  guildId,
  userId,
  username,
  role,
  content
}) {
  await messagesRef(guildId, userId).add({
    username,
    role,
    content,
    createdAt: new Date().toISOString()
  });
}

async function getRecentConversation(guildId, userId, limit = 20) {
  const snapshot = await messagesRef(guildId, userId)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snapshot.docs
    .map((doc) => doc.data())
    .reverse();
}

async function clearConversation(guildId, userId) {
  const ref = messagesRef(guildId, userId);

  while (true) {
    const snapshot = await ref.limit(400).get();

    if (snapshot.empty) {
      break;
    }

    const batch = getDatabase().batch();

    for (const doc of snapshot.docs) {
      batch.delete(doc.ref);
    }

    await batch.commit();
  }
}

module.exports = {
  saveConversationMessage,
  getRecentConversation,
  clearConversation
};