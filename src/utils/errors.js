function getErrorMessage(error) {
  if (!error) {
    return "Unknown error.";
  }

  if (typeof error === "string") {
    return error;
  }

  return error.message || "Something went wrong.";
}

function publicErrorMessage(error) {
  const message = getErrorMessage(error);
  const lowered = message.toLowerCase();

  if (lowered.includes("insufficient_quota")) {
    return "My AI service has run out of available API quota. Rather inconvenient, sir.";
  }

  if (lowered.includes("rate limit") || lowered.includes("429")) {
    return "The AI service is rate-limiting me. Give me a moment and try again.";
  }

  if (lowered.includes("missing required environment variable")) {
    return "A server configuration value is missing. Check Bot-Hosting environment variables.";
  }

  return message.length > 1800
    ? `${message.slice(0, 1797)}...`
    : message;
}

module.exports = {
  getErrorMessage,
  publicErrorMessage
};