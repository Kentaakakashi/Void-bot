const { EmbedBuilder } = require("discord.js");

const {
  buildProgressReport,
  findIncomplete
} = require("./progression");

function progressEmbed(player) {
  const report = buildProgressReport(player);

  const heroes = findIncomplete(player.heroes)
    .slice(0, 8)
    .map(
      (item) =>
        "**" +
        item.name +
        "** — " +
        item.level +
        "/" +
        item.maxLevel
    )
    .join("\n") || "All tracked heroes are at max level.";

  const equipment =
    findIncomplete(
      player.heroEquipment || player.equipment
    )
      .slice(0, 8)
      .map(
        (item) =>
          "**" +
          item.name +
          "** — " +
          item.level +
          "/" +
          item.maxLevel
      )
      .join("\n") || "No incomplete equipment data.";

  return new EmbedBuilder()
    .setColor(0x111318)
    .setTitle("🧠 VØID PROGRESSION")
    .setDescription(
      "**" +
        player.name +
        "** (" +
        player.tag +
        ") • TH " +
        player.townHallLevel
    )
    .addFields(
      {
        name: "Heroes",
        value: report.heroes + "%",
        inline: true
      },
      {
        name: "Troops",
        value: report.troops + "%",
        inline: true
      },
      {
        name: "Spells",
        value: report.spells + "%",
        inline: true
      },
      {
        name: "Equipment",
        value: report.equipment + "%",
        inline: true
      },
      {
        name: "Hero Levels Still Missing",
        value: heroes,
        inline: false
      },
      {
        name: "Equipment Still Missing",
        value: equipment,
        inline: false
      }
    )
    .setFooter({
      text: "VØID HELPER • Progression Intelligence"
    });
}

function snapshotDiffEmbed(previous, current, comparison) {
  const changes = comparison.changed
    .slice(0, 20)
    .map(
      (change) =>
        "**" +
        change.name +
        "** — " +
        change.from +
        " → " +
        change.to
    )
    .join("\n") || "No tracked level changes detected.";

  return new EmbedBuilder()
    .setColor(0x4ade80)
    .setTitle("📈 VØID SNAPSHOT DIFF")
    .setDescription(comparison.summary)
    .addFields({
      name: "Changes",
      value: changes,
      inline: false
    })
    .setFooter({
      text:
        "Compared " +
        (previous?.capturedAt || "previous") +
        " → " +
        (current?.capturedAt || "current")
    });
}

module.exports = {
  progressEmbed,
  snapshotDiffEmbed
};