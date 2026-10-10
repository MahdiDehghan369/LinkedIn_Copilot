# LinkedIn Content Copilot

A personal AI-powered assistant for managing LinkedIn content: connect your
account, generate and refine posts, plan a content calendar, schedule and
publish, and understand how your posts perform.

Modular-monolith backend in plain JavaScript (no TypeScript anywhere) built
on `@silay/core` (DI/routing) and `@silay/logger`, with a React + Vite +
Tailwind frontend. Full architecture, every endpoint, and complete
verification results are in **[`FINAL_REPORT.md`](./FINAL_REPORT.md)** and
**[`API.md`](./API.md)**.

## Prerequisites

- **Node.js 20+** and npm
- **MongoDB 5+** (or any MongoDB-wire-protocol-compatible server)
- **Redis 6+**
- **RabbitMQ 3.10+**

You need all three datastores running before starting the backend — it
connects to all three at startup and fails fast if any is unreachable.

## Installation

```bash
git clone <repo-url> linkedin-copilot
cd linkedin-copilot

cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

## Environment Setup

```bash
cp .env.example backend/.env
```
Edit `backend/.env` — every variable is documented inline in the file. The
app boots and serves auth/users/posts/content/notifications with **zero**
LinkedIn/AI configuration; those two integrations simply return a clear
error (`LINKEDIN_NOT_CONNECTED` / `AI_PROVIDER_ERROR`) until you set:
- `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET` / `LINKEDIN_REDIRECT_URI`
  (register an app at <https://www.linkedin.com/developers/apps>)
- `AI_API_KEY` (any OpenAI-compatible chat-completions API key)

For real use, also set a strong random `SESSION_SECRET` and
`TOKEN_ENCRYPTION_KEY` (generation commands are in the comments in
`.env.example`) — don't ship the development placeholders.

## MongoDB Setup

Any real MongoDB 5+ instance works — local install, Docker, or Atlas. Point
`MONGODB_URI` at it:
```bash
MONGODB_URI=mongodb://127.0.0.1:27017/linkedin_copilot
```
No special configuration needed; the app creates its own collections and
indexes on first use via Mongoose.

## Redis Setup

Any real Redis 6+ instance. Point `REDIS_URL` at it:
```bash
REDIS_URL=redis://127.0.0.1:6379
```
Used for sessions, rate limiting, the OAuth CSRF state token, and the
scheduler's distributed lock. No special configuration needed.

## RabbitMQ Setup

Any real RabbitMQ 3.10+ instance, default configuration (no plugins
required — the app uses one durable queue on a topic exchange). Point
`RABBITMQ_URL` at it:
```bash
RABBITMQ_URL=amqp://127.0.0.1:5672
```

## Backend Startup

```bash
cd backend
npm run dev     # development, restarts on file change
# or
npm start       # production
```
Runs on `http://localhost:4000` by default (`PORT` in `.env`).

## Worker Startup

The worker is a **separate process** — it consumes the LinkedIn-publish
queue and polls for due scheduled posts. Without it running, posts will
enqueue but never actually reach LinkedIn.

```bash
cd backend
npm run worker        # production
# or
npm run worker:dev    # development, restarts on file change
```
Uses the same `backend/.env` as the server.

## Frontend Startup

```bash
cd frontend
npm run dev
```
Runs on `http://localhost:5173` and proxies `/api/*` requests to the
backend on port 4000 (see `vite.config.js`) — so in development the
browser only ever talks to one origin, keeping the session cookie simple
(no cross-site cookie configuration needed).

## Running Tests

```bash
cd backend
npm test
```
Runs the full Jest suite (109 tests, 15 suites) against real local
MongoDB/Redis/RabbitMQ — **the three datastores above must be running
first**. There is no frontend automated test suite (see `FINAL_REPORT.md`
§33 for why, and §35 for the recommendation to add one).

## Development Commands

| Command | Where | What |
|---|---|---|
| `npm run dev` | `backend/` | Start the API server with auto-restart |
| `npm run worker:dev` | `backend/` | Start the worker with auto-restart |
| `npm test` | `backend/` | Run the backend test suite |
| `npm run dev` | `frontend/` | Start the Vite dev server |
| `npm run build` | `frontend/` | Production frontend build → `dist/` |
| `npm run lint` | `frontend/` | Lint the frontend source |

## Production Commands

```bash
# Backend API
cd backend && npm start

# Worker (separate process/service, same env)
cd backend && npm run worker

# Frontend (build once, serve the static output from any host/CDN)
cd frontend && npm run build
```

See **[`FINAL_REPORT.md`](./FINAL_REPORT.md) §32** for the full production
deployment checklist (secrets, CORS, reverse proxy, scaling the worker).

## Project Documents

- **[`FINAL_REPORT.md`](./FINAL_REPORT.md)** — complete architecture,
  every subsystem explained, test results, live-verification results,
  known limitations, and what's intentionally deferred
- **[`API.md`](./API.md)** — every endpoint, with request/response
  examples and the full error-code reference
- **[`.env.example`](./.env.example)** — every environment variable,
  documented inline

## A Note on This Sandbox

This project was built and tested inside a sandboxed environment whose
outbound network is restricted — it cannot reach `linkedin.com`,
`api.openai.com`, or MongoDB's own binary CDN. For local
development/testing *inside that sandbox specifically*, a
MongoDB-wire-protocol-compatible server (FerretDB) stands in for real
`mongod` (see `scripts/start-local-db.sh`). **None of this affects a
normal deployment** — point `MONGODB_URI` at real MongoDB and this
substitution is irrelevant. Every LinkedIn/OpenAI code path was verified
two ways: mocked unit tests covering every branch, and live requests that
genuinely attempt the real call and correctly handle the network-level
rejection. Full details in `FINAL_REPORT.md` §33.
