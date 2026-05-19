# Voice Personal Assistant

A real-time voice assistant that manages **tasks** and **notes** through natural conversation. Speak to the agent in the browser; it listens, thinks, acts on your data, and responds with voice.

Built with LiveKit (WebRTC), Deepgram Flux STT + Aura TTS, an LLM via OpenRouter, Neon PostgreSQL, and a React frontend with a Siri-style assistant UI.

## Features

- **Voice conversation** — connect, talk, interrupt the agent mid-sentence
- **Task management** — create, list, complete, and search tasks by voice
- **Notes** — save and search notes hands-free
- **Live UI** — transcript, tasks, and notes update in real time
- **User scoping** — JWT auth; each user sees only their own data
- **Demo account** — one-click login with seeded sample data

## Architecture

```
Browser (React)
    │  REST + JWT          WebRTC audio
    ▼                      ▼
Express API (:8000)    LiveKit Cloud
    │                      │
    ▼                      ▼
Neon PostgreSQL      Agent Worker (Node.js)
                         ├── Deepgram Flux STT (turn detection)
                         ├── Deepgram Aura TTS
                         ├── LLM (OpenRouter)
                         └── Tools → task/note services → Neon
```

## Project structure

```
voice-agent/
├── config.json           # STT, TTS, LLM, greeting (single source of truth)
├── agent/
│   ├── agent.js            # LiveKit voice worker + tools
│   ├── server.js           # Auth, API, LiveKit tokens
│   ├── entity/             # Drizzle schema + migrations
│   ├── services/           # DB business logic
│   ├── tools/              # LLM function tools
│   └── scripts/            # migrate, seed
└── frontend/
    └── src/                # React UI
```

## Prerequisites

- Node.js 20+ (Apple Silicon: prefer `arm64`)
- Accounts / API keys for:
  - [LiveKit Cloud](https://livekit.io/)
  - [Deepgram](https://deepgram.com/)
  - [OpenRouter](https://openrouter.ai/) (or change LLM in `config.json`)
  - [Neon](https://neon.tech/) PostgreSQL

## Setup

### 1. Install dependencies

```bash
cd agent && npm install
cd ../frontend && npm install
```

### 2. Configure environment

**`agent/.env`** (copy from `agent/.env.example`):

```env
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
DEEPGRAM_API_KEY=...
OPENROUTER_API_KEY=...
DATABASE_URL=postgresql://...@...neon.tech/neondb?sslmode=require
JWT_SECRET=your-random-secret
```

**`frontend/.env`** (copy from `frontend/.env.example`):

```env
VITE_API_BASE=http://localhost:8000
VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
```

### 3. Database

```bash
cd agent
npm run migration:run    # apply migrations
npm run seed             # optional: demo user + sample data
```

Demo login after seeding:

- **Email:** `demo@voice-agent.local`
- **Name:** Demo User

### 4. Run (3 terminals)

```bash
# Terminal 1 — API server
cd agent && npm run server

# Terminal 2 — Voice agent worker
cd agent && npm run dev

# Terminal 3 — Frontend
cd frontend && npm run dev
```

Open http://localhost:5173 → sign in → **Connect** → start talking.

## Voice commands to try

- *"Add a task to call the dentist tomorrow."*
- *"What's on my to-do list?"*
- *"Note: ideas for the demo video."*
- *"Mark call the dentist as done."*
- *"Find my notes about demo."*

## Configuration

Edit `config.json` at the repo root for:

- STT model (Deepgram Flux v2)
- TTS voice (Deepgram Aura)
- LLM provider and model
- System prompt and greeting
- Flux turn-detection tuning (`eot_threshold`, `eager_eot_threshold`, etc.)

The API server exposes `GET /api/config` for the frontend; the agent reads the same file on startup.

## Database migrations

Schema lives in `agent/entity/`. After changing entity files:

```bash
cd agent
npm run migration:generate -- --name describe_change
npm run migration:run
```

## API overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Email login → JWT |
| GET | `/api/token` | LiveKit token (auth required) |
| GET | `/api/tasks` | List user tasks |
| POST | `/api/tasks` | Create task |
| PATCH | `/api/tasks/:id/complete` | Mark task done |
| GET | `/api/notes` | List notes |
| POST | `/api/notes` | Create note |
| GET | `/api/config` | Public agent config |

## Security notes

- Never commit `.env` files or the `keys` file — they are in `.gitignore`
- Rotate any credentials that were shared or committed by mistake
- Use a strong `JWT_SECRET` in production

## License

Private / learning project — add a license if you open-source this repo.
