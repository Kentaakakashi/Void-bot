const OpenAI = require("openai");

const config = require("../config/config");

const openai = new OpenAI({
  apiKey: config.openai.apiKey
});

module.exports = openai;