import React, { useState } from "react";
import CustomerLayout from "./CustomerLayout";

const history = [
  {
    id: 1,
    service: "Full Detailing",
    date: "2026-01-15",
    price: "₱5,000",
    staff: "Marco R.",
    rating: 5,
    review: "Amazing job! Car looks brand new.",
  },
  {
    id: 2,
    service: "Paint Protection Film",
    date: "2025-12-20",
    price: "₱25,000",
    staff: "Jake M.",
    rating: 5,
    review: null,
  },
  {
    id: 3,
    service: "Interior Deep Extraction",
    date: "2025-11-08",
    price: "₱3,500",
    staff: "Ana T.",
    rating: 4,
    review: "Great service, very thorough.",
  },
  {
    id: 4,
    service: "Exterior Detailing",
    date: "2025-10-02",
    price: "₱2,500",
    staff: "Marco R.",
    rating: 5,
    review: null,
  },
  {
    id: 5,
    service: "Paint Correction",
    date: "2025-08-19",
    price: "₱6,500",
    staff: "Jake M.",
    rating: 4,
    review: "Scratches are mostly gone, happy with result.",
  },
];

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

function HistoryPage() {
  const [reviewModal, setReviewModal] = useState(null);
  const [newRating, setNewRating] = useState(5);
  const [newReview, setNewReview] = useState("");

  const totalSpent = history.reduce((acc, h) => {
    const num = parseInt(h.price.replace(/[^0-9]/g, ""), 10);
    return acc + (isNaN(num) ? 0 : num);
  }, 0);

  return (
    <CustomerLayout>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-950/30 p-4 sm:p-6 lg:p-8">
        {" "}
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">
            Service <span className="text-red-600">History</span>
          </h1>
          <p className="text-gray-400">Your complete detailing track record.</p>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-gray-900 to-red-950/10 rounded-xl p-5 border border-white/5 text-center">
            <div className="text-3xl font-black text-white mb-1">
              {history.length}
            </div>
            <div className="text-sm text-gray-500">Total Services</div>
          </div>
          <div className="bg-gradient-to-br from-gray-900 to-red-950/10 rounded-xl p-5 border border-white/5 text-center">
            <div className="text-3xl font-black text-red-500 mb-1">
              ₱{totalSpent.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Total Spent</div>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-gray-900 to-red-950/10 rounded-xl p-5 border border-white/5 text-center">
            <div className="text-3xl font-black text-yellow-400 mb-1">
              {(
                history.reduce((a, h) => a + h.rating, 0) / history.length
              ).toFixed(1)}
            </div>
            <div className="text-sm text-gray-500">Avg Rating Given</div>
          </div>
        </div>
        {/* History List */}
        <div className="space-y-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="bg-gradient-to-br from-gray-900 to-red-950/10 rounded-2xl p-6 border border-white/5 hover:border-red-600/20 transition-all duration-300"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-xl font-black text-white">
                      {item.service}
                    </h3>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-600/20 text-green-400 border border-green-600/30">
                      Completed
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-5 text-gray-400 text-sm mb-3">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-red-600"
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
                      {item.date}
                    </div>
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      {item.staff}
                    </div>
                  </div>
                  <StarRating rating={item.rating} />
                  {item.review && (
                    <p className="text-sm text-gray-500 italic mt-2">
                      "{item.review}"
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="text-2xl font-black text-white">
                    {item.price}
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-all hover:scale-105 shadow-lg shadow-red-600/20">
                      Book Again
                    </button>
                    {!item.review && (
                      <button
                        onClick={() => {
                          setReviewModal(item.id);
                          setNewRating(5);
                          setNewReview("");
                        }}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-sm font-semibold transition-colors"
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
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-8 border border-white/10 max-w-md w-full">
            <h2 className="text-2xl font-black text-white mb-6">
              Leave a Review
            </h2>
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setNewRating(s)}>
                  <svg
                    className={`w-8 h-8 transition-colors ${s <= newRating ? "text-yellow-400" : "text-gray-600 hover:text-yellow-400/50"}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
            <textarea
              value={newReview}
              onChange={(e) => setNewReview(e.target.value)}
              placeholder="Share your experience…"
              rows={4}
              className="w-full bg-black border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition-colors resize-none mb-6"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setReviewModal(null)}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setReviewModal(null)}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all hover:scale-[1.02] shadow-lg shadow-red-600/30"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </CustomerLayout>
  );
}

export default HistoryPage;
