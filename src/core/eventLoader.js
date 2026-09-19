const fs = require("fs");
const path = require("path");

function walk(directory) {
  const files = [];

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(fullPath);
    }
  }

  return files;
}

function loadEvents(client, eventsDirectory) {
  for (const filePath of walk(eventsDirectory)) {
    delete require.cache[require.resolve(filePath)];

    const event = require(filePath);

    if (!event?.name || typeof event.execute !== "function") {
      continue;
    }

    const handler = (...args) => event.execute(...args);

    if (event.once) {
      client.once(event.name, handler);
    } else {
      client.on(event.name, handler);
    }
  }
}

module.exports = {
  loadEvents
};