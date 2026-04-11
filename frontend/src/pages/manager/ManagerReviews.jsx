import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import ManagerLayout from "./ManagerLayout";
import { API_BASE } from "../../hooks/useAuth.js";

const toast = (icon, title) =>
  Swal.fire({
    toast: true,
    position: "top-end",
    timer: 2200,
    timerProgressBar: true,
    showConfirmButton: false,
    icon,
    title,
    background: "#111827",
    color: "#f9fafb",
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

function renderStars(score) {
  const s = Number(score || 0);
  return "★".repeat(Math.max(0, Math.min(5, s)));
}

export default function ManagerReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState(null);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/manager/reviews/`, {
        headers: authHeaders(),
      });
      setReviews(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      setReviews([]);
      toast("error", error?.response?.data?.detail || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const filteredReviews = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reviews.filter((item) => {
      const scoreMatch =
        ratingFilter === "all" || Number(item.score) === Number(ratingFilter);
      if (!scoreMatch) return false;
      if (!q) return true;
      return (
        String(item.customer_name || "").toLowerCase().includes(q) ||
        String(item.customer_email || "").toLowerCase().includes(q) ||
        String(item.service || "").toLowerCase().includes(q) ||
        String(item.comment || "").toLowerCase().includes(q)
      );
    });
  }, [reviews, search, ratingFilter]);

  const handleReply = async (review) => {
    const result = await Swal.fire({
      title: `Reply to ${review.customer_name || "Customer"}`,
      html: `
        <div style="text-align:left; border:1px solid #374151; border-radius:12px; overflow:hidden; background:#0f172a;">
          <div style="padding:10px 14px; border-bottom:1px solid #374151; background:#111827; color:#9ca3af; font-size:12px;">Compose Email</div>
          <div style="padding:12px 14px; border-bottom:1px solid #374151; color:#e5e7eb; font-size:13px;">
            <div style="margin-bottom:6px;"><strong>To:</strong> ${review.customer_email || "No email"}</div>
            <div><strong>From:</strong> Otokwikk Branch Manager</div>
          </div>
          <div style="padding:12px 14px; border-bottom:1px solid #374151;">
            <label style="display:block; color:#9ca3af; font-size:12px; margin-bottom:6px;">Subject</label>
            <input id="review-reply-subject" class="swal2-input" style="margin:0; width:100%;" placeholder="Subject" value="Response to your Otokwikk review" />
          </div>
          <div style="padding:12px 14px;">
            <label style="display:block; color:#9ca3af; font-size:12px; margin-bottom:6px;">Message</label>
            <textarea id="review-reply-message" class="swal2-textarea" style="margin:0; width:100%; min-height:180px;" placeholder="Type your message..."></textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Send Email",
      cancelButtonText: "Cancel",
      focusConfirm: false,
      background: "#111827",
      color: "#f9fafb",
      preConfirm: () => {
        const subject = document
          .getElementById("review-reply-subject")
          ?.value?.trim();
        const message = document
          .getElementById("review-reply-message")
          ?.value?.trim();
        if (!message) {
          Swal.showValidationMessage("Reply message is required.");
          return null;
        }
        return { subject, message };
      },
    });

    if (!result.isConfirmed || !result.value) return;

    setSendingId(review.id);
    try {
      await axios.post(
        `${API_BASE}/api/manager/reviews/${review.id}/reply/`,
        result.value,
        { headers: authHeaders() },
      );
      setReviews((prev) =>
        prev.map((item) =>
          item.id === review.id
            ? {
                ...item,
                response_status: "responded",
                responded_at: new Date().toISOString(),
              }
            : item,
        ),
      );
      toast("success", "Reply email sent");
    } catch (error) {
      toast("error", error?.response?.data?.detail || "Failed to send reply");
    } finally {
      setSendingId(null);
    }
  };

  if (loading) {
    return (
      <ManagerLayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </ManagerLayout>
    );
  }

  return (
    <ManagerLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-4 sm:-m-8 p-4 sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Customer Reviews
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            View branch reviews and respond to customers via email.
          </p>
        </div>

        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, service, comment..."
            className="md:col-span-2 bg-gray-900/80 border border-gray-700 rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/40"
          />
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="bg-gray-900/80 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500/40"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>

        <div className="bg-gray-900/70 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="bg-gray-900/90">
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wide">
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Comment</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                      No reviews found.
                    </td>
                  </tr>
                ) : (
                  filteredReviews.map((review) => (
                    <tr key={review.id} className="border-t border-gray-800/70 align-top">
                      <td className="px-4 py-3">
                        <div className="text-white font-semibold">
                          {review.customer_name || "Customer"}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {review.customer_email || "No email"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-200">{review.service || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="text-amber-300 font-semibold">
                          {renderStars(review.score)}{" "}
                        </span>
                        <span className="text-gray-300">({review.score}/5)</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                            review.response_status === "responded"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          {review.response_status === "responded" ? "Responded" : "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-200 max-w-[420px] whitespace-pre-wrap break-words">
                        {review.comment || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-sm">
                        {formatDateTime(
                          review.response_status === "responded"
                            ? review.responded_at || review.created_at
                            : review.created_at,
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleReply(review)}
                          disabled={
                            sendingId === review.id ||
                            !review.customer_email ||
                            review.response_status === "responded"
                          }
                          className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                            sendingId === review.id ||
                            !review.customer_email ||
                            review.response_status === "responded"
                              ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                              : "bg-red-600 hover:bg-red-700 text-white"
                          }`}
                        >
                          {review.response_status === "responded"
                            ? "Already Responded"
                            : sendingId === review.id
                              ? "Sending..."
                              : "Respond via Email"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ManagerLayout>
  );
}
