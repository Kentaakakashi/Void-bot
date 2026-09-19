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
  getNotificationSettings,
  setNotificationSettings,
  disableNotifications
} = require("../../database/repositories/notifications");

const { errorEmbed, successEmbed, baseEmbed } = require("../../ui/embeds");
const { generateReply } = require("../../ai/assistant");
const { clearConversation } = require("../../database/repositories/conversations");
const { clearUserMemory, getUserMemory } = require("../../database/repositories/memory");
const { splitMessage } = require("../../utils/format");

function notificationChoices() {
  return [
    { name: "Enabled", value: true },
    { name: "Disabled", value: false }
  ];
}

const data = new SlashCommandBuilder()
  .setName("void")
  .setDescription("Configure and talk to VØID HELPER.")
  .addSubcommandGroup((group) =>
    group
      .setName("channel")
      .setDescription("Manage the VØID AI chat channel.")
      .addSubcommand((subcommand) =>
        subcommand.setName("set").setDescription("Set the channel where VØID should respond.")
          .addChannelOption((option) =>
            option.setName("channel").setDescription("The text channel VØID should monitor.").addChannelTypes(ChannelType.GuildText).setRequired(true)
          )
      )
      .addSubcommand((subcommand) => subcommand.setName("show").setDescription("Show the configured VØID channel."))
      .addSubcommand((subcommand) => subcommand.setName("disable").setDescription("Disable the VØID chat channel."))
  )
  .addSubcommandGroup((group) =>
    group
      .setName("notifications")
      .setDescription("Configure smart Clash of Clans notifications.")
      .addSubcommand((subcommand) =>
        subcommand.setName("set").setDescription("Configure smart notifications.")
          .addChannelOption((option) => option.setName("channel").setDescription("Notification channel.").addChannelTypes(ChannelType.GuildText).setRequired(true))
          .addStringOption((option) => option.setName("clan_tag").setDescription("Clan tag to monitor.").setRequired(true).setMaxLength(20))
          .addBooleanOption((option) => option.setName("war_start").setDescription("Notify when battle day starts.").setRequired(false))
          .addBooleanOption((option) => option.setName("war_end").setDescription("Notify when a war ends.").setRequired(false))
          .addBooleanOption((option) => option.setName("missed_attacks").setDescription("Notify about unused attacks near war end.").setRequired(false))
      )
      .addSubcommand((subcommand) => subcommand.setName("show").setDescription("Show smart notification configuration."))
      .addSubcommand((subcommand) => subcommand.setName("disable").setDescription("Disable smart notifications."))
  )
  .addSubcommand((subcommand) => subcommand.setName("status").setDescription("Show VØID current configuration."))
  .addSubcommand((subcommand) =>
    subcommand.setName("ask").setDescription("Ask VØID a one-off question.")
      .addStringOption((option) => option.setName("question").setDescription("What would you like to ask?").setRequired(true).setMaxLength(1800))
  )
  .addSubcommand((subcommand) => subcommand.setName("reset-chat").setDescription("Clear your stored VØID conversation history."))
  .addSubcommand((subcommand) =>
    subcommand.setName("memory").setDescription("Manage your simple VØID memory.")
      .addStringOption((option) => option.setName("action").setDescription("Memory action.").setRequired(true).addChoices({ name: "Show", value: "show" }, { name: "Clear", value: "clear" }))
  );

function requireAdmin(interaction) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    throw new Error("Only a server administrator can change VØID configuration.");
  }
}

async function execute(interaction) {
  const group = interaction.options.getSubcommandGroup(false);
  const subcommand = interaction.options.getSubcommand();

  await interaction.deferReply();

  if (group === "channel") {
    requireAdmin(interaction);

    if (subcommand === "set") {
      const channel = interaction.options.getChannel("channel", true);
      await setAiChannel(interaction.guildId, channel.id);
      return interaction.editReply({ embeds: [successEmbed("🤖 VØID CHANNEL CONFIGURED", `VØID will now respond to normal messages in ${channel}.`)] });
    }

    if (subcommand === "show") {
      const settings = await getGuildSettings(interaction.guildId);
      return interaction.editReply({ embeds: [baseEmbed("🤖 VØID CHANNEL").setDescription(settings.aiChannelId ? `Current AI channel: <#${settings.aiChannelId}>` : "No AI channel is configured.")] });
    }

    await disableAiChannel(interaction.guildId);
    return interaction.editReply({ embeds: [successEmbed("🤖 VØID DISABLED", "The AI chat channel has been disabled.")] });
  }

  if (group === "notifications") {
    requireAdmin(interaction);

    if (subcommand === "set") {
      const channel = interaction.options.getChannel("channel", true);
      const clanTag = interaction.options.getString("clan_tag", true).trim().toUpperCase();
      if (!clanTag.startsWith("#")) throw new Error("A Clash of Clans clan tag must start with #.");
      const settings = await setNotificationSettings(interaction.guildId, {
        enabled: true,
        channelId: channel.id,
        clanTag,
        events: {
          warStart: interaction.options.getBoolean("war_start") ?? true,
          warEnd: interaction.options.getBoolean("war_end") ?? true,
          missedAttacks: interaction.options.getBoolean("missed_attacks") ?? true
        }
      });
      return interaction.editReply({
        embeds: [successEmbed("🔔 SMART NOTIFICATIONS CONFIGURED", `Monitoring **${settings.clanTag}** in ${channel}.`)]
      });
    }

    if (subcommand === "show") {
      const settings = await getNotificationSettings(interaction.guildId);
      return interaction.editReply({
        embeds: [baseEmbed("🔔 VØID NOTIFICATIONS").setDescription(settings.enabled ? `Enabled\nChannel: <#${settings.channelId}>\nClan: ${settings.clanTag}` : "Smart notifications are disabled." )]});
    }

    await disableNotifications(interaction.guildId);
    return interaction.editReply({ embeds: [successEmbed("🔕 SMART NOTIFICATIONS DISABLED", "VØID will stop sending proactive Clash notifications.")] });
  }

  if (subcommand === "status") {
    const settings = await getGuildSettings(interaction.guildId);
    const notifications = await getNotificationSettings(interaction.guildId);
    return interaction.editReply({
      embeds: [baseEmbed("🕳️ VØID STATUS").addFields(
        { name: "AI Channel", value: settings.aiEnabled && settings.aiChannelId ? `<#${settings.aiChannelId}>` : "Disabled", inline: true },
        { name: "AI Model", value: config.openai.model, inline: true },
        { name: "Environment", value: config.app.environment, inline: true },
        { name: "CoC API", value: config.coc.apiToken ? "Configured" : "Not configured", inline: true },
        { name: "Notifications", value: notifications.enabled ? "Enabled" : "Disabled", inline: true }
      ).setDescription("VØID foundation, Clash intelligence, planning, war, CWL, and activity systems are available.")]
    });
  }

  if (subcommand === "ask") {
    const question = interaction.options.getString("question", true);
    const fakeMessage = { guild: interaction.guild, author: interaction.user, content: question };
    const reply = await generateReply({ message: fakeMessage });
    const chunks = splitMessage(reply);
    if (!chunks.length) return interaction.editReply("The AI returned an empty response.");
    await interaction.editReply(chunks[0]);
    for (const chunk of chunks.slice(1)) await interaction.followUp({ content: chunk, ephemeral: false });
    return;
  }

  if (subcommand === "reset-chat") {
    await clearConversation(interaction.guildId, interaction.user.id);
    return interaction.editReply({ embeds: [successEmbed("🧹 CHAT HISTORY CLEARED", "Your stored VØID conversation history has been cleared.")] });
  }

  if (subcommand === "memory") {
    const action = interaction.options.getString("action", true);
    if (action === "show") {
      const memory = await getUserMemory(interaction.guildId, interaction.user.id);
      const content = Object.keys(memory).length ? JSON.stringify(memory, null, 2) : "No saved memory for you yet.";
      return interaction.editReply({ embeds: [baseEmbed("🧠 VØID MEMORY").setDescription(content.slice(0, 3800))] });
    }
    await clearUserMemory(interaction.guildId, interaction.user.id);
    return interaction.editReply({ embeds: [successEmbed("🧠 MEMORY CLEARED", "Your stored VØID memory has been cleared.")] });
  }

  return interaction.editReply({ embeds: [errorEmbed("That VØID command is not implemented yet.")] });
}

module.exports = { data, execute };