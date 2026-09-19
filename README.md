# VØID HELPER

Personal Clash of Clans intelligence assistant for a private Discord server.

## Phase 1

The foundation provides:

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

Phase 2 adds live Clash of Clans account intelligence:

- Link one personal Clash of Clans player account per Discord user
- Validate linked player tags against the live API
- Player profile lookup
- Clan profile lookup
- Current war lookup
- VØID AI tool access to live player, clan, and war data
- AI can automatically use the user's linked account when appropriate
- Persistent account links in Firestore

### Commands

- `/coc account link`
- `/coc account show`
- `/coc account unlink`
- `/coc profile`
- `/coc clan`
- `/coc war`

## Future phases

- Heroes, pets, equipment, buildings and research intelligence
- Upgrade planner
- Progress tracking
- Goals
- War intelligence
- CWL
- Clan Capital
- Donations
- Clan Games
- Smart notifications
- Historical analytics
- Advanced AI tools
- Personal command center
- Web dashboard

## Deployment

Use Node.js 24.17+ and start with:

```bash
node index.js
```

Store all secrets in Bot-Hosting environment variables. Never commit `.env` or API keys to GitHub.
