function getAvailableTools() {
  return [
    {
      type: "function",
      name: "get_linked_player",
      description: "Get the current Clash of Clans profile for the Discord user's linked player account.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
      strict: true
    },
    {
      type: "function",
      name: "get_player_profile",
      description: "Get a current Clash of Clans player profile by player tag.",
      parameters: {
        type: "object",
        properties: { player_tag: { type: "string", description: "Clash of Clans player tag including #." } },
        required: ["player_tag"],
        additionalProperties: false
      },
      strict: true
    },
    {
      type: "function",
      name: "get_clan_profile",
      description: "Get a current Clash of Clans clan profile by clan tag.",
      parameters: {
        type: "object",
        properties: { clan_tag: { type: "string", description: "Clash of Clans clan tag including #." } },
        required: ["clan_tag"],
        additionalProperties: false
      },
      strict: true
    },
    {
      type: "function",
      name: "get_account_progress",
      description: "Analyze the linked Clash of Clans account's current progression.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
      strict: true
    },
    {
      type: "function",
      name: "get_upgrade_priorities",
      description: "Build heuristic upgrade priorities using only API-returned level/maxLevel data.",
      parameters: {
        type: "object",
        properties: {
          focus: { type: "string", enum: ["general", "war", "trophy"], description: "Planning focus." }
        },
        required: ["focus"],
        additionalProperties: false
      },
      strict: true
    },
    {
      type: "function",
      name: "get_account_plan",
      description: "Build and save a structured progression plan using the linked account and saved goals.",
      parameters: {
        type: "object",
        properties: {
          focus: { type: "string", enum: ["general", "war", "trophy"], description: "Planning focus." }
        },
        required: ["focus"],
        additionalProperties: false
      },
      strict: true
    },
    {
      type: "function",
      name: "get_goals",
      description: "Get the user's active Clash of Clans progression goals.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
      strict: true
    },
    {
      type: "function",
      name: "create_goal",
      description: "Create a persistent Clash of Clans progression goal.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Short goal name." },
          description: { type: "string", description: "Goal details." },
          focus: { type: "string", enum: ["general", "war", "trophy"], description: "Goal focus." }
        },
        required: ["name", "description", "focus"],
        additionalProperties: false
      },
      strict: true
    },
    {
      type: "function",
      name: "remove_goal",
      description: "Remove a saved Clash of Clans progression goal.",
      parameters: {
        type: "object",
        properties: { goal_id: { type: "string", description: "Saved goal ID." } },
        required: ["goal_id"],
        additionalProperties: false
      },
      strict: true
    },
    {
      type: "function",
      name: "get_current_war",
      description: "Get the current war state for a Clash of Clans clan.",
      parameters: {
        type: "object",
        properties: { clan_tag: { type: "string", description: "Clash of Clans clan tag including #." } },
        required: ["clan_tag"],
        additionalProperties: false
      },
      strict: true
    }
  ];
}

module.exports = { getAvailableTools };
