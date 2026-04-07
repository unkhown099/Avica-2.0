import React, { useState, useEffect } from "react";
import CustomerLayout from "./CustomerLayout";
import { API_BASE } from "../../hooks/useAuth.js";

// ─── Utilities ────────────────────────────────────────────────────────────────

function authHeaders() {
  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("access") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("access_token") ||
    sessionStorage.getItem("access") ||
    sessionStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString(
    "en-PH",
    { year: "numeric", month: "short", day: "numeric" },
  );
}

// ─── Star Rating (display) ────────────────────────────────────────────────────

function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          className={`w-4 h-4 ${s <= rating ? "text-yellow-400" : "text-gray-700"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// ─── Star Rating (interactive) ────────────────────────────────────────────────

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
        >
          <svg
            className={`w-8 h-8 transition-colors ${s <= (hovered || value)
                ? "text-yellow-400"
                : "text-gray-600 hover:text-yellow-400/50"
              }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

// ─── Review Modal ─────────────────────────────────────────────────────────────

function ReviewModal({ item, onClose, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!item.booking_id && !item.queue_id) {
      setError("This service is not eligible for review.");
      return;
    }
    if (!rating) {
      setError("Please select a rating.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${API_BASE}/api/ratings/`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            ...(item.booking_id ? { booking_id: item.booking_id } : {}),
            ...(item.queue_id ? { queue_id: item.queue_id } : {}),
            score: rating,
            comment: review,
          }),
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || "Failed to submit review.");
      }
      onSubmitted(item.id, rating, review);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl p-8 border border-white/10 max-w-md w-full">
        <h2 className="text-2xl font-black text-white mb-1">Leave a Review</h2>
        <p className="text-gray-500 text-sm mb-6">{item.service}</p>

        <div className="mb-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
            Your Rating
          </p>
          <StarPicker value={rating} onChange={setRating} />
        </div>

        <div className="mb-6">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
            Your Review{" "}
            <span className="text-gray-600 font-normal normal-case">
              (optional)
            </span>
          </p>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Share your experience…"
            rows={4}
            className="w-full bg-black border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition-colors resize-none"
          />
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 bg-red-600/10 border border-red-600/25 rounded-xl px-4 py-3 text-red-400 text-sm">
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all hover:scale-[1.02] shadow-lg shadow-red-600/30 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
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
                Submitting…
              </>
            ) : (
              "Submit Review"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({
    total_services: 0,
    total_spent: 0,
    avg_rating: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewItem, setReviewItem] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/customer/history/`, {
      headers: authHeaders(),
    })
      .then((r) => {
        if (!r.ok)
          throw new Error(`Error ${r.status}: Failed to load history.`);
        return r.json();
      })
      .then((data) => {
        setHistory(data.history || []);
        setStats({
          total_services: data.total_services || 0,
          total_spent: data.total_spent || 0,
          avg_rating: data.avg_rating,
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleReviewSubmitted = (queueId, rating, review) => {
    setHistory((prev) =>
      prev.map((h) => (h.id === queueId ? { ...h, rating, review } : h)),
    );
  };

  return (
    <CustomerLayout>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-950/30 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">
            Service <span className="text-red-600">History</span>
          </h1>
          <p className="text-gray-400">Your completed and paid services.</p>
        </div>

        {/* Stats */}
        {!loading && !error && (
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
            <div className="bg-gradient-to-br from-gray-900 to-red-950/10 rounded-xl p-3 sm:p-5 border border-white/5 text-center">
              <div className="text-2xl sm:text-3xl font-black text-white mb-1">
                {stats.total_services}
              </div>
              <div className="text-xs sm:text-sm text-gray-500">Total Services</div>
            </div>
            <div className="bg-gradient-to-br from-gray-900 to-red-950/10 rounded-xl p-3 sm:p-5 border border-white/5 text-center overflow-hidden">
              <div className="text-lg sm:text-3xl font-black text-red-500 mb-1 truncate">
                ₱{stats.total_spent.toLocaleString("en-PH")}
              </div>
              <div className="text-xs sm:text-sm text-gray-500">Total Spent</div>
            </div>
            <div className="bg-gradient-to-br from-gray-900 to-red-950/10 rounded-xl p-3 sm:p-5 border border-white/5 text-center">
              {stats.avg_rating !== null ? (
                <>
                  <div className="text-2xl sm:text-3xl font-black text-yellow-400 mb-1">
                    {stats.avg_rating}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500">Avg Rating Given</div>
                </>
              ) : (
                <>
                  <div className="text-2xl sm:text-3xl font-black text-gray-600 mb-1">
                    —
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500">No Ratings Yet</div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24 text-gray-500">
            <svg
              className="w-6 h-6 animate-spin mr-3"
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
            Loading your history…
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex items-center gap-3 bg-red-600/10 border border-red-600/25 rounded-2xl px-6 py-5 text-red-400 mb-6">
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && history.length === 0 && (
          <div className="text-center py-24 text-gray-500">
            <svg
              className="w-16 h-16 mx-auto mb-4 opacity-20"
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
            <p className="text-lg font-semibold">No completed services yet</p>
            <p className="text-sm text-gray-600 mt-1">
              Services will appear here once done and paid.
            </p>
          </div>
        )}

        {/* History List */}
        {!loading && !error && history.length > 0 && (
          <div className="space-y-4">
            {history.map((item) => (
              <div
                key={item.id}
                className="bg-gradient-to-br from-gray-900 to-red-950/10 rounded-2xl p-4 sm:p-6 border border-white/5 hover:border-red-600/20 transition-all duration-300"
              >
                {/* On mobile: stack vertically. On lg+: side-by-side like original */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-5">
                  <div className="flex-1">
                    {/* Service name + badges */}
                    <div className="flex items-start justify-between gap-3 mb-2 lg:block">
                      <div>
                        <h3 className="text-xl font-black text-white">
                          {item.service}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-600/20 text-blue-400 border border-blue-600/30">
                            Completed
                          </span>
                          {item.payment_method && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-600/20 text-green-400 border border-green-600/30">
                              Paid · {item.payment_method}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Price shown top-right on mobile only */}
                      <div className="text-2xl font-black text-white whitespace-nowrap lg:hidden">
                        ₱{Number(item.price).toLocaleString("en-PH")}
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-gray-400 text-sm mb-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(item.date)}
                      </div>
                      {item.staff && item.staff !== "—" && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {item.staff}
                        </div>
                      )}
                      {item.branch && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {item.branch}
                        </div>
                      )}
                      {item.vehicle && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l1.5 1h7l1.5-1zM8 6h5l3 5H8V6z" />
                          </svg>
                          {item.vehicle}
                          {item.plate_number ? ` · ${item.plate_number}` : ""}
                        </div>
                      )}
                    </div>

                    {/* Rating */}
                    {item.rating ? (
                      <div>
                        <StarRating rating={item.rating} />
                        {item.review && (
                          <p className="text-sm text-gray-500 italic mt-2">
                            "{item.review}"
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-600 italic">
                        No review yet
                      </p>
                    )}
                  </div>

                  {/* Price + buttons: side by side on lg, buttons full-width on mobile */}
                  <div className="flex items-center justify-between lg:justify-end gap-4 lg:flex-col lg:items-end">
                    {/* Price hidden on mobile (shown above), visible on lg */}
                    <div className="hidden lg:block text-2xl font-black text-white">
                      ₱{Number(item.price).toLocaleString("en-PH")}
                    </div>
                    <div className="flex gap-2 w-full lg:w-auto">
                      <button className="flex-1 lg:flex-none px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-all hover:scale-105 shadow-lg shadow-red-600/20">
                        Book Again
                      </button>
                      {!item.rating && (item.booking_id || item.queue_id) && (
                        <button
                          onClick={() => setReviewItem(item)}
                          className="flex-1 lg:flex-none px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-sm font-semibold transition-colors"
                        >
                          Leave Review
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {reviewItem && (
        <ReviewModal
          item={reviewItem}
          onClose={() => setReviewItem(null)}
          onSubmitted={handleReviewSubmitted}
        />
      )}
    </CustomerLayout>
  );
}

export default HistoryPage;
