import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuth, API_BASE } from "../hooks/useAuth.js";
import { useTheme } from "../context/ThemeContext.jsx";

const IconUser = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const IconSettings = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const IconLogout = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);

const IconSun = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
    </svg>
);

const IconMoon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
);

const ProfileDropdown = () => {
    const { user, role } = useAuth();
    const { toggleTheme, isDark } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        const result = await Swal.fire({
            title: "Confirm Logout",
            text: "Are you sure you want to log out?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#374151",
            confirmButtonText: "Yes, logout",
            background: isDark ? "linear-gradient(to bottom right, #1f2937, #111827)" : "#ffffff",
            color: isDark ? "#fff" : "#111",
        });

        if (!result.isConfirmed) return;

        const refresh = localStorage.getItem("refresh_token") || sessionStorage.getItem("refresh_token");
        const access = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");

        try {
            await fetch(`${API_BASE}/logout/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${access}`,
                },
                body: JSON.stringify({ refresh }),
            });
        } catch (_) { }

        ["access_token", "refresh_token", "user"].forEach((key) => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });

        await Swal.fire({
            icon: "success",
            title: "Logged Out",
            text: "You have been logged out successfully.",
            background: isDark ? "linear-gradient(to bottom right, #1f2937, #111827)" : "#ffffff",
            color: isDark ? "#fff" : "#111",
            confirmButtonColor: "#dc2626",
        });

        navigate("/signin");
    };

    const [currentUser, setCurrentUser] = useState(user);

    useEffect(() => {
        const handleStorageChange = () => {
            const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
            if (raw) {
                try {
                    const parsed = JSON.parse(raw);
                    setCurrentUser(parsed);
                } catch (e) {
                    console.error("ProfileDropdown sync error", e);
                }
            }
        };
        window.addEventListener("storage", handleStorageChange);
        window.addEventListener("userUpdate", handleStorageChange);
        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("userUpdate", handleStorageChange);
        };
    }, []);

    const userData = currentUser || user;
    const fullName = userData?.first_name ? `${userData.first_name} ${userData.last_name}` : (userData?.full_name || "User");
    const initials = ((userData?.first_name?.[0] || "") + (userData?.last_name?.[0] || "")).toUpperCase() || "?";

    const profilePic = userData?.profile_picture || userData?.profile_pic;
    let displayPic = null;
    if (profilePic) {
        if (profilePic.startsWith('http')) {
            displayPic = profilePic;
        } else {
            const baseUrl = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
            const picPath = profilePic.startsWith('/') ? profilePic : `/${profilePic}`;
            displayPic = `${baseUrl}${picPath}`;
        }
    }

    const settingsPath = role === 'super_admin' ? '/super-admin/account-settings' :
        role === 'business_owner' ? '/branch-owner/settings' :
            role === 'branch_manager' ? '/manager/settings' :
                `/${role?.replace('_', '-')}/settings`;

    // Theme-aware styles
    const dropdownBg = isDark
        ? "bg-gray-900 border border-white/10"
        : "bg-white border border-gray-200 shadow-xl";
    const itemText = isDark ? "text-gray-400" : "text-gray-600";
    const itemHover = isDark ? "hover:text-white hover:bg-white/5" : "hover:text-gray-900 hover:bg-gray-100";
    const headingColor = isDark ? "text-white" : "text-gray-900";
    const subTextColor = isDark ? "text-gray-500" : "text-gray-400";
    const headerBg = isDark ? "bg-black/20 border-white/5" : "bg-gray-50 border-gray-100";
    const dividerColor = isDark ? "border-white/5" : "border-gray-100";

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 p-1 rounded-full hover:bg-white/5 transition-all duration-200 group"
            >
                <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform overflow-hidden">
                    {displayPic ? (
                        <img
                            src={displayPic}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = `<span class="text-white font-black text-xs">${initials}</span>`;
                            }}
                        />
                    ) : (
                        <span className="text-white font-black text-xs">{initials}</span>
                    )}
                </div>
                <div className="hidden sm:block text-left mr-2">
                    <p className={`font-bold text-xs leading-tight truncate max-w-[120px] ${headingColor}`}>{fullName}</p>
                    <p className={`text-[10px] leading-tight truncate max-w-[120px] ${subTextColor}`}>{userData?.email}</p>
                </div>
            </button>

            {isOpen && (
                <div className={`absolute right-0 mt-3 w-60 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200 z-50 ${dropdownBg}`}>
                    {/* User info header */}
                    <div className={`p-4 border-b ${headerBg}`}>
                        <p className={`font-black text-sm truncate ${headingColor}`}>{fullName}</p>
                        <p className={`text-[10px] truncate ${subTextColor}`}>{user?.email}</p>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                        <Link
                            to={settingsPath}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${itemText} ${itemHover}`}
                        >
                            <IconUser />
                            My Profile
                        </Link>
                        <Link
                            to={settingsPath}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${itemText} ${itemHover}`}
                        >
                            <IconSettings />
                            Settings
                        </Link>

                        {/* ── Light / Dark Mode Toggle ── */}
                        <button
                            onClick={toggleTheme}
                            className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors ${itemText} ${itemHover}`}
                        >
                            <div className="flex items-center gap-3">
                                {isDark ? <IconSun /> : <IconMoon />}
                                <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
                            </div>
                            {/* Animated toggle pill */}
                            <div className={`relative w-10 h-5 rounded-full transition-colors duration-300 flex-shrink-0 ${isDark ? "bg-gray-700" : "bg-red-500"}`}>
                                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${isDark ? "left-0.5" : "left-[22px]"}`} />
                            </div>
                        </button>
                    </div>

                    {/* Logout */}
                    <div className={`border-t p-1 ${dividerColor}`}>
                        <button
                            onClick={() => { setIsOpen(false); handleLogout(); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors rounded-xl"
                        >
                            <IconLogout />
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileDropdown;
