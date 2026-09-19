const { getDatabase } = require("../firestore");

function donationsRef(guildId) {
  return getDatabase()
    .collection("guilds")
    .doc(guildId)
    .collection("cocDonationSnapshots");
}

function docId(value) {
  return Buffer.from(String(value || "snapshot"))
    .toString("base64url")
    .slice(0, 120);
}

async function saveDonation(guildId, analysis) {
  const capturedAt = new Date().toISOString();
  const id = docId(
    (analysis?.clanTag || "clan") + "_" + capturedAt
  );

  const ref = donationsRef(guildId).doc(id);
  const data = {
    ...analysis,
    capturedAt
  };

  await ref.set(data);
  return { id: ref.id, ...data };
}

async function getDonationHistory(guildId, clanTag, limit = 25) {
  const snapshot = await donationsRef(guildId)
    .orderBy("capturedAt", "desc")
    .limit(Math.min(Math.max(Number(limit) || 1, 1), 50))
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
  saveDonation,
  getDonationHistory
};
