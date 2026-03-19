import React, { useState, useEffect, useCallback } from "react";
import StaffLayout from "./StaffLayout";

// ── Auth helper ───────────────────────────────────────────────────────────────
const getToken = () =>
  localStorage.getItem("access_token") ??
  sessionStorage.getItem("access_token");

const authHeaders = () => ({
  "Content-Type": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

const API = import.meta.env.VITE_API_BASE_URL;
const fmt = (n) =>
  Number(n ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2 });

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border text-sm font-semibold
      ${
        type === "success"
          ? "bg-emerald-900/90 border-emerald-500/40 text-emerald-300"
          : "bg-red-900/90 border-red-500/40 text-red-300"
      }`}
    >
      {type === "success" ? (
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
            d="M5 13l4 4L19 7"
          />
        </svg>
      ) : (
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
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      )}
      {message}
    </div>
  );
}

// ── Skeleton rows ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-white/5 animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-gray-800 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-36 bg-gray-800 rounded" />
        <div className="h-3 w-24 bg-gray-800 rounded" />
      </div>
      <div className="h-4 w-20 bg-gray-800 rounded" />
      <div className="h-8 w-24 bg-gray-800 rounded-xl" />
    </div>
  );
}

// ── Receipt Modal ─────────────────────────────────────────────────────────────
function ReceiptModal({ entry, paymentMethod, onClose }) {
  const booking = entry.booking_detail ?? {};
  const price = parseFloat(booking.price ?? 0);
  const tax = price * 0.12;
  const total = price + tax;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="bg-emerald-600/20 border-b border-emerald-500/20 px-6 py-5 rounded-t-2xl text-center">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-6 h-6 text-emerald-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-lg font-black text-white">Payment Successful</h2>
          <p className="text-emerald-400 text-sm mt-1">
            ₱{fmt(total)} collected
          </p>
        </div>

        <div className="px-6 py-5 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Customer</span>
            <span className="text-white font-semibold">
              {entry.customer_name}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Service</span>
            <span className="text-white font-semibold">{entry.service}</span>
          </div>
          {entry.vehicle && (
            <div className="flex justify-between">
              <span className="text-gray-500">Vehicle</span>
              <span className="text-white font-semibold">{entry.vehicle}</span>
            </div>
          )}
          {entry.plate_number && (
            <div className="flex justify-between">
              <span className="text-gray-500">Plate No.</span>
              <span className="text-white font-semibold">
                {entry.plate_number}
              </span>
            </div>
          )}
          {entry.assigned_employee_name && (
            <div className="flex justify-between">
              <span className="text-gray-500">Mechanic</span>
              <span className="text-white font-semibold">
                {entry.assigned_employee_name}
              </span>
            </div>
          )}

          <div className="border-t border-white/5 pt-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-300">₱{fmt(price)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">VAT (12%)</span>
              <span className="text-gray-300">₱{fmt(tax)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-white/5">
              <span className="text-white font-black">Total</span>
              <span className="text-emerald-400 font-black text-base">
                ₱{fmt(total)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment</span>
              <span className="text-white font-semibold uppercase">
                {paymentMethod}
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Payment Drawer ────────────────────────────────────────────────────────────
function PaymentDrawer({ entry, onClose, onPaid }) {
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountGiven, setAmountGiven] = useState("");
  const [processing, setProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  const booking = entry.booking_detail ?? {};
  const price = parseFloat(booking.price ?? 0);
  const tax = price * 0.12;
  const total = price + tax;
  const change = parseFloat(amountGiven || 0) - total;

  const handlePay = async () => {
    if (paymentMethod === "cash" && parseFloat(amountGiven || 0) < total)
      return;

    setProcessing(true);
    try {
      // entry.booking is the FK id to Booking (OneToOne from QueueEntry)
      const bookingId = entry.booking ?? booking.id;

      const res = await fetch(`${API}/bookings/${bookingId}/mark-paid/`, {
        method: "PATCH",
        headers: authHeaders(),
        credentials: "include",
        body: JSON.stringify({
          payment_status: "paid",
          payment_method: paymentMethod,
          amount_given:
            paymentMethod === "cash" ? parseFloat(amountGiven) : total,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `Server error ${res.status}`);
      }

      setShowReceipt(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReceiptClose = () => {
    setShowReceipt(false);
    onPaid(entry.id);
    onClose();
  };

  if (showReceipt) {
    return (
      <ReceiptModal
        entry={entry}
        paymentMethod={paymentMethod}
        onClose={handleReceiptClose}
      />
    );
  }

  const presets = [500, 1000, 2000, 5000].filter((p) => p >= total);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <div>
            <h2 className="text-lg font-black text-white">Collect Payment</h2>
            <p className="text-gray-500 text-sm mt-0.5">
              {entry.customer_name} · {entry.service}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
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

        <div className="px-6 py-5 space-y-5">
          {/* Amount due */}
          <div className="bg-gray-800/60 border border-white/5 rounded-xl p-4 text-center">
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
              Amount Due
            </p>
            <p className="text-3xl font-black text-red-400">₱{fmt(total)}</p>
            <p className="text-gray-600 text-xs mt-1">
              Subtotal ₱{fmt(price)} + VAT ₱{fmt(tax)}
            </p>
          </div>

          {/* Service summary */}
          <div className="bg-gray-800/40 border border-white/5 rounded-xl px-4 py-3 text-sm space-y-1.5">
            {entry.vehicle && (
              <div className="flex justify-between">
                <span className="text-gray-500">Vehicle</span>
                <span className="text-gray-300">
                  {entry.vehicle}{" "}
                  {entry.plate_number && `· ${entry.plate_number}`}
                </span>
              </div>
            )}
            {entry.assigned_employee_name && (
              <div className="flex justify-between">
                <span className="text-gray-500">Mechanic</span>
                <span className="text-gray-300">
                  {entry.assigned_employee_name}
                </span>
              </div>
            )}
            {entry.completed_at && (
              <div className="flex justify-between">
                <span className="text-gray-500">Completed</span>
                <span className="text-gray-300">
                  {new Date(entry.completed_at).toLocaleTimeString("en-PH", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Payment method */}
          <div>
            <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
              Payment Method
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "cash", label: "Cash", icon: "💵" },
                { key: "gcash", label: "GCash", icon: "📱" },
                { key: "card", label: "Card", icon: "💳" },
              ].map((m) => (
                <button
                  key={m.key}
                  onClick={() => setPaymentMethod(m.key)}
                  className={`py-3 rounded-xl text-sm font-black transition-all border flex flex-col items-center gap-1 ${
                    paymentMethod === m.key
                      ? "bg-red-600/20 border-red-500/50 text-red-400"
                      : "bg-gray-800/60 border-white/5 text-gray-500 hover:text-gray-300 hover:border-white/10"
                  }`}
                >
                  <span>{m.icon}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cash amount input */}
          {paymentMethod === "cash" && (
            <div>
              <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
                Amount Given
              </p>
              <input
                type="number"
                placeholder="0.00"
                value={amountGiven}
                onChange={(e) => setAmountGiven(e.target.value)}
                className="w-full bg-gray-800/60 border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all"
              />
              {/* Quick amount presets */}
              <div className="flex gap-2 mt-2">
                {presets.slice(0, 3).map((p) => (
                  <button
                    key={p}
                    onClick={() => setAmountGiven(String(p))}
                    className="flex-1 py-1.5 text-xs font-bold bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-400 hover:text-white rounded-lg transition-all"
                  >
                    ₱{p.toLocaleString()}
                  </button>
                ))}
                <button
                  onClick={() => setAmountGiven(fmt(total).replace(/,/g, ""))}
                  className="flex-1 py-1.5 text-xs font-bold bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-400 hover:text-white rounded-lg transition-all"
                >
                  Exact
                </button>
              </div>

              {/* Change display */}
              {amountGiven && (
                <div
                  className={`mt-3 flex justify-between text-sm font-bold px-4 py-3 rounded-xl border ${
                    change >= 0
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : "bg-red-500/10 border-red-500/20 text-red-400"
                  }`}
                >
                  <span>{change >= 0 ? "Change" : "Insufficient"}</span>
                  <span>
                    {change >= 0
                      ? `₱${fmt(change)}`
                      : `₱${fmt(Math.abs(change))} short`}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={handlePay}
            disabled={
              processing ||
              (paymentMethod === "cash" && parseFloat(amountGiven || 0) < total)
            }
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2"
          >
            {processing ? (
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
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Processing…
              </>
            ) : (
              <>
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Confirm Payment · ₱{fmt(total)}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main POS Component ────────────────────────────────────────────────────────
function StaffPOS() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => setToast({ message, type });

  // ── Fetch QueueEntries: status=done, booking payment_status=unpaid ──────────
  const fetchUnpaid = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `${API}/queue/?status=done&payment_status=unpaid`,
        {
          headers: authHeaders(),
          credentials: "include",
        },
      );
      if (!res.ok) throw new Error(`Failed to load queue (${res.status})`);
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : (data.results ?? []));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnpaid();
    // Auto-refresh every 30 s so newly completed jobs appear without manual refresh
    const interval = setInterval(fetchUnpaid, 30_000);
    return () => clearInterval(interval);
  }, [fetchUnpaid]);

  const handlePaid = (queueEntryId) => {
    setEntries((prev) => prev.filter((e) => e.id !== queueEntryId));
    showToast("Payment recorded successfully!", "success");
  };

  const filtered = entries.filter((e) =>
    [e.customer_name, e.service, e.vehicle, e.plate_number]
      .join(" ")
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

  const totalCollectible = entries.reduce((sum, e) => {
    const price = parseFloat(e.booking_detail?.price ?? 0);
    return sum + price + price * 0.12;
  }, 0);

  return (
    <StaffLayout title="" subtitle="">
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Point of Sale
            </h1>
            <p className="text-gray-400 mt-1">
              Completed services awaiting payment
            </p>
          </div>
          <button
            onClick={fetchUnpaid}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-800 border border-white/10 text-gray-300 hover:text-white hover:bg-gray-700 transition-all text-sm font-semibold self-start sm:self-auto"
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            {
              label: "Awaiting Payment",
              value: loading ? "—" : String(entries.length),
              icon: (
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ),
              accent: "text-amber-400",
              bg: "bg-amber-500/10",
              border: "border-amber-500/20",
            },
            {
              label: "Total Collectible",
              value: loading ? "—" : `₱${fmt(totalCollectible)}`,
              icon: (
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
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ),
              accent: "text-red-400",
              bg: "bg-red-500/10",
              border: "border-red-500/20",
            },
            {
              label: "Auto-refreshes",
              value: "Every 30s",
              icon: (
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              ),
              accent: "text-blue-400",
              bg: "bg-blue-500/10",
              border: "border-blue-500/20",
            },
          ].map((card) => (
            <div
              key={card.label}
              className={`bg-gray-900/60 border ${card.border} rounded-2xl p-5 backdrop-blur-sm flex items-center gap-4`}
            >
              <div
                className={`${card.bg} ${card.accent} p-3 rounded-xl shrink-0`}
              >
                {card.icon}
              </div>
              <div>
                <div className={`text-xl font-black ${card.accent}`}>
                  {card.value}
                </div>
                <div className="text-sm text-gray-500">{card.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-5 py-4 text-sm">
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
            {error}
            <button
              onClick={fetchUnpaid}
              className="ml-auto underline text-xs font-bold hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Unpaid list */}
        <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
          {/* Search */}
          <div className="p-4 border-b border-white/5">
            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search by customer, service, vehicle, plate…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800/60 border border-white/10 text-white placeholder-gray-500 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all"
              />
            </div>
          </div>

          {/* Table header */}
          <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/5">
            <div className="col-span-4">Customer</div>
            <div className="col-span-3">Service</div>
            <div className="col-span-2">Amount Due</div>
            <div className="col-span-2">Mechanic</div>
            <div className="col-span-1 text-right">Action</div>
          </div>

          {/* Rows */}
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
          ) : filtered.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-4 text-center px-6">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-emerald-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-white font-black text-lg">All clear!</p>
                <p className="text-gray-500 text-sm mt-1">
                  {searchQuery
                    ? "No results match your search."
                    : "No unpaid completed services right now."}
                </p>
              </div>
            </div>
          ) : (
            filtered.map((entry) => {
              const booking = entry.booking_detail ?? {};
              const price = parseFloat(booking.price ?? 0);
              const total = price + price * 0.12;

              return (
                <div
                  key={entry.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 px-5 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center"
                >
                  {/* Customer */}
                  <div className="sm:col-span-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-sm font-black shrink-0">
                      {(entry.customer_name ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-white font-semibold text-sm truncate">
                        {entry.customer_name}
                      </div>
                      <div className="text-gray-600 text-xs flex gap-2 flex-wrap mt-0.5">
                        {entry.vehicle && <span>{entry.vehicle}</span>}
                        {entry.plate_number && (
                          <span>· {entry.plate_number}</span>
                        )}
                        {entry.phone && <span>· {entry.phone}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Service */}
                  <div className="sm:col-span-3">
                    <div className="text-gray-300 text-sm font-semibold">
                      {entry.service}
                    </div>
                    {entry.completed_at && (
                      <div className="text-gray-600 text-xs mt-0.5">
                        Done{" "}
                        {new Date(entry.completed_at).toLocaleTimeString(
                          "en-PH",
                          { hour: "2-digit", minute: "2-digit" },
                        )}
                      </div>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="sm:col-span-2">
                    <div className="text-white font-black text-sm">
                      ₱{fmt(total)}
                    </div>
                    <div className="text-gray-600 text-xs">incl. VAT</div>
                  </div>

                  {/* Mechanic */}
                  <div className="sm:col-span-2">
                    <div className="text-gray-400 text-sm">
                      {entry.assigned_employee_name ?? "—"}
                    </div>
                  </div>

                  {/* Pay button */}
                  <div className="sm:col-span-1 flex sm:justify-end">
                    <button
                      onClick={() => setSelectedEntry(entry)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-400 hover:text-emerald-300 rounded-xl text-xs font-black transition-all"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"
                        />
                      </svg>
                      Pay
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {!loading && filtered.length > 0 && (
            <div className="px-5 py-4">
              <p className="text-gray-600 text-sm">
                Showing{" "}
                <span className="text-white font-semibold">
                  {filtered.length}
                </span>{" "}
                unpaid {filtered.length === 1 ? "entry" : "entries"}
              </p>
            </div>
          )}
        </div>
      </div>

      {selectedEntry && (
        <PaymentDrawer
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onPaid={handlePaid}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </StaffLayout>
  );
}

export default StaffPOS;