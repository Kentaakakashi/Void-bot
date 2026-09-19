const { SlashCommandBuilder } = require("discord.js");

const {
  getPlayer,
  getClan,
  getCurrentWar
} = require("../../coc/api");

const {
  playerEmbed,
  clanEmbed,
  warEmbed
} = require("../../coc/format");

const {
  progressEmbed,
  snapshotDiffEmbed
} = require("../../coc/formatProgress");

const {
  saveSnapshot,
  getSnapshots,
  compareSnapshots
} = require("../../database/repositories/progression");

const {
  getLinkedAccount,
  linkAccount,
  unlinkAccount
} = require("../../database/repositories/cocAccounts");

function normalizeTag(value) {
  const tag = String(value || "").trim().toUpperCase();

  if (!tag.startsWith("#")) {
    throw new Error("A Clash of Clans tag must start with #.");
  }

  return tag;
}

const data = new SlashCommandBuilder()
  .setName("coc")
  .setDescription("Clash of Clans account intelligence.")

  .addSubcommandGroup((group) =>
    group
      .setName("account")
      .setDescription("Manage your linked Clash of Clans account.")

      .addSubcommand((subcommand) =>
        subcommand
          .setName("link")
          .setDescription("Link your Clash of Clans player tag.")
          .addStringOption((option) =>
            option
              .setName("tag")
              .setDescription("Your player tag, for example #ABC123.")
              .setRequired(true)
              .setMaxLength(20)
          )
      )

      .addSubcommand((subcommand) =>
        subcommand
          .setName("show")
          .setDescription("Show your linked Clash of Clans account.")
      )

      .addSubcommand((subcommand) =>
        subcommand
          .setName("unlink")
          .setDescription("Remove your linked Clash of Clans account.")
      )
  )

  .addSubcommand((subcommand) =>
    subcommand
      .setName("profile")
      .setDescription("Show a Clash of Clans player profile.")
      .addStringOption((option) =>
        option
          .setName("tag")
          .setDescription("Player tag. Leave empty to use your linked account.")
          .setRequired(false)
          .setMaxLength(20)
      )
  )

  .addSubcommand((subcommand) =>
    subcommand
      .setName("clan")
      .setDescription("Show a Clash of Clans clan profile.")
      .addStringOption((option) =>
        option
          .setName("tag")
          .setDescription("Clan tag.")
          .setRequired(true)
          .setMaxLength(20)
      )
  )

  .addSubcommand((subcommand) =>
    subcommand
      .setName("progress")
      .setDescription("Show progression intelligence for your linked account.")
  )

  .addSubcommand((subcommand) =>
    subcommand
      .setName("snapshot")
      .setDescription("Capture your current account progression.")
  )

  .addSubcommand((subcommand) =>
    subcommand
      .setName("history")
      .setDescription("Compare your latest progression snapshots.")
  )

  .addSubcommand((subcommand) =>
    subcommand
      .setName("war")
      .setDescription("Show the current war for a clan.")
      .addStringOption((option) =>
        option
          .setName("tag")
          .setDescription("Clan tag.")
          .setRequired(true)
          .setMaxLength(20)
      )
  );

async function execute(interaction) {
  const group = interaction.options.getSubcommandGroup(false);
  const subcommand = interaction.options.getSubcommand();

  if (group === "account") {
    if (subcommand === "link") {
      const tag = normalizeTag(
        interaction.options.getString("tag", true)
      );

      const player = await getPlayer(tag);

      await linkAccount(
        interaction.guildId,
        interaction.user.id,
        player.tag
      );

      return interaction.reply({
        embeds: [
          playerEmbed(player)
            .setTitle("🔗 ACCOUNT LINKED")
            .setDescription(
              "VØID will use **" +
                player.name +
                "** (" +
                player.tag +
                ") as your linked account."
            )
        ]
      });
    }

    if (subcommand === "show") {
      const account = await getLinkedAccount(
        interaction.guildId,
        interaction.user.id
      );

      if (!account) {
        return interaction.reply(
          "You do not have a Clash of Clans account linked yet."
        );
      }

      const player = await getPlayer(account.playerTag);

      return interaction.reply({
        embeds: [playerEmbed(player)]
      });
    }

    await unlinkAccount(
      interaction.guildId,
      interaction.user.id
    );

    return interaction.reply(
      "Your linked Clash of Clans account has been removed."
    );
  }

  if (subcommand === "profile") {
    let tag = interaction.options.getString("tag");

    if (!tag) {
      const account = await getLinkedAccount(
        interaction.guildId,
        interaction.user.id
      );

      if (!account) {
        throw new Error(
          "No linked account found. Use /coc account link or provide a player tag."
        );
      }

      tag = account.playerTag;
    }

    const player = await getPlayer(normalizeTag(tag));

    return interaction.reply({
      embeds: [playerEmbed(player)]
    });
  }

  if (subcommand === "progress") {
    const account = await getLinkedAccount(
      interaction.guildId,
      interaction.user.id
    );

    if (!account) {
      throw new Error(
        "No linked account found. Use /coc account link first."
      );
    }

    const player = await getPlayer(account.playerTag);

    return interaction.reply({
      embeds: [progressEmbed(player)]
    });
  }

  if (subcommand === "snapshot") {
    const account = await getLinkedAccount(
      interaction.guildId,
      interaction.user.id
    );

    if (!account) {
      throw new Error(
        "No linked account found. Use /coc account link first."
      );
    }

    const player = await getPlayer(account.playerTag);
    await saveSnapshot(
      interaction.guildId,
      interaction.user.id,
      player
    );

    return interaction.reply(
      "📸 Progression snapshot captured. I shall remember how things looked."
    );
  }

  if (subcommand === "history") {
    const snapshots = await getSnapshots(
      interaction.guildId,
      interaction.user.id,
      2
    );

    if (snapshots.length < 2) {
      return interaction.reply(
        "I need at least two snapshots before I can compare progression."
      );
    }

    const current = snapshots[0];
    const previous = snapshots[1];
    const comparison = compareSnapshots(previous, current);

    return interaction.reply({
      embeds: [
        snapshotDiffEmbed(
          previous,
          current,
          comparison
        )
      ]
    });
  }

  if (subcommand === "clan") {
    const clan = await getClan(
      normalizeTag(
        interaction.options.getString("tag", true)
      )
    );

    return interaction.reply({
      embeds: [clanEmbed(clan)]
    });
  }

  if (subcommand === "war") {
    const tag = normalizeTag(
      interaction.options.getString("tag", true)
    );

    const war = await getCurrentWar(tag);

    return interaction.reply({
      embeds: [warEmbed(war, tag)]
    });
  }
}

module.exports = {
  data,
  execute
};