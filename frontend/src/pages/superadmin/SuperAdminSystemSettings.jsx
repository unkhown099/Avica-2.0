import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import SuperAdminLayout from "./SuperAdminLayout.jsx";

const SECTION_KEYS = ["general", "email", "security"];
const SECTION_TITLES = {
  general: "General Settings",
  email: "Email Settings",
  security: "Security Settings",
};

const INITIAL_STATE = {
  general: {
    siteName: "Otokwikk",
    siteMode: "live",
    maintenanceMessage: "",
  },
  email: {
    mailHost: "smtp.example.com",
    mailPort: 587,
    mailFrom: "no-reply@otokwikk.com",
    supportEmail: "support@otokwikk.com",
  },
  security: {
    requireStrongPasswords: true,
    sessionTimeoutMinutes: 60,
    allowTwoFactor: true,
  },
};

function SectionContent({ section, state, onChange, onSubmit, saving }) {
  if (section === "general") {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-gray-900/80 p-6">
            <h2 className="text-lg font-semibold text-white">Site identity</h2>
            <p className="text-sm text-gray-400 mt-2">Update the site name, mode, and maintenance message.</p>
            <div className="mt-6 space-y-4">
              <label className="block text-sm text-gray-300">
                <span className="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-400">Site name</span>
                <input
                  value={state.siteName}
                  onChange={(e) => onChange("general", "siteName", e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-gray-950 px-4 py-3 text-gray-100 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                />
              </label>
              <label className="block text-sm text-gray-300">
                <span className="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-400">Site mode</span>
                <select
                  value={state.siteMode}
                  onChange={(e) => onChange("general", "siteMode", e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-gray-950 px-4 py-3 text-gray-100 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                >
                  <option value="live">Live</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </label>
              <label className="block text-sm text-gray-300">
                <span className="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-400">Maintenance message</span>
                <textarea
                  value={state.maintenanceMessage}
                  onChange={(e) => onChange("general", "maintenanceMessage", e.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-white/10 bg-gray-950 px-4 py-3 text-gray-100 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                />
              </label>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-gray-900/80 p-6">
            <h2 className="text-lg font-semibold text-white">System status</h2>
            <p className="text-sm text-gray-400 mt-2">View quick operational mode and alerts.</p>
            <div className="mt-6 space-y-4 text-sm text-gray-300">
              <div className="rounded-2xl bg-gray-950/60 p-4">
                <div className="text-xs uppercase tracking-[0.3em] text-gray-500">Current mode</div>
                <div className="mt-2 text-lg font-semibold text-white">{state.siteMode === "live" ? "Live" : "Maintenance"}</div>
              </div>
              <div className="rounded-2xl bg-gray-950/60 p-4">
                <div className="text-xs uppercase tracking-[0.3em] text-gray-500">Site name</div>
                <div className="mt-2 text-lg font-semibold text-white">{state.siteName}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (section === "email") {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-gray-900/80 p-6">
          <h2 className="text-lg font-semibold text-white">Email configuration</h2>
          <p className="text-sm text-gray-400 mt-2">Set the SMTP connection and sender details.</p>
          <div className="mt-6 space-y-4">
            <label className="block text-sm text-gray-300">
              <span className="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-400">Mail host</span>
              <input
                value={state.mailHost}
                onChange={(e) => onChange("email", "mailHost", e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-gray-950 px-4 py-3 text-gray-100 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              />
            </label>
            <label className="block text-sm text-gray-300">
              <span className="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-400">Mail port</span>
              <input
                type="number"
                value={state.mailPort}
                onChange={(e) => onChange("email", "mailPort", Number(e.target.value))}
                className="w-full rounded-2xl border border-white/10 bg-gray-950 px-4 py-3 text-gray-100 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              />
            </label>
            <label className="block text-sm text-gray-300">
              <span className="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-400">Mail from address</span>
              <input
                value={state.mailFrom}
                onChange={(e) => onChange("email", "mailFrom", e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-gray-950 px-4 py-3 text-gray-100 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              />
            </label>
            <label className="block text-sm text-gray-300">
              <span className="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-400">Support email</span>
              <input
                value={state.supportEmail}
                onChange={(e) => onChange("email", "supportEmail", e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-gray-950 px-4 py-3 text-gray-100 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              />
            </label>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-3xl border border-white/10 bg-gray-900/80 p-6">
        <h2 className="text-lg font-semibold text-white">Security settings</h2>
        <p className="text-sm text-gray-400 mt-2">Configure password policy and session rules.</p>
        <div className="mt-6 space-y-4">
          <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-gray-950/80 p-4">
            <div>
              <div className="text-sm font-semibold text-white">Require strong passwords</div>
              <div className="text-xs text-gray-400">Force password complexity for all accounts.</div>
            </div>
            <input
              type="checkbox"
              checked={state.requireStrongPasswords}
              onChange={(e) => onChange("security", "requireStrongPasswords", e.target.checked)}
              className="h-5 w-5 rounded border-gray-600 bg-gray-900 text-red-500"
            />
          </label>
          <label className="block text-sm text-gray-300">
            <span className="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-400">Session timeout (minutes)</span>
            <input
              type="number"
              value={state.sessionTimeoutMinutes}
              onChange={(e) => onChange("security", "sessionTimeoutMinutes", Number(e.target.value))}
              className="w-full rounded-2xl border border-white/10 bg-gray-950 px-4 py-3 text-gray-100 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            />
          </label>
          <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-gray-950/80 p-4">
            <div>
              <div className="text-sm font-semibold text-white">Allow two-factor authentication</div>
              <div className="text-xs text-gray-400">Enforce 2FA for super admin logins.</div>
            </div>
            <input
              type="checkbox"
              checked={state.allowTwoFactor}
              onChange={(e) => onChange("security", "allowTwoFactor", e.target.checked)}
              className="h-5 w-5 rounded border-gray-600 bg-gray-900 text-red-500"
            />
          </label>
        </div>
      </div>
    </div>
  );
}

export default function SuperAdminSystemSettings() {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState("general");
  const [formState, setFormState] = useState(INITIAL_STATE);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (SECTION_KEYS.includes(hash)) {
      setActiveSection(hash);
    } else {
      setActiveSection("general");
    }
  }, [location.hash]);

  const handleChange = (section, key, value) => {
    setFormState((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    // TODO: replace with actual API call when backend settings endpoints are available.
    await new Promise((resolve) => setTimeout(resolve, 500));

    setSaving(false);
    setMessage("Settings saved successfully.");
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-gray-900/80 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <div className="text-xs uppercase tracking-[0.3em] text-red-400">Super Admin</div>
              <h1 className="text-3xl font-black text-white">System Settings</h1>
              <p className="max-w-2xl text-sm text-gray-400">
                Configure global application settings for the super admin portal, including email delivery, security, and system mode.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-3xl border border-white/10 bg-gray-950/60 px-4 py-3 text-xs uppercase tracking-[0.25em] text-gray-300">
                Active section: {SECTION_TITLES[activeSection]}
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-2xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </div>

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

        {message && (
          <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-200">
            {message}
          </div>
        )}

        <SectionContent
          section={activeSection}
          state={formState[activeSection]}
          onChange={handleChange}
          onSubmit={handleSave}
          saving={saving}
        />
      </div>
    </SuperAdminLayout>
  );
}
