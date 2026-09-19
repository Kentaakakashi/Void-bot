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
- /coc priorities
- /coc readiness
- /coc plan
- /coc goals
- /coc goal-add
- /coc goal-remove
- /coc plan-latest

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
- /coc cwl
- /coc cwl-analyze
- /coc cwl-snapshot
- /coc cwl-history

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
- /coc donations

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
- /coc capital
- /coc capital-snapshot
- /coc capital-history

The public API provides the clan capital raid-season endpoint. VØID only displays Capital metrics when corresponding values are actually returned by the API.

### Clan Games

The public CoC API does not provide a Clan Games points endpoint. VØID therefore uses a separate Firestore tracker instead of inventing points.

Commands:
- /coc clan-games
- /coc clan-games-set
- /coc clan-games-remove

Each Discord user can maintain their own tracked Clan Games score for a season.

### AI tools

- get_donation_intelligence
- get_capital_intelligence
- get_clan_games_leaderboard
## Future phases

- Clan Capital intelligence
- Donations
- Clan Games
- Smart notifications
- Historical analytics
- Advanced AI tools
- Personal command center
- Web dashboard


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

Planned:
- Trophy progression
- Donation progression
- War performance
- CWL performance
- Account development trends
- Upgrade completion trends
- Goal completion
- Activity trends

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
