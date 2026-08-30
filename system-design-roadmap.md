# System Design & Scalability Roadmap — Exam Paper Generator

This is a different kind of document from the other two in this repo. `gap.md` covered things that were **broken** — bugs, security holes, dead code. `preparation.md` covers how to **talk about** this system in an interview — the architecture and trade-offs as they exist today. This document is about what would genuinely make the system **better and bigger**: real scalability levers, production-maturity features, and portfolio-worthy additions — organized by effort and payoff, not by urgency, because none of this is broken.

Treat it as a menu, not a to-do list. Nothing here should be built until we've picked what's actually worth the time.

---

## Tier 1 — High value, moderate effort (best interview signal per hour spent)

- [x] **Access/refresh token split.** Today's JWT is trusted for a flat 7 days, with the only revocation check being the `isActive` DB lookup added this session (`Backend/middleware/rbac.js`). A short-lived access token (~15 min) + a refresh token + a `/api/auth/refresh` endpoint is one of the most commonly asked "how would you fix this" system-design questions — and actually having built it, not just being able to describe it, is a real differentiator.
  - **Done:** `1deb4b2`. Refresh token lives in an httpOnly/secure/sameSite=None cookie scoped to `/api/auth`, rotated on every use; verified cross-origin (frontend and backend served from genuinely different ports, not the dev proxy).

- [x] **Cursor-based pagination.** `ManageUsers.jsx`/`superAdminController.js` and `TeacherDashboard.jsx`/`getExams` both paginate with `skip`/`limit` today — already flagged as a discussion point in `preparation.md` (Q13) but never implemented. Switching to `{_id: {$gt: cursor}}.limit(n)` is a concrete, well-scoped, well-understood upgrade with an obvious before/after story.
  - **Done:** `1deb4b2`. One real trade-off shipped along with it: no more jump-to-arbitrary-page, since that's inherent to cursor pagination — the UI is Prev/Next only now, with total/page-count still shown.

- [x] **Centralized error handling + structured logging.** Every controller has its own try/catch with a slightly different error shape today. One `app.use(errorHandler)` at the bottom of `server.js`, a request-id middleware, and a real logger (pino is fast and lightweight) instead of scattered `console.log`/`console.error` calls would make the API's failure modes consistent and traceable.
  - **Done:** `1deb4b2` (`utils/logger.js`, `middleware/errorHandler.js`, pino-http).

- [x] **A real health-check endpoint.** `GET /` currently just returns the string `"Backend Running..."`. A `/healthz` that actually checks Mongo connectivity is what a load balancer, uptime monitor, or Render health check expects — and it's a five-minute addition.
  - **Done:** `1deb4b2`.

- [x] **Docker + docker-compose.** No `Dockerfile` exists anywhere in the repo today. Containerizing both services plus a `docker-compose.yml` (backend + frontend + a local Mongo) gets you true one-command setup for a new contributor, and "can you containerize your app" is a very visible, very checkable interview/portfolio signal for relatively little effort.
  - **Done.** `Backend/Dockerfile`, `Frontend/Dockerfile` (multi-stage: Vite build → nginx), `Frontend/nginx.conf` (SPA fallback), `docker-compose.yml` (backend + frontend + mongo). Verified with `docker compose up --build`: backend connects to the compose-network Mongo and seeds a superadmin, frontend's nginx serves the build and correctly falls back to `index.html` on client-side routes, and a full login → invite → toast → delete flow works through the two containers as genuinely separate origins (`:8080` / `:5000`). One real bug caught along the way: `pino-pretty` is a devDependency, so the image needs `NODE_ENV=production` or the pretty-print transport can't resolve and the process crashes at boot.

## Tier 2 — Real scalability levers (matter once traffic or data actually grows)

- **Redis cache** for the question bank and published-exam metadata — both read-heavy and rarely-changing, a textbook cache-aside candidate, and a natural companion to the indexing work already done.
- **Move email off the request path.** `sendMail()` (`Backend/utils/mailer.js`) still runs synchronously inside register/invite/forgot-password. A real queue (BullMQ + Redis), or even a minimal in-process async job runner to start, decouples SMTP latency from API latency and gets retry-with-backoff essentially for free.
- **MongoDB transactions** for operations that should be atomic but currently aren't — e.g. `deleteExam` in `adminController.js` deletes a batch of `Submission`s and then the `Exam` as two separate operations. Wrapping this in `session.withTransaction` is the correct fix and a good concrete example to cite for "when do you reach for transactions in Mongo."
- **Full-text search** on the question bank (a Mongo text index) — teachers can currently only search exams by title, not questions by content, which becomes a real usability gap as the bank grows.
- **Per-account rate limiting**, not just per-IP — the current `express-rate-limit` setup in `server.js` is IP-keyed only, which doesn't stop a determined attacker rotating IPs against one account.

## Tier 3 — Bigger features (portfolio "wow factor" — pick at most one)

- **Real-time exam monitoring** (Socket.io) — a teacher-facing live view of which students are currently taking an exam and their progress. Strong "I understand real-time systems" signal, non-trivial but well-scoped.
- **Analytics/reporting dashboard** — aggregation-pipeline-driven views: score distributions per exam, question-bank coverage per subject/difficulty, teacher activity over time. A concrete way to demonstrate real MongoDB aggregation skill, not just CRUD.
- **Result export** (CSV/PDF) for a published exam's submissions — a genuinely useful teacher-facing feature that's also a clean, contained scope.
- **OpenAPI/Swagger docs** generated from the existing routes — low effort, professional polish, and useful the moment this API needs to be consumed by anything other than its own frontend.

## Tier 4 — Large, worth a deliberate discussion before committing

- **TypeScript migration** (backend at minimum) — a real, legitimate signal, but a large lift that touches nearly every file. Worth a conscious yes/no rather than starting it opportunistically alongside something else.
- **Multi-tenancy** (multiple institutions on one deployment) — a genuine architecture change (tenant-scoped data, almost certainly a `tenantId` on every collection). Only worth it if the actual product direction calls for serving more than one institution.

---

## Running it with Docker

```bash
docker compose up --build   # backend :5000, frontend :8080, mongo :27017
docker compose down         # stop (add -v to also wipe the mongo volume)
```

The compose backend points at the local `mongo` container, not your real `.env`'s `MONGO_URI`/`FRONTEND_URL` — `docker-compose.yml`'s `environment:` block deliberately overrides those two on top of everything else `env_file` loads from `Backend/.env`. First boot seeds a fresh default superadmin (`superadmin@example.com` / `SuperAdmin@123`) into that empty database, same as local dev.

---

**Next step:** pick a tier — or a specific item within one — and we'll scope it out properly and work through it the same way we worked through `gap.md`, one item at a time.
