function groupByCategory(player) {
  return {
    heroes: player.heroes || [],
    troops: player.troops || [],
    spells: player.spells || [],
    equipment: player.heroEquipment || player.equipment || []
  };
}

function calculateCompletion(items = []) {
  const usable = items.filter(
    (item) =>
      Number.isFinite(Number(item.level)) &&
      Number.isFinite(Number(item.maxLevel)) &&
      Number(item.maxLevel) > 0
  );

  if (!usable.length) {
    return 0;
  }

  const total = usable.reduce(
    (sum, item) =>
      sum +
      Math.min(
        Number(item.level || 0),
        Number(item.maxLevel || 0)
      ),
    0
  );

  const max = usable.reduce(
    (sum, item) => sum + Number(item.maxLevel || 0),
    0
  );

  return max ? Math.round((total / max) * 100) : 0;
}

function buildProgressReport(player) {
  const groups = groupByCategory(player);

  return {
    townHall: player.townHallLevel || 0,
    heroes: calculateCompletion(groups.heroes),
    troops: calculateCompletion(groups.troops),
    spells: calculateCompletion(groups.spells),
    equipment: calculateCompletion(groups.equipment)
  };
}

function findIncomplete(items = []) {
  return items
    .filter(
      (item) =>
        Number(item.level || 0) <
        Number(item.maxLevel || 0)
    )
    .sort(
      (a, b) =>
        Number(b.maxLevel || 0) -
        Number(b.level || 0) -
        (Number(a.maxLevel || 0) -
          Number(a.level || 0))
    );
}

module.exports = {
  buildProgressReport,
  findIncomplete
};