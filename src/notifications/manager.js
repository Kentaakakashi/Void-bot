const config = require("../config/config");
const logger = require("../utils/logger");
const { getCurrentWar } = require("../coc/api");
const { getWarIdentity, analyzeWar } = require("../coc/war");

const {
  getNotificationSettings,
  getNotificationState,
  setNotificationState
} = require("../database/repositories/notifications");

const {
  newWarEmbed,
  warStartedEmbed,
  warEndedEmbed,
  missedAttacksEmbed
} = require("./format");

let intervalHandle = null;
let polling = false;

async function send(client, channelId, embed) {
  try {
    const channel = await client.channels.fetch(channelId);

    if (!channel || !channel.isTextBased() || typeof channel.send !== "function") {
      throw new Error("Configured notification channel is not text-based or cannot send messages.");
    }

    await channel.send({ embeds: [embed] });
    return true;
  } catch (error) {
    logger.error("Failed to send VØID notification.", {
      channelId,
      error: error?.stack || error?.message || String(error)
    });
    return false;
  }
}

function shouldSeed(state) {
  return state.initialized !== true;
}

async function pollGuild(client, guild) {
  const settings = await getNotificationSettings(guild.id);

  if (!settings.enabled || !settings.channelId || !settings.clanTag) return;

  const current = await getCurrentWar(settings.clanTag);
  const state = await getNotificationState(guild.id);
  const currentId = getWarIdentity(current, settings.clanTag);

  if (shouldSeed(state)) {
    await setNotificationState(guild.id, {
      initialized: true,
      warId: currentId,
      warState: current?.state || "notInWar",
      missedAlertWarId: null
    });
    return;
  }

  if (current && current.state !== "notInWar") {
    const previousWarId = state.warId || null;
    const previousState = state.warState || "notInWar";
    const analysis = analyzeWar(current, settings.clanTag);

    if (
      settings.events.warStart &&
      currentId &&
      currentId !== previousWarId &&
      current.state === "preparation"
    ) {
      await send(client, settings.channelId, newWarEmbed(analysis));
    }

    if (
      settings.events.warStart &&
      current.state === "inWar" &&
      (previousState !== "inWar" || currentId !== previousWarId)
    ) {
      await send(client, settings.channelId, warStartedEmbed(analysis));
    }

    if (
      settings.events.warEnd &&
      previousState === "inWar" &&
      current.state === "warEnded"
    ) {
      await send(client, settings.channelId, warEndedEmbed(analysis));
    }

    if (settings.events.missedAttacks && current.state === "inWar") {
      const endTime = Date.parse(String(current.endTime || ""));
      const timeRemaining = endTime - Date.now();

      if (
        analysis.totals.attacksRemaining > 0 &&
        Number.isFinite(endTime) &&
        timeRemaining > 0 &&
        timeRemaining <= 2 * 60 * 60 * 1000 &&
        state.missedAlertWarId !== currentId
      ) {
        const sent = await send(client, settings.channelId, missedAttacksEmbed(analysis));
        if (sent) {
          await setNotificationState(guild.id, { missedAlertWarId: currentId });
        }
      }
    }

    await setNotificationState(guild.id, {
      warId: currentId,
      warState: current.state
    });
    return;
  }

  await setNotificationState(guild.id, {
    warState: "notInWar"
  });
}

async function poll(client) {
  if (polling) return;
  polling = true;

  try {
    for (const guild of client.guilds.cache.values()) {
      try {
        await pollGuild(client, guild);
      } catch (error) {
        logger.error("VØID notification poll failed for guild.", {
          guildId: guild.id,
          error: error?.stack || error?.message || String(error)
        });
      }
    }
  } finally {
    polling = false;
  }
}

function startNotificationManager(client) {
  if (intervalHandle) return;

  const interval = Math.max(Number(config.app.notificationPollMs || 60000), 30000);

  intervalHandle = setInterval(() => {
    poll(client).catch((error) =>
      logger.error("VØID notification manager failed.", error)
    );
  }, interval);

  poll(client).catch((error) =>
    logger.error("Initial VØID notification poll failed.", error)
  );

  logger.info(`VØID smart notification manager started (${interval}ms interval).`);
}

module.exports = {
  startNotificationManager,
  poll
};