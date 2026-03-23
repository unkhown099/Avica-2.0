import React from "react";

function Pagination({ current, total, onChange, className = "" }) {
  if (total <= 1) return null;

  const pages = [];
  for (let i = 1; i <= total; i += 1) {
    pages.push(i);
  }

  return (
    <div className={`flex items-center justify-center gap-1 ${className}`}>
      <button
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-red-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      {pages.map((p) => {
        const show = p === 1 || p === total || Math.abs(p - current) <= 1;
        const ellipsisBefore = p === current - 2 && current > 3;
        const ellipsisAfter = p === current + 2 && current < total - 2;

        if (ellipsisBefore || ellipsisAfter) {
          return (
            <span
              key={`dots-${p}`}
              className="w-9 h-9 flex items-center justify-center text-gray-600 text-sm"
            >
              ...
            </span>
          );
        }

        if (!show) return null;

        return (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${
              p === current
                ? "bg-red-600 text-white shadow-lg shadow-red-600/30 border border-red-500"
                : "border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-red-500/50"
            }`}
          >
            {p}
          </button>
        );
      })}

      <button
        onClick={() => onChange(current + 1)}
        disabled={current === total}
        className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-red-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>
  );
}

export default Pagination;
