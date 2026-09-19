require("dotenv").config();

const { start } = require("./src/core/startup");

start().catch((error) => {
  console.error("[FATAL] VØID HELPER failed to start:", error);
  process.exitCode = 1;
});