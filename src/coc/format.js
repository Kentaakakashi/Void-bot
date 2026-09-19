const { EmbedBuilder } = require("discord.js");

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function playerEmbed(player) {
  const heroes = (player.heroes || [])
    .map((hero) => hero.name + " — " + hero.level + "/" + hero.maxLevel)
    .join("\n") || "No hero data.";

  const pets = (player.pets || [])
    .map((pet) => pet.name + " — " + pet.level + "/" + pet.maxLevel)
    .join("\n") || "No pet data.";

  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("⚔️ " + player.name)
    .setDescription("Player tag: \`" + player.tag + "\`")
    .addFields(
      { name: "Town Hall", value: "TH " + player.townHallLevel, inline: true },
      { name: "Experience", value: formatNumber(player.expLevel), inline: true },
      { name: "Trophies", value: formatNumber(player.trophies), inline: true },
      { name: "Best Trophies", value: formatNumber(player.bestTrophies), inline: true },
      {
        name: "Clan",
        value: player.clan
          ? player.clan.name + " (" + player.clan.tag + ")"
          : "No clan",
        inline: true
      },
      { name: "War Stars", value: formatNumber(player.warStars), inline: true },
      { name: "Heroes", value: heroes, inline: false },
      { name: "Pets", value: pets, inline: false }
    )
    .setFooter({
      text: "VØID HELPER • Clash Intelligence"
    });
}

function clanEmbed(clan) {
  return new EmbedBuilder()
    .setColor(0x111318)
    .setTitle("🏰 " + clan.name)
    .setDescription("Clan tag: \`" + clan.tag + "\`")
    .addFields(
      { name: "Level", value: String(clan.clanLevel), inline: true },
      { name: "Members", value: String(clan.members) + "/50", inline: true },
      { name: "Trophies", value: formatNumber(clan.clanPoints), inline: true },
      { name: "War Wins", value: formatNumber(clan.warWins), inline: true },
      { name: "War Losses", value: formatNumber(clan.warLosses), inline: true },
      { name: "War Win Streak", value: formatNumber(clan.warWinStreak), inline: true }
    )
    .setFooter({
      text: "VØID HELPER • Clash Intelligence"
    });
}

function warEmbed(war, clanTag) {
  if (war.state === "notInWar") {
    return new EmbedBuilder()
      .setColor(0x777777)
      .setTitle("⚔️ CURRENT WAR")
      .setDescription("Clan " + clanTag + " is not currently in a war.");
  }

  const our = war.clan;
  const opponent = war.opponent;

  return new EmbedBuilder()
    .setColor(0xef4444)
    .setTitle("⚔️ CURRENT WAR")
    .setDescription("Status: **" + war.state + "**")
    .addFields(
      {
        name: our.name,
        value: "⭐ " + our.stars + " stars\n⚔️ " + our.attacks + " attacks",
        inline: true
      },
      {
        name: opponent.name,
        value: "⭐ " + opponent.stars + " stars\n⚔️ " + opponent.attacks + " attacks",
        inline: true
      }
    )
    .setFooter({
      text: "VØID HELPER • " + clanTag
    });
}

module.exports = {
  playerEmbed,
  clanEmbed,
  warEmbed
};