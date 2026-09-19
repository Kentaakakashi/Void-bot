const { getDatabase } = require("../firestore");

function warsRef(guildId) {
  return getDatabase()
    .collection("guilds")
    .doc(guildId)
    .collection("cocWars");
}

function warDocId(value) {
  return Buffer.from(String(value || "unknown"))
    .toString("base64url")
    .slice(0, 120);
}

async function saveWar(guildId, analysis) {
  const id = warDocId(analysis.warId);
  const ref = warsRef(guildId).doc(id);

  const data = {
    ...analysis,
    savedAt: new Date().toISOString()
  };

  await ref.set(data, { merge: true });

  return { id: ref.id, ...data };
}

async function getWarHistory(guildId, clanTag, limit = 10) {
  const snapshot = await warsRef(guildId)
    .orderBy("savedAt", "desc")
    .limit(Math.min(Math.max(Number(limit) || 1, 1), 25))
    .get();

  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter(
      (war) =>
        !clanTag ||
        String(war.clanTag || "").toUpperCase() ===
          String(clanTag).toUpperCase()
    );
}

module.exports = {
  saveWar,
  getWarHistory
};
