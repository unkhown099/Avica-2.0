import React, { useState, useEffect } from "react";
import CustomerLayout from "./CustomerLayout";
import { API_BASE } from "../../hooks/useAuth.js";
import { getUserFromSession } from "../../utils/getUser";

// Auth helpers
const getToken = () =>
  localStorage.getItem("access_token") ??
  sessionStorage.getItem("access_token");

const authHeaders = () => ({
  "Content-Type": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

const API = API_BASE;

function Toggle({ enabled, onChange, disabled = false }) {
  return (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none shrink-0 ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${enabled ? "bg-red-600" : "bg-gray-700"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function SettingsPage() {
  const sessionUser = getUserFromSession();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const [notifications, setNotifications] = useState({
    bookingConfirmation: true,
    bookingReminders: true,
    promotions: false,
    serviceUpdates: true,
    newsletter: false,
  });

  const [privacy, setPrivacy] = useState({
    shareData: false,
    analytics: true,
  });

  const [passwords, setPasswords] = useState({
    current: "",
    newPass: "",
    confirm: "",
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API}/api/settings/`, {
        headers: authHeaders(),
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.notifications) setNotifications(data.notifications);
        if (data.privacy) setPrivacy(data.privacy);
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`${API}/api/settings/`, {
        method: "PUT",
        headers: authHeaders(),
        credentials: "include",
        body: JSON.stringify({ notifications, privacy }),
      });

      if (!response.ok) throw new Error("Failed to save settings");

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Error saving settings:", err);
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwords.current || !passwords.newPass || !passwords.confirm) {
      setError("Please fill in all password fields");
      return;
    }
    if (passwords.newPass !== passwords.confirm) {
      setError("New passwords do not match");
      return;
    }
    if (passwords.newPass.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`${API}/change-password/`, {
        method: "POST",
        headers: authHeaders(),
        credentials: "include",
        body: JSON.stringify({
          old_password: passwords.current,
          new_password: passwords.newPass,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to change password");
      }

      setPasswords({ current: "", newPass: "", confirm: "" });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Error changing password:", err);
      setError(err.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE MY ACCOUNT") {
      setError("Please type 'DELETE MY ACCOUNT' to confirm");
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`${API}/delete-account/`, {
        method: "DELETE",
        headers: authHeaders(),
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to delete account");

      localStorage.clear();
      sessionStorage.clear();
      import("sweetalert2").then((swal) => {
        swal.default
          .fire({
            title: "Account Deleted!",
            text: "Your account has been successfully deleted.",
            icon: "success",
            confirmButtonText: "Okay",
            background: "linear-gradient(to bottom right, #1f2937, #111827)",
            color: "#fff",
            confirmButtonColor: "#dc2626",
          })
          .then(() => {
            window.location.href = "/";
          });
      });
    } catch (err) {
      console.error("Error deleting account:", err);
      setError(err.message || "Failed to delete account");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-950/30 p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading settings...</p>
            </div>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-950/30 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">
            Account <span className="text-red-600">Settings</span>
          </h1>
          <p className="text-gray-400">Manage your preferences and security.</p>
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
          {/* Success Message */}
          {saved && (
            <div className="bg-green-600/20 border border-green-600/40 text-green-400 px-5 py-3 rounded-xl flex items-center gap-3 font-semibold animate-in slide-in-from-top-2 duration-300">
              <svg
                className="w-5 h-5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Settings saved successfully!
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-600/20 border border-red-600/40 text-red-400 px-5 py-3 rounded-xl flex items-center gap-3 font-semibold">
              <svg
                className="w-5 h-5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              {error}
            </div>
          )}

          {/* Notifications Section */}
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 rounded-2xl border border-white/10 overflow-hidden backdrop-blur-sm hover:border-red-500/30 transition-all duration-300">
            <div className="bg-gradient-to-r from-red-600/20 to-transparent px-4 sm:px-6 py-4 border-b border-white/10">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <div className="p-1.5 bg-red-600/20 rounded-lg shrink-0">
                  <svg
                    className="w-4 h-4 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </div>
                Notification Preferences
              </h3>
              <p className="text-gray-500 text-xs mt-1 ml-8">
                Choose how you want to be notified
              </p>
            </div>
            <div className="px-4 sm:px-6 py-4 space-y-2">
              {[
                {
                  key: "bookingConfirmation",
                  label: "Booking Confirmations",
                  desc: "Get notified when your booking is confirmed",
                  icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
                },
                {
                  key: "bookingReminders",
                  label: "Booking Reminders",
                  desc: "Receive reminders 24 hours before your appointment",
                  icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
                },
                {
                  key: "promotions",
                  label: "Promotions & Deals",
                  desc: "Exclusive offers and special discounts",
                  icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                },
                {
                  key: "serviceUpdates",
                  label: "Service Updates",
                  desc: "Real-time updates on your vehicle while being serviced",
                  icon: "M13 10V3L4 14h7v7l9-11h-7z",
                },
                {
                  key: "newsletter",
                  label: "Monthly Newsletter",
                  desc: "Car care tips and industry news",
                  icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
                },
              ].map(({ key, label, desc, icon }) => (
                <div
                  key={key}
                  className="group flex items-center justify-between gap-3 py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors rounded-lg px-2 -mx-2"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <svg
                      className="w-4 h-4 text-gray-500 mt-0.5 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={icon}
                      />
                    </svg>
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm group-hover:text-red-400 transition-colors">
                        {label}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5 leading-snug">
                        {desc}
                      </p>
                    </div>
                  </div>
                  <Toggle
                    enabled={notifications[key]}
                    onChange={(val) =>
                      setNotifications((p) => ({ ...p, [key]: val }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Privacy Section */}
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 rounded-2xl border border-white/10 overflow-hidden backdrop-blur-sm hover:border-red-500/30 transition-all duration-300">
            <div className="bg-gradient-to-r from-red-600/20 to-transparent px-4 sm:px-6 py-4 border-b border-white/10">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <div className="p-1.5 bg-red-600/20 rounded-lg shrink-0">
                  <svg
                    className="w-4 h-4 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                Privacy Controls
              </h3>
              <p className="text-gray-500 text-xs mt-1 ml-8">
                Control your data and privacy preferences
              </p>
            </div>
            <div className="px-4 sm:px-6 py-4 space-y-2">
              {[
                {
                  key: "shareData",
                  label: "Share Usage Data",
                  desc: "Help us improve by sharing anonymous usage data",
                  icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
                },
                {
                  key: "analytics",
                  label: "Analytics Cookies",
                  desc: "Allow analytics to improve your experience",
                  icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
                },
              ].map(({ key, label, desc, icon }) => (
                <div
                  key={key}
                  className="group flex items-center justify-between gap-3 py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors rounded-lg px-2 -mx-2"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <svg
                      className="w-4 h-4 text-gray-500 mt-0.5 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={icon}
                      />
                    </svg>
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm group-hover:text-red-400 transition-colors">
                        {label}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5 leading-snug">
                        {desc}
                      </p>
                    </div>
                  </div>
                  <Toggle
                    enabled={privacy[key]}
                    onChange={(val) =>
                      setPrivacy((p) => ({ ...p, [key]: val }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Change Password Section */}
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 rounded-2xl border border-white/10 overflow-hidden backdrop-blur-sm hover:border-red-500/30 transition-all duration-300">
            <div className="bg-gradient-to-r from-red-600/20 to-transparent px-4 sm:px-6 py-4 border-b border-white/10">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <div className="p-1.5 bg-red-600/20 rounded-lg shrink-0">
                  <svg
                    className="w-4 h-4 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                </div>
                Security
              </h3>
              <p className="text-gray-500 text-xs mt-1 ml-8">
                Update your password to keep your account secure
              </p>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              {[
                {
                  label: "Current Password",
                  key: "current",
                  placeholder: "Enter your current password",
                },
                {
                  label: "New Password",
                  key: "newPass",
                  placeholder: "At least 8 characters",
                },
                {
                  label: "Confirm New Password",
                  key: "confirm",
                  placeholder: "Re-enter your new password",
                },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    {label}
                  </label>
                  <input
                    type="password"
                    value={passwords[key]}
                    onChange={(e) =>
                      setPasswords((p) => ({ ...p, [key]: e.target.value }))
                    }
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-all text-sm placeholder-gray-600"
                    placeholder={placeholder}
                  />
                </div>
              ))}
              <button
                onClick={handleChangePassword}
                disabled={saving}
                className="w-full mt-2 px-4 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
              >
                Update Password
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-gradient-to-br from-red-950/20 to-red-950/10 rounded-2xl border border-red-600/20 overflow-hidden">
            <div className="bg-red-600/10 px-4 sm:px-6 py-4 border-b border-red-600/20">
              <h3 className="text-base font-black text-red-500 flex items-center gap-2">
                <svg
                  className="w-5 h-5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                Danger Zone
              </h3>
              <p className="text-gray-500 text-xs mt-1">
                Permanently delete your account and all associated data
              </p>
            </div>
            <div className="p-4 sm:p-6">
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-5 py-2.5 border border-red-600/50 text-red-500 hover:bg-red-600 hover:text-white rounded-xl font-semibold text-sm transition-all duration-200"
                >
                  Delete Account
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="bg-red-600/10 border border-red-600/30 rounded-xl p-4">
                    <p className="text-red-400 text-sm font-semibold mb-2">
                      ⚠️ Warning: This action cannot be undone
                    </p>
                    <p className="text-gray-400 text-xs">
                      This will permanently delete your account, all your
                      bookings, and personal data.
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Type{" "}
                      <span className="text-red-500">"DELETE MY ACCOUNT"</span>{" "}
                      to confirm
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-red-500 transition-all text-sm"
                      placeholder="DELETE MY ACCOUNT"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmText("");
                        setError(null);
                      }}
                      className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold text-sm transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleting}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
                    >
                      {deleting ? "Deleting..." : "Confirm Delete"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 pb-2">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-black transition-all duration-300 hover:scale-105 shadow-xl shadow-red-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <svg
                    className="w-5 h-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Saving...
                </>
              ) : (
                "Save All Settings"
              )}
            </button>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}

export default SettingsPage;