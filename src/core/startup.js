const path = require("path");

const {
  REST,
  Routes
} = require("discord.js");

const {
  createClient
} = require("./client");

const {
  loadCommands
} = require("./commandLoader");

const {
  loadEvents
} = require("./eventLoader");

const {
  initializeDatabase
} = require("../database/firestore");

const config = require("../config/config");
const logger = require("../utils/logger");

async function registerCommands(commands) {
  const rest = new REST({ version: "10" }).setToken(config.discord.token);

  const body = [...commands.values()].map((command) => command.data.toJSON());

  await rest.put(
    Routes.applicationGuildCommands(
      config.discord.clientId,
      config.discord.guildId
    ),
    { body }
  );

  logger.info(`Registered ${body.length} guild command(s).`);
}

async function start() {
  initializeDatabase();

  const client = createClient();

  const commands = loadCommands(
    path.join(__dirname, "..", "commands")
  );

  client.commands = commands;

  loadEvents(
    client,
    path.join(__dirname, "..", "events")
  );

  await registerCommands(commands);
  await client.login(config.discord.token);
}

module.exports = {
  start
};