const { EmbedBuilder } = require("discord.js");

function categoryLabel(category) {
  return {
    heroes: "Heroes",
    troops: "Troops",
    spells: "Spells",
    equipment: "Equipment"
  }[category] || category;
}

function prioritiesEmbed(plan) {
  const lines = plan.priorities
    .slice(0, 10)
    .map(
      (item, index) =>
        (index + 1) +
        ". **" +
        item.name +
        "** — " +
        categoryLabel(item.category) +
        " • " +
        item.level +
        "/" +
        item.maxLevel +
        " • score " +
        item.score
    )
    .join("\n");

  return new EmbedBuilder()
    .setColor(0x111318)
    .setTitle("🧭 VØID UPGRADE PRIORITIES")
    .setDescription(
      "**" +
        plan.focusLabel +
        "** • TH " +
        plan.townHall +
        "\n\n" +
        (lines || "No incomplete items with reliable level/maxLevel data.")
    )
    .addFields({
      name: "Progress",
      value:
        "Heroes " + plan.progress.heroes + "% • " +
        "Troops " + plan.progress.troops + "% • " +
        "Spells " + plan.progress.spells + "% • " +
        "Equipment " + plan.progress.equipment + "%"
    })
    .setFooter({
      text: "VØID heuristics • not official Clash recommendations"
    });
}

function readinessEmbed(readiness) {
  const items = readiness.incomplete
    .slice(0, 10)
    .map(
      (item) =>
        "**" +
        item.name +
        "** — " +
        categoryLabel(item.category) +
        " • " +
        item.level +
        "/" +
        item.maxLevel
    )
    .join("\n");

  const status =
    readiness.ready && readiness.reliableMaxLevelData
      ? "No tracked incomplete items remain."
      : readiness.reliableMaxLevelData
        ? readiness.incompleteCount + " tracked incomplete item(s) remain."
        : "Max-level data is incomplete, so full readiness cannot be established.";

  return new EmbedBuilder()
    .setColor(readiness.ready ? 0x4ade80 : 0xfacc15)
    .setTitle("🏛️ VØID TOWN HALL READINESS")
    .setDescription(status)
    .addFields({
      name: "Tracked Incomplete Items",
      value: items || "None"
    })
    .setFooter({
      text: "Readiness uses only API-returned progression data"
    });
}

function planEmbed(plan) {
  const steps = plan.steps
    .map(
      (step) =>
        "**" +
        step.step +
        ". " +
        step.name +
        "** — " +
        categoryLabel(step.category) +
        " • " +
        step.fromLevel +
        " → " +
        step.targetLevel +
        "\n" +
        step.reason
    )
    .join("\n\n");

  return new EmbedBuilder()
    .setColor(0x60a5fa)
    .setTitle("🧠 VØID ACCOUNT PLAN")
    .setDescription(
      "**" +
        plan.focusLabel +
        "** • TH " +
        plan.townHall +
        "\nGoals: " +
        plan.goals
    )
    .addFields({
      name: "Recommended Sequence",
      value: steps || "No actionable tracked priorities found."
    })
    .addFields({
      name: "Planning Note",
      value: plan.caveat
    })
    .setFooter({
      text: "VØID HELPER • Planning Intelligence"
    });
}

function goalsEmbed(goals) {
  const value = goals.length
    ? goals
        .slice(0, 15)
        .map(
          (goal) =>
            "**" +
            goal.id +
            "** — " +
            goal.name +
            " • " +
            goal.focus +
            (goal.description ? "\n" + goal.description : "")
        )
        .join("\n\n")
    : "No active goals.";

  return new EmbedBuilder()
    .setColor(0x111318)
    .setTitle("🎯 VØID GOALS")
    .setDescription(value)
    .setFooter({
      text: "Goals are stored per Discord user and server"
    });
}

function latestPlanEmbed(plan) {
  if (!plan) {
    return new EmbedBuilder()
      .setColor(0xfacc15)
      .setTitle("🗂️ VØID SAVED PLANS")
      .setDescription("No saved plan exists yet.");
  }

  return planEmbed(plan).setFooter({
    text:
      "Saved " +
      plan.createdAt +
      " • VØID Planning Intelligence"
  });
}

module.exports = {
  prioritiesEmbed,
  readinessEmbed,
  planEmbed,
  goalsEmbed,
  latestPlanEmbed
};
