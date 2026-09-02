import React, { useState, useEffect, useMemo, useCallback } from "react";
import CustomerLayout from "./CustomerLayout.jsx";
import { useAuth, API_BASE } from "../../hooks/useAuth.js";
import { getUserFromSession } from "../../utils/getUser";
import { useNavigate } from "react-router-dom";
import ServiceChatModal from "../../components/ServiceChatModal.jsx";

function CustomerDashboard() {
  const [user] = useState(() => getUserFromSession());

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const [stats, setStats] = useState({ upcoming: 0, completed: 0 });
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [chatQueueId, setChatQueueId] = useState(null);
  const [cancelBooking, setCancelBooking] = useState(null);
  const [customerRescheduleBooking, setCustomerRescheduleBooking] = useState(null);
  const [rescheduleBooking, setRescheduleBooking] = useState(null);
  const [toast, setToast] = useState(null);
  const [serviceHistory, setServiceHistory] = useState([]);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const getAuthHeaders = () => {
    const token =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const conditionColor = (c) => {
    if (!c) return "#6b7280";
    const lc = c.toLowerCase();
    if (lc.includes("excellent")) return "#10b981";
    if (lc.includes("good")) return "#3b82f6";
    if (lc.includes("fair")) return "#f59e0b";
    if (lc.includes("poor")) return "#ef4444";
    return "#6b7280";
  };
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsDashboardLoading(true);
      setDashboardError(null);
      try {
        const response = await fetch(`${API_BASE}/api/customer/dashboard/`, {
          method: "GET",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        });
        if (!response.ok)
          throw new Error(`Failed to fetch dashboard data (${response.status})`);
        const data = await response.json();
        const now = new Date();
        const trueUpcoming = (data.upcoming_bookings || []).filter((b) => {
          let bookingDateTime;
          if (b.time) {
            bookingDateTime = new Date(`${b.date}T${b.time}`);
          } else {
            bookingDateTime = new Date(b.date);
            bookingDateTime.setHours(23, 59, 59, 999);
          }
          return bookingDateTime > now;
        });
        setStats(data.stats || { upcoming: 0, completed: 0 });
        setUpcomingBookings(trueUpcoming);
        setActiveSessions(data.active_sessions || []);
        setServiceHistory(data.service_history || []);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
        setDashboardError("Failed to load dashboard data. Please refresh.");
      } finally {
        setIsDashboardLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // ── Derived: does the user have a pending or confirmed booking? ──
  const hasActiveBooking = useMemo(
    () => upcomingBookings.some((b) => b.status === "pending" || b.status === "confirmed"),
    [upcomingBookings],
  );

  const handleCarImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewImage(URL.createObjectURL(file));
      await performCarAnalysis(file);
    }
  };

  const performCarAnalysis = async (file) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const token =
        localStorage.getItem("access_token") ??
        sessionStorage.getItem("access_token");
      const base64Image = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => res(reader.result.split(",")[1]);
        reader.onerror = (err) => rej(err);
      });
      const response = await fetch(`${API_BASE}/api/analyze-vehicle/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ image: base64Image }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Analysis failed");
      setAnalysisResult(data);
    } catch (error) {
      console.error("Analysis Error:", error);
      alert("Failed to analyze vehicle. Please try again.");
      setPreviewImage(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCancelConfirm = async (reason) => {
    const booking = cancelBooking;
    if (!booking) return;
    try {
      const headers = { "Content-Type": "application/json", ...getAuthHeaders() };
      const res = await fetch(`${API_BASE}/api/bookings/${booking.id}/`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          status: "cancelled",
          cancellation_reason: reason,
        }),
      });
      if (!res.ok) throw new Error("Failed to cancel");
      setUpcomingBookings((prev) => prev.filter((b) => b.id !== booking.id));
      setStats((prev) => ({ ...prev, upcoming: Math.max(0, (prev.upcoming || 1) - 1) }));
      showToast("Booking cancelled successfully.", "success");
      setCancelBooking(null);
    } catch {
      showToast("Failed to cancel booking. Please try again.", "error");
      setCancelBooking(null);
    }
  };

  const handleCustomerRescheduleRequest = async (payload) => {
    const booking = customerRescheduleBooking;
    if (!booking) return;
    try {
      const headers = { "Content-Type": "application/json", ...getAuthHeaders() };
      const res = await fetch(`${API_BASE}/api/bookings/${booking.id}/request-reschedule/`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          reason: payload.reason,
          preferred_date: payload.preferredDate || "",
          preferred_time: payload.preferredTime || "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Failed to submit request.");
      setUpcomingBookings((prev) => prev.map((b) => (b.id === booking.id ? { ...b, ...data, status: "pending" } : b)));
      showToast("Reschedule request sent! Staff will follow up.", "success");
      setCustomerRescheduleBooking(null);
    } catch (e) {
      showToast(e.message || "Failed to send request.", "error");
    }
  };

  const handleRescheduleDecision = async (booking, decision, selectedOption = null) => {
    try {
      const headers = { "Content-Type": "application/json", ...getAuthHeaders() };
      const res = await fetch(`${API_BASE}/api/bookings/${booking.id}/reschedule-response/`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ decision, selected_option: selectedOption }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Failed to submit response.");
      setUpcomingBookings((prev) => prev.map((b) => (b.id === data.id ? { ...b, ...data } : b)));
      showToast(
        decision === "accept"
          ? "Reschedule accepted successfully."
          : "Reschedule declined. Our team will follow up.",
        "success"
      );
      setRescheduleBooking(null);
    } catch (e) {
      showToast(e.message || "Failed to submit response.", "error");
    }
  };

  const handleBookRecommended = (svc = null) => {
    const targetService = svc || analysisResult?.recommendedServices?.[0] || null;
    const vehicleStr = `${analysisResult?.make || ""} ${analysisResult?.model || ""}`.trim();
    navigate("/bookings", {
      state: {
        openBooking: true,
        prefillServiceId: targetService?.id || null,
        prefillServiceName: targetService?.name || null,
        prefillVehicleSize: analysisResult?.vehicleSize || "small",
        prefillVehicle: vehicleStr,
        prefillPlateNumber: analysisResult?.plateNumber || "",
      },
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const [year, month, day] = String(dateStr).split("T")[0].split("-");
    if (!year || !month || !day) return dateStr;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    if (isNaN(date)) return dateStr;
    return date.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
  };

  const displayFirst = user?.firstName || "there";
  const nextBooking = upcomingBookings?.[0];
  const nextAppointmentValue = nextBooking
    ? `${formatDate(nextBooking.date)}${nextBooking.time ? ` • ${nextBooking.time}` : ""}`
    : "—";
  const lastServiceValue = serviceHistory?.[0] ? formatDate(serviceHistory[0].date) : "—";

  const statCards = [
    { icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", value: stats.upcoming, label: "Upcoming", border: "border-red-500/20", bg: "bg-red-500/10", text: "text-red-400" },
    { icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", value: stats.completed, label: "Completed", border: "border-emerald-500/20", bg: "bg-emerald-500/10", text: "text-emerald-400" },
    { icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", value: nextAppointmentValue, label: "Next Appointment", border: "border-blue-500/20", bg: "bg-blue-500/10", text: "text-blue-400" },
    { icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", value: lastServiceValue, label: "Last Service Date", border: "border-amber-500/20", bg: "bg-amber-500/10", text: "text-amber-400" },
  ];

  // ── Reusable tooltip wrapper for blocked booking buttons ──
  function BookingBlockedTooltip({ children, enabled }) {
    if (!enabled) return children;
    return (
      <div className="relative group/blocked">
        {children}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 z-20 pointer-events-none opacity-0 group-hover/blocked:opacity-100 transition-opacity duration-200">
          <div className="bg-gray-900 border border-yellow-600/30 rounded-xl px-3 py-2 text-center shadow-xl">
            <p className="text-yellow-400 text-[10px] font-semibold leading-tight">Active booking in progress</p>
            <p className="text-gray-500 text-[9px] mt-0.5">Please complete or cancel your current booking first.</p>
          </div>
          <div className="w-2 h-2 bg-gray-900 border-r border-b border-yellow-600/30 rotate-45 mx-auto -mt-1" />
        </div>
      </div>
    );
  }

  return (
    <CustomerLayout>
      {/* ── Hero ── */}
      <div className="relative bg-gradient-to-b from-red-950/20 via-gray-900 to-gray-950 py-10 sm:py-14 md:py-16 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-2 sm:mb-4 tracking-tight leading-tight">
                Welcome back,&nbsp;{displayFirst}!
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-400">
                Ready to keep your vehicle looking its best?
              </p>
            </div>

            {/* Hero CTA — blocked when active booking exists */}
            <BookingBlockedTooltip enabled={!isDashboardLoading && hasActiveBooking}>
              <button
                disabled={!isDashboardLoading && hasActiveBooking}
                onClick={() =>
                  navigate("/bookings", { state: { openBooking: true } })
                }
                className={`w-full sm:w-auto font-bold px-6 py-3 sm:px-8 sm:py-4 rounded-xl transition-all duration-300 shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base ${!isDashboardLoading && hasActiveBooking
                  ? "bg-red-600/30 text-red-300/50 cursor-not-allowed shadow-none"
                  : "bg-red-600 hover:bg-red-500 text-white hover:scale-105 shadow-red-600/30"
                  }`}
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Book New Service
              </button>
            </BookingBlockedTooltip>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12">

        {/* ── Error Banner ── */}
        {dashboardError && (
          <div className="mb-6 sm:mb-8 bg-red-500/10 border border-red-500/30 rounded-2xl p-3 sm:p-4 flex items-start sm:items-center gap-3 text-red-400">
            <svg className="w-5 h-5 shrink-0 mt-0.5 sm:mt-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <span className="text-sm font-semibold">{dashboardError}</span>
          </div>
        )}

        {/* ── Active Booking Banner ── */}
        {!isDashboardLoading && hasActiveBooking && (
          <div className="mb-6 sm:mb-8 flex items-center gap-3 bg-yellow-600/10 border border-yellow-600/25 rounded-2xl px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-yellow-600/20 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-yellow-400 font-semibold text-xs sm:text-sm">You have an active booking</p>
              <p className="text-gray-500 text-[10px] sm:text-xs">
                New bookings are blocked until your current one is completed or cancelled.{" "}
                <button onClick={() => navigate("/bookings")} className="text-yellow-400 hover:text-yellow-300 underline underline-offset-2 transition-colors">
                  View booking →
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10 md:mb-12">
          {statCards.map(({ icon, value, label, border, bg, text }) => (
            <div
              key={label}
              className={`bg-gray-900/60 border ${border} rounded-2xl p-4 sm:p-5 backdrop-blur-sm hover:border-opacity-60 transition-all duration-200`}
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className={`${bg} ${text} p-2.5 sm:p-3 rounded-xl shrink-0`}>
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                  </svg>
                </div>
                <div className="min-w-0">
                  {isDashboardLoading ? (
                    <div className="h-6 w-10 bg-white/10 rounded animate-pulse mb-1" />
                  ) : (
                    <div className="text-lg sm:text-2xl font-black text-white truncate leading-tight">{value}</div>
                  )}
                  <div className="text-xs sm:text-sm text-gray-500 mt-0.5">{label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Quick Actions ── */}
        <div className="mb-8 sm:mb-10 md:mb-12">
          <h2 className="text-xl sm:text-2xl font-black text-white mb-3 sm:mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            {[
              {
                title: "Book a Service",
                desc: "Schedule your next appointment",
                icon: "M12 4v16m8-8H4",
                accent: "#ef4444",
                path: "/bookings",
                state: { openBooking: true },
                isBookingAction: true,
              },
              {
                title: "Manage Bookings",
                desc: "View and modify appointments",
                icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
                accent: "#3b82f6",
                path: "/bookings",
                state: null,
                isBookingAction: false,
              },
              {
                title: "Service History",
                desc: "Review your past services",
                icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
                accent: "#10b981",
                path: "/history",
                state: null,
                isBookingAction: false,
              },
            ].map(({ title, desc, icon, accent, path, state, isBookingAction }) => {
              const blocked = isBookingAction && !isDashboardLoading && hasActiveBooking;
              return (
                <BookingBlockedTooltip key={title} enabled={blocked}>
                  <button
                    disabled={blocked}
                    onClick={() => { if (!blocked) navigate(path, state ? { state } : {}); }}
                    className={`group w-full bg-gray-900/60 border border-white/5 rounded-xl p-3 sm:p-4 backdrop-blur-sm transition-all duration-200 text-left flex items-center gap-3 sm:gap-4 ${blocked
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:border-red-500/30 hover:scale-[1.02]"
                      }`}
                  >
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 bg-red-500/10 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-300 ${blocked ? "" : "group-hover:scale-110"}`}
                      style={{ color: accent }}
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-white">{title}</h3>
                      <p className="text-xs text-gray-400">{desc}</p>
                    </div>
                  </button>
                </BookingBlockedTooltip>
              );
            })}
          </div>
        </div>

        {/* ── Car AI Analysis ── */}
        <div className="mb-8 sm:mb-10 md:mb-12">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-white">Vehicle AI Analysis</h2>
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 bg-red-500/10 rounded-full border border-red-500/30">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-[10px] sm:text-xs font-bold text-red-400 uppercase tracking-widest">Powered by AI</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-stretch">
            {/* Upload panel */}
            <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 sm:p-8 backdrop-blur-sm flex flex-col items-center justify-center text-center relative overflow-hidden group min-h-[240px]">
              <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              {!previewImage ? (
                <>
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-500">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white mb-2">Identify Your Vehicle</h3>
                  <p className="text-xs sm:text-sm text-gray-400 mb-6 sm:mb-8 max-w-xs">
                    Upload a photo of your vehicle for AI-powered identification and analysis
                  </p>
                  <label className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-3 sm:px-8 sm:py-4 rounded-xl cursor-pointer transition-all duration-200 shadow-lg shadow-red-600/30 text-sm sm:text-base">
                    Upload Vehicle Photo
                    <input type="file" className="hidden" accept="image/*" onChange={handleCarImageUpload} />
                  </label>
                </>
              ) : (
                <div className="w-full h-full relative group/preview">
                  <img src={previewImage} alt="Vehicle preview" className="w-full h-48 sm:h-64 object-cover rounded-xl border border-white/10" />
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-3 sm:mb-4" />
                      <p className="text-white font-bold animate-pulse uppercase tracking-widest text-xs sm:text-sm">Analysing Vehicle…</p>
                    </div>
                  )}
                  <button
                    onClick={() => { setPreviewImage(null); setAnalysisResult(null); }}
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-gray-900/60 hover:bg-red-600 p-1.5 sm:p-2 rounded-lg text-white border border-white/10 transition-all duration-200 opacity-0 group-hover/preview:opacity-100"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Results panel */}
            <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 sm:p-8 backdrop-blur-sm flex flex-col min-h-[240px]">
              {analysisResult ? (
                <div className="space-y-3">
                  <h3 className="text-lg font-black text-white mb-2">Vehicle Analysis Results</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Make", value: analysisResult.make },
                      { label: "Model", value: analysisResult.model },
                      { label: "Year", value: analysisResult.year },
                      { label: "Body Type", value: analysisResult.bodyType },
                      { label: "Confidence", value: analysisResult.confidence },
                    ].map((field) => (
                      <div key={field.label} className="bg-gray-800/60 border border-white/5 rounded-xl p-3">
                        <div className="text-xs text-gray-500 mb-1">{field.label}</div>
                        <div className="text-white font-bold text-sm">{field.value || "Not detected"}</div>
                      </div>
                    ))}
                    {/* Color with hex swatch */}
                    <div className="bg-gray-800/60 border border-white/5 rounded-xl p-3">
                      <div className="text-xs text-gray-500 mb-1">Color</div>
                      <div className="flex items-center gap-2">
                        {(analysisResult.colorHex || analysisResult.color) && (
                          <div className="w-4 h-4 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: analysisResult.colorHex || analysisResult.color.toLowerCase() }} />
                        )}
                        <span className="text-white font-bold text-sm">{analysisResult.color || "Not detected"}</span>
                      </div>
                    </div>
                    {/* Plate Number */}
                    {analysisResult.plateNumber ? (
                      <div className="bg-gray-800/60 border border-white/5 rounded-xl p-3">
                        <div className="text-xs text-gray-500 mb-1">Plate Number</div>
                        <div className="text-white font-bold text-sm font-mono tracking-wider">{analysisResult.plateNumber}</div>
                      </div>
                    ) : null}
                    {/* Vehicle Size */}
                    {(analysisResult.vehicleSizeLabel || analysisResult.vehicleSize) && (
                      <div className="bg-gray-800/60 border border-white/5 rounded-xl p-3 col-span-2">
                        <div className="text-xs text-gray-500 mb-1">Vehicle Size Class</div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-semibold">
                            {(analysisResult.vehicleSize || "SMALL").toUpperCase()}
                          </span>
                          <span className="text-white font-bold text-sm">{analysisResult.vehicleSizeLabel || analysisResult.vehicleSize}</span>
                        </div>
                      </div>
                    )}
                    {/* Condition with details */}
                    <div className="bg-gray-800/60 border border-white/5 rounded-xl p-3 col-span-2">
                      <div className="text-xs text-gray-500 mb-1">Estimated Condition</div>
                      <div className="flex items-start gap-2">
                        <div className="w-3 h-3 rounded-full shrink-0 mt-1" style={{ backgroundColor: conditionColor(analysisResult.condition) }} />
                        <div>
                          <span className="text-white font-bold text-sm">{analysisResult.condition || "Not detected"}</span>
                          {analysisResult.conditionDetails && (
                            <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{analysisResult.conditionDetails}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Features */}
                    {analysisResult.features?.length > 0 && (
                      <div className="bg-gray-800/60 border border-white/5 rounded-xl p-3 col-span-2">
                        <div className="text-xs text-gray-500 mb-2">Notable Features</div>
                        <div className="flex flex-wrap gap-1.5">
                          {analysisResult.features.map((f, i) => (
                            <span key={i} className="px-2.5 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-semibold">{f}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* AI Notes */}
                    {analysisResult.additionalNotes && (
                      <div className="bg-gray-800/60 border border-white/5 rounded-xl p-3 col-span-2">
                        <div className="text-xs text-gray-500 mb-1">AI Notes</div>
                        <p className="text-gray-300 text-sm leading-relaxed">{analysisResult.additionalNotes}</p>
                      </div>
                    )}
                    {/* Recommended Services */}
                    {analysisResult.recommendedServices?.length > 0 && (
                      <div className="bg-gray-800/60 border border-white/5 rounded-xl p-3.5 col-span-2 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-gray-400">
                          <span>AI Recommended Services</span>
                          <span className="text-[10px] text-red-400 font-semibold uppercase tracking-wider">Click to book</span>
                        </div>
                        <div className="space-y-2">
                          {analysisResult.recommendedServices.slice(0, 3).map((svc, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between p-2.5 bg-black/20 hover:bg-white/5 border border-white/5 rounded-xl transition-all gap-3"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="text-white text-xs sm:text-sm font-bold truncate">{svc.name}</div>
                                {svc.category && <div className="text-gray-400 text-[10px]">{svc.category}</div>}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {svc.price && (
                                  <span className="text-emerald-400 font-black text-xs sm:text-sm">₱{Number(svc.price).toLocaleString()}</span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleBookRecommended(svc)}
                                  className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs shadow-md shadow-red-600/20 transition-all cursor-pointer"
                                >
                                  Book
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Book This Service CTA */}
                  <button
                    type="button"
                    onClick={() => handleBookRecommended(analysisResult.recommendedServices?.[0] || null)}
                    className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-black px-4 py-3.5 rounded-xl transition-all shadow-lg shadow-red-600/30 text-sm mt-3 cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002-2z" />
                    </svg>
                    Book {analysisResult.recommendedServices?.[0]?.name ? `"${analysisResult.recommendedServices[0].name}"` : "Recommended Service"}
                  </button>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <p className="text-xs text-blue-300">
                        <span className="font-black">AI-Powered Analysis:</span>{" "}
                        Results are generated by AI based on the uploaded image and may vary based on image quality.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                  <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500 italic text-sm">Analysis results will appear here after upload</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Upcoming Bookings ── */}
        <div className="mb-8 sm:mb-10 md:mb-12">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-white">Upcoming Bookings</h2>
            <button onClick={() => navigate("/bookings")} className="text-xs sm:text-sm text-red-400 hover:text-red-300 font-semibold transition-colors duration-200">
              View All →
            </button>
          </div>
          {isDashboardLoading ? (
            <div className="space-y-3 sm:space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-gray-900/60 border border-white/5 rounded-2xl p-4 sm:p-6 animate-pulse">
                  <div className="h-5 w-48 bg-white/10 rounded mb-3" />
                  <div className="h-4 w-32 bg-white/5 rounded" />
                </div>
              ))}
            </div>
          ) : upcomingBookings.length === 0 ? (
            <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-8 sm:p-10 text-center">
              <p className="text-gray-500 italic text-sm">No upcoming bookings.</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-gray-900/60 border border-white/5 rounded-2xl p-4 sm:p-6 backdrop-blur-sm hover:border-red-500/30 transition-all duration-200"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-base sm:text-lg font-bold text-white">{booking.service}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${booking.status === "confirmed" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"}`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-gray-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{formatDate(booking.date)}</span>
                        </div>
                        {booking.time && (
                          <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-gray-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{booking.time.length > 5 ? booking.time.slice(0, 5) : booking.time}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                      <div className="text-lg sm:text-xl font-black text-white">{booking.price}</div>
                      {booking.status !== "no_show" && (
                        <div className="flex gap-2">
                          {booking.queue_id && booking.assigned_employee_id && (
                            <button
                              onClick={() => setChatQueueId(booking.queue_id)}
                              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600/20 hover:bg-blue-600 border border-blue-600/40 text-blue-400 hover:text-white rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                              </svg>
                              Message
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (booking.status === "rescheduled") {
                                setRescheduleBooking(booking);
                              } else {
                                setCustomerRescheduleBooking(booking);
                              }
                            }}
                            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-600/40 text-indigo-300 hover:text-white rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200"
                          >
                            {booking.status === "rescheduled" ? "Review Reschedule" : "Reschedule"}
                          </button>
                          <button
                            onClick={() => setCancelBooking(booking)}
                            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600/20 hover:bg-red-600 border border-red-600/40 text-red-400 hover:text-white rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Service History ── */}
        <div>
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-white">Recent Service History</h2>
            <button onClick={() => navigate("/history")} className="text-xs sm:text-sm text-red-400 hover:text-red-300 font-semibold transition-colors duration-200">
              View All →
            </button>
          </div>
          {isDashboardLoading ? (
            <div className="space-y-3 sm:space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-gray-900/60 border border-white/5 rounded-2xl p-4 sm:p-6 animate-pulse">
                  <div className="h-4 bg-gray-800 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-800 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : serviceHistory.length === 0 ? (
            <div className="bg-gray-900/40 border border-white/5 rounded-2xl p-8 sm:p-12 text-center">
              <p className="text-gray-500 text-sm italic">No service history yet.</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {serviceHistory.map((service, index) => (
                <div
                  key={index}
                  className="bg-gray-900/60 hover:bg-gray-900/80 border border-white/5 rounded-2xl p-4 sm:p-6 transition-all duration-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-bold text-white">{service.service}</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          Completed
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-gray-400">
                        <svg className="w-4 h-4 text-gray-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{formatDate(service.date)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                      <div className="text-lg sm:text-xl font-black text-white">{service.price}</div>
                      <div className="flex gap-2">
                        {/* "Book Again" also blocked if active booking exists */}
                        <BookingBlockedTooltip enabled={!isDashboardLoading && hasActiveBooking}>
                          <button
                            disabled={!isDashboardLoading && hasActiveBooking}
                            onClick={() => { if (!hasActiveBooking) navigate("/bookings", { state: { openBooking: true } }); }}
                            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 shadow-lg shadow-red-600/20 ${!isDashboardLoading && hasActiveBooking
                              ? "bg-red-600/20 text-red-400/50 cursor-not-allowed shadow-none"
                              : "bg-red-600 hover:bg-red-500 text-white"
                              }`}
                          >
                            Book Again
                          </button>
                        </BookingBlockedTooltip>
                        <button className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs sm:text-sm font-semibold transition-colors duration-200 border border-white/5">
                          Leave Review
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {chatQueueId && (
        <ServiceChatModal
          queueId={chatQueueId}
          isEmployee={false}
          onClose={() => setChatQueueId(null)}
        />
      )}
      {cancelBooking && (
        <CancelBookingModal
          booking={cancelBooking}
          onClose={() => setCancelBooking(null)}
          onConfirm={handleCancelConfirm}
        />
      )}
      {customerRescheduleBooking && (
        <CustomerRescheduleModal
          booking={customerRescheduleBooking}
          onClose={() => setCustomerRescheduleBooking(null)}
          onSubmit={handleCustomerRescheduleRequest}
        />
      )}
      {rescheduleBooking && (
        <RescheduleResponseModal
          booking={rescheduleBooking}
          onClose={() => setRescheduleBooking(null)}
          onDecide={handleRescheduleDecision}
        />
      )}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </CustomerLayout>
  );
}

// ─── Center Modal Wrapper ───────────────────────────────────────────────────
function CenterModal({ onClose, children }) {
  return (
    <>
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] sm:w-full max-w-lg bg-[#0f172a] border border-white/10 shadow-2xl rounded-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
        {children}
      </div>
    </>
  );
}

// ─── Toast ──────────────────────────────────────────────────────────────────
function Toast({ message, type = "success", onDismiss }) {
  const isSuccess = type === "success";
  return (
    <div
      className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[70] flex items-center gap-3 ${
        isSuccess ? "bg-emerald-600 shadow-emerald-600/30" : "bg-red-600 shadow-red-600/30"
      } text-white px-4 py-3 rounded-2xl shadow-2xl max-w-sm animate-in fade-in slide-in-from-bottom-3 duration-300`}
    >
      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
        {isSuccess ? (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>
      <span className="font-semibold text-xs sm:text-sm">{message}</span>
      <button onClick={onDismiss} className="ml-auto opacity-70 hover:opacity-100 p-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ─── Cancel Booking Modal ───────────────────────────────────────────────────
function CancelBookingModal({ booking, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [loading, setLoading] = useState(false);

  const cancelReasons = [
    "Change of plans",
    "Schedule conflict",
    "Vehicle not available",
    "Emergency",
    "Other",
  ];

  const handleSubmit = async () => {
    const finalReason = reason === "Other" ? otherReason : reason;
    if (!finalReason.trim()) return;
    setLoading(true);
    await onConfirm(finalReason);
    setLoading(false);
  };

  const serviceName = booking.service_name || booking.service || "Appointment";

  return (
    <CenterModal onClose={onClose}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gray-900/60">
        <div>
          <h2 className="text-lg font-black text-white">
            Cancel <span className="text-red-500">Appointment</span>
          </h2>
          <p className="text-gray-400 text-xs mt-0.5 truncate">{serviceName}</p>
        </div>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-5 space-y-4 overflow-y-auto">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-red-400 text-xs font-bold">This action cannot be undone</p>
            <p className="text-gray-400 text-xs mt-0.5">Please let us know why you are cancelling your appointment.</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-300">Select Reason</label>
          <div className="space-y-2">
            {cancelReasons.map((r) => (
              <label key={r} className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 cursor-pointer transition-colors text-xs text-gray-200">
                <input
                  type="radio"
                  name="cancel_reason"
                  value={r}
                  checked={reason === r}
                  onChange={(e) => setReason(e.target.value)}
                  className="accent-red-600"
                />
                <span>{r}</span>
              </label>
            ))}
          </div>
        </div>

        {reason === "Other" && (
          <textarea
            rows={3}
            value={otherReason}
            onChange={(e) => setOtherReason(e.target.value)}
            placeholder="Please specify reason..."
            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
          />
        )}
      </div>

      <div className="p-4 border-t border-white/10 bg-gray-900/60 flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl border border-white/10 bg-white/5 text-gray-300 hover:text-white font-bold text-xs transition-colors"
        >
          Keep Booking
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || !reason || (reason === "Other" && !otherReason.trim())}
          className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-1.5"
        >
          {loading ? "Cancelling..." : "Cancel Appointment"}
        </button>
      </div>
    </CenterModal>
  );
}

// ─── Customer Reschedule Modal ──────────────────────────────────────────────
function CustomerRescheduleModal({ booking, onClose, onSubmit }) {
  const [reason, setReason] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const serviceName = booking.service_name || booking.service || "Appointment";

  const timeSlots = [
    "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM",
    "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"
  ];

  const handleSubmit = async () => {
    if (!reason.trim() || reason.trim().length < 5) {
      setError("Please provide a reason for rescheduling (at least 5 characters).");
      return;
    }
    setLoading(true);
    setError("");
    await onSubmit({
      reason: reason.trim(),
      preferredDate: preferredDate || null,
      preferredTime: preferredTime || null,
    });
    setLoading(false);
  };

  return (
    <CenterModal onClose={onClose}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gray-900/60">
        <div>
          <h2 className="text-lg font-black text-white">
            Request <span className="text-indigo-400">Reschedule</span>
          </h2>
          <p className="text-gray-400 text-xs mt-0.5 truncate">{serviceName}</p>
        </div>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-5 space-y-4 overflow-y-auto text-xs">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 font-medium">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="font-bold text-gray-300">Reason for Rescheduling *</label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => { setReason(e.target.value); setError(""); }}
            placeholder="e.g. Schedule conflict, need to move to another time..."
            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="font-bold text-gray-300">Preferred Date (Optional)</label>
            <input
              type="date"
              min={new Date().toISOString().split("T")[0]}
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500 [color-scheme:dark]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="font-bold text-gray-300">Preferred Time (Optional)</label>
            <select
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select slot (optional)</option>
              {timeSlots.map((slot) => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-white/10 bg-gray-900/60 flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl border border-white/10 bg-white/5 text-gray-300 hover:text-white font-bold text-xs transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || !reason.trim()}
          className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5"
        >
          {loading ? "Submitting..." : "Send Request"}
        </button>
      </div>
    </CenterModal>
  );
}

// ─── Reschedule Proposal Review Modal ───────────────────────────────────────
function RescheduleResponseModal({ booking, onClose, onDecide }) {
  const [loading, setLoading] = useState(false);
  const options = booking?.reschedule_options ?? [];
  const [selectedOption, setSelectedOption] = useState(options[0] || null);
  const serviceName = booking?.service_name || booking?.service || "Appointment";

  const handleDecision = async (decision) => {
    setLoading(true);
    await onDecide(booking, decision, selectedOption);
    setLoading(false);
  };

  return (
    <CenterModal onClose={onClose}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gray-900/60">
        <div>
          <h2 className="text-lg font-black text-white">
            Reschedule <span className="text-indigo-400">Proposal</span>
          </h2>
          <p className="text-gray-400 text-xs mt-0.5 truncate">{serviceName}</p>
        </div>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-5 space-y-4 overflow-y-auto text-xs">
        <div className="bg-indigo-600/10 border border-indigo-600/20 rounded-xl p-3.5 text-indigo-300">
          <p className="font-bold">Staff proposed a new schedule</p>
          <p className="text-gray-400 text-[11px] mt-1">Please review the proposed time slot below and choose to accept or decline.</p>
        </div>

        {options.length > 0 ? (
          <div className="space-y-2">
            <label className="font-bold text-gray-300">Proposed Options</label>
            {options.map((opt, i) => (
              <div
                key={i}
                onClick={() => setSelectedOption(opt)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedOption === opt
                    ? "border-indigo-500 bg-indigo-600/20 text-white"
                    : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
                }`}
              >
                <p className="font-bold">{opt.date} @ {opt.time}</p>
                {opt.note && <p className="text-gray-400 text-[11px] mt-0.5">{opt.note}</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-white/5 rounded-xl text-center text-gray-400">
            {booking?.reschedule_note ? `Note: ${booking.reschedule_note}` : "A new schedule has been suggested by the branch staff."}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/10 bg-gray-900/60 flex gap-3">
        <button
          onClick={() => handleDecision("decline")}
          disabled={loading}
          className="flex-1 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white font-bold text-xs transition-colors"
        >
          {loading ? "..." : "Decline"}
        </button>
        <button
          onClick={() => handleDecision("accept")}
          disabled={loading}
          className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all"
        >
          {loading ? "..." : "Accept Reschedule"}
        </button>
      </div>
    </CenterModal>
  );
}

export default CustomerDashboard;