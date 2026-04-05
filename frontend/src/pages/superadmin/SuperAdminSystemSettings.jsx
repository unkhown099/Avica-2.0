import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import SuperAdminLayout from "./SuperAdminLayout.jsx";
import { API_BASE, getAuthHeadersAsync } from "../../hooks/useAuth.js";

const SECTION_KEYS = ["general", "email", "security"];
const SECTION_TITLES = {
  general: "General",
  email: "Email",
  security: "Security",
};

// ── Reusable field components ──────────────────────────────────────────────

function FieldGroup({ title, description, children }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-gray-900/80 p-6">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-gray-400">{description}</p>
      )}
      <div className="mt-6 space-y-4">{children}</div>
    </div>
  );
}

function TextInput({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-400">
        {label}
      </span>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) =>
          onChange(type === "number" ? Number(e.target.value) : e.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-gray-950 px-4 py-3 text-gray-100 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
      />
    </label>
  );
}

function SelectInput({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-400">
        {label}
      </span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-gray-950 px-4 py-3 text-gray-100 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Toggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-gray-950/80 p-4">
      <div>
        <div className="text-sm font-semibold text-white">{label}</div>
        {description && (
          <div className="mt-0.5 text-xs text-gray-400">{description}</div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? "bg-red-500" : "bg-gray-700"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function StatBadge({ label, value }) {
  return (
    <div className="rounded-2xl bg-gray-950/60 p-4">
      <div className="text-xs uppercase tracking-[0.3em] text-gray-500">{label}</div>
      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}

// ── Skeleton loader ────────────────────────────────────────────────────────

function SkeletonField() {
  return (
    <div className="space-y-2">
      <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
      <div className="h-12 w-full animate-pulse rounded-2xl bg-white/5" />
    </div>
  );
}

function SkeletonSection() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="rounded-3xl border border-white/10 bg-gray-900/80 p-6 space-y-4"
        >
          <div className="h-5 w-32 animate-pulse rounded bg-white/10" />
          <div className="h-3 w-48 animate-pulse rounded bg-white/5" />
          <SkeletonField />
          <SkeletonField />
          <SkeletonField />
        </div>
      ))}
    </div>
  );
}

// ── Section renderers ──────────────────────────────────────────────────────

function GeneralSection({ state, onChange }) {
  const o = (key) => (val) => onChange("general", key, val);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <FieldGroup title="Site identity" description="Basic information about the platform.">
        <TextInput label="Site name" value={state.siteName} onChange={o("siteName")} />
        <TextInput label="Site tagline" value={state.siteTagline} onChange={o("siteTagline")} />
        <SelectInput
          label="Site mode"
          value={state.siteMode}
          onChange={o("siteMode")}
          options={[
            { value: "live", label: "Live" },
            { value: "maintenance", label: "Maintenance" },
          ]}
        />
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-400">
            Maintenance message
          </span>
          <textarea
            value={state.maintenanceMessage ?? ""}
            onChange={(e) => o("maintenanceMessage")(e.target.value)}
            rows={3}
            className="w-full rounded-2xl border border-white/10 bg-gray-950 px-4 py-3 text-gray-100 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
          />
        </label>
      </FieldGroup>

      <div className="space-y-6">
        <FieldGroup title="Locale & support" description="Regional defaults and help link.">
          <SelectInput
            label="Default language"
            value={state.defaultLanguage}
            onChange={o("defaultLanguage")}
            options={[
              { value: "en", label: "English" },
              { value: "fil", label: "Filipino" },
            ]}
          />
          <SelectInput
            label="Default timezone"
            value={state.defaultTimezone}
            onChange={o("defaultTimezone")}
            options={[
              { value: "Asia/Manila", label: "Asia/Manila (PHT)" },
              { value: "UTC", label: "UTC" },
            ]}
          />
          <TextInput label="Support URL" value={state.supportUrl} onChange={o("supportUrl")} />
        </FieldGroup>

        <FieldGroup title="System status" description="Live snapshot of current settings.">
          <StatBadge
            label="Current mode"
            value={state.siteMode === "live" ? "🟢 Live" : "🔴 Maintenance"}
          />
          <StatBadge label="Site name" value={state.siteName || "—"} />
          <StatBadge label="Timezone" value={state.defaultTimezone || "—"} />
        </FieldGroup>
      </div>
    </div>
  );
}

function EmailSection({ state, onChange }) {
  const o = (key) => (val) => onChange("email", key, val);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <FieldGroup
        title="SMTP configuration"
        description="Connection settings for outgoing email."
      >
        <TextInput label="Mail host" value={state.mailHost} onChange={o("mailHost")} />
        <TextInput
          label="Mail port"
          value={state.mailPort}
          onChange={o("mailPort")}
          type="number"
        />
        <TextInput label="Mail from address" value={state.mailFrom} onChange={o("mailFrom")} />
        <TextInput label="Support email" value={state.supportEmail} onChange={o("supportEmail")} />
      </FieldGroup>
      <FieldGroup title="Email behavior" description="Control when emails are sent to users.">
        <Toggle
          label="Require email verification"
          description="Users must verify their email on signup."
          checked={!!state.emailVerificationRequired}
          onChange={o("emailVerificationRequired")}
        />
        <Toggle
          label="Send welcome email"
          description="Send a welcome message to new registrants."
          checked={!!state.welcomeEmailEnabled}
          onChange={o("welcomeEmailEnabled")}
        />
      </FieldGroup>
    </div>
  );
}

function SecuritySection({ state, onChange }) {
  const o = (key) => (val) => onChange("security", key, val);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <FieldGroup
        title="Password & session"
        description="Enforce password strength and session expiry."
      >
        <Toggle
          label="Require strong passwords"
          description="Force complexity for all user accounts."
          checked={!!state.requireStrongPasswords}
          onChange={o("requireStrongPasswords")}
        />
        <TextInput
          label="Session timeout (minutes)"
          value={state.sessionTimeoutMinutes}
          onChange={o("sessionTimeoutMinutes")}
          type="number"
        />
        <TextInput
          label="Max login attempts"
          value={state.maxLoginAttempts}
          onChange={o("maxLoginAttempts")}
          type="number"
        />
        <TextInput
          label="Lockout duration (minutes)"
          value={state.lockoutDurationMinutes}
          onChange={o("lockoutDurationMinutes")}
          type="number"
        />
      </FieldGroup>
      <FieldGroup
        title="Authentication"
        description="Two-factor and OAuth provider settings."
      >
        <Toggle
          label="Allow two-factor authentication"
          description="Enforce 2FA for super admin logins."
          checked={!!state.allowTwoFactor}
          onChange={o("allowTwoFactor")}
        />
        <Toggle
          label="Allow Google OAuth"
          description="Let users sign in with their Google account."
          checked={!!state.allowGoogleOAuth}
          onChange={o("allowGoogleOAuth")}
        />
        <Toggle
          label="Allow Facebook OAuth"
          description="Let users sign in with their Facebook account."
          checked={!!state.allowFacebookOAuth}
          onChange={o("allowFacebookOAuth")}
        />
      </FieldGroup>
    </div>
  );
}

const SECTION_COMPONENTS = {
  general: GeneralSection,
  email: EmailSection,
  security: SecuritySection,
};

// ── Main page ──────────────────────────────────────────────────────────────

export default function SuperAdminSystemSettings() {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState("general");
  const [formState, setFormState] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  // ── Derive active section from URL hash ──────────────────────────────────
  useEffect(() => {
    const hash = location.hash.replace("#", "");
    setActiveSection(SECTION_KEYS.includes(hash) ? hash : "general");
  }, [location.hash]);

  // ── Fetch settings on mount ──────────────────────────────────────────────
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      // getAuthHeadersAsync handles token expiry + refresh automatically
      const headers = await getAuthHeadersAsync();
      const res = await fetch(`${API_BASE}/super-admin/settings/`, { headers });

      if (!res.ok) {
        // Read as text first so HTML error pages don't crash JSON.parse
        const text = await res.text();
        throw new Error(`Server ${res.status}: ${text.slice(0, 200)}`);
      }

      const data = await res.json();
      setFormState(data);
    } catch (err) {
      setMessage({ type: "error", text: `Failed to load settings: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // ── Handle field changes ─────────────────────────────────────────────────
  const handleChange = (section, key, value) => {
    setFormState((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
    setMessage({ type: "", text: "" });
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!formState) return;
    setSaving(true);
    setMessage({ type: "", text: "" });
    try {
      const headers = await getAuthHeadersAsync();
      const res = await fetch(`${API_BASE}/super-admin/settings/`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(formState),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server ${res.status}: ${text.slice(0, 200)}`);
      }

      const data = await res.json();
      if (data.settings) setFormState(data.settings);
      setMessage({ type: "success", text: data.message || "Settings saved successfully." });
    } catch (err) {
      setMessage({ type: "error", text: `Save failed: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  const ActiveSection = SECTION_COMPONENTS[activeSection];

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-3xl border border-white/10 bg-gray-900/80 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <div className="text-xs uppercase tracking-[0.3em] text-red-400">Super Admin</div>
              <h1 className="text-3xl font-black text-white">System Settings</h1>
              <p className="max-w-2xl text-sm text-gray-400">
                Configure global application settings including site identity, email delivery, and
                security policies.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-3xl border border-white/10 bg-gray-950/60 px-4 py-3 text-xs uppercase tracking-[0.25em] text-gray-300">
                {SECTION_TITLES[activeSection]}
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || loading || !formState}
                className="rounded-2xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save Settings"}
              </button>
            </div>
          </div>
        </div>

        {/* Section tabs */}
        <div className="rounded-3xl border border-white/10 bg-gray-900/80 p-5">
          <div className="flex flex-wrap gap-2">
            {SECTION_KEYS.map((section) => (
              <a
                key={section}
                href={`#${section}`}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeSection === section
                    ? "bg-red-500 text-white"
                    : "bg-white/5 text-gray-300 hover:bg-white/10"
                }`}
              >
                {SECTION_TITLES[section]}
              </a>
            ))}
          </div>
        </div>

        {/* Feedback banner */}
        {message.text && (
          <div
            className={`rounded-3xl border px-5 py-4 text-sm ${
              message.type === "success"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                : "border-red-500/20 bg-red-500/10 text-red-300"
            }`}
          >
            {message.type === "success" ? "✓ " : "✕ "}
            {message.text}
          </div>
        )}

        {/* Active section content */}
        {loading ? (
          <SkeletonSection />
        ) : !formState ? (
          <div className="rounded-3xl border border-white/10 bg-gray-900/80 p-10 text-center">
            <p className="text-gray-400 mb-4">Could not load settings.</p>
            <button
              onClick={fetchSettings}
              className="rounded-2xl bg-red-500 px-5 py-2 text-sm font-semibold text-white hover:bg-red-400"
            >
              Retry
            </button>
          </div>
        ) : (
          <ActiveSection state={formState[activeSection]} onChange={handleChange} />
        )}
      </div>
    </SuperAdminLayout>
  );
}