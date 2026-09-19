const { EmbedBuilder } = require("discord.js");

function signed(value) {
  const number = Number(value || 0);
  return number > 0 ? "+" + number : String(number);
}

function date(value) {
  return value ? new Date(value).toLocaleDateString() : "—";
}

function playerAnalyticsEmbed(analysis, player) {
  if (analysis.empty) {
    return new EmbedBuilder()
      .setColor(0x777777)
      .setTitle("📈 VØID HISTORICAL ANALYTICS")
      .setDescription("No progression snapshots have been saved yet. Use /coc snapshot to start the timeline.");
  }

  const completionText =
    analysis.completion.first === null || analysis.completion.latest === null
      ? "Insufficient level data"
      : analysis.completion.first +
        "% → " +
        analysis.completion.latest +
        "% (" +
        signed(analysis.completion.delta) +
        "%)";

  return new EmbedBuilder()
    .setColor(0x4ade80)
    .setTitle("📈 VØID ACCOUNT ANALYTICS")
    .setDescription(
      "**" +
        (player?.name || "Linked Account") +
        "** • " +
        analysis.snapshotCount +
        " snapshots • " +
        analysis.spanDays +
        " days tracked"
    )
    .addFields(
      {
        name: "Trophies",
        value:
          analysis.trophies.first +
          " → " +
          analysis.trophies.latest +
          " (" +
          signed(analysis.trophies.delta) +
          ")",
        inline: true
      },
      {
        name: "Town Hall",
        value:
          "TH" +
          analysis.townHall.first +
          " → TH" +
          analysis.townHall.latest +
          " (" +
          signed(analysis.townHall.delta) +
          ")",
        inline: true
      },
      {
        name: "War Stars",
        value: signed(analysis.warStars.delta),
        inline: true
      },
      {
        name: "Attack Wins",
        value: signed(analysis.attackWins.delta),
        inline: true
      },
      {
        name: "Defense Wins",
        value: signed(analysis.defenseWins.delta),
        inline: true
      },
      {
        name: "Donations",
        value:
          signed(analysis.donations.delta) +
          " given • " +
          signed(analysis.donationsReceived.delta) +
          " received",
        inline: true
      },
      {
        name: "Tracked Completion",
        value: completionText,
        inline: false
      },
      {
        name: "Upgrade Activity",
        value:
          analysis.upgrades.events +
          " upgrade event(s) • " +
          analysis.upgrades.levelsGained +
          " total level(s) gained",
        inline: false
      },
      {
        name: "Current Item State",
        value:
          analysis.itemCounts.maxed +
          "/" +
          analysis.itemCounts.tracked +
          " tracked items maxed",
        inline: true
      },
      {
        name: "Goals",
        value:
          analysis.goals.completed +
          " completed • " +
          analysis.goals.active +
          " active • " +
          analysis.goals.completionRate +
          "% completion",
        inline: true
      }
    )
    .setFooter({
      text:
        "Timeline: " +
        date(analysis.firstCapturedAt) +
        " → " +
        date(analysis.lastCapturedAt)
    });
}

function warAnalyticsEmbed(analysis, clanTag) {
  if (analysis.empty) {
    return new EmbedBuilder()
      .setColor(0x777777)
      .setTitle("⚔️ VØID WAR ANALYTICS")
      .setDescription(
        "No completed saved wars were found for " +
        clanTag +
        ". Save wars with /coc war-snapshot."
      );
  }

  return new EmbedBuilder()
    .setColor(0xef4444)
    .setTitle("⚔️ VØID WAR ANALYTICS")
    .setDescription(
      "**" +
        clanTag +
        "** • " +
        analysis.warsAnalyzed +
        " completed war(s)"
    )
    .addFields(
      {
        name: "Record",
        value:
          analysis.wins +
          "W • " +
          analysis.ties +
          "T • " +
          analysis.losses +
          "L",
        inline: true
      },
      {
        name: "Average Result",
        value:
          analysis.averageStars +
          "★/war • " +
          analysis.averageDestruction +
          "% dest",
        inline: true
      },
      {
        name: "Attack Usage",
        value:
          analysis.attackUsageRate === null
            ? "No possible-attack data"
            : analysis.attackUsageRate + "%",
        inline: true
      },
      {
        name: "Three-Star Rate",
        value:
          analysis.threeStarRate === null
            ? "No attack data"
            : analysis.threeStarRate + "%",
        inline: true
      },
      {
        name: "Total Attacks",
        value: String(analysis.attacksUsed),
        inline: true
      },
      {
        name: "Avg Attack Destruction",
        value: analysis.averageAttackDestruction + "%",
        inline: true
      },
      {
        name: "Recent Wars",
        value:
          analysis.recent
            .slice(0, 6)
            .map(
              (war) =>
                "**" +
                war.opponentName +
                "** — " +
                war.result +
                " • " +
                war.stars +
                "★/" +
                war.opponentStars +
                "★"
            )
            .join("\n") || "No recent records."
      }
    )
    .setFooter({
      text: "Historical war analytics use saved VØID war snapshots."
    });
}

function cwlAnalyticsEmbed(analysis, clanTag) {
  if (analysis.empty) {
    return new EmbedBuilder()
      .setColor(0x777777)
      .setTitle("🏆 VØID CWL ANALYTICS")
      .setDescription(
        "No saved CWL season history was found for " +
        clanTag +
        ". Save seasons with /coc cwl snapshot."
      );
  }

  return new EmbedBuilder()
    .setColor(0x60a5fa)
    .setTitle("🏆 VØID CWL ANALYTICS")
    .setDescription(
      "**" +
        clanTag +
        "** • " +
        analysis.seasonsAnalyzed +
        " saved season(s) • " +
        analysis.roundsAnalyzed +
        " fetched round(s)"
    )
    .addFields(
      {
        name: "Record",
        value:
          analysis.wins +
          "W • " +
          analysis.ties +
          "T • " +
          analysis.losses +
          "L",
        inline: true
      },
      {
        name: "Stars",
        value:
          analysis.totalStars +
          " total • " +
          analysis.averageStarsPerSeason +
          " per season",
        inline: true
      },
      {
        name: "Destruction",
        value:
          analysis.totalDestruction +
          " total • " +
          analysis.averageDestructionPerSeason +
          " per season",
        inline: true
      },
      {
        name: "Attacks",
        value: String(analysis.attacksUsed),
        inline: true
      },
      {
        name: "Three-Star Rate",
        value:
          analysis.threeStarRate === null
            ? "No attack data"
            : analysis.threeStarRate + "%",
        inline: true
      },
      {
        name: "Recent Seasons",
        value:
          analysis.recent
            .slice(0, 5)
            .map(
              (entry) =>
                "**Season " +
                entry.season +
                "** — " +
                entry.record +
                " • " +
                entry.stars +
                "★ • " +
                entry.threeStars +
                " 3★"
            )
            .join("\n") || "No recent seasons."
      }
    )
    .setFooter({
      text: "Historical CWL analytics use saved VØID CWL snapshots."
    });
}

function activityAnalyticsEmbed(analysis, clanTag) {
  const donation = analysis.donations;
  const capital = analysis.capital;
  const games = analysis.clanGames;

  return new EmbedBuilder()
    .setColor(0xf59e0b)
    .setTitle("📊 VØID ACTIVITY ANALYTICS")
    .setDescription("Historical activity for **" + clanTag + "**.")
    .addFields(
      {
        name: "Donations",
        value:
          donation.snapshotCount +
          " snapshot(s) • " +
          signed(donation.delta) +
          " donations change\n" +
          "Latest ratio: " +
          donation.latestRatio +
          "\nTop donor in latest snapshot: " +
          (donation.latestTopDonor || "—"),
        inline: false
      },
      {
        name: "Clan Capital",
        value:
          capital.seasons +
          " saved season(s) • " +
          capital.latestLoot +
          " latest loot\n" +
          "Loot change across saved seasons: " +
          signed(capital.lootDelta) +
          "\nLatest season: " +
          (capital.latestSeason || "—"),
        inline: false
      },
      {
        name: "Clan Games",
        value:
          games.seasons +
          " tracked season(s) • " +
          games.totalTrackedPoints +
          " total tracked points\n" +
          "Latest: " +
          (games.latest
            ? games.latest.season +
              " • " +
              games.latest.totalPoints +
              " points"
            : "—"),
        inline: false
      }
    )
    .setFooter({
      text: "Donation trends require periodic donation snapshots."
    });
}

function goalAnalyticsEmbed(analysis) {
  return new EmbedBuilder()
    .setColor(0xa78bfa)
    .setTitle("🎯 VØID GOAL ANALYTICS")
    .setDescription(
      analysis.total +
        " saved goal(s) • " +
        analysis.completed +
        " completed • " +
        analysis.active +
        " active"
    )
    .addFields(
      {
        name: "Completion Rate",
        value: analysis.completionRate + "%",
        inline: true
      },
      {
        name: "Latest Completion",
        value: date(analysis.latestCompletedAt),
        inline: true
      }
    )
    .setFooter({
      text: "Goal completion is recorded when a goal is marked completed."
    });
}

module.exports = {
  playerAnalyticsEmbed,
  warAnalyticsEmbed,
  cwlAnalyticsEmbed,
  activityAnalyticsEmbed,
  goalAnalyticsEmbed
};
