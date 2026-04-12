import React, { useCallback, useEffect, useMemo, useState } from "react";
import StaffLayout from "./StaffLayout";
import { API_BASE } from "../../hooks/useAuth.js";

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

export default function StaffTransactionHistory() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

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
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Transaction History</h1>
            <p className="text-sm text-gray-300 mt-2">All paid records from appointments, walk-ins, products, and services.</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-gray-900/80 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
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
          Total shown: <span className="text-emerald-400 font-bold">P{formatMoney(total)}</span>
        </div>

        <div className="bg-gray-900/60 border border-white/10 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[150px_130px_1fr_130px_140px] gap-3 px-5 py-3 text-xs uppercase tracking-wider text-gray-400 border-b border-white/10">
            <span>Date</span>
            <span>Type</span>
            <span>Description</span>
            <span className="text-right">Amount</span>
            <span>Payment</span>
          </div>

          {loading && <div className="px-5 py-8 text-sm text-gray-400">Loading transactions...</div>}
          {!loading && error && <div className="px-5 py-8 text-sm text-red-400">{error}</div>}
          {!loading && !error && rows.length === 0 && (
            <div className="px-5 py-8 text-sm text-gray-400">No transactions found.</div>
          )}

          {!loading && !error && rows.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-[150px_130px_1fr_130px_140px] gap-3 px-5 py-3 text-sm border-b border-white/5 text-gray-200"
            >
              <span className="text-gray-400">{formatDate(row.paid_at)}</span>
              <span>{TYPE_LABELS[row.transaction_type] || row.transaction_type}</span>
              <span className="truncate" title={row.description || row.notes || "-"}>
                {row.description || row.notes || "-"}
              </span>
              <span className="text-right font-semibold text-emerald-300">P{formatMoney(row.amount)}</span>
              <span className="uppercase text-gray-300">{row.payment_method || "-"}</span>
            </div>
          ))}
        </div>
      </div>
    </StaffLayout>
  );
}
