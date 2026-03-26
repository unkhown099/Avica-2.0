import { useState, useRef, useEffect } from "react";
import { API_BASE } from "../../hooks/useAuth.js";

const SYSTEM_PROMPT = `You are a helpful customer support assistant for Otokwikk, a premium automotive detailing shop in North Caloocan, Metro Manila.

About Otokwikk:
- Services: Exterior detailing (multi-stage wash, clay bar, machine polish), Interior detailing (steam cleaning, leather conditioning, deep extraction), and Protection packages (Ceramic coating 9H hardness, PPF applications).
- Location: Lot 1 Block 1, Camarin Road, North Caloocan, Metro Manila
- Hours: Monday - Sunday, 8:00 AM - 7:00 PM
- Contact: +63 9XX XXX XXXX | info@otokwikk.com
- Stats: 10,000+ premium clients served, 5.0 average rating, 15+ years expertise

Be concise, warm, and professional. Help customers with bookings, service inquiries, pricing, and general support. If you cannot answer something specific, invite them to call or visit the shop.`;

const suggestedQuestions = [
  "What services do you offer?",
  "How do I book an appointment?",
  "Where is your shop located?",
];

export default function Chatbot({ onClose }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Welcome to Otokwikk! 🚗✨ I'm your personal detailing assistant. How can I help you today?",
      id: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || isLoading) return;

    setInput("");
    const userMsg = { role: "user", content: userText, id: Date.now() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Call Django backend
      const response = await fetch(`${API_BASE}/api/chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...updatedMessages.map(({ role, content }) => ({ role, content })),
          ],
        }),
      });

      const data = await response.json();

      console.log("Backend response:", data);

      const reply = data.reply || "Sorry, I couldn't process that.";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply, id: Date.now() },
      ]);
    } catch (err) {
      console.error("Chatbot frontend error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, something went wrong. Please try again or contact us directly at +63 9XX XXX XXXX.",
          id: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const showSuggestions = messages.length === 1;

  return (
    <div className="flex flex-col h-full bg-black rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-neutral-900 via-black to-neutral-900 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 bg-red-600/20 rounded-xl border border-red-600/40 flex items-center justify-center shadow-[0_0_16px_rgba(220,38,38,0.25)]">
            <svg
              className="w-5 h-5 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
              />
            </svg>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-black" />
          </div>
          <div>
            <p className="text-white font-black text-sm tracking-tight leading-tight">
              OTOKWIKK SUPPORT
            </p>
            <p className="text-green-400 text-xs font-bold tracking-widest uppercase">
              ● Online
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-600/20 border border-white/10 hover:border-red-600/40 text-gray-500 hover:text-red-400 flex items-center justify-center transition-all duration-300 text-xs font-bold"
            aria-label="Close"
          >
            ✕
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-neutral-950">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"
              }`}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 bg-red-600/20 rounded-lg border border-red-600/30 flex items-center justify-center flex-shrink-0 mb-0.5">
                <svg
                  className="w-3.5 h-3.5 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                  />
                </svg>
              </div>
            )}
            <div
              className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words font-medium ${msg.role === "user"
                  ? "bg-red-600 text-white rounded-br-sm shadow-[0_4px_20px_rgba(220,38,38,0.25)]"
                  : "bg-white/5 backdrop-blur-sm text-gray-200 border border-white/10 rounded-bl-sm"
                }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex items-end gap-2 justify-start">
            <div className="w-7 h-7 bg-red-600/20 rounded-lg border border-red-600/30 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-3.5 h-3.5 text-red-500 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
              <span
                className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        )}

        {/* Suggested questions */}
        {showSuggestions && (
          <div className="flex flex-col gap-2 pt-1">
            <p className="text-gray-600 text-xs font-black uppercase tracking-widest px-1">
              Quick Questions
            </p>
            {suggestedQuestions.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="text-left bg-white/5 hover:bg-red-600/10 border border-white/10 hover:border-red-600/40 text-gray-400 hover:text-white rounded-xl px-3.5 py-2.5 text-sm transition-all duration-300 font-medium"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-3 bg-neutral-900 border-t border-white/10 flex-shrink-0">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask us anything..."
          rows={1}
          disabled={isLoading}
          className="flex-1 resize-none bg-white/5 border border-white/10 focus:border-red-600/50 text-white placeholder-gray-600 rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all duration-300 font-medium leading-relaxed"
          style={{ maxHeight: "80px" }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || isLoading}
          className="w-10 h-10 bg-red-600 hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-all duration-300 flex-shrink-0 shadow-[0_0_16px_rgba(220,38,38,0.3)] hover:shadow-[0_0_24px_rgba(220,38,38,0.5)]"
          aria-label="Send"
        >
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}