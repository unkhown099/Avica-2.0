import { useState, useEffect, useCallback } from "react";

function getToken() {
  return (
    localStorage.getItem("access_token") ??
    sessionStorage.getItem("access_token") ??
    null
  );
}

function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch(url) {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}${url}`, {
    headers: authHeaders(),
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Server returned ${res.status}`);
  return res.json();
}

// ── Overview (stats + chart + recent transactions) ────────────────────────────
export function useOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const json = await apiFetch("/dashboard/");
      setData(json);
    } catch (err) {
      setError(err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}

// ── Customers ─────────────────────────────────────────────────────────────────
export function useCustomers() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const json = await apiFetch("/customers/");
        // Support both paginated {results:[]} and plain array
        setData(Array.isArray(json) ? json : (json.results ?? []));
      } catch (err) {
        setError(err.message || "Failed to load customers.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { data, loading, error };
}

// ── Inventory ─────────────────────────────────────────────────────────────────
export function useInventory() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const json = await apiFetch("/inventory/");
        setData(Array.isArray(json) ? json : (json.results ?? []));
      } catch (err) {
        setError(err.message || "Failed to load inventory.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { data, loading, error };
}

// ── Services ──────────────────────────────────────────────────────────────────
export function useServices() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const json = await apiFetch("/services/");
        setData(Array.isArray(json) ? json : (json.results ?? []));
      } catch (err) {
        setError(err.message || "Failed to load services.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { data, loading, error };
}

// ── Appointments (revenue breakdown by month) ─────────────────────────────────
export function useAppointments() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const json = await apiFetch("/appointments/");
        setData(Array.isArray(json) ? json : (json.results ?? []));
      } catch (err) {
        setError(err.message || "Failed to load appointments.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { data, loading, error };
}