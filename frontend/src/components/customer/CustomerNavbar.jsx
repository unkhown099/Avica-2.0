import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Swal from "sweetalert2";
import { useNavigate, Link } from "react-router-dom";
import logo from "../../assets/otokwikklogo.png";
import { API_BASE, useAuth } from "../../hooks/useAuth.js";
import { useTheme } from "../../context/ThemeContext.jsx";
import ServiceMessageDropdown from "../ServiceMessageDropdown.jsx";

// ── icons ──────────────────────────────────────────────────────────────────
const IconBell = () => (
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
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
    />
  </svg>
);

const IconChevron = ({ open }) => (
  <svg
    className={`w-4 h-4 text-white transition-transform duration-300 ${open ? "rotate-180" : ""}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

const IconMenu = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
);

const IconX = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const IconUser = () => (
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
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const IconSettings = () => (
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
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

const IconHelp = () => (
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
      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const IconLogout = () => (
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
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
    />
  </svg>
);

const IconCalendar = () => (
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
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const IconCheck = () => (
  <svg
    className="w-4 h-4"
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
);

const formatTimeAgo = (dateValue) => {
  const seconds = Math.floor((Date.now() - new Date(dateValue).getTime()) / 1000);
  if (!Number.isFinite(seconds) || seconds < 0) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
};

const mapNotificationForUI = (notif) => {
  const type = (notif.notification_type || "general").toLowerCase();
  if (type === "appointment") {
    return {
      ...notif,
      read: !!notif.is_read,
      time: formatTimeAgo(notif.created_at),
      icon: <IconCalendar />,
      accent: "text-emerald-400",
      bg: "bg-emerald-500/10",
    };
  }
  return {
    ...notif,
    read: !!notif.is_read,
    time: formatTimeAgo(notif.created_at),
    icon: <IconCheck />,
    accent: "text-amber-400",
    bg: "bg-amber-500/10",
  };
};

// ── close dropdown on outside click ───────────────────────────────────────
function useOutsideClick(ref, callback) {
  useEffect(() => {
    const handler = (e) => {
      // Check if click is inside the target ref OR a portal dropdown
      if (ref.current?.contains(e.target) || e.target.closest('.portal-dropdown')) {
        return;
      }
      callback();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, callback]);
}

// ── main component ─────────────────────────────────────────────────────────
function Navbar({ user: userProp, setUser }) {
  const { user: authUser, headers } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const [localUser, setLocalUser] = useState(() => userProp || authUser);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationTab, setNotificationTab] = useState("all");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  const navigate = useNavigate();

  useOutsideClick(profileRef, () => setIsProfileOpen(false));
  useOutsideClick(notifRef, () => setIsNotifOpen(false));

  useEffect(() => {
    if (userProp) setLocalUser(userProp);
  }, [userProp]);

  const fetchNotifications = async () => {
    if (!headers.Authorization) return;
    try {
      const res = await fetch(`${API_BASE}/api/notifications/`, { headers });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data.map(mapNotificationForUI) : []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    if (!headers.Authorization) return;
    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 60000);
    return () => clearInterval(intervalId);
  }, [headers.Authorization]);

  const user = localUser;
  const unreadCount = notifications.filter((n) => !n.read).length;
  const visibleNotifications =
    notificationTab === "unread"
      ? notifications.filter((n) => !n.read)
      : notifications;

  const markAllRead = async () => {
    try {
      await fetch(`${API_BASE}/api/notifications/mark-all-read/`, {
        method: "POST",
        headers,
      });
      fetchNotifications();
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const markRead = async (id) => {
    try {
      await fetch(`${API_BASE}/api/notifications/${id}/read/`, {
        method: "PATCH",
        headers,
      });
      fetchNotifications();
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const resolveNotificationPath = (notif) => {
    const targetPath = String(notif?.target_path || "").trim();
    if (targetPath) {
      return targetPath.startsWith("/") ? targetPath : `/${targetPath}`;
    }

    const type = String(notif?.notification_type || "").toLowerCase();
    const message = String(notif?.message || "").toLowerCase();

    if (type === "appointment" || message.includes("booking") || message.includes("appointment")) {
      return "/bookings";
    }
    if (message.includes("history") || message.includes("completed")) {
      return "/history";
    }
    if (message.includes("profile") || message.includes("account")) {
      return "/profile";
    }
    return "/dashboard";
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      await markRead(notif.id);
    }
    setIsNotifOpen(false);
    navigate(resolveNotificationPath(notif));
  };

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Confirm Logout",
      text: "Are you sure you want to log out?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#374151",
      confirmButtonText: "Yes, logout",
      background: "linear-gradient(to bottom right, #1f2937, #111827)",
      color: "#fff",
    });

    if (!result.isConfirmed) return;

    const refresh =
      localStorage.getItem("refresh_token") ||
      sessionStorage.getItem("refresh_token");
    const access =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");

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

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Guest";
  const initials =
    (
      (user?.firstName?.[0] || "") + (user?.lastName?.[0] || "")
    ).toUpperCase() || "?";
  const email = user?.email || "";

  const NAV_LINKS = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Services", href: "/services" },
    { label: "My Bookings", href: "/bookings" },
    { label: "History", href: "/history" },
  ];

  const PROFILE_ITEMS = [
    { label: "My Profile", href: "/profile", icon: <IconUser /> },
    // { label: "Settings", href: "/settings", icon: <IconSettings /> },
    { label: "Help & Support", href: "/help", icon: <IconHelp /> },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-black/95 backdrop-blur-md shadow-lg border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* ── Logo ── */}
          <div className="flex items-center shrink-0">
            <Link to="/dashboard" className="flex items-center">
              <img
                src={logo}
                alt="Otokwikk logo"
                className="h-8 sm:h-10 md:h-12 w-auto object-contain transition-transform duration-300 hover:scale-105"
              />
            </Link>
          </div>

          {/* ── Desktop nav links ── */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                to={href}
                className="text-white hover:text-red-500 font-semibold transition-colors duration-300 relative group text-sm lg:text-base"
              >
                {label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-red-600 transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </div>

          {/* ── Right: bell + profile + hamburger ── */}
          <div className="flex items-center gap-1 sm:gap-2 md:ml-4">
            {/* ── Message Icon ── */}
            <ServiceMessageDropdown />

            {/* ── Notification Bell ── */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  setIsNotifOpen((v) => !v);
                  setIsProfileOpen(false);
                }}
                className="relative p-2 sm:p-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
                aria-label="Notifications"
              >
                <IconBell />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-4 h-4 bg-red-600 rounded-full text-white text-[10px] font-black flex items-center justify-center leading-none shadow-lg shadow-red-600/50 animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown — full width on mobile */}
              {isNotifOpen && (
                isMobile ? createPortal(
                  <div className="notif-dropdown fixed top-[70px] left-4 right-4 bg-gradient-to-br from-gray-900 to-gray-950 rounded-xl shadow-2xl border border-gray-700/60 overflow-hidden z-[10000] animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/60 font-sans">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-sm">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded-full">{unreadCount} new</span>
                        )}
                      </div>
                      <button onClick={markAllRead} className="text-xs text-red-400 font-bold uppercase tracking-widest">Mark all read</button>
                    </div>

                    <div className="px-4 py-2 border-b border-gray-700/60">
                      <div className="inline-flex bg-gray-800/70 rounded-lg p-1 gap-1">
                        <button
                          onClick={() => setNotificationTab("all")}
                          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${notificationTab === "all" ? "bg-red-600 text-white" : "text-gray-300 hover:text-white hover:bg-white/5"}`}
                        >All</button>
                        <button
                          onClick={() => setNotificationTab("unread")}
                          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${notificationTab === "unread" ? "bg-red-600 text-white" : "text-gray-300 hover:text-white hover:bg-white/5"}`}
                        >Unread</button>
                      </div>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-800/60 scrollbar-thin font-sans">
                      {notifications.length === 0 ? (
                        <div className="py-10 text-center text-gray-500 text-sm italic">No notifications yet</div>
                      ) : (
                        visibleNotifications.map((notif) => (
                          <button
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`w-full text-left px-4 py-3.5 hover:bg-white/5 transition-colors duration-200 flex items-start gap-3 ${!notif.read ? "bg-white/[0.03]" : ""}`}
                          >
                            <div className={`shrink-0 w-8 h-8 rounded-lg ${notif.bg} ${notif.accent} flex items-center justify-center mt-0.5`}>{notif.icon}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className={`text-sm font-semibold leading-tight ${!notif.read ? "text-white" : "text-gray-300"}`}>{notif.title}</p>
                                <span className="text-[10px] text-gray-500 whitespace-nowrap shrink-0 mt-0.5">{notif.time}</span>
                              </div>
                              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed line-clamp-2">{notif.message}</p>
                            </div>
                            {!notif.read && <div className="shrink-0 w-2 h-2 bg-red-500 rounded-full mt-2" />}
                          </button>
                        ))
                      )}
                    </div>
                  </div>,
                  document.body
                ) : (
                  <div className="notif-dropdown absolute right-0 mt-2 w-80 md:w-96 max-w-sm bg-gradient-to-br from-gray-900 to-gray-950 rounded-xl shadow-2xl border border-gray-700/60 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/60">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-sm">Notifications</span>
                        {unreadCount > 0 && <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded-full">{unreadCount} new</span>}
                      </div>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs text-red-400 hover:text-red-300 font-semibold transition-colors">Mark all read</button>
                      )}
                    </div>

                    <div className="px-4 py-2 border-b border-gray-700/60">
                      <div className="inline-flex bg-gray-800/70 rounded-lg p-1 gap-1">
                        <button onClick={() => setNotificationTab("all")} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${notificationTab === "all" ? "bg-red-600 text-white" : "text-gray-300 hover:text-white hover:bg-white/5"}`}>All</button>
                        <button onClick={() => setNotificationTab("unread")} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${notificationTab === "unread" ? "bg-red-600 text-white" : "text-gray-300 hover:text-white hover:bg-white/5"}`}>Unread</button>
                      </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-800/60 scrollbar-thin">
                      {notifications.length === 0 ? (
                        <div className="py-10 text-center text-gray-500 text-sm italic">No notifications yet</div>
                      ) : (
                        visibleNotifications.map((notif) => (
                          <button
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`w-full text-left px-4 py-3.5 hover:bg-white/5 transition-colors duration-200 flex items-start gap-3 ${!notif.read ? "bg-white/[0.03]" : ""}`}
                          >
                            <div className={`shrink-0 w-8 h-8 rounded-lg ${notif.bg} ${notif.accent} flex items-center justify-center mt-0.5`}>{notif.icon}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className={`text-sm font-semibold leading-tight ${!notif.read ? "text-white" : "text-gray-300"}`}>{notif.title}</p>
                                <span className="text-[10px] text-gray-500 whitespace-nowrap shrink-0 mt-0.5">{notif.time}</span>
                              </div>
                              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed line-clamp-2">{notif.message}</p>
                            </div>
                            {!notif.read && <div className="shrink-0 w-2 h-2 bg-red-500 rounded-full mt-2" />}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )
              )}
            </div>

            {/* ── Profile button (desktop only, sm+) ── */}
            <div className="relative hidden sm:block" ref={profileRef}>
              <button
                onClick={() => {
                  setIsProfileOpen((v) => !v);
                  setIsNotifOpen(false);
                }}
                className="flex items-center gap-2 lg:gap-3 px-2 lg:px-4 py-2 rounded-lg hover:bg-white/10 transition-all duration-300"
              >
                <div
                  className="user-profile-avatar w-9 h-9 lg:w-10 lg:h-10 rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-md"
                  style={{ backgroundColor: "#dc2626", backgroundImage: "linear-gradient(135deg, #dc2626, #991b1b)", color: "#ffffff" }}
                >
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-sm" style={{ color: "#ffffff" }}>
                      {initials}
                    </span>
                  )}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-white font-semibold text-sm leading-tight">
                    {fullName}
                  </p>
                  {email && (
                    <p className="text-gray-400 text-xs truncate max-w-[140px]">
                      {email}
                    </p>
                  )}
                </div>
                <IconChevron open={isProfileOpen} />
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div className="profile-dropdown absolute right-0 mt-2 w-64 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl border border-gray-700 overflow-hidden">
                  <div className="p-4 border-b border-gray-700">
                    <p className="text-white font-bold">{fullName}</p>
                    {email && (
                      <p className="text-gray-400 text-sm truncate">{email}</p>
                    )}
                  </div>
                  <div className="py-2">
                    {PROFILE_ITEMS.map(({ label, href, icon }) => (
                      <Link
                        key={href}
                        to={href}
                        className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/10 hover:text-white transition-colors duration-200"
                      >
                        <span className="shrink-0">{icon}</span>
                        <span className="text-sm">{label}</span>
                      </Link>
                    ))}

                    {/* Theme Toggle */}
                    <button
                      onClick={toggleTheme}
                      className="w-full flex items-center justify-between px-4 py-3 text-gray-300 hover:bg-white/10 hover:text-white transition-colors duration-200 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="shrink-0">
                          {isDark ? (
                            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                          )}
                        </span>
                        <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
                      </div>
                      <div className={`relative w-8 h-4 rounded-full transition-colors duration-300 ${isDark ? "bg-gray-700" : "bg-red-500"}`}>
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all duration-300 ${isDark ? "left-0.5" : "left-[18px]"}`} />
                      </div>
                    </button>
                  </div>
                  <div className="border-t border-gray-700 p-2">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-600/10 transition-colors duration-200 w-full rounded-lg"
                    >
                      <IconLogout />
                      <span className="font-semibold text-sm">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Mobile: Avatar only (no dropdown — handled in mobile menu) ── */}
            <div className="flex sm:hidden items-center">
              <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-red-600 to-red-700">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-xs">
                    {initials}
                  </span>
                )}
              </div>
            </div>

            {/* ── Hamburger ── */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 ml-1"
              onClick={() => setIsMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {isMobileOpen ? <IconX /> : <IconMenu />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      {isMobileOpen && (
        <div className="md:hidden border-t border-gray-800 bg-black/98 backdrop-blur-md">
          {/* User info */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-800">
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shrink-0 bg-gradient-to-br from-red-600 to-red-700">
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-sm">{initials}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm">{fullName}</p>
              {email && (
                <p className="text-gray-400 text-xs truncate">{email}</p>
              )}
            </div>
          </div>

          {/* Nav links */}
          <div className="px-2 py-2 border-b border-gray-800">
            <p className="px-3 py-1 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
              Navigation
            </p>
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                to={href}
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center px-3 py-3 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-colors duration-200 font-semibold text-sm"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Account links */}
          <div className="px-2 py-2 border-b border-gray-800">
            <p className="px-3 py-1 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
              Account
            </p>
            {PROFILE_ITEMS.map(({ label, href, icon }) => (
              <Link
                key={href}
                to={href}
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-colors duration-200 text-sm"
              >
                <span className="text-gray-500 shrink-0">{icon}</span>
                {label}
              </Link>
            ))}

            {/* Mobile Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-between w-full px-3 py-3 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-colors duration-200 text-sm"
            >
              <div className="flex items-center gap-3">
                <span className="shrink-0">
                  {isDark ? (
                    <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </span>
                <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
              </div>
              <div className={`relative w-8 h-4 rounded-full transition-colors duration-300 ${isDark ? "bg-gray-700" : "bg-red-500"}`}>
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all duration-300 ${isDark ? "left-0.5" : "left-[18px]"}`} />
              </div>
            </button>
          </div>

          {/* Logout */}
          <div className="px-2 py-3">
            <button
              onClick={() => {
                setIsMobileOpen(false);
                handleLogout();
              }}
              className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-red-500 hover:bg-red-600/10 transition-colors duration-200 font-semibold text-sm"
            >
              <IconLogout />
              Logout
            </button>
          </div>
        </div>
      )}

    </nav>
  );
}

export default Navbar;
