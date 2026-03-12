// utils/getUser.js
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for reading the authenticated user on the frontend.
//
// Priority order:
//   1. The `user` JSON object saved to storage at login  ← most reliable
//   2. Custom claims embedded in the JWT access token    ← fallback
// ─────────────────────────────────────────────────────────────────────────────

function parseJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getUserFromSession() {
  // 1️⃣ Prefer the user object saved explicitly at login
  const stored =
    localStorage.getItem('user') ||
    sessionStorage.getItem('user');

  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Normalise: backend returns snake_case, frontend uses camelCase
      return {
        firstName: parsed.first_name || parsed.firstName || '',
        lastName:  parsed.last_name  || parsed.lastName  || '',
        email:     parsed.email      || '',
        phone:     parsed.phone      || '',
        role:      parsed.role       || '',
        id:        parsed.id         || null,
      };
    } catch { /* fall through */ }
  }

  // 2️⃣ Decode the JWT access token (has custom claims added in LoginView)
  const token =
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('access_token');

  if (token) {
    const payload = parseJwt(token);
    if (payload) {
      return {
        firstName: payload.first_name || payload.firstName || '',
        lastName:  payload.last_name  || payload.lastName  || '',
        email:     payload.email      || '',
        phone:     payload.phone      || '',
        role:      payload.role       || '',
        id:        payload.user_id    || null,
      };
    }
  }

  return null;
}