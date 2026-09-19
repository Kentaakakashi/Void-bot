const { EmbedBuilder } = require("discord.js");

function clanLines(clans, limit = 8) {
  return clans
    .slice(0, limit)
    .map(
      (clan, index) =>
        (index + 1) +
        ". **" +
        clan.name +
        "** — TH roster " +
        clan.rosterSize +
        " • Lv " +
        clan.level
    )
    .join("\n");
}

function roundLines(rounds, limit = 7) {
  return rounds
    .slice(0, limit)
    .map(
      (war) =>
        "**Round " +
        (war.round || "?") +
        "** — " +
        war.clanName +
        " vs " +
        war.opponentName +
        " • " +
        war.totals.clanStars +
        "★ / " +
        war.totals.opponentStars +
        "★ • " +
        war.result
    )
    .join("\n");
}

function memberLines(members, limit = 12) {
  return members
    .slice(0, limit)
    .map(
      (member, index) =>
        (index + 1) +
        ". **" +
        member.name +
        "** — " +
        member.warsParticipated +
        " wars • " +
        member.stars +
        "★ • " +
        member.averageStars +
        " avg★ • " +
        member.averageDestruction +
        "% avg dest"
    )
    .join("\n");
}

function cwlOverviewEmbed(analysis) {
  if (analysis.state === "notInWar") {
    return new EmbedBuilder()
      .setColor(0x777777)
      .setTitle("🏆 VØID CWL INTELLIGENCE")
      .setDescription(
        analysis.clanTag +
          " is not currently participating in a CWL group."
      );
  }

  return new EmbedBuilder()
    .setColor(0x111318)
    .setTitle("🏆 VØID CWL INTELLIGENCE")
    .setDescription(
      "**" +
        analysis.clanName +
        "** • Season " +
        (analysis.season || "unknown")
    )
    .addFields(
      {
        name: "Season Record",
        value:
          analysis.summary.wins +
          "W • " +
          analysis.summary.ties +
          "T • " +
          analysis.summary.losses +
          "L",
        inline: true
      },
      {
        name: "Stars",
        value: String(analysis.summary.stars),
        inline: true
      },
      {
        name: "Attacks",
        value:
          analysis.summary.attacksUsed +
          " used • " +
          analysis.summary.attacksRemaining +
          " unused",
        inline: true
      },
      {
        name: "Participating Clans",
        value: clanLines(analysis.participatingClans) || "No roster data."
      },
      {
        name: "Rounds",
        value: roundLines(analysis.rounds) || "No completed/in-progress rounds fetched."
      }
    )
    .setFooter({
      text: "VØID HELPER • CWL Intelligence"
    });
}

function cwlAnalysisEmbed(analysis) {
  const memberValue =
    memberLines(analysis.memberPerformance) ||
    "No member attack data has been returned.";

  const rosterValue =
    analysis.roster.registeredNotSeenInFetchedWars
      .slice(0, 10)
      .map(
        (member) =>
          "**" +
          member.name +
          "** — TH" +
          member.townHallLevel
      )
      .join("\n") ||
    "All registered roster members found in the fetched wars.";

  return new EmbedBuilder()
    .setColor(0x60a5fa)
    .setTitle("🧠 VØID CWL ANALYSIS")
    .setDescription(
      "**" +
        analysis.clanName +
        "** • Season " +
        (analysis.season || "unknown")
    )
    .addFields(
      {
        name: "Record",
        value:
          analysis.summary.wins +
          "W • " +
          analysis.summary.ties +
          "T • " +
          analysis.summary.losses +
          "L",
        inline: true
      },
      {
        name: "Stars / 3-Stars",
        value:
          analysis.summary.stars +
          " ⭐ / " +
          analysis.summary.threeStars +
          " 3★",
        inline: true
      },
      {
        name: "Attack Usage",
        value:
          analysis.summary.attacksUsed +
          " used • " +
          analysis.summary.attacksRemaining +
          " remaining",
        inline: true
      },
      {
        name: "Member Performance",
        value: memberValue,
        inline: false
      },
      {
        name: "Roster Coverage",
        value:
          analysis.roster.warParticipantCount +
          "/" +
          analysis.roster.registeredCount +
          " registered members appeared in fetched war rosters.\n" +
          rosterValue,
        inline: false
      }
    )
    .setFooter({
      text: "CWL attack usage uses the fixed one-attack-per-member CWL rule; API does not expose attacksPerMember."
    });
}

function cwlHistoryEmbed(history) {
  const value = history.length
    ? history
        .slice(0, 10)
        .map(
          (entry, index) =>
            (index + 1) +
            ". **" +
            (entry.clanName || entry.clanTag || "CWL") +
            "** — Season " +
            (entry.season || "unknown") +
            " • " +
            (entry.summary?.wins ?? 0) +
            "W/" +
            (entry.summary?.losses ?? 0) +
            "L • " +
            (entry.summary?.stars ?? 0) +
            "★"
        )
        .join("\n")
    : "No saved CWL intelligence exists yet.";

  return new EmbedBuilder()
    .setColor(0x111318)
    .setTitle("🗂️ VØID CWL HISTORY")
    .setDescription(value)
    .setFooter({
      text: "Historical records are manual CWL snapshots"
    });
}

module.exports = {
  cwlOverviewEmbed,
  cwlAnalysisEmbed,
  cwlHistoryEmbed
};
