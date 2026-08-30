# Production Readiness Gap Checklist — Exam Paper Generator

This is a plain-language list of the gaps between **what this project does today** and **what a real production-grade system would do**. Each item explains the gap simply, why it matters, and where to fix it. Work through it top to bottom — P0 items are things that are actually broken right now for real users; the rest get progressively more "nice to have, but do it eventually."

> **Status: all items below are resolved as of 2026-08-30** — see the `**Fixed:**` note under each item for the commit(s) that addressed it. For what's next (scalability, architecture, portfolio-worthy features), see `system-design-roadmap.md`.

> ~~**Heads up before you commit anything**: your currently uncommitted change to `Frontend/src/Admin/ManageUsers.jsx` removes the correct absolute backend URL and switches to relative `/api/...` paths. That's the exact pattern causing gap **P0-2** below — please read that item before committing this file.~~ *(Resolved along with P0-2 — see below.)*

---

## P0 — Broken right now (fix before anything else)

- [x] **Superadmin "Manage Users" page doesn't work at all — invite, list, activate, deactivate, and delete all fail.**
  - **Fixed:** `9c181db`. **Correction:** the initial fix pointed `/api/superadmin` at `adminRoutes.js` on the mistaken assumption it already contained the invite/list/deactivate handlers — it never had, per git history. Actually wired up and verified end-to-end (login → list → invite → deactivate → delete, plus a 401 with no token) in `f4ee531`.
  - **Current state, in plain terms**: When a superadmin clicks "Send Invite" or opens the Manage Users tab, the request goes nowhere useful and fails. The button appears to do nothing, or shows a generic error.
  - **What production-grade looks like**: Every button in the admin panel actually reaches working server code and does what it says.
  - **Why this matters**: This isn't a minor bug — the entire superadmin account-management feature, one of the platform's core selling points, is currently unusable.
  - **What's actually going on**: There are two versions of the "admin routes" file in the backend. The correct one, with all the invite/list/activate/deactivate/delete logic already written (`Backend/routes/adminRoutes.js`), is never actually plugged into the server. Instead, the server plugs a *different*, older file (`Backend/routes/admin.js`) into that same web address, and that file simply doesn't have those features.
  - **Where to fix it**: `Backend/server.js` — change the line that wires up `/api/superadmin` so it uses `Backend/routes/adminRoutes.js` instead of `Backend/routes/admin.js` (or merge the missing handlers into `admin.js` — either works, just pick one and remove the other file to avoid future confusion).

- [x] **Most of the app (teacher dashboard, student dashboard, taking an exam, grading) silently breaks once deployed live, even though it works fine on your own computer.**
  - **Fixed:** `9c181db`. All pages migrated to the shared `apiFetch` helper in `45a60c5`.
  - **Current state, in plain terms**: On your laptop, when the app asks the server for data, there's an invisible helper (part of the local dev tool) that quietly forwards those requests to the right place. That helper only exists while you're developing — it disappears once the site is actually published. So in production, those same requests go to the wrong address and get back a webpage instead of real data, and the page just fails to load properly.
  - **What production-grade looks like**: The exact same code should behave identically whether it's running on your laptop or live on the internet — no invisible local-only shortcuts.
  - **Why this matters**: This affects almost every screen a logged-in teacher or student actually uses day to day — not an edge case, the core product.
  - **Where it's happening**: `Frontend/src/Admin/TeacherDashboard.jsx`, `Frontend/src/User/UserDashboard.jsx`, `Frontend/src/Pages/TakeExam.jsx`, `Frontend/src/Admin/AdminCheckPaper.jsx`, `Frontend/src/Admin/AdminViewPaper.jsx`, and now also `Frontend/src/Admin/ManageUsers.jsx` (this exact mistake was just introduced there in your uncommitted changes — it used to be correct).
  - **Fix**: Make every page use the same shared helper that already exists and is correct (`Frontend/src/api.js`'s `API_URL`) instead of each page guessing the address on its own. That one shared helper should be the *only* place that knows the backend's web address.

- [x] **A whole section of the backend (`/api/admin`) can never be used by anyone, because it checks for a type of account that doesn't exist.**
  - **Fixed:** `9c181db` (mount removed, `admin.js` deleted).
  - **Current state, in plain terms**: Part of the server's code is guarded by "only let this through if the account's role is `admin`." But no account in this system can ever have that role — the only roles that exist are Superadmin, Teacher, and Student. So this entire section is permanently locked, for everyone, forever.
  - **What production-grade looks like**: Every piece of deployed code should be reachable by *someone*, or it should be deleted.
  - **Why this matters**: It's not causing a visible bug today (because the equivalent, working features were rebuilt elsewhere under `/api/teacher`), but it's confusing dead weight that could mislead the next person working on this code into thinking it's the "real" admin system.
  - **Where to fix it**: `Backend/routes/admin.js` and `Backend/middleware/authMiddleware.js` — either delete this unreachable code path, or repurpose it properly.

---

## P1 — Security gaps

- [x] **The default superadmin login (published in the README) is probably still the real, working login for production.**
  - **Fixed:** `3446fcf` (README scrubbed). Setting real `SUPERADMIN_*` env vars in production is still on you — not something fixable from this repo.
  - **Plain terms**: The project's public README shows an example superadmin email and password so people know how to log in during setup. Normally you're expected to change these before going live. Looking at the actual production settings, the values needed to override those defaults were never set — meaning the "example" login in a public document may literally be the real admin login on the live site.
  - **Why it matters**: Anyone who reads the README (which is public on the code hosting site) could potentially log in as the platform owner.
  - **Fix**: Set real, private values for the superadmin email/name/password in the production environment settings, then update or remove the example from the README.

- [x] **The site accepts login requests from *any* website hosted on Vercel, not just your own.**
  - **Fixed:** `3446fcf`.
  - **Plain terms**: To let your own frontend talk to your backend, the backend has to say "yes, I trust requests coming from my frontend's address." Right now, instead of trusting just your specific frontend address, it trusts *any* address that happens to end in `.vercel.app` — including a website some stranger deployed on Vercel that has nothing to do with your project.
  - **Why it matters**: Combined with the fact that the site also allows those requests to carry login credentials, this widens the door further than it should be.
  - **Fix**: In `Backend/server.js`, remove the "anything ending in .vercel.app is trusted" rule and only trust your actual, specific frontend address(es).

- [x] **The one-time codes (OTP) sent by email for verification/password-reset have no limit on how many times someone can guess them.**
  - **Fixed:** `3446fcf`.
  - **Plain terms**: When you reset your password, the site emails you a 6-digit code. There's no limit on how many times someone can try guessing that code, other than a very generous general limit that applies to the whole site.
  - **Why it matters**: A 6-digit code only has a million possibilities — without a tight limit on guesses, it's realistically guessable by an automated script.
  - **Fix**: Add the same strict "10 tries per 15 minutes" style limit that already protects login/registration to the OTP-verification and password-reset endpoints too. (`Backend/server.js`, near the existing rate-limit setup.)

- [x] **Search boxes and the exam-generation form pass what you type almost directly into a low-level pattern-matching engine, without cleaning it first.**
  - **Fixed:** `3446fcf` (`Backend/utils/sanitize.js`'s `escapeRegex`, applied everywhere a search/subject builds a `RegExp`).
  - **Plain terms**: When a teacher generates a paper by subject, or a superadmin searches the user list, the text they type gets used to build a "search pattern" behind the scenes. If that text contains certain special characters, it can change what the search actually matches, or in rare cases make the search unusually slow.
  - **Why it matters**: It's a low-effort way for a user to get unexpected results or degrade performance; it's not a catastrophic hole, but it's an easy, well-known thing to close.
  - **Fix**: Escape special characters out of user-typed text before using it to build a search pattern (`Backend/controllers/adminController.js`'s `generatePaper`, and the user-search code in `superAdminController.js`).

- [x] **Uploading a question-bank spreadsheet has no limit on file size or file type.**
  - **Fixed:** `3446fcf` (5MB cap, `.xlsx`/`.xls` only, clean JSON error on rejection).
  - **Plain terms**: The "bulk upload questions" feature will accept literally any file of any size, and only figures out it's not a real spreadsheet after already saving it to the server's disk.
  - **Why it matters**: Someone could accidentally (or deliberately) upload huge or malformed files repeatedly and fill up the server's storage, or crash the upload feature.
  - **Fix**: Add a maximum file size and restrict accepted file types before the file is even saved, in `Backend/routes/teacher.js`/`admin.js` where the upload tool (Multer) is configured.

- [x] **Deactivating or changing someone's role doesn't actually cut off their access right away.**
  - **Fixed:** `3446fcf` (`verifyToken` re-checks `isActive` against the DB on every request).
  - **Plain terms**: A logged-in session is like a temporary keycard that's valid for 7 days. If a superadmin deactivates a teacher's account, that teacher's existing keycard keeps working for up to 7 more days — the system never actually "takes the keycard back."
  - **Why it matters**: If you ever need to urgently cut someone off (a compromised account, a fired employee), the system can't currently do that instantly.
  - **Fix**: This is a bigger structural change — options include storing a "logged out" flag per user that gets checked on every request, or moving to shorter-lived sessions with a renewal step. Worth planning, not necessarily urgent for a small platform.

- [x] **The site doesn't set the standard set of protective browser security headers.**
  - **Fixed:** `3446fcf` (`helmet`, with `crossOriginResourcePolicy` explicitly set so it doesn't break the cross-origin frontend).
  - **Plain terms**: There are a handful of well-known, "just turn it on" security settings (like preventing your site from being embedded in someone else's page) that most production sites enable by default using a small library. This project doesn't currently do that.
  - **Fix**: Add the `helmet` package to the backend (`Backend/server.js`) — it's a five-minute addition that turns on sensible defaults.

---

## P2 — Data integrity & correctness gaps

- [x] **A student can potentially submit the same exam twice if they click submit at just the wrong moment (or from two tabs).**
  - **Fixed:** `9c63839` (unique `(examId, studentId)` index; `submitExam` catches the duplicate-key error cleanly).
  - **Plain terms**: The system currently checks "has this student already submitted?" and then, a moment later, saves the new submission — but nothing stops two of those checks from happening at almost the exact same instant and both passing, before either save has finished.
  - **Why it matters**: Data integrity — a student could end up with two graded attempts, or their score could get overwritten unexpectedly.
  - **Fix**: Tell the database itself "never allow two submissions with the same student+exam combination" (a unique index), so the database rejects the duplicate outright instead of relying on the app noticing in time. (`Backend/models/submission.js`.)

- [x] **When a teacher grades a paper, the score they type in is trusted completely, with no sanity check.**
  - **Fixed:** `9c63839`.
  - **Plain terms**: The grading screen recomputes the automatic (MCQ) part of the score correctly on the server, but if any score value is sent from the browser, it's used as-is — even if it's negative, or higher than the exam's total possible marks.
  - **Why it matters**: A typo, a bug in the grading page, or a tampered request could result in nonsensical scores being saved and shown to students.
  - **Fix**: Before saving, check the incoming score is a real number between 0 and the exam's maximum possible marks. (`Backend/controllers/adminController.js`'s `gradeSubmission`.)

- [x] **A question's "difficulty" can be typed as literally anything, but paper generation only recognizes a few specific words.**
  - **Fixed:** `9c63839` (fixed `Easy`/`Medium`/`Hard` enum on the model; bulk-upload path normalizes into it).
  - **Plain terms**: When adding a question, "difficulty" is a free-text box — a teacher could type "Easy," "easyy," or "Hard-ish." But when generating a paper, the system only looks for a small fixed list of accepted words (like "easy"/"simple," "medium"/"avg," "hard"/"difficult"). Anything outside that list is just silently skipped — the question exists, but can never actually get picked for a paper, with no warning to anyone.
  - **Why it matters**: Teachers could build up a question bank with dozens of "invisible" questions that never appear in generated papers, and never know why.
  - **Fix**: Turn "difficulty" into a fixed dropdown with only the accepted options, both when adding a question and when uploading via spreadsheet. (`Backend/models/Questions.js`, `Frontend/src/Admin/TeacherDashboard.jsx`.)

- [x] **The database has almost no indexes, which will make things slow as more data piles up.**
  - **Fixed:** `9c63839` (verified live against the DB).
  - **Plain terms**: Right now, most searches (finding all questions for a subject, finding all exams a teacher created, finding a student's submission) work by having the database look through *every single record* one by one. That's fine with a small amount of test data, but gets noticeably slower as the question bank, exam list, and submission history grow.
  - **Fix**: Add database indexes on the fields that get searched most often: exams by their creator, questions by subject+type+difficulty together, and submissions by exam+student together.

---

## P3 — Code health & architecture cleanup

- [x] **There are two separate, slightly different systems doing the exact same job of "check if this user is logged in."**
  - **Fixed:** `45a60c5` (`authMiddleware.js` deleted).
  - **Plain terms**: `Backend/middleware/authMiddleware.js` and `Backend/middleware/rbac.js` both check logins and roles, with different names and slightly different behavior, and it's not obvious which one is "the real one" without reading both.
  - **Why it matters**: Maintenance risk — a future fix applied to one won't automatically apply to the other, and new code might accidentally use the wrong/older one.
  - **Fix**: Pick `rbac.js` (it's the one actually used almost everywhere) and delete `authMiddleware.js`, updating the one leftover file that still uses it.

- [x] **Several old, unused files are still sitting in the project, which makes it harder to tell what's actually running.**
  - **Fixed:** `45a60c5` (`authRoutes.js`, `userRoutes.js`, `config/db.js` deleted; `adminRoutes.js` kept — it's now the real, wired-in superadmin router).
  - **Plain terms**: There's an exact duplicate of the login routes file, an admin-routes file that was written correctly but never actually connected (see P0-1), a "user routes" file that checks for an account type that doesn't exist, and a database-connection file that isn't used anywhere.
  - **Fix**: Delete `Backend/routes/authRoutes.js`, `Backend/routes/userRoutes.js`, `Backend/config/db.js`; keep `Backend/routes/adminRoutes.js` only if you decide to actually wire it in per P0-1 (otherwise delete it too).

- [x] **Three old admin screens in the frontend still exist but use a completely separate, forgotten login system.**
  - **Fixed:** `45a60c5`.
  - **Plain terms**: `AdminDashboard.jsx`, `AdminLogin.jsx`, and `AdminReviewSubmission.jsx` are leftovers from an earlier version of the app. They're not linked from anywhere a real user can click to, but they still work by checking a totally different "logged in" marker than the rest of the app uses today. If anyone ever accidentally links to them again, they'd bypass all the current role/permission checks.
  - **Fix**: Delete these three files, since their functionality has already been rebuilt properly elsewhere (`TeacherDashboard.jsx`, `AdminCheckPaper.jsx`).

- [x] **The same chunks of code (pagination controls, loading placeholders, password show/hide toggle) are copy-pasted in multiple different pages.**
  - **Fixed:** `45a60c5` (`Pagination`, `LoadingSkeleton`, `PasswordInput` components).
  - **Plain terms**: Instead of building these little pieces once and reusing them, each page that needs them has its own separate copy.
  - **Why it matters**: If you fix a bug or improve one of these later, you have to remember to fix it in every copy — easy to miss one.
  - **Fix**: Pull the shared pieces into their own reusable component files (e.g., a `Pagination`, `LoadingSkeleton`, and `PasswordInput` component) and have every page use those instead.

- [x] **If a user's login session expires or becomes invalid, the app doesn't tell them — it just quietly stops working.**
  - **Fixed:** `45a60c5` (`apiFetch` auto-logs-out and redirects to `/login` on any 401).
  - **Plain terms**: There's no code anywhere that watches for "the server said my login isn't valid anymore" and responds by logging the user out and sending them back to the login page. Instead, the screen just fails to load new data, with no explanation.
  - **Fix**: Add one shared piece of code that all pages use to make server requests, and have it automatically log the user out and redirect to login whenever the server says the session is invalid.

- [x] **The app relies heavily on the browser's built-in pop-up boxes (the ones that say "OK" / "Cancel") for almost all messages and confirmations.**
  - **Fixed:** `45a60c5` (`Toast` + `ConfirmDialog` providers, replacing every live `alert`/`confirm` call).
  - **Plain terms**: Deleting a user, clearing the database, or seeing a success/error message all use the same plain browser pop-up. These look unpolished, block the whole page until dismissed, and can't be styled to match the app.
  - **Fix**: Replace these with a proper in-app notification system (a small "toast" library) and custom confirmation dialogs, at least for the most important/destructive actions.

- [x] **Some icons in the app are invisible because the icon font they depend on was never actually loaded.**
  - **Fixed:** `45a60c5` (Tabler Icons webfont added; one renamed icon swapped).
  - **Plain terms**: Several login/setup screens reference a specific icon set by name, expecting it to show little lock/shield/eye icons — but the actual icon files were never added to the project, so those spots just show blank space.
  - **Fix**: Either add the missing icon library to the project, or swap those spots for icons/emoji that are already working elsewhere in the app.

- [x] **Every page that talks to the server does so in its own way, instead of through one shared, consistent method.**
  - **Fixed:** `45a60c5` (`apiFetch` in `api.js`, adopted by every `fetch` call in the app — 11 files).
  - **Plain terms**: There's a shared helper file meant to handle "where is the server, and how do I attach my login token to a request," but most pages don't actually use it — they each reinvent it slightly differently. This is the underlying reason the P0-2 bug (broken production URLs) happened, and why similar bugs are likely to happen again.
  - **Fix**: Build one small shared function that every page's data-fetching goes through, so backend address and auth headers only need to be correct in one place.

---

## P4 — Tooling, docs & process gaps

- [x] **There's effectively no automated testing.**
  - **Fixed:** `2e9a80c` (`npm test` wired to `node --test`; 2 more test files added — 8 tests total, all passing).
  - **Plain terms**: One test file exists, but it's not actually connected to the "run my tests" command, so it never runs automatically. The frontend has zero tests of any kind.
  - **Fix**: Wire the existing backend test into the `npm test` command, and gradually add tests for the riskiest areas first (login/auth, paper generation, grading) — see `preparation.md`'s SDET section for a full test plan.

- [x] **Nothing automatically checks the code before it goes live.**
  - **Fixed:** `2e9a80c` (`.github/workflows/ci.yml` — backend tests + frontend lint/build on every push/PR to `main`).
  - **Plain terms**: There's no automatic "gatekeeper" step that runs when new code is proposed — no automatic test run, no automatic style/quality check. Code can go from a developer's laptop straight to production with nobody (and nothing) double-checking it first.
  - **Why it matters**: Several of the bugs in this very list (like the broken production URLs) would likely have been caught automatically if such a gatekeeper existed.
  - **Fix**: Add a simple automated check (a GitHub Actions workflow) that runs on every proposed change, at minimum building the project and running whatever tests exist.

- [x] **The command meant to check code quality (`npm run lint`) currently crashes instead of running.**
  - **Fixed:** `2e9a80c` (real root cause was an ESLint v8/v9 flat-config mismatch, not just the `--ext` flag; toolchain upgraded and every resulting violation fixed).
  - **Plain terms**: There's a command meant to automatically catch sloppy or risky code patterns before they ship, but running it right now just produces an error and does nothing — likely nobody's run it successfully in a while.
  - **Fix**: Update the lint command's settings to match the newer configuration format the project is already using (`Frontend/eslint.config.js`), then actually run it and fix what it finds.

- [x] **The project's documentation is incomplete and slightly out of date.**
  - **Fixed:** `2e9a80c`.
  - **Plain terms**: The main README still has a placeholder "your-vercel-link" instead of the real website address, and a "Project Structure" section that was started but never finished. The frontend's own README is still the generic template that comes with a new project — it hasn't been personalized at all. There's also no example settings file for the frontend, so a new developer has to guess what values they need.
  - **Fix**: Fill in the real live link, finish the Project Structure section, replace the frontend's README with real setup notes, and add a `Frontend/.env.example` file listing the settings a new developer needs.

- [x] **There's a leftover, unused settings file at the very top of the project that doesn't match the real frontend settings.**
  - **Fixed:** `2e9a80c`.
  - **Plain terms**: There's a `package.json` file sitting at the project's root folder (outside both `Backend` and `Frontend`) that seems to be left over from early setup — it lists a piece of software (a routing library) at a different version than the one the frontend actually uses, and doesn't do anything useful.
  - **Fix**: Remove this leftover root-level file (and its `node_modules`) unless something is actually depending on it — check first, then delete.

---

*Cross-reference: `preparation.md` in the project root uses several of these same gaps as live interview talking points (see especially its Track A Q5/Q9/Q10 and Track B Q8/Q13).*
