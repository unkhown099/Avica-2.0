import { useState, useEffect, useRef, useCallback } from "react";
import Chatbot from "./Chatbot";
import { getUserFromSession } from "../../utils/getUser.js";
import { useChat } from "../../context/ChatContext.jsx";

const INITIAL_MESSAGES = [
  {
    role: "assistant",
    content: "Welcome to Otokwikk! 🚗✨ I'm your personal detailing assistant. How can I help you today?",
    id: "initial",
  },
];

// Build a storage key scoped to the current user so conversations
// never bleed between accounts.
function getChatKey(user) {
  const id = user?.id ?? user?.user_id ?? user?.pk ?? "guest";
  return `otokwikk_chat_${id}`;
}

// Mirrors wherever your JWT lives — checks sessionStorage first,
// then falls back to localStorage (matches the "remember me" pattern).
function getStorage() {
  const hasSession =
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("access") ||
    sessionStorage.getItem("jwt") ||
    sessionStorage.getItem("authToken");
  return hasSession ? sessionStorage : localStorage;
}

function loadMessages(user) {
  try {
    const key = getChatKey(user);
    const raw = getStorage().getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) { }
  return INITIAL_MESSAGES;
}

function saveMessages(user, messages) {
  try {
    getStorage().setItem(getChatKey(user), JSON.stringify(messages));
  } catch (_) { }
}

function clearMessages(user) {
  try {
    getStorage().removeItem(getChatKey(user));
  } catch (_) { }
}

export default function ChatbotWidget() {
  const [user, setUser] = useState(() => getUserFromSession());
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [pulseActive, setPulseActive] = useState(false);
  const [messages, setMessages] = useState(() => loadMessages(getUserFromSession()));

  const [pos, setPos] = useState(null);
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const windowRef = useRef(null);

  // Re-sync user and reload correct chat history when auth changes
  // (login, logout, or storage event from another tab).
  useEffect(() => {
    const handleStorage = () => {
      const freshUser = getUserFromSession();
      setUser(freshUser);
      setMessages(loadMessages(freshUser));
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Persist messages whenever they change, scoped to current user.
  useEffect(() => {
    saveMessages(user, messages);
  }, [messages, user]);

  useEffect(() => {
    const t = setTimeout(() => setPulseActive(true), 3000);
    return () => clearTimeout(t);
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!dragging.current) return;
    const x = e.clientX - dragOffset.current.x;
    const y = e.clientY - dragOffset.current.y;
    const w = windowRef.current?.offsetWidth || 360;
    const h = windowRef.current?.offsetHeight || 520;
    setPos({
      x: Math.max(8, Math.min(window.innerWidth - w - 8, x)),
      y: Math.max(8, Math.min(window.innerHeight - h - 8, y)),
    });
  }, []);

  const onMouseUp = useCallback(() => {
    dragging.current = false;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  }, [onMouseMove]);

  const onMouseDown = useCallback((e) => {
    const target = e.target;
    const isInteractive =
      target.closest("button") ||
      target.closest("input") ||
      target.closest("textarea") ||
      target.closest('[role="button"]') ||
      target.closest("a") ||
      target.closest(".close-button");
    if (isInteractive) return;
    e.preventDefault();
    dragging.current = true;
    const rect = windowRef.current.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [onMouseMove, onMouseUp]);

  const onTouchEnd = useCallback(() => { dragging.current = false; }, []);

  useEffect(() => {
    const touchMoveHandler = (e) => {
      if (!dragging.current) return;
      e.preventDefault();
      const touch = e.touches[0];
      const x = touch.clientX - dragOffset.current.x;
      const y = touch.clientY - dragOffset.current.y;
      const w = windowRef.current?.offsetWidth || 360;
      const h = windowRef.current?.offsetHeight || 520;
      setPos({
        x: Math.max(8, Math.min(window.innerWidth - w - 8, x)),
        y: Math.max(8, Math.min(window.innerHeight - h - 8, y)),
      });
    };
    const onTouchStartHandler = (e) => {
      if (!windowRef.current) return;
      const target = e.target;
      const isInteractive =
        target.closest("button") ||
        target.closest("input") ||
        target.closest("textarea") ||
        target.closest('[role="button"]') ||
        target.closest("a") ||
        target.closest(".close-button");
      if (isInteractive) return;
      const touch = e.touches[0];
      dragging.current = true;
      const rect = windowRef.current.getBoundingClientRect();
      dragOffset.current = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    };
    if (isOpen) {
      document.addEventListener("touchstart", onTouchStartHandler);
      document.addEventListener("touchmove", touchMoveHandler, { passive: false });
      document.addEventListener("touchend", onTouchEnd);
    }
    return () => {
      document.removeEventListener("touchstart", onTouchStartHandler);
      document.removeEventListener("touchmove", touchMoveHandler);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [onTouchEnd, isOpen]);

  const { minimizeAll } = useChat();

  const handleOpen = () => {
    minimizeAll?.();
    setIsOpen(true);
    setHasUnread(false);
    setPulseActive(false);
  };

  useEffect(() => {
    const handleOpenEvent = () => {
      handleOpen();
    };

    window.addEventListener("open-chatbot-widget", handleOpenEvent);
    return () => window.removeEventListener("open-chatbot-widget", handleOpenEvent);
  }, [handleOpen]);

  const handleClose = () => {
    setIsOpen(false);
    setPos(null);
  };

  const handleClearChat = () => {
    clearMessages(user);
    setMessages(INITIAL_MESSAGES);
  };

  return (
    <>
      {isOpen && (
        <div
          ref={windowRef}
          className="fixed w-[calc(100vw-32px)] sm:w-[360px] h-[450px] max-h-[70vh] rounded-2xl z-[9999] shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_40px_rgba(220,38,38,0.1)] border border-white/10 overflow-hidden select-none flex flex-col"
          style={{
            ...(pos ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto" } : { bottom: "80px", right: "16px" }),
            animation: "otoChatSlideUp 0.25s cubic-bezier(0.2,0.8,0.2,1) both",
          }}
          onMouseDown={onMouseDown}
        >
          <div className="absolute top-0 left-0 right-0 h-8 flex items-center justify-center pointer-events-none z-20">
            <div className="flex gap-[3px] opacity-25">
              {[...Array(6)].map((_, i) => (
                <span key={i} className="w-[3px] h-[3px] bg-white rounded-full" />
              ))}
            </div>
          </div>
          <div className="relative z-10 flex-1 min-h-0 overflow-hidden">
            <Chatbot
              onClose={handleClose}
              onClearChat={handleClearChat}
              messages={messages}
              setMessages={setMessages}
            />
          </div>
        </div>
      )}

      {!isOpen && (
        <button
          onClick={handleOpen}
          className={`fixed bottom-5 right-4 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center z-[9999] transition-all duration-300 hover:scale-110 border border-red-500/50 ${pulseActive ? "shadow-[0_0_0_0_rgba(220,38,38,0.5)]" : "shadow-[0_4px_24px_rgba(220,38,38,0.35)]"
            }`}
          style={pulseActive ? { animation: "otoPulse 2s ease-in-out 3" } : {}}
          aria-label="Open chat support"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
          {hasUnread && (
            <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-white text-red-600 text-[10px] sm:text-xs font-black rounded-full flex items-center justify-center border-2 border-red-600 shadow-lg">1</span>
          )}
        </button>
      )}

      <style>{`
        @keyframes otoChatSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes otoPulse {
          0%   { box-shadow: 0 0 0 0   rgba(220,38,38,0.55); }
          70%  { box-shadow: 0 0 0 16px rgba(220,38,38,0); }
          100% { box-shadow: 0 0 0 0   rgba(220,38,38,0); }
        }
      `}</style>
    </>
  );
}