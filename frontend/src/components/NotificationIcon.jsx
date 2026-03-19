import React from "react";

function NotificationIcon({ count = 0 }) {
    return (
        <button className="relative p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300 group">
            <svg
                className="w-6 h-6 transition-transform duration-300 group-hover:scale-110"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
            </svg>
            {/* Notification Badge */}
            <span className="absolute top-1.5 right-1.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600 border-2 border-gray-900"></span>
            </span>
        </button>
    );
}

export default NotificationIcon;
