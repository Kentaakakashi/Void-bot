const {
  Events
} = require("discord.js");

const {
  publicErrorMessage
} = require("../utils/errors");

const logger = require("../utils/logger");

module.exports = {
  name: Events.InteractionCreate,

  async execute(interaction) {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    const command = interaction.client.commands.get(
      interaction.commandName
    );

    if (!command) {
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      logger.error(
        "Command execution failed.",
        {
          command: interaction.commandName,
          guildId: interaction.guildId,
          userId: interaction.user?.id,
          error: error?.stack || error?.message || String(error)
        }
      );

      const response = {
        content: publicErrorMessage(error),
        ephemeral: true
      };

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(response).catch(() => null);
      } else {
        await interaction.reply(response).catch(() => null);
      }
    }
  }
};