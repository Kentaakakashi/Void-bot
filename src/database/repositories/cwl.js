const { getDatabase } = require("../firestore");

function cwlRef(guildId) {
  return getDatabase()
    .collection("guilds")
    .doc(guildId)
    .collection("cocCwl");
}

function seasonId(value) {
  return String(value || "unknown")
    .replace(/[^A-Za-z0-9._-]/g, "_")
    .slice(0, 80);
}

async function saveCwl(guildId, analysis) {
  const id = seasonId(
    (analysis.clanTag || "clan") +
      "_" +
      (analysis.season || "season")
  );

  const ref = cwlRef(guildId).doc(id);

  const data = {
    ...analysis,
    savedAt: new Date().toISOString()
  };

  await ref.set(data, { merge: true });

  return {
    id: ref.id,
    ...data
  };
}

async function getCwlHistory(guildId, clanTag, limit = 10) {
  const snapshot = await cwlRef(guildId)
    .orderBy("savedAt", "desc")
    .limit(Math.min(Math.max(Number(limit) || 1, 1), 25))
    .get();

  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter(
      (entry) =>
        !clanTag ||
        String(entry.clanTag || "").toUpperCase() ===
          String(clanTag).toUpperCase()
    );
}

module.exports = {
  saveCwl,
  getCwlHistory
};
