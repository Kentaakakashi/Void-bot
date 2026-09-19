const {
  getPlayer,
  getClan,
  getCurrentWar
} = require("../coc/api");

const {
  getLinkedAccount
} = require("../database/repositories/cocAccounts");

const {
  buildProgressReport,
  findIncomplete
} = require("../coc/progression");

function normalizeTag(value) {
  const tag = String(value || "").trim().toUpperCase();

  if (!tag.startsWith("#")) {
    throw new Error("A Clash of Clans tag must start with #.");
  }

  return tag;
}

async function executeTool(name, argumentsJson, context) {
  const args =
    typeof argumentsJson === "string"
      ? JSON.parse(argumentsJson)
      : argumentsJson || {};

  if (name === "get_linked_player") {
    const account = await getLinkedAccount(
      context.guildId,
      context.userId
    );

    if (!account) {
      return {
        error:
          "The user does not have a linked Clash of Clans account."
      };
    }

    return getPlayer(account.playerTag);
  }

  if (name === "get_player_profile") {
    return getPlayer(normalizeTag(args.player_tag));
  }

  if (name === "get_account_progress") {
    const account = await getLinkedAccount(
      context.guildId,
      context.userId
    );

    if (!account) {
      return {
        error:
          "The user does not have a linked Clash of Clans account."
      };
    }

    const player = await getPlayer(account.playerTag);
    const report = buildProgressReport(player);

    return {
      playerTag: player.tag,
      playerName: player.name,
      townHallLevel: player.townHallLevel,
      completion: report,
      incompleteHeroes: findIncomplete(player.heroes).slice(0, 15),
      incompleteEquipment: findIncomplete(
        player.heroEquipment || player.equipment
      ).slice(0, 15)
    };
  }

  if (name === "get_clan_profile") {
    return getClan(normalizeTag(args.clan_tag));
  }

  if (name === "get_current_war") {
    return getCurrentWar(normalizeTag(args.clan_tag));
  }

  throw new Error("Unknown AI tool: " + name);
}

module.exports = {
  executeTool
};