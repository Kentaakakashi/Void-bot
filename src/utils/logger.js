const LEVELS = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const configuredLevel =
  LEVELS[String(process.env.LOG_LEVEL || "info").toLowerCase()] ??
  LEVELS.info;

function safeStringify(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return "[unserializable]";
  }
}

function write(level, message, meta) {
  if (LEVELS[level] < configuredLevel) {
    return;
  }

  const line =
    `[${new Date().toISOString()}] ` +
    `[${level.toUpperCase()}] ` +
    `${message}` +
    (meta === undefined ? "" : ` ${safeStringify(meta)}`);

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

module.exports = {
  debug: (message, meta) => write("debug", message, meta),
  info: (message, meta) => write("info", message, meta),
  warn: (message, meta) => write("warn", message, meta),
  error: (message, meta) => write("error", message, meta)
};