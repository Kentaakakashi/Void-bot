const { EmbedBuilder } = require("discord.js");

function donationLines(members, limit = 10) {
  return members.slice(0, limit).map((member, index) =>
    (index + 1) + ". **" + member.name + "** — " +
    member.donations + " sent • " +
    member.donationsReceived + " received • " +
    member.ratio + "x"
  ).join("\n");
}

function donationsEmbed(analysis) {
  return new EmbedBuilder()
    .setColor(0x111318)
    .setTitle("📦 VØID DONATION INTELLIGENCE")
    .setDescription("**" + analysis.clanName + "** • " + analysis.memberCount + " members")
    .addFields(
      { name: "Total Sent", value: String(analysis.totals.donations), inline: true },
      { name: "Total Received", value: String(analysis.totals.donationsReceived), inline: true },
      { name: "Clan Ratio", value: String(analysis.totals.ratio) + "x", inline: true },
      { name: "Top Donors", value: donationLines(analysis.topDonors) || "No donation data." },
      { name: "Lowest Current Donations", value: donationLines(analysis.lowestDonors) || "No donation data." }
    )
    .setFooter({ text: "VØID HELPER • Donation Intelligence" });
}

function capitalEmbed(analysis) {
  const latest = analysis.latestSeason;

  return new EmbedBuilder()
    .setColor(0x111318)
    .setTitle("🏛️ VØID CLAN CAPITAL")
    .setDescription("**" + analysis.clanName + "** • Capital Hall " + (analysis.capitalHallLevel || "unknown"))
    .addFields(
      { name: "Capital League", value: analysis.capitalLeague?.name || String(analysis.capitalLeague?.id || "Unknown"), inline: true },
      { name: "Capital Points", value: String(analysis.clanCapitalPoints), inline: true },
      { name: "Latest Season", value: latest?.season || "Unknown", inline: true },
      { name: "Loot", value: latest?.loot == null ? "Unavailable" : String(latest.loot), inline: true },
      { name: "Raid Medals", value: latest?.raidMedals == null ? "Unavailable" : String(latest.raidMedals), inline: true },
      { name: "Attacks", value: latest?.attacks == null ? "Unavailable" : String(latest.attacks), inline: true },
      { name: "Districts Destroyed", value: latest?.districtsDestroyed == null ? "Unavailable" : String(latest.districtsDestroyed), inline: true },
      { name: "Recent Seasons", value: analysis.seasons.slice(0, 5).map((season) =>
        (season.season || "Unknown") + " — " +
        (season.loot == null ? "loot unavailable" : season.loot)
      ).join("\n") || "No season data." }
    )
    .setFooter({ text: "VØID HELPER • Clan Capital Intelligence" });
}

function clanGamesEmbed(season, scores) {
  const lines = scores.slice(0, 15).map((member, index) =>
    (index + 1) + ". **" + member.memberName + "** — " + member.points + " points"
  ).join("\n");

  return new EmbedBuilder()
    .setColor(0x111318)
    .setTitle("🎮 VØID CLAN GAMES")
    .setDescription("Tracked season: **" + season + "**")
    .addFields({
      name: "Leaderboard",
      value: lines || "No Clan Games points have been recorded."
    })
    .setFooter({ text: "Manual tracker • Clan Games points are not exposed by the public CoC API" });
}

function capitalHistoryEmbed(history) {
  const value = history.length
    ? history.slice(0, 10).map((entry, index) =>
        (index + 1) + ". **" + (entry.clanName || entry.clanTag || "Capital") + "** — " +
        (entry.latestSeason?.season || "Unknown") + " • " +
        (entry.latestSeason?.loot == null ? "loot unavailable" : entry.latestSeason.loot)
      ).join("\n")
    : "No saved Clan Capital intelligence exists yet.";

  return new EmbedBuilder()
    .setColor(0x111318)
    .setTitle("🗂️ VØID CAPITAL HISTORY")
    .setDescription(value);
}

module.exports = {
  donationsEmbed,
  capitalEmbed,
  clanGamesEmbed,
  capitalHistoryEmbed
};