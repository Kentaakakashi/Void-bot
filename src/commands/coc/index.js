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
  prioritiesEmbed,
  readinessEmbed,
  planEmbed,
  goalsEmbed,
  latestPlanEmbed
} = require("../../coc/formatPlanning");

const {
  buildPriorities,
  buildReadiness,
  buildPlan
} = require("../../coc/planner");

const {
  warAnalysisEmbed,
  warHistoryEmbed
} = require("../../coc/formatWar");

const {
  analyzeWar
} = require("../../coc/war");

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

const {
  createGoal,
  getGoals,
  removeGoal
} = require("../../database/repositories/goals");

const {
  savePlan,
  getLatestPlan
} = require("../../database/repositories/plans");

const {
  saveWar,
  getWarHistory
} = require("../../database/repositories/wars");

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
      .setName("priorities")
      .setDescription("Show VØID's upgrade priorities.")
      .addStringOption((option) =>
        option
          .setName("focus")
          .setDescription("Planning focus.")
          .setRequired(false)
          .addChoices(
            { name: "General", value: "general" },
            { name: "War", value: "war" },
            { name: "Trophy", value: "trophy" }
          )
      )
  )

  .addSubcommand((subcommand) =>
    subcommand
      .setName("readiness")
      .setDescription("Check Town Hall readiness from tracked progression data.")
  )

  .addSubcommand((subcommand) =>
    subcommand
      .setName("plan")
      .setDescription("Generate and save a progression plan.")
      .addStringOption((option) =>
        option
          .setName("focus")
          .setDescription("Planning focus.")
          .setRequired(true)
          .addChoices(
            { name: "General", value: "general" },
            { name: "War", value: "war" },
            { name: "Trophy", value: "trophy" }
          )
      )
  )

  .addSubcommand((subcommand) =>
    subcommand
      .setName("goals")
      .setDescription("List your active progression goals.")
  )

  .addSubcommand((subcommand) =>
    subcommand
      .setName("goal-add")
      .setDescription("Add a persistent progression goal.")
      .addStringOption((option) =>
        option
          .setName("name")
          .setDescription("Short goal name.")
          .setRequired(true)
          .setMaxLength(100)
      )
      .addStringOption((option) =>
        option
          .setName("description")
          .setDescription("Optional goal details.")
          .setRequired(false)
          .setMaxLength(500)
      )
      .addStringOption((option) =>
        option
          .setName("focus")
          .setDescription("Goal focus.")
          .setRequired(true)
          .addChoices(
            { name: "General", value: "general" },
            { name: "War", value: "war" },
            { name: "Trophy", value: "trophy" }
          )
      )
  )

  .addSubcommand((subcommand) =>
    subcommand
      .setName("goal-remove")
      .setDescription("Remove a persistent progression goal.")
      .addStringOption((option) =>
        option
          .setName("id")
          .setDescription("Goal ID from /coc goals.")
          .setRequired(true)
          .setMaxLength(100)
      )
  )

  .addSubcommand((subcommand) =>
    subcommand
      .setName("plan-latest")
      .setDescription("Show your latest saved progression plan.")
  )

  .addSubcommand((subcommand) =>
    subcommand
      .setName("war-analyze")
      .setDescription("Analyze the current war.")
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
      .setName("war-snapshot")
      .setDescription("Save the current war analysis.")
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
      .setName("war-history")
      .setDescription("Show saved war intelligence history.")
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

  if (subcommand === "priorities") {
    const player = await requirePlayer(interaction);
    const focus = interaction.options.getString("focus") || "general";
    return interaction.reply({
      embeds: [prioritiesEmbed(buildPriorities(player, focus))]
    });
  }

  if (subcommand === "readiness") {
    const player = await requirePlayer(interaction);
    return interaction.reply({
      embeds: [readinessEmbed(buildReadiness(player))]
    });
  }

  if (subcommand === "plan") {
    const player = await requirePlayer(interaction);
    const focus = interaction.options.getString("focus", true);
    const goals = await getGoals(interaction.guildId, interaction.user.id);
    const plan = buildPlan(player, focus, goals);
    const saved = await savePlan(
      interaction.guildId,
      interaction.user.id,
      plan
    );

    return interaction.reply({
      embeds: [planEmbed(saved)]
    });
  }

  if (subcommand === "goals") {
    const goals = await getGoals(
      interaction.guildId,
      interaction.user.id
    );

    return interaction.reply({
      embeds: [goalsEmbed(goals)]
    });
  }

  if (subcommand === "goal-add") {
    const goal = await createGoal(
      interaction.guildId,
      interaction.user.id,
      {
        name: interaction.options.getString("name", true),
        description: interaction.options.getString("description") || "",
        focus: interaction.options.getString("focus", true)
      }
    );

    return interaction.reply({
      embeds: [
        goalsEmbed([goal]).setTitle("🎯 VØID GOAL CREATED")
      ]
    });
  }

  if (subcommand === "goal-remove") {
    const goalId = interaction.options.getString("id", true);
    const removed = await removeGoal(
      interaction.guildId,
      interaction.user.id,
      goalId
    );

    if (!removed) {
      throw new Error("No goal was found with that ID.");
    }

    return interaction.reply("🎯 Goal " + goalId + " removed.");
  }

  if (subcommand === "plan-latest") {
    const plan = await getLatestPlan(
      interaction.guildId,
      interaction.user.id
    );

    return interaction.reply({
      embeds: [latestPlanEmbed(plan)]
    });
  }

  if (subcommand === "war-analyze") {
    const tag = normalizeTag(
      interaction.options.getString("tag", true)
    );
    const war = await getCurrentWar(tag);
    const analysis = analyzeWar(war, tag);

    return interaction.reply({
      embeds: [warAnalysisEmbed(analysis)]
    });
  }

  if (subcommand === "war-snapshot") {
    const tag = normalizeTag(
      interaction.options.getString("tag", true)
    );
    const war = await getCurrentWar(tag);
    const analysis = analyzeWar(war, tag);

    if (analysis.state === "notInWar") {
      return interaction.reply({
        embeds: [warAnalysisEmbed(analysis)]
      });
    }

    const saved = await saveWar(
      interaction.guildId,
      analysis
    );

    return interaction.reply(
      "War intelligence snapshot saved as " +
        saved.id +
        "."
    );
  }

  if (subcommand === "war-history") {
    const tag = normalizeTag(
      interaction.options.getString("tag", true)
    );
    const history = await getWarHistory(
      interaction.guildId,
      tag,
      10
    );

    return interaction.reply({
      embeds: [warHistoryEmbed(history)]
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