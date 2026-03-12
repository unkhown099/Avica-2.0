import React, { useState } from "react";
import CustomerLayout from "./CustomerLayout";

const initialBookings = [
  {
    id: 1,
    service: "Exterior Detailing",
    date: "2026-02-05",
    time: "10:00 AM",
    status: "confirmed",
    price: "₱2,500",
    staff: "Marco R.",
  },
  {
    id: 2,
    service: "Interior Detailing",
    date: "2026-02-10",
    time: "2:00 PM",
    status: "pending",
    price: "₱3,000",
    staff: "Ana T.",
  },
  {
    id: 3,
    service: "Ceramic Coating",
    date: "2026-02-18",
    time: "9:00 AM",
    status: "confirmed",
    price: "₱15,000",
    staff: "Jake M.",
  },
  {
    id: 4,
    service: "Paint Correction",
    date: "2026-03-01",
    time: "11:00 AM",
    status: "pending",
    price: "₱6,500",
    staff: "Marco R.",
  },
];

const statusConfig = {
  confirmed: {
    label: "Confirmed",
    color: "bg-green-600/20 text-green-400 border-green-600/30",
  },
  pending: {
    label: "Pending",
    color: "bg-yellow-600/20 text-yellow-400 border-yellow-600/30",
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-600/20 text-red-400 border-red-600/30",
  },
};

function BookingsPage() {
  const [filter, setFilter] = useState("all");
  const [bookings, setBookings] = useState(initialBookings);

  const filtered =
    filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  const handleCancel = (id) =>
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)),
    );

  return (
    <CustomerLayout>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-950/30 p-4 sm:p-6 lg:p-8">
        {" "}
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">
              My <span className="text-red-600">Bookings</span>
            </h1>
            <p className="text-gray-400">
              Manage and track all your appointments.
            </p>
          </div>
          <button className="self-start sm:self-auto bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-xl shadow-red-600/30 flex items-center gap-2">
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Booking
          </button>
        </div>
        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total", value: bookings.length, color: "text-white" },
            {
              label: "Confirmed",
              value: bookings.filter((b) => b.status === "confirmed").length,
              color: "text-green-400",
            },
            {
              label: "Pending",
              value: bookings.filter((b) => b.status === "pending").length,
              color: "text-yellow-400",
            },
            {
              label: "Cancelled",
              value: bookings.filter((b) => b.status === "cancelled").length,
              color: "text-red-400",
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="bg-gradient-to-br from-gray-900 to-red-950/10 rounded-xl p-5 border border-white/5 text-center"
            >
              <div className={`text-3xl font-black ${color} mb-1`}>{value}</div>
              <div className="text-sm text-gray-500">{label}</div>
            </div>
          ))}
        </div>
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {["all", "confirmed", "pending", "cancelled"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-xl font-semibold text-sm capitalize transition-all ${
                filter === f
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                  : "bg-gray-900 text-gray-400 border border-white/10 hover:text-white hover:border-red-600/40"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        {/* Bookings List */}
        <div className="space-y-4">
          {filtered.map((booking) => {
            const sc = statusConfig[booking.status] || statusConfig.pending;
            return (
              <div
                key={booking.id}
                className="bg-gradient-to-br from-gray-900 to-red-950/10 rounded-2xl p-6 border border-white/5 hover:border-red-600/30 transition-all duration-300"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <h3 className="text-xl font-black text-white">
                        {booking.service}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${sc.color}`}
                      >
                        {sc.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-5 text-gray-400 text-sm">
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
                        {booking.date}
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
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {booking.time}
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
                        {booking.staff}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="text-2xl font-black text-white">
                      {booking.price}
                    </div>
                    {booking.status !== "cancelled" && (
                      <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-sm font-semibold transition-colors">
                          Reschedule
                        </button>
                        <button
                          onClick={() => handleCancel(booking.id)}
                          className="px-4 py-2 bg-red-600/20 hover:bg-red-600 border border-red-600/40 text-red-400 hover:text-white rounded-xl text-sm font-semibold transition-all duration-200"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-lg font-semibold">No bookings found</p>
            </div>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
}

export default BookingsPage;
