const { SlashCommandBuilder } = require("discord.js");

const {
  getPlayer,
  getClan,
  getClanMembers,
  getCapitalRaidSeasons,
  getCurrentWar,
  getCurrentCwlGroup,
  getCwlWar
} = require("../../coc/api");

const { playerEmbed, clanEmbed, warEmbed } = require("../../coc/format");
const { progressEmbed, snapshotDiffEmbed } = require("../../coc/formatProgress");
const { prioritiesEmbed, readinessEmbed, planEmbed, goalsEmbed, latestPlanEmbed } = require("../../coc/formatPlanning");
const { warAnalysisEmbed, warHistoryEmbed } = require("../../coc/formatWar");
const { cwlOverviewEmbed, cwlAnalysisEmbed, cwlHistoryEmbed } = require("../../coc/formatCwl");
const { donationsEmbed, capitalEmbed, clanGamesEmbed, capitalHistoryEmbed } = require("../../coc/formatActivity");
const {
  playerAnalyticsEmbed,
  warAnalyticsEmbed,
  cwlAnalyticsEmbed,
  activityAnalyticsEmbed,
  goalAnalyticsEmbed
} = require("../../coc/formatAnalytics");
const { buildPriorities, buildReadiness, buildPlan } = require("../../coc/planner");
const { analyzeWar } = require("../../coc/war");
const { analyzeDonations, analyzeCapital, normalizeClanTag } = require("../../coc/clanActivity");
const { getCwlAnalysis } = require("../../coc/cwl");

const { saveSnapshot, getSnapshots, compareSnapshots } = require("../../database/repositories/progression");
const { getLinkedAccount, linkAccount, unlinkAccount } = require("../../database/repositories/cocAccounts");
const {
  createGoal,
  getGoals,
  removeGoal,
  updateGoal
} = require("../../database/repositories/goals");
const { savePlan, getLatestPlan } = require("../../database/repositories/plans");
const { saveWar, getWarHistory } = require("../../database/repositories/wars");
const { saveCwl, getCwlHistory } = require("../../database/repositories/cwl");
const { saveCapital, getCapitalHistory } = require("../../database/repositories/capital");
const {
  setScore,
  getScores,
  getSeasonHistory,
  removeScore
} = require("../../database/repositories/clanGames");
const {
  saveDonation,
  getDonationHistory
} = require("../../database/repositories/donations");

function normalizeTag(value) {
  const tag = String(value || "").trim().toUpperCase();

  if (!tag.startsWith("#")) {
    throw new Error("A Clash of Clans tag must start with #.");
  }

  return tag;
}

async function requirePlayer(interaction) {
  const account = await getLinkedAccount(interaction.guildId, interaction.user.id);

  if (!account) {
    throw new Error("No linked account found. Use /coc account link first.");
  }

  return getPlayer(account.playerTag);
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
            option.setName("tag").setDescription("Player tag including #.").setRequired(true).setMaxLength(20)
          )
      )
      .addSubcommand((subcommand) =>
        subcommand.setName("show").setDescription("Show your linked account.")
      )
      .addSubcommand((subcommand) =>
        subcommand.setName("unlink").setDescription("Remove your linked account.")
      )
  )

  .addSubcommand((subcommand) =>
    subcommand.setName("profile").setDescription("Show a Clash of Clans player profile.")
      .addStringOption((option) =>
        option.setName("tag").setDescription("Player tag. Leave empty to use your linked account.").setRequired(false).setMaxLength(20)
      )
  )

  .addSubcommand((subcommand) =>
    subcommand.setName("clan").setDescription("Show a Clash of Clans clan profile.")
      .addStringOption((option) =>
        option.setName("tag").setDescription("Clan tag.").setRequired(true).setMaxLength(20)
      )
  )

  .addSubcommand((subcommand) =>
    subcommand.setName("progress").setDescription("Show progression intelligence for your linked account.")
  )

  .addSubcommandGroup((group) =>
    group
      .setName("planning")
      .setDescription("Plan and track account progression.")
      .addSubcommand((subcommand) =>
        subcommand.setName("priorities").setDescription("Show VØID upgrade priorities.")
          .addStringOption((option) =>
            option.setName("focus").setDescription("Planning focus.").setRequired(false)
              .addChoices({ name: "General", value: "general" }, { name: "War", value: "war" }, { name: "Trophy", value: "trophy" })
          )
      )
      .addSubcommand((subcommand) =>
        subcommand.setName("readiness").setDescription("Check tracked Town Hall readiness.")
      )
      .addSubcommand((subcommand) =>
        subcommand.setName("plan").setDescription("Generate and save a progression plan.")
          .addStringOption((option) =>
            option.setName("focus").setDescription("Planning focus.").setRequired(true)
              .addChoices({ name: "General", value: "general" }, { name: "War", value: "war" }, { name: "Trophy", value: "trophy" })
          )
      )
      .addSubcommand((subcommand) => subcommand.setName("goals").setDescription("List active progression goals."))
      .addSubcommand((subcommand) =>
        subcommand.setName("goal-add").setDescription("Add a persistent progression goal.")
          .addStringOption((option) => option.setName("name").setDescription("Short goal name.").setRequired(true).setMaxLength(100))
          .addStringOption((option) => option.setName("focus").setDescription("Goal focus.").setRequired(true)
            .addChoices({ name: "General", value: "general" }, { name: "War", value: "war" }, { name: "Trophy", value: "trophy" }))
          .addStringOption((option) => option.setName("description").setDescription("Optional goal details.").setRequired(false).setMaxLength(500))
      )
      .addSubcommand((subcommand) =>
        subcommand.setName("goal-remove").setDescription("Remove a persistent progression goal.")
          .addStringOption((option) => option.setName("id").setDescription("Goal ID from /coc planning goals.").setRequired(true).setMaxLength(100))
      )
      .addSubcommand((subcommand) =>
        subcommand.setName("goal-complete").setDescription("Mark a progression goal as completed.")
          .addStringOption((option) => option.setName("id").setDescription("Goal ID from /coc planning goals.").setRequired(true).setMaxLength(100))
      )
      .addSubcommand((subcommand) => subcommand.setName("plan-latest").setDescription("Show the latest saved progression plan."))
  )

  .addSubcommandGroup((group) =>
    group
      .setName("activity")
      .setDescription("Clan Capital, donations, and Clan Games.")
      .addSubcommand((subcommand) =>
        subcommand.setName("donations").setDescription("Show current clan donation intelligence.")
          .addStringOption((option) => option.setName("tag").setDescription("Clan tag.").setRequired(true).setMaxLength(20))
      )
      .addSubcommand((subcommand) =>
        subcommand.setName("donation-snapshot").setDescription("Save the current clan donation intelligence.")
          .addStringOption((option) => option.setName("tag").setDescription("Clan tag.").setRequired(true).setMaxLength(20))
      )
      .addSubcommand((subcommand) =>
        subcommand.setName("capital").setDescription("Show Clan Capital intelligence.")
          .addStringOption((option) => option.setName("tag").setDescription("Clan tag.").setRequired(true).setMaxLength(20))
      )
      .addSubcommand((subcommand) =>
        subcommand.setName("capital-snapshot").setDescription("Save the current Clan Capital analysis.")
          .addStringOption((option) => option.setName("tag").setDescription("Clan tag.").setRequired(true).setMaxLength(20))
      )
      .addSubcommand((subcommand) =>
        subcommand.setName("capital-history").setDescription("Show saved Clan Capital history.")
          .addStringOption((option) => option.setName("tag").setDescription("Clan tag.").setRequired(true).setMaxLength(20))
      )
      .addSubcommand((subcommand) =>
        subcommand.setName("clan-games").setDescription("Show the tracked Clan Games leaderboard.")
          .addStringOption((option) => option.setName("season").setDescription("Clan Games season identifier.").setRequired(true).setMaxLength(80))
      )
      .addSubcommand((subcommand) =>
        subcommand.setName("clan-games-set").setDescription("Set your tracked Clan Games points.")
          .addStringOption((option) => option.setName("season").setDescription("Clan Games season identifier.").setRequired(true).setMaxLength(80))
          .addIntegerOption((option) => option.setName("points").setDescription("Your current points.").setRequired(true).setMinValue(0))
      )
      .addSubcommand((subcommand) =>
        subcommand.setName("clan-games-remove").setDescription("Remove your tracked Clan Games score.")
          .addStringOption((option) => option.setName("season").setDescription("Clan Games season identifier.").setRequired(true).setMaxLength(80))
      )
  )

  .addSubcommandGroup((group) =>
    group
      .setName("cwl")
      .setDescription("Clan War League intelligence.")
      .addSubcommand((subcommand) =>
        subcommand.setName("overview").setDescription("Show current CWL group intelligence.")
          .addStringOption((option) => option.setName("tag").setDescription("Clan tag.").setRequired(true).setMaxLength(20))
      )
      .addSubcommand((subcommand) =>
        subcommand.setName("analyze").setDescription("Analyze the current CWL season.")
          .addStringOption((option) => option.setName("tag").setDescription("Clan tag.").setRequired(true).setMaxLength(20))
      )
      .addSubcommand((subcommand) =>
        subcommand.setName("snapshot").setDescription("Save the current CWL analysis.")
          .addStringOption((option) => option.setName("tag").setDescription("Clan tag.").setRequired(true).setMaxLength(20))
      )
      .addSubcommand((subcommand) =>
        subcommand.setName("history").setDescription("Show saved CWL season history.")
          .addStringOption((option) => option.setName("tag").setDescription("Clan tag.").setRequired(true).setMaxLength(20))
      )
  )


  .addSubcommandGroup((group) =>
    group
      .setName("analytics")
      .setDescription("Historical Clash of Clans analytics.")
      .addSubcommand((subcommand) =>
        subcommand.setName("player").setDescription("Analyze your saved account progression timeline.")
      )
      .addSubcommand((subcommand) =>
        subcommand.setName("war").setDescription("Analyze saved classic war performance.")
          .addStringOption((option) => option.setName("tag").setDescription("Clan tag.").setRequired(true).setMaxLength(20))
      )
      .addSubcommand((subcommand) =>
        subcommand.setName("cwl").setDescription("Analyze saved CWL season performance.")
          .addStringOption((option) => option.setName("tag").setDescription("Clan tag.").setRequired(true).setMaxLength(20))
      )
      .addSubcommand((subcommand) =>
        subcommand.setName("activity").setDescription("Analyze saved clan activity trends.")
          .addStringOption((option) => option.setName("tag").setDescription("Clan tag.").setRequired(true).setMaxLength(20))
      )
      .addSubcommand((subcommand) =>
        subcommand.setName("goals").setDescription("Analyze goal completion history.")
      )
  )

  .addSubcommand((subcommand) =>
    subcommand.setName("war").setDescription("Show the current classic war.")
      .addStringOption((option) => option.setName("tag").setDescription("Clan tag.").setRequired(true).setMaxLength(20))
  )

  .addSubcommand((subcommand) =>
    subcommand.setName("war-analyze").setDescription("Analyze the current classic war.")
      .addStringOption((option) => option.setName("tag").setDescription("Clan tag.").setRequired(true).setMaxLength(20))
  )

  .addSubcommand((subcommand) =>
    subcommand.setName("war-snapshot").setDescription("Save the current war analysis.")
      .addStringOption((option) => option.setName("tag").setDescription("Clan tag.").setRequired(true).setMaxLength(20))
  )

  .addSubcommand((subcommand) =>
    subcommand.setName("war-history").setDescription("Show saved war intelligence history.")
      .addStringOption((option) => option.setName("tag").setDescription("Clan tag.").setRequired(true).setMaxLength(20))
  )

  .addSubcommand((subcommand) => subcommand.setName("snapshot").setDescription("Capture your current account progression."))
  .addSubcommand((subcommand) => subcommand.setName("history").setDescription("Compare your latest progression snapshots."));

async function execute(interaction) {
  const group = interaction.options.getSubcommandGroup(false);
  const subcommand = interaction.options.getSubcommand();

  await interaction.deferReply();

  if (group === "account") {
    if (subcommand === "link") {
      const tag = normalizeTag(interaction.options.getString("tag", true));
      const player = await getPlayer(tag);
      await linkAccount(interaction.guildId, interaction.user.id, player.tag);
      return interaction.editReply({
        embeds: [playerEmbed(player).setTitle("🔗 ACCOUNT LINKED").setDescription("VØID will use **" + player.name + "** (" + player.tag + ") as your linked account.")]
      });
    }

    if (subcommand === "show") {
      const account = await getLinkedAccount(interaction.guildId, interaction.user.id);
      if (!account) return interaction.editReply("You do not have a Clash of Clans account linked yet.");
      const player = await getPlayer(account.playerTag);
      return interaction.editReply({ embeds: [playerEmbed(player)] });
    }

    await unlinkAccount(interaction.guildId, interaction.user.id);
    return interaction.editReply("Your linked Clash of Clans account has been removed.");
  }

  if (group === "planning") {
    if (subcommand === "priorities") {
      const player = await requirePlayer(interaction);
      const focus = interaction.options.getString("focus") || "general";
      return interaction.editReply({ embeds: [prioritiesEmbed(buildPriorities(player, focus))] });
    }

    if (subcommand === "readiness") {
      const player = await requirePlayer(interaction);
      return interaction.editReply({ embeds: [readinessEmbed(buildReadiness(player))] });
    }

    if (subcommand === "plan") {
      const player = await requirePlayer(interaction);
      const focus = interaction.options.getString("focus", true);
      const goals = await getGoals(interaction.guildId, interaction.user.id);
      const plan = buildPlan(player, focus, goals);
      const saved = await savePlan(interaction.guildId, interaction.user.id, plan);
      return interaction.editReply({ embeds: [planEmbed(saved)] });
    }

    if (subcommand === "goals") {
      const goals = await getGoals(interaction.guildId, interaction.user.id);
      return interaction.editReply({ embeds: [goalsEmbed(goals)] });
    }

    if (subcommand === "goal-add") {
      const goal = await createGoal(interaction.guildId, interaction.user.id, {
        name: interaction.options.getString("name", true),
        description: interaction.options.getString("description") || "",
        focus: interaction.options.getString("focus", true)
      });
      return interaction.editReply({ embeds: [goalsEmbed([goal]).setTitle("🎯 VØID GOAL CREATED")] });
    }

    if (subcommand === "goal-remove") {
      const goalId = interaction.options.getString("id", true);
      const removed = await removeGoal(interaction.guildId, interaction.user.id, goalId);
      if (!removed) throw new Error("No goal was found with that ID.");
      return interaction.editReply("🎯 Goal " + goalId + " removed.");
    }

    if (subcommand === "goal-complete") {
      const goalId = interaction.options.getString("id", true);
      const updated = await updateGoal(
        interaction.guildId,
        interaction.user.id,
        goalId,
        {
          status: "completed",
          completedAt: new Date().toISOString()
        }
      );

      if (!updated) throw new Error("No goal was found with that ID.");

      return interaction.editReply(
        "🎯 Goal **" + updated.name + "** marked as completed."
      );
    }

    if (subcommand === "plan-latest") {
      const plan = await getLatestPlan(interaction.guildId, interaction.user.id);
      return interaction.editReply({ embeds: [latestPlanEmbed(plan)] });
    }
  }

  if (group === "activity") {
    if (subcommand === "donations") {
      const tag = normalizeClanTag(interaction.options.getString("tag", true));
      const clan = await getClan(tag);
      const members = await getClanMembers(tag);
      return interaction.editReply({ embeds: [donationsEmbed(analyzeDonations(clan, members))] });
    }

    if (subcommand === "donation-snapshot") {
      const tag = normalizeClanTag(interaction.options.getString("tag", true));
      const clan = await getClan(tag);
      const members = await getClanMembers(tag);
      const saved = await saveDonation(
        interaction.guildId,
        analyzeDonations(clan, members)
      );
      return interaction.editReply(
        "Donation snapshot saved as " + saved.id + "."
      );
    }

    if (subcommand === "capital") {
      const tag = normalizeClanTag(interaction.options.getString("tag", true));
      const clan = await getClan(tag);
      const seasons = await getCapitalRaidSeasons(tag, 5);
      return interaction.editReply({ embeds: [capitalEmbed(analyzeCapital(clan, seasons))] });
    }

    if (subcommand === "capital-snapshot") {
      const tag = normalizeClanTag(interaction.options.getString("tag", true));
      const clan = await getClan(tag);
      const seasons = await getCapitalRaidSeasons(tag, 5);
      const saved = await saveCapital(interaction.guildId, analyzeCapital(clan, seasons));
      return interaction.editReply("Clan Capital snapshot saved as " + saved.id + ".");
    }

    if (subcommand === "capital-history") {
      const tag = normalizeClanTag(interaction.options.getString("tag", true));
      const history = await getCapitalHistory(interaction.guildId, tag, 10);
      return interaction.editReply({ embeds: [capitalHistoryEmbed(history)] });
    }

    if (subcommand === "clan-games") {
      const season = interaction.options.getString("season", true);
      const scores = await getScores(interaction.guildId, season);
      return interaction.editReply({ embeds: [clanGamesEmbed(season, scores)] });
    }

    if (subcommand === "clan-games-set") {
      const season = interaction.options.getString("season", true);
      const points = interaction.options.getInteger("points", true);
      await setScore(interaction.guildId, season, interaction.user.id, interaction.user.username, points);
      return interaction.editReply("Clan Games score updated to " + points + " for season " + season + ".");
    }

    if (subcommand === "clan-games-remove") {
      const season = interaction.options.getString("season", true);
      const removed = await removeScore(interaction.guildId, season, interaction.user.id);
      return interaction.editReply(removed ? "Your Clan Games score was removed for season " + season + "." : "No tracked Clan Games score was found for season " + season + ".");
    }
  }

  if (group === "analytics") {
    if (subcommand === "player") {
      const snapshots = await getSnapshots(
        interaction.guildId,
        interaction.user.id,
        25
      );
      const goals = await getGoals(
        interaction.guildId,
        interaction.user.id,
        true
      );
      const account = await getLinkedAccount(
        interaction.guildId,
        interaction.user.id
      );
      return interaction.editReply({
        embeds: [
          playerAnalyticsEmbed(
            require("../../coc/analytics").analyzePlayerHistory(
              snapshots,
              goals
            ),
            account?.playerTag
              ? await getPlayer(account.playerTag)
              : null
          )
        ]
      });
    }

    if (subcommand === "war") {
      const tag = normalizeClanTag(interaction.options.getString("tag", true));
      const history = await getWarHistory(interaction.guildId, tag, 25);
      return interaction.editReply({
        embeds: [warAnalyticsEmbed(
          require("../../coc/analytics").analyzeWarHistory(history),
          tag
        )]
      });
    }

    if (subcommand === "cwl") {
      const tag = normalizeClanTag(interaction.options.getString("tag", true));
      const history = await getCwlHistory(interaction.guildId, tag, 25);
      return interaction.editReply({
        embeds: [cwlAnalyticsEmbed(
          require("../../coc/analytics").analyzeCwlHistory(history),
          tag
        )]
      });
    }

    if (subcommand === "activity") {
      const tag = normalizeClanTag(interaction.options.getString("tag", true));
      const [donations, capital, clanGames] = await Promise.all([
        getDonationHistory(interaction.guildId, tag, 25),
        getCapitalHistory(interaction.guildId, tag, 25),
        getSeasonHistory(interaction.guildId, 10)
      ]);

      return interaction.editReply({
        embeds: [
          activityAnalyticsEmbed(
            require("../../coc/analytics").analyzeActivityHistory({
              donations,
              capital,
              clanGames
            }),
            tag
          )
        ]
      });
    }

    if (subcommand === "goals") {
      const goals = await getGoals(
        interaction.guildId,
        interaction.user.id,
        true
      );
      return interaction.editReply({
        embeds: [
          goalAnalyticsEmbed(
            require("../../coc/analytics").goalAnalytics(goals)
          )
        ]
      });
    }
  }

  if (group === "cwl") {
    const tag = normalizeTag(interaction.options.getString("tag", true));
    const analysis = await getCwlAnalysis(tag, getCurrentCwlGroup, getCwlWar);

    if (subcommand === "overview") return interaction.editReply({ embeds: [cwlOverviewEmbed(analysis)] });
    if (subcommand === "analyze") return interaction.editReply({ embeds: [cwlAnalysisEmbed(analysis)] });

    if (subcommand === "snapshot") {
      const saved = await saveCwl(interaction.guildId, analysis);
      return interaction.editReply("CWL intelligence snapshot saved as " + saved.id + ".");
    }

    if (subcommand === "history") {
      const history = await getCwlHistory(interaction.guildId, tag, 10);
      return interaction.editReply({ embeds: [cwlHistoryEmbed(history)] });
    }
  }

  if (subcommand === "profile") {
    let tag = interaction.options.getString("tag");
    if (!tag) {
      const account = await getLinkedAccount(interaction.guildId, interaction.user.id);
      if (!account) throw new Error("No linked account found. Use /coc account link or provide a player tag.");
      tag = account.playerTag;
    }
    return interaction.editReply({ embeds: [playerEmbed(await getPlayer(normalizeTag(tag)))] });
  }

  if (subcommand === "clan") {
    const clan = await getClan(normalizeTag(interaction.options.getString("tag", true)));
    return interaction.editReply({ embeds: [clanEmbed(clan)] });
  }

  if (subcommand === "progress") {
    return interaction.editReply({ embeds: [progressEmbed(await requirePlayer(interaction))] });
  }

  if (subcommand === "war") {
    const tag = normalizeTag(interaction.options.getString("tag", true));
    return interaction.editReply({ embeds: [warEmbed(await getCurrentWar(tag), tag)] });
  }

  if (subcommand === "war-analyze") {
    const tag = normalizeTag(interaction.options.getString("tag", true));
    return interaction.editReply({ embeds: [warAnalysisEmbed(analyzeWar(await getCurrentWar(tag), tag))] });
  }

  if (subcommand === "war-snapshot") {
    const tag = normalizeTag(interaction.options.getString("tag", true));
    const analysis = analyzeWar(await getCurrentWar(tag), tag);
    if (analysis.state === "notInWar") return interaction.editReply({ embeds: [warAnalysisEmbed(analysis)] });
    const saved = await saveWar(interaction.guildId, analysis);
    return interaction.editReply("War intelligence snapshot saved as " + saved.id + ".");
  }

  if (subcommand === "war-history") {
    const tag = normalizeTag(interaction.options.getString("tag", true));
    const history = await getWarHistory(interaction.guildId, tag, 10);
    return interaction.editReply({ embeds: [warHistoryEmbed(history)] });
  }

  if (subcommand === "snapshot") {
    const player = await requirePlayer(interaction);
    await saveSnapshot(interaction.guildId, interaction.user.id, player);
    return interaction.editReply("📸 Progression snapshot captured. I shall remember how things looked.");
  }

  if (subcommand === "history") {
    const snapshots = await getSnapshots(interaction.guildId, interaction.user.id, 2);
    if (snapshots.length < 2) return interaction.editReply("I need at least two snapshots before I can compare progression.");
    return interaction.editReply({ embeds: [snapshotDiffEmbed(snapshots[1], snapshots[0], compareSnapshots(snapshots[1], snapshots[0]))] });
  }

  return interaction.editReply("That /coc command is not implemented.");
}

module.exports = { data, execute };