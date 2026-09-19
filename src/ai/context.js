function buildUserContext({ message, memory }) {
  return [
    `Discord server: ${message.guild?.name || "Unknown server"}`,
    `Discord user: ${message.author?.username || "Unknown user"}`,
    `User memory: ${JSON.stringify(memory || {})}`
  ].join("\n");
}

module.exports = {
  buildUserContext
};