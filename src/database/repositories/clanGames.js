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
  const ref = gamesRef(guildId)
    .doc(seasonDocId(season))
    .collection("members")
    .doc(userId);

  const existing = await ref.get();
  const now = new Date().toISOString();

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
  removeScore
};