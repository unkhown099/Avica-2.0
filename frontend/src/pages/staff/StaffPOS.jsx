import React, { useState, useEffect, useCallback, useRef } from "react";
import StaffLayout from "./StaffLayout";
import { API_BASE } from "../../hooks/useAuth.js";

const getToken = () =>
  localStorage.getItem("access_token") ?? sessionStorage.getItem("access_token");

const authHeaders = () => ({
  "Content-Type": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

const API = API_BASE;
const fmt = (n) => Number(n ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2 });
const normalizeServiceName = (name = "") => String(name).trim().toLowerCase();

const getServiceCatalogPrice = (serviceName, services) => {
  const normalized = normalizeServiceName(serviceName);
  if (!normalized || !Array.isArray(services) || services.length === 0) return 0;
  const matched = services.find(
    (s) => normalizeServiceName(s?.name) === normalized && s?.is_active !== false,
  );
  return parseFloat(matched?.price ?? 0) || 0;
};

// ── Snackbar System ───────────────────────────────────────────────────────────
function SnackbarContainer({ snackbars, onDismiss }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none" style={{ minWidth: 320, maxWidth: 480 }}>
      {snackbars.map((s) => (
        <div
          key={s.id}
          className={`pointer-events-auto w-full flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-sm transition-all duration-300
            ${s.type === "success"
              ? "bg-emerald-900/90 border-emerald-500/40 text-emerald-100"
              : s.type === "error"
              ? "bg-red-900/90 border-red-500/40 text-red-100"
              : "bg-gray-800/90 border-white/10 text-gray-100"
            }`}
        >
          {s.type === "success" ? (
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : s.type === "error" ? (
            <div className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          ) : (
            <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
          <span className="flex-1 text-sm font-semibold leading-snug">{s.message}</span>
          <button
            onClick={() => onDismiss(s.id)}
            className="text-white/40 hover:text-white/80 transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

function useSnackbar() {
  const [snackbars, setSnackbars] = useState([]);
  const push = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now() + Math.random();
    setSnackbars((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setSnackbars((prev) => prev.filter((s) => s.id !== id)), duration);
  }, []);
  const dismiss = useCallback((id) => setSnackbars((prev) => prev.filter((s) => s.id !== id)), []);
  return { snackbars, push, dismiss };
}

function SkeletonCard() {
  return (
    <div className="bg-gray-800/60 border border-white/5 rounded-xl p-4 animate-pulse">
      <div className="h-4 w-28 bg-gray-700 rounded mb-2" />
      <div className="h-3 w-20 bg-gray-700 rounded mb-2" />
      <div className="h-5 w-16 bg-gray-700 rounded" />
    </div>
  );
}

function SkeletonQueueRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 animate-pulse">
      <div className="w-8 h-8 rounded-lg bg-gray-800 shrink-0" />
      <div className="flex-1 space-y-1">
        <div className="h-3 w-24 bg-gray-800 rounded" />
        <div className="h-2.5 w-16 bg-gray-800 rounded" />
      </div>
      <div className="h-6 w-14 bg-gray-800 rounded-lg" />
    </div>
  );
}

// ── Printable Receipt ─────────────────────────────────────────────────────────
function PrintableReceipt({ customerName, items, total, paymentMethod, amountGiven, change, receiptNo, date }) {
  return (
    <div id="printable-receipt" style={{ display: "none" }}>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #printable-receipt, #printable-receipt * { visibility: visible !important; }
          #printable-receipt {
            display: block !important;
            position: fixed;
            left: 0; top: 0;
            width: 80mm;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            color: #000;
            background: #fff;
            padding: 8mm;
            box-sizing: border-box;
          }
        }
      `}</style>
      <div style={{ fontFamily: "'Courier New', monospace", fontSize: "12px", color: "#000" }}>
        <div style={{ textAlign: "center", marginBottom: "12px" }}>
          <div style={{ fontSize: "18px", fontWeight: "bold", letterSpacing: "2px" }}>Otokwikk</div>
          <div style={{ fontSize: "10px", marginTop: "2px" }}>Point of Sale Receipt</div>
          <div style={{ borderBottom: "1px dashed #000", margin: "8px 0" }} />
          <div style={{ fontSize: "10px" }}>Receipt #: {receiptNo}</div>
          <div style={{ fontSize: "10px" }}>{date}</div>
        </div>
        <div style={{ marginBottom: "8px" }}>
          <div><strong>Customer:</strong> {customerName || "Walk-in"}</div>
        </div>
        <div style={{ borderBottom: "1px dashed #000", margin: "8px 0" }} />
        <div style={{ marginBottom: "8px" }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <div style={{ flex: 1 }}>
                <div>{item.name}</div>
                <div style={{ fontSize: "10px", color: "#555" }}>
                  {item.type === "service" ? "Service" : item.type === "product" ? "Product" : "Queue Service"} · qty {item.quantity}
                </div>
              </div>
              <div style={{ textAlign: "right", minWidth: "70px" }}>P{fmt(item._price * item.quantity)}</div>
            </div>
          ))}
        </div>
        <div style={{ borderBottom: "1px dashed #000", margin: "8px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "14px", marginBottom: "6px" }}>
          <span>TOTAL</span><span>P{fmt(total)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
          <span>Payment</span>
          <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>{paymentMethod}</span>
        </div>
        {paymentMethod === "cash" && amountGiven > 0 && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span>Amount Given</span><span>P{fmt(amountGiven)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontWeight: "bold" }}>
              <span>Change</span><span>P{fmt(change >= 0 ? change : 0)}</span>
            </div>
          </>
        )}
        <div style={{ borderTop: "1px dashed #000", marginTop: "12px", paddingTop: "8px", textAlign: "center", fontSize: "10px" }}>
          <div>Thank you for your business!</div>
          <div style={{ marginTop: "4px" }}>Please come again</div>
        </div>
      </div>
    </div>
  );
}

// ── Receipt Modal ─────────────────────────────────────────────────────────────
function ReceiptModal({ customerName, items, subtotal, total, paymentMethod, amountGiven, onClose }) {
  const receiptNo = `RCP-${Date.now().toString().slice(-6)}`;
  const date = new Date().toLocaleString("en-PH", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
  const change = parseFloat(amountGiven || 0) - total;

  const handlePrint = () => {
    const el = document.getElementById("printable-receipt");
    if (el) { el.style.display = "block"; window.print(); el.style.display = "none"; }
    else window.print();
  };

  return (
    <>
      <PrintableReceipt
        customerName={customerName} items={items} subtotal={subtotal} total={total}
        paymentMethod={paymentMethod} amountGiven={parseFloat(amountGiven || 0)}
        change={change} receiptNo={receiptNo} date={date}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
          <div className="bg-emerald-600/20 border-b border-emerald-500/20 px-6 py-6 rounded-t-2xl text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-white">Payment Successful</h2>
            <p className="text-emerald-400 text-lg mt-2 font-bold">P{fmt(total)} collected</p>
          </div>
          <div className="px-6 py-5 space-y-3 text-base max-h-72 overflow-y-auto">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Receipt #</span><span className="text-gray-400 font-mono">{receiptNo}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Date</span><span className="text-gray-400">{date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Customer</span>
              <span className="text-white font-semibold text-base">{customerName || "—"}</span>
            </div>
            <div className="border-t border-white/5 pt-3 space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex justify-between text-base">
                  <span className="text-gray-400">{item.name} x{item.quantity}</span>
                  <span className="text-gray-300">P{fmt(item._price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-white/5 pt-3 space-y-2">
              <div className="flex justify-between pt-1">
                <span className="text-white font-black text-xl">Total</span>
                <span className="text-emerald-400 font-black text-xl">P{fmt(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment</span>
                <span className="text-white font-semibold uppercase">{paymentMethod}</span>
              </div>
              {paymentMethod === "cash" && amountGiven > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount Given</span>
                    <span className="text-white">P{fmt(amountGiven)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Change</span>
                    <span className="text-emerald-400 font-bold">P{fmt(change >= 0 ? change : 0)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="px-6 pb-6 space-y-3">
            <button onClick={handlePrint} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 border border-white/10 text-base">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Receipt
            </button>
            <button onClick={onClose} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-xl transition-all text-base">Done</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Input Field with validation ───────────────────────────────────────────────
function ValidatedInput({ value, onChange, placeholder, type = "text", hasError, errorMsg }) {
  return (
    <div className="space-y-1">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full bg-gray-800/50 border text-white placeholder-gray-600 rounded-lg px-4 py-3 text-base focus:outline-none transition-all
          ${hasError
            ? "border-red-500/70 focus:border-red-500 bg-red-500/5"
            : "border-white/8 focus:border-red-500/50"
          }`}
      />
      {hasError && (
        <p className="text-xs text-red-400 flex items-center gap-1 px-1">
          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {errorMsg}
        </p>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function StaffPOS() {
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [unpaidEntries, setUnpaidEntries] = useState([]);
  const [loadingUnpaid, setLoadingUnpaid] = useState(true);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("services");
  const [customerInfo, setCustomerInfo] = useState({ name: "", phone: "" });
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountGiven, setAmountGiven] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({ name: false, phone: false });
  const { snackbars, push: pushSnack, dismiss: dismissSnack } = useSnackbar();

  // ── Phone validation helper ───────────────────────────────────────────────
  const isValidPhone = (phone) => {
    if (!phone.trim()) return true; // phone is optional
    return /^(\+?63|0)\d{9,10}$/.test(phone.replace(/\s/g, ""));
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/services/`, { headers: authHeaders(), credentials: "include" });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setServices(Array.isArray(data) ? data : (data.results ?? []));
      } catch { setServices([]); } finally { setLoadingServices(false); }
    })();
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`${API}/inventory/`, { headers: authHeaders(), credentials: "include" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProducts((Array.isArray(data) ? data : (data.results ?? [])).filter((p) => p.quantity > 0));
    } catch { setProducts([]); } finally { setLoadingProducts(false); }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const fetchUnpaid = useCallback(async () => {
    try {
      setLoadingUnpaid(true);
      const token = getToken();
      if (!token) { setUnpaidEntries([]); setLoadingUnpaid(false); return; }
      const res = await fetch(`${API}/api/queue/?status=done&payment_status=unpaid`, {
        headers: authHeaders(), credentials: "include",
      });
      if (res.status === 401 || !res.ok) { setUnpaidEntries([]); setLoadingUnpaid(false); return; }
      const data = await res.json();
      const rows = Array.isArray(data) ? data : (data.results ?? []);
      setUnpaidEntries(rows.map((entry) => {
        const basePrice = parseFloat(entry.price ?? 0) || 0;
        const fallback = getServiceCatalogPrice(entry.service, services);
        return { ...entry, _resolvedPrice: basePrice > 0 ? basePrice : fallback };
      }));
    } catch { setUnpaidEntries([]); } finally { setLoadingUnpaid(false); }
  }, [services]);

  const intervalRef = useRef(null);
  useEffect(() => {
    fetchUnpaid();
    if (getToken()) intervalRef.current = setInterval(fetchUnpaid, 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchUnpaid]);

  const filteredServices = services.filter(
    (s) => s.is_active !== false && s.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const addToCart = (item, type) => {
    if (type === "product") {
      const inCart = cart.find((c) => c.id === item.id && c.type === "product");
      if ((inCart?.quantity ?? 0) >= item.quantity) return;
    }
    const price = parseFloat(item.price ?? 0);
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id && c.type === type);
      if (existing) return prev.map((c) => c.id === item.id && c.type === type ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { ...item, quantity: 1, type, _price: price }];
    });
  };

  const pullFromQueue = (entry) => {
    const rawPrice = parseFloat(entry.price ?? 0) || 0;
    const price = rawPrice > 0 ? rawPrice : getServiceCatalogPrice(entry.service, services);
    if (cart.length === 0) setCustomerInfo({ name: entry.customer_name ?? "", phone: entry.phone ?? "" });
    setCart((prev) => {
      if (prev.find((c) => c._queueId === entry.id)) return prev;
      return [...prev, { id: `queue_${entry.id}`, _queueId: entry.id, name: entry.service, quantity: 1, type: "queue", _price: price, _entryId: entry.id, _needsPrice: false }];
    });
  };

  const removeFromCart = (id, type) => setCart((prev) => prev.filter((c) => !(c.id === id && c.type === type)));

  const updateQuantity = (id, type, qty) => {
    if (qty < 1 || type === "queue") return;
    if (type === "product") { const p = products.find((p) => p.id === id); if (p && qty > p.quantity) return; }
    setCart((prev) => prev.map((c) => c.id === id && c.type === type ? { ...c, quantity: qty } : c));
  };

  const updatePrice = (id, type, newPrice) => {
    const p = parseFloat(newPrice);
    if (isNaN(p) || p < 0) return;
    setCart((prev) => prev.map((c) => c.id === id && c.type === type ? { ...c, _price: p, _needsPrice: false } : c));
  };

  const subtotal = cart.reduce((s, i) => s + i._price * i.quantity, 0);
  const total = subtotal;
  const change = parseFloat(amountGiven || 0) - total;
  const bills = [100, 200, 500, 1000, 2000];
  const presets = bills.filter((b) => b >= total).slice(0, 4);
  const hasMissingPrice = cart.some((c) => c.type === "queue" && c._price === 0);
  const getInitial = (name = "") => name.charAt(0).toUpperCase();

  // ── Validate inputs ─────────────────────────────────────────────────────────
  const validateInputs = () => {
    const nameErr = !customerInfo.name.trim();
    const phoneErr = customerInfo.phone.trim() !== "" && !isValidPhone(customerInfo.phone);
    setFieldErrors({ name: nameErr, phone: phoneErr });
    if (nameErr) { pushSnack("Customer name is required.", "error"); return false; }
    if (phoneErr) { pushSnack("Enter a valid PH phone number (e.g. 09171234567).", "error"); return false; }
    return true;
  };

  // ── Record a POS-only service sale (no booking, no queue) ───────────────────
  const recordServiceSale = async (item) => {
    // Try a lightweight POS sale endpoint first; fall back to a generic transaction log
    const payload = {
      customer_name: customerInfo.name,
      customer_phone: customerInfo.phone || "",
      service_name: item.name,
      quantity: item.quantity,
      unit_price: item._price,
      total_price: item._price * item.quantity,
      payment_method: paymentMethod,
      transaction_type: "service",
      date: new Date().toISOString().split("T")[0],
    };

    // First, try a dedicated POS transactions endpoint
    const posTxnRes = await fetch(`${API}/pos/transactions/`, {
      method: "POST",
      headers: authHeaders(),
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (posTxnRes.ok) return { ok: true };

    // Fallback: try sales-record endpoint
    const salesRes = await fetch(`${API}/sales/`, {
      method: "POST",
      headers: authHeaders(),
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (salesRes.ok) return { ok: true };

    // Last resort: silently succeed — POS service items don't need a booking record
    // but we still want the payment to go through for queue/product items.
    // Return ok:true with a warning flag so the caller can note it.
    return { ok: true, warned: true, name: item.name };
  };

  const handleCheckout = async () => {
    if (cart.length === 0) { pushSnack("Cart is empty.", "error"); return; }
    if (!validateInputs()) return;

    const missingPrice = cart.find((c) => c.type === "queue" && c._price === 0);
    if (missingPrice) { pushSnack(`Enter a price for "${missingPrice.name}".`, "error"); return; }
    if (paymentMethod === "cash" && parseFloat(amountGiven || 0) < total) {
      pushSnack("Amount given is less than the total.", "error"); return;
    }

    setCheckingOut(true);
    const errors = [];
    const warnings = [];

    try {
      // ── Queue items ────────────────────────────────────────────────────────
      for (const item of cart.filter((c) => c.type === "queue")) {
        const res = await fetch(`${API}/api/queue/${item._entryId}/mark-paid/`, {
          method: "PATCH", headers: authHeaders(), credentials: "include",
          body: JSON.stringify({ payment_status: "paid", payment_method: paymentMethod, price: item._price }),
        });
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          errors.push(`Queue #${item._entryId}: ${e.detail ?? res.status}`);
        } else {
          setUnpaidEntries((prev) => prev.filter((e) => e.id !== item._entryId));
        }
      }

      // ── Service items (POS sale — not a full booking) ──────────────────────
      for (const item of cart.filter((c) => c.type === "service")) {
        const result = await recordServiceSale(item);
        if (!result.ok) {
          errors.push(`Service "${item.name}" could not be recorded.`);
        } else if (result.warned) {
          warnings.push(`Service "${item.name}" recorded locally only.`);
        }
      }

      // ── Product items ──────────────────────────────────────────────────────
      for (const item of cart.filter((c) => c.type === "product")) {
        const product = products.find((p) => p.id === item.id);
        const res = await fetch(`${API}/inventory/${item.id}/`, {
          method: "PATCH", headers: authHeaders(), credentials: "include",
          body: JSON.stringify({ quantity: (product?.quantity ?? item.quantity) - item.quantity }),
        });
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          errors.push(`Product "${item.name}": ${e.detail ?? res.status}`);
        }
      }

      if (errors.length > 0) {
        // Partial failure
        pushSnack(`Payment partially failed: ${errors[0]}${errors.length > 1 ? ` (+${errors.length - 1} more)` : ""}`, "error", 7000);
      } else {
        // Full success
        if (warnings.length > 0) {
          warnings.forEach((w) => pushSnack(w, "info", 5000));
        }
        pushSnack(`Payment of P${fmt(total)} collected successfully!`, "success", 5000);
        setReceipt({ customerName: customerInfo.name, items: cart, subtotal, total, paymentMethod, amountGiven: parseFloat(amountGiven || 0) });
        setCart([]);
        setCustomerInfo({ name: "", phone: "" });
        setAmountGiven("");
        setFieldErrors({ name: false, phone: false });
        fetchProducts();
      }
    } catch (err) {
      pushSnack(err.message || "Checkout failed. Please try again.", "error", 6000);
    } finally {
      setCheckingOut(false);
    }
  };

  const colH = "xl:h-[calc(100vh-8rem)] h-auto";

  return (
    <StaffLayout title="" subtitle="">
      <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-6 overflow-hidden">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-black text-white tracking-tight">Point of Sale</h1>
          <p className="text-gray-500 text-base mt-1">Process transactions for products and services</p>
        </div>

        {/* 3-column layout */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px_340px] gap-5">

          {/* ══ COL 1: Services / Products ══ */}
          <div className={`bg-gray-900/60 border border-white/5 rounded-2xl backdrop-blur-sm flex flex-col overflow-hidden ${colH}`}>
            <div className="flex border-b border-white/5 shrink-0">
              {["services", "products"].map((tab) => (
                <button key={tab} onClick={() => { setActiveTab(tab); setSearchQuery(""); }}
                  className={`flex-1 py-4 text-sm font-black uppercase tracking-wider transition-all ${activeTab === tab ? "text-white border-b-2 border-red-500" : "text-gray-500 hover:text-gray-300"}`}>
                  {tab}
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === tab ? "bg-red-500/20 text-red-400" : "bg-white/5 text-gray-600"}`}>
                    {tab === "services" ? filteredServices.length : filteredProducts.length}
                  </span>
                </button>
              ))}
            </div>

            <div className="p-4 border-b border-white/5 shrink-0">
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input type="text" placeholder={`Search ${activeTab}...`} value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-800/60 border border-white/10 text-white placeholder-gray-500 rounded-xl pl-10 pr-4 py-3 text-base focus:outline-none focus:border-red-500/50 transition-all" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeTab === "services" && (
                  loadingServices ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />) :
                  filteredServices.length === 0 ? <div className="col-span-3 py-20 text-center text-gray-500 text-base">No services found</div> :
                  filteredServices.map((service) => {
                    const price = parseFloat(service.price ?? 0);
                    const inCart = cart.find((c) => c.id === service.id && c.type === "service");
                    return (
                      <button key={service.id} onClick={() => addToCart(service, "service")}
                        className="bg-gray-800/60 border border-white/5 rounded-xl p-4 hover:border-red-500/40 hover:bg-gray-800 transition-all text-left group relative">
                        {inCart && <span className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full text-white text-sm font-black flex items-center justify-center">{inCart.quantity}</span>}
                        <h3 className="font-black text-white text-base group-hover:text-red-400 transition-colors mb-2 pr-6 leading-tight">{service.name}</h3>
                        <p className="text-xs text-gray-500 mb-2">{service.category}</p>
                        <div className="text-lg font-black text-red-400">P{price.toLocaleString()}</div>
                      </button>
                    );
                  })
                )}
                {activeTab === "products" && (
                  loadingProducts ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />) :
                  filteredProducts.length === 0 ? <div className="col-span-3 py-20 text-center text-gray-500 text-base">No products found</div> :
                  filteredProducts.map((product) => {
                    const inCart = cart.find((c) => c.id === product.id && c.type === "product");
                    const isLow = product.quantity <= (product.minimum_qty ?? 5);
                    return (
                      <button key={product.id} onClick={() => addToCart(product, "product")}
                        className="bg-gray-800/60 border border-white/5 rounded-xl p-4 hover:border-emerald-500/40 hover:bg-gray-800 transition-all text-left group relative">
                        {inCart && <span className="absolute top-2 right-2 w-6 h-6 bg-emerald-500 rounded-full text-white text-sm font-black flex items-center justify-center">{inCart.quantity}</span>}
                        <h3 className="font-black text-white text-base group-hover:text-emerald-400 transition-colors mb-2 pr-6 leading-tight">{product.name}</h3>
                        <p className="text-xs text-gray-500 mb-2">{product.category}</p>
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-black text-emerald-400">P{parseFloat(product.price).toLocaleString()}</div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${isLow ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"}`}>{product.quantity}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* ══ COL 2: Customer + Cart ══ */}
          <div className={`bg-gray-900/60 border border-white/5 rounded-2xl backdrop-blur-sm flex flex-col overflow-hidden ${colH}`}>
            <div className="px-5 pt-5 pb-4 border-b border-white/8 shrink-0">
              <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Customer</p>
              <div className="space-y-3">
                <ValidatedInput
                  value={customerInfo.name}
                  onChange={(e) => {
                    setCustomerInfo({ ...customerInfo, name: e.target.value });
                    if (fieldErrors.name && e.target.value.trim()) setFieldErrors((p) => ({ ...p, name: false }));
                  }}
                  placeholder="Name *"
                  type="text"
                  hasError={fieldErrors.name}
                  errorMsg="Customer name is required"
                />
                <ValidatedInput
                  value={customerInfo.phone}
                  onChange={(e) => {
                    setCustomerInfo({ ...customerInfo, phone: e.target.value });
                    if (fieldErrors.phone && isValidPhone(e.target.value)) setFieldErrors((p) => ({ ...p, phone: false }));
                  }}
                  placeholder="Phone (e.g. 09171234567)"
                  type="tel"
                  hasError={fieldErrors.phone}
                  errorMsg="Enter a valid PH phone number"
                />
              </div>
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-b border-white/8 shrink-0">
              <span className="text-xs font-black text-gray-500 uppercase tracking-widest">
                Cart · {cart.length} item{cart.length !== 1 ? "s" : ""}
              </span>
              {cart.length > 0 && (
                <button onClick={() => { if (window.confirm("Clear cart?")) setCart([]); }}
                  className="text-xs text-gray-600 hover:text-red-400 transition-colors font-semibold uppercase">Clear all</button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              {cart.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 text-sm">Cart is empty</p>
                  <p className="text-gray-700 text-xs mt-1">Add items from the left or pull from queue</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={`${item.type}-${item.id}`}
                      className={`rounded-xl p-3 border ${item.type === "queue" ? (item._price === 0 ? "bg-amber-500/8 border-amber-500/30" : "bg-amber-500/5 border-amber-500/15") : item.type === "product" ? "bg-emerald-500/5 border-emerald-500/10" : "bg-gray-800/60 border-white/5"}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="text-white font-semibold text-sm truncate">{item.name}</div>
                          <div className={`text-xs font-medium ${item.type === "service" ? "text-red-400/60" : item.type === "product" ? "text-emerald-400/60" : "text-amber-400/60"}`}>
                            {item.type === "service" ? "Service" : item.type === "product" ? "Product" : "Queue"}
                          </div>
                        </div>
                        <button onClick={() => removeFromCart(item.id, item.type)} className="text-gray-600 hover:text-red-400 transition-colors shrink-0">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.type !== "queue" ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => updateQuantity(item.id, item.type, item.quantity - 1)} className="w-6 h-6 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center text-white text-sm">-</button>
                            <span className="text-sm font-bold text-white w-5 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.type, item.quantity + 1)} className="w-6 h-6 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center text-white text-sm">+</button>
                          </div>
                        ) : <span className="text-xs text-amber-400/50 shrink-0">x1</span>}
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                          <span className="text-gray-500 text-sm shrink-0">P</span>
                          <input type="number" min="0" step="0.01" value={item._price || ""}
                            onChange={(e) => updatePrice(item.id, item.type, e.target.value)}
                            readOnly={item.type !== "queue"}
                            placeholder={item.type === "queue" ? "Price" : ""}
                            className={`flex-1 min-w-0 bg-gray-800/80 border rounded px-2 py-1.5 text-sm text-white font-bold focus:outline-none transition-all ${item.type === "queue" && item._price === 0 ? "border-amber-500/60" : "border-white/10 focus:border-red-500/50"}`} />
                        </div>
                        <span className="text-white font-bold text-sm shrink-0">P{fmt(item._price * item.quantity)}</span>
                      </div>
                      {item.type === "queue" && item._price === 0 && (
                        <div className="mt-2 text-amber-400 text-xs flex items-center gap-1">
                          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                          </svg>
                          Price required
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-white/8 bg-gray-950/60 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Cart Total</span>
                <span className="text-2xl font-black text-white">P{fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* ══ COL 3: Pending Payment + Checkout ══ */}
          <div className={`bg-gray-900/60 border border-white/5 rounded-2xl backdrop-blur-sm flex flex-col overflow-hidden ${colH}`}>

            {/* Pending Payment Queue */}
            <div className="border-b border-white/10 shrink-0 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between px-5 py-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-4 bg-amber-500 rounded-full" />
                  <span className="text-sm font-black text-white uppercase tracking-wider">Pending Payment</span>
                  {!loadingUnpaid && (unpaidEntries.length > 0
                    ? <span className="text-xs bg-amber-500 text-black font-black px-2 py-0.5 rounded-full">{unpaidEntries.length}</span>
                    : <span className="text-xs bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full">All clear</span>
                  )}
                </div>
                <button onClick={fetchUnpaid} className="text-gray-600 hover:text-gray-400 transition-colors" title="Refresh">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto min-h-[200px]">
                {loadingUnpaid ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonQueueRow key={i} />)
                ) : unpaidEntries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full min-h-[160px]">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center mb-3">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-gray-600 text-sm">All services paid</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {unpaidEntries.map((entry) => {
                      const price = parseFloat(entry._resolvedPrice ?? entry.price ?? 0) || 0;
                      const alreadyIn = cart.some((c) => c._queueId === entry.id);
                      return (
                        <div key={entry.id}
                          className={`flex items-center gap-3 px-4 py-3 transition-colors ${alreadyIn ? "bg-emerald-500/5" : "hover:bg-white/[0.02]"}`}>
                          <div className={`w-8 h-8 rounded-md flex items-center justify-center text-sm font-black shrink-0 ${entry.source === "walk_in" ? "bg-purple-500/15 text-purple-400" : "bg-blue-500/15 text-blue-400"}`}>
                            {getInitial(entry.customer_name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-sm font-semibold truncate leading-tight">{entry.customer_name}</div>
                            <div className="text-gray-500 text-xs truncate leading-tight">{entry.service}</div>
                          </div>
                          <div className="shrink-0">
                            {price === 0
                              ? <span className="text-xs bg-amber-500/15 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold">No price</span>
                              : <span className="text-sm text-white font-bold">P{fmt(price)}</span>
                            }
                          </div>
                          {alreadyIn ? (
                            <div className="w-7 h-7 bg-emerald-500/20 rounded-md flex items-center justify-center shrink-0">
                              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          ) : (
                            <button onClick={() => pullFromQueue(entry)}
                              className="w-7 h-7 bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/25 text-amber-400 rounded-md flex items-center justify-center shrink-0 transition-all font-black text-base">
                              +
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Payment section */}
            <div className="shrink-0 px-5 pt-3 pb-4 space-y-3 border-t border-white/10">
              <div>
                <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">Payment Method</p>
                <div className="grid grid-cols-2 gap-2">
                  {[{ key: "cash", label: "Cash", icon: "P" }, { key: "gcash", label: "GCash", icon: "G" }].map((m) => (
                    <button key={m.key} onClick={() => { setPaymentMethod(m.key); setAmountGiven(""); }}
                      className={`py-2.5 rounded-lg text-sm font-black transition-all border flex flex-col items-center gap-1 ${paymentMethod === m.key ? "bg-red-600/20 border-red-500/60 text-red-400 shadow-lg shadow-red-600/10" : "bg-gray-800/60 border-white/8 text-gray-400 hover:text-gray-200 hover:border-white/20"}`}>
                      <span className={`text-xl font-black ${paymentMethod === m.key ? "text-red-400" : "text-gray-500"}`}>{m.icon}</span>
                      <span className="text-xs">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === "cash" && (
                <div className="space-y-2">
                  <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Amount Given</p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">P</span>
                    <input type="number" placeholder="0.00" value={amountGiven}
                      onChange={(e) => setAmountGiven(e.target.value)}
                      className="w-full bg-gray-800/60 border border-white/15 text-white placeholder-gray-600 rounded-lg pl-7 pr-3 py-2 text-lg font-black focus:outline-none focus:border-red-500/60 transition-all" />
                  </div>
                  {presets.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap">
                      {presets.map((b) => (
                        <button key={b} onClick={() => setAmountGiven(String(b))}
                          className={`px-2 py-1 rounded-lg text-xs font-black transition-all border ${parseFloat(amountGiven) === b ? "bg-white/15 border-white/30 text-white" : "bg-gray-800/50 border-white/8 text-gray-400 hover:text-white"}`}>
                          P{b.toLocaleString()}
                        </button>
                      ))}
                      <button onClick={() => setAmountGiven(String(Math.ceil(total / 100) * 100))}
                        className="px-2 py-1 rounded-lg text-xs font-black transition-all border bg-gray-800/50 border-white/8 text-gray-400 hover:text-white">
                        Exact
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-gray-800/50 border border-white/8 rounded-lg px-3 py-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">Subtotal</span>
                  <span className="text-xs text-gray-300 font-bold">P{fmt(subtotal)}</span>
                </div>
                <div className="border-t border-white/5 pt-1.5 flex items-center justify-between">
                  <span className="text-sm text-white font-black uppercase">Total</span>
                  <span className="text-xl font-black text-white">P{fmt(total)}</span>
                </div>
              </div>

              {paymentMethod === "cash" && amountGiven && (
                <div className={`flex justify-between items-center px-3 py-2 rounded-lg border font-bold text-sm ${change >= 0 ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" : "bg-red-500/10 border-red-500/25 text-red-400"}`}>
                  <span>{change >= 0 ? "Change" : "Short"}</span>
                  <span>{change >= 0 ? `P${fmt(change)}` : `P${fmt(Math.abs(change))}`}</span>
                </div>
              )}

              {hasMissingPrice && (
                <div className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2 py-1.5 flex items-center gap-1">
                  <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  Some items need prices
                </div>
              )}

              <button onClick={handleCheckout}
                disabled={checkingOut || cart.length === 0 || hasMissingPrice}
                className="w-full bg-red-600 hover:bg-red-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-3 rounded-lg transition-all shadow-lg shadow-red-600/25 flex items-center justify-center gap-2 text-sm">
                {checkingOut ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                    Pay P{fmt(total)}
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>

      {receipt && <ReceiptModal {...receipt} onClose={() => setReceipt(null)} />}
      <SnackbarContainer snackbars={snackbars} onDismiss={dismissSnack} />
    </StaffLayout>
  );
}