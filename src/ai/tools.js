function getAvailableTools() {
  return [
    {
      type: "function",
      name: "get_linked_player",
      description:
        "Get the current Clash of Clans profile for the Discord user's linked player account.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false
      },
      strict: true
    },
    {
      type: "function",
      name: "get_player_profile",
      description:
        "Get a current Clash of Clans player profile by player tag.",
      parameters: {
        type: "object",
        properties: {
          player_tag: {
            type: "string",
            description: "Clash of Clans player tag including #."
          }
        },
        required: ["player_tag"],
        additionalProperties: false
      },
      strict: true
    },
    {
      type: "function",
      name: "get_clan_profile",
      description:
        "Get a current Clash of Clans clan profile by clan tag.",
      parameters: {
        type: "object",
        properties: {
          clan_tag: {
            type: "string",
            description: "Clash of Clans clan tag including #."
          }
        },
        required: ["clan_tag"],
        additionalProperties: false
      },
      strict: true
    },
    {
      type: "function",
      name: "get_current_war",
      description:
        "Get the current war state for a Clash of Clans clan.",
      parameters: {
        type: "object",
        properties: {
          clan_tag: {
            type: "string",
            description: "Clash of Clans clan tag including #."
          }
        },
        required: ["clan_tag"],
        additionalProperties: false
      },
      strict: true
    }
  ];
}

module.exports = {
  getAvailableTools
};