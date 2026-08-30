# Exam Paper Generator — Frontend

React + Vite + Tailwind CSS frontend for the Exam Paper Generator platform. See the [repo root README](../README.md) for the full project overview, feature list, and tech stack.

## Setup

```bash
npm install
cp .env.example .env   # fill in VITE_API_URL if you're not using the local proxy
npm run dev
```

The dev server proxies `/api` to `http://localhost:5000` (see `vite.config.js`), so the backend must be running locally for the app to work in dev.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## Structure

- `src/Admin/` — teacher and superadmin dashboards, exam review/grading screens
- `src/User/` — registration, login, OTP verification, password reset/set
- `src/Pages/` — landing page, login-role selector, take-exam flow
- `src/Components/` — shared UI: `AuthContext`, `Toast`, `ConfirmDialog`, `Pagination`, `LoadingSkeleton`, `PasswordInput`
- `src/api.js` — `apiFetch`, the one place the backend URL and auth headers are resolved; every page's data fetching should go through it

## Notes

- Auth state (token, role, permissions) lives in `AuthContext` and `localStorage`; `apiFetch` reads the token directly from `localStorage` and logs the user out on a 401.
- Icons use the [Tabler Icons](https://tabler.io/icons) webfont, loaded via CDN in `index.html` — icon class names are `ti ti-<name>`.
