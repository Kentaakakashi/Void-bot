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

function loadCommands(commandsDirectory) {
  const commands = new Map();

  for (const filePath of walk(commandsDirectory)) {
    delete require.cache[require.resolve(filePath)];

    const command = require(filePath);

    if (!command?.data?.name || typeof command.execute !== "function") {
      continue;
    }

    commands.set(command.data.name, command);
  }

  return commands;
}

module.exports = {
  loadCommands
};