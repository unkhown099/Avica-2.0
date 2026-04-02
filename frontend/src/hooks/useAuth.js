import { useMemo } from "react";

const API_BASE_RAW = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
export const API_BASE = API_BASE_RAW.endsWith("/") ? API_BASE_RAW.slice(0, -1) : API_BASE_RAW;

// ── JWT decoder ──────────────────────────────────────────────────────────────
function decodeJWT(token) {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isExpired(payload) {
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000;
}

function getAccessToken() {
  return (
    localStorage.getItem("access_token") ??
    sessionStorage.getItem("access_token") ??
    null
  );
}

function getRefreshToken() {
  return (
    localStorage.getItem("refresh_token") ??
    sessionStorage.getItem("refresh_token") ??
    null
  );
}

function setAccessToken(token) {
  localStorage.setItem("access_token", token);
}

function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  sessionStorage.removeItem("access_token");
  sessionStorage.removeItem("refresh_token");
}

export async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  try {
    const res = await fetch(`${API_BASE}/api/token/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh }),
    });

    if (!res.ok) throw new Error("Refresh failed");

    const data = await res.json();

    setAccessToken(data.access);
    return data.access;
  } catch {
    clearTokens();
    return null;
  }
}

export async function getAuthHeadersAsync() {
  let token = getAccessToken();

  if (token) {
    const payload = decodeJWT(token);

    // If expired → try refresh
    if (!payload || isExpired(payload)) {
      token = await refreshAccessToken();
    }
  }

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function getAuthHeaders() {
  const token = getAccessToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function resolveStoredUser() {
  try {
    const raw =
      localStorage.getItem("user") ??
      sessionStorage.getItem("user") ??
      null;
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function useAuth() {
  return useMemo(() => {
    const empty = {
      token: null,
      user: null,
      role: null,
      isAdmin: false,
      isAuthenticated: false,
      headers: {},
    };

    let token = getAccessToken();
    if (!token) return empty;

    let payload = decodeJWT(token);

    if (!payload || isExpired(payload)) {
      return empty;
    }

    const role = normalizeRole(payload.role ?? payload.user_role ?? null);
    const isAdmin = ["admin", "business_owner", "super_admin"].includes(role);

    const stored = resolveStoredUser();

    const user = {
      id: payload.user_id ?? payload.id ?? null,
      email: payload.email ?? stored?.email ?? null,
      first_name: stored?.first_name ?? null,
      last_name: stored?.last_name ?? null,
      full_name: stored?.full_name ?? stored?.name ?? null,
      branch_id: stored?.branch_id ?? stored?.branch?.id ?? null,
      branch_name: stored?.branch_name ?? stored?.branch?.name ?? null,
      ...stored,
      id: payload.user_id ?? payload.id ?? null,
      email: payload.email ?? stored?.email ?? null,
    };

    return {
      token,
      user,
      role,
      isAdmin,
      isAuthenticated: true,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    };
  }, []);
}

function normalizeRole(raw) {
  const map = {
    "Admin":             "admin",
    "Business Owner":    "business_owner",
    "Branch Manager":    "branch_manager",
    "Staff":             "staff",
    "Employee":          "employee",
    "Inventory":         "inventory",
    "Inventory Manager": "inventory_manager",
    "Super Admin":       "super_admin",
  };
  return map[raw] ?? raw ?? null;
}