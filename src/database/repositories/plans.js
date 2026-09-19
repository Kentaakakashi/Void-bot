const { getDatabase } = require("../firestore");

function plansRef(guildId, userId) {
  return getDatabase()
    .collection("guilds")
    .doc(guildId)
    .collection("users")
    .doc(userId)
    .collection("cocPlans");
}

async function savePlan(guildId, userId, plan) {
  const ref = plansRef(guildId, userId).doc();

  const data = {
    ...plan,
    createdAt: plan.createdAt || new Date().toISOString()
  };

  await ref.set(data);

  return { id: ref.id, ...data };
}

async function getPlans(guildId, userId, limit = 5) {
  const snapshot = await plansRef(guildId, userId)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }));
}

async function getLatestPlan(guildId, userId) {
  const plans = await getPlans(guildId, userId, 1);
  return plans[0] || null;
}

module.exports = {
  savePlan,
  getPlans,
  getLatestPlan
};
