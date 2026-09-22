import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const SHORT_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseISODate(isoStr) {
  if (!isoStr) return null;
  const parts = isoStr.split("-");
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return new Date(year, month, day);
}

function formatToISO(year, month, day) {
  const y = String(year).padStart(4, "0");
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function CustomDatePicker({
  value = "",
  onChange,
  min = "",
  max = "",
  placeholder = "Select appointment date...",
  disabled = false,
  className = "",
  error = "",
}) {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedDateObj = parseISODate(value);
  const minDateObj = parseISODate(min);
  const maxDateObj = parseISODate(max);

  const todayObj = new Date();
  todayObj.setHours(0, 0, 0, 0);
  const todayISO = formatToISO(todayObj.getFullYear(), todayObj.getMonth(), todayObj.getDate());

  // View state (which month/year is shown in calendar view)
  const initialView = selectedDateObj || minDateObj || todayObj;
  const [viewYear, setViewYear] = useState(initialView.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialView.getMonth());

  // Keep view synchronized when value changes
  useEffect(() => {
    if (selectedDateObj) {
      setViewYear(selectedDateObj.getFullYear());
      setViewMonth(selectedDateObj.getMonth());
    }
  }, [value]);

  // Close popup on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Navigate months
  const handlePrevMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Quick preset handlers
  const handleSelectTomorrow = (e) => {
    e.stopPropagation();
    const t = new Date();
    t.setDate(t.getDate() + 1);
    const iso = formatToISO(t.getFullYear(), t.getMonth(), t.getDate());
    onChange?.(iso);
    setIsOpen(false);
  };

  const handleSelectNextWeek = (e) => {
    e.stopPropagation();
    const t = new Date();
    t.setDate(t.getDate() + 7);
    const iso = formatToISO(t.getFullYear(), t.getMonth(), t.getDate());
    onChange?.(iso);
    setIsOpen(false);
  };

  const handleSelectDay = (day) => {
    const iso = formatToISO(viewYear, viewMonth, day);
    onChange?.(iso);
    setIsOpen(false);
  };

  // Calculations for days grid
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Determine if a date is disabled
  const isDateDisabled = (day) => {
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0, 0, 0, 0);
    if (minDateObj && d < minDateObj) return true;
    if (maxDateObj && d > maxDateObj) return true;
    return false;
  };

  // Formatted display text
  const getDisplayLabel = () => {
    if (!selectedDateObj) return "";
    return selectedDateObj.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger input box with clickable calendar icon button */}
      <div
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border transition-all cursor-pointer select-none ${
          disabled
            ? "opacity-50 cursor-not-allowed bg-gray-800/30 border-white/5"
            : isOpen
            ? "border-red-500 ring-2 ring-red-500/20 shadow-lg shadow-red-600/10"
            : "hover:border-red-500/50"
        } ${
          isDark
            ? "bg-white/5 border-white/10 text-white"
            : "bg-white border-gray-300 text-gray-900 shadow-sm"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <svg
            className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-colors ${
              isOpen || value ? "text-red-500" : isDark ? "text-gray-400" : "text-gray-500"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002-2z"
            />
          </svg>
          <span
            className={`text-xs sm:text-sm font-semibold truncate ${
              value
                ? isDark
                  ? "text-white"
                  : "text-gray-900"
                : isDark
                ? "text-gray-500"
                : "text-gray-400"
            }`}
          >
            {getDisplayLabel() || placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {value && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange?.("");
              }}
              title="Clear date"
              className={`p-1 rounded-lg transition-colors hover:bg-red-500/20 hover:text-red-500 ${
                isDark ? "text-gray-400" : "text-gray-400"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <div
            className={`p-1.5 rounded-lg border transition-all ${
              isOpen
                ? "bg-red-600 text-white border-red-600 shadow-md shadow-red-600/30"
                : isDark
                ? "bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10"
                : "bg-gray-100 border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-200"
            }`}
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Calendar Dropdown Popover */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 sm:right-auto sm:w-[340px] z-50 mt-2 p-3 sm:p-4 rounded-2xl border backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-150 ${
            isDark
              ? "bg-gray-900/95 border-white/15 text-white shadow-black/60"
              : "bg-white border-gray-200 text-gray-900 shadow-xl"
          }`}
          style={{ minWidth: "300px" }}
        >
          {/* Header Month / Year controls */}
          <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-white/10 dark:border-white/10 border-gray-100">
            <button
              type="button"
              onClick={handlePrevMonth}
              className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                isDark
                  ? "border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white"
                  : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900"
              }`}
              title="Previous Month"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="text-center">
              <span className={`text-sm sm:text-base font-black tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                isDark
                  ? "border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white"
                  : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900"
              }`}
              title="Next Month"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
            {SHORT_DAYS.map((d, i) => (
              <div
                key={d}
                className={`text-[11px] font-bold py-1 select-none ${
                  i === 0 || i === 6 ? "text-red-500/80" : isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty slots before first day */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8 sm:h-9" />
            ))}

            {/* Days in current month */}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const disabledDay = isDateDisabled(day);
              const isoString = formatToISO(viewYear, viewMonth, day);
              const isSelected = value === isoString;
              const isToday = todayISO === isoString;

              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabledDay}
                  onClick={() => !disabledDay && handleSelectDay(day)}
                  className={`h-8 sm:h-9 rounded-xl text-xs sm:text-sm font-bold flex flex-col items-center justify-center relative transition-all duration-150 ${
                    isSelected
                      ? "bg-red-600 text-white font-black shadow-lg shadow-red-600/40 ring-2 ring-red-400 scale-105 z-10"
                      : disabledDay
                      ? isDark
                        ? "text-gray-600 cursor-not-allowed opacity-30"
                        : "text-gray-300 cursor-not-allowed opacity-40"
                      : isToday
                      ? isDark
                        ? "border border-red-500/60 text-red-400 bg-red-500/10 hover:bg-red-500/20 cursor-pointer"
                        : "border border-red-500 text-red-600 bg-red-50 hover:bg-red-100 cursor-pointer"
                      : isDark
                      ? "text-gray-200 hover:bg-white/10 hover:text-white hover:scale-105 cursor-pointer"
                      : "text-gray-800 hover:bg-red-50 hover:text-red-600 hover:scale-105 cursor-pointer"
                  }`}
                  style={isSelected ? { color: "#ffffff", backgroundColor: "#dc2626" } : undefined}
                >
                  <span>{day}</span>
                  {isToday && !isSelected && (
                    <span className="w-1 h-1 rounded-full bg-red-500 absolute bottom-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Presets & Bottom Actions */}
          <div className="mt-3 pt-2.5 border-t border-white/10 dark:border-white/10 border-gray-100 flex items-center justify-between gap-1.5 text-xs">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleSelectTomorrow}
                className={`px-2.5 py-1 rounded-lg font-semibold border transition-all cursor-pointer ${
                  isDark
                    ? "bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10"
                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={handleSelectNextWeek}
                className={`px-2.5 py-1 rounded-lg font-semibold border transition-all cursor-pointer ${
                  isDark
                    ? "bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10"
                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
              >
                +1 Week
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all shadow-md shadow-red-600/20 cursor-pointer"
              style={{ color: "#ffffff" }}
            >
              Done
            </button>
          </div>
        </div>
      )}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}
