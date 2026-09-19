const {
  getGuildSettings
} = require("../database/repositories/settings");

const {
  generateReply
} = require("../ai/assistant");

const {
  splitMessage
} = require("../utils/format");

const {
  isImageAttachment
} = require("../utils/validation");

const {
  publicErrorMessage
} = require("../utils/errors");

const logger = require("../utils/logger");

const cooldowns = new Map();
const COOLDOWN_MS = 2000;

function collectImageUrls(message) {
  return message.attachments
    .filter((attachment) => isImageAttachment(attachment))
    .map((attachment) => attachment.url)
    .slice(0, 4);
}

module.exports = {
  name: "messageCreate",

  async execute(message) {
    if (!message.guild || message.author.bot) {
      return;
    }

    let settings;

    try {
      settings = await getGuildSettings(message.guild.id);
    } catch (error) {
      logger.error("Failed to load guild AI settings.", error);
      return;
    }

    if (
      !settings.aiEnabled ||
      settings.aiChannelId !== message.channel.id
    ) {
      return;
    }

    const now = Date.now();
    const cooldownKey = message.guild.id + ":" + message.author.id;
    const last = cooldowns.get(cooldownKey) || 0;

    if (now - last < COOLDOWN_MS) {
      return;
    }

    const imageUrls = collectImageUrls(message);

    if (!message.content?.trim() && imageUrls.length === 0) {
      return;
    }

    cooldowns.set(cooldownKey, now);

    try {
      await message.channel.sendTyping();

      const reply = await generateReply({
        message,
        imageUrls
      });

      for (const chunk of splitMessage(reply)) {
        await message.reply({
          content: chunk,
          allowedMentions: {
            repliedUser: false
          }
        });
      }
    } catch (error) {
      logger.error("AI channel response failed.", error);

      await message.reply({
        content: publicErrorMessage(error),
        allowedMentions: {
          repliedUser: false
        }
      }).catch(() => null);
    }
  }
};