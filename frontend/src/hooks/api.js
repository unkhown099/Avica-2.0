import { API_BASE, getAuthHeadersAsync } from "./useAuth";

export async function apiFetch(endpoint, options = {}) {
  const headers = await getAuthHeadersAsync();

  // FormData uploads must not set Content-Type explicitly.
  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}