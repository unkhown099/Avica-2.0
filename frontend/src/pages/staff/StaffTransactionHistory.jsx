import React, { useCallback, useEffect, useMemo, useState } from "react";
import StaffLayout from "./StaffLayout";
import { API_BASE } from "../../hooks/useAuth.js";
import { useTheme } from "../../context/ThemeContext.jsx";

const getHeaders = () => {
  const token =
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token") ||
    localStorage.getItem("access") ||
    sessionStorage.getItem("access") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const TYPE_LABELS = {
  appointment: "Appointment",
  walk_in: "Walk-in",
  service: "Service",
  product: "Product",
};

function TransactionDetailModal({ transaction, onClose }) {
  const { isDark = true } = useTheme?.() || {};
  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`rounded-2xl border w-full max-w-lg shadow-2xl overflow-hidden ${
          isDark ? "bg-gray-900 border-white/10 text-white" : "bg-white border-gray-200 text-gray-900 shadow-xl"
        }`}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isDark ? "border-white/10 bg-gray-900/90" : "border-gray-100 bg-gray-50/90"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600/15 border border-red-500/30 flex items-center justify-center text-red-500 font-black">
              #
            </div>
            <div>
              <h3 className="font-black text-base uppercase tracking-wider">Transaction Details</h3>
              <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                ID #{transaction.id} · {formatDate(transaction.paid_at || transaction.created_at)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              isDark ? "text-gray-400 hover:text-white hover:bg-white/10" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Status & Amount Highlight */}
          <div
            className={`rounded-2xl p-4 border flex items-center justify-between ${
              isDark ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-200"
            }`}
          >
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
                Amount Paid
              </span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                ₱{formatMoney(transaction.amount)}
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                Paid
              </span>
              <p className={`text-xs mt-1 uppercase font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                {transaction.payment_method || "Cash"}
              </p>
            </div>
          </div>

          {/* Customer & Vehicle Info */}
          {(transaction.customer_name || transaction.vehicle || transaction.plate_number) && (
            <div>
              <h4 className={`text-xs font-black uppercase tracking-wider mb-2.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                Customer & Vehicle
              </h4>
              <div className={`rounded-xl border divide-y overflow-hidden text-sm ${isDark ? "border-white/5 divide-white/5 bg-white/2" : "border-gray-100 divide-gray-100 bg-gray-50"}`}>
                {transaction.customer_name && (
                  <div className="flex justify-between px-4 py-2.5">
                    <span className={isDark ? "text-gray-400" : "text-gray-500"}>Customer</span>
                    <span className="font-semibold">{transaction.customer_name}</span>
                  </div>
                )}
                {transaction.phone && (
                  <div className="flex justify-between px-4 py-2.5">
                    <span className={isDark ? "text-gray-400" : "text-gray-500"}>Contact</span>
                    <span className="font-semibold">{transaction.phone}</span>
                  </div>
                )}
                {transaction.vehicle && (
                  <div className="flex justify-between px-4 py-2.5">
                    <span className={isDark ? "text-gray-400" : "text-gray-500"}>Vehicle</span>
                    <span className="font-semibold">{transaction.vehicle}</span>
                  </div>
                )}
                {transaction.plate_number && (
                  <div className="flex justify-between px-4 py-2.5">
                    <span className={isDark ? "text-gray-400" : "text-gray-500"}>Plate Number</span>
                    <span className="font-mono font-bold tracking-wider">{transaction.plate_number}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Service & Item Details */}
          <div>
            <h4 className={`text-xs font-black uppercase tracking-wider mb-2.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              Item & Service Breakdown
            </h4>
            <div className={`rounded-xl border divide-y overflow-hidden text-sm ${isDark ? "border-white/5 divide-white/5 bg-white/2" : "border-gray-100 divide-gray-100 bg-gray-50"}`}>
              <div className="flex justify-between px-4 py-2.5">
                <span className={isDark ? "text-gray-400" : "text-gray-500"}>Type</span>
                <span className="font-semibold">{TYPE_LABELS[transaction.transaction_type] || transaction.transaction_type}</span>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <span className={isDark ? "text-gray-400" : "text-gray-500"}>Description</span>
                <span className="font-semibold text-right max-w-[240px] truncate">{transaction.description || transaction.service || "-"}</span>
              </div>
              {transaction.quantity > 1 && (
                <div className="flex justify-between px-4 py-2.5">
                  <span className={isDark ? "text-gray-400" : "text-gray-500"}>Quantity</span>
                  <span className="font-semibold">{transaction.quantity}</span>
                </div>
              )}
              {transaction.branch_name && (
                <div className="flex justify-between px-4 py-2.5">
                  <span className={isDark ? "text-gray-400" : "text-gray-500"}>Branch</span>
                  <span className="font-semibold">{transaction.branch_name}</span>
                </div>
              )}
              {transaction.staff_name && (
                <div className="flex justify-between px-4 py-2.5">
                  <span className={isDark ? "text-gray-400" : "text-gray-500"}>Handled By</span>
                  <span className="font-semibold">{transaction.staff_name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes if present */}
          {transaction.notes && (
            <div className={`rounded-xl border p-3 text-xs ${isDark ? "border-white/5 bg-white/3 text-gray-400" : "border-gray-200 bg-gray-50 text-gray-600"}`}>
              <span className="font-semibold">Note:</span> {transaction.notes}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${isDark ? "border-white/10 bg-gray-900/90" : "border-gray-100 bg-gray-50"}`}>
          <button
            onClick={handlePrint}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-colors ${
              isDark ? "border-white/10 text-gray-300 hover:bg-white/10 hover:text-white" : "border-gray-300 text-gray-700 hover:bg-gray-100 shadow-sm"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Receipt
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StaffTransactionHistory() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const { isDark = true } = useTheme?.() || {};

  const loadRows = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const query = typeFilter === "all" ? "" : `?type=${encodeURIComponent(typeFilter)}`;
      const res = await fetch(`${API_BASE}/api/payment-transactions/${query}`, {
        headers: getHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Failed to fetch transactions (${res.status})`);
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load transactions.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const total = useMemo(
    () => rows.reduce((sum, row) => sum + (parseFloat(row.amount || 0) || 0), 0),
    [rows],
  );

  return (
    <StaffLayout>
      <div className="min-h-screen -m-8 p-8 bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30">
        <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Transaction History</h1>
            <p className="text-sm text-gray-300 mt-2">All paid records from appointments, walk-ins, products, and services.</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-gray-900/80 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500/50"
            >
              <option value="all">All Types</option>
              <option value="appointment">Appointment</option>
              <option value="walk_in">Walk-in</option>
              <option value="service">Service</option>
              <option value="product">Product</option>
            </select>
            <button
              onClick={loadRows}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="mb-4 text-sm text-gray-300">
          Total shown: <span className="text-emerald-400 font-bold">₱{formatMoney(total)}</span>
        </div>

        <div className="bg-gray-900/60 border border-white/10 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[140px_110px_1fr_120px_110px_90px] gap-3 px-5 py-3 text-xs uppercase tracking-wider text-gray-400 border-b border-white/10">
            <span>Date</span>
            <span>Type</span>
            <span>Description</span>
            <span className="text-right">Amount</span>
            <span>Payment</span>
            <span className="text-center">Action</span>
          </div>

          {loading && <div className="px-5 py-8 text-sm text-gray-400">Loading transactions...</div>}
          {!loading && error && <div className="px-5 py-8 text-sm text-red-400">{error}</div>}
          {!loading && !error && rows.length === 0 && (
            <div className="px-5 py-8 text-sm text-gray-400">No transactions found.</div>
          )}

          {!loading && !error && rows.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-[140px_110px_1fr_120px_110px_90px] items-center gap-3 px-5 py-3 text-sm border-b border-white/5 text-gray-200 hover:bg-white/3 transition-colors"
            >
              <span className="text-gray-400 text-xs">{formatDate(row.paid_at)}</span>
              <span className="font-semibold text-xs">{TYPE_LABELS[row.transaction_type] || row.transaction_type}</span>
              <span className="truncate text-xs" title={row.description || row.notes || "-"}>
                {row.description || row.notes || "-"}
              </span>
              <span className="text-right font-bold text-emerald-300">₱{formatMoney(row.amount)}</span>
              <span className="uppercase text-xs text-gray-300">{row.payment_method || "-"}</span>
              <div className="text-center">
                <button
                  onClick={() => setSelectedTransaction(row)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 transition-all"
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Transaction Detail Modal */}
        {selectedTransaction && (
          <TransactionDetailModal
            transaction={selectedTransaction}
            onClose={() => setSelectedTransaction(null)}
          />
        )}
      </div>
    </StaffLayout>
  );
}
