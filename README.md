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

## Future phases

- Clan Capital intelligence
- Donations
- Clan Games
- Smart notifications
- Historical analytics
- Advanced AI tools
- Personal command center
- Web dashboard

## Deployment

Use Node.js 24.17+ and start with:

node index.js

Store all secrets in Bot-Hosting environment variables. Never commit .env or API keys to GitHub.
