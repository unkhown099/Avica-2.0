import React, { useState, useEffect, useRef } from "react";
import { API_BASE } from "../hooks/useAuth.js";

export default function ServiceChatModal({ queueId, isEmployee, onClose, currentUserStr }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    const getAuthHeaders = () => {
        const token =
            localStorage.getItem("access_token") ||
            sessionStorage.getItem("access_token");
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    const fetchMessages = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/queue/${queueId}/messages/`, {
                headers: { "Content-Type": "application/json", ...getAuthHeaders() },
            });
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

    useEffect(() => {
        fetchMessages();
        // Poll for new messages every 5 seconds
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [queueId]);

    useEffect(() => {
        // Auto scroll down
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const tempMessage = newMessage;
        setNewMessage("");

        try {
            const res = await fetch(`${API_BASE}/api/queue/${queueId}/messages/`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...getAuthHeaders() },
                body: JSON.stringify({ message: tempMessage }),
            });
            if (res.ok) {
                const data = await res.json();
                setMessages((prev) => [...prev, data]);
            } else {
                setNewMessage(tempMessage); // rollback on fail
            }
        } catch (err) {
            console.error(err);
            setNewMessage(tempMessage); // rollback on fail
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg flex flex-col h-[600px] max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/5 bg-gray-900/50 rounded-t-2xl">
                    <div>
                        <h3 className="text-xl font-bold text-white">Service Chat</h3>
                        <p className="text-sm text-gray-400">
                            {isEmployee ? "Chat with Customer" : "Chat with your Assigned Employee"}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-500 hover:text-white bg-gray-800/50 hover:bg-gray-800 rounded-xl transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                    {loading ? (
                        <div className="flex justify-center items-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <svg className="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <p>No messages yet.</p>
                            <p className="text-sm">Send a message to start the conversation.</p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => {
                            const amISender = (isEmployee && msg.sender_type === "employee") || (!isEmployee && msg.sender_type === "customer");
                            return (
                                <div key={msg.id || idx} className={`flex ${amISender ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${amISender ? "bg-red-600 text-white rounded-br-none" : "bg-gray-800 text-gray-200 border border-gray-700/50 rounded-bl-none"}`}>
                                        {!amISender && (
                                            <p className="text-xs font-semibold mb-1 opacity-60">
                                                {msg.sender_name}
                                            </p>
                                        )}
                                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                                        <p className="text-[10px] text-right mt-1 opacity-50">
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="p-4 sm:p-5 border-t border-white/5 bg-gray-900/80 rounded-b-2xl">
                    <div className="flex gap-2 sm:gap-3 relative">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 bg-gray-800/80 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 transition-colors"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:hover:bg-red-600 text-white px-5 sm:px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center shadow-lg shadow-red-600/20"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
