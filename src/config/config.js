function required(name) {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(
      `Missing required environment variable: ${name}`
    );
  }

  return value.trim();
}

function numberFromEnv(name, fallback, minimum = 1) {
  const raw = process.env[name];

  if (raw === undefined || raw === "") {
    return fallback;
  }

  const value = Number(raw);

  if (!Number.isFinite(value) || value < minimum) {
    throw new Error(
      `Environment variable ${name} must be a number >= ${minimum}.`
    );
  }

  return value;
}

const config = {
  discord: {
    token: required("DISCORD_TOKEN"),
    clientId: required("DISCORD_CLIENT_ID"),
    guildId: required("DISCORD_GUILD_ID")
  },

  coc: {
    apiToken: process.env.COC_API_TOKEN?.trim() || null,
    clanTag: process.env.COC_CLAN_TAG?.trim() || null
  },

  openai: {
    apiKey: required("OPENAI_API_KEY"),
    model: process.env.OPENAI_MODEL?.trim() || "gpt-5.6",
    maxHistory: numberFromEnv("AI_MAX_HISTORY", 20),
    memoryLimit: numberFromEnv("AI_MEMORY_LIMIT", 50)
  },

  firebase: {
    projectId: required("FIREBASE_PROJECT_ID"),
    clientEmail: required("FIREBASE_CLIENT_EMAIL"),
    privateKey: required("FIREBASE_PRIVATE_KEY")
  },

  app: {
    timezone: process.env.BOT_TIMEZONE?.trim() || "Asia/Kolkata",
    logLevel: process.env.LOG_LEVEL?.trim() || "info",
    environment: process.env.NODE_ENV?.trim() || "development",
    notificationPollMs: numberFromEnv(
      "NOTIFICATION_POLL_MS",
      60000,
      30000
    )
  }
};

module.exports = config;