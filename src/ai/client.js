const OpenAI = require("openai");

const config = require("../config/config");

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

module.exports = openai;
