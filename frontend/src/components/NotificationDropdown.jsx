import React, { useState, useEffect, useRef } from "react";
import { API_BASE, useAuth } from "../hooks/useAuth.js";

const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
};

const NotificationDropdown = () => {
    const { headers } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/notifications/`, { headers });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.is_read).length);
            }
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        }
    };

    useEffect(() => {
        if (headers.Authorization) {
            fetchNotifications();
            // Poll every 60 seconds
            const interval = setInterval(fetchNotifications, 60000);
            return () => clearInterval(interval);
        }
    }, [headers]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const markAsRead = async (id) => {
        try {
            await fetch(`${API_BASE}/api/notifications/${id}/read/`, {
                method: "POST",
                headers
            });
            fetchNotifications();
        } catch (err) {
            console.error(err);
        }
    };

    const markAllRead = async () => {
        try {
            await fetch(`${API_BASE}/api/notifications/mark-all-read/`, {
                method: "POST",
                headers
            });
            fetchNotifications();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5 focus:outline-none"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600 text-[10px] font-bold text-white items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
                        <h3 className="text-white font-bold">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="text-xs text-red-400 hover:text-red-300 font-semibold"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-gray-500 text-sm font-medium">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    onClick={() => !n.is_read && markAsRead(n.id)}
                                    className={`p-4 border-b border-white/5 hover:bg-white/5 transition-all cursor-pointer ${!n.is_read ? 'bg-red-500/5' : ''}`}
                                >
                                    <div className="flex gap-3">
                                        <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${!n.is_read ? 'bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)]' : 'bg-transparent'}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm leading-relaxed ${!n.is_read ? 'text-white font-medium' : 'text-gray-400 font-normal'}`}>
                                                {n.message}
                                            </p>
                                            <p className="text-[10px] text-gray-500 mt-1.5 uppercase tracking-wider font-bold">
                                                {timeAgo(n.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
