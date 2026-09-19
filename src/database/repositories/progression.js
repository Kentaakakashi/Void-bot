const { getDatabase } = require("../firestore");

function snapshotsRef(guildId, userId) {
  return getDatabase()
    .collection("guilds")
    .doc(guildId)
    .collection("users")
    .doc(userId)
    .collection("cocSnapshots");
}

function normalizeLevels(items = []) {
  return items.map((item) => ({
    name: item.name,
    level: Number(item.level || 0),
    maxLevel: Number(item.maxLevel || 0)
  }));
}

function buildSnapshot(player) {
  return {
    playerTag: player.tag,
    playerName: player.name,
    townHallLevel: Number(player.townHallLevel || 0),
    expLevel: Number(player.expLevel || 0),
    trophies: Number(player.trophies || 0),
    bestTrophies: Number(player.bestTrophies || 0),
    warStars: Number(player.warStars || 0),
    attackWins: Number(player.attackWins || 0),
    defenseWins: Number(player.defenseWins || 0),
    donations: Number(player.donations || 0),
    donationsReceived: Number(player.donationsReceived || 0),
    clanCapitalContributions: Number(
      player.clanCapitalContributions || 0
    ),
    heroes: normalizeLevels(player.heroes),
    troops: normalizeLevels(player.troops),
    spells: normalizeLevels(player.spells),
    equipment: normalizeLevels(
      player.heroEquipment || player.equipment
    ),
    capturedAt: new Date().toISOString()
  };
}

async function saveSnapshot(guildId, userId, player) {
  const snapshot = buildSnapshot(player);

  await snapshotsRef(guildId, userId)
    .add(snapshot);

  return snapshot;
}

async function getSnapshots(guildId, userId, limit = 10) {
  const snapshot = await snapshotsRef(guildId, userId)
    .orderBy("capturedAt", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }));
}

function compareLevels(previous = [], current = []) {
  const oldMap = new Map(
    previous.map((item) => [item.name, item])
  );

  return current
    .map((item) => {
      const old = oldMap.get(item.name);

      if (!old || old.level === item.level) {
        return null;
      }

      return {
        name: item.name,
        from: old.level,
        to: item.level,
        maxLevel: item.maxLevel
      };
    })
    .filter(Boolean);
}

function compareSnapshots(previous, current) {
  if (!previous || !current) {
    return {
      changed: [],
      summary: "Not enough snapshots to compare."
    };
  }

  const changed = [
    ...compareLevels(previous.heroes, current.heroes),
    ...compareLevels(previous.troops, current.troops),
    ...compareLevels(previous.spells, current.spells),
    ...compareLevels(previous.equipment, current.equipment)
  ];

  if (previous.townHallLevel !== current.townHallLevel) {
    changed.unshift({
      name: "Town Hall",
      from: previous.townHallLevel,
      to: current.townHallLevel,
      maxLevel: current.townHallLevel
    });
  }

  return {
    changed,
    summary:
      changed.length === 0
        ? "No tracked level changes detected."
        : changed.length + " tracked change(s) detected."
  };
}

module.exports = {
  buildSnapshot,
  saveSnapshot,
  getSnapshots,
  compareSnapshots
};