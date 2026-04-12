import React, { useState, useEffect, useCallback } from "react";
import SuperAdminLayout from "./SuperAdminLayout.jsx";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../../hooks/api.js";

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl backdrop-blur-sm min-w-[280px] max-w-sm transition-all ${
            t.type === "success"
              ? "bg-green-500/20 border-green-500/30 text-green-300"
              : t.type === "error"
                ? "bg-red-500/20 border-red-500/30 text-red-300"
                : "bg-blue-500/20 border-blue-500/30 text-blue-300"
          }`}
        >
          <span className="text-lg flex-shrink-0">
            {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}
          </span>
          <p className="text-sm flex-1">{t.message}</p>
          <button
            onClick={() => removeToast(t.id)}
            className="opacity-50 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Toggle Switch ─────────────────────────────────────────────────────────────
function Toggle({ value, onChange, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
        value ? "bg-red-500" : "bg-gray-700"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
          value ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// ── Section Card ──────────────────────────────────────────────────────────────
function SectionCard({ title, accent, children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gray-950 overflow-hidden">
      <div
        className={`px-5 py-3 border-b border-white/10 flex items-center gap-2.5 ${accent ? "bg-red-600/10" : "bg-white/5"}`}
      >
        {accent && (
          <span className="w-1.5 h-4 rounded-full bg-red-500 inline-block" />
        )}
        <span className="text-xs font-black uppercase tracking-widest text-white">
          {title}
        </span>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  color = "text-white",
  border = "border-white/10",
}) {
  return (
    <div className={`rounded-2xl border ${border} bg-gray-900/80 p-5`}>
      <div className="text-xs uppercase tracking-widest text-gray-500 mb-2">
        {label}
      </div>
      <div className={`text-2xl font-black ${color}`}>{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  { key: "login", label: "Login Security" },
  { key: "suspicious", label: "Suspicious Activity" },
  { key: "backups", label: "Backups" },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LOGIN SECURITY PANEL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function LoginSecurityPanel({ addToast }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch("/super-admin/settings/")
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch(() => {
        addToast("Failed to load security settings.", "error");
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch("/super-admin/settings/", {
        method: "PATCH",
        body: JSON.stringify({ security: settings.security }),
      });
      addToast("Security settings saved successfully.", "success");
    } catch {
      addToast("Failed to save settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  const setSec = (key, val) =>
    setSettings((prev) => ({
      ...prev,
      security: { ...prev.security, [key]: val },
    }));

  if (loading)
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-16 rounded-2xl bg-gray-900/60 border border-white/5 animate-pulse"
          />
        ))}
      </div>
    );

  const sec = settings?.security || {};

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Max Login Attempts"
          value={sec.maxLoginAttempts ?? 5}
          sub="Before lockout"
          color="text-red-400"
          border="border-red-500/20"
        />
        <StatCard
          label="Lockout Duration"
          value={`${sec.lockoutDurationMinutes ?? 15}m`}
          sub="Auto unlock after"
          color="text-orange-400"
          border="border-orange-500/20"
        />
        <StatCard
          label="Session Timeout"
          value={`${sec.sessionTimeoutMinutes ?? 60}m`}
          sub="Idle logout"
          color="text-yellow-400"
          border="border-yellow-500/20"
        />
        <StatCard
          label="2FA Status"
          value={sec.allowTwoFactor ? "Enabled" : "Disabled"}
          sub="Platform-wide"
          color={sec.allowTwoFactor ? "text-green-400" : "text-gray-400"}
          border={
            sec.allowTwoFactor ? "border-green-500/20" : "border-white/10"
          }
        />
      </div>

      {/* Password Policy */}
      <SectionCard title="Password Policy" accent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-white">
              Require Strong Passwords
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              Enforce uppercase, number, and symbol requirements
            </div>
          </div>
          <Toggle
            value={sec.requireStrongPasswords ?? true}
            onChange={(v) => setSec("requireStrongPasswords", v)}
          />
        </div>
      </SectionCard>

      {/* Session & Lockout */}
      <SectionCard title="Session & Lockout">
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs uppercase tracking-widest text-gray-500 font-bold block mb-1.5">
              Max Login Attempts
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={sec.maxLoginAttempts ?? 5}
              onChange={(e) =>
                setSec("maxLoginAttempts", parseInt(e.target.value))
              }
              className="w-full rounded-xl bg-gray-900 border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-red-500/60"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-gray-500 font-bold block mb-1.5">
              Lockout Duration (min)
            </label>
            <input
              type="number"
              min={1}
              max={1440}
              value={sec.lockoutDurationMinutes ?? 15}
              onChange={(e) =>
                setSec("lockoutDurationMinutes", parseInt(e.target.value))
              }
              className="w-full rounded-xl bg-gray-900 border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-red-500/60"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-gray-500 font-bold block mb-1.5">
              Session Timeout (min)
            </label>
            <input
              type="number"
              min={5}
              max={1440}
              value={sec.sessionTimeoutMinutes ?? 60}
              onChange={(e) =>
                setSec("sessionTimeoutMinutes", parseInt(e.target.value))
              }
              className="w-full rounded-xl bg-gray-900 border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-red-500/60"
            />
          </div>
        </div>
      </SectionCard>

      {/* OAuth & 2FA */}
      <SectionCard title="Authentication Methods">
        {[
          {
            key: "allowTwoFactor",
            label: "Two-Factor Authentication",
            desc: "Require 2FA for all staff logins",
          },
          {
            key: "allowGoogleOAuth",
            label: "Google OAuth",
            desc: "Allow sign-in with Google accounts",
          },
        ].map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between py-1">
            <div>
              <div className="text-sm font-semibold text-white">{label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
            </div>
            <Toggle
              value={sec[key] ?? false}
              onChange={(v) => setSec(key, v)}
            />
          </div>
        ))}
      </SectionCard>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-2xl bg-red-600 py-3 text-sm font-black text-white hover:bg-red-700 transition-colors disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save Security Settings"}
      </button>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SUSPICIOUS ACTIVITY PANEL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function SuspiciousActivityPanel({ addToast }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [search, setSearch] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/super-admin/activity-log/?days=${days}`);
      setLogs(data);
    } catch {
      addToast("Failed to load activity logs.", "error");
    } finally {
      setLoading(false);
    }
  }, [days, addToast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Flag suspicious patterns — multiple logins, broadcast, deletions
  const suspiciousTypes = [
    "broadcast",
    "login_failed",
    "delete",
    "force_logout",
  ];
  const flagged = logs.filter(
    (l) =>
      suspiciousTypes.some((t) => l.type?.includes(t)) ||
      l.title?.toLowerCase().includes("fail") ||
      l.title?.toLowerCase().includes("delete") ||
      l.title?.toLowerCase().includes("broadcast"),
  );

  const filtered = search
    ? logs.filter(
        (l) =>
          l.user?.toLowerCase().includes(search.toLowerCase()) ||
          l.title?.toLowerCase().includes(search.toLowerCase()) ||
          l.message?.toLowerCase().includes(search.toLowerCase()),
      )
    : logs;

  const getTypeColor = (type) => {
    if (!type) return "text-gray-400 bg-gray-500/10 border-gray-500/20";
    if (type.includes("broadcast"))
      return "text-orange-400 bg-orange-500/10 border-orange-500/20";
    if (type.includes("delete") || type.includes("fail"))
      return "text-red-400 bg-red-500/10 border-red-500/20";
    if (type.includes("login"))
      return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    return "text-gray-400 bg-gray-500/10 border-gray-500/20";
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Events"
          value={logs.length}
          sub={`Last ${days} days`}
        />
        <StatCard
          label="Flagged Events"
          value={flagged.length}
          sub="Needs review"
          color="text-red-400"
          border="border-red-500/20"
        />
        <StatCard
          label="Unique Users"
          value={new Set(logs.map((l) => l.user)).size}
          sub="Active in period"
          color="text-blue-400"
          border="border-blue-500/20"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by user, title, or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-900 border border-white/10 text-white text-sm focus:outline-none focus:border-red-500/60"
          />
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="px-4 py-2 rounded-xl bg-gray-900 border border-white/10 text-white text-sm focus:outline-none focus:border-red-500/60"
        >
          <option value={1}>Last 24 hours</option>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
        <button
          onClick={fetchLogs}
          className="px-4 py-2 rounded-xl bg-gray-800 border border-white/10 text-gray-300 hover:text-white text-sm font-semibold"
        >
          Refresh
        </button>
      </div>

      {/* Flagged banner */}
      {flagged.length > 0 && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 flex items-center gap-3">
          <span className="text-red-400 text-xl">⚠</span>
          <p className="text-red-300 text-sm">
            <span className="font-bold">
              {flagged.length} suspicious event{flagged.length > 1 ? "s" : ""}
            </span>{" "}
            detected in the last {days} days. Review flagged entries below.
          </p>
        </div>
      )}

      {/* Log Table */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-14 rounded-xl bg-gray-900/60 border border-white/5 animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-gray-900/60 px-6 py-12 text-center text-gray-500 text-sm">
          No activity logs found.
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-gray-900/60 overflow-hidden">
          <div className="hidden md:grid grid-cols-[2fr_1fr_3fr_1fr] gap-4 px-5 py-3 border-b border-white/5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div>User</div>
            <div>Type</div>
            <div>Message</div>
            <div className="text-right">Time</div>
          </div>
          <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
            {filtered.map((log) => {
              const isFlagged = flagged.includes(log);
              return (
                <div
                  key={log.id}
                  className={`px-5 py-3 hover:bg-white/[0.02] transition-colors ${isFlagged ? "border-l-2 border-red-500" : ""}`}
                >
                  {/* Desktop */}
                  <div className="hidden md:grid grid-cols-[2fr_1fr_3fr_1fr] gap-4 items-center">
                    <div className="text-sm text-white font-medium truncate">
                      {log.user}
                    </div>
                    <div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${getTypeColor(log.type)}`}
                      >
                        {log.type || "system"}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 truncate">
                      {log.title} — {log.message}
                    </div>
                    <div className="text-xs text-gray-600 text-right whitespace-nowrap">
                      {new Date(log.created_at).toLocaleDateString()}{" "}
                      {new Date(log.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  {/* Mobile */}
                  <div className="md:hidden space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white font-medium">
                        {log.user}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${getTypeColor(log.type)}`}
                      >
                        {log.type || "system"}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {log.title} — {log.message}
                    </div>
                    <div className="text-xs text-gray-600">
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-5 py-3 border-t border-white/5 text-xs text-gray-500">
            Showing {filtered.length} of {logs.length} events
          </div>
        </div>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BACKUPS PANEL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function BackupsPanel({ addToast }) {
  const [running, setRunning] = useState(null);

  // Simulated backup records — replace with real API when backend is ready
  const backups = [
    {
      id: 1,
      name: "Full Database Backup",
      last: "Never",
      status: "not_run",
      size: "—",
      type: "database",
    },
    {
      id: 2,
      name: "Media Files Backup",
      last: "Never",
      status: "not_run",
      size: "—",
      type: "media",
    },
    {
      id: 3,
      name: "Settings & Config Export",
      last: "Never",
      status: "not_run",
      size: "—",
      type: "config",
    },
  ];

  const handleRunBackup = async (backup) => {
    setRunning(backup.id);
    addToast(`Starting ${backup.name}...`, "info");
    // Simulate backup — replace with real API call when backend supports it
    await new Promise((r) => setTimeout(r, 2000));
    addToast(`${backup.name} completed successfully.`, "success");
    setRunning(null);
  };

  const getStatusBadge = (status) => {
    if (status === "success")
      return "text-green-400 bg-green-500/10 border-green-500/20";
    if (status === "running")
      return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    if (status === "error")
      return "text-red-400 bg-red-500/10 border-red-500/20";
    return "text-gray-400 bg-gray-500/10 border-gray-500/20";
  };

  const getTypeIcon = (type) => {
    if (type === "database") return "🗄️";
    if (type === "media") return "🖼️";
    return "⚙️";
  };

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 px-5 py-4 flex items-start gap-3">
        <span className="text-blue-400 text-xl mt-0.5">ℹ</span>
        <div>
          <p className="text-blue-300 text-sm font-semibold">Backup System</p>
          <p className="text-blue-300/70 text-xs mt-1">
            Manual backups are available now. Automated scheduled backups
            require server-side cron configuration. Contact your hosting
            provider to set up automated backups.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Last Backup"
          value="Never"
          sub="No backups yet"
          color="text-gray-400"
        />
        <StatCard label="Backup Count" value="0" sub="Total created" />
        <StatCard label="Storage Used" value="—" sub="By backups" />
      </div>

      {/* Backup Options */}
      <SectionCard title="Available Backups" accent>
        <div className="space-y-3">
          {backups.map((backup) => {
            const isRunning = running === backup.id;
            return (
              <div
                key={backup.id}
                className="flex items-center justify-between p-4 rounded-xl bg-gray-900 border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getTypeIcon(backup.type)}</span>
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {backup.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Last run: {backup.last} · Size: {backup.size}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${getStatusBadge(isRunning ? "running" : backup.status)}`}
                  >
                    {isRunning
                      ? "Running…"
                      : backup.status === "not_run"
                        ? "Not run"
                        : backup.status}
                  </span>
                  <button
                    onClick={() => handleRunBackup(backup)}
                    disabled={!!running}
                    className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isRunning ? "Running…" : "Run Now"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Instructions */}
      <SectionCard title="Automated Backup Setup">
        <p className="text-xs text-gray-400 leading-relaxed">
          To enable automated backups, add the following to your server's
          crontab:
        </p>
        <div className="mt-3 rounded-xl bg-black/60 border border-white/10 p-4 font-mono text-xs text-green-400 space-y-1">
          <div># Daily backup at 2:00 AM</div>
          <div>
            0 2 * * * cd /path/to/project && python manage.py dumpdata {">"}{" "}
            backup_$(date +\%Y\%m\%d).json
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Replace <span className="text-gray-300">/path/to/project</span> with
          your actual Django project path.
        </p>
      </SectionCard>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN PAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function SuperAdminSecurity() {
  const location = useLocation();
  const navigate = useNavigate();
  const [toasts, setToasts] = useState([]);

  // Determine active tab from URL hash
  const getActiveTabFromHash = () => {
    const hash = location.hash.replace("#", "");
    if (hash === "backups") return "backups";
    if (hash === "activity") return "suspicious";
    if (hash === "login-security") return "login";
    return "login"; // default
  };

  const [activeTab, setActiveTab] = useState(getActiveTabFromHash);

  // Update active tab when URL hash changes
  useEffect(() => {
    setActiveTab(getActiveTabFromHash());
  }, [location.hash]);

  const addToast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      4000,
    );
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Tab navigation with hash update
  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    let hash = "";
    if (tabKey === "backups") hash = "#backups";
    else if (tabKey === "suspicious") hash = "#activity";
    else if (tabKey === "login") hash = "#login-security";
    navigate(`${location.pathname}${hash}`, { replace: true });
  };

  // Tabs component
  const TABS = [
    { key: "login", label: "Login Security" },
    { key: "suspicious", label: "Suspicious Activity" },
    { key: "backups", label: "Backups" },
  ];

  return (
    <SuperAdminLayout>
      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-3xl border border-white/10 bg-gray-900/80 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-red-400">
                Super Admin
              </div>
              <h1 className="text-3xl font-black text-white">
                Security & Backup
              </h1>
              <p className="max-w-2xl text-sm text-gray-400 mt-1">
                Configure authentication, monitor suspicious activity, and
                manage system backups.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-white/10">
          <div className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`px-6 py-3 text-sm font-semibold transition-all relative ${
                  activeTab === tab.key
                    ? "text-red-500"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Panel Content */}
        <div className="mt-6">
          {activeTab === "login" && <LoginSecurityPanel addToast={addToast} />}
          {activeTab === "suspicious" && (
            <SuspiciousActivityPanel addToast={addToast} />
          )}
          {activeTab === "backups" && <BackupsPanel addToast={addToast} />}
        </div>
      </div>
    </SuperAdminLayout>
  );
}