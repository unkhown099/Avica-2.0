import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, User, ChevronLeft } from "lucide-react";
import { API_BASE } from "../../hooks/useAuth.js";
import { toast } from "react-toastify";
import { getUserFromSession } from "../../utils/getUser";

function MessengerWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [contacts, setContacts] = useState([]);
    const [selectedPartnerId, setSelectedPartnerId] = useState(null);
    const [selectedPartnerName, setSelectedPartnerName] = useState("");
    const [messages, setMessages] = useState([]);
    const [inputMsg, setInputMsg] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const token = localStorage.getItem("access_token");
    const user = getUserFromSession() || {};
    const messagesEndRef = useRef(null);

    // Check if I am a customer or employee
    const isCustomer = user.role === "Customer" || !user.role;
    // (Customer might not have a role in the session object, or it's "Customer")
    // Let's assume Employee has role "Employee" or "Mechanic"

    const fetchContacts = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/direct-messages/contacts/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setContacts(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchMessages = async (partnerId) => {
        try {
            if (!messages.length) setIsLoading(true);
            const res = await fetch(`${API_BASE}/api/direct-messages/${partnerId}/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
                setTimeout(() => scrollToBottom(), 100);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && token) {
            fetchContacts();
        }
    }, [isOpen, token]);

    useEffect(() => {
        let interval;
        if (isOpen && selectedPartnerId && token) {
            fetchMessages(selectedPartnerId);
            interval = setInterval(() => {
                fetchMessages(selectedPartnerId);
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [isOpen, selectedPartnerId, token]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!inputMsg.trim()) return;

        try {
            const res = await fetch(`${API_BASE}/api/direct-messages/${selectedPartnerId}/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ message: inputMsg })
            });
            const data = await res.json();
            if (res.ok) {
                setMessages((prev) => [...prev, data]);
                setInputMsg("");
                scrollToBottom();
            } else {
                toast.error(data.error || "Failed to send message");
            }
        } catch (err) {
            toast.error("Network error");
        }
    };

    // if (!token) return null;

    return (
        <div className="fixed bottom-24 left-5 z-50">
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-3.5 rounded-full shadow-[0_8px_25px_rgba(37,99,235,0.4)] transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center border-2 border-blue-400 group animate-bounce-slow"
                >
                    <MessageCircle size={28} className="group-hover:rotate-12 transition-transform" />
                    {/* Unread badge indicator simple */}
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full"></div>
                </button>
            )}

            {isOpen && (
                <div className="w-80 h-[450px] bg-[#111] border border-gray-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in slide-in-from-left-5 fade-in duration-300">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white px-4 py-4 flex justify-between items-center border-b border-blue-800 shadow-md">
                        <div className="flex items-center gap-3">
                            {selectedPartnerId && (
                                <button
                                    onClick={() => setSelectedPartnerId(null)}
                                    className="text-white/70 hover:text-white transition-colors"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                            )}
                            <div className="flex flex-col">
                                <h3 className="font-bold text-sm tracking-tight">{selectedPartnerId ? selectedPartnerName : "Avica Messenger"}</h3>
                                {!selectedPartnerId && <span className="text-[10px] text-white/60 font-medium uppercase tracking-widest">Customer Support</span>}
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Contacts List */}
                    {!selectedPartnerId && (
                        <div className="flex-1 overflow-y-auto p-2 bg-[#0a0a0a] custom-scrollbar">
                            <div className="px-3 pb-2 pt-1">
                                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Recent Chats</p>
                            </div>
                            {contacts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full opacity-40">
                                    <MessageCircle size={40} className="mb-2 text-gray-600" />
                                    <p className="text-center text-gray-500 text-xs">No active conversations.</p>
                                </div>
                            ) : (
                                contacts.map((c) => (
                                    <div
                                        key={c.id}
                                        onClick={() => {
                                            setSelectedPartnerId(c.id);
                                            setSelectedPartnerName(c.name);
                                        }}
                                        className="flex items-center gap-3 p-3 hover:bg-blue-600/10 rounded-xl cursor-pointer transition-all border border-transparent hover:border-blue-900/30 group"
                                    >
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-full flex flex-shrink-0 items-center justify-center shadow-lg group-hover:scale-105 transition-transform border border-blue-400/30">
                                            <User size={22} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate">{c.name}</p>
                                            <p className="text-[10px] text-gray-500 capitalize font-medium flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                                {c.role}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Chat Interface */}
                    {selectedPartnerId && (
                        <>
                            <div className="flex-1 overflow-y-auto p-4 bg-[#0a0a0a] flex flex-col gap-4 scrollbar-hide">
                                {isLoading && messages.length === 0 ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="text-center text-gray-500 text-xs mt-10">
                                        <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <MessageCircle size={24} />
                                        </div>
                                        <p>Say hello to <span className="font-bold text-gray-300">{selectedPartnerName}</span></p>
                                    </div>
                                ) : (
                                    messages.map((m) => {
                                        const iAmEmployee = user.role === "Employee";
                                        const isMyMessage = iAmEmployee ? m.sender_type === "employee" : m.sender_type === "customer";

                                        return (
                                            <div key={m.id} className={`flex flex-col ${isMyMessage ? "items-end" : "items-start"}`}>
                                                {!isMyMessage && (
                                                    <span className="text-[9px] font-bold text-gray-500 mb-1 px-1 uppercase tracking-tighter">
                                                        {m.sender_name}
                                                    </span>
                                                )}
                                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${isMyMessage
                                                    ? "bg-blue-600 text-white rounded-br-none shadow-lg shadow-blue-900/20"
                                                    : "bg-[#1f1f1f] border border-gray-800 text-gray-100 rounded-bl-none"
                                                    }`}>
                                                    {m.message}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                            <div className="p-4 border-t border-gray-800 bg-[#161616]">
                                <form onSubmit={handleSend} className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={inputMsg}
                                        onChange={(e) => setInputMsg(e.target.value)}
                                        placeholder="Aa"
                                        className="flex-1 bg-[#0a0a0a] border border-gray-800 text-white rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all placeholder:text-gray-600"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!inputMsg.trim()}
                                        className="bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 disabled:opacity-30 disabled:grayscale transition-all transform hover:scale-110 active:scale-95 shadow-lg shadow-blue-900/40"
                                    >
                                        <Send size={18} />
                                    </button>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            )}
            <style>{`
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(-5%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); }
                    50% { transform: translateY(0); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 3s infinite;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #222;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}

export default MessengerWidget;
