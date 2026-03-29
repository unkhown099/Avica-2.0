import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { API_BASE, useAuth } from "../../hooks/useAuth.js";
import InventoryManagerLayout from "./InventoryManagerLayout.jsx";

function InventoryManagerTransactions() {
  const { headers: authHeaders, isAuthenticated } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTransactions = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API_BASE}/inventory/transactions/?limit=100`, {
        headers: authHeaders,
      });
      setTransactions(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError("Failed to load transaction history.");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, authHeaders]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return (
    <InventoryManagerLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-4 sm:-m-8 p-4 sm:p-8">
        <div className="flex items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Transaction History
            </h1>
            <p className="text-gray-400 mt-1 text-sm sm:text-base">
              Latest stock movement and inventory actions
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-4 sm:p-5 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-white uppercase tracking-wider">
              Inventory Transactions
            </h2>
            <span className="text-xs text-gray-500">
              {loading ? "Loading..." : `Latest ${transactions.length} records`}
            </span>
          </div>

          {loading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-950/60 border border-white/5 rounded-xl p-3 sm:p-4 animate-pulse"
                >
                  <div className="h-4 w-48 bg-gray-800 rounded mb-2" />
                  <div className="h-3 w-64 bg-gray-800 rounded mb-2" />
                  <div className="h-3 w-28 bg-gray-800 rounded" />
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-gray-500">No transactions yet.</p>
          ) : (
            <div className="space-y-2.5 max-h-[70vh] overflow-y-auto pr-1">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="bg-gray-950/60 border border-white/5 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
                >
                  <div>
                    <div className="text-white font-semibold text-sm">
                      {tx.item_name} {tx.item_sku ? `(${tx.item_sku})` : ""}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {tx.action_type?.replaceAll("_", " ")} · Qty:{" "}
                      <span className="text-gray-200">{tx.quantity_changed}</span>
                      {" · "}
                      {tx.branch_name || "Central"}
                      {tx.target_branch_name ? ` → ${tx.target_branch_name}` : ""}
                    </div>
                    {tx.notes && (
                      <p className="text-xs text-gray-400 mt-1">Note: {tx.notes}</p>
                    )}
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <p className="text-xs text-gray-300">{tx.performed_by_name || "System"}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(tx.created_at).toLocaleString("en-PH")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </InventoryManagerLayout>
  );
}

export default InventoryManagerTransactions;
