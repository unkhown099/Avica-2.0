import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { API_BASE, useAuth } from "../hooks/useAuth.js";
import { useChat } from "../context/ChatContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import UserAvatar from "./common/UserAvatar.jsx";

const IconMessage = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
);

export default function ServiceMessageDropdown() {
    const { headers, role } = useAuth();
    const { openChat } = useChat();
    const { isDark } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchConversations = async () => {
        if (!headers.Authorization) return;
        try {
            const res = await fetch(`${API_BASE}/api/queue/conversations/`, { headers });
            if (res.ok) {
                const data = await res.json();
                setConversations(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchConversations();
        const interval = setInterval(fetchConversations, 10000);
        return () => clearInterval(interval);
    }, [headers]);

    useEffect(() => {
        const handler = (e) => {
            const isPortalClick = e.target.closest('.portal-dropdown');
            const isRefClick = dropdownRef.current && dropdownRef.current.contains(e.target);

            if (!isPortalClick && !isRefClick) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const totalUnread = (conversations || []).reduce((acc, c) => acc + (c.unread_count || 0), 0);

    const DropdownContent = (
        <div
            className={`portal-dropdown ${isMobile ? 'fixed top-[85px] left-4 right-4 z-[10000]' : 'absolute right-0 mt-3 w-96 z-[100]'} 
            ${isDark ? 'bg-[#0f0f15] border border-gray-800 shadow-[0_20px_60px_rgba(0,0,0,0.8)]' : 'bg-white border border-gray-200 shadow-2xl'} rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200`}
        >
            <div className={`p-4 border-b flex justify-between items-center ${isDark ? 'border-gray-800/60 bg-gray-900/50' : 'border-gray-100 bg-gray-50'}`}>
                <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Service Messages</h3>
                <span className={`text-[10px] uppercase tracking-widest font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Recent Conversations</span>
            </div>

            <div className={`${isMobile ? 'max-h-[60vh]' : 'max-h-[450px]'} overflow-y-auto divide-y ${isDark ? 'divide-gray-800/40 scrollbar-thumb-gray-800' : 'divide-gray-100 scrollbar-thumb-gray-200'} scrollbar-thin`}>
                {!conversations || conversations.length === 0 ? (
                    <div className={`p-12 text-center italic text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No conversations found.</div>
                ) : (
                    conversations.map((conv) => {
                        const isCustSide = ["employee", "staff", "admin", "branch_manager", "super_admin"].includes(role);
                        const displayName = isCustSide ? conv.customer_name : conv.employee_name;
                        const profilePic = isCustSide ? conv.customer_pic : conv.employee_pic;

                        return (
                            <button
                                key={conv.id}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    openChat(conv.id);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left p-4 flex gap-3 transition-colors group relative ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
                            >
                                <UserAvatar
                                    src={profilePic}
                                    name={displayName || 'User'}
                                    className="w-12 h-12 rounded-full"
                                    textClassName="text-white font-black text-sm"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-0.5">
                                        <p className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{displayName || 'Staff'}</p>
                                        <span className={`text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>{conv.status}</span>
                                    </div>
                                    <p className={`text-xs truncate font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{conv.service}</p>
                                    <p className={`text-[11px] truncate mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{conv.last_message || 'Start a conversation...'}</p>
                                </div>
                                {conv.unread_count > 0 && (
                                    <div className="shrink-0 w-2.5 h-2.5 bg-red-600 rounded-full self-center shadow-lg shadow-red-600/50"></div>
                                )}
                            </button>
                        );
                    })
                )}
            </div>
            <div className={`p-3 border-t text-center text-[10px] ${isDark ? 'border-gray-800 bg-gray-900/50 text-gray-500' : 'border-gray-100 bg-gray-50 text-gray-400'}`}>
                Messages are linked to your active or past services.
            </div>
        </div>
    );

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2 sm:p-2.5 rounded-lg transition-all duration-200 ${isDark ? 'text-gray-300 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                aria-label="Messages"
            >
                <IconMessage />
                {totalUnread > 0 && (
                    <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-4 h-4 bg-red-600 rounded-full text-white text-[10px] font-black flex items-center justify-center shadow-lg animate-pulse">
                        {totalUnread}
                    </span>
                )}
            </button>

            {isOpen && (isMobile ? createPortal(DropdownContent, document.body) : DropdownContent)}

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes blink {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
                .blink {
                    animation: blink 1.5s infinite;
                }
            `}} />
        </div>
    );
}
