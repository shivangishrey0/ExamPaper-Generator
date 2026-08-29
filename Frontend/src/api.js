const raw = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

// Local Vite proxy (`/api` → localhost:5000) when VITE_API_URL is unset.
// Deployed builds fall back to the Render API so requests never become `undefined/api/...`.
export const API_URL =
  raw || (import.meta.env.DEV ? "" : "https://exam-portal-backend-tido.onrender.com");

export const authUrl = (path) => `${API_URL}/api/auth${path.startsWith("/") ? path : `/${path}`}`;
