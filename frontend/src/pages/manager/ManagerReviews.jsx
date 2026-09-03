import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import ManagerLayout from "./ManagerLayout";
import { API_BASE } from "../../hooks/useAuth.js";
import { useTheme } from "../../context/ThemeContext.jsx";

const toast = (icon, title, isDark = true) =>
  Swal.fire({
    toast: true,
    position: "top-end",
    timer: 2200,
    timerProgressBar: true,
    showConfirmButton: false,
    icon,
    title,
    background: isDark ? "#111827" : "#ffffff",
    color: isDark ? "#f9fafb" : "#111827",
  });

function authHeaders() {
  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("access") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("access_token") ||
    sessionStorage.getItem("access") ||
    sessionStorage.getItem("token");

  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatDateTime(value) {
  if (!value) return "—";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StarRating({ score, isDark }) {
  const s = Math.max(0, Math.min(5, Number(score || 0)));
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex text-amber-400 text-sm tracking-tighter">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= s ? "text-amber-400" : isDark ? "text-gray-700" : "text-gray-300"}>
            ★
          </span>
        ))}
      </div>
      <span className={`text-xs font-black ${isDark ? "text-gray-200" : "text-gray-700"}`}>
        {s}.0
      </span>
    </div>
  );
}

export default function ManagerReviews() {
  const { isDark } = useTheme();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState(null);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeReplyModal, setActiveReplyModal] = useState(null);
  const [replySubject, setReplySubject] = useState("");
  const [replyMessage, setReplyMessage] = useState("");

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/manager/reviews/`, {
        headers: authHeaders(),
      });
      setReviews(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      setReviews([]);
      toast("error", error?.response?.data?.detail || "Failed to load reviews", isDark);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  // Summary Metrics
  const stats = useMemo(() => {
    const total = reviews.length;
    if (total === 0) return { total: 0, avg: 0, responded: 0, pending: 0, rate: 0 };
    const sum = reviews.reduce((acc, r) => acc + Number(r.score || 0), 0);
    const responded = reviews.filter((r) => r.response_status === "responded").length;
    const pending = total - responded;
    return {
      total,
      avg: (sum / total).toFixed(1),
      responded,
      pending,
      rate: Math.round((responded / total) * 100),
    };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reviews.filter((item) => {
      const scoreMatch =
        ratingFilter === "all" || Number(item.score) === Number(ratingFilter);
      if (!scoreMatch) return false;

      const statusMatch =
        statusFilter === "all" ||
        (statusFilter === "responded" && item.response_status === "responded") ||
        (statusFilter === "pending" && item.response_status !== "responded");
      if (!statusMatch) return false;

      if (!q) return true;
      return (
        String(item.customer_name || "").toLowerCase().includes(q) ||
        String(item.customer_email || "").toLowerCase().includes(q) ||
        String(item.service || "").toLowerCase().includes(q) ||
        String(item.comment || "").toLowerCase().includes(q)
      );
    });
  }, [reviews, search, ratingFilter, statusFilter]);

  const openReplyModal = (review) => {
    setActiveReplyModal(review);
    setReplySubject(`Thank you for your feedback at Otokwikk (${review.service || "Service"})`);
    setReplyMessage(
      `Dear ${review.customer_name || "Valued Customer"},\n\nThank you for sharing your review regarding your recent ${review.service || "service"} appointment. We truly appreciate your feedback and are dedicated to providing you with the best automotive care.\n\nWarm regards,\nBranch Management Team\nOtokwikk Auto Service Center`
    );
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!activeReplyModal || !replyMessage.trim()) return;

    setSendingId(activeReplyModal.id);
    try {
      await axios.post(
        `${API_BASE}/api/manager/reviews/${activeReplyModal.id}/reply/`,
        {
          subject: replySubject.trim() || "Response to your Otokwikk review",
          message: replyMessage.trim(),
        },
        { headers: authHeaders() }
      );
      setReviews((prev) =>
        prev.map((item) =>
          item.id === activeReplyModal.id
            ? {
                ...item,
                response_status: "responded",
                responded_at: new Date().toISOString(),
              }
            : item
        )
      );
      toast("success", "Reply email sent successfully!", isDark);
      setActiveReplyModal(null);
    } catch (error) {
      toast("error", error?.response?.data?.detail || "Failed to send reply", isDark);
    } finally {
      setSendingId(null);
    }
  };

  // Theme-aware inline classes
  const cardClass = isDark
    ? "bg-[#111116] border border-white/10 text-white shadow-xl"
    : "bg-white border border-gray-200 text-gray-900 shadow-sm";

  const inputClass = isDark
    ? "bg-[#16161f] border border-white/10 text-white placeholder-gray-500 focus:border-red-500"
    : "bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-red-500";

  const theadClass = isDark
    ? "bg-[#16161f] text-gray-400 border-b border-white/10"
    : "bg-gray-50 text-gray-600 border-b border-gray-200";

  const trHoverClass = isDark
    ? "hover:bg-white/[0.03] border-b border-white/5"
    : "hover:bg-gray-50/80 border-b border-gray-100";

  return (
    <ManagerLayout>
      <div className="space-y-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className={`text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
              <span>Customer</span>
              <span className="text-red-600">Reviews</span>
            </h1>
            <p className={`mt-1 text-xs sm:text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              Monitor branch satisfaction ratings, inspect customer feedback, and send official email responses.
            </p>
          </div>
          <button
            onClick={loadReviews}
            className={`self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm ${
              isDark
                ? "bg-[#16161f] border border-white/10 text-gray-300 hover:text-white hover:border-red-500/50"
                : "bg-white border border-gray-200 text-gray-700 hover:text-red-600 hover:border-red-500/30"
            }`}
          >
            <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className={`p-4 sm:p-5 rounded-2xl ${cardClass}`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Total Reviews</span>
              <span className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </span>
            </div>
            <div className={`text-2xl sm:text-3xl font-black mt-2 ${isDark ? "text-white" : "text-gray-900"}`}>{stats.total}</div>
            <p className="text-[10px] text-gray-400 mt-1">Verified branch feedback</p>
          </div>

          <div className={`p-4 sm:p-5 rounded-2xl ${cardClass}`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Avg Rating</span>
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </span>
            </div>
            <div className={`text-2xl sm:text-3xl font-black mt-2 flex items-baseline gap-1 ${isDark ? "text-white" : "text-gray-900"}`}>
              <span>{stats.avg}</span>
              <span className="text-sm font-normal text-gray-400">/ 5.0</span>
            </div>
            <p className="text-[10px] text-amber-500 mt-1 font-semibold">Satisfaction score</p>
          </div>

          <div className={`p-4 sm:p-5 rounded-2xl ${cardClass}`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Responded</span>
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-500 mt-2">{stats.responded}</div>
            <p className="text-[10px] text-gray-400 mt-1">{stats.rate}% response completion</p>
          </div>

          <div className={`p-4 sm:p-5 rounded-2xl ${cardClass}`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Pending Reply</span>
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-500 mt-2">{stats.pending}</div>
            <p className="text-[10px] text-gray-400 mt-1">Awaiting manager follow-up</p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className={`p-4 rounded-2xl ${cardClass} space-y-3`}>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by customer name, email, service, or keywords..."
                className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm focus:outline-none transition-colors ${inputClass}`}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-2">
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className={`rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:outline-none transition-colors ${inputClass}`}
              >
                <option value="all">⭐ All Ratings</option>
                <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                <option value="3">⭐⭐⭐ 3 Stars</option>
                <option value="2">⭐⭐ 2 Stars</option>
                <option value="1">⭐ 1 Star</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:outline-none transition-colors ${inputClass}`}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending Reply</option>
                <option value="responded">Responded</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reviews Table Container */}
        <div className={`rounded-2xl overflow-hidden ${cardClass}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`text-[11px] font-bold uppercase tracking-wider ${theadClass}`}>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Service</th>
                  <th className="px-5 py-3.5">Rating</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 min-w-[260px]">Customer Feedback</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-xs sm:text-sm">
                {filteredReviews.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <svg className="w-8 h-8 opacity-40 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p className="font-semibold text-sm">No reviews found</p>
                        <p className="text-xs text-gray-400">Try adjusting your search keywords or rating filter.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredReviews.map((review) => {
                    const isResponded = review.response_status === "responded";
                    const initial = (review.customer_name || "C").charAt(0).toUpperCase();

                    return (
                      <tr
                        key={review.id}
                        className={`transition-colors ${trHoverClass}`}
                      >
                        {/* Customer */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-sm"
                              style={{ backgroundColor: "#dc2626", backgroundImage: "linear-gradient(135deg, #dc2626, #991b1b)", color: "#ffffff" }}
                            >
                              {initial}
                            </div>
                            <div className="min-w-0">
                              <div className={`font-bold truncate ${isDark ? "text-white" : "text-gray-900"}`}>
                                {review.customer_name || "Valued Customer"}
                              </div>
                              <div className="text-[11px] text-gray-400 truncate">
                                {review.customer_email || "No email"}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Service */}
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            isDark ? "bg-[#16161f] text-gray-200 border border-white/10" : "bg-gray-100 text-gray-800 border border-gray-200"
                          }`}>
                            {review.service || "General Service"}
                          </span>
                        </td>

                        {/* Rating */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <StarRating score={review.score} isDark={isDark} />
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                              isResponded
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/25"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isResponded ? "bg-emerald-500" : "bg-amber-500"}`} />
                            {isResponded ? "Responded" : "Pending"}
                          </span>
                        </td>

                        {/* Comment */}
                        <td className="px-5 py-4">
                          <p className={`text-xs leading-relaxed max-w-[380px] break-words ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                            "{review.comment || "Customer did not leave any written comments."}"
                          </p>
                        </td>

                        {/* Date */}
                        <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-400">
                          {formatDateTime(review.created_at)}
                        </td>

                        {/* Action */}
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          {isResponded ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Replied
                            </span>
                          ) : (
                            <button
                              onClick={() => openReplyModal(review)}
                              disabled={!review.customer_email}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-md shadow-red-600/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              Reply via Email
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Custom Compose Reply Modal */}
        {activeReplyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col ${isDark ? "bg-[#111116] border border-white/10 text-white" : "bg-white border border-gray-200 text-gray-900"}`}>
              {/* Modal Header */}
              <div className={`px-6 py-4 flex items-center justify-between border-b ${isDark ? "bg-[#16161f] border-white/10" : "bg-gray-50 border-gray-200"}`}>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-red-600/15 text-red-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className={`text-base font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                      Reply to Review
                    </h3>
                    <p className="text-xs text-gray-400">
                      Sending email to <span className={`font-semibold ${isDark ? "text-gray-200" : "text-gray-700"}`}>{activeReplyModal.customer_name}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveReplyModal(null)}
                  className={`p-1.5 rounded-lg text-gray-400 hover:text-white transition-colors ${isDark ? "hover:bg-white/10" : "hover:bg-gray-100"}`}
                >
                  ✕
                </button>
              </div>

              {/* Review Reference Snippet */}
              <div className={`px-6 py-3 border-b text-xs flex items-center justify-between ${
                isDark ? "bg-amber-500/10 border-amber-500/20 text-amber-300" : "bg-amber-50 border-amber-200 text-amber-800"
              }`}>
                <span>Rating: <strong>{activeReplyModal.score} / 5 Stars</strong> ({activeReplyModal.service})</span>
                <span className="truncate max-w-[240px] italic">"{activeReplyModal.comment || "No comment"}"</span>
              </div>

              {/* Compose Form */}
              <form onSubmit={handleSendReply} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Recipient Email
                  </label>
                  <input
                    type="text"
                    disabled
                    value={activeReplyModal.customer_email || "No email available"}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs cursor-not-allowed ${
                      isDark ? "bg-[#16161f] border border-white/10 text-gray-400" : "bg-gray-100 border border-gray-200 text-gray-500"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={replySubject}
                    onChange={(e) => setReplySubject(e.target.value)}
                    placeholder="Enter email subject..."
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm focus:outline-none transition-colors ${inputClass}`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Message Body
                  </label>
                  <textarea
                    rows={6}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your official response..."
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm focus:outline-none resize-none transition-colors ${inputClass}`}
                    required
                  />
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveReplyModal(null)}
                    className={`flex-1 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-colors ${
                      isDark
                        ? "border border-white/10 bg-[#16161f] text-gray-300 hover:bg-white/10"
                        : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingId === activeReplyModal.id || !replyMessage.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-red-600/30 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {sendingId === activeReplyModal.id ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Sending Email...
                      </>
                    ) : (
                      "Send Response"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ManagerLayout>
  );
}
