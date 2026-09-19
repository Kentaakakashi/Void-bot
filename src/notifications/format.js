const { EmbedBuilder } = require("discord.js");

function notificationEmbed(title, description, color = 0x111318) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: "VØID HELPER • Smart Notifications" })
    .setTimestamp();
}

function newWarEmbed(war) {
  return notificationEmbed(
    "⚔️ NEW WAR DETECTED",
    "**" + war.clanName + "** vs **" + war.opponentName + "**\nStatus: **" + war.state + "**",
    0x60a5fa
  );
}

function warStartedEmbed(war) {
  return notificationEmbed(
    "⚔️ WAR STARTED",
    "**" + war.clanName + "** vs **" + war.opponentName + "**\nBattle day is now active. VØID shall keep watch.",
    0xef4444
  );
}

function warEndedEmbed(war) {
  return notificationEmbed(
    "🏁 WAR ENDED",
    "**" + war.clanName + "** — " + war.totals.clanStars + "⭐ / " + war.totals.clanDestruction + "%\n" +
    "**" + war.opponentName + "** — " + war.totals.opponentStars + "⭐ / " + war.totals.opponentDestruction + "%",
    0x4ade80
  );
}

function missedAttacksEmbed(war) {
  return notificationEmbed(
    "⏰ UNUSED WAR ATTACKS",
    "There are **" + war.totals.attacksRemaining + "** unused attack(s) remaining with battle time running down.\n" +
    "Consider checking **/coc war-analyze**.",
    0xfacc15
  );
}

module.exports = {
  newWarEmbed,
  warStartedEmbed,
  warEndedEmbed,
  missedAttacksEmbed
};