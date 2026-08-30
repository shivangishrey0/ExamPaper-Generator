# Interview Preparation Notes — Exam Paper Generator (MERN)

How to use this doc: it's split into two tracks. **Track A** is for SDE-style interviews (system design, architecture, data modeling, scalability, coding). **Track B** is for SDET/QA-style interviews (test strategy, edge cases, automation, CI). Every answer is grounded in what this codebase *actually* does — file paths are cited so you can go re-check the real code before an interview, and several answers deliberately include the project's real flaws, because being able to critique your own system honestly is itself a strong signal in interviews.

---

# TRACK A — SDE / System Design Interview Questions

## Section 1: Project Overview

### Q1. Give a 60-second elevator pitch of this project.
**A.** It's a role-based online exam platform for institutions. There are three roles: **Superadmin** (owns the platform, invites users, manages accounts), **Teacher** (builds a question bank, generates exam papers automatically from that bank, grades submissions), and **Student** (takes timed exams with webcam proctoring, sees results after grading). The interesting engineering pieces are: JWT-based auth with permissions embedded directly in the token, a randomized paper-generation algorithm that pulls questions by subject/difficulty/type, and a two-service deployment (React SPA on Vercel talking to an Express API on Render) that introduces real cross-origin and environment-parity challenges.

### Q2. What is the tech stack, and why do these choices make sense at this scale?
**A.**
- **Frontend**: React 18 + Vite 5 + Tailwind CSS + `react-router-dom` v6. No Redux — auth/session state lives in a small **Context API** provider (`Frontend/src/Components/AuthContext.jsx`) backed by `localStorage`. No axios — plain `fetch`.
- **Backend**: Node.js + Express **5** + Mongoose **9** (ESM, `"type": "module"` in `Backend/package.json`).
- **Auth**: `jsonwebtoken` + `bcryptjs`.
- **Email**: `nodemailer` over Gmail SMTP.
- **File ingestion**: `multer` (temp storage) + `xlsx` (parsing bulk question uploads).
- **Database**: MongoDB Atlas (cloud-hosted).

Why this makes sense here: this is a small-to-mid-size CRUD-and-auth application with no heavy real-time or high-throughput requirements, so a monolithic Express API + a single MongoDB cluster is proportionate — you don't need microservices, message queues, or a dedicated cache layer at this scale. Context API is enough because the app only really shares one piece of global state (the logged-in user's session); reaching for Redux would be over-engineering. The honest trade-off is discussed in Q12.

## Section 2: High-Level Design (HLD)

### Q3. Design the High-Level Design (HLD) for this website.
**A.** The system is two **independently deployed** services talking over HTTPS, plus one managed database and one external email provider:

```
                                   ┌───────────────────────┐
                                   │   Gmail SMTP (587/465) │
                                   │  OTP / invite / reset  │
                                   │        emails          │
                                   └───────────▲────────────┘
                                               │ nodemailer
                                               │
┌─────────────┐   HTTPS + CORS      ┌──────────┴───────────┐        ┌───────────────────────┐
│   Browser    │──── fetch() ───────▶│  Node.js / Express 5  │───────▶│    MongoDB Atlas       │
│  React SPA   │◀─── JSON ───────────│   REST API (Render)   │◀───────│ Users / Questions /    │
│              │                     │  JWT auth + RBAC       │        │ Exams / Submissions    │
└──────▲───────┘                     │  middleware layer      │        └───────────────────────┘
       │ static build served via
       │
┌──────┴───────┐
│ Vercel Edge/  │   vercel.json → SPA catch-all rewrite "/(.*)" → "/"
│    CDN        │   (client-side routing support only — no API proxy)
└───────────────┘
```

Key HLD talking points:
- **Two separate hosting providers** (Vercel for the SPA, Render for the API) means every request is cross-origin — this is *why* CORS configuration is a first-class architectural concern here, not an afterthought (see the git history — CORS was fixed and re-broken three separate times: `7042d96`, `9d2cde8`, `0daef8d`).
- The frontend discovers the backend's address via a **build-time env var** (`VITE_API_URL`, read in `Frontend/src/api.js`), with a hardcoded fallback URL baked in for production. Vite env vars are inlined at build time, not read at runtime, which matters if you ever need to change the backend URL without a rebuild.
- There is **no API gateway, no reverse proxy, no load balancer, no cache layer** in front of the API today — a single Express process handles everything. That's a legitimate scale ceiling to be honest about (see Q9).
- **No message queue** — email sending (`Backend/utils/mailer.js`) happens synchronously, inline, inside the HTTP request/response cycle of register/invite/forgot-password. If Gmail SMTP is slow, the whole request blocks and can time out (which is exactly what the `SMTP_TIMEOUT_MS = 12000` + multi-port retry logic added to `mailer.js` was trying to work around).

### Q4. Design the database schema (LLD) for this system.
**A.** Four collections, MongoDB/Mongoose, connected by ObjectId references:

```
User ─────────────────────┐
 { username, email(unique),│
   password, role: enum   │  1 : N  (createdBy)
   [superadmin|teacher|    ├────────────────────▶ Exam
    student], isActive,    │                     { title, subject, totalMarks,
    isVerified, otp,       │                       createdBy → User,
    otpExpiry, inviteToken,│                       questions: [ObjectId → Question],
    inviteExpiry }         │                       isPublished, duration(min), createdAt }
                           │                            │
                           │                            │ N : N (embedded as ref array)
                           │                            ▼
                           │                        Question
                           │                     { questionText, subject, difficulty (free text!),
                           │                       section, options: [String],
                           │                       questionType: enum[mcq|short|long],
                           │                       correctAnswer (required only if mcq) }
                           │
                           │  1 : N (studentId)         Exam 1 : N Submission
                           └────────────────────▶ Submission
                                                { examId → Exam, studentId → User,
                                                  answers: Object (raw, {questionId: answer}),
                                                  score, isGraded, createdAt }
```

Notable design decisions worth defending in an interview:
- **`Submission.answers` is a raw, un-typed `Object`** (`{questionId: answer}`) rather than an array of typed subdocuments. This is a deliberate flexibility trade-off — it lets one schema store MCQ answers, short answers, and long answers without a discriminator/union type — at the cost of losing schema validation on that field entirely.
- **`Question.difficulty` is a free-text `String`, not an enum**, while the paper-generation code matches it against fixed regex synonyms (`/^(easy|simple)$/i`, `/^(medium|avg)$/i`, `/^(hard|difficult)$/i`). This is a real inconsistency (flagged in `gap.md`) — a good interview answer is to say you'd promote `difficulty` to a proper enum to make the two sides agree by construction rather than by convention.
- **No compound unique index on `Submission(examId, studentId)`**, even though the business rule is "one submission per student per exam." That rule is currently enforced only in application code (a `findOne` existence check before insert), which is a classic TOCTOU (time-of-check-to-time-of-use) race condition under concurrent requests.
- **Only `User.email` has an index** (implied by `unique: true`). `Exam.createdBy`, `Question.subject/questionType/difficulty` (queried on *every* paper generation), and `Submission.examId/studentId` have none — fine at today's data volume, a real bottleneck at scale.

## Section 3: Authentication & Authorization

### Q5. How does authentication and RBAC work end-to-end?
**A.** JWT-based, stateless auth, with **permissions embedded directly in the token** rather than looked up per-request:

```
Client                         Express API                          MongoDB
  │  POST /api/auth/login        │                                     │
  │  { email, password }         │                                     │
  ├───────────────────────────────▶                                    │
  │                               │ User.findOne({ email })            │
  │                               ├─────────────────────────────────────▶
  │                               │◀─────────────────────────────────────
  │                               │ bcrypt.compare(password, hash)     │
  │                               │ permissions = ROLE_PERMISSIONS[role]│
  │                               │ jwt.sign({ userId, name, role,     │
  │                               │   permissions }, JWT_SECRET,       │
  │                               │   { expiresIn: "7d" })             │
  │◀───────────────────────────────  200 { token, role, permissions } │
  │                               │                                     │
  │  GET /api/teacher/exams       │                                     │
  │  Authorization: Bearer <jwt>  │                                     │
  ├───────────────────────────────▶                                    │
  │                        verifyToken()  → jwt.verify(token, SECRET)  │
  │                        requireRole("teacher","superadmin")         │
  │                        requirePermission("view_submissions")       │
  │                               ├─────────────────────────────────────▶ query
  │◀───────────────────────────────  200 [...exams]                    │
```

The static permission map (`Backend/utils/permissions.js`) is:
```js
superadmin: ["manage_users", "create_exam", "publish_exam", "grade", "view_submissions"]
teacher:    ["create_exam", "publish_exam", "grade", "view_submissions"]
student:    ["take_exam", "view_own_results"]
```
Middleware chain lives in `Backend/middleware/rbac.js`: `verifyToken` (checks the `Bearer` header, verifies the JWT signature) → `requireRole(...roles)` (checks `req.user.role` is in an allow-list) → `requirePermission(perm)` (checks `req.user.permissions.includes(perm)`). Routes stack these middlewares per-endpoint, e.g. `teacher.js`'s `publish/:id` route requires role `teacher`/`superadmin` **and** permission `publish_exam`.

Important nuance to raise proactively: **the JWT is trusted for its full 7-day lifetime with no re-check against the database.** If a superadmin deactivates a teacher or changes their role, that teacher's existing token still has the old `role`/`permissions` baked in and keeps working until it naturally expires — there's no server-side revocation list or short-lived-token+refresh-token pattern. That's a real gap, and naming it unprompted is a good interview move (see also Q10 and `gap.md`).

## Section 4: Core Feature Flows

### Q6. Walk through the exam paper generation algorithm.
**A.** Endpoint: `POST /api/teacher/generate-paper` → `Backend/controllers/adminController.js`'s `generatePaper`:

```
Input: { title, subject, paperType, duration, easyCount, mediumCount, hardCount,
          mcqCount, shortCount, longCount }
        │
        ▼
 subjectRegex = new RegExp(`^${subject.trim()}$`, "i")   // anchored, case-insensitive
        │
        ▼
 switch (paperType):
   "mcq_only"        → 3 queries: mcq questions matching difficulty ∈ {easy|simple},
                                    {medium|avg}, {hard|difficult} (regex synonyms)
   "subjective_only" → 2 queries: questionType short, questionType long
   "mixed"           → 3 queries: mcq + short + long (no difficulty split)
   (anything else)   → falls through all branches → empty question list
        │
        ▼
 selectRandomQuestions(bucket, N):
     shuffleArray(bucket)   // Fisher–Yates, O(n)
     .slice(0, min(N, bucket.length))
        │
        ▼
 questions = [...picked from each bucket]
 if questions.length === 0 → 400 "no matching questions"
 else → Exam.create({ title, subject, createdBy, questions: [ids], isPublished:false, duration })
```

Complexity: each difficulty/type bucket query is O(matching docs) (no compound index today, so it's a collection scan filtered by regex — a candidate for indexing at scale), and the shuffle+slice is O(bucket size) per bucket. There's no protection against duplicate questions across buckets because each bucket comes from an independent, non-overlapping query (different `difficulty`/`questionType` filters), so overlap isn't actually possible by construction — a nice detail to point out if asked "how do you avoid picking the same question twice."

Two things worth flagging as an engineer reviewing your own design: (1) `subjectRegex` is built directly from raw user input with no escaping — a subject string containing regex metacharacters changes the query's meaning, and a pathological pattern could cause a slow regex scan; (2) an unrecognized `paperType` silently produces zero questions instead of a clear validation error.

### Q7. Walk through the exam-taking flow, student side.
**A.** `Frontend/src/Pages/TakeExam.jsx`, roughly the most complex component in the app, has three steps:
1. **Instructions step** — student must grant webcam permission (`react-webcam`'s `onUserMedia` callback) before the "I Agree & Start Exam" button is enabled — this is the (client-side-only) proctoring gate.
2. **Test step** — one question at a time; MCQ renders as styled radio buttons, short/long render as a `<textarea>`; a `setInterval`-driven countdown timer auto-submits at zero; every keystroke writes to `localStorage` under `exam_autosave_${examId}`, plus a full autosave sweep every 15 seconds, so a browser crash/refresh doesn't lose progress; a sidebar shows the live webcam feed and a clickable grid to jump between question numbers.
3. **Submitted step** — confirmation screen; if the student reloads a previously-submitted exam, an "already submitted" guard (read from the exam payload's `status` field) prevents re-entry.

### Q8. How is grading implemented?
**A.** Two layers. **Auto-grading** happens at submit time (`submitExam` in `authController.js`): for MCQ questions only, the stored answer is normalized (handles "Option A" vs "A" vs "1" style formats) and compared against `Question.correctAnswer`; the submission is saved with `isGraded: false` regardless, pending teacher review. **Manual/teacher grading** (`gradeSubmission` in `adminController.js`) recomputes an authoritative `serverScore` by re-checking every MCQ against the DB — but if the request body includes a `score`, that **client-supplied value overrides the server-computed one** (`finalScore = frontendScore ?? serverScore`). This is intentional — it's how a teacher manually scores subjective (short/long) answers that can't be auto-graded — but it also means the endpoint currently trusts a client-supplied number with no bounds check against the exam's total possible marks, which is a real gap (see `gap.md`).

## Section 5: Scalability & Trade-offs

### Q9. How would you scale this system to handle 10x–100x traffic?
**A.** In rough priority order:
1. **Add indexes** on the fields actually queried per-request: `Exam.createdBy`, compound `Question(subject, questionType, difficulty)`, compound `Submission(examId, studentId)` (also fixes the double-submission race — see Q13).
2. **Move email sending off the request path** — today `sendMail()` runs synchronously inside register/invite/forgot-password handlers; under load this serializes API latency to SMTP latency. A queue (BullMQ/SQS + a worker) decouples them and adds retry semantics for free.
3. **Add a cache layer (Redis)** for read-heavy, rarely-changing data — the question bank and published exam metadata are good candidates; this also naturally rate-limits DB load during exam-generation bursts.
4. **Horizontal scale the API** — it's already stateless (JWT, no server-side sessions), so running N Express instances behind a load balancer is a straightforward next step; the only shared state is MongoDB itself.
5. **CDN** — Vercel already serves the SPA from its edge network, so static asset delivery is already solved.
6. **Rate limiting** already exists (`express-rate-limit`, `Backend/server.js`) but only on 3 auth routes at 10 req/15min plus a global 100 req/15min — worth extending to OTP verification specifically, since a 6-digit OTP is brute-forceable within the current general limit.

### Q10. What security measures exist today, and what would you add?
**A.** Present: bcrypt password hashing (cost factor 10), JWT-signed sessions, a CORS origin allow-list, rate limiting on the three highest-risk auth routes, and role/permission-gated middleware on every protected route. Gaps worth naming unprompted (full detail in `gap.md`): the CORS policy trusts *any* `*.vercel.app` origin via a suffix check (`origin.endsWith(".vercel.app")`) combined with `credentials: true` — that's broader than intended, since it would also accept an attacker's own Vercel-hosted origin; there's no re-validation of a user's `role`/`isActive` status against the database once a JWT is issued, so deactivating an account doesn't revoke its existing tokens; and two places build a `RegExp` directly from user-supplied strings (`generatePaper`'s `subject`, the user-search `search` param) without escaping, which is both a query-semantics bug and a minor ReDoS surface.

### Q11. What does the deployment/CI-CD setup look like, and what's missing?
**A.** Frontend deploys to Vercel (`Frontend/vercel.json` — just an SPA catch-all rewrite, no `/api` proxy rule), backend deploys to Render (no committed IaC for it — build/start commands are configured out-of-band in Render's dashboard, `npm start` → `node server.js`). There is **no CI pipeline at all** — no `.github/workflows`, so nothing runs tests, linting, or a build check before code reaches production. That absence is directly responsible for real shipped bugs: e.g. most dashboards call relative `/api/...` paths that only "work" locally because of Vite's dev-server proxy, and silently 404 in production because Vercel has no equivalent rewrite — a CI step that ran a build-and-smoke-test against a deployed preview would have caught this before merge.

### Q12. What trade-offs did this design make, and what would you change starting over?
**A.** Good trade-offs for this project's scale: Context API over Redux (one piece of shared state doesn't justify a state-management library), a monolithic Express API over microservices (low team size, low request volume, no independent-scaling need between "auth" and "exams"), synchronous request/response over an event-driven architecture (traffic is bursty around exam windows but not sustained-high). Trade-offs I'd revisit: no centralized frontend API client — every page hand-rolls its own `fetch`, base URL, and auth header, which is exactly why the API-URL bug (Q11) could happen and reoccur; no shared component library, leading to real duplicated logic (pagination math, loading skeletons, password-toggle UI) copy-pasted across pages; and two parallel, redundant auth-middleware modules (`authMiddleware.js` and `rbac.js`) that should be one.

## Section 6: Quick-Fire Round

- **Why JWT over server-side sessions here?** Stateless auth means no session store to scale/replicate — fits a small stateless Express API well. Trade-off: no easy revocation (see Q5/Q10).
- **Why MongoDB over a relational DB for this domain?** The exam/question/submission shape is naturally document-like (a submission's `answers` blob varies per exam), and there are few complex multi-table joins — Mongo's flexibility outweighs the relational guarantees you'd give up, though the missing compound unique index (Q13) shows where a relational DB's constraints would have caught a bug "for free."
- **How do you stop a student from submitting an exam twice?** Today: an application-level `findOne` check before insert (has a race condition). Correct fix: a MongoDB **unique compound index** on `Submission({examId: 1, studentId: 1}, {unique: true})`, which makes the DB itself the source of truth and turns a race condition into a clean duplicate-key error the app can catch.
- **How would you add a new question type (e.g., "fill in the blank") without breaking existing exams?** Extend `Question.questionType`'s enum, add a new branch in `generatePaper`'s bucket logic and a new answer-rendering/auto-grading path — because `Exam.questions` only stores ObjectId references, existing exam documents are unaffected by the schema change.

## Section 7: Coding / Data-Structure Questions Rooted in This Codebase

- **Walk through `selectRandomQuestions`/`shuffleArray` and its time complexity.** It's a Fisher–Yates shuffle (`Backend/controllers/adminController.js`): iterate from the last index down to 1, swap each element with a random earlier-or-equal index, giving an unbiased random permutation in O(n) time and O(n) extra space (it copies the array first via spread). Then `.slice(0, min(count, list.length))` takes the first `count` — this is a correct and efficient way to pick "k random items without replacement" without needing a separate reservoir-sampling algorithm, since the full candidate list is already in memory from the DB query.
- **How would you paginate the users list efficiently if it grew to millions of rows?** The current approach (seen in `ManageUsers.jsx`/`superAdminController.js`) is offset-based (`skip`/`limit`), which gets slower as the offset grows because MongoDB still has to walk past all skipped documents. At real scale you'd switch to **cursor/keyset pagination** — paginate on an indexed, monotonically increasing field (e.g., `_id` or `createdAt`), querying `{_id: {$gt: lastSeenId}}.limit(N)` instead of `skip(N).limit(N)`.
- **How would you detect and prevent the double-submission race condition in code, not just in the DB?** Even with a unique index as the backstop, you'd want the API to handle the resulting duplicate-key error gracefully (catch it and return a clean "already submitted" 409 instead of a raw 500), and ideally use `findOneAndUpdate`/`upsert`-style atomic operations rather than "read, check, then write" wherever a business rule depends on uniqueness.

---

# TRACK B — SDET / QA Interview Questions

This project currently has close to zero real automated test coverage (one orphaned `node:test` file, not wired into `npm test`; no frontend tests; no CI). That's not a reason to skip this track — it's actually a great prompt to *reason out loud* about what a proper test strategy would look like, which is exactly what an SDET interview is probing for.

## Section 1: Test Strategy Fundamentals

### Q1. How would you structure a test pyramid for this app?
**A.** Base layer: **unit tests** for pure/isolated logic — `shuffleArray`/`selectRandomQuestions`, OTP generation/expiry checks (`utils/otp.js`), the answer-normalization logic used in both auto-grading paths, permission-map lookups (`getPermissionsForRole`). Middle layer: **integration/API tests** against a real (or in-memory, e.g. `mongodb-memory-server`) MongoDB instance — hit actual Express routes with `supertest`, covering the full register→OTP→login→protected-route chain and RBAC boundaries. Top layer: a **small number of E2E tests** (Playwright/Cypress) covering the handful of flows that actually matter end-to-end — login, generate a paper, take an exam, get graded — kept few because they're the slowest and flakiest layer.

### Q2. What unit tests would you write for the backend controllers?
**A.** For `authController`: register with an existing verified email (expect 400), register with an existing *unverified* email (expect it to overwrite the pending record and resend OTP), verify-otp with a correct/expired/wrong-format OTP, login with wrong password / inactive account / unverified account. For `generatePaper`: a subject with zero matching questions (expect 400), a `paperType` value that isn't one of the three known values (expect either a clear validation error or, as it stands today, document the current silent-empty-result behavior as a known gap). For `gradeSubmission`: verify the server-computed MCQ score matches expected input/output pairs, and verify what currently happens when a client supplies an out-of-range `score` (this doubles as documentation of the bounds-check gap in `gap.md`).

### Q3. What integration/API tests would you write for the auth flow?
**A.** Full happy path: `POST /register` → intercept/mock the outgoing email → extract the OTP from the mocked call → `POST /verify-otp` → `POST /login` → use the returned token on a protected route. Negative cases: expired OTP (freeze/advance time or write an already-expired `otpExpiry` directly into the test DB), wrong OTP, reusing an OTP after it's been consumed, hitting a protected route with no token / a malformed token / an expired token / a token signed with the wrong secret.

### Q4. How would you test RBAC — prove a student can never reach a teacher-only or superadmin-only route?
**A.** Parametrized test matrix: for every `{role, route}` pair not in that role's allowed set, assert a `403`. Concretely: log in as a student, then assert `POST /api/teacher/generate-paper` → 403, `GET /api/superadmin/users` (once that route is actually wired — see the P0 bug) → 403, and conversely that a teacher token *can* hit teacher routes but still gets 403 on `DELETE /api/teacher/delete-all-questions` (superadmin-only). This test matrix would also have caught the fact that `/api/admin`'s routes check for a `role: "admin"` that doesn't exist in the schema — no real account could ever pass that check, which is exactly the kind of dead-code bug integration tests surface early.

### Q5. What edge cases would you test around exam submission?
**A.** Double-submit race: fire two concurrent `POST /submit-exam` requests for the same student+exam and assert only one submission is persisted (this test would currently fail, exposing the missing unique index — a great "found via testing" story). Timer-expiry edge case: what happens if the auto-submit fires at the same moment the student manually clicks submit. Network-drop during autosave: verify the `localStorage` autosave value survives a page reload and is correctly restored into the exam UI. Already-submitted guard: reloading `/user/exam/:id` after submission should show the "already submitted" state, not let the student retake it.

### Q6. How would you write E2E tests for the exam-taking UI, including the webcam gate?
**A.** With Playwright, use `--use-fake-device-for-media-stream`/`launchPersistentContext` with fake media permissions granted, so `onUserMedia` fires deterministically without a real camera. Then script: land on the instructions screen → assert "Start Exam" is disabled until the fake webcam stream resolves → start the exam → answer a mix of MCQ/short/long questions → verify the question-navigation grid updates → let the timer run out (or mock `setInterval`/use a very short duration in a test-only exam) → assert auto-submit fires and the UI transitions to the submitted screen.

### Q7. How would you test the bulk Excel upload feature?
**A.** Table of upload fixtures: a well-formed `.xlsx` with all expected headers (happy path), a file with alternate header names to test the flexible header-matching logic (`Question`/`QuestionText`, `OptionA`/`Option1`/`A`), a file missing `questionText`/`subject` on some rows (expect those rows filtered out, not a hard failure), an empty spreadsheet, a non-Excel file with an `.xlsx` extension (should fail gracefully, not crash the process), and an oversized file (there's currently no Multer size limit — this test documents that gap and should get a size-limit assertion added once it's fixed).

## Section 2: Environment Parity & Process

### Q8. This app "works" in local dev but is broken in production for most authenticated pages — as an SDET, how would you design your environment/testing strategy to catch this class of bug before release?
**A.** The root cause: Vite's dev server proxies `/api/*` to `localhost:5000` (configured in `vite.config.js`), so relative fetch calls silently work locally — but that proxy doesn't exist once the app is built and deployed to Vercel, and there's no equivalent `/api` rewrite in `vercel.json`, so those same calls hit the Vercel domain and get swallowed by the SPA catch-all rewrite. This is a textbook **"works on my machine" / dev-prod parity gap**. The fix from a process standpoint: (1) never test only against `localhost` — stand up a **staging environment that mirrors production's topology** (separate frontend/backend origins, real CORS, no dev proxy) and run the E2E suite against *that*, not against `vite dev`; (2) add a smoke test that runs immediately after every deploy, hitting a handful of real authenticated endpoints through the actual deployed frontend URL; (3) treat "no dev-only shortcuts allowed in code paths under test" as a review checklist item.

### Q9. How would you approach regression testing given there's currently no CI pipeline?
**A.** First, get *something* running automatically — even a minimal GitHub Actions workflow that runs `npm run lint` and the existing (currently orphaned) `node --test` suite on every PR is better than nothing, and it would have caught that `npm run lint` itself is currently broken (an ESLint 8 flat-config vs. `--ext` flag mismatch). Then grow coverage outward from the highest-risk, highest-change-frequency areas first — auth and CORS have been touched and re-broken multiple times in this repo's git history (see `d72ae11`, `9d2cde8`, `0daef8d`, `7042d96`), which is a strong signal that's exactly where regression tests provide the most value per hour invested.

### Q10. What would you mock vs. use real in tests, and why?
**A.** **Mock**: the SMTP layer (`nodemailer`) — you never want tests sending real emails or depending on Gmail's availability/rate limits; intercept `sendMail` and assert it was called with the right OTP/subject instead. The browser's `MediaDevices`/webcam API in frontend tests — use the test runner's fake-media-stream support rather than requiring a real camera in CI. **Use real (or a faithful in-memory equivalent)**: MongoDB — `mongodb-memory-server` gives you a real Mongo engine without a shared external database, which matters here because so much business logic (RBAC, the double-submission rule, regex-based difficulty matching) is expressed as actual Mongo queries that a hand-rolled in-memory fake would likely get subtly wrong.

### Q11. How would you load/performance test paper generation and concurrent exam submissions?
**A.** For paper generation: seed a realistic-size question bank (tens of thousands of documents) and use a tool like k6 or Artillery to fire concurrent `generate-paper` requests, watching for the collection-scan cost of the unindexed `subject`/`difficulty`/`questionType` queries — this is where you'd empirically justify the indexing recommendation from Q9 (Track A) with real numbers. For submissions: simulate an entire class submitting within the same 30-second window near a timer's auto-submit deadline, which is the realistic worst case for the double-submission race condition — this test both validates the fix and demonstrates the bug if run before it.

### Q12. How would you test security-sensitive paths?
**A.** Rate limiting: script N+1 login attempts from the same client and assert the (N+1)th gets a 429, then verify the limiter windows are actually enforced for `/verify-otp` and `/reset-password` too — today they aren't, only `/login`, `/register`, and `/forgot-password` are covered, so this test currently exposes a real gap. CORS: send requests with disallowed `Origin` headers and confirm rejection, and specifically test whether an arbitrary `something-else.vercel.app` origin is (currently, incorrectly) accepted, to make the suffix-wildcard risk concrete rather than theoretical. JWT: test an expired token, a token signed with a different secret, and a tampered payload (flip the `role` claim) — all should be rejected by `jwt.verify`'s signature check. Regex injection: submit a `subject` value containing regex metacharacters (e.g., `.*`) to `generate-paper` and confirm it doesn't return unintended cross-subject results.

## Section 3: Applying It — Bug Report & CI Design

### Q13. Suppose you found the "superadmin routes 404 in production" bug during QA. How would you write it up, and what test would you add to prevent regression?
**A.** Bug report structure: **Title** — "Superadmin user-management actions (invite/list/activate/deactivate/delete) return 404 in all environments." **Steps to reproduce** — log in as superadmin, open the Manage Users tab, click "Send Invite." **Expected** — invite email sent, new pending user appears in the list. **Actual** — network tab shows a 404 on `POST /api/superadmin/invite`. **Root cause** (from code inspection) — `Backend/server.js` mounts `/api/superadmin` to `routes/admin.js` (line ~83), but that file has no invite/user-management handlers; the correctly implemented router, `routes/adminRoutes.js`, is never imported anywhere. **Severity** — P0/blocker, an entire admin feature is unusable. **Regression test** — an integration test that logs in as superadmin and asserts `POST /api/superadmin/invite` returns 200/201 with the expected response shape, added to the suite so any future re-mounting mistake fails CI immediately instead of reaching production.

### Q14. How would you set up a CI pipeline to run these tests automatically on every PR?
**A.** A GitHub Actions workflow triggered on `pull_request` with roughly these jobs: (1) **install & lint** — `npm ci` in both `Backend/` and `Frontend/`, run `npm run lint` (after fixing the current flat-config/`--ext` mismatch); (2) **backend tests** — spin up `mongodb-memory-server`, run the unit + integration suite; (3) **frontend build** — `npm run build` to catch build-breaking errors early, plus any component/E2E tests once they exist; (4) **block merge on failure** via branch protection rules requiring the workflow to pass. This single addition — currently entirely absent from the repo — is the highest-leverage process change available, since it would have caught several of the real, already-shipped bugs (broken lint script, the relative-API-path regression, the dead superadmin routes) before they reached `main`.

---

*Cross-reference: for the full list of concrete bugs and production-readiness gaps mentioned above (with file paths and fixes), see `gap.md` in the project root.*
