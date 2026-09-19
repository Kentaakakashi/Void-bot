const { buildProgressReport, findIncomplete } = require("./progression");

const FOCUS_LABELS = {
  general: "General Progression",
  war: "War Focus",
  trophy: "Trophy Focus"
};

const FOCUS_WEIGHTS = {
  general: { heroes: 4, equipment: 3, troops: 3, spells: 2 },
  war: { heroes: 5, equipment: 5, troops: 4, spells: 3 },
  trophy: { troops: 5, spells: 4, heroes: 3, equipment: 2 }
};

function groupsFor(player) {
  return {
    heroes: player.heroes || [],
    troops: player.troops || [],
    spells: player.spells || [],
    equipment: player.heroEquipment || player.equipment || []
  };
}

function itemGap(item) {
  const level = Number(item.level);
  const max = Number(item.maxLevel);

  if (!Number.isFinite(level) || !Number.isFinite(max) || max <= level) {
    return 0;
  }

  return max - level;
}

function buildPriorities(player, focus = "general") {
  const normalizedFocus = FOCUS_WEIGHTS[focus] ? focus : "general";
  const groups = groupsFor(player);
  const weights = FOCUS_WEIGHTS[normalizedFocus];
  const priorities = [];

  for (const [category, items] of Object.entries(groups)) {
    for (const item of items) {
      const gap = itemGap(item);

      if (!gap) continue;

      const level = Number(item.level);
      const maxLevel = Number(item.maxLevel);

      priorities.push({
        category,
        name: item.name || "Unknown item",
        level,
        maxLevel,
        levelsRemaining: gap,
        score: gap * weights[category]
      });
    }
  }

  priorities.sort((a, b) => b.score - a.score);

  return {
    focus: normalizedFocus,
    focusLabel: FOCUS_LABELS[normalizedFocus],
    townHall: Number(player.townHallLevel || 0),
    priorities: priorities.slice(0, 15),
    trackedItems: priorities.length,
    progress: buildProgressReport(player)
  };
}

function buildReadiness(player) {
  const groups = groupsFor(player);
  const incomplete = [];

  for (const [category, items] of Object.entries(groups)) {
    for (const item of items) {
      if (itemGap(item) > 0) {
        incomplete.push({
          category,
          name: item.name || "Unknown item",
          level: Number(item.level || 0),
          maxLevel: Number(item.maxLevel || 0),
          levelsRemaining: itemGap(item)
        });
      }
    }
  }

  const reliableData = incomplete.every(
    (item) => item.maxLevel > 0
  );

  return {
    townHall: Number(player.townHallLevel || 0),
    ready: reliableData && incomplete.length === 0,
    reliableMaxLevelData: reliableData,
    incompleteCount: incomplete.length,
    incomplete: incomplete.slice(0, 30)
  };
}

function buildPlan(player, focus = "general", goals = []) {
  const priorities = buildPriorities(player, focus);
  const readiness = buildReadiness(player);

  const goalText = goals.length
    ? goals.map((goal) => goal.name).join(", ")
    : "No saved goals.";

  const steps = priorities.priorities.slice(0, 7).map(
    (item, index) => ({
      step: index + 1,
      category: item.category,
      name: item.name,
      fromLevel: item.level,
      targetLevel: item.maxLevel,
      reason:
        focus === "war"
          ? "High priority for the selected war-focused plan."
          : focus === "trophy"
            ? "High priority for the selected trophy-focused plan."
            : "High priority based on the current tracked progression gap."
    })
  );

  return {
    focus: priorities.focus,
    focusLabel: priorities.focusLabel,
    townHall: priorities.townHall,
    goals: goalText,
    readiness,
    priorities: priorities.priorities,
    steps,
    generatedAt: new Date().toISOString(),
    caveat:
      "Priority scores are VØID planning heuristics, not official Clash of Clans recommendations. Items are only scored when the API supplies usable level/maxLevel data."
  };
}

module.exports = {
  FOCUS_LABELS,
  buildPriorities,
  buildReadiness,
  buildPlan
};
