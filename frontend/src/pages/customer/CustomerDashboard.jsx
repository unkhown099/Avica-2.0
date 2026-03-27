import React, { useState, useEffect } from "react";
import CustomerLayout from "./CustomerLayout.jsx";
import { useAuth, API_BASE } from "../../hooks/useAuth.js";
import { getUserFromSession } from "../../utils/getUser";

function CustomerDashboard() {
  const [user] = useState(() => getUserFromSession());

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const [stats, setStats] = useState({
    upcoming: 0,
    completed: 0,
  });
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [serviceHistory, setServiceHistory] = useState([]);

  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState(null);

  const getAuthHeaders = () => {
    const token =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsDashboardLoading(true);
      setDashboardError(null);
      try {
        const response = await fetch(
          `${API_BASE}/api/customer/dashboard/`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...getAuthHeaders(),
            },
          },
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch dashboard data (${response.status})`,
          );
        }

        const data = await response.json();

        // FIX 1: Filter by full datetime, not just date
        // This correctly removes bookings where the date+time has already passed
        const now = new Date();

        const trueUpcoming = (data.upcoming_bookings || []).filter((b) => {
          // Combine date and time fields if separate, or parse ISO datetime directly
          let bookingDateTime;
          if (b.time) {
            // e.g. date = "2026-03-20", time = "08:00:00"
            bookingDateTime = new Date(`${b.date}T${b.time}`);
          } else {
            // Fallback: treat as all-day, use end of that day
            bookingDateTime = new Date(b.date);
            bookingDateTime.setHours(23, 59, 59, 999);
          }
          return bookingDateTime > now;
        });

        setStats(
          data.stats || { upcoming: 0, completed: 0 },
        );
        setUpcomingBookings(trueUpcoming);
        // FIX 2: Use all service history — no "this week" filter
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

    const formData = new FormData();
    formData.append("car_image", file);

    try {
      const response = await fetch(
        `${API_BASE}/api/car-recognition/`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: formData,
        },
      );

      const data = await response.json();

      if (data.success) {
        setAnalysisResult({
          ...data.result,
          recommendations: generateRecommendations(data.result),
        });
        if (data.demo_mode)
          console.warn("Gemini API Key not configured. Using Demo Mode.");
      } else {
        alert(data.message || "An error occurred during car analysis.");
        setPreviewImage(null);
      }
    } catch (error) {
      console.error("Analysis Error:", error);
      alert("Failed to connect to the analysis server.");
      setPreviewImage(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateRecommendations = (car) => {
    const { make, model, year, color } = car;
    const recs = [];

    recs.push({
      title: "Ceramic Coating",
      reason: `Protect your ${make}'s ${color} finish from UV rays and road debris.`,
      price: "₱15,000+",
    });

    const modelLower = model.toLowerCase();
    if (
      modelLower.includes("fortuner") ||
      modelLower.includes("hilux") ||
      modelLower.includes("raptor")
    ) {
      recs.push({
        title: "Undercarriage Protection",
        reason:
          "Essential for 4x4 vehicles to prevent rust and damage from off-road adventures.",
        price: "₱8,500",
      });
    } else {
      recs.push({
        title: "Interior Deep Extraction",
        reason:
          "Keep your cabin fresh and allergen-free with our deep steam cleaning.",
        price: "₱3,500",
      });
    }

    const currentYear = new Date().getFullYear();
    const carYear = parseInt(year);
    if (!isNaN(carYear) && currentYear - carYear > 5) {
      recs.push({
        title: "Paint Correction",
        reason:
          "Restore the original shine of your vehicle by removing light scratches and swirls.",
        price: "₱6,500+",
      });
    } else {
      recs.push({
        title: "Paint Protection Film (Front)",
        reason:
          "Prevent future rock chips on your relatively new vehicle's front end.",
        price: "₱25,000+",
      });
    }

    return recs;
  };

  // FIX 3: Format date cleanly — no time component shown
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    // Parse only the date portion to avoid timezone issues showing wrong date
    const [year, month, day] = String(dateStr).split("T")[0].split("-");
    if (!year || !month || !day) return dateStr;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    if (isNaN(date)) return dateStr;
    return date.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const displayFirst = user?.firstName || "there";
  const nextBooking = upcomingBookings?.[0];
  const nextAppointmentValue = nextBooking
    ? `${formatDate(nextBooking.date)}${nextBooking.time ? ` • ${nextBooking.time}` : ""}`
    : "—";
  const lastServiceValue = serviceHistory?.[0]
    ? formatDate(serviceHistory[0].date)
    : "—";

  const statCards = [
    {
      icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
      value: stats.upcoming,
      label: "Upcoming",
      border: "border-red-500/20",
      bg: "bg-red-500/10",
      text: "text-red-400",
    },
    {
      icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      value: stats.completed,
      label: "Completed",
      border: "border-emerald-500/20",
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
    },
    {
      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
      value: nextAppointmentValue,
      label: "Next Appointment",
      border: "border-blue-500/20",
      bg: "bg-blue-500/10",
      text: "text-blue-400",
    },
    {
      icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
      value: lastServiceValue,
      label: "Last Service Date",
      border: "border-amber-500/20",
      bg: "bg-amber-500/10",
      text: "text-amber-400",
    },
  ];

  return (
    <CustomerLayout>
      {/* Hero */}
      <div className="relative bg-gradient-to-b from-red-950/20 via-gray-900 to-gray-950 py-16 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                Welcome back, {displayFirst}!
              </h1>
              <p className="text-xl text-gray-400">
                Ready to keep your car looking its best?
              </p>
            </div>
            <button className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-red-600/30 flex items-center gap-2">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Book New Service
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Error Banner */}
        {dashboardError && (
          <div className="mb-8 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3 text-red-400">
            <svg
              className="w-5 h-5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
            <span className="text-sm font-semibold">{dashboardError}</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-12">
          {statCards.map(({ icon, value, label, border, bg, text }) => (
            <div
              key={label}
              className={`bg-gray-900/60 border ${border} rounded-2xl p-5 backdrop-blur-sm hover:border-opacity-60 transition-all`}
            >
              <div className="flex items-start gap-4">
                <div className={`${bg} ${text} p-3 rounded-xl shrink-0`}>
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={icon}
                    />
                  </svg>
                </div>
                <div>
                  {isDashboardLoading ? (
                    <div className="h-7 w-12 bg-white/10 rounded animate-pulse mb-1" />
                  ) : (
                    <div className="text-2xl font-black text-white">
                      {value}
                    </div>
                  )}
                  <div className="text-sm text-gray-500">{label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FIX 4: Compact Quick Actions — smaller padding, horizontal layout */}
        <div className="mb-12">
          <h2 className="text-2xl font-black text-white mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-3">
            {[
              {
                title: "Book a Service",
                desc: "Schedule your next appointment",
                icon: "M12 4v16m8-8H4",
                accent: "#ef4444",
              },
              {
                title: "Manage Bookings",
                desc: "View and modify appointments",
                icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
                accent: "#3b82f6",
              },
              {
                title: "Service History",
                desc: "Review your past services",
                icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
                accent: "#10b981",
              },
            ].map(({ title, desc, icon, accent }) => (
              <button
                key={title}
                className="group bg-gray-900/60 border border-white/5 rounded-xl p-4 backdrop-blur-sm hover:border-red-500/30 transition-all duration-300 hover:scale-[1.02] text-left flex items-center gap-4"
              >
                <div
                  className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300"
                  style={{ color: accent }}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={icon}
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{title}</h3>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Car AI Analysis */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-white">Car AI Analysis</h2>
            <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 rounded-full border border-red-500/30">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-red-400 uppercase tracking-widest">
                Powered by AI
              </span>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 items-stretch">
            {/* Upload */}
            <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-8 backdrop-blur-sm flex flex-col items-center justify-center text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              {!previewImage ? (
                <>
                  <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                    <svg
                      className="w-10 h-10 text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-black text-white mb-2">
                    Identify Your Car
                  </h3>
                  <p className="text-sm text-gray-400 mb-8 max-w-xs">
                    Upload a photo of your vehicle for personalised service
                    recommendations
                  </p>
                  <label className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-4 rounded-xl cursor-pointer transition-all duration-300 shadow-lg shadow-red-600/30">
                    Upload Car Photo
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleCarImageUpload}
                    />
                  </label>
                </>
              ) : (
                <div className="w-full h-full relative group/preview">
                  <img
                    src={previewImage}
                    alt="Car preview"
                    className="w-full h-64 object-cover rounded-xl border border-white/10"
                  />
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl">
                      <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4" />
                      <p className="text-white font-bold animate-pulse uppercase tracking-widest text-sm">
                        Analysing Vehicle…
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setPreviewImage(null);
                      setAnalysisResult(null);
                    }}
                    className="absolute top-4 right-4 bg-gray-900/60 hover:bg-red-600 p-2 rounded-lg text-white border border-white/10 transition-all opacity-0 group-hover/preview:opacity-100"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Result */}
            <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-8 backdrop-blur-sm flex flex-col">
              {analysisResult ? (
                <div>
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <div className="text-sm font-bold text-red-400 uppercase tracking-widest mb-1">
                        Detected Vehicle
                      </div>
                      <h3 className="text-3xl font-black text-white">
                        {analysisResult.make} {analysisResult.model}
                      </h3>
                      <p className="text-gray-400 font-medium">
                        {analysisResult.year} • {analysisResult.color}
                      </p>
                    </div>
                    <div className="bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl border border-emerald-500/30 font-bold text-sm">
                      98% Match
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                      Tailored Recommendations
                    </div>
                    {analysisResult.recommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-red-500/30 transition-all group/rec"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="text-white font-bold mb-1 group-hover/rec:text-red-400 transition-colors">
                              {rec.title}
                            </h4>
                            <p className="text-sm text-gray-400">
                              {rec.reason}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-lg font-black text-white mb-1">
                              {rec.price}
                            </div>
                            <button className="text-xs font-bold text-red-400 hover:text-red-300 uppercase">
                              Book Now
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                  <svg
                    className="w-16 h-16 text-gray-600 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-gray-500 italic">
                    Analysis results will appear here after upload
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-white">
              Upcoming Bookings
            </h2>
            <a
              href="/bookings"
              className="text-sm text-red-400 hover:text-red-300 font-semibold transition-colors"
            >
              View All →
            </a>
          </div>

          {isDashboardLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 animate-pulse"
                >
                  <div className="h-5 w-48 bg-white/10 rounded mb-3" />
                  <div className="h-4 w-32 bg-white/5 rounded" />
                </div>
              ))}
            </div>
          ) : upcomingBookings.length === 0 ? (
            <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-10 text-center">
              <p className="text-gray-500 italic">No upcoming bookings.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm hover:border-red-500/30 transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-white">
                          {booking.service}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${booking.status === "confirmed"
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                              : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                            }`}
                        >
                          {booking.status.charAt(0).toUpperCase() +
                            booking.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-gray-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {/* FIX 3 applied: clean date display */}
                          <span>{formatDate(booking.date)}</span>
                        </div>
                        {booking.time && (
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-gray-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {/* Show time cleanly, strip seconds if present */}
                            <span>
                              {booking.time.length > 5
                                ? booking.time.slice(0, 5)
                                : booking.time}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-xl font-black text-white">
                        {booking.price}
                      </div>
                      <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-semibold transition-colors border border-white/5">
                          Reschedule
                        </button>
                        <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-red-600/30">
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Service History */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-white">
              Recent Service History
            </h2>
            <a
              href="/history"
              className="text-sm text-red-400 hover:text-red-300 font-semibold transition-colors"
            >
              View All →
            </a>
          </div>

          {isDashboardLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 animate-pulse"
                >
                  <div className="h-5 w-48 bg-white/10 rounded mb-3" />
                  <div className="h-4 w-32 bg-white/5 rounded" />
                </div>
              ))}
            </div>
          ) : serviceHistory.length === 0 ? (
            <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-10 text-center">
              <p className="text-gray-500 italic">No service history yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {serviceHistory.map((service) => (
                <div
                  key={service.id}
                  className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm hover:border-white/10 transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-white">
                          {service.service}
                        </h3>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          Completed
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <svg
                          className="w-4 h-4 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>{formatDate(service.date)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-xl font-black text-white">
                        {service.price}
                      </div>
                      <div className="flex gap-2">
                        <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-red-600/30">
                          Book Again
                        </button>
                        <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-semibold transition-colors border border-white/5">
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
    </CustomerLayout>
  );
}

export default CustomerDashboard;