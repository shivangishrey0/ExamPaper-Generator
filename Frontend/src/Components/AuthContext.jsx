import React, { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

const readAuthFromStorage = () => {
  const token = localStorage.getItem("token") || "";
  const role = localStorage.getItem("role") || "";
  const permissionsRaw = localStorage.getItem("permissions") || "[]";
  const userId = localStorage.getItem("userId") || "";
  const name = localStorage.getItem("name") || "";

  let permissions = [];
  try {
    permissions = JSON.parse(permissionsRaw);
  } catch (_err) {
    permissions = [];
  }

  return { token, role, permissions, userId, name };
};

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readAuthFromStorage());

  const setSession = ({ token, userId, name, role, permissions = [] }) => {
    localStorage.setItem("token", token || "");
    localStorage.setItem("userId", userId || "");
    localStorage.setItem("name", name || "");
    localStorage.setItem("role", role || "");
    localStorage.setItem("permissions", JSON.stringify(permissions));
    setAuth({ token, userId, name, role, permissions });
  };

  const clearSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("name");
    localStorage.removeItem("role");
    localStorage.removeItem("permissions");
    setAuth({ token: "", role: "", permissions: [], userId: "", name: "" });
  };

  const value = useMemo(() => ({ auth, setSession, clearSession }), [auth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
