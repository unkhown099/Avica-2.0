import React, { useState, useEffect, useRef } from "react";
import { API_BASE, useAuth } from "../hooks/useAuth.js";
import { useChat } from "../context/ChatContext.jsx";

export default function MessengerPopup({ queueId, index = 0, onClose }) {
    const { headers, role, user } = useAuth();
    const { minimizedChats, toggleMinimize } = useChat();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [details, setDetails] = useState(null);
    const messagesEndRef = useRef(null);
    const isEmployee = ["employee", "staff", "admin", "branch_manager", "super_admin"].includes(role);

    const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
    const isMinimized = minimizedChats.includes(queueId);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchMessages = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/queue/${queueId}/messages/`, { headers });
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (error) {
            console.error("Failed to load messages", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDetails = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/queue/conversations/`, { headers });
            if (res.ok) {
                const data = await res.json();
                const item = data.find(c => c.id === queueId);
                if (item) setDetails(item);
            }
        } catch (err) { }
    };

    useEffect(() => {
        if (!isMinimized) {
            fetchMessages();
            fetchDetails();
            const interval = setInterval(() => {
                fetchMessages();
                fetchDetails();
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [queueId, headers, isMinimized]);

    useEffect(() => {
        if (messagesEndRef.current && !isMinimized) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isMinimized]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        if (details?.status === 'done' || details?.status === 'skipped') return;

        const msgContent = newMessage;
        setNewMessage("");

        try {
            const res = await fetch(`${API_BASE}/api/queue/${queueId}/messages/`, {
                method: "POST",
                headers,
                body: JSON.stringify({ message: msgContent }),
            });
            if (res.ok) {
                const data = await res.json();
                setMessages((prev) => [...prev, data]);
            } else {
                setNewMessage(msgContent);
            }
        } catch (err) {
            setNewMessage(msgContent);
        }
    };

    const isLocked = ['done', 'skipped', 'no_show', 'cancelled', 'cancelled_by_customer'].includes(details?.status);

    // Positioning: Facebook style popups stack from right to left
    const rightOffset = isMobile
        ? (isMinimized ? 16 + (index * 12) : 16)
        : (100 + (index * 336));

    const displayName = isEmployee ? details?.customer_name : details?.employee_name;
    const partnerPic = isEmployee ? details?.customer_pic : details?.employee_pic;
    let partnerDisplayPic = null;
    if (partnerPic) {
        if (partnerPic.startsWith('http')) {
            partnerDisplayPic = partnerPic;
        } else {
            const baseUrl = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
            const picPath = partnerPic.startsWith('/') ? partnerPic : `/${partnerPic}`;
            partnerDisplayPic = `${baseUrl}${picPath}`;
        }
    }

    return (
        <div
            className={`fixed bottom-0 sm:bottom-5 z-[9999] transition-all duration-300 ${isMinimized
                ? 'w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-[0_4px_24px_rgba(220,38,38,0.35)] border border-red-500/50 mb-4 sm:mb-0'
                : 'w-[calc(100vw-32px)] sm:w-80 h-[65vh] sm:h-96 bg-[#0f0f15] border border-gray-800 rounded-t-2xl sm:rounded-t-xl shadow-2xl'
                } flex flex-col`}
            style={{ right: `${rightOffset}px` }}
        >
            {isMinimized ? (
                /* Chathead Style */
                <button
                    onClick={() => toggleMinimize(queueId)}
                    className="w-full h-full rounded-full flex items-center justify-center bg-gradient-to-br from-red-600 to-red-700 text-white font-black shadow-lg overflow-hidden relative group"
                >
                    {partnerDisplayPic ? (
                        <img
                            src={partnerDisplayPic}
                            alt={displayName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerText = (displayName || details?.customer_name || "S")[0].toUpperCase();
                            }}
                        />
                    ) : (
                        (displayName || details?.customer_name || "S")[0].toUpperCase()
                    )}
                    {details?.unread_count > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-red-600 text-[10px] font-black rounded-full flex items-center justify-center border-2 border-red-600 shadow-lg group-hover:scale-110 transition-transform">
                            {details.unread_count}
                        </span>
                    )}
                </button>
            ) : (
                <>
                    {/* Header */}
                    <div className="p-3 bg-red-600 text-white flex justify-between items-center rounded-t-2xl sm:rounded-t-xl cursor-pointer shadow-md" onClick={() => toggleMinimize(queueId)}>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black overflow-hidden shrink-0 border border-white/20">
                                {(() => {
                                    const initial = (displayName || "S")[0].toUpperCase();
                                    if (partnerDisplayPic) {
                                        return (
                                            <img
                                                src={partnerDisplayPic}
                                                alt={initial}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.parentElement.innerText = initial;
                                                }}
                                            />
                                        );
                                    }
                                    return initial;
                                })()}
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-xs truncate leading-tight">{displayName || 'Loading...'}</p>
                                <p className="text-[10px] opacity-80 truncate">{details?.service || 'Service Chat'}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={(e) => { e.stopPropagation(); toggleMinimize(queueId); }} className="hover:bg-black/10 p-1 rounded transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M18 12H6" strokeWidth={2} strokeLinecap="round" /></svg>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="hover:bg-black/10 p-1 rounded transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2} strokeLinecap="round" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#0f0f15] scrollbar-thin scrollbar-thumb-gray-800">
                        {loading ? (
                            <div className="flex justify-center items-center h-full">
                                <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            messages.map((msg, i) => {
                                const currentUserId = user?.id || user?.pk;
                                const isMe = Number(msg.sender_user) === Number(currentUserId);

                                let senderPic = null;
                                if (msg.sender_pic) {
                                    if (msg.sender_pic.startsWith('http')) {
                                        senderPic = msg.sender_pic;
                                    } else {
                                        const baseUrl = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
                                        const picPath = msg.sender_pic.startsWith('/') ? msg.sender_pic : `/${msg.sender_pic}`;
                                        senderPic = `${baseUrl}${picPath}`;
                                    }
                                }

                                return (
                                    <div key={i} className={`flex gap-2 ${isMe ? 'flex-row-reverse items-end' : 'flex-row items-start'}`}>
                                        {!isMe && (
                                            <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[8px] font-black overflow-hidden shrink-0 mt-0.5">
                                                {senderPic ? (
                                                    <img
                                                        src={senderPic}
                                                        className="w-full h-full object-cover"
                                                        alt=""
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.parentElement.innerText = (msg.sender_name || "S")[0].toUpperCase();
                                                        }}
                                                    />
                                                ) : (
                                                    (msg.sender_name || "S")[0].toUpperCase()
                                                )}
                                            </div>
                                        )}
                                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%]`}>
                                            <div className={`px-3 py-2 rounded-2xl text-xs shadow-sm ${isMe
                                                ? 'bg-red-600 text-white rounded-tr-none'
                                                : 'bg-gray-800 text-gray-200 rounded-tl-none'
                                                }`}>
                                                {msg.message}
                                            </div>
                                            <span className="text-[9px] text-gray-600 mt-1 px-1">
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-gray-800 bg-gray-900/50">
                        {isLocked ? (
                            <div className="text-[11px] text-gray-500 text-center py-2 bg-black/20 rounded-lg border border-white/5 italic">
                                Messaging is disabled for this finalized service.
                            </div>
                        ) : (
                            <form onSubmit={handleSend} className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-gray-800 border-none rounded-xl px-4 py-2 text-xs text-white focus:ring-1 focus:ring-red-500 placeholder-gray-600 transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white p-2 rounded-xl transition-all shadow-lg active:scale-95 shrink-0"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </button>
                            </form>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
