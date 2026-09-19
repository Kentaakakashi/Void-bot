const { getPlayer, getClan, getCurrentWar } = require("../coc/api");
const { getLinkedAccount } = require("../database/repositories/cocAccounts");
const { buildProgressReport, findIncomplete } = require("../coc/progression");
const { buildPriorities, buildPlan } = require("../coc/planner");
const { analyzeWar } = require("../coc/war");
const {
  analyzeDonations,
  analyzeCapital,
  normalizeClanTag
} = require("../coc/clanActivity");
const { getCwlAnalysis } = require("../coc/cwl");
const {
  getCurrentCwlGroup,
  getCwlWar
} = require("../coc/api");
const { createGoal, getGoals, removeGoal } = require("../database/repositories/goals");
const { savePlan } = require("../database/repositories/plans");
const {
  analyzePlayerHistory,
  analyzeWarHistory,
  analyzeCwlHistory,
  analyzeActivityHistory,
  goalAnalytics
} = require("../coc/analytics");
const { getSnapshots } = require("../database/repositories/progression");
const { getWarHistory } = require("../database/repositories/wars");
const { getCwlHistory } = require("../database/repositories/cwl");
const {
  getDonationHistory
} = require("../database/repositories/donations");
const {
  getCapitalHistory
} = require("../database/repositories/capital");
const {
  getSeasonHistory
} = require("../database/repositories/clanGames");

function normalizeTag(value) {
  const tag = String(value || "").trim().toUpperCase();
  if (!tag.startsWith("#")) throw new Error("A Clash of Clans tag must start with #.");
  return tag;
}

async function getLinkedPlayer(context) {
  const account = await getLinkedAccount(context.guildId, context.userId);
  return account ? getPlayer(account.playerTag) : null;
}

async function executeTool(name, argumentsJson, context) {
  const args = typeof argumentsJson === "string" ? JSON.parse(argumentsJson) : argumentsJson || {};

  if (name === "get_linked_player") {
    const player = await getLinkedPlayer(context);
    return player || { error: "The user does not have a linked Clash of Clans account." };
  }

  if (name === "get_player_profile") return getPlayer(normalizeTag(args.player_tag));
  if (name === "get_clan_profile") return getClan(normalizeTag(args.clan_tag));
  if (name === "get_current_war") return getCurrentWar(normalizeTag(args.clan_tag));

  if (name === "get_account_progress") {
    const player = await getLinkedPlayer(context);
    if (!player) return { error: "The user does not have a linked Clash of Clans account." };
    const report = buildProgressReport(player);
    return {
      playerTag: player.tag,
      playerName: player.name,
      townHallLevel: player.townHallLevel,
      completion: report,
      incompleteHeroes: findIncomplete(player.heroes).slice(0, 15),
      incompleteEquipment: findIncomplete(player.heroEquipment || player.equipment).slice(0, 15)
    };
  }

  if (name === "get_upgrade_priorities") {
    const player = await getLinkedPlayer(context);
    if (!player) return { error: "The user does not have a linked Clash of Clans account." };
    return buildPriorities(player, args.focus);
  }

  if (name === "get_goals") return getGoals(context.guildId, context.userId);

  if (name === "create_goal") {
    if (!args.name.trim()) return { error: "Goal name cannot be empty." };
    return createGoal(context.guildId, context.userId, {
      name: args.name,
      description: args.description,
      focus: args.focus
    });
  }

  if (name === "remove_goal") {
    return {
      goalId: args.goal_id,
      removed: await removeGoal(context.guildId, context.userId, args.goal_id)
    };
  }

  if (name === "get_donation_intelligence") {
    const clanTag = normalizeClanTag(args.clan_tag);
    const clan = await getClan(clanTag);
    const members = await require("../coc/api").getClanMembers(clanTag);
    return analyzeDonations(clan, members);
  }

  if (name === "get_capital_intelligence") {
    const clanTag = normalizeClanTag(args.clan_tag);
    const clan = await getClan(clanTag);
    const seasons = await require("../coc/api").getCapitalRaidSeasons(clanTag, 5);
    return analyzeCapital(clan, seasons);
  }

  if (name === "get_clan_games_leaderboard") {
    return require("../database/repositories/clanGames").getScores(
      context.guildId,
      args.season
    );
  }

  if (name === "get_war_analysis") {
    const clanTag = normalizeTag(args.clan_tag);
    const war = await getCurrentWar(clanTag);
    return analyzeWar(war, clanTag);
  }

  if (name === "get_cwl_analysis") {
    return getCwlAnalysis(
      normalizeTag(args.clan_tag),
      getCurrentCwlGroup,
      getCwlWar
    );
  }

  if (name === "get_historical_player_analytics") {
    const snapshots = await getSnapshots(
      context.guildId,
      context.userId,
      25
    );
    const goals = await getGoals(
      context.guildId,
      context.userId,
      true
    );

    return analyzePlayerHistory(snapshots, goals);
  }

  if (name === "get_historical_war_analytics") {
    const clanTag = normalizeTag(args.clan_tag);
    const history = await getWarHistory(
      context.guildId,
      clanTag,
      25
    );
    return analyzeWarHistory(history);
  }

  if (name === "get_historical_cwl_analytics") {
    const clanTag = normalizeTag(args.clan_tag);
    const history = await getCwlHistory(
      context.guildId,
      clanTag,
      25
    );
    return analyzeCwlHistory(history);
  }

  if (name === "get_historical_activity_analytics") {
    const clanTag = normalizeTag(args.clan_tag);
    const [donations, capital, clanGames] = await Promise.all([
      getDonationHistory(context.guildId, clanTag, 25),
      getCapitalHistory(context.guildId, clanTag, 25),
      getSeasonHistory(context.guildId, 10)
    ]);

    return analyzeActivityHistory({
      donations,
      capital,
      clanGames
    });
  }

  if (name === "get_goal_analytics") {
    const goals = await getGoals(
      context.guildId,
      context.userId,
      true
    );
    return goalAnalytics(goals);
  }

  if (name === "get_account_plan") {
    const player = await getLinkedPlayer(context);
    if (!player) return { error: "The user does not have a linked Clash of Clans account." };
    const goals = await getGoals(context.guildId, context.userId);
    return savePlan(
      context.guildId,
      context.userId,
      buildPlan(player, args.focus, goals)
    );
  }

  throw new Error("Unknown AI tool: " + name);
}

module.exports = { executeTool };
