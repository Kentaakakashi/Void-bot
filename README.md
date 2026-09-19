# VØID HELPER

Personal Clash of Clans intelligence assistant for a private Discord server.

## Phase 1 — Foundation + AI

- Discord client and automatic guild command registration
- Recursive command and event loading
- Firebase / Firestore persistence
- VØID AI assistant
- J.A.R.V.I.S.-inspired personality
- Configurable AI chat channel
- Persistent per-user conversation history
- Basic user memory storage
- Image-input support
- Centralized AI tool registry
- Clash of Clans API foundation
- Error handling and logging

## Phase 2 — Clash of Clans Intelligence

- Linked Clash of Clans account per Discord user
- Live player and clan lookup
- Current classic war lookup
- Live Clash data available to VØID AI
- Persistent account links

Commands:
- /coc account link
- /coc account show
- /coc account unlink
- /coc profile
- /coc clan
- /coc war

## Phase 3 — Progression Intelligence

- Heroes, troops, spells, and equipment progression estimates
- Incomplete upgrade lists
- Persistent snapshots
- Snapshot-to-snapshot comparisons
- VØID progression analysis

Commands:
- /coc progress
- /coc snapshot
- /coc history

## Phase 4 — Upgrade & Planning Engine

- General progression priorities
- War-focused priorities
- Trophy-focused priorities
- Town Hall readiness analysis
- Persistent goals
- Saved progression plans
- AI planning tools

Commands:
- /coc planning priorities
- /coc planning readiness
- /coc planning plan
- /coc planning goals
- /coc planning goal-add
- /coc planning goal-remove
- /coc planning plan-latest

Priority scores are VØID heuristics, not official Clash of Clans recommendations.

## Phase 5 — War Intelligence

- Attack usage and unused attacks
- Stars and destruction
- Member performance
- Opponent-base analysis
- Cleanup targets
- Untouched bases
- Attack history
- Persistent war snapshots and history
- VØID AI war analysis

Commands:
- /coc war-analyze
- /coc war-snapshot
- /coc war-history

## Phase 6 — CWL Intelligence

- Current CWL group and season information
- Participating clan overview
- Round tracking
- CWL war-by-war results
- Stars and destruction
- Attack efficiency
- Three-star rate
- Member performance across fetched rounds
- Registered CWL roster coverage
- Round matchup information
- Persistent season snapshots
- CWL history
- VØID AI CWL analysis

Commands:
- /coc cwl overview
- /coc cwl analyze
- /coc cwl snapshot
- /coc cwl history

CWL war responses do not expose the classic-war attacksPerMember field, so CWL attack usage is handled separately.

Historical CWL analysis is based on the current CWL group and snapshots saved by VØID.

## Phase 7 — Clan Capital, Donations & Clan Games

Phase 7 adds clan activity intelligence.

### Donations

- Live clan member donation totals
- Donations received
- Contribution ratios
- Top donor view
- Lowest current contribution view
- VØID AI donation analysis

Command:
- /coc activity donations

### Clan Capital

- Current Capital Hall level
- Capital league
- Clan Capital points
- Recent Capital Raid Seasons
- Recent season loot/attack/medal fields when returned by the API
- Persistent Capital snapshots
- Capital history
- VØID AI Capital analysis

Commands:
- /coc activity capital
- /coc activity capital-snapshot
- /coc activity capital-history

The public API provides the clan capital raid-season endpoint. VØID only displays Capital metrics when corresponding values are actually returned by the API.

### Clan Games

The public CoC API does not provide a Clan Games points endpoint. VØID therefore uses a separate Firestore tracker instead of inventing points.

Commands:
- /coc activity clan-games
- /coc activity clan-games-set
- /coc activity clan-games-remove

Each Discord user can maintain their own tracked Clan Games score for a season.

### AI tools

- get_donation_intelligence
- get_capital_intelligence
- get_clan_games_leaderboard
## Phase 8 — Smart Notifications

VØID can proactively monitor a configured clan and notification channel.

Supported events:
- New war / preparation detected
- Battle day started
- War ended
- Unused attacks near war end

Commands:
- /void notifications set
- /void notifications show
- /void notifications disable

Notification configuration is stored per server in Firestore. Polling is configurable with NOTIFICATION_POLL_MS and defaults to 60000ms.

## Phase 9 — Historical Analytics

Phase 9 turns VØID's saved records into trend reports instead of isolated snapshots.

Added:
- Trophy and best-trophy progression
- Town Hall progression
- War-star, attack-win, and defense-win progression
- Donation progression from persistent donation snapshots
- Upgrade event and level-gain tracking
- Tracked item completion trends
- Classic war performance history
- CWL season performance history
- Clan Capital season activity trends
- Clan Games season totals
- Goal completion analytics
- Historical analytics available to VØID AI

Commands:
- /coc analytics player
- /coc analytics war
- /coc analytics cwl
- /coc analytics activity
- /coc analytics goals
- /coc activity donation-snapshot
- /coc planning goal-complete

Historical data is based only on records saved by VØID. Player progression requires periodic /coc snapshot use; donations require periodic /coc activity donation-snapshot use; wars require /coc war-snapshot; CWL requires /coc cwl snapshot; Capital history comes from saved Capital snapshots; Clan Games history comes from the manual tracker.

AI tools:
- get_historical_player_analytics
- get_historical_war_analytics
- get_historical_cwl_analytics
- get_historical_activity_analytics
- get_goal_analytics

## Phase 10 — Advanced AI Strategy

Planned:
- Combine current account state
- Historical account state
- Goals
- War and CWL data
- Clan activity
- User preferences
- Deeper strategy context

## Phase 11 — Personal Command Center

Planned:
- Account
- Progression
- Goals
- War
- CWL
- Clan activity
- Notifications
- AI
- History

## Phase 12 — Project Health & QA

The old web-dashboard roadmap item has been replaced with a permanent project integrity phase.

The repository now includes:
- Whole-source JavaScript syntax checks
- Relative require/import validation
- Discord command schema checks
- Required-before-optional option checks
- Duplicate command/option detection
- AI tool registry/handler consistency checks
- Pure-logic regression fixtures
- API field-mapping fixtures
- War and CWL state-accounting fixtures

Run:

npm run check

or:

npm run audit

The check is also run by GitHub Actions on pushes and pull requests.

## Deployment

Use Node.js 24.17+ and start with:

node index.js

Store all secrets in Bot-Hosting environment variables. Never commit .env or API keys to GitHub.
