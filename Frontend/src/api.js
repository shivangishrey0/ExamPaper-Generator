const raw = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

// Local Vite proxy (`/api` → localhost:5000) when VITE_API_URL is unset.
// Deployed builds fall back to the Render API so requests never become `undefined/api/...`.
export const API_URL =
  raw || (import.meta.env.DEV ? "" : "https://exam-portal-backend-tido.onrender.com");

export const authUrl = (path) => `${API_URL}/api/auth${path.startsWith("/") ? path : `/${path}`}`;

const AUTH_STORAGE_KEYS = ["token", "userId", "name", "role", "permissions"];

// Every page's data-fetching should go through this: it prefixes API_URL,
// attaches the auth token, and logs the user out on a 401 (expired/invalid
// token or a deactivated account) instead of leaving the page silently broken.
export async function apiFetch(path, options = {}) {
  const url = path.startsWith("http") ? path : `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const token = localStorage.getItem("token");
  const headers = { ...(options.headers || {}) };
  if (token && !headers.Authorization) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
  }

  return res;
}
