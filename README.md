# VØID HELPER

Personal Clash of Clans intelligence assistant for a private Discord server.

## Phase 1

Phase 1 establishes the production foundation:

- Discord client
- Automatic guild command registration
- Recursive command loader
- Event loader
- Firebase / Firestore persistence
- VØID AI assistant
- J.A.R.V.I.S.-inspired personality
- Configurable AI chat channel
- Persistent conversation history
- Per-user conversation isolation
- Basic user memory storage
- Image-input support
- Centralized AI tool registry foundation
- Clash of Clans API foundation
- Error handling and logging

## Commands

- `/void channel set`
- `/void channel show`
- `/void channel disable`
- `/void status`
- `/void ask`
- `/void reset-chat`
- `/void memory`

## Deployment

Use Node.js 24.17+ and start with:

```bash
node index.js
```

Store all secrets in Bot-Hosting environment variables. Never commit `.env` or API keys to GitHub.