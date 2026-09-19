const { EmbedBuilder } = require("discord.js");
const {
  buildWarRecommendations,
  buildWarSummary
} = require("./war");

function memberLines(members, limit = 10) {
  return members
    .slice(0, limit)
    .map(
      (member, index) =>
        (index + 1) +
        ". **" +
        member.name +
        "** — " +
        member.stars +
        "★ • " +
        member.destruction +
        "% • " +
        member.attacksUsed +
        "/" +
        member.attacksAllowed
    )
    .join("\n");
}

function missedLines(members, limit = 10) {
  return members
    .slice(0, limit)
    .map(
      (member) =>
        "**#" +
        member.mapPosition +
        " " +
        member.name +
        "** — " +
        member.attacksUsed +
        "/" +
        member.attacksAllowed +
        " attacks used"
    )
    .join("\n");
}

function targetLines(members, limit = 10) {
  return members
    .slice(0, limit)
    .map(
      (member) =>
        "**#" +
        member.mapPosition +
        " " +
        member.name +
        "** — TH" +
        member.townHallLevel +
        " • best result " +
        member.highestStars +
        "★ / " +
        member.highestDestruction +
        "%"
    )
    .join("\n");
}

function untouchedLines(members, limit = 10) {
  return members
    .slice(0, limit)
    .map(
      (member) =>
        "**#" +
        member.mapPosition +
        " " +
        member.name +
        "** — TH" +
        member.townHallLevel
    )
    .join("\n");
}

function warAnalysisEmbed(analysis) {
  if (analysis.state === "notInWar") {
    return new EmbedBuilder()
      .setColor(0x777777)
      .setTitle("⚔️ VØID WAR INTELLIGENCE")
      .setDescription(analysis.summary);
  }

  const recommendations = buildWarRecommendations(analysis)
    .map((item) => "• " + item)
    .join("\n");

  return new EmbedBuilder()
    .setColor(0xef4444)
    .setTitle("⚔️ VØID WAR INTELLIGENCE")
    .setDescription(
      "**" +
        analysis.clanName +
        "** vs **" +
        analysis.opponentName +
        "**\n" +
        buildWarSummary(analysis)
    )
    .addFields(
      {
        name: "War Status",
        value:
          "**" +
          analysis.state +
          "**\n" +
          analysis.totals.attacksUsed +
          "/" +
          analysis.totals.possibleAttacks +
          " attacks used\n" +
          analysis.totals.attacksRemaining +
          " attacks remaining",
        inline: true
      },
      {
        name: "Stars",
        value:
          analysis.totals.clanStars +
          " ⭐ vs " +
          analysis.totals.opponentStars +
          " ⭐",
        inline: true
      },
      {
        name: "Destruction",
        value:
          analysis.totals.clanDestruction +
          "% vs " +
          analysis.totals.opponentDestruction +
          "%",
        inline: true
      },
      {
        name: "Member Performance",
        value: memberLines(analysis.memberPerformance) || "No attack data yet.",
        inline: false
      },
      {
        name: "Unused Attacks",
        value: missedLines(analysis.missedAttacks) || "None detected.",
        inline: false
      },
      {
        name: "Cleanup Targets",
        value:
          targetLines(analysis.cleanupTargets) ||
          "None detected from recorded attacks."
      },
      {
        name: "Untouched Opponent Bases",
        value:
          untouchedLines(analysis.untouchedOpponentBases) ||
          "None detected."
      },
      {
        name: "VØID Notes",
        value: recommendations || "No additional notes."
      }
    )
    .setFooter({
      text: "VØID HELPER • War Intelligence"
    });
}

function warHistoryEmbed(history) {
  const value = history.length
    ? history
        .slice(0, 10)
        .map(
          (war, index) =>
            (index + 1) +
            ". **" +
            (war.clanName || war.clanTag || "War") +
            " vs " +
            (war.opponentName || "Unknown") +
            "** — " +
            (war.totals?.clanStars ?? 0) +
            "★ / " +
            (war.totals?.opponentStars ?? 0) +
            "★ — " +
            (war.savedAt || "unknown time")
        )
        .join("\n")
    : "No saved war intelligence exists for this clan yet.";

  return new EmbedBuilder()
    .setColor(0x111318)
    .setTitle("🗂️ VØID WAR HISTORY")
    .setDescription(value)
    .setFooter({
      text: "Historical records are manual war snapshots"
    });
}

module.exports = {
  warAnalysisEmbed,
  warHistoryEmbed
};
