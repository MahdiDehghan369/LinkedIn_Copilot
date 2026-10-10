# API Documentation — LinkedIn Content Copilot

Base URL (local development): `http://localhost:4000`

## Conventions

**Authentication.** Session-based via an HttpOnly cookie (`copilot.sid` by
default). There is no bearer token. Every authenticated request must be made
with `credentials: 'include'` (browser) or a cookie jar (server-to-server /
curl `-b`/`-c`). Endpoints marked **Auth: required** return `401
AUTHENTICATION_ERROR` without a valid session.

**Request headers.** Every request with a body needs
`Content-Type: application/json`. No other headers are required.

**Response envelope.** Every response body is the endpoint's data plus a
`trackingHeaders` field added by the framework (`{ userIp, userAgent,
requestId }`) — present on every response, omitted below for brevity.

**Error shape.** Every error response has this shape:
```json
{ "message": "Human-readable message.", "code": "MACHINE_READABLE_CODE", "details": [] }
```
`details` is only present for `VALIDATION_ERROR` and is an array of
`{ path, message }`. Stack traces are never included, in any environment.

**Error codes reference:**

| HTTP | code | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Request body/query failed schema validation |
| 401 | `AUTHENTICATION_ERROR` | No valid session |
| 403 | `AUTHORIZATION_ERROR` | Authenticated but not permitted (reserved; not currently emitted — ownership violations return 404 instead, see below) |
| 404 | `NOT_FOUND` | Resource doesn't exist, or belongs to another user |
| 409 | `CONFLICT` | Valid request, but not allowed given current state (duplicate email, invalid post-status transition, etc.) |
| 409 | `INVALID_POST_TRANSITION` | Post status transition not allowed by the state machine |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests from this source |
| 401 | `LINKEDIN_AUTH_ERROR` | LinkedIn rejected/expired the access token |
| 429 | `LINKEDIN_RATE_LIMIT` | LinkedIn's own rate limit was hit |
| 400 | `LINKEDIN_VALIDATION_ERROR` | LinkedIn rejected the request content |
| 502 | `LINKEDIN_API_ERROR` | LinkedIn unavailable / unexpected response |
| 409 | `LINKEDIN_NOT_CONNECTED` | Action requires a connected LinkedIn account |
| 502 | `AI_PROVIDER_ERROR` | AI provider unavailable, not configured, or errored |
| 502 | `AI_RESPONSE_INVALID` | AI response didn't match the expected schema |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

**Ownership.** A resource that exists but belongs to another user returns
`404`, never `403` — this avoids confirming a resource's existence to a user
who shouldn't see it.

---

## Health

### `GET /api/health`
Liveness/readiness check.

- **Auth:** not required
- **Response `200`:**
```json
{ "status": "ok", "dependencies": { "mongodb": "connected", "redis": "connected" } }
```

---

## Auth

Rate limited: `authRateLimiter` (20 requests / 15 minutes per source IP,
shared across `/register` and `/login`) returns `429 RATE_LIMIT_EXCEEDED`
once exceeded.

### `POST /api/auth/register`
Creates an account and starts a session.

- **Auth:** not required
- **Body:**
```json
{ "email": "ada@example.com", "password": "super-secret-1", "name": "Ada Lovelace" }
```
  - `email`: valid email, lowercased/trimmed
  - `password`: string, 8–128 chars
  - `name`: string, 1–100 chars
- **Response `201`:**
```json
{ "user": { "id": "66f...", "email": "ada@example.com", "name": "Ada Lovelace" } }
```
- **Errors:** `400 VALIDATION_ERROR`, `409 CONFLICT` (email already registered)

### `POST /api/auth/login`
- **Auth:** not required
- **Body:** `{ "email": "...", "password": "..." }`
- **Response `200`:** same `user` shape as register
- **Errors:** `400 VALIDATION_ERROR`, `401 AUTHENTICATION_ERROR` (wrong email or password — same message for both, to avoid confirming which)

### `POST /api/auth/logout`
- **Auth:** not required (idempotent — safe to call with no active session)
- **Response `200`:** `{ "message": "Logged out successfully." }`

---

## Users

### `GET /api/users/me`
- **Auth:** required
- **Response `200`:**
```json
{
  "user": {
    "id": "66f...",
    "email": "ada@example.com",
    "name": "Ada Lovelace",
    "preferences": { "language": "English", "tone": "Neutral", "audience": "", "postingFrequency": "", "emojiUsage": "minimal" },
    "aiSettings": { "model": "default", "creativity": "medium" },
    "createdAt": "2026-08-01T12:00:00.000Z"
  }
}
```

### `PATCH /api/users/me`
Partial update — send only fields you want to change.

- **Auth:** required
- **Body (all optional):**
```json
{
  "name": "Ada L.",
  "preferences": { "tone": "Technical", "audience": "Backend Developers", "postingFrequency": "3 posts/week", "emojiUsage": "none" },
  "aiSettings": { "model": "gpt-4o-mini", "creativity": "high" }
}
```
  - `preferences.emojiUsage`: one of `none | minimal | moderate | heavy`
  - `aiSettings.creativity`: one of `low | medium | high`
  - Unknown top-level fields are rejected (`.strict()`)
- **Response `200`:** `{ "user": { ...updated } }`
- **Errors:** `400 VALIDATION_ERROR`

---

## Notifications

### `GET /api/notifications`
- **Auth:** required
- **Query params:** `unread` (optional, `true`/`false`) — filter to unread only
- **Response `200`:**
```json
{ "notifications": [
  { "_id": "...", "userId": "...", "type": "post.published", "message": "Your post was published to LinkedIn.",
    "relatedEntity": { "type": "Post", "id": "..." }, "read": false, "createdAt": "..." }
] }
```
  Notification `type` values currently emitted: `post.published`,
  `post.publish_failed`, `linkedin.expired`.

### `PATCH /api/notifications/:id/read`
- **Auth:** required
- **Path params:** `id` — notification id
- **Response `200`:** `{ "notification": { ...read: true } }`
- **Errors:** `404 NOT_FOUND`

---

## LinkedIn

Tokens are never returned by any endpoint — only connection status.

### `GET /api/linkedin/connect`
Redirects the browser to LinkedIn's OAuth authorization screen.

- **Auth:** required
- **Response:** `302` redirect to `https://www.linkedin.com/oauth/v2/authorization?...`

### `GET /api/linkedin/callback`
LinkedIn redirects the browser back here after the user approves/denies
access. Not a JSON API — always redirects the browser back into the
frontend app.

- **Auth:** required
- **Query params (from LinkedIn):** `code`, `state` on success; `error` if the user denied access
- **Response:** `302` redirect to `FRONTEND_URL/profile?linkedin=connected|denied|error`

### `GET /api/linkedin/status`
- **Auth:** required
- **Response `200`:** `{ "connected": true, "connectedAt": "...", "status": "connected" }` or `{ "connected": false }`

### `DELETE /api/linkedin/disconnect`
- **Auth:** required
- **Response `200`:** `{ "connected": false }`

---

## AI

Every endpoint calls the configured `AI_API_KEY`; without one, all four
return `502 AI_PROVIDER_ERROR` with message `"AI generation is not
configured (missing AI_API_KEY)."` — a deliberate fail-closed behavior, not
a bug.

### `POST /api/ai/ideas`
- **Auth:** required
- **Body:** `{ "count": 5, "topicHint": "Redis" }` (both optional; `count` 1–10, default 5)
- **Response `200`:**
```json
{ "ideas": [
  { "title": "...", "hook": "...", "coreIdea": "...", "contentType": "...", "audience": "...",
    "suggestedCta": "...", "suggestedHashtags": ["#redis"] }
] }
```
- **Errors:** `400 VALIDATION_ERROR`, `502 AI_PROVIDER_ERROR`, `502 AI_RESPONSE_INVALID`

### `POST /api/ai/posts/generate`
- **Auth:** required
- **Body:**
```json
{ "topic": "Redis Streams", "tone": "Technical", "audience": "Backend Developers", "length": "medium" }
```
  - `topic`: required, 1–300 chars
  - `tone`, `audience`: optional strings
  - `length`: optional, one of `short | medium | long`
- **Response `200`:** `{ "post": { "hook": "...", "body": "...", "cta": "...", "hashtags": ["..."] } }`
- **Errors:** `400 VALIDATION_ERROR`, `502 AI_PROVIDER_ERROR`, `502 AI_RESPONSE_INVALID`

### `POST /api/ai/posts/improve`
Scores an existing draft and returns an improved rewrite in one call.

- **Auth:** required
- **Body:** `{ "content": "Your draft post text..." }` (1–5000 chars)
- **Response `200`:**
```json
{ "scores": { "hook": 8, "readability": 9, "technicalValue": 7, "engagement": 6, "cta": 5 },
  "improved": { "hook": "...", "body": "...", "cta": "...", "hashtags": ["..."] } }
```
- **Errors:** `400 VALIDATION_ERROR`, `502 AI_PROVIDER_ERROR`, `502 AI_RESPONSE_INVALID`

### `POST /api/ai/analyze`
Writing-style analysis over sample posts you provide directly (no stored
post history is used — see Known Limitations in the final report).

- **Auth:** required
- **Body:** `{ "samplePosts": ["post one text", "post two text"] }` (1–20 items)
- **Response `200`:**
```json
{ "profile": { "tone": "technical-friendly", "sentenceLength": "short", "technicalDepth": "high",
  "emojiUsage": "minimal", "paragraphStyle": "short", "hookStyle": "direct", "ctaStyle": "discussion-oriented" } }
```
  Also persists this profile to the `writing_styles` collection for the user.
- **Errors:** `400 VALIDATION_ERROR`, `502 AI_PROVIDER_ERROR`, `502 AI_RESPONSE_INVALID`

---

## Posts

All endpoints scoped to the authenticated user's own posts; another user's
post id returns `404`.

### `GET /api/posts`
- **Auth:** required
- **Query params:** `status` (optional, one of the post statuses below), `page` (default 1), `pageSize` (default 20, max 100)
- **Response `200`:** `{ "posts": [ {...} ], "page": 1, "pageSize": 20, "total": 3 }`

### `POST /api/posts`
Creates a draft. Status is `GENERATED` if `sourceGenerationId` is supplied
(came from AI), otherwise `DRAFT`.

- **Auth:** required
- **Body (all optional):**
```json
{ "content": { "hook": "...", "body": "...", "cta": "...", "hashtags": ["#tag"] },
  "topicTags": ["redis", "backend"], "originIdeaId": "...", "sourceGenerationId": "..." }
```
- **Response `201`:** `{ "post": { ...status: "DRAFT" } }`

### `GET /api/posts/:id`
- **Auth:** required
- **Response `200`:** `{ "post": {...} }`
- **Errors:** `404 NOT_FOUND`

### `PATCH /api/posts/:id`
Edits content/tags. Only allowed while status is `DRAFT`, `GENERATED`, or
`EDITED`; transitions the post to `EDITED`.

- **Auth:** required
- **Body:** `{ "content": {...}, "topicTags": [...] }` (at least one required)
- **Response `200`:** `{ "post": { ...status: "EDITED" } }`
- **Errors:** `400 VALIDATION_ERROR`, `404 NOT_FOUND`, `409 CONFLICT` (not editable in current status)

### `DELETE /api/posts/:id`
Only allowed for `DRAFT`, `CANCELLED`, or `FAILED` posts.

- **Auth:** required
- **Response `200`:** `{ "message": "Post deleted." }`
- **Errors:** `404 NOT_FOUND`, `409 CONFLICT`

### `POST /api/posts/:id/approve`
Allowed from `GENERATED`, `EDITED`, or `FAILED` (retry path) → `APPROVED`.

- **Auth:** required
- **Response `200`:** `{ "post": { ...status: "APPROVED" } }`
- **Errors:** `404 NOT_FOUND`, `409 CONFLICT`

### `POST /api/posts/:id/publish`
"Publish now." Validates the post is `APPROVED`, transitions to
`PUBLISHING`, and enqueues an async publish job — does **not** wait for
LinkedIn. Poll `GET /api/posts/:id` to see it reach `PUBLISHED` or `FAILED`.

- **Auth:** required
- **Response `202`:** `{ "post": { ...status: "PUBLISHING" } }`
- **Errors:** `404 NOT_FOUND`, `409 INVALID_POST_TRANSITION`

### `POST /api/posts/:id/schedule`
- **Auth:** required
- **Body:** `{ "scheduledFor": "2026-09-01T09:00:00.000Z" }` (must be in the future)
- **Response `200`:** `{ "post": { ...status: "SCHEDULED", "scheduledFor": "..." } }`
- **Errors:** `400 VALIDATION_ERROR`, `404 NOT_FOUND`, `409 INVALID_POST_TRANSITION`

### `POST /api/posts/:id/cancel`
Allowed from any non-terminal status.

- **Auth:** required
- **Response `200`:** `{ "post": { ...status: "CANCELLED" } }`
- **Errors:** `404 NOT_FOUND`, `409 INVALID_POST_TRANSITION`

**Post status values:** `DRAFT`, `GENERATED`, `EDITED`, `APPROVED`,
`SCHEDULED`, `PUBLISHING`, `PUBLISHED`, `FAILED`, `CANCELLED`. See the
final report for the full transition table.

---

## Content

### `GET /api/content/ideas`
- **Auth:** required
- **Query params:** `status` (optional: `proposed | used | dismissed`)
- **Response `200`:** `{ "ideas": [ {...} ] }`

### `POST /api/content/ideas`
Saves an idea (typically one returned by `POST /api/ai/ideas` that the user wants to keep).

- **Auth:** required
- **Body:**
```json
{ "title": "Why Redis Streams beat polling", "hook": "...", "coreIdea": "...",
  "contentType": "technical", "audience": "Backend Developers", "suggestedCta": "...",
  "suggestedHashtags": ["#redis"] }
```
  Only `title` is required.
- **Response `201`:** `{ "idea": { ...status: "proposed" } }`
- **Errors:** `400 VALIDATION_ERROR`

### `PATCH /api/content/ideas/:id`
- **Auth:** required
- **Body:** `{ "status": "used" }` (one of `used | dismissed`)
- **Response `200`:** `{ "idea": { ...updated } }`
- **Errors:** `400 VALIDATION_ERROR`, `404 NOT_FOUND`

### `GET /api/content/calendar`
- **Auth:** required
- **Query params:** `week` (required, `YYYY-MM-DD`)
- **Response `200`:** `{ "calendar": {...} }` or `{ "calendar": null }` if none exists yet
- **Errors:** `400 VALIDATION_ERROR`

### `PUT /api/content/calendar`
Creates or replaces the calendar for a given week.

- **Auth:** required
- **Body:**
```json
{ "weekStart": "2026-08-24",
  "slots": [ { "dayOfWeek": "Monday", "time": "09:00", "topicTag": "redis" } ],
  "preferences": { "postsPerWeek": 3, "preferredDays": ["Monday", "Wednesday"], "preferredTime": "09:00" } }
```
- **Response `200`:** `{ "calendar": {...} }`
- **Errors:** `400 VALIDATION_ERROR`

### `GET /api/content/gaps`
Deterministic (no AI call) topic-coverage breakdown across the user's own posts.

- **Auth:** required
- **Response `200`:**
```json
{ "gaps": [ { "topic": "redis", "count": 3, "level": "Medium" }, { "topic": "mongodb", "count": 1, "level": "Low" } ] }
```
  `level` buckets: `High` (≥5), `Medium` (≥2), `Low` (≥1), `Very Low` (0, not returned since it's derived from actual tags present).

---

## Analytics

### `GET /api/analytics/overview`
- **Auth:** required
- **Response `200`:**
```json
{ "totalPosts": 4, "totalImpressions": 5400, "averageEngagementRate": 0.062,
  "bestPerformingPost": { "postId": "...", "engagementRate": 0.1 } }
```
  All fields are `0`/`null` gracefully when no analytics exist yet.

### `GET /api/analytics/posts/:id`
- **Auth:** required
- **Response `200`:** `{ "analytics": { "postId": "...", "impressions": 2000, "reactions": 80, "comments": 12, "reposts": 5, "engagementRate": 0.0485, "fetchedAt": "...", "history": [ {...} ] } }`
- **Errors:** `404 NOT_FOUND` (post doesn't exist/owned, or no analytics recorded yet — refresh first)

### `POST /api/analytics/posts/:id/refresh`
Pulls fresh engagement counts from LinkedIn for a published post and
records a snapshot.

- **Auth:** required
- **Response `200`:** `{ "analytics": {...} }`
- **Errors:** `404 NOT_FOUND`, `409 CONFLICT` (post not published to LinkedIn yet), plus any `LINKEDIN_*` error if the LinkedIn call fails

### `POST /api/analytics/posts/:id/insights`
AI-narrated explanation of how this post performed vs. the user's average.

- **Auth:** required
- **Response `200`:**
```json
{ "insight": { "scores": { "hook": 8, "readability": 7, "technicalValue": 6, "engagement": 8, "cta": 5 },
    "suggestions": ["..."] },
  "performance": { "engagementRate": 0.1, "averageEngagementRate": 0.075, "deltaPercent": 33.3 } }
```
- **Errors:** `404 NOT_FOUND`, `409 CONFLICT` (no analytics with a computable engagement rate yet), `502 AI_PROVIDER_ERROR`, `502 AI_RESPONSE_INVALID`

---

## Example: end-to-end curl session

```bash
# Register (also logs in — sets the session cookie)
curl -c cookies.txt -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@example.com","password":"super-secret-1","name":"Ada Lovelace"}'

# Create a draft
curl -b cookies.txt -X POST http://localhost:4000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"content":{"hook":"Stop polling your queue.","body":"Redis Streams...","cta":"Thoughts?","hashtags":["#redis"]}}'

# Edit -> approve -> publish (assume POST_ID from the response above)
curl -b cookies.txt -X PATCH http://localhost:4000/api/posts/POST_ID \
  -H "Content-Type: application/json" -d '{"content":{"hook":"Stop polling your queue!"}}'
curl -b cookies.txt -X POST http://localhost:4000/api/posts/POST_ID/approve
curl -b cookies.txt -X POST http://localhost:4000/api/posts/POST_ID/publish
```
