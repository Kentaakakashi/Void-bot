function getAvailableTools() {
  return [
    {
      type: "function",
      name: "get_linked_player",
      description: "Get the current Clash of Clans profile for the Discord user's linked player account.",
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
      description: "Get a current Clash of Clans player profile by player tag.",
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
      description: "Get a current Clash of Clans clan profile by clan tag.",
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
      name: "get_account_progress",
      description: "Analyze the linked Clash of Clans account's current progression.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false
      },
      strict: true
    },
    {
      type: "function",
      name: "get_upgrade_priorities",
      description: "Build heuristic upgrade priorities using only API-returned level/maxLevel data.",
      parameters: {
        type: "object",
        properties: {
          focus: {
            type: "string",
            enum: ["general", "war", "trophy"],
            description: "Planning focus."
          }
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
          focus: {
            type: "string",
            enum: ["general", "war", "trophy"],
            description: "Planning focus."
          }
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
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false
      },
      strict: true
    },
    {
      type: "function",
      name: "create_goal",
      description: "Create a persistent Clash of Clans progression goal.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Short goal name."
          },
          description: {
            type: "string",
            description: "Goal details."
          },
          focus: {
            type: "string",
            enum: ["general", "war", "trophy"],
            description: "Goal focus."
          }
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
        properties: {
          goal_id: {
            type: "string",
            description: "Saved goal ID."
          }
        },
        required: ["goal_id"],
        additionalProperties: false
      },
      strict: true
    },
    {
      type: "function",
      name: "get_war_analysis",
      description: "Analyze the current classic Clash of Clans war, including attacks, unused attacks, stars, destruction, member performance, cleanup targets, and untouched bases.",
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
      name: "get_cwl_analysis",
      description: "Analyze the current Clan War League group for a clan, including season rounds, round results, stars, attack efficiency, member performance, and registered roster coverage.",
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
      name: "get_donation_intelligence",
      description: "Analyze current clan donations, donations received, and contribution ratios using live clan-member data.",
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
      name: "get_capital_intelligence",
      description: "Analyze current Clan Capital information and recent raid seasons using live API data.",
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
      name: "get_clan_games_leaderboard",
      description: "Get the manually tracked Clan Games leaderboard for a season.",
      parameters: {
        type: "object",
        properties: {
          season: {
            type: "string",
            description: "Clan Games season identifier."
          }
        },
        required: ["season"],
        additionalProperties: false
      },
      strict: true
    },
    {
      type: "function",
      name: "get_historical_player_analytics",
      description: "Analyze the linked user's saved Clash of Clans progression snapshots, including trophy, Town Hall, donation, upgrade, and goal trends.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false
      },
      strict: true
    },
    {
      type: "function",
      name: "get_historical_war_analytics",
      description: "Analyze saved classic war performance for a clan across recorded wars.",
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
      name: "get_historical_cwl_analytics",
      description: "Analyze saved CWL season performance for a clan across recorded seasons.",
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
      name: "get_historical_activity_analytics",
      description: "Analyze saved clan activity trends including donations, Clan Capital seasons, and tracked Clan Games seasons.",
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
      name: "get_goal_analytics",
      description: "Analyze the linked user's saved active and completed Clash of Clans goals.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false
      },
      strict: true
    },
    {
      type: "function",
      name: "get_current_war",
      description: "Get the current classic war state for a Clash of Clans clan.",
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
