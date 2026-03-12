import React, { useState } from "react";
import CustomerLayout from "./CustomerLayout";
import { getUserFromSession } from "../../utils/getUser";

function ProfilePage() {
  const sessionUser = getUserFromSession();

  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    firstName: sessionUser?.firstName || "Juan",
    lastName: sessionUser?.lastName || "dela Cruz",
    email: sessionUser?.email || "juan@example.com",
    phone: "+63 912 345 6789",
    address: "123 Rizal St., Quezon City",
    carMake: "Toyota",
    carModel: "Fortuner",
    carYear: "2022",
    carColor: "Pearl White",
    carPlate: "ABC 1234",
  });

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = () => {
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const initials =
    ((form.firstName?.[0] || "") + (form.lastName?.[0] || "")).toUpperCase() ||
    "JD";

  return (
    <CustomerLayout>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-950/30 p-4 sm:p-6 lg:p-8">
        {" "}
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">
            My <span className="text-red-600">Profile</span>
          </h1>
          <p className="text-gray-400">
            Manage your personal information and vehicles.
          </p>
        </div>
        {saved && (
          <div className="mb-6 bg-green-600/20 border border-green-600/40 text-green-400 px-5 py-3 rounded-xl flex items-center gap-3 font-semibold">
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
            Profile updated successfully!
          </div>
        )}
        {/* Avatar Card */}
        <div className="bg-gradient-to-br from-gray-900 to-red-950/10 rounded-2xl p-6 border border-white/5 mb-6 flex flex-col sm:flex-row items-center gap-5">
          <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center text-2xl font-black text-white shrink-0">
            {initials}
          </div>
          <div className="text-center sm:text-left flex-1">
            <h2 className="text-2xl font-black text-white">
              {form.firstName} {form.lastName}
            </h2>
            <p className="text-gray-400 text-sm">{form.email}</p>
            <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start flex-wrap">
              <span className="px-3 py-1 bg-red-600/20 text-red-500 border border-red-600/30 rounded-full text-xs font-bold">
                Customer
              </span>
              <span className="px-3 py-1 bg-yellow-600/20 text-yellow-400 border border-yellow-600/30 rounded-full text-xs font-bold">
                ⭐ 5.0 Rating
              </span>
            </div>
          </div>
          <button
            onClick={() => (editing ? handleSave() : setEditing(true))}
            className={`px-6 py-2.5 rounded-xl font-bold transition-all duration-300 hover:scale-105 text-sm ${
              editing
                ? "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/30"
                : "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30"
            }`}
          >
            {editing ? "Save Changes" : "Edit Profile"}
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Personal Info */}
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Personal Information
            </h3>
            <div className="space-y-4">
              {[
                { label: "First Name", name: "firstName" },
                { label: "Last Name", name: "lastName" },
                { label: "Email Address", name: "email", type: "email" },
                { label: "Phone Number", name: "phone" },
                { label: "Address", name: "address" },
              ].map(({ label, name, type = "text" }) => (
                <div key={name}>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    {label}
                  </label>
                  {editing ? (
                    <input
                      type={type}
                      name={name}
                      value={form[name]}
                      onChange={handleChange}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-red-600 transition-colors text-sm"
                    />
                  ) : (
                    <p className="text-white font-medium text-sm">
                      {form[name]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Vehicle Info */}
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
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
              Vehicle Information
            </h3>
            <div className="space-y-4">
              {[
                { label: "Make", name: "carMake" },
                { label: "Model", name: "carModel" },
                { label: "Year", name: "carYear" },
                { label: "Color", name: "carColor" },
                { label: "Plate Number", name: "carPlate" },
              ].map(({ label, name }) => (
                <div key={name}>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    {label}
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      name={name}
                      value={form[name]}
                      onChange={handleChange}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-red-600 transition-colors text-sm"
                    />
                  ) : (
                    <p className="text-white font-medium text-sm">
                      {form[name]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        {editing && (
          <div className="flex gap-3 mt-6 justify-end">
            <button
              onClick={() => setEditing(false)}
              className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all hover:scale-105 shadow-lg shadow-green-600/30 text-sm"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}

export default ProfilePage;
