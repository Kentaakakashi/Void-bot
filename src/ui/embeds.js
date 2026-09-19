const {
  EmbedBuilder
} = require("discord.js");

const COLORS = {
  void: 0x111318,
  success: 0x4ade80,
  warning: 0xfacc15,
  error: 0xef4444,
  info: 0x60a5fa
};

function baseEmbed(title, color = COLORS.void) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setFooter({
      text: "VØID HELPER • Personal Clash Intelligence"
    });
}

function successEmbed(title, description) {
  return baseEmbed(title, COLORS.success)
    .setDescription(description);
}

function errorEmbed(description) {
  return baseEmbed("⚠️ VØID ERROR", COLORS.error)
    .setDescription(description);
}

module.exports = {
  COLORS,
  baseEmbed,
  successEmbed,
  errorEmbed
};