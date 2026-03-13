import { useState, useEffect } from "react";
import Chatbot from "./Chatbot";

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [pulseActive, setPulseActive] = useState(false);

  // Start pulsing after 3s to draw attention
  useEffect(() => {
    const t = setTimeout(() => setPulseActive(true), 3000);
    return () => clearTimeout(t);
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    setHasUnread(false);
    setPulseActive(false);
  };

  return (
    <>
      {/* ── Chat Window ── */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-5 sm:right-6 w-[calc(100vw-40px)] sm:w-[360px] h-[520px] rounded-2xl z-[9999] shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_40px_rgba(220,38,38,0.1)] border border-white/10 overflow-hidden"
          style={{ animation: "otoChatSlideUp 0.25s cubic-bezier(0.2,0.8,0.2,1) both" }}
        >
          <Chatbot onClose={() => setIsOpen(false)} />
        </div>
      )}

      {/* ── Floating Button ── */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className={`fixed bottom-6 right-5 sm:right-6 w-14 h-14 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center z-[9999] transition-all duration-300 hover:scale-110 border border-red-500/50 ${
            pulseActive ? "shadow-[0_0_0_0_rgba(220,38,38,0.5)]" : "shadow-[0_4px_24px_rgba(220,38,38,0.35)]"
          }`}
          style={pulseActive ? { animation: "otoPulse 2s ease-in-out 3" } : {}}
          aria-label="Open chat support"
        >
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
            />
          </svg>

          {/* Unread badge */}
          {hasUnread && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-red-600 text-xs font-black rounded-full flex items-center justify-center border-2 border-red-600 shadow-lg">
              1
            </span>
          )}
        </button>
      )}

      <style>{`
        @keyframes otoChatSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes otoPulse {
          0%   { box-shadow: 0 0 0 0   rgba(220,38,38,0.55); }
          70%  { box-shadow: 0 0 0 16px rgba(220,38,38,0);   }
          100% { box-shadow: 0 0 0 0   rgba(220,38,38,0);    }
        }
      `}</style>
    </>
  );
}