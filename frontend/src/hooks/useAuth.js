import { useMemo } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

// ── JWT decoder (no library needed) ──────────────────────────────────────────
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

// ── Token resolution ──────────────────────────────────────────────────────────
function resolveToken() {
  return (
    localStorage.getItem("access_token") ??
    sessionStorage.getItem("access_token") ??
    null
  );
}

// ── Stored user profile (set by your login response) ─────────────────────────
// Your login endpoint should do: localStorage.setItem("user", JSON.stringify(responseUser))
// This gives us first_name, last_name, branch, etc. that aren't in the JWT.
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

// ── Main hook ─────────────────────────────────────────────────────────────────
export function useAuth() {
  return useMemo(() => {
    const empty = {
      token:           null,
      user:            null,
      role:            null,
      isAdmin:         false,
      isAuthenticated: false,
      headers:         {},
    };

    const token = resolveToken();
    if (!token) return empty;

    const payload = decodeJWT(token);
    if (!payload || isExpired(payload)) {
      localStorage.removeItem("access_token");
      sessionStorage.removeItem("access_token");
      return empty;
    }

    // Role comes from the JWT (added via custom SimpleJWT serializer)
    const role    = payload.role ?? payload.user_role ?? null;
    const isAdmin = ["Admin", "Business Owner"].includes(role);

    // Merge JWT claims with the richer profile stored at login time.
    // JWT is the source of truth for id/email/role; stored profile fills in
    // display fields (first_name, last_name, branch_name, etc.)
    const stored = resolveStoredUser();

    const user = {
      // From JWT (always present if token is valid)
      id:         payload.user_id ?? payload.id ?? null,
      email:      payload.email   ?? stored?.email ?? null,
      // From stored profile (set by login response)
      first_name:  stored?.first_name  ?? null,
      last_name:   stored?.last_name   ?? null,
      full_name:   stored?.full_name   ?? stored?.name ?? null,
      branch_id:   stored?.branch_id   ?? stored?.branch?.id   ?? null,
      branch_name: stored?.branch_name ?? stored?.branch?.name ?? null,
      // Pass through the whole stored object in case other fields are needed
      ...stored,
      // Re-apply JWT fields so they always win over stored values
      id:    payload.user_id ?? payload.id ?? null,
      email: payload.email   ?? stored?.email ?? null,
    };

    return {
      token,
      user,
      role,
      isAdmin,
      isAuthenticated: true,
      headers: {
        "Content-Type": "application/json",
        Authorization:  `Bearer ${token}`,
      },
    };
  }, []);
}

// ── Standalone helper (use outside React components) ─────────────────────────
export function getAuthHeaders() {
  const token = resolveToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export { API_BASE };