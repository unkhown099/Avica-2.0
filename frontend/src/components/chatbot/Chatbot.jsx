import { useState, useRef, useEffect } from "react";
import { API_BASE } from "../../hooks/useAuth.js";

const suggestedQuestions = [
  "What services do you offer?",
  "How do I book an appointment?",
  "Where is your shop located?",
];

export default function Chatbot({
  onClose,
  onClearChat,
  messages,
  setMessages,
}) {
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
      const response = await fetch(`${API_BASE}/api/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map(({ role, content }) => ({
            role,
            content,
          })),
        }),
      });

      const data = await response.json();
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
            "Sorry, something went wrong. Please try again or contact us directly.",
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
      <div className="flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-neutral-900 via-black to-neutral-900 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8 bg-red-600/20 rounded-lg border border-red-600/40 flex items-center justify-center shadow-[0_0_12px_rgba(220,38,38,0.25)]">
            <svg
              className="w-4 h-4 text-red-500"
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
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border border-black" />
          </div>
          <div>
            <p className="text-white font-black text-xs tracking-tight leading-tight">
              OTOKWIKK SUPPORT
            </p>
            <p className="text-green-400 text-[10px] font-bold tracking-widest uppercase">
              ● Online
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Clear chat button */}
          {onClearChat && messages.length > 1 && (
            <button
              onClick={onClearChat}
              title="Clear conversation"
              className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-500 hover:text-gray-300 flex items-center justify-center transition-all duration-300"
              aria-label="Clear chat"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="w-6 h-6 rounded-lg bg-white/5 hover:bg-red-600/20 border border-white/10 hover:border-red-600/40 text-gray-500 hover:text-red-400 flex items-center justify-center transition-all duration-300 text-xs font-bold"
              aria-label="Close"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-neutral-950 min-h-0">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-1.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-6 h-6 bg-red-600/20 rounded-lg border border-red-600/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-3 h-3 text-red-500"
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
              className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-wrap break-words font-medium ${
                msg.role === "user"
                  ? "bg-red-600 text-white rounded-br-sm shadow-[0_2px_12px_rgba(220,38,38,0.25)]"
                  : "bg-white/5 backdrop-blur-sm text-gray-200 border border-white/10 rounded-bl-sm"
              }`}
              style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-1.5 justify-start">
            <div className="w-6 h-6 bg-red-600/20 rounded-lg border border-red-600/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg
                className="w-3 h-3 text-red-500 animate-spin"
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
            <div className="bg-white/5 border border-white/10 rounded-xl rounded-bl-sm px-3 py-2 flex gap-1 items-center">
              <span
                className="w-1 h-1 bg-red-500 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-1 h-1 bg-red-500 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-1 h-1 bg-red-500 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        )}

        {showSuggestions && (
          <div className="flex flex-col gap-1.5 pt-1">
            <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest px-1">
              Quick Questions
            </p>
            {suggestedQuestions.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="text-left bg-white/5 hover:bg-red-600/10 border border-white/10 hover:border-red-600/40 text-gray-400 hover:text-white rounded-lg px-3 py-2 text-xs transition-all duration-300 font-medium"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-2 py-2 bg-neutral-900 border-t border-white/10 flex-shrink-0">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask us anything..."
          rows={1}
          disabled={isLoading}
          className="flex-1 resize-none bg-white/5 border border-white/10 focus:border-red-600/50 text-white placeholder-gray-600 rounded-lg px-3 py-2 text-xs outline-none transition-all duration-300 font-medium leading-relaxed"
          style={{ maxHeight: "60px", overflow: "auto" }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || isLoading}
          className="w-8 h-8 bg-red-600 hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-all duration-300 flex-shrink-0 shadow-[0_0_12px_rgba(220,38,38,0.3)] hover:shadow-[0_0_16px_rgba(220,38,38,0.5)]"
          aria-label="Send"
        >
          <svg
            className="w-3.5 h-3.5 text-white"
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