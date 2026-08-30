const raw = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

// Local Vite proxy (`/api` → localhost:5000) when VITE_API_URL is unset.
// Deployed builds fall back to the Render API so requests never become `undefined/api/...`.
export const API_URL =
  raw || (import.meta.env.DEV ? "" : "https://exam-portal-backend-tido.onrender.com");

export const authUrl = (path) => `${API_URL}/api/auth${path.startsWith("/") ? path : `/${path}`}`;

const AUTH_STORAGE_KEYS = ["token", "userId", "name", "role", "permissions"];

const applyAuthResponse = (data) => {
  localStorage.setItem("token", data.token || "");
  localStorage.setItem("userId", data.userId || "");
  localStorage.setItem("name", data.name || "");
  localStorage.setItem("role", data.role || "");
  localStorage.setItem("permissions", JSON.stringify(data.permissions || []));
};

const clearAuthStorage = () => AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));

const redirectToLogin = () => {
  if (!window.location.pathname.startsWith("/login")) {
    window.location.href = "/login";
  }
};

// The access token is short-lived; this exchanges the httpOnly refresh cookie
// for a new one. Concurrent 401s share one in-flight refresh instead of each
// firing their own.
let refreshPromise = null;
const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = fetch(authUrl("/refresh"), { method: "POST", credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error("refresh failed");
        const data = await res.json();
        applyAuthResponse(data);
        return data.token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

// Every page's data-fetching should go through this: it prefixes API_URL,
// attaches the auth token, transparently refreshes an expired access token
// once and retries, and logs the user out on a session that can't be
// refreshed (invalid/expired refresh cookie or a deactivated account).
export async function apiFetch(path, options = {}, _isRetry = false) {
  const url = path.startsWith("http") ? path : `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const token = localStorage.getItem("token");
  const headers = { ...(options.headers || {}) };
  if (token && !headers.Authorization) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers, credentials: "include" });

  if (res.status === 401 && !_isRetry && !url.includes("/api/auth/refresh") && !url.includes("/api/auth/login")) {
    try {
      await refreshAccessToken();
      return apiFetch(path, options, true);
    } catch {
      clearAuthStorage();
      redirectToLogin();
      return res;
    }
  }

  if (res.status === 401 && _isRetry) {
    clearAuthStorage();
    redirectToLogin();
  }

  return res;
}
