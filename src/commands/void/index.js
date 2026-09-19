const {
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits
} = require("discord.js");

const config = require("../../config/config");

const {
  getGuildSettings,
  setAiChannel,
  disableAiChannel
} = require("../../database/repositories/settings");

const {
  errorEmbed,
  successEmbed,
  baseEmbed
} = require("../../ui/embeds");

const { generateReply } = require("../../ai/assistant");

const {
  clearConversation
} = require("../../database/repositories/conversations");

const {
  clearUserMemory,
  getUserMemory
} = require("../../database/repositories/memory");

const data = new SlashCommandBuilder()
  .setName("void")
  .setDescription("Configure and talk to VØID HELPER.")
  .addSubcommandGroup((group) =>
    group
      .setName("channel")
      .setDescription("Manage the VØID AI chat channel.")
      .addSubcommand((subcommand) =>
        subcommand
          .setName("set")
          .setDescription("Set the channel where VØID should respond.")
          .addChannelOption((option) =>
            option
              .setName("channel")
              .setDescription("The text channel VØID should monitor.")
              .addChannelTypes(ChannelType.GuildText)
              .setRequired(true)
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("show")
          .setDescription("Show the currently configured VØID channel.")
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("disable")
          .setDescription("Disable the VØID chat channel.")
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("status")
      .setDescription("Show VØID's current configuration.")
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("ask")
      .setDescription("Ask VØID a one-off question.")
      .addStringOption((option) =>
        option
          .setName("question")
          .setDescription("What would you like to ask?")
          .setRequired(true)
          .setMaxLength(1800)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("reset-chat")
      .setDescription("Clear your stored VØID conversation history.")
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("memory")
      .setDescription("Manage your simple VØID memory.")
      .addStringOption((option) =>
        option
          .setName("action")
          .setDescription("What should VØID do with your memory?")
          .setRequired(true)
          .addChoices(
            {
              name: "Show",
              value: "show"
            },
            {
              name: "Clear",
              value: "clear"
            }
          )
      )
  );

function requireAdmin(interaction) {
  if (
    !interaction.memberPermissions?.has(
      PermissionFlagsBits.Administrator
    )
  ) {
    throw new Error(
      "Only a server administrator can change VØID configuration."
    );
  }
}

async function execute(interaction) {
  const group =
    interaction.options.getSubcommandGroup(false);

  const subcommand =
    interaction.options.getSubcommand();

  if (group === "channel") {
    requireAdmin(interaction);

    if (subcommand === "set") {
      const channel = interaction.options.getChannel(
        "channel",
        true
      );

      await setAiChannel(
        interaction.guildId,
        channel.id
      );

      return interaction.reply({
        embeds: [
          successEmbed(
            "🤖 VØID CHANNEL CONFIGURED",
            `VØID will now respond to normal messages in ${channel}.`
          )
        ]
      });
    }

    if (subcommand === "show") {
      const settings = await getGuildSettings(
        interaction.guildId
      );

      return interaction.reply({
        embeds: [
          baseEmbed("🤖 VØID CHANNEL").setDescription(
            settings.aiChannelId
              ? `Current AI channel: <#${settings.aiChannelId}>`
              : "No AI channel is configured."
          )
        ]
      });
    }

    await disableAiChannel(interaction.guildId);

    return interaction.reply({
      embeds: [
        successEmbed(
          "🤖 VØID DISABLED",
          "The AI chat channel has been disabled."
        )
      ]
    });
  }

  if (subcommand === "status") {
    const settings = await getGuildSettings(
      interaction.guildId
    );

    return interaction.reply({
      embeds: [
        baseEmbed("🕳️ VØID STATUS")
          .addFields(
            {
              name: "AI Channel",
              value:
                settings.aiEnabled && settings.aiChannelId
                  ? `<#${settings.aiChannelId}>`
                  : "Disabled",
              inline: true
            },
            {
              name: "AI Model",
              value: config.openai.model,
              inline: true
            },
            {
              name: "Environment",
              value: config.app.environment,
              inline: true
            },
            {
              name: "CoC API",
              value: config.coc.apiToken
                ? "Configured"
                : "Not configured",
              inline: false
            }
          )
          .setDescription(
            "VØID foundation systems are online. Live Clash of Clans intelligence arrives in Phase 2."
          )
      ]
    });
  }

  if (subcommand === "ask") {
    const question = interaction.options.getString(
      "question",
      true
    );

    await interaction.deferReply();

    const fakeMessage = {
      guild: interaction.guild,
      author: interaction.user,
      content: question
    };

    const reply = await generateReply({
      message: fakeMessage
    });

    return interaction.editReply(reply.slice(0, 2000));
  }

  if (subcommand === "reset-chat") {
    await clearConversation(
      interaction.guildId,
      interaction.user.id
    );

    return interaction.reply({
      embeds: [
        successEmbed(
          "🧹 CHAT HISTORY CLEARED",
          "Your stored VØID conversation history has been cleared."
        )
      ]
    });
  }

  if (subcommand === "memory") {
    const action = interaction.options.getString(
      "action",
      true
    );

    if (action === "show") {
      const memory = await getUserMemory(
        interaction.guildId,
        interaction.user.id
      );

      const content =
        Object.keys(memory).length > 0
          ? JSON.stringify(memory, null, 2)
          : "No saved memory for you yet.";

      return interaction.reply({
        embeds: [
          baseEmbed("🧠 VØID MEMORY").setDescription(content)
        ]
      });
    }

    await clearUserMemory(
      interaction.guildId,
      interaction.user.id
    );

    return interaction.reply({
      embeds: [
        successEmbed(
          "🧠 MEMORY CLEARED",
          "Your stored VØID memory has been cleared."
        )
      ]
    });
  }

  return interaction.reply({
    embeds: [
      errorEmbed(
        "That VØID command is not implemented yet."
      )
    ]
  });
}

module.exports = {
  data,
  execute
};