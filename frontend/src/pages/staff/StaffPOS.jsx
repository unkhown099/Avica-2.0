import React, { useState, useEffect, useCallback, useRef } from "react";
import StaffLayout from "./StaffLayout";
import { API_BASE } from "../../hooks/useAuth.js";

// ── Auth ──────────────────────────────────────────────────────────────────────
const getToken = () =>
  localStorage.getItem("access_token") ??
  sessionStorage.getItem("access_token");

const authHeaders = () => ({
  "Content-Type": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

const API = API_BASE;
const fmt = (n) =>
  Number(n ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2 });

// ── Skeleton cards ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-gray-800/60 border border-white/5 rounded-xl p-4 animate-pulse">
      <div className="flex justify-between mb-2">
        <div className="h-4 w-28 bg-gray-700 rounded" />
        <div className="h-4 w-12 bg-gray-700 rounded-full" />
      </div>
      <div className="h-3 w-20 bg-gray-700 rounded mb-3" />
      <div className="h-5 w-16 bg-gray-700 rounded" />
    </div>
  );
}

function SkeletonQueueRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 animate-pulse">
      <div className="w-8 h-8 rounded-lg bg-gray-800 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-24 bg-gray-800 rounded" />
        <div className="h-3 w-16 bg-gray-800 rounded" />
      </div>
      <div className="h-3 w-14 bg-gray-800 rounded" />
      <div className="h-7 w-16 bg-gray-800 rounded-lg" />
    </div>
  );
}

// ── Receipt Modal ─────────────────────────────────────────────────────────────
function ReceiptModal({
  customerName,
  items,
  subtotal,
  total,
  paymentMethod,
  onClose,
}) {
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
        <div className="px-6 py-4 space-y-2 text-sm max-h-64 overflow-y-auto">
          <div className="flex justify-between">
            <span className="text-gray-500">Customer</span>
            <span className="text-white font-semibold">
              {customerName || "—"}
            </span>
          </div>
          {items.map((item, i) => (
            <div key={i} className="flex justify-between">
              <span className="text-gray-400">
                {item.name} ×{item.quantity}
              </span>
              <span className="text-gray-300">
                ₱{fmt(item._price * item.quantity)}
              </span>
            </div>
          ))}
          <div className="border-t border-white/5 pt-2 space-y-1.5">
            <div className="flex justify-between pt-1">
              <span className="text-white font-black">Total</span>
              <span className="text-emerald-400 font-black">₱{fmt(total)}</span>
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

// ── Main Component ────────────────────────────────────────────────────────────
function StaffPOS() {
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [unpaidEntries, setUnpaidEntries] = useState([]);
  const [loadingUnpaid, setLoadingUnpaid] = useState(true);
  const [unpaidCollapsed, setUnpaidCollapsed] = useState(false);

  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("services");
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    vehicle: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountGiven, setAmountGiven] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState(null);

  // ── Fetch services ────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/services/`, {
          headers: authHeaders(),
          credentials: "include",
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setServices(Array.isArray(data) ? data : (data.results ?? []));
      } catch {
        setServices([]);
      } finally {
        setLoadingServices(false);
      }
    })();
  }, []);

  // ── Fetch inventory ───────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`${API}/inventory/`, {
        headers: authHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProducts(
        (Array.isArray(data) ? data : (data.results ?? [])).filter(
          (p) => p.quantity > 0,
        ),
      );
    } catch {
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ── Fetch done + unpaid queue entries ─────────────────────────────────────
  const fetchUnpaid = useCallback(async () => {
    try {
      setLoadingUnpaid(true);

      // Check if token exists before making request
      const token = getToken();
      if (!token) {
        console.warn("No token found, stopping queue fetch");
        setUnpaidEntries([]);
        setLoadingUnpaid(false);
        return;
      }

      const res = await fetch(
        `${API}/api/queue/?status=done&payment_status=unpaid`,
        {
          headers: authHeaders(),
          credentials: "include",
        },
      );

      // Handle 401 Unauthorized - stop polling
      if (res.status === 401) {
        console.error("Unauthorized access to queue endpoint");
        setUnpaidEntries([]);
        setLoadingUnpaid(false);
        // Clear the interval by returning a flag or just stop
        return;
      }

      if (!res.ok) throw new Error();
      const data = await res.json();
      setUnpaidEntries(Array.isArray(data) ? data : (data.results ?? []));
    } catch (err) {
      console.error("Error fetching unpaid queue:", err);
      setUnpaidEntries([]);
    } finally {
      setLoadingUnpaid(false);
    }
  }, []);

  // Use a ref to store the interval ID
  const intervalRef = useRef(null);

  useEffect(() => {
    // Initial fetch
    fetchUnpaid();

    // Set up interval only if we have a token
    const token = getToken();
    if (token) {
      intervalRef.current = setInterval(fetchUnpaid, 30000);
    }

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchUnpaid]);

  useEffect(() => {
    fetchUnpaid();
    const interval = setInterval(fetchUnpaid, 30_000);
    return () => clearInterval(interval);
  }, [fetchUnpaid]);

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filteredServices = services.filter(
    (s) =>
      s.is_active !== false &&
      s.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // ── Cart helpers ──────────────────────────────────────────────────────────
  const addToCart = (item, type) => {
    if (type === "product") {
      const inCart = cart.find((c) => c.id === item.id && c.type === "product");
      if ((inCart?.quantity ?? 0) >= item.quantity) return;
    }
    const price =
      type === "service"
        ? parseFloat(item.price_min ?? item.price ?? 0)
        : parseFloat(item.price ?? 0);

    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id && c.type === type);
      if (existing)
        return prev.map((c) =>
          c.id === item.id && c.type === type
            ? { ...c, quantity: c.quantity + 1 }
            : c,
        );
      return [...prev, { ...item, quantity: 1, type, _price: price }];
    });
  };

  const pullFromQueue = (entry) => {
    const price = parseFloat(entry.price ?? 0);
    if (cart.length === 0) {
      setCustomerInfo({
        name: entry.customer_name ?? "",
        phone: entry.phone ?? "",
        vehicle: entry.vehicle ?? "",
      });
    }
    setCart((prev) => {
      const existing = prev.find((c) => c._queueId === entry.id);
      if (existing) return prev;
      return [
        ...prev,
        {
          id: `queue_${entry.id}`,
          _queueId: entry.id,
          name: entry.service,
          quantity: 1,
          type: "queue",
          _price: price,
          _entryId: entry.id,
          _needsPrice: price === 0,
        },
      ];
    });
    setUnpaidCollapsed(true);
  };

  const removeFromCart = (id, type) =>
    setCart((prev) => prev.filter((c) => !(c.id === id && c.type === type)));

  const updateQuantity = (id, type, qty) => {
    if (qty < 1) return;
    if (type === "product") {
      const product = products.find((p) => p.id === id);
      if (product && qty > product.quantity) return;
    }
    if (type === "queue") return;
    setCart((prev) =>
      prev.map((c) =>
        c.id === id && c.type === type ? { ...c, quantity: qty } : c,
      ),
    );
  };

  const updatePrice = (id, type, newPrice) => {
    const p = parseFloat(newPrice);
    if (isNaN(p) || p < 0) return;
    setCart((prev) =>
      prev.map((c) =>
        c.id === id && c.type === type
          ? { ...c, _price: p, _needsPrice: false }
          : c,
      ),
    );
  };

  // ── Totals ────────────────────────────────────────────────────────────────
  const subtotal = cart.reduce((s, i) => s + i._price * i.quantity, 0);
  const total = subtotal;
  const change = parseFloat(amountGiven || 0) - total;

  const bills = [100, 200, 500, 1000, 2000];
  const presets = bills.filter((b) => b >= total).slice(0, 4);

  // ── Checkout ──────────────────────────────────────────────────────────────
  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError("Cart is empty.");
      return;
    }
    if (!customerInfo.name.trim()) {
      setError("Please enter the customer name.");
      return;
    }

    const missingPrice = cart.find((c) => c.type === "queue" && c._price === 0);
    if (missingPrice) {
      setError(
        `Please enter a price for "${missingPrice.name}" before checking out.`,
      );
      return;
    }

    if (paymentMethod === "cash" && parseFloat(amountGiven || 0) < total) {
      setError("Amount given is less than the total.");
      return;
    }

    setError(null);
    setCheckingOut(true);
    const errors = [];

    try {
      for (const item of cart.filter((c) => c.type === "queue")) {
        const res = await fetch(
          `${API}/api/queue/${item._entryId}/mark-paid/`,
          {
            method: "PATCH",
            headers: authHeaders(),
            credentials: "include",
            body: JSON.stringify({
              payment_status: "paid",
              payment_method: paymentMethod,
              price: item._price,
            }),
          },
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          errors.push(`Queue #${item._entryId}: ${err.detail ?? res.status}`);
        } else {
          setUnpaidEntries((prev) =>
            prev.filter((e) => e.id !== item._entryId),
          );
        }
      }

      for (const item of cart.filter((c) => c.type === "service")) {
        for (let i = 0; i < item.quantity; i++) {
          const res = await fetch(`${API}/api/bookings/`, {
            method: "POST",
            headers: authHeaders(),
            credentials: "include",
            body: JSON.stringify({
              service: item.name,
              price: item._price,
              date: new Date().toISOString().split("T")[0],
              time: new Date().toLocaleTimeString("en-PH", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              vehicle: customerInfo.vehicle || "",
              notes: `POS — ${paymentMethod.toUpperCase()} | ${customerInfo.name} | ${customerInfo.phone}`,
              status: "confirmed",
            }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            errors.push(`Service "${item.name}": ${err.detail ?? res.status}`);
          }
        }
      }

      for (const item of cart.filter((c) => c.type === "product")) {
        const product = products.find((p) => p.id === item.id);
        const newQty = (product?.quantity ?? item.quantity) - item.quantity;
        const res = await fetch(`${API}/inventory/${item.id}/`, {
          method: "PATCH",
          headers: authHeaders(),
          credentials: "include",
          body: JSON.stringify({ quantity: newQty }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          errors.push(`Product "${item.name}": ${err.detail ?? res.status}`);
        }
      }

      if (errors.length > 0) {
        setError(`Some items failed: ${errors.join(", ")}`);
      } else {
        setReceipt({
          customerName: customerInfo.name,
          items: cart,
          subtotal,
          total,
          paymentMethod,
        });
        setCart([]);
        setCustomerInfo({ name: "", phone: "", vehicle: "" });
        setAmountGiven("");
        fetchProducts();
      }
    } catch (err) {
      setError(err.message || "Checkout failed.");
    } finally {
      setCheckingOut(false);
    }
  };

  const getInitial = (name = "") => name.charAt(0).toUpperCase();

  const hasMissingPrice = cart.some(
    (c) => c.type === "queue" && c._price === 0,
  );

  return (
    <StaffLayout title="" subtitle="">
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight">
            Point of Sale
          </h1>
          <p className="text-gray-400 mt-1">
            Process transactions for products and services
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left: Services / Products panel ──────────────────────────── */}
          <div className="lg:col-span-2 bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-white/5">
              {["services", "products"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setSearchQuery("");
                  }}
                  className={`flex-1 px-6 py-4 text-sm font-black uppercase tracking-wider transition-all ${activeTab === tab
                      ? "text-white border-b-2 border-red-500"
                      : "text-gray-500 hover:text-gray-300"
                    }`}
                >
                  {tab}
                  <span
                    className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab
                        ? "bg-red-500/20 text-red-400"
                        : "bg-white/5 text-gray-600"
                      }`}
                  >
                    {tab === "services"
                      ? filteredServices.length
                      : filteredProducts.length}
                  </span>
                </button>
              ))}
            </div>

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
                  placeholder={`Search ${activeTab}…`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-800/60 border border-white/10 text-white placeholder-gray-500 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-red-500/50 transition-all"
                />
              </div>
            </div>

            {/* Grid */}
            <div className="p-4 overflow-y-auto max-h-[600px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeTab === "services" &&
                  (loadingServices ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <SkeletonCard key={i} />
                    ))
                  ) : filteredServices.length === 0 ? (
                    <div className="col-span-2 py-16 text-center text-gray-500">
                      No services found
                    </div>
                  ) : (
                    filteredServices.map((service) => {
                      const price = parseFloat(service.price_min ?? 0);
                      const inCart = cart.find(
                        (c) => c.id === service.id && c.type === "service",
                      );
                      return (
                        <button
                          key={service.id}
                          onClick={() => addToCart(service, "service")}
                          className="bg-gray-800/60 border border-white/5 rounded-xl p-4 hover:border-red-500/30 hover:bg-gray-800 transition-all text-left group relative"
                        >
                          {inCart && (
                            <span className="absolute top-2.5 right-2.5 w-5 h-5 bg-red-500 rounded-full text-white text-xs font-black flex items-center justify-center">
                              {inCart.quantity}
                            </span>
                          )}
                          <div className="flex items-start justify-between mb-1 pr-6">
                            <h3 className="font-black text-white text-sm group-hover:text-red-400 transition-colors">
                              {service.name}
                            </h3>
                          </div>
                          <p className="text-xs text-gray-500 mb-1">
                            {service.category}
                          </p>
                          {service.duration && (
                            <p className="text-xs text-gray-700 mb-2">
                              ⏱ {service.duration}
                            </p>
                          )}
                          <div className="text-lg font-black text-red-400">
                            ₱{price.toLocaleString()}
                            {service.price_max &&
                              parseFloat(service.price_max) !== price && (
                                <span className="text-xs text-gray-500 font-normal ml-1">
                                  – ₱
                                  {parseFloat(
                                    service.price_max,
                                  ).toLocaleString()}
                                </span>
                              )}
                          </div>
                        </button>
                      );
                    })
                  ))}

                {activeTab === "products" &&
                  (loadingProducts ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <SkeletonCard key={i} />
                    ))
                  ) : filteredProducts.length === 0 ? (
                    <div className="col-span-2 py-16 text-center text-gray-500">
                      No products found
                    </div>
                  ) : (
                    filteredProducts.map((product) => {
                      const inCart = cart.find(
                        (c) => c.id === product.id && c.type === "product",
                      );
                      const isLow =
                        product.quantity <= (product.minimum_qty ?? 5);
                      return (
                        <button
                          key={product.id}
                          onClick={() => addToCart(product, "product")}
                          className="bg-gray-800/60 border border-white/5 rounded-xl p-4 hover:border-emerald-500/30 hover:bg-gray-800 transition-all text-left group relative"
                        >
                          {inCart && (
                            <span className="absolute top-2.5 right-2.5 w-5 h-5 bg-emerald-500 rounded-full text-white text-xs font-black flex items-center justify-center">
                              {inCart.quantity}
                            </span>
                          )}
                          <h3 className="font-black text-white text-sm group-hover:text-emerald-400 transition-colors mb-1 pr-6">
                            {product.name}
                          </h3>
                          <p className="text-xs text-gray-500 mb-1">
                            {product.category}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="text-lg font-black text-emerald-400">
                              ₱{parseFloat(product.price).toLocaleString()}
                            </div>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-semibold ${isLow ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"}`}
                            >
                              {product.quantity} {product.unit ?? "pcs"}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  ))}
              </div>
            </div>
          </div>

          {/* ── Right: POS panel with FIXED LAYOUT to keep button visible ── */}
          <div className="bg-gray-900/60 border border-white/5 rounded-2xl backdrop-blur-sm flex flex-col h-[calc(100vh-6rem)] sticky top-8 overflow-hidden">
            {/* Scrollable content area - will scroll, footer stays fixed */}
            <div className="flex-1 overflow-y-auto">
              {/* Unpaid Queue */}
              <div className="border-b border-white/8">
                <button
                  onClick={() => setUnpaidCollapsed((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
                    <span className="text-xs font-black text-white uppercase tracking-wider">
                      Unpaid Queue
                    </span>
                    {!loadingUnpaid &&
                      (unpaidEntries.length > 0 ? (
                        <span className="text-[10px] bg-amber-500 text-black font-black px-1.5 py-0.5 rounded-full">
                          {unpaidEntries.length}
                        </span>
                      ) : (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded-full">
                          Clear
                        </span>
                      ))}
                  </div>
                  <svg
                    className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${unpaidCollapsed ? "-rotate-90" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {!unpaidCollapsed && (
                  <div className="max-h-32 overflow-y-auto">
                    {loadingUnpaid ? (
                      Array.from({ length: 2 }).map((_, i) => (
                        <SkeletonQueueRow key={i} />
                      ))
                    ) : unpaidEntries.length === 0 ? (
                      <div className="px-4 py-5 text-center">
                        <div className="w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
                          <svg
                            className="w-4 h-4 text-emerald-400"
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
                        <p className="text-gray-600 text-xs">
                          All services paid
                        </p>
                      </div>
                    ) : (
                      unpaidEntries.map((entry) => {
                        const price = parseFloat(entry.price ?? 0);
                        const alreadyIn = cart.some(
                          (c) => c._queueId === entry.id,
                        );
                        return (
                          <div
                            key={entry.id}
                            className={`flex items-center gap-2.5 px-4 py-2.5 border-b border-white/5 last:border-0 transition-colors ${alreadyIn ? "bg-emerald-500/5" : "hover:bg-white/[0.02]"}`}
                          >
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${entry.source === "walk_in"
                                  ? "bg-purple-500/15 text-purple-400"
                                  : "bg-blue-500/15 text-blue-400"
                                }`}
                            >
                              {getInitial(entry.customer_name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-white text-xs font-semibold truncate leading-tight">
                                {entry.customer_name}
                              </div>
                              <div className="text-gray-500 text-[10px] truncate leading-tight">
                                {entry.service}
                              </div>
                            </div>
                            <div className="shrink-0">
                              {price === 0 ? (
                                <span className="text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold">
                                  Set price
                                </span>
                              ) : (
                                <span className="text-xs text-white font-bold">
                                  ₱{fmt(price)}
                                </span>
                              )}
                            </div>
                            {alreadyIn ? (
                              <div className="w-6 h-6 bg-emerald-500/20 rounded-lg flex items-center justify-center shrink-0">
                                <svg
                                  className="w-3 h-3 text-emerald-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2.5}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </div>
                            ) : (
                              <button
                                onClick={() => pullFromQueue(entry)}
                                className="w-6 h-6 bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/25 text-amber-400 rounded-lg flex items-center justify-center shrink-0 transition-all font-black text-sm"
                              >
                                +
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Customer info */}
              <div className="px-4 py-3 border-b border-white/8 bg-white/[0.015]">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
                  Customer
                </p>
                <div className="space-y-1.5">
                  {[
                    { key: "name", placeholder: "Name *", type: "text" },
                    { key: "phone", placeholder: "Phone", type: "tel" },
                  ].map((f) => (
                    <input
                      key={f.key}
                      type={f.type}
                      placeholder={f.placeholder}
                      value={customerInfo[f.key]}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          [f.key]: e.target.value,
                        })
                      }
                      className="w-full bg-gray-800/50 border border-white/8 text-white placeholder-gray-600 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-500/50 transition-all"
                    />
                  ))}
                </div>
              </div>

              {/* Cart header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  Cart · {cart.length} item{cart.length !== 1 ? "s" : ""}
                </span>
                {cart.length > 0 && (
                  <button
                    onClick={() => {
                      if (window.confirm("Clear cart?")) setCart([]);
                    }}
                    className="text-[10px] text-gray-600 hover:text-red-400 transition-colors font-semibold uppercase tracking-wide"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Cart items - scrollable area */}
              <div className="px-3 py-2">
                {cart.length === 0 ? (
                  <div className="py-8 text-center">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <svg
                        className="w-5 h-5 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-600 text-xs">Cart is empty</p>
                    <p className="text-gray-700 text-[10px] mt-0.5">
                      Add services, products, or pull from queue
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {cart.map((item) => (
                      <div
                        key={`${item.type}-${item.id}`}
                        className={`rounded-xl p-3 border ${item.type === "queue"
                            ? item._needsPrice || item._price === 0
                              ? "bg-amber-500/8 border-amber-500/30"
                              : "bg-amber-500/5 border-amber-500/15"
                            : item.type === "product"
                              ? "bg-emerald-500/5 border-emerald-500/10"
                              : "bg-gray-800/60 border-white/5"
                          }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="text-white font-semibold text-xs truncate leading-tight">
                              {item.name}
                            </div>
                            <div
                              className={`text-[10px] mt-0.5 font-medium ${item.type === "service"
                                  ? "text-red-400/60"
                                  : item.type === "product"
                                    ? "text-emerald-400/60"
                                    : "text-amber-400/60"
                                }`}
                            >
                              {item.type === "service"
                                ? "Service"
                                : item.type === "product"
                                  ? "Product"
                                  : "Queue service"}
                            </div>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id, item.type)}
                            className="text-gray-600 hover:text-red-400 transition-colors p-0.5 shrink-0"
                          >
                            <svg
                              className="w-3 h-3"
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

                        <div className="flex items-center gap-2">
                          {item.type !== "queue" ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.id,
                                    item.type,
                                    item.quantity - 1,
                                  )
                                }
                                className="w-5 h-5 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center text-white text-xs transition-colors"
                              >
                                −
                              </button>
                              <span className="text-xs font-bold text-white w-4 text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.id,
                                    item.type,
                                    item.quantity + 1,
                                  )
                                }
                                className="w-5 h-5 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center text-white text-xs transition-colors"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-amber-400/50">
                              qty 1
                            </span>
                          )}

                          <div className="flex items-center gap-1 flex-1">
                            <span className="text-gray-500 text-xs">₱</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item._price || ""}
                              onChange={(e) =>
                                updatePrice(item.id, item.type, e.target.value)
                              }
                              placeholder={
                                item.type === "queue" ? "Enter price" : ""
                              }
                              className={`flex-1 bg-gray-800/80 border rounded px-2 py-1 text-xs text-white font-bold focus:outline-none transition-all min-w-0 ${item.type === "queue" && item._price === 0
                                  ? "border-amber-500/60 focus:border-amber-400 placeholder-amber-600/60"
                                  : "border-white/10 focus:border-red-500/50"
                                }`}
                            />
                          </div>

                          <span className="text-white font-bold text-xs shrink-0">
                            = ₱{fmt(item._price * item.quantity)}
                          </span>
                        </div>

                        {item.type === "queue" && item._price === 0 && (
                          <div className="mt-1.5 flex items-center gap-1 text-amber-400 text-[10px]">
                            <svg
                              className="w-3 h-3 shrink-0"
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
                            Enter the service price to continue
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── FIXED FOOTER: Payment + Total + Button (ALWAYS VISIBLE) ── */}
            <div className="border-t border-white/8 bg-gray-900/95 backdrop-blur-sm px-4 pt-3 pb-4 space-y-2 shrink-0">
              {/* Payment Method */}
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
                  Payment Method
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { key: "cash", label: "Cash", icon: "💵" },
                    { key: "gcash", label: "GCash", icon: "📱" },
                  ].map((m) => (
                    <button
                      key={m.key}
                      onClick={() => {
                        setPaymentMethod(m.key);
                        setAmountGiven("");
                      }}
                      className={`py-2 rounded-xl text-xs font-black transition-all border flex items-center justify-center gap-1 ${paymentMethod === m.key
                          ? "bg-red-600/20 border-red-500/50 text-red-400 shadow-lg shadow-red-600/10"
                          : "bg-gray-800/60 border-white/8 text-gray-500 hover:text-gray-300 hover:border-white/15"
                        }`}
                    >
                      <span className="text-sm">{m.icon}</span>
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Cash amount input + presets */}
                {paymentMethod === "cash" && (
                  <div className="mt-2 space-y-1.5">
                    <input
                      type="number"
                      placeholder="Amount given (₱)"
                      value={amountGiven}
                      onChange={(e) => setAmountGiven(e.target.value)}
                      className="w-full bg-gray-800/60 border border-white/10 text-white placeholder-gray-600 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-red-500/50 transition-all"
                    />
            
                  </div>
                )}
              </div>

              {/* Total row */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm text-gray-400">Total</span>
                <span className="text-2xl font-black text-white">
                  ₱{fmt(total)}
                </span>
              </div>

              {/* Cash change display */}
              {paymentMethod === "cash" && amountGiven && (
                <div
                  className={`flex justify-between text-xs font-bold px-3 py-1.5 rounded-lg border ${change >= 0
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : "bg-red-500/10 border-red-500/20 text-red-400"
                    }`}
                >
                  <span>{change >= 0 ? "Change" : "Short"}</span>
                  <span>
                    {change >= 0
                      ? `₱${fmt(change)}`
                      : `₱${fmt(Math.abs(change))}`}
                  </span>
                </div>
              )}

              {/* Warnings */}
              {hasMissingPrice && (
                <div className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                  <svg
                    className="w-3 h-3 shrink-0"
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
                  Enter price for all queue items first
                </div>
              )}
              {error && (
                <div className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                  <svg
                    className="w-3 h-3 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {error}
                </div>
              )}

              {/* Pay button */}
              <button
                onClick={handleCheckout}
                disabled={checkingOut || cart.length === 0 || hasMissingPrice}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 text-sm"
              >
                {checkingOut ? (
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
                      className="w-4 h-4"
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
                    Pay ₱{fmt(total)}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {receipt && (
        <ReceiptModal {...receipt} onClose={() => setReceipt(null)} />
      )}
    </StaffLayout>
  );
}

export default StaffPOS;
