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

function normalizeRole(raw) {
  if (!raw) return '';
  const str = String(raw).trim().toLowerCase().replace(/[- ]+/g, '_');
  if (str.includes('super_admin') || str.includes('superadmin')) return 'super_admin';
  if (str.includes('business_owner') || str.includes('branch_owner') || str === 'owner') return 'business_owner';
  if (str.includes('branch_manager') || (str.includes('manager') && !str.includes('inventory'))) return 'branch_manager';
  if (str.includes('inventory_manager')) return 'inventory_manager';
  if (str.includes('inventory')) return 'inventory';
  if (str.includes('admin')) return 'admin';
  if (str.includes('cashier') || str.includes('staff')) return 'staff';
  if (str.includes('employee') || str.includes('technician') || str.includes('worker') || str.includes('mechanic') || str.includes('detailer')) return 'employee';
  if (str.includes('customer') || str.includes('client')) return 'customer';
  return str;
}

export function getUserFromSession() {
  // 1️⃣ Prefer the user object saved explicitly at login (merge session & local storage)
  let stored = null;
  try {
    const sRaw = sessionStorage.getItem('user');
    const lRaw = localStorage.getItem('user');
    const s = sRaw ? JSON.parse(sRaw) : null;
    const l = lRaw ? JSON.parse(lRaw) : null;
    if (s || l) {
      stored = { ...(l || {}), ...(s || {}) };
      const pic = l?.profile_picture || l?.profilePicture || s?.profile_picture || s?.profilePicture;
      if (pic) {
        stored.profile_picture = pic;
        stored.profilePicture = pic;
      }
    }
  } catch {
    stored = null;
  }

  if (stored) {
    try {
      const parsed = stored;
      const pic = parsed.profile_picture || parsed.profilePicture || parsed.profile_pic || null;
      // Normalise: backend returns snake_case, frontend uses camelCase
      return {
        firstName: parsed.first_name || parsed.firstName || '',
        lastName: parsed.last_name || parsed.lastName || '',
        email: parsed.email || '',
        phone: parsed.phone || '',
        role: normalizeRole(parsed.role),
        id: parsed.id || null,
        profile_picture: pic,
        profilePicture: pic,
      };
    } catch { /* fall through */ }
  }

  // 2️⃣ Decode the JWT access token (has custom claims added in LoginView)
  const token =
    sessionStorage.getItem('access_token') ||
    localStorage.getItem('access_token');

  if (token) {
    const payload = parseJwt(token);
    if (payload) {
      const pic = payload.profile_picture || payload.profilePicture || payload.profile_pic || null;
      return {
        firstName: payload.first_name || payload.firstName || '',
        lastName: payload.last_name || payload.lastName || '',
        email: payload.email || '',
        phone: payload.phone || '',
        role: normalizeRole(payload.role),
        id: payload.user_id || null,
        profile_picture: pic,
        profilePicture: pic,
      };
    }
  }

  return null;
}