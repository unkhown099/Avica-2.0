import React, { useState } from "react";
import CustomerLayout from "./CustomerLayout";

function Toggle({ enabled, onChange }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none ${enabled ? "bg-red-600" : "bg-gray-700"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${enabled ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
}

function SettingsPage() {
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
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <CustomerLayout>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-950/30 p-4 sm:p-6 lg:p-8">
        {" "}
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">
            Account <span className="text-red-600">Settings</span>
          </h1>
          <p className="text-gray-400">Manage your preferences and security.</p>
        </div>
        <div className="max-w-2xl space-y-6">
          {saved && (
            <div className="bg-green-600/20 border border-green-600/40 text-green-400 px-5 py-3 rounded-xl flex items-center gap-3 font-semibold">
              <svg
                className="w-5 h-5"
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
              Settings saved!
            </div>
          )}

          {/* Notifications */}
          <div className="bg-gradient-to-br from-gray-900 to-red-950/10 rounded-2xl p-6 border border-white/5">
            <h3 className="text-base font-black text-white mb-5 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-red-600"
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
              Notifications
            </h3>
            <div className="space-y-1">
              {[
                {
                  key: "bookingConfirmation",
                  label: "Booking Confirmations",
                  desc: "Get notified when a booking is confirmed",
                },
                {
                  key: "bookingReminders",
                  label: "Booking Reminders",
                  desc: "Receive reminders 24hrs before your appointment",
                },
                {
                  key: "promotions",
                  label: "Promotions & Deals",
                  desc: "Exclusive offers and discounts",
                },
                {
                  key: "serviceUpdates",
                  label: "Service Updates",
                  desc: "Updates on your vehicle while being serviced",
                },
                {
                  key: "newsletter",
                  label: "Newsletter",
                  desc: "Monthly tips and car care articles",
                },
              ].map(({ key, label, desc }) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-4 py-3 border-b border-white/5 last:border-0"
                >
                  <div>
                    <p className="text-white font-semibold text-sm">{label}</p>
                    <p className="text-gray-500 text-xs">{desc}</p>
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

          {/* Privacy */}
          <div className="bg-gradient-to-br from-gray-900 to-red-950/10 rounded-2xl p-6 border border-white/5">
            <h3 className="text-base font-black text-white mb-5 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-red-600"
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
              Privacy
            </h3>
            <div className="space-y-1">
              {[
                {
                  key: "shareData",
                  label: "Share Usage Data",
                  desc: "Help us improve by sharing anonymous usage data",
                },
                {
                  key: "analytics",
                  label: "Analytics Cookies",
                  desc: "Allow analytics to improve your experience",
                },
              ].map(({ key, label, desc }) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-4 py-3 border-b border-white/5 last:border-0"
                >
                  <div>
                    <p className="text-white font-semibold text-sm">{label}</p>
                    <p className="text-gray-500 text-xs">{desc}</p>
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

          {/* Change Password */}
          <div className="bg-gradient-to-br from-gray-900 to-red-950/10 rounded-2xl p-6 border border-white/5">
            <h3 className="text-base font-black text-white mb-5 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-red-600"
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
              Change Password
            </h3>
            <div className="space-y-4">
              {[
                { label: "Current Password", key: "current" },
                { label: "New Password", key: "newPass" },
                { label: "Confirm New Password", key: "confirm" },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    {label}
                  </label>
                  <input
                    type="password"
                    value={passwords[key]}
                    onChange={(e) =>
                      setPasswords((p) => ({ ...p, [key]: e.target.value }))
                    }
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-red-600 transition-colors text-sm"
                    placeholder="••••••••"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-950/20 rounded-2xl p-6 border border-red-600/20">
            <h3 className="text-base font-black text-red-500 mb-2">
              Danger Zone
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              Once you delete your account, there is no going back. Please be
              certain.
            </p>
            <button className="px-5 py-2.5 border border-red-600/50 text-red-500 hover:bg-red-600 hover:text-white rounded-xl font-semibold text-sm transition-all duration-200">
              Delete Account
            </button>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black transition-all duration-300 hover:scale-105 shadow-xl shadow-red-600/30"
            >
              Save All Settings
            </button>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}

export default SettingsPage;
