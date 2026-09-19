const { getPlayer, getClan, getCurrentWar } = require("../coc/api");
const { getLinkedAccount } = require("../database/repositories/cocAccounts");
const { buildProgressReport, findIncomplete } = require("../coc/progression");
const { buildPriorities, buildPlan } = require("../coc/planner");
const { analyzeWar } = require("../coc/war");
const { getCwlAnalysis } = require("../coc/cwl");
const {
  getCurrentCwlGroup,
  getCwlWar
} = require("../coc/api");
const { createGoal, getGoals, removeGoal } = require("../database/repositories/goals");
const { savePlan } = require("../database/repositories/plans");

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
