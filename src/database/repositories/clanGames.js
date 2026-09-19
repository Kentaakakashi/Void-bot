const { getDatabase } = require("../firestore");

function gamesRef(guildId) {
  return getDatabase()
    .collection("guilds")
    .doc(guildId)
    .collection("clanGames");
}

function seasonDocId(season) {
  return String(season || "current")
    .replace(/[^A-Za-z0-9._-]/g, "_")
    .slice(0, 80);
}

async function setScore(guildId, season, userId, memberName, points) {
  const seasonRef = gamesRef(guildId).doc(seasonDocId(season));
  await seasonRef.set(
    {
      season: String(season || "current"),
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  );

  const ref = seasonRef
    .collection("members")
    .doc(userId);

  const existing = await ref.get();
  const now = new Date().toISOString();

  await seasonRef.set(
    {
      season: String(season || "current"),
      updatedAt: now
    },
    { merge: true }
  );

  const data = {
    userId,
    memberName: String(memberName || "Unknown").trim(),
    points: Math.max(Number(points || 0), 0),
    createdAt: existing.exists && existing.data()?.createdAt
      ? existing.data().createdAt
      : now,
    updatedAt: now
  };

  await ref.set(data, { merge: true });
  return { id: ref.id, ...data };
}

async function getScores(guildId, season, limit = 50) {
  const snapshot = await gamesRef(guildId)
    .doc(seasonDocId(season))
    .collection("members")
    .orderBy("points", "desc")
    .limit(Math.min(Math.max(Number(limit) || 50, 1), 100))
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }));
}

async function getSeasonHistory(guildId, limit = 10) {
  const seasonsSnapshot = await gamesRef(guildId)
    .get();

  const seasonDocs = [...seasonsSnapshot.docs]
    .sort((a, b) =>
      String(b.data()?.updatedAt || "").localeCompare(
        String(a.data()?.updatedAt || "")
      )
    )
    .slice(0, Math.min(Math.max(Number(limit) || 1, 1), 25));

  const rows = [];

  for (const seasonDoc of seasonDocs) {
    const scores = await seasonDoc.ref
      .collection("members")
      .orderBy("points", "desc")
      .limit(100)
      .get();

    const entries = scores.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    rows.push({
      season: seasonDoc.id,
      totalPoints: entries.reduce(
        (sum, entry) => sum + Math.max(Number(entry.points || 0), 0),
        0
      ),
      memberCount: entries.length,
      topScorer: entries[0] || null,
      updatedAt: seasonDoc.data()?.updatedAt || null
    });
  }

  return rows;
}

async function removeScore(guildId, season, userId) {
  const ref = gamesRef(guildId)
    .doc(seasonDocId(season))
    .collection("members")
    .doc(userId);

  const snapshot = await ref.get();
  if (!snapshot.exists) return false;

  await ref.delete();
  return true;
}

module.exports = {
  setScore,
  getScores,
  getSeasonHistory,
  removeScore
};