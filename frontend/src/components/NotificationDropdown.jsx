import React, { useState, useEffect, useRef } from "react";
import { API_BASE, useAuth } from "../hooks/useAuth.js";
import { useNavigate } from "react-router-dom";

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
    const { headers, role } = useAuth();
    const navigate = useNavigate();
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
                method: "PATCH",
                headers
            });
            fetchNotifications();
        } catch (err) {
            console.error(err);
        }
    };

    const getRoleBaseRoute = () => {
        const baseByRole = {
            super_admin: "/super-admin/dashboard",
            admin: "/admin/dashboard",
            business_owner: "/branch-owner/dashboard",
            branch_manager: "/manager/dashboard",
            inventory_manager: "/inventory-manager/dashboard",
            inventory: "/inventory/dashboard",
            staff: "/staff/dashboard",
            employee: "/employee/dashboard",
            customer: "/dashboard",
        };
        return baseByRole[role] ?? "/";
    };

    const resolveNotificationRoute = (notification) => {
        if (notification?.target_path) {
            return notification.target_path;
        }

        const source = `${notification?.title ?? ""} ${notification?.message ?? ""} ${notification?.notification_type ?? ""}`.toLowerCase();
        const routeGroups = {
            super_admin: {
                inventory: "/super-admin/dashboard",
                appointments: "/super-admin/dashboard",
                customers: "/super-admin/users",
                users: "/super-admin/users",
                content: "/super-admin/content",
            },
            admin: {
                inventory: "/admin/inventory",
                stock: "/admin/inventory",
                product: "/admin/inventory",
                appointments: "/admin/appointments",
                booking: "/admin/appointments",
                customers: "/admin/customers",
                service: "/admin/services",
                services: "/admin/services",
                staff: "/admin/staff",
                branch: "/admin/branches",
                revenue: "/admin/dashboard",
                forecast: "/admin/dashboard",
                analytics: "/admin/dashboard",
            },
            business_owner: {
                inventory: "/branch-owner/inventory",
                stock: "/branch-owner/inventory",
                appointments: "/branch-owner/appointments",
                booking: "/branch-owner/appointments",
                service: "/branch-owner/services",
                services: "/branch-owner/services",
                branch: "/branch-owner/branches",
                account: "/branch-owner/accounts",
                user: "/branch-owner/accounts",
                revenue: "/branch-owner/dashboard",
                forecast: "/branch-owner/dashboard",
                analytics: "/branch-owner/dashboard",
            },
            branch_manager: {
                inventory: "/manager/inventory",
                stock: "/manager/inventory",
                appointments: "/manager/appointments",
                booking: "/manager/appointments",
                customer: "/manager/customers",
                history: "/manager/history",
                content: "/manager/contents",
                account: "/manager/accounts",
                revenue: "/manager/dashboard",
                forecast: "/manager/dashboard",
                analytics: "/manager/dashboard",
            },
            inventory_manager: {
                inventory: "/inventory-manager/inventory",
                stock: "/inventory-manager/inventory",
                product: "/inventory-manager/inventory",
                movement: "/inventory-manager/transactions",
                transaction: "/inventory-manager/transactions",
                alert: "/inventory-manager/dashboard",
                forecast: "/inventory-manager/dashboard",
                analytics: "/inventory-manager/dashboard",
            },
            inventory: {
                inventory: "/inventory/stock",
                stock: "/inventory/stock",
                product: "/inventory/stock",
                movement: "/inventory/movement-log",
                transaction: "/inventory/movement-log",
                alert: "/inventory/alerts",
                forecast: "/inventory/dashboard",
                analytics: "/inventory/dashboard",
            },
            staff: {
                queue: "/staff/queue",
                appointment: "/staff/appointments",
                booking: "/staff/appointments",
                pos: "/staff/pos",
                vehicle: "/staff/vehicle-recognition",
            },
            employee: {
                schedule: "/employee/schedule",
                active: "/employee/active-jobs",
                job: "/employee/job-history",
                vehicle: "/employee/vehicle-recognition",
            },
            customer: {
                appointment: "/bookings",
                booking: "/bookings",
                service: "/services",
                history: "/history",
                profile: "/profile",
                settings: "/settings",
            },
        };

        const roleMap = routeGroups[role] ?? {};
        for (const [keyword, targetRoute] of Object.entries(roleMap)) {
            if (source.includes(keyword)) {
                return targetRoute;
            }
        }

        return getRoleBaseRoute();
    };

    const handleNotificationClick = async (notification) => {
        if (!notification?.is_read) {
            await markAsRead(notification.id);
        }

        setIsOpen(false);
        const targetRoute = resolveNotificationRoute(notification);
        navigate(targetRoute);
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
                                    onClick={() => handleNotificationClick(n)}
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
