import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import SuperAdminLayout from "./SuperAdminLayout.jsx";
import { API_BASE, getAuthHeadersAsync } from "../../hooks/useAuth.js";

const SECTION_KEYS = ["general", "email"];
const SECTION_TITLES = {
  general: "General",
  email: "Email",
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

function TextInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  disabled = false,
}) {
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
        disabled={disabled}
        className={`w-full rounded-2xl border border-white/10 bg-gray-950 px-4 py-3 text-gray-100 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
      />
    </label>
  );
}

function SelectInput({ label, value, onChange, options, disabled = false }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-400">
        {label}
      </span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full rounded-2xl border border-white/10 bg-gray-950 px-4 py-3 text-gray-100 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
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

function Toggle({ label, description, checked, onChange, disabled = false }) {
  return (
    <div className={`flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-gray-950/80 p-4 ${
      disabled ? "opacity-50" : ""
    }`}>
      <div>
        <div className="text-sm font-semibold text-white">{label}</div>
        {description && (
          <div className="mt-0.5 text-xs text-gray-400">{description}</div>
        )}
      </div>
      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? "bg-red-500" : "bg-gray-700"
        } ${disabled ? "cursor-not-allowed" : ""}`}
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
      <div className="text-xs uppercase tracking-[0.3em] text-gray-500">
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}

// Maintenance mode warning banner
function MaintenanceWarningBanner({ isActive, onDismiss }) {
  if (!isActive) return null;
  
  return (
    <div className="rounded-3xl border border-yellow-500/20 bg-yellow-500/10 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="text-yellow-500 text-xl">⚠️</div>
          <div>
            <h3 className="font-semibold text-yellow-200">Maintenance Mode Active</h3>
            <p className="text-sm text-yellow-300/80 mt-1">
              Your site is currently in maintenance mode. Regular users cannot access the site.
              Only users with roles (super_admin, admin, business_owner) can access the application.
            </p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-yellow-400 hover:text-yellow-300 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// Preview maintenance page button
function MaintenancePreviewButton({ maintenanceMessage }) {
  const [showPreview, setShowPreview] = useState(false);
  
  if (!showPreview) {
    return (
      <button
        onClick={() => setShowPreview(true)}
        className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        Preview Maintenance Page
      </button>
    );
  }
  
  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl">
        <button
          onClick={() => setShowPreview(false)}
          className="absolute -top-12 right-0 text-white hover:text-red-500 transition-colors"
        >
          Close Preview
        </button>
        <div className="bg-black rounded-lg overflow-hidden border border-white/10">
          <div className="bg-red-600/20 border-b border-red-600/30 p-3 text-center">
            <p className="text-sm text-red-300">Maintenance Mode Preview</p>
          </div>
          <div className="p-6">
            <div className="text-center">
              <div className="text-6xl mb-4">🔧</div>
              <h2 className="text-2xl font-bold text-white mb-2">Under Maintenance</h2>
              <p className="text-gray-400">
                {maintenanceMessage || "We're currently performing scheduled maintenance. We'll be back shortly!"}
              </p>
            </div>
          </div>
        </div>
      </div>
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
      <FieldGroup
        title="Site identity"
        description="Basic information about the platform."
      >
        <TextInput
          label="Site name"
          value={state.siteName}
          onChange={o("siteName")}
        />
        <TextInput
          label="Site tagline"
          value={state.siteTagline}
          onChange={o("siteTagline")}
        />
        <SelectInput
          label="Site mode"
          value={state.siteMode}
          onChange={o("siteMode")}
          options={[
            { value: "live", label: "🟢 Live" },
            { value: "maintenance", label: "🔴 Maintenance" },
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
            disabled={state.siteMode !== "maintenance"}
            className={`w-full rounded-2xl border border-white/10 bg-gray-950 px-4 py-3 text-gray-100 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 ${
              state.siteMode !== "maintenance" ? "opacity-50 cursor-not-allowed" : ""
            }`}
            placeholder={state.siteMode !== "maintenance" ? "Maintenance message only visible when maintenance mode is active" : ""}
          />
        </label>
      </FieldGroup>

      <div className="space-y-6">
        <FieldGroup
          title="Locale & support"
          description="Regional defaults and help link."
        >
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
          <TextInput
            label="Support URL"
            value={state.supportUrl}
            onChange={o("supportUrl")}
          />
        </FieldGroup>

        <FieldGroup
          title="System status"
          description="Live snapshot of current settings."
        >
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
        <TextInput
          label="Mail host"
          value={state.mailHost}
          onChange={o("mailHost")}
        />
        <TextInput
          label="Mail port"
          value={state.mailPort}
          onChange={o("mailPort")}
          type="number"
        />
        <TextInput
          label="Mail from address"
          value={state.mailFrom}
          onChange={o("mailFrom")}
        />
        <TextInput
          label="Support email"
          value={state.supportEmail}
          onChange={o("supportEmail")}
        />
      </FieldGroup>
      <FieldGroup
        title="Email behavior"
        description="Control when emails are sent to users."
      >
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

const SECTION_COMPONENTS = {
  general: GeneralSection,
  email: EmailSection,
};

// ── Main page ──────────────────────────────────────────────────────────────

export default function SuperAdminSystemSettings() {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState("general");
  const [formState, setFormState] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showMaintenanceWarning, setShowMaintenanceWarning] = useState(true);

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
      const headers = await getAuthHeadersAsync();
      const res = await fetch(`${API_BASE}/super-admin/settings/`, { headers });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server ${res.status}: ${text.slice(0, 200)}`);
      }

      const data = await res.json();
      setFormState(data);
    } catch (err) {
      setMessage({
        type: "error",
        text: `Failed to load settings: ${err.message}`,
      });
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

const handleSave = async () => {
  if (!formState) return;
  setSaving(true);
  setMessage({ type: "", text: "" });
  
  const previousMode = formState.general.siteMode;
  
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
    const updatedSettings = data.settings || formState;
    if (data.settings) setFormState(data.settings);

    const isMaintenanceActive = updatedSettings?.general?.siteMode === "maintenance";
    const maintenanceMessageText = updatedSettings?.general?.maintenanceMessage || "We're currently performing scheduled maintenance. We'll be back shortly!";
    
    // Broadcast maintenance mode change with CORRECT data structure
    if (typeof window !== "undefined") {
      const maintenanceData = {
        isActive: isMaintenanceActive,
        message: maintenanceMessageText,
        canBypass: true, // Super admin saving settings can always bypass
        updatedAt: new Date().toISOString(),
      };
      
      console.log("Saving maintenance data to localStorage:", maintenanceData);
      localStorage.setItem("maintenance_mode", JSON.stringify(maintenanceData));
      
      // Dispatch event for other tabs
      window.dispatchEvent(new Event("maintenance-mode-changed"));
      
      // Also dispatch a custom event with details
      const customEvent = new CustomEvent("maintenance-status-updated", {
        detail: maintenanceData
      });
      window.dispatchEvent(customEvent);
    }

    // Show different success message based on mode change
    let successMessage = data.message || "Settings saved successfully.";
    if (previousMode !== updatedSettings?.general?.siteMode) {
      if (isMaintenanceActive) {
        successMessage = "✓ Maintenance mode activated. Only admins can now access the site.";
      } else {
        successMessage = "✓ Maintenance mode deactivated. Site is now live for all users.";
      }
    }
    
    setMessage({
      type: "success",
      text: successMessage,
    });
    
    // Reset warning banner visibility if maintenance was just activated
    if (isMaintenanceActive) {
      setShowMaintenanceWarning(true);
    }
    
    // Force a page reload to ensure all components get the new status
    // Optional: You can uncomment this if you want to force refresh
    // setTimeout(() => window.location.reload(), 1000);
    
  } catch (err) {
    setMessage({ type: "error", text: `Save failed: ${err.message}` });
  } finally {
    setSaving(false);
  }
};

  const ActiveSection = SECTION_COMPONENTS[activeSection];
  const isCurrentlyInMaintenance = formState?.general?.siteMode === "maintenance";

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Maintenance Warning Banner */}
        {showMaintenanceWarning && (
          <MaintenanceWarningBanner 
            isActive={isCurrentlyInMaintenance}
            onDismiss={() => setShowMaintenanceWarning(false)}
          />
        )}
        
        {/* Header */}
        <div className="rounded-3xl border border-white/10 bg-gray-900/80 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <div className="text-xs uppercase tracking-[0.3em] text-red-400">
                Super Admin
              </div>
              <h1 className="text-3xl font-black text-white">
                System Settings
              </h1>
              <p className="max-w-2xl text-sm text-gray-400">
                Configure global application settings including site identity and email delivery.
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
                className="rounded-2xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving…
                  </>
                ) : (
                  "Save Settings"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Section tabs */}
        <div className="rounded-3xl border border-white/10 bg-gray-900/80 p-5">
          <div className="flex flex-wrap gap-2 items-center justify-between">
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
            <MaintenancePreviewButton 
              maintenanceMessage={formState?.general?.maintenanceMessage}
            />
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
          <ActiveSection
            state={formState[activeSection]}
            onChange={handleChange}
          />
        )}
      </div>
    </SuperAdminLayout>
  );
}