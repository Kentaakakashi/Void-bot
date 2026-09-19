const logger = require("../utils/logger");
const { startNotificationManager } = require("../notifications/manager");

module.exports = {
  name: "clientReady",
  once: true,

  async execute(client) {
    logger.info(
      `VØID HELPER online as ${client.user.tag}.`
    );

    logger.info(
      `Connected to ${client.guilds.cache.size} server(s).`
    );

    startNotificationManager(client);
  }
};