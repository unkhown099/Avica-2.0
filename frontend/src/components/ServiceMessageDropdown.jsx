import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { API_BASE, useAuth } from "../hooks/useAuth.js";
import { useChat } from "../context/ChatContext.jsx";

const IconMessage = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
);

export default function ServiceMessageDropdown() {
    const { headers, role } = useAuth();
    const { openChat } = useChat();
    const [isOpen, setIsOpen] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
    const dropdownRef = useRef(null);
    const isEmployee = ["employee", "staff", "admin", "branch_manager", "super_admin"].includes(role);

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
            // Check if click is inside the anchor button/ref or inside the portal-dropdown
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
            bg-[#0f0f15] border border-gray-800 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200`}
        >
            <div className="p-4 border-b border-gray-800/60 bg-gray-900/50 flex justify-between items-center">
                <h3 className="text-white font-bold text-sm">Service Messages</h3>
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Recent Conversations</span>
            </div>

            <div className={`${isMobile ? 'max-h-[60vh]' : 'max-h-[450px]'} overflow-y-auto divide-y divide-gray-800/40 scrollbar-thin scrollbar-thumb-gray-800`}>
                {!conversations || conversations.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 italic text-xs">No conversations found.</div>
                ) : (
                    conversations.map((conv) => {
                        const displayName = isEmployee ? conv.customer_name : conv.employee_name;
                        const initial = (displayName || "S")[0].toUpperCase();

                        return (
                            <button
                                key={conv.id}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    openChat(conv.id);
                                    setIsOpen(false);
                                }}
                                className="w-full text-left p-4 hover:bg-white/5 flex gap-3 transition-colors group relative"
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-black shrink-0 shadow-lg ${conv.status === 'done' ? 'bg-gray-700' : 'bg-gradient-to-br from-red-600 to-red-700'}`}>
                                    {initial}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-0.5">
                                        <p className="font-bold text-sm truncate text-white">{displayName || 'Staff'}</p>
                                        <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold px-1.5 py-0.5 bg-white/5 rounded-md whitespace-nowrap">{conv.status}</span>
                                    </div>
                                    <p className="text-gray-400 text-xs truncate font-medium">{conv.service}</p>
                                    <p className="text-[11px] truncate mt-1 text-gray-500">{conv.last_message || 'Start a conversation...'}</p>
                                </div>
                                {conv.unread_count > 0 && (
                                    <div className="shrink-0 w-2.5 h-2.5 bg-red-600 rounded-full self-center shadow-lg shadow-red-600/50"></div>
                                )}
                            </button>
                        );
                    })
                )}
            </div>
            <div className="p-3 border-t border-gray-800 bg-gray-900/50 text-center text-[10px] text-gray-600">
                Messages are linked to your active or past services.
            </div>
        </div>
    );

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 sm:p-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
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
