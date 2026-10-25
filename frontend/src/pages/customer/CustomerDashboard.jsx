import React, { useState, useEffect, useMemo, useRef } from "react";
import CustomerLayout from "./CustomerLayout.jsx";
import { API_BASE, getAuthHeadersAsync } from "../../hooks/useAuth.js";
import { getUserFromSession } from "../../utils/getUser";
import { useNavigate } from "react-router-dom";
import ServiceChatModal from "../../components/ServiceChatModal.jsx";
import CustomDatePicker from "../../components/common/CustomDatePicker.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";

const VEHICLE_ID_STEPS = [
  {
    key: "front",
    stepNum: 1,
    title: "Front View",
    badge: "Required",
    required: true,
    instruction: "Capture the front of your vehicle. Ensure the bumper, headlights, and front license plate are visible and centered.",
    placeholderTip: "Position the front bumper & license plate inside the frame",
  },
  {
    key: "rear",
    stepNum: 2,
    title: "Rear View",
    badge: "Required",
    required: true,
    instruction: "Capture the rear of your vehicle. Ensure taillights, trunk, and rear license plate are clearly readable.",
    placeholderTip: "Position the rear bumper & license plate inside the frame",
  },
  {
    key: "side",
    stepNum: 3,
    title: "Side Profile",
    badge: "Required",
    required: true,
    instruction: "Step back to capture the full side profile from wheel to wheel so AI can identify vehicle size (Sedan, SUV, Pickup, Van).",
    placeholderTip: "Fit the full vehicle silhouette from wheel to wheel",
  },
  {
    key: "damage",
    stepNum: 4,
    title: "Damage & Condition",
    badge: "Recommended",
    required: false,
    instruction: "Capture a close-up of any existing scratches, dents, swirl marks, or paint chips. If none, capture another clear angle.",
    placeholderTip: "Capture close-up of scratches or vehicle condition",
  },
];

function CustomerDashboard() {
  const [user] = useState(() => getUserFromSession());
  const { isDark = true } = useTheme?.() || {};

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Sequential ID-style vehicle capture states (Front -> Rear -> Side -> Damage -> Review)
  const [currentIdStep, setCurrentIdStep] = useState(0); // 0 = Front, 1 = Rear, 2 = Side, 3 = Damage, 4 = Review
  const [vehiclePhotos, setVehiclePhotos] = useState({
    front: null,
    rear: null,
    side: null,
    damage: null,
  });
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState("environment");
  const [cameraError, setCameraError] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const stepFileInputRef = useRef(null);
  const stepMobileCameraInputRef = useRef(null);

  const [stats, setStats] = useState({ upcoming: 0, completed: 0 });
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [_activeSessions, setActiveSessions] = useState([]);
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

  const [hasActiveBookingState, setHasActiveBookingState] = useState(false);

  const fetchDashboardData = async () => {
    setIsDashboardLoading(true);
    setDashboardError(null);
    try {
      const headers = await getAuthHeadersAsync();
      const [dashRes, bookingsRes] = await Promise.all([
        fetch(`${API_BASE}/api/customer/dashboard/`, {
          method: "GET",
          headers,
        }),
        fetch(`${API_BASE}/api/bookings/`, {
          method: "GET",
          headers,
        }).catch(() => null),
      ]);

      if (!dashRes.ok)
        throw new Error(`Failed to fetch dashboard data (${dashRes.status})`);
      const data = await dashRes.json();

      let allBookings = [];
      if (bookingsRes && bookingsRes.ok) {
        const bData = await bookingsRes.json();
        allBookings = Array.isArray(bData) ? bData : (bData.results ?? []);
      }

      const activeStatuses = ["pending", "confirmed", "rescheduled"];
      const activeInDashboard = Boolean(data.has_active_booking);
      const activeInAllBookings = allBookings.some((b) => activeStatuses.includes(b.status));
      const activeInUpcoming = (data.upcoming_bookings || []).some((b) => activeStatuses.includes(b.status));
      const isActive = activeInDashboard || activeInAllBookings || activeInUpcoming;

      setHasActiveBookingState(isActive);

      const rawUpcoming = data.upcoming_bookings || [];
      const activeFromAll = allBookings.filter((b) => activeStatuses.includes(b.status));
      const mergedUpcoming = rawUpcoming.length > 0 ? rawUpcoming : activeFromAll;

      setStats(data.stats || { upcoming: mergedUpcoming.length, completed: 0 });
      setUpcomingBookings(mergedUpcoming);
      setActiveSessions(data.active_sessions || []);
      setServiceHistory(data.service_history || []);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      setDashboardError("Failed to load dashboard data. Please refresh.");
    } finally {
      setIsDashboardLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // ── Derived: does the user have an active booking? (pending, confirmed, rescheduled) ──
  const hasActiveBooking = useMemo(
    () =>
      hasActiveBookingState ||
      upcomingBookings.some((b) => ["pending", "confirmed", "rescheduled"].includes(b.status)),
    [hasActiveBookingState, upcomingBookings],
  );

  // ── Sequential ID-Style Photo Handlers ─────────────────────────────────────
  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setCameraError(null);
  };

  const startLiveCamera = async (facing = cameraFacingMode) => {
    setCameraError(null);
    setIsCameraActive(true);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error("Live camera is not supported by your browser. Please choose an image file instead.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Camera access failed:", err);
      setCameraError("Camera permission denied or camera is unavailable. Please choose an image file instead.");
    }
  };

  const toggleCameraFacingMode = () => {
    const nextMode = cameraFacingMode === "environment" ? "user" : "environment";
    setCameraFacingMode(nextMode);
    startLiveCamera(nextMode);
  };

  const compressImageFile = (fileOrBlob, maxDimension = 960, quality = 0.82) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(dataUrl);
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(fileOrBlob);
    });
  };

  const capturePhotoFromCamera = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    const maxDim = 960;
    let w = video.videoWidth || 1280;
    let h = video.videoHeight || 720;
    if (w > maxDim || h > maxDim) {
      if (w > h) {
        h = Math.round((h * maxDim) / w);
        w = maxDim;
      } else {
        w = Math.round((w * maxDim) / h);
        h = maxDim;
      }
    }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.82);

    const stepKey = VEHICLE_ID_STEPS[currentIdStep]?.key;
    if (!stepKey) return;

    setVehiclePhotos((prev) => ({
      ...prev,
      [stepKey]: {
        url: dataUrl,
        dataUrl,
        name: `${stepKey}-photo.jpg`,
      },
    }));
    stopLiveCamera();
    showToast(`${VEHICLE_ID_STEPS[currentIdStep]?.shortLabel} captured.`);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraActive]);

  const handleStepFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const stepKey = VEHICLE_ID_STEPS[currentIdStep]?.key;
    if (!stepKey) return;

    const dataUrl = await compressImageFile(file, 960, 0.82);
    if (!dataUrl) {
      showToast("Could not read image file. Please try another.", "error");
      return;
    }

    setVehiclePhotos((prev) => ({
      ...prev,
      [stepKey]: {
        url: dataUrl,
        dataUrl,
        name: file.name,
      },
    }));
    showToast(`${VEHICLE_ID_STEPS[currentIdStep]?.shortLabel} photo added.`);
    e.target.value = "";
  };

  const handleRetakeStep = (stepIdx) => {
    stopLiveCamera();
    const targetKey = VEHICLE_ID_STEPS[stepIdx]?.key;
    if (targetKey) {
      setVehiclePhotos((prev) => ({
        ...prev,
        [targetKey]: null,
      }));
    }
    setCurrentIdStep(stepIdx);
  };

  const handleClearAllIdPhotos = () => {
    stopLiveCamera();
    setVehiclePhotos({
      front: null,
      rear: null,
      side: null,
      damage: null,
    });
    setAnalysisResult(null);
    setCurrentIdStep(0);
    showToast("Reset all photos.");
  };

  const completedPhotosCount = Object.values(vehiclePhotos).filter(Boolean).length;
  const canRunAIAnalysis = Boolean(vehiclePhotos.front && vehiclePhotos.rear && vehiclePhotos.side);

  const runVehicleAIAnalysis = async () => {
    const photosToAnalyze = VEHICLE_ID_STEPS.map((s) => vehiclePhotos[s.key]).filter(Boolean);
    if (photosToAnalyze.length < 3) {
      alert("Please ensure Front, Rear, and Side photos are captured.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const headers = await getAuthHeadersAsync();

      const base64List = photosToAnalyze
        .map((item) => {
          if (item?.dataUrl && item.dataUrl.includes(",")) {
            return item.dataUrl.split(",")[1];
          }
          return null;
        })
        .filter(Boolean);

      const response = await fetch(`${API_BASE}/api/analyze-vehicle/`, {
        method: "POST",
        headers,
        body: JSON.stringify({ images: base64List }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data) {
        throw new Error(data?.error || data?.detail || `Analysis request failed (Status ${response.status})`);
      }
      setAnalysisResult(data);

      if (data.is_vehicle === false || data.success === false) {
        showToast(data.rejection_reason || "No vehicle detected. Please check the photos.", "error");
      } else {
        showToast(`Vehicle recognized: ${data.make} ${data.model}!`);
      }
    } catch (error) {
      console.error("Analysis Error:", error);
      alert(error.message || "Failed to analyze vehicle. Please try again.");
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
      setUpcomingBookings((prev) => {
        const next = prev.filter((b) => b.id !== booking.id);
        const hasRemainingActive = next.some((b) => ["pending", "confirmed", "rescheduled"].includes(b.status));
        setHasActiveBookingState(hasRemainingActive);
        return next;
      });
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
      <div className={`relative py-10 sm:py-14 md:py-16 border-b transition-colors ${
        isDark
          ? "bg-gradient-to-b from-red-950/20 via-gray-900 to-gray-950 border-white/5"
          : "bg-gradient-to-b from-red-50/50 via-white to-gray-50 border-gray-200"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className={`text-3xl sm:text-4xl md:text-5xl font-black mb-2 sm:mb-4 tracking-tight leading-tight ${
                isDark ? "text-white" : "text-gray-900"
              }`}>
                Welcome back,&nbsp;{displayFirst}!
              </h1>
              <p className={`text-base sm:text-lg md:text-xl ${isDark ? "text-gray-400" : "text-gray-600"}`}>
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

          {/* ── Active Booking Banner ── */}
          {!isDashboardLoading && hasActiveBooking && (
            <div className="mt-6 flex items-center gap-3 bg-yellow-600/10 border border-yellow-600/25 rounded-2xl px-4 py-3">
              <div className="w-8 h-8 rounded-lg bg-yellow-600/20 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-yellow-400 font-semibold text-xs sm:text-sm">You have an active booking</p>
                <p className="text-gray-400 text-[10px] sm:text-xs">
                  New bookings are blocked until your current one is completed or cancelled.{" "}
                  <button onClick={() => navigate("/bookings")} className="text-yellow-400 hover:text-yellow-300 underline underline-offset-2 transition-colors">
                    View booking →
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12">

        {/* ── Error Banner ── */}
        {dashboardError && (
          <div className="mb-6 sm:mb-8 bg-red-500/10 border border-red-500/30 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-red-400">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <span className="text-sm font-semibold">{dashboardError}</span>
            </div>
            <button
              type="button"
              onClick={() => fetchDashboardData()}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-md self-start sm:self-auto cursor-pointer"
            >
              Retry
            </button>
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
          <h2 className={`text-xl sm:text-2xl font-black mb-3 sm:mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>Quick Actions</h2>
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
                    className={`group w-full rounded-xl p-3 sm:p-4 backdrop-blur-sm transition-all duration-200 text-left flex items-center gap-3 sm:gap-4 border ${blocked
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:border-red-500/30 hover:scale-[1.02]"
                      } ${isDark ? "bg-gray-900/60 border-white/5" : "bg-white border-gray-200 shadow-sm"}`}
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
                      <h3 className={`text-xs sm:text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{title}</h3>
                      <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>{desc}</p>
                    </div>
                  </button>
                </BookingBlockedTooltip>
              );
            })}
          </div>
        </div>

        {/* ── Car AI Analysis ── */}
        <div className="mb-8 sm:mb-10 md:mb-12">
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <h2 className={`text-xl sm:text-2xl font-black ${isDark ? "text-white" : "text-gray-900"}`}>Vehicle AI Analysis</h2>
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 bg-red-500/10 rounded-full border border-red-500/30">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-[10px] sm:text-xs font-bold text-red-400 uppercase tracking-widest">Powered by AI</span>
            </div>
          </div>

          {/* Hidden input for step capture */}
          <input
            type="file"
            ref={stepFileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleStepFileSelected}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-stretch">
            {/* ── Left Column: Sequential ID-Style Photo Capture ── */}
            <div className={`rounded-2xl p-5 sm:p-6 backdrop-blur-sm flex flex-col justify-between shadow-xl min-h-[500px] border transition-colors ${
              isDark ? "bg-gray-900/60 border-white/5" : "bg-white border-gray-200 shadow-sm"
            }`}>
              {currentIdStep < 4 ? (
                /* ── STEPS 1 TO 4: ACTIVE ID STEP ── */
                <div>
                  {(() => {
                    const step = VEHICLE_ID_STEPS[currentIdStep];
                    const photo = vehiclePhotos[step.key];

                    return (
                      <div>
                        {/* Step Header with Segmented Progress */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="font-bold text-red-500 uppercase tracking-wider flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                              <span>Step {step.stepNum} of 4: {step.title}</span>
                            </span>
                            <span className={`${isDark ? "text-gray-400" : "text-gray-500"} font-semibold`}>
                              {completedPhotosCount} of 4 Completed
                            </span>
                          </div>

                          {/* 4-Segmented Progress Bar */}
                          <div className="grid grid-cols-4 gap-1.5 mb-3">
                            {VEHICLE_ID_STEPS.map((s, idx) => (
                              <div
                                key={s.key}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                  vehiclePhotos[s.key]
                                    ? "bg-emerald-500 shadow-sm shadow-emerald-500/50"
                                    : idx === currentIdStep
                                    ? "bg-red-600 shadow-sm shadow-red-600/50"
                                    : isDark
                                    ? "bg-gray-800"
                                    : "bg-gray-200"
                                }`}
                              />
                            ))}
                          </div>

                          <h3 className={`text-base sm:text-lg font-black ${isDark ? "text-white" : "text-gray-900"}`}>
                            {step.title}
                          </h3>
                          <p className={`text-xs mt-0.5 leading-relaxed ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                            {step.instruction}
                          </p>
                        </div>

                        {/* Scanner Viewport with ID Corner Brackets */}
                        <div className={`relative rounded-2xl overflow-hidden border-2 border-dashed p-3 sm:p-4 my-3 min-h-[270px] sm:min-h-[300px] flex flex-col items-center justify-center text-center transition-colors ${
                          isDark ? "border-red-500/30 bg-gray-950/80" : "border-red-300 bg-red-50/40"
                        }`}>
                          {/* Corner Brackets */}
                          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-red-500 pointer-events-none" />
                          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-red-500 pointer-events-none" />
                          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-red-500 pointer-events-none" />
                          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-red-500 pointer-events-none" />
                          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-red-500 pointer-events-none" />

                          {/* Case A: Camera Active */}
                          {isCameraActive ? (
                            <div className="w-full space-y-3">
                              {cameraError ? (
                                <div className="p-4 text-center text-xs space-y-2">
                                  <p className="text-amber-400 font-semibold">{cameraError}</p>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      stopLiveCamera();
                                      stepFileInputRef.current?.click();
                                    }}
                                    className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl text-xs"
                                  >
                                    Choose File Instead
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <div className="relative rounded-xl overflow-hidden bg-black">
                                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-56 sm:h-64 object-cover" />
                                    <div className="absolute inset-3 border border-dashed border-white/40 rounded-lg pointer-events-none flex items-center justify-center">
                                      <span className="text-[10px] text-white/70 bg-black/50 px-2 py-0.5 rounded font-mono uppercase tracking-wider">
                                        Align {step.shortLabel}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-center gap-3">
                                    <button
                                      type="button"
                                      onClick={toggleCameraFacingMode}
                                      className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold border border-white/10 transition-all"
                                      title="Switch Front/Rear Camera"
                                    >
                                      Flip Camera
                                    </button>
                                    <button
                                      type="button"
                                      onClick={capturePhotoFromCamera}
                                      className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-red-600/40 transition-all flex items-center gap-2"
                                    >
                                      <span className="w-3 h-3 rounded-full bg-white animate-ping" />
                                      <span>Capture Photo</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={stopLiveCamera}
                                      className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-xs font-bold transition-all"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ) : photo ? (
                            /* Case B: Photo Captured for this Step */
                            <div className="w-full space-y-3">
                              <div className="relative rounded-xl overflow-hidden border border-emerald-500/40">
                                <img
                                  src={photo.url}
                                  alt={step.title}
                                  className="w-full h-56 sm:h-64 object-cover"
                                />
                                <div className="absolute top-2.5 left-2.5 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-emerald-500/50 flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                                  <span>✓</span>
                                  <span>{step.title} Captured</span>
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleRetakeStep(currentIdStep)}
                                  className="w-full sm:w-auto px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold border border-white/10 transition-all"
                                >
                                  Retake Photo
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCurrentIdStep((prev) => prev + 1)}
                                  className="w-full sm:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2"
                                >
                                  <span>
                                    {currentIdStep === 3
                                      ? "Review All 4 Photos →"
                                      : `Confirm & Proceed to Step ${currentIdStep + 2} →`}
                                  </span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Case C: Waiting for Photo */
                            <div className="space-y-4 max-w-sm">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${
                                isDark ? "bg-red-500/10 text-red-400" : "bg-red-100 text-red-600"
                              }`}>
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </div>
                              <div>
                                <p className={`text-sm font-bold mb-0.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                                  Capture {step.shortLabel}
                                </p>
                                <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                  {step.placeholderTip}
                                </p>
                              </div>

                              {/* Two Clear Action Buttons */}
                              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                                <button
                                  type="button"
                                  onClick={() => startLiveCamera()}
                                  className="w-full sm:w-auto px-5 py-3 bg-red-600 hover:bg-red-500 text-white !text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-red-600/30 flex items-center justify-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                  </svg>
                                  <span>Take Photo with Camera</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => stepFileInputRef.current?.click()}
                                  className={`w-full sm:w-auto px-5 py-3 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 border ${
                                    isDark
                                      ? "bg-white/5 hover:bg-white/10 text-white border-white/10"
                                      : "bg-white hover:bg-gray-50 text-gray-800 border-gray-300 shadow-sm"
                                  }`}
                                >
                                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                  </svg>
                                  <span>Choose from Files</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Navigation Footer */}
                        <div className="flex items-center justify-between text-xs pt-1">
                          {currentIdStep > 0 ? (
                            <button
                              type="button"
                              onClick={() => {
                                stopLiveCamera();
                                setCurrentIdStep((prev) => Math.max(0, prev - 1));
                              }}
                              className={`font-bold transition-colors ${
                                isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"
                              }`}
                            >
                              ← Back to Step {currentIdStep}
                            </button>
                          ) : (
                            <span />
                          )}

                          {completedPhotosCount >= 3 && (
                            <button
                              type="button"
                              onClick={() => {
                                stopLiveCamera();
                                setCurrentIdStep(4);
                              }}
                              className="text-red-500 hover:text-red-600 font-bold transition-colors"
                            >
                              Skip to Review Screen →
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* ── STEP 5: REVIEW ALL 4 PHOTOS BEFORE SCANNING ── */
                <div>
                  <div className={`flex items-center justify-between mb-3 pb-2 border-b ${isDark ? "border-white/5" : "border-gray-200"}`}>
                    <div>
                      <h3 className={`text-base sm:text-lg font-black flex items-center gap-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                        <span>Review Vehicle Photos</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                          isDark ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-emerald-100 text-emerald-700 border-emerald-300"
                        }`}>
                          {completedPhotosCount} / 4 Captured
                        </span>
                      </h3>
                      <p className={`text-xs mt-0.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        Verify all 4 angles are clearly visible before running the AI vehicle scan.
                      </p>
                    </div>
                  </div>

                  {/* 2x2 Photos Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {VEHICLE_ID_STEPS.map((step, idx) => {
                      const photo = vehiclePhotos[step.key];
                      return (
                        <div
                          key={step.key}
                          className={`rounded-xl overflow-hidden p-2 flex flex-col justify-between border ${
                            isDark ? "bg-gray-950/80 border-white/10" : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold mb-1.5 px-0.5">
                            <span className={`truncate ${isDark ? "text-white" : "text-gray-800"}`}>#{step.stepNum} {step.shortLabel}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                              photo
                                ? isDark ? "text-emerald-400 bg-emerald-500/20" : "text-emerald-700 bg-emerald-100"
                                : isDark ? "text-amber-400 bg-amber-500/20" : "text-amber-700 bg-amber-100"
                            }`}>
                              {photo ? "Ready" : step.badge}
                            </span>
                          </div>

                          {photo ? (
                            <div className="relative rounded-lg overflow-hidden group">
                              <img src={photo.url} alt={step.title} className="w-full h-24 sm:h-28 object-cover" />
                              <button
                                type="button"
                                onClick={() => handleRetakeStep(idx)}
                                className="absolute bottom-1.5 right-1.5 bg-black/80 hover:bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-md transition-all shadow"
                              >
                                Retake
                              </button>
                            </div>
                          ) : (
                            <div className={`h-24 sm:h-28 rounded-lg border border-dashed flex flex-col items-center justify-center p-2 text-center ${
                              isDark ? "border-white/10 bg-gray-900/50" : "border-gray-300 bg-white"
                            }`}>
                              <span className={`text-xs font-medium mb-1.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>No photo added</span>
                              <button
                                type="button"
                                onClick={() => handleRetakeStep(idx)}
                                className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold rounded-lg transition-all"
                              >
                                Take Photo
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setCurrentIdStep(0)}
                      className={`font-bold transition-colors ${
                        isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      ← Back to Step 1
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllIdPhotos}
                      className="text-red-500 hover:text-red-600 font-bold transition-colors"
                    >
                      Reset All Photos
                    </button>
                  </div>
                </div>
              )}

              {/* Bottom Submit Action */}
              <div className={`pt-4 border-t mt-3 space-y-2 ${isDark ? "border-white/10" : "border-gray-200"}`}>
                <button
                  type="button"
                  disabled={!canRunAIAnalysis || isAnalyzing}
                  onClick={runVehicleAIAnalysis}
                  className={`w-full py-3.5 px-6 rounded-xl font-black text-sm uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${
                    canRunAIAnalysis && !isAnalyzing
                      ? "bg-red-600 hover:bg-red-500 text-white shadow-xl shadow-red-600/40 hover:scale-[1.01]"
                      : isDark
                      ? "bg-gray-800 text-gray-500 border border-white/5 cursor-not-allowed"
                      : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Analyzing Vehicle Photos with AI…</span>
                    </>
                  ) : (
                    <span>Submit Photos & Scan Vehicle with AI</span>
                  )}
                </button>
                <p className={`text-[10px] text-center font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  {canRunAIAnalysis
                    ? "Front, Rear, and Side photos confirmed. Ready to identify make, model, year, body type, plate, and condition."
                    : "Complete Front, Rear, and Side photos to enable AI vehicle recognition."}
                </p>
              </div>
            </div>

            {/* Results panel */}
            <div className={`rounded-2xl p-6 sm:p-8 backdrop-blur-sm flex flex-col min-h-[240px] border transition-colors ${
              isDark ? "bg-gray-900/60 border-white/5" : "bg-white border-gray-200 shadow-sm"
            }`}>
              {analysisResult && (analysisResult.is_vehicle === false || analysisResult.success === false) ? (
                <div className="flex flex-col items-center justify-center text-center my-auto p-4 space-y-3">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center border ${
                    isDark ? "bg-red-500/20 text-red-400 border-red-500/40" : "bg-red-100 text-red-600 border-red-200"
                  }`}>
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className={`text-base font-black ${isDark ? "text-white" : "text-gray-900"}`}>No Vehicle Detected</h3>
                  <p className={`text-xs max-w-xs leading-relaxed ${isDark ? "text-red-300" : "text-red-600"}`}>
                    {analysisResult.rejection_reason || "The uploaded image is a person or not a vehicle. Please upload clear photos of your vehicle."}
                  </p>
                  <button
                    onClick={() => { setPreviewImage(null); setAnalysisResult(null); }}
                    className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
                  >
                    Retry / Upload Vehicle Photos
                  </button>
                </div>
              ) : analysisResult ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`text-lg font-black ${isDark ? "text-white" : "text-gray-900"}`}>Vehicle Analysis Results</h3>
                    {analysisResult.plateNumber && (
                      <span className="px-2.5 py-0.5 bg-white text-black font-mono font-black text-xs rounded border border-gray-400">
                        {analysisResult.plateNumber}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Make", value: analysisResult.make },
                      { label: "Model", value: analysisResult.model },
                      { label: "Year", value: analysisResult.year },
                      { label: "Body Type", value: analysisResult.bodyType },
                      { label: "Confidence", value: analysisResult.confidence },
                    ].map((field) => (
                      <div key={field.label} className={`rounded-xl p-3 border ${
                        isDark ? "bg-gray-800/60 border-white/5" : "bg-gray-50 border-gray-200"
                      }`}>
                        <div className={`text-xs mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{field.label}</div>
                        <div className={`font-bold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>{field.value || "Not detected"}</div>
                      </div>
                    ))}
                    {/* Color with hex swatch */}
                    <div className={`rounded-xl p-3 border ${
                      isDark ? "bg-gray-800/60 border-white/5" : "bg-gray-50 border-gray-200"
                    }`}>
                      <div className={`text-xs mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Color</div>
                      <div className="flex items-center gap-2">
                        {(analysisResult.colorHex || analysisResult.color) && (
                          <div className="w-4 h-4 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: analysisResult.colorHex || analysisResult.color.toLowerCase() }} />
                        )}
                        <span className={`font-bold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>{analysisResult.color || "Not detected"}</span>
                      </div>
                    </div>
                    {/* Plate Number */}
                    {analysisResult.plateNumber ? (
                      <div className={`rounded-xl p-3 border ${
                        isDark ? "bg-gray-800/60 border-white/5" : "bg-gray-50 border-gray-200"
                      }`}>
                        <div className={`text-xs mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Plate Number</div>
                        <div className={`font-bold text-sm font-mono tracking-wider ${isDark ? "text-white" : "text-gray-900"}`}>{analysisResult.plateNumber}</div>
                      </div>
                    ) : null}
                    {/* Vehicle Size */}
                    {(analysisResult.vehicleSizeLabel || analysisResult.vehicleSize) && (
                      <div className={`rounded-xl p-3 col-span-2 border ${
                        isDark ? "bg-gray-800/60 border-white/5" : "bg-blue-50/50 border-blue-100"
                      }`}>
                        <div className={`text-xs mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Vehicle Size Class</div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                            isDark ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-blue-100 text-blue-700 border-blue-200"
                          }`}>
                            {(analysisResult.vehicleSize || "SMALL").toUpperCase()}
                          </span>
                          <span className={`font-bold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>{analysisResult.vehicleSizeLabel || analysisResult.vehicleSize}</span>
                        </div>
                      </div>
                    )}
                    {/* Condition with details */}
                    <div className={`rounded-xl p-3 col-span-2 border ${
                      isDark ? "bg-gray-800/60 border-white/5" : "bg-gray-50 border-gray-200"
                    }`}>
                      <div className={`text-xs mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Estimated Condition</div>
                      <div className="flex items-start gap-2">
                        <div className="w-3 h-3 rounded-full shrink-0 mt-1" style={{ backgroundColor: conditionColor(analysisResult.condition) }} />
                        <div>
                          <span className={`font-bold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>{analysisResult.condition || "Not detected"}</span>
                          {analysisResult.conditionDetails && (
                            <p className={`text-xs mt-0.5 leading-relaxed ${isDark ? "text-gray-400" : "text-gray-600"}`}>{analysisResult.conditionDetails}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Features */}
                    {analysisResult.features?.length > 0 && (
                      <div className={`rounded-xl p-3 col-span-2 border ${
                        isDark ? "bg-gray-800/60 border-white/5" : "bg-gray-50 border-gray-200"
                      }`}>
                        <div className={`text-xs mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Notable Features</div>
                        <div className="flex flex-wrap gap-1.5">
                          {analysisResult.features.map((f, i) => (
                            <span key={i} className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              isDark ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}>{f}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* AI Notes */}
                    {analysisResult.additionalNotes && (
                      <div className={`rounded-xl p-3 col-span-2 border ${
                        isDark ? "bg-gray-800/60 border-white/5" : "bg-gray-50 border-gray-200"
                      }`}>
                        <div className={`text-xs mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>AI Notes</div>
                        <p className={`text-sm leading-relaxed ${isDark ? "text-gray-300" : "text-gray-700"}`}>{analysisResult.additionalNotes}</p>
                      </div>
                    )}
                    {/* Recommended Services */}
                    {analysisResult.recommendedServices?.length > 0 && (
                      <div className={`rounded-xl p-3.5 col-span-2 space-y-2 border ${
                        isDark ? "bg-gray-800/60 border-white/5" : "bg-gray-50 border-gray-200"
                      }`}>
                        <div className={`flex items-center justify-between text-xs font-bold ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                          <span className="flex items-center gap-2">
                            <span>Top {Math.min(10, analysisResult.recommendedServices.length)} AI Recommended Services</span>
                          </span>
                          <span className="text-[10px] text-red-500 font-semibold uppercase tracking-wider">Click to book</span>
                        </div>
                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                          {analysisResult.recommendedServices.slice(0, 10).map((svc, i) => (
                            <div
                              key={i}
                              className={`flex items-center justify-between p-2.5 rounded-xl transition-all gap-3 border ${
                                isDark
                                  ? "bg-black/20 hover:bg-white/5 border-white/5"
                                  : "bg-white hover:bg-gray-100 border-gray-200 shadow-sm"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <span className="w-5 h-5 rounded-full bg-red-600/20 border border-red-500/30 text-red-400 font-black text-[10px] flex items-center justify-center shrink-0">
                                  #{i + 1}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className={`text-xs sm:text-sm font-bold truncate ${isDark ? "text-white" : "text-gray-900"}`}>{svc.name}</div>
                                  {svc.category && <div className={`text-[10px] ${isDark ? "text-gray-400" : "text-gray-500"}`}>{svc.category}</div>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {svc.price && (
                                  <span className="text-emerald-500 font-black text-xs sm:text-sm">₱{Number(svc.price).toLocaleString()}</span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleBookRecommended(svc)}
                                  className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white !text-white font-bold rounded-lg text-xs shadow-md shadow-red-600/20 transition-all cursor-pointer"
                                  style={{ color: "#ffffff" }}
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
                    className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white !text-white font-black px-4 py-3.5 rounded-xl transition-all shadow-lg shadow-red-600/30 text-sm mt-3 cursor-pointer"
                    style={{ color: "#ffffff" }}
                  >
                    <svg className="w-4 h-4 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002-2z" />
                    </svg>
                    <span>Book {analysisResult.recommendedServices?.[0]?.name ? `"${analysisResult.recommendedServices[0].name}"` : "Recommended Service"}</span>
                  </button>
                  <div className={`rounded-xl p-3 border ${
                    isDark ? "bg-blue-500/10 border-blue-500/20 text-blue-300" : "bg-blue-50 border-blue-200 text-blue-900"
                  }`}>
                    <div className="flex items-start gap-2">
                      <svg className={`w-4 h-4 mt-0.5 shrink-0 ${isDark ? "text-blue-400" : "text-blue-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className={`text-xs ${isDark ? "text-blue-300" : "text-blue-800"}`}>
                        <span className="font-black">AI-Powered Analysis:</span>{" "}
                        Results are generated by AI based on the uploaded image and may vary based on image quality.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                  <svg className={`w-12 h-12 sm:w-16 sm:h-16 mb-3 sm:mb-4 ${isDark ? "text-gray-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className={`italic text-sm ${isDark ? "text-gray-500" : "text-gray-500"}`}>Analysis results will appear here after upload</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Upcoming Bookings ── */}
        <div className="mb-8 sm:mb-10 md:mb-12">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className={`text-xl sm:text-2xl font-black ${isDark ? "text-white" : "text-gray-900"}`}>Upcoming Bookings</h2>
            <button onClick={() => navigate("/bookings")} className="text-xs sm:text-sm text-red-500 hover:text-red-600 font-semibold transition-colors duration-200">
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
                            className="btn-action-indigo px-3 py-1.5 sm:px-4 sm:py-2 bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-600/40 text-indigo-300 hover:text-white rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200"
                          >
                            {booking.status === "rescheduled" ? "Review Reschedule" : "Reschedule"}
                          </button>
                          <button
                            onClick={() => setCancelBooking(booking)}
                            className="btn-action-red px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600/20 hover:bg-red-600 border border-red-600/40 text-red-400 hover:text-white rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200"
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
  const [selectedPreset, setSelectedPreset] = useState("");
  const [notes, setNotes] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const serviceName = booking.service_name || booking.service || "Appointment";

  const timeSlots = [
    "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM",
    "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"
  ];

  const RESCHEDULE_REASONS = [
    "Schedule / Time Conflict",
    "Vehicle Unavailable",
    "Emergency / Urgent Matter",
    "Bad Weather / Rain Forecast",
    "Prefer Another Date / Time",
    "Other / Custom Reason",
  ];

  const handleSubmit = async () => {
    const combinedReason = selectedPreset
      ? (notes.trim() ? `${selectedPreset} - ${notes.trim()}` : selectedPreset)
      : notes.trim();

    if (!combinedReason || combinedReason.length < 5) {
      setError("Please select a reason or provide at least 5 characters in notes.");
      return;
    }
    setLoading(true);
    setError("");
    await onSubmit({
      reason: combinedReason,
      preferredDate: preferredDate || null,
      preferredTime: preferredTime || null,
    });
    setLoading(false);
  };

  const currentReason = selectedPreset
    ? (notes.trim() ? `${selectedPreset} - ${notes.trim()}` : selectedPreset)
    : notes.trim();

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

        <div className="space-y-2">
          <label className="font-bold text-gray-300 block">
            Reason for Rescheduling <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {RESCHEDULE_REASONS.map((r) => {
              const active = selectedPreset === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setSelectedPreset(active ? "" : r);
                    setError("");
                  }}
                  className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                    active
                      ? "border-indigo-500 bg-indigo-600/25 text-indigo-300 ring-1 ring-indigo-500/40 font-bold"
                      : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:border-white/20"
                  }`}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="font-bold text-gray-300 block">
            {selectedPreset ? "Additional Notes (Optional)" : "Reason Notes / Details *"}
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => { setNotes(e.target.value); setError(""); }}
            placeholder={
              selectedPreset
                ? "Add extra details or specific instructions for the staff..."
                : "e.g. Schedule conflict, need to move to another date..."
            }
            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="font-bold text-gray-300">Preferred Date (Optional)</label>
            <CustomDatePicker
              min={new Date().toISOString().split("T")[0]}
              value={preferredDate}
              onChange={(val) => setPreferredDate(val)}
              placeholder="Select preferred date"
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
          disabled={loading || !currentReason.trim()}
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
