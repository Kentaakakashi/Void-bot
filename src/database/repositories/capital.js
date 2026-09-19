const { getDatabase } = require("../firestore");

function capitalRef(guildId) {
  return getDatabase()
    .collection("guilds")
    .doc(guildId)
    .collection("cocCapital");
}

function seasonId(value) {
  return String(value || "unknown")
    .replace(/[^A-Za-z0-9._-]/g, "_")
    .slice(0, 80);
}

async function saveCapital(guildId, analysis) {
  const id = seasonId(
    (analysis.clanTag || "clan") + "_" +
    (analysis.latestSeason?.season || analysis.latestSeason?.startTime || "current")
  );

  const ref = capitalRef(guildId).doc(id);
  const data = {
    ...analysis,
    savedAt: new Date().toISOString()
  };

  await ref.set(data, { merge: true });
  return { id: ref.id, ...data };
}

async function getCapitalHistory(guildId, clanTag, limit = 10) {
  const snapshot = await capitalRef(guildId)
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
  saveCapital,
  getCapitalHistory
};