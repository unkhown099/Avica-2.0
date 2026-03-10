import React, { useState } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/otokwikklogo.png";

function Navbar({ user, setUser }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    const refresh =
      localStorage.getItem("refresh_token") ||
      sessionStorage.getItem("refresh_token");
    const access =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");

    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/logout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access}`,
        },
        body: JSON.stringify({ refresh }),
      });
    } catch (_) {
      // fail silently — still clear storage
    }

    ["access_token", "refresh_token", "user"].forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    if (typeof setUser === "function") setUser(null);

    await Swal.fire({
      icon: "success",
      title: "Logged Out",
      text: "You have been logged out successfully.",
      background: "linear-gradient(to bottom right, #1f2937, #111827)",
      color: "#fff",
      confirmButtonColor: "#dc2626",
    });

    navigate("/signin");
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-black/95 backdrop-blur-md shadow-lg border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center">
            <a href="/dashboard">
              <img
                src={logo}
                alt="Otokwikk logo"
                className="h-16 md:h-20 object-contain"
              />
            </a>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Services", href: "/services" },
              { label: "My Bookings", href: "/bookings" },
              { label: "History", href: "/history" },
            ].map(({ label, href }) => (
              <a
                key={href}
                href={href}
                className="text-white hover:text-red-600 font-semibold transition-colors duration-300 relative group"
              >
                {label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-600 transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </div>

          {/* User Profile Section */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/10 transition-all duration-300"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {user?.firstName?.charAt(0)}
                  {user?.lastName?.charAt(0)}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-white font-semibold text-sm">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-gray-400 text-xs">{user?.email}</p>
              </div>
              <svg
                className={`w-5 h-5 text-white transition-transform duration-300 ${isProfileOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl border border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-700">
                  <p className="text-white font-bold">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-gray-400 text-sm">{user?.email}</p>
                </div>

                <div className="py-2">
                  {[
                    {
                      label: "My Profile",
                      href: "/profile",
                      icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
                    },
                    {
                      label: "Settings",
                      href: "/settings",
                      icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
                    },
                    {
                      label: "Help & Support",
                      href: "/help",
                      icon: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                    },
                  ].map(({ label, href, icon }) => (
                    <a
                      key={href}
                      href={href}
                      className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/10 hover:text-white transition-colors duration-300"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                      </svg>
                      <span>{label}</span>
                    </a>
                  ))}
                </div>

                <div className="border-t border-gray-700 p-2">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-600/10 transition-colors duration-300 w-full rounded-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="font-semibold">Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;