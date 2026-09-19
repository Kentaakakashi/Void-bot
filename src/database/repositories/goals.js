const { getDatabase } = require("../firestore");

function goalsRef(guildId, userId) {
  return getDatabase()
    .collection("guilds")
    .doc(guildId)
    .collection("users")
    .doc(userId)
    .collection("cocGoals");
}

function cleanText(value, fallback = "") {
  return String(value ?? fallback).trim();
}

async function createGoal(guildId, userId, goal) {
  const ref = goalsRef(guildId, userId).doc();

  const data = {
    name: cleanText(goal.name),
    description: cleanText(goal.description),
    focus: cleanText(goal.focus, "general"),
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await ref.set(data);

  return { id: ref.id, ...data };
}

async function getGoals(guildId, userId, includeCompleted = false) {
  const snapshot = await goalsRef(guildId, userId)
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((goal) => includeCompleted || goal.status === "active");
}

async function removeGoal(guildId, userId, goalId) {
  const ref = goalsRef(guildId, userId).doc(goalId);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    return false;
  }

  await ref.delete();
  return true;
}

async function updateGoal(guildId, userId, goalId, changes) {
  const ref = goalsRef(guildId, userId).doc(goalId);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    return null;
  }

  await ref.set(
    {
      ...changes,
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  );

  const updated = await ref.get();
  return { id: updated.id, ...updated.data() };
}

module.exports = {
  createGoal,
  getGoals,
  removeGoal,
  updateGoal
};
