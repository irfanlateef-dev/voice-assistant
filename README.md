# Voice Personal Assistant

A real-time voice assistant that manages **tasks** and **notes** through natural conversation. Speak to the agent in the browser; it listens, thinks, acts on your data, and responds with voice.

Built with LiveKit (WebRTC), Deepgram Flux STT + Aura TTS, an LLM via OpenRouter, PostgreSQL, and a React frontend with a Siri-style assistant UI.

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
    │  REST + JWT         WebRTC audio
    ▼                      ▼
Express API (:8000)    LiveKit Cloud
    │                      │
    ▼                      ▼
PostgreSQL           Agent Worker (Node.js)
                         ├── Deepgram Flux STT (turn detection)
                         ├── Deepgram Aura TTS
                         ├── LLM (OpenRouter)
                         └── Tools → task/note services → PostgreSQL
```

## Project structure

```
voice-agent/
├── config.json              # STT, TTS, LLM, greeting (single source of truth)
├── docker-compose.dev.yml     # Local stack (Postgres + web + agent)
├── docker-compose.yml       # Production stack
├── agent/
│   ├── agent.js               # LiveKit voice worker + tools
│   ├── server.js              # Auth, API, LiveKit tokens
│   ├── entity/                # Drizzle schema + migrations
│   ├── services/              # DB business logic
│   ├── tools/                 # LLM function tools
│   └── scripts/               # migrate, seed
└── frontend/
    └── src/                   # React UI
```

## Prerequisites

- Node.js 20+ (Apple Silicon: prefer `arm64`)
- [Docker](https://docs.docker.com/get-docker/) and Docker Compose (recommended for local setup)
- Accounts / API keys for:
  - [LiveKit Cloud](https://livekit.io/)
  - [Deepgram](https://deepgram.com/)
  - [OpenRouter](https://openrouter.ai/) (or change LLM in `config.json`)

PostgreSQL is included in Docker Compose. For native dev without the full stack, you need PostgreSQL 16+ locally or a standalone Postgres container (see below).

---

## Setup (Docker — recommended)

This starts PostgreSQL, runs migrations, and runs the web API, frontend, and voice agent together.

### 1. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set your LiveKit, Deepgram, OpenRouter, and `JWT_SECRET` values. You do **not** need to set database variables for Docker — Compose injects `POSTGRES_*` automatically (`POSTGRES_HOST=postgres`, user/db/password `voiceagent`).

### 2. Start the stack

```bash
docker compose -f docker-compose.dev.yml up --build
```

Open http://localhost:8000 — the built frontend and API both run on port 8000.

### 3. Seed demo data (optional)

In a second terminal:

```bash
docker compose -f docker-compose.dev.yml --profile seed run --rm seed
```

Demo credentials after seeding:

- **Email:** `demo@voice-agent.local`
- **Password:** `demo1234`

### 4. Verify

```bash
curl http://localhost:8000/api/health
# {"ok":true}
```

### Useful Docker commands

```bash
# Stop the stack
docker compose -f docker-compose.dev.yml down

# Stop and remove the database volume (fresh DB)
docker compose -f docker-compose.dev.yml down -v

# Rebuild after code changes
docker compose -f docker-compose.dev.yml up --build
```

---

## Setup (native — without Docker Compose)

Use this when developing the frontend with Vite hot reload (`:5173`) and running the agent/API as separate Node processes.

### 1. Install dependencies

```bash
cd agent && npm install
cd ../frontend && npm install
```

### 2. Start PostgreSQL

**Option A — standalone Postgres container:**

```bash
docker run -d --name voiceagent-postgres \
  -e POSTGRES_USER=voiceagent \
  -e POSTGRES_PASSWORD=voiceagent \
  -e POSTGRES_DB=voiceagent \
  -p 5432:5432 \
  postgres:16-alpine
```

**Option B — local PostgreSQL install** with user `voiceagent`, database `voiceagent`, and port `5432`.

### 3. Configure environment

**`agent/.env`** (copy from `agent/.env.example`):

```env
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
DEEPGRAM_API_KEY=...
OPENROUTER_API_KEY=...
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=voiceagent
POSTGRES_PASSWORD=voiceagent
POSTGRES_DB=voiceagent
JWT_SECRET=your-random-secret
```

**`frontend/.env`** (copy from `frontend/.env.example`):

```env
VITE_API_BASE=http://localhost:8000
VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
```

### 4. Database

```bash
cd agent
npm run migration:run    # apply migrations
npm run seed             # optional: demo user + sample data
```

### 5. Run (3 terminals)

```bash
# Terminal 1 — API server
cd agent && npm run server

# Terminal 2 — Voice agent worker
cd agent && npm run dev

# Terminal 3 — Frontend
cd frontend && npm run dev
```

Open http://localhost:5173 → sign in → **Connect** → start talking.

---

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

With Docker:

```bash
docker compose -f docker-compose.dev.yml run --rm migrate
```

## Production deployment

Production uses `docker-compose.yml` at **[https://assistantchef.cc](https://assistantchef.cc)**. Nginx on the host reverse-proxies to the `web` container; the frontend is built with `VITE_API_BASE=""` so all API calls use same-origin paths (`/api/...`).

The stack includes a self-hosted PostgreSQL service on the shared `divescale-net` network. App containers connect via the unique hostname `voice-agent-postgres` (not `postgres`) so they do not hit another project's database on the same network.

In `.env` for production:

```env
TRUST_PROXY=1
CORS_ORIGINS=https://assistantchef.cc,https://www.assistantchef.cc
```

Set a strong password via `POSTGRES_PASSWORD` in `.env` (defaults to `voiceagent` if unset):

```bash
docker compose up --build -d
docker compose --profile seed run --rm seed   # optional
```

## API overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register (email + password) → JWT |
| POST | `/api/auth/login` | Login → JWT |
| GET | `/api/auth/me` | Current user (JWT required) |
| GET | `/api/token` | LiveKit token (JWT required) |
| GET | `/api/tasks` | List user tasks |
| POST | `/api/tasks` | Create task |
| PATCH | `/api/tasks/:id/complete` | Mark task done |
| GET | `/api/notes` | List notes |
| POST | `/api/notes` | Create note |
| GET | `/api/config` | Public agent config |

## Security notes

- Never commit `.env` files — they are in `.gitignore`
- Rotate any credentials that were shared or committed by mistake
- Use a strong random `JWT_SECRET` in production
- Set `POSTGRES_PASSWORD` to a strong value in production (see `docker-compose.yml`)

## License

Private / learning project — add a license if you open-source this repo.
