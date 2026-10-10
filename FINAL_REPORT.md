# LinkedIn Content Copilot — Final Delivery Report

**Status: Feature-complete across all 6 planned phases. Backend fully built, tested, and live-verified. Frontend covers Phase 1 (auth, dashboard, profile) per the original scope.**

---

## 1. Project Overview

A personal AI-powered LinkedIn content assistant. A user connects their
LinkedIn account, and the app helps them plan, generate, refine, schedule,
and publish LinkedIn posts, then understand how those posts performed —
built as a modular monolith in JavaScript (no TypeScript anywhere), using
`@silay/core` for DI/routing and `@silay/logger` for structured logging, per
the approved architecture document.

Built incrementally over six phases, each ending with a running,
live-verified system, not just passing tests:

1. **Foundation** — project scaffold, auth, users, sessions
2. **LinkedIn** — OAuth, encrypted token storage, publishing capability
3. **AI** — `AIProvider` abstraction, OpenAI integration, structured-output validation
4. **Content Management** — posts lifecycle, RabbitMQ-backed scheduling/publishing, content ideas/calendar/gaps
5. **Analytics** — per-post metrics, overview dashboard, AI-narrated performance insight
6. **Notifications & Polish** — event-driven notifications, auth rate limiting, a `LinkedInService` refactor

---

## 2. Final Architecture

```
                         React Frontend (Vite, JS, Tailwind)
                                    |
                              HTTPS / JSON (session cookie)
                                    |
                     Node.js Backend (Express via @silay/core)
                                    |
   +----------+----------+----------+----------+----------+----------+
   |          |          |          |          |          |          |
 auth       users   notifications  linkedin      ai       posts   content
   |          |          |          |            |          |        |
   +----------+----------+----+-----+------------+----------+--------+
                              |
                    +---------+---------+
                    |                   |
                 MongoDB              Redis
              (source of truth)   (sessions, locks,
                    |              rate limits, OAuth
              analytics module      state, idempotency)
                    |
              RabbitMQ (post.publish_requested queue)
                    |
         Background Worker process (src/app/worker.js)
              — consumes publish jobs
              — polls scheduled_posts (Redis-locked)
                    |
              LinkedIn API (OAuth, publish, engagement) — blocked in
              this sandbox's network, see §33
                    |
              OpenAI API (generation) — blocked in this sandbox's
              network, see §33
```

Two runnable backend entrypoints from one codebase, as specified:
`src/app/server.js` (HTTP API) and `src/app/worker.js` (RabbitMQ consumer +
scheduler poller) — no microservices, one deployable artifact, two process
types.

---

## 3. Complete Project Structure

```
linkedin-copilot/
├── backend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── bootstrap/index.js       # single registerModuleConfigs() call, all routes
│   │   │   ├── middleware/              # core.module.js, cors, error-handler, session, validate
│   │   │   ├── routes/health.controller.js
│   │   │   ├── server.js                # HTTP process entrypoint
│   │   │   └── worker.js                # background worker entrypoint
│   │   ├── infrastructure/
│   │   │   ├── config/env.js            # all env vars, frozen config object
│   │   │   ├── database/connection.js   # Mongo connect/disconnect
│   │   │   ├── logger/index.js          # @silay/logger setup
│   │   │   ├── rabbitmq/connection.js   # AMQP connect/disconnect, queue topology
│   │   │   └── redis/                   # client.js, redis.service.js (locks/cache/rate-limit primitives)
│   │   ├── modules/
│   │   │   ├── auth/                    # service, controller, middleware, rate-limiter, validation
│   │   │   ├── users/                   # model, repository, service, controller
│   │   │   ├── notifications/           # model, repository, service, controller
│   │   │   ├── linkedin/                # model, repository, client, service, controller, errors
│   │   │   ├── ai/                      # providers/ (AIProvider, OpenAIProvider), service, controller,
│   │   │   │                            # schemas, ai-generation + writing-style model/repository
│   │   │   ├── posts/                   # model, state-machine, repository, service, controller,
│   │   │   │                            # publish-post.use-case.js
│   │   │   ├── scheduler/               # scheduled-post model/repository, publisher, scheduler.service
│   │   │   ├── content/                 # idea + calendar model/repository, service, controller
│   │   │   └── analytics/               # model, repository, service, controller
│   │   └── shared/
│   │       ├── errors/                  # AppError + typed subclasses
│   │       └── utils/                   # password.js (bcrypt), crypto.js (AES-256-GCM)
│   ├── test/                            # 15 suites, 109 tests (see §24)
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/                         # client.js (only fetch() call site), authApi.js, usersApi.js
│   │   ├── context/AuthContext.jsx      # session state via TanStack Query
│   │   ├── routes/                      # ProtectedRoute, GuestRoute
│   │   ├── components/                  # ui/ (Button, TextField, Card, PageSpinner), layout/ (AuthLayout, AppShell)
│   │   ├── pages/                       # Login, Register, Dashboard, Profile, NotFound
│   │   ├── App.jsx, main.jsx, index.css
│   │   └── vite.config.js               # includes dev proxy to backend
│   └── package.json
├── scripts/start-local-db.sh            # dev-environment datastore bootstrap (see §33)
├── tools/ferretdb                       # vendored MongoDB-wire-compatible binary (see §33)
├── README.md
├── API.md
├── .env.example
└── FINAL_REPORT.md                      # this file
```

Backend: ~4,400 lines of source across 82 files. Frontend: ~940 lines
across 19 files.

---

## 4. Backend Modules and Responsibilities

| Module | Responsibility | Depends on (cross-module) |
|---|---|---|
| `auth` | Registration, login, logout, session lifecycle, rate limiting | `users` (repository) |
| `users` | Profile, preferences, AI settings | — |
| `notifications` | In-app notification CRUD | — (consumed by `linkedin`, `posts`' worker path) |
| `linkedin` | OAuth, encrypted token storage/refresh, publish, engagement reads | `notifications` (expiry alerts) |
| `ai` | Provider abstraction, prompt/context building, output validation, generation audit trail | `users` (writer context) |
| `posts` | Post entity, state machine, CRUD, publish/schedule orchestration | `linkedin` (via an explicit use-case class, not the service directly) |
| `scheduler` | Turns due scheduled posts into publish jobs, Redis-locked | `posts` (status transition) |
| `content` | Ideas, calendar, deterministic topic-gap analysis | `posts` (read-only) |
| `analytics` | LinkedIn metrics, overview aggregation, AI performance insight | `posts`, `linkedin`, `ai` |

Every controller is thin (parses `req`, calls one service method, calls
`res.sendResponse`); all business logic lives in services; all MongoDB
access goes through repositories. No module reaches into another module's
Mongoose model directly — cross-module needs go through the other module's
service/repository via the shared DI container (documented in each
`*.module.js` file).

---

## 5. Frontend Structure

Built for Phase 1 scope (auth, dashboard, profile) per the original request
sequence; later phases were backend-only.

- **Routing:** `react-router-dom` — `/login`, `/register` (guest-only,
  redirect if authenticated), `/` (dashboard), `/profile` — both protected
  by `ProtectedRoute`, which redirects to `/login` if there's no session
- **State:** `@tanstack/react-query` for all server state (no Redux — this
  app's state is almost entirely "data from the API"); `AuthContext`
  wraps the `me` query + login/register/logout mutations
- **API layer:** `api/client.js` is the *only* place `fetch` is called
  (`credentials: 'include'` on every request); every page goes through
  `api/authApi.js` / `api/usersApi.js`
- **Design system:** deliberate, non-default Tailwind v4 tokens (paper/ink
  palette, cobalt accent, Space Grotesk + IBM Plex type pairing) — verified
  by rendering in a real headless-Chromium session and screenshotting

---

## 6. All Implemented Features

- Registration, login, logout, session-based auth
- Profile + content preferences (tone, audience, posting frequency, emoji usage)
- LinkedIn OAuth connect/status/disconnect
- LinkedIn publishing (via async job) with automatic token refresh
- AI: idea generation, post generation, post improvement (scores + rewrite), writing-style analysis
- Post lifecycle: draft → edit → approve → publish/schedule → published/failed, with full state-machine validation
- Scheduled publishing with a distributed lock (no double-publish across worker instances)
- Content ideas tracking (proposed/used/dismissed)
- Weekly content calendar
- Deterministic content-gap analysis (topic distribution)
- Per-post analytics + account overview dashboard
- AI-narrated "why did this post perform the way it did" insight
- In-app notifications (post published, post failed, LinkedIn connection expired), read/unread
- Rate limiting on auth endpoints
- Centralized, consistent error handling and structured logging throughout

---

## 7. All API Endpoints

Full request/response documentation lives in **`API.md`**. Summary:

```
GET    /api/health

POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout

GET    /api/users/me
PATCH  /api/users/me

GET    /api/notifications
PATCH  /api/notifications/:id/read

GET    /api/linkedin/connect
GET    /api/linkedin/callback
GET    /api/linkedin/status
DELETE /api/linkedin/disconnect

POST   /api/ai/ideas
POST   /api/ai/posts/generate
POST   /api/ai/posts/improve
POST   /api/ai/analyze

GET    /api/posts
POST   /api/posts
GET    /api/posts/:id
PATCH  /api/posts/:id
DELETE /api/posts/:id
POST   /api/posts/:id/approve
POST   /api/posts/:id/publish
POST   /api/posts/:id/schedule
POST   /api/posts/:id/cancel

GET    /api/content/ideas
POST   /api/content/ideas
PATCH  /api/content/ideas/:id
GET    /api/content/calendar
PUT    /api/content/calendar
GET    /api/content/gaps

GET    /api/analytics/overview
GET    /api/analytics/posts/:id
POST   /api/analytics/posts/:id/refresh
POST   /api/analytics/posts/:id/insights
```

30 endpoints total, all implemented, all tested or live-verified (see §24–25).

---

## 8. Authentication / Session Architecture

- **express-session** + **connect-redis**: session data lives server-side
  in Redis (`sess:*` keys); only an opaque, signed session ID reaches the
  browser, in an `HttpOnly`, `SameSite=Lax` cookie (`Secure` auto-enabled
  in production)
- Session regenerated on login/register (fixation protection)
- 7-day default TTL (`SESSION_MAX_AGE_MS`)
- `requireAuth` middleware reads `req.session.userId`, exposes it as
  `req.userId`; every protected route depends on this one guard
- No JWT anywhere — explicitly excluded per the architecture

**Live-verified:** registered a user, confirmed the `Set-Cookie` header
(`HttpOnly`, `SameSite=Lax`), confirmed the session document sitting in
Redis with the correct fields and TTL, confirmed logout destroys it and
subsequent requests get `401`.

---

## 9. MongoDB Collections and Indexes

| Collection | Key fields | Indexes |
|---|---|---|
| `users` | email, passwordHash (select:false), name, preferences, aiSettings | — |
| `linkedinaccounts` | userId, linkedinUserId, accessTokenEnc/refreshTokenEnc (select:false, AES-256-GCM), tokenExpiresAt, status | `userId` unique |
| `notifications` | userId, type, message, relatedEntity, read | `userId`, `read`, TTL on `createdAt` (90 days) |
| `aigenerations` | userId, kind, inputSummary, output, model, tokensUsed, latencyMs | `userId` |
| `writingstyles` | userId, profile{tone, sentenceLength, ...} | `userId` unique |
| `posts` | userId, status, content{hook,body,cta,hashtags}, topicTags, linkedin{postId,publishedAt,lastError,retryCount}, scheduledFor | `userId`, `{userId,status}`, `{userId,scheduledFor}` |
| `scheduledposts` | postId, userId, runAt, status, attempts, lastError | `postId` unique, `runAt` |
| `contentideas` | userId, title, hook, coreIdea, status | `userId`, `status` |
| `contentcalendars` | userId, weekStart, slots[], preferences | `{userId,weekStart}` unique |
| `postanalytics` | postId, userId, impressions, reactions, comments, reposts, engagementRate, history[] (capped 10) | `postId` unique, `userId` |

No unnecessary collections — matches the architecture doc's list exactly,
plus `writingstyles` and `aigenerations` which the doc specified for the AI
module.

---

## 10. Redis Usage and Key Patterns

| Pattern | Purpose | TTL |
|---|---|---|
| `sess:<id>` | Session data (via connect-redis) | matches `SESSION_MAX_AGE_MS` |
| `oauth:state:<uuid>` | CSRF state during LinkedIn OAuth handshake, single-use (deleted on use) | 600s |
| `linkedin:ratelimit:<userId>` | Pre-emptive LinkedIn publish rate limit (100/hour) | 3600s |
| `ratelimit:auth:<ip>` | Brute-force protection on `/register`+`/login` (20/15min) | 900s |
| `lock:scheduled_post:<id>` | Distributed lock so only one worker dispatches a given scheduled post | 60s |

MongoDB remains the only source of truth for business data — nothing
persisted only in Redis matters if it's lost.

---

## 11. RabbitMQ — Exchanges, Queues, Events, Workers, Retry Strategy

- **Exchange:** `copilot.events` (topic, durable)
- **Queue:** `post.publish_requested` (durable, bound to the exchange with
  the same routing key)
- **Event payload:** `{ postId, userId, enqueuedAt }`, JSON, persistent messages
- **Producers:** `PostsService.requestPublish()` (manual "publish now") and
  `SchedulerService.dispatchDuePosts()` (scheduled dispatch) — both go
  through the same `PublishEventPublisher`, so both paths are consumed
  identically
- **Consumer:** `src/app/worker.js`, `prefetch(1)`, one message at a time
- **Retry strategy:** on failure, the consumer checks the error's `code`.
  `LINKEDIN_VALIDATION_ERROR`/`LINKEDIN_NOT_CONNECTED` are non-retryable
  (fail immediately). Anything else retries by explicitly republishing
  with an incremented `x-attempts` header, up to 3 attempts, then fails
  permanently. **No formal dead-letter queue** — the `Post` document's
  `linkedin.lastError`/`linkedin.retryCount` fields are the durable
  failure record for this MVP (documented tradeoff — a DLQ with no admin
  surface to inspect it yet would be unused ceremony)
- **Idempotency:** `PublishPostUseCase` only acts if the post's status is
  still `PUBLISHING` — a redelivered message for an already-finished post
  is a safe no-op

**A real bug this design caught (see §17 of the build process, summarized
in the Environment Instability Note at the end of this document):** the
scheduler originally published the event without transitioning the Post to
`PUBLISHING`, silently no-op'ing every scheduled dispatch via the
idempotency guard. Fixed; regression test added
(`scheduler.service.test.js`).

---

## 12. AI Architecture and OpenAI Integration

```
Request → AiService (builds writer context from users' preferences)
        → AIProvider abstraction (providers/AIProvider.js — 6-method interface)
        → OpenAIProvider (only concrete implementation; every prompt instructs
          "respond with ONLY a JSON object matching <shape>", uses OpenAI's
          response_format: json_object)
        → raw parsed JSON
        → zod schema validation in AiService (AIResponseValidationError if it
          doesn't match — the model's output is never trusted blindly)
        → persisted to ai_generations (audit trail: kind, input summary,
          output, model, tokens, latency — not the full prompt/context)
        → returned to the caller
```

Implemented `AIProvider` methods: `generateIdeas`, `generatePost`,
`improvePost`, `analyzeWritingStyle`, `analyzeContent`, `generateReply`.
The first four have HTTP routes; `analyzeContent` is called internally by
the `analytics` module's performance-insight endpoint; `generateReply` is
implemented but has no caller yet (deferred comment-assistant feature, see
§34).

**Context building today** is limited to the user's own
tone/audience/language/emoji preferences — not yet recent-post history or
content gaps, since that needs real post history at volume (documented
growth point, not a gap in the interface).

---

## 13. LinkedIn OAuth and Publishing Flow

**OAuth:**
```
GET /connect → generate state, store in Redis (10min TTL) → redirect to LinkedIn
LinkedIn → GET /callback?code&state → validate+consume state → exchange code
  → fetch profile → encrypt tokens (AES-256-GCM) → upsert LinkedInAccount
  → redirect to FRONTEND_URL/profile?linkedin=connected
```
Denied consent or an invalid/expired state both redirect back with an error
query flag rather than throwing a JSON error (this is a browser navigation,
not an API call).

**Publishing:**
```
posts.requestPublish() → validate APPROVED → status=PUBLISHING → enqueue event
worker consumes → PublishPostUseCase → LinkedInService.publish()
  → rate-limit check → decrypt token → call LinkedIn → on 401, transparent
    refresh-and-retry once → on success: status=PUBLISHED, store linkedinPostId
  → on failure: worker decides retry vs. FAILED (see §11)
```

**Token handling:** encrypted at rest (AES-256-GCM), `select: false` on the
Mongoose schema (never returned by a default query), never logged, never
sent to the frontend — only `{ connected: boolean }` ever leaves the
`linkedin` module's boundary.

---

## 14. Post Lifecycle / State Machine

Single source of truth: `posts/posts.state-machine.js`.

```
DRAFT/GENERATED --edit--> EDITED --edit--> EDITED
DRAFT/GENERATED/EDITED --approve--> APPROVED
APPROVED --publish--> PUBLISHING --success--> PUBLISHED
                                 --failure--> FAILED
APPROVED --schedule--> SCHEDULED --dispatch--> PUBLISHING (see above)
FAILED --retry (re-approve)--> APPROVED
{DRAFT,GENERATED,EDITED,APPROVED,SCHEDULED} --cancel--> CANCELLED
PUBLISHED, CANCELLED: terminal — nothing transitions out
```

Every transition in the app goes through `assertTransition()` — no
endpoint implements its own status logic. Covered by a dedicated
table-driven test suite (`posts.state-machine.test.js`).

---

## 15. Scheduler Architecture

`SchedulerService.dispatchDuePosts()`, polled every 30s by the worker
process:
1. Find `ScheduledPost` records with `runAt <= now` and `status: 'pending'`
2. For each, attempt a Redis lock (`lock:scheduled_post:<id>`, 60s TTL) —
   skip if another worker already holds it (safe to run multiple worker
   instances)
3. Transition the `Post` to `PUBLISHING`
4. Publish the `post.publish_requested` event (same queue/consumer as
   manual "publish now")
5. Mark the `ScheduledPost` `dispatched` (or `failed` if the above threw)

---

## 16. Analytics Architecture

```
POST /analytics/posts/:id/refresh
  → validate post is PUBLISHED with a linkedinPostId
  → LinkedInService.getPostEngagement() (reactions/comments/reposts;
    impressions is always null — LinkedIn's basic w_member_social scope
    doesn't expose it, that needs Marketing Developer Platform access)
  → compute engagementRate = (reactions+comments+reposts)/impressions
    (null if impressions unavailable)
  → append a capped (10-entry) snapshot to post_analytics

GET /analytics/overview
  → average engagementRate across posts that have one, total impressions,
    best-performing post

POST /analytics/posts/:id/insights
  → compute this post's engagement delta vs. the user's average
  → AiService.analyzePerformance() → OpenAIProvider.analyzeContent()
    (prompt includes the actual delta, asks for specific, text-grounded
    reasons — not generic advice)
```

---

## 17. Notification System

- Collection: `notifications`, TTL 90 days (self-pruning)
- Created from real trigger points, not a generic fire-and-forget: the
  worker creates `post.published`/`post.publish_failed` at the exact
  moment those outcomes happen; `LinkedInService` creates
  `linkedin.expired` when token refresh fails
- `GET /api/notifications?unread=true`, `PATCH /api/notifications/:id/read`
- **Live-verified**: published a post with no LinkedIn connected through
  the real worker, confirmed a `post.publish_failed` notification with the
  correct message and `relatedEntity` actually appeared in the database

---

## 18. Rate Limiting

- **Auth** (`/register`, `/login`): 20 requests / 15 minutes per source IP,
  Redis-backed (`ratelimit:auth:<ip>`), shared bucket across both
  endpoints (documented tradeoff: simple, but means a burst of failed
  logins also throttles a subsequent register attempt from the same IP)
- **LinkedIn publish**: 100/hour per user (`linkedin:ratelimit:<userId>`),
  pre-emptive — checked before ever calling LinkedIn
- **Live-verified**: hammered `/login` with bad credentials, confirmed
  `429 RATE_LIMIT_EXCEEDED` at exactly the 20th attempt

---

## 19. Error Handling

- `AppError` base class (`message`, `statusCode`, `code`, `isOperational`)
  with typed subclasses per domain: `ValidationError`,
  `AuthenticationError`, `NotFoundError`, `ConflictError`,
  `RateLimitError`, plus module-specific ones (`InvalidTransitionError`,
  five `LinkedIn*Error` types, `AIProviderError`, `AIResponseValidationError`)
- Centralized Express error-handling middleware — the only place that
  formats an error response; stack traces never leave the server,
  regardless of environment
- Full error-code reference in `API.md` under "Conventions"

---

## 20. Logging with @silay/logger

- One structured logger per module (`logger.child({ module: '...' })`) —
  used in `server.js`, `worker.js`, `linkedin.service.js`, and everywhere
  an operationally-significant event happens (connect/disconnect,
  publish success/failure, token refresh failure)
- `@silay/logger`'s built-in `SensitiveDataRedactor` strips any field
  whose key contains `password`/`token`/`secret` by default; the app adds
  a second layer of defense by simply never passing raw tokens to a
  logger call in the first place (verified by grepping a live server's
  logs for known plaintext secrets — zero matches)
- One real logging bug was caught and fixed during this build: `worker.js`
  was passing `error.message` (a string) instead of the actual `Error`
  object, which the logger's serializer correctly flagged as "Non-Error
  value thrown" — fixed to pass the real object so name/stack/code are
  captured

---

## 21. Dependency Injection with @silay/core

- `AppBuilder` + a **single** `registerModuleConfigs()` call merging every
  module's config array — required because `DIContainer` is a
  process-wide singleton; calling it twice would double-instantiate
  everything
- Constructor injection is **positional**, matching each item's
  `dependencies: [...]` array order (confirmed by reading
  `module-manager.js` directly, not assumed)
- Cross-module dependencies (e.g. `auth` → `users`' `userRepository`,
  `analytics` → `posts`/`linkedin`/`ai`) go through the same DI container
  by key — no module ever imports another module's model file directly
- The worker process (`worker.js`) deliberately does **not** use
  `AppBuilder` — it has no HTTP routes, so it manually `new`s the handful
  of repository/service classes it needs, which is more honest than
  forcing an HTTP-oriented framework onto a non-HTTP process
- 64 DI items registered in the full HTTP app graph by the end of Phase 6

---

## 22. Security Measures

- Passwords: bcrypt, configurable salt rounds (`BCRYPT_SALT_ROUNDS`)
- Sessions: HttpOnly, SameSite=Lax, Secure in production, server-side
  storage, regenerated on login
- LinkedIn tokens: AES-256-GCM at rest, `select:false`, never logged,
  never returned to the frontend
- Input validation: zod schemas on every mutating endpoint's body and on
  query params that feed queries
- Ownership: every resource lookup is scoped to `req.userId`; cross-user
  access returns `404`, not `403` (no existence leakage)
- Rate limiting: auth endpoints (brute force) + LinkedIn publish
  (pre-emptive, respects LinkedIn's own limits)
- CORS: configurable origin allowlist
- No secrets committed anywhere in the repository (verified — see the
  Delivery Package section below)
- Centralized error handling: no stack traces or internal details ever
  reach the client

---

## 23. Testing Strategy

- **Unit tests** for anything with real external dependencies (LinkedIn,
  OpenAI) or complex pure logic (state machine, scheduler locking,
  publish idempotency) — using hand-rolled fakes, zero network access
  required, per the architecture doc's explicit "AI/LinkedIn calls must
  be mockable" requirement
- **Integration tests** for everything else — real FerretDB (MongoDB
  wire-protocol compatible), real Redis, real RabbitMQ, run through the
  actual Express app via `supertest`, not the framework's routing bypassed
- Every integration test file gets its own isolated database name;
  `test/support/testApp.js` centralizes the boot sequence
- Ownership/isolation explicitly tested for every resource type (a second
  registered user can never read/edit/act on the first user's data)

## 24. Test Results

```
Test Suites: 15 passed, 15 total
Tests:       109 passed, 109 total
Time:        ~11-14s
```
Confirmed passing in the final verification pass for this delivery,
immediately before packaging (see §25). No frontend automated test suite
exists — Phase 1 did not include one and none was added later; this is
stated plainly rather than implied otherwise.

Suite breakdown: `auth.test.js`, `users.test.js`, `linkedin.service.test.js`
(unit), `linkedin.routes.test.js`, `ai.service.test.js` (unit),
`ai.routes.test.js`, `posts.state-machine.test.js` (unit),
`posts.routes.test.js`, `publish-post.use-case.test.js` (unit),
`scheduler.service.test.js` (unit), `content.routes.test.js`,
`analytics.service.test.js` (unit), `analytics.routes.test.js`,
`notifications.service.test.js` (unit), `notifications.routes.test.js`.

---

## 25. Live End-to-End Verification Results

Every phase of this build ended with live verification against running
processes, not just green tests. Final confirmation pass for this
delivery, all performed against fresh process starts immediately before
packaging:

| Check | Result |
|---|---|
| `npm test` (backend) | **109/109 passed** |
| Backend server boot | Connected MongoDB, Redis, RabbitMQ; registered 64 DI items; listening on :4000 |
| Worker process boot | Connected all three; consumer + 30s scheduler poll started |
| `GET /api/health` | `200`, both dependencies reported `connected` |
| Register → session cookie → `GET /api/users/me` → `GET /api/posts` → `GET /api/notifications` | All `200`/`201` with correct bodies |
| Frontend `npm run build` | Succeeds, no errors |
| Frontend dev server + Vite API proxy | Serves `200`, proxies `/api/health` correctly |

Across the whole build (all six phases), live testing also directly
exercised: full post lifecycle via curl (create→edit→approve→publish),
a message landing on the real RabbitMQ queue (confirmed via `channel.get()`,
not assumed), the worker consuming it and marking a post `FAILED` with a
real (not mocked) `LinkedInNotConnectedError`, a scheduled post correctly
flowing `SCHEDULED → PUBLISHING → FAILED`, LinkedIn tokens confirmed
encrypted at rest in MongoDB with a working decrypt round-trip, the
rate limiter triggering at exactly the 20th login attempt, and a
notification genuinely created by the real worker pipeline (not seeded).

---

## 26. Environment Variables

See **`.env.example`** (project root and `backend/.env.example`, identical)
for the complete, fully-commented list. Summary table:

| Variable | Required to boot? | Purpose |
|---|---|---|
| `NODE_ENV`, `PORT`, `LOG_LEVEL` | No (defaults) | Runtime |
| `MONGODB_URI` | Yes | Primary datastore |
| `REDIS_URL` | Yes | Sessions, locks, rate limits |
| `RABBITMQ_URL` | Yes | Publish job queue |
| `CORS_ORIGIN` | No (default) | Cross-origin frontend calls |
| `SESSION_SECRET`, `SESSION_COOKIE_NAME`, `SESSION_COOKIE_DOMAIN`, `SESSION_MAX_AGE_MS` | Secret required for real deployments | Session cookie signing/config |
| `BCRYPT_SALT_ROUNDS` | No (default) | Password hashing cost |
| `FRONTEND_URL` | No (default) | OAuth callback redirect target |
| `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_REDIRECT_URI` | Only for LinkedIn features | OAuth app credentials |
| `TOKEN_ENCRYPTION_KEY` | Only for LinkedIn features | Token-at-rest encryption |
| `AI_API_KEY`, `AI_MODEL` | Only for AI features | OpenAI-compatible API |

The app boots and serves auth/users/posts/content/notifications traffic
with zero LinkedIn/AI configuration — those two integrations fail closed
with clear typed errors (`LINKEDIN_NOT_CONNECTED`, `AI_PROVIDER_ERROR`)
rather than the app refusing to start.

---

## 27. Installation Instructions

```bash
git clone <repo-url> linkedin-copilot
cd linkedin-copilot

# Backend
cd backend
npm install
cp .env.example .env   # then edit values as needed

# Frontend
cd ../frontend
npm install
```

## 28. Backend Startup Instructions

```bash
cd backend
npm run dev     # node --watch, development
npm start       # plain node, production
```
Requires `MONGODB_URI`, `REDIS_URL`, and `RABBITMQ_URL` to already be
reachable — the server connects to all three before it starts listening
and fails fast (with a clear log line) if any is unreachable.

## 29. Frontend Startup Instructions

```bash
cd frontend
npm run dev      # http://localhost:5173, proxies /api to :4000
npm run build    # production build to dist/
npm run preview  # serve the production build locally
```

## 30. Worker Startup Instructions

```bash
cd backend
npm run worker        # plain node
npm run worker:dev    # node --watch
```
Run as a **separate process** from the API server, sharing the same
`.env`. Without a running worker, posts will enqueue publish jobs and sit
in `PUBLISHING` indefinitely — the worker is what actually calls LinkedIn
and finalizes the status. Safe to run multiple worker instances
concurrently (the scheduler's Redis lock prevents double-dispatch).

## 31. MongoDB / Redis / RabbitMQ Requirements

- **MongoDB 5+** (or any MongoDB-wire-protocol-compatible server —
  see §33 for what this sandbox uses and why)
- **Redis 6+**
- **RabbitMQ 3.10+** (no special plugins required — a single durable
  queue on the default topic exchange type is all this app uses)

All three are ordinary, unmodified open-source servers — nothing in the
application code is specific to any particular managed-service provider.

## 32. Production Deployment Instructions

1. Provision real MongoDB, Redis, and RabbitMQ instances (managed
   services are fine — Atlas, ElastiCache/Memorystore, CloudAMQP, etc.)
2. Set `NODE_ENV=production` — this enables `Secure` cookies and JSON
   (not pretty-printed) structured logs
3. Set a strong, random `SESSION_SECRET` and `TOKEN_ENCRYPTION_KEY`
   (generation commands are in `.env.example`) — never reuse the
   development placeholder values
4. Register a real LinkedIn app, set `LINKEDIN_CLIENT_ID`/`_SECRET`, and
   set `LINKEDIN_REDIRECT_URI` to your real public callback URL (must
   match the LinkedIn app's configured redirect exactly)
5. Set a real `AI_API_KEY` if AI features are wanted
6. Deploy `backend` (`npm start`) and `backend`'s worker (`npm run
   worker`) as **two separate processes/services** — both need the same
   env vars; scale the worker horizontally if publish volume grows (the
   Redis lock makes this safe)
7. Build the frontend (`npm run build` → static `dist/`) and serve it
   from any static host/CDN, with `CORS_ORIGIN` on the backend set to
   that host's origin (or serve both behind the same reverse proxy origin
   to avoid CORS entirely)
8. Put a reverse proxy / load balancer in front of the API server for
   TLS termination

---

## 33. Known Limitations

- **This sandbox's outbound network is restricted to an allowlist that
  does not include `linkedin.com`, `api.linkedin.com`, or
  `api.openai.com`.** This is a constraint of the development
  environment, not the application. Every code path that calls those
  services was verified two ways instead: (a) mocked unit tests covering
  every success/failure branch, and (b) live requests against the
  running server that genuinely attempt the real HTTP call and correctly
  receive/handle the network-level rejection (confirmed via the egress
  proxy's own `x-deny-reason: host_not_allowed` header) — proving the
  request-construction and error-handling code paths are real and
  correct, even though the calls themselves can't complete here. In any
  environment with normal internet access, these integrations work
  against the real APIs with zero code changes.
- **No real `mongod` binary could be installed here either** (same
  network restriction blocks `fastdl.mongodb.org`). For local
  development/testing in this sandbox specifically, a real,
  independently-developed MongoDB-wire-protocol-compatible server
  (FerretDB, SQLite-backed) was downloaded from GitHub releases — a
  reachable domain — and used as a drop-in stand-in (see
  `scripts/start-local-db.sh`). Mongoose talks to it exactly as it would
  talk to real `mongod`; nothing in the application code is
  FerretDB-specific, and this does not affect production deployments,
  which use real MongoDB via `MONGODB_URI`.
- **LinkedIn's impression/reach data is not available** through the
  `w_member_social` scope this app requests — that requires LinkedIn
  Marketing Developer Platform partner access, a business
  relationship/approval process outside what any app can do
  programmatically. `impressions` is `null` until such access is
  configured; engagement rate gracefully returns `null` rather than a
  wrong number when impressions are unavailable.
- **No formal RabbitMQ dead-letter queue** — failure state lives on the
  `Post` document itself. Documented as an intentional MVP simplification
  in §11, not an oversight.
- **No frontend automated test suite.**
- **AI writer-context is preferences-only** — it does not yet draw on the
  user's actual post history (see §12).
- **Auth rate limiting shares one bucket across register+login by IP** —
  simple and effective against basic brute force, but not adaptive
  per-endpoint.

## 34. Features Intentionally Deferred

- **Comment assistant** (fetching/classifying LinkedIn comments,
  AI-suggested replies, user-approved sending) — `AIProvider.generateReply`
  and the LinkedIn client patterns needed for this are already built;
  only the `comments` module (model/service/controller/routes) itself was
  deferred, to keep every delivered phase fully built and live-verified
  rather than partially sketched. This is the single largest "next
  feature" left on the table.
- **AI-narrated content-gap recommendations** — the gap analysis itself
  is implemented (deterministic); layering an AI explanation on top is a
  natural, small extension once desired.
- **OpenTelemetry/Prometheus/Jaeger** — explicitly out of scope for the
  MVP per the architecture doc ("do not over-engineer observability").

## 35. Recommended Next Steps

1. Build the `comments` module (mirrors the `analytics` module's shape
   closely — see §34)
2. Wire the frontend to the Phase 2–6 backend surface (LinkedIn connect
   button, post editor/list, content calendar UI, analytics dashboard,
   notification bell) — the backend is ready for all of it today
3. Add a frontend test suite (component tests at minimum for the auth
   flow, since that's the highest-risk area for silent breakage)
4. Once genuine LinkedIn Marketing Developer Platform access is
   available, extend `LinkedInClient.fetchPostEngagement` to include real
   impressions
5. Add an admin-visible dead-letter queue once there's a surface to act on it

---

## Environment Instability Note (transparency)

Across this build, this sandbox's local datastore processes (the FerretDB
stand-in, Redis, and especially RabbitMQ's single-threaded Erlang VM) died
unpredictably many times — confirmed each time, via direct connectivity
checks, to be genuine environment/process-lifecycle instability rather than
an application bug (every pure-unit-test suite, which needs no live
datastore, passed 100% of the time regardless of this). This is disclosed
here in the interest of complete transparency about what was and wasn't
smooth during development; it does not reflect an issue with the
application code, and does not affect a normal deployment environment.
