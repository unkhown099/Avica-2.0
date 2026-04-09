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

function ProfilePage() {
  const sessionUser = getUserFromSession();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [customerStats, setCustomerStats] = useState(null);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);

      const userResponse = await fetch(`${API}/me/`, {
        headers: authHeaders(),
        credentials: "include",
      });

      if (!userResponse.ok) {
        throw new Error("Failed to fetch profile");
      }

      const userData = await userResponse.json();

      const statsResponse = await fetch(`${API}/api/customer/dashboard/`, {
        headers: authHeaders(),
        credentials: "include",
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setCustomerStats(statsData);
      }

      setForm({
        first_name: userData.first_name || "",
        last_name: userData.last_name || "",
        email: userData.email || "",
        phone: userData.phone || "",
      });
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const userResponse = await fetch(`${API}/me/`, {
        method: "PUT",
        headers: authHeaders(),
        credentials: "include",
        body: JSON.stringify({
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone,
        }),
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to update profile");
      }

      const updatedUser = await userResponse.json();
      const currentUser = getUserFromSession();
      const updatedUserData = {
        ...currentUser,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        phone: updatedUser.phone,
      };

      const storage = localStorage.getItem("user")
        ? localStorage
        : sessionStorage;
      storage.setItem("user", JSON.stringify(updatedUserData));

      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Error saving profile:", err);
      setError(err.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const initials =
    (
      (form.first_name?.[0] || "") + (form.last_name?.[0] || "")
    ).toUpperCase() || "?";

  if (loading) {
    return (
      <CustomerLayout>
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-950/30 p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading profile...</p>
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
            My <span className="text-red-600">Profile</span>
          </h1>
          <p className="text-gray-400">
            Manage your personal information.
          </p>
        </div>

        {/* Success Message */}
        {saved && (
          <div className="mb-6 bg-green-600/20 border border-green-600/40 text-green-400 px-5 py-3 rounded-xl flex items-center gap-3 font-semibold animate-in slide-in-from-top-2 duration-300">
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
            Profile updated successfully!
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-600/20 border border-red-600/40 text-red-400 px-5 py-3 rounded-xl flex items-center gap-3 font-semibold">
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

        {/* Avatar Card */}
        <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-red-950/20 rounded-2xl p-4 sm:p-6 border border-white/10 mb-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="relative flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden flex items-center justify-center text-2xl sm:text-3xl font-black text-white bg-gradient-to-br from-red-600 to-red-800 ring-4 ring-red-500/30">
                {sessionUser?.profile_picture ? (
                  <img
                    src={sessionUser.profile_picture}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-gray-900 flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-white"
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
              </div>
            </div>

            {/* Name / email / badges */}
            <div className="text-center sm:text-left flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {form.first_name} {form.last_name}
              </h2>
              <p className="text-gray-400 text-sm flex items-center gap-1 justify-center sm:justify-start">
                <svg
                  className="w-3 h-3 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span className="truncate">{form.email}</span>
              </p>
              <div className="flex items-center gap-2 mt-3 justify-center sm:justify-start flex-wrap">
                <span className="px-3 py-1 bg-red-600/20 text-red-500 border border-red-600/30 rounded-full text-xs font-bold flex items-center gap-1">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  {sessionUser?.role === "customer"
                    ? "Customer"
                    : sessionUser?.role || "Member"}
                </span>
                {customerStats?.average_rating && (
                  <span className="px-3 py-1 bg-yellow-600/20 text-yellow-400 border border-yellow-600/30 rounded-full text-xs font-bold flex items-center gap-1">
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                    {customerStats.average_rating.toFixed(1)} Rating
                  </span>
                )}
                {customerStats?.total_appointments && (
                  <span className="px-3 py-1 bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-full text-xs font-bold flex items-center gap-1">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {customerStats.total_appointments} Appointments
                  </span>
                )}
              </div>
            </div>

            {/* Edit/Save button — full width on mobile */}
            <button
              onClick={() => (editing ? handleSave() : setEditing(true))}
              disabled={saving}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold transition-all duration-300 hover:scale-105 text-sm ${saving ? "opacity-50 cursor-not-allowed" : ""} ${
                editing
                  ? "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/30"
                  : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-600/30"
              }`}
            >
              {saving ? (
                <>
                  <svg
                    className="w-4 h-4 inline animate-spin mr-2"
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
              ) : editing ? (
                "Save Changes"
              ) : (
                "Edit Profile"
              )}
            </button>
          </div>
        </div>

        {/* Info Cards — stack on mobile, side-by-side on md+ */}
        <div className="grid grid-cols-1 gap-6">
          {/* Personal Info */}
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 rounded-2xl border border-white/10 overflow-hidden backdrop-blur-sm hover:border-red-500/30 transition-all duration-300">
            <div className="bg-gradient-to-r from-red-600/20 to-transparent px-6 py-4 border-b border-white/10">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <div className="p-1.5 bg-red-600/20 rounded-lg">
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                Personal Information
              </h3>
            </div>
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              {[
                {
                  label: "First Name",
                  name: "first_name",
                  icon: "M3 10h18M6 14h3m-3 0h3m-3 0H6m10 0h3m-3 0h3m-3 0h3",
                },
                {
                  label: "Last Name",
                  name: "last_name",
                  icon: "M3 10h18M6 14h3m-3 0h3m-3 0H6m10 0h3m-3 0h3m-3 0h3",
                },
                {
                  label: "Email Address",
                  name: "email",
                  type: "email",
                  disabled: true,
                  icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
                },
                {
                  label: "Phone Number",
                  name: "phone",
                  icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
                },
                {
                  label: "Role",
                  name: "role_display",
                  disabled: true,
                  icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
                },
              ].map(
                ({ label, name, type = "text", disabled = false, icon }) => (
                  <div key={name} className="group">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <svg
                        className="w-3 h-3"
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
                      {label}
                    </label>
                    {editing && !disabled ? (
                      <input
                        type={type}
                        name={name}
                        value={form[name]}
                        onChange={handleChange}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-all text-sm hover:border-white/20"
                      />
                    ) : (
                      <div className="bg-black/30 rounded-xl px-4 py-2.5 border border-white/5 group-hover:border-white/10 transition-all">
                        <p className="text-white font-medium text-sm truncate">
                          {(name === "role_display"
                            ? sessionUser?.role === "customer"
                              ? "Customer"
                              : sessionUser?.role || "Member"
                            : form[name]) || (
                            <span className="text-gray-500">—</span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                ),
              )}
            </div>
          </div>
        </div>

        {/* Cancel / Save footer — full width buttons on mobile */}
        {editing && (
          <div className="flex flex-col sm:flex-row gap-3 mt-6 sm:justify-end">
            <button
              onClick={() => {
                setEditing(false);
                setError(null);
                fetchUserProfile();
              }}
              className="w-full sm:w-auto px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:w-auto px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all hover:scale-105 shadow-lg shadow-green-600/30 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}

export default ProfilePage;