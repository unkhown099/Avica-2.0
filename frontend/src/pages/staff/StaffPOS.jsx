import React, { useState } from "react";
import StaffLayout from "./StaffLayout";

function StaffPOS() {
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("services");
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    vehicle: "",
  });

  const services = [
    {
      id: 1,
      name: "Oil Change",
      price: 1200,
      category: "Maintenance",
      duration: "30-45 mins",
    },
    {
      id: 2,
      name: "Brake Inspection",
      price: 800,
      category: "Inspection",
      duration: "20-30 mins",
    },
    {
      id: 3,
      name: "Engine Diagnostic",
      price: 1800,
      category: "Diagnostic",
      duration: "45-60 mins",
    },
    {
      id: 4,
      name: "Tire Replacement",
      price: 3500,
      category: "Maintenance",
      duration: "1 hour",
    },
    {
      id: 5,
      name: "Full Service",
      price: 3800,
      category: "Maintenance",
      duration: "2 hours",
    },
    {
      id: 6,
      name: "AC Service",
      price: 2200,
      category: "Maintenance",
      duration: "1.5 hours",
    },
    {
      id: 7,
      name: "Battery Replacement",
      price: 4800,
      category: "Parts & Service",
      duration: "30 mins",
    },
    {
      id: 8,
      name: "Brake Repair",
      price: 3200,
      category: "Repair",
      duration: "2 hours",
    },
  ];

  const products = [
    {
      id: 1,
      name: "Engine Oil 5W-30",
      price: 450,
      category: "Lubricants",
      stock: 45,
    },
    {
      id: 2,
      name: "Brake Pads Set",
      price: 2500,
      category: "Brakes",
      stock: 12,
    },
    { id: 3, name: "Air Filter", price: 350, category: "Filters", stock: 8 },
    {
      id: 4,
      name: "Battery 12V 60Ah",
      price: 4200,
      category: "Batteries",
      stock: 5,
    },
    {
      id: 5,
      name: "Tire 195/65R15",
      price: 3500,
      category: "Tires",
      stock: 24,
    },
    {
      id: 6,
      name: "Engine Oil 10W-40",
      price: 420,
      category: "Lubricants",
      stock: 32,
    },
    {
      id: 7,
      name: "Spark Plugs Set",
      price: 800,
      category: "Ignition",
      stock: 18,
    },
    {
      id: 8,
      name: "Coolant Fluid",
      price: 350,
      category: "Lubricants",
      stock: 28,
    },
  ];

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const addToCart = (item, type) => {
    const existing = cart.find((c) => c.id === item.id && c.type === type);
    if (existing) {
      setCart(
        cart.map((c) =>
          c.id === item.id && c.type === type
            ? { ...c, quantity: c.quantity + 1 }
            : c,
        ),
      );
    } else {
      setCart([...cart, { ...item, quantity: 1, type }]);
    }
  };

  const removeFromCart = (id, type) =>
    setCart(cart.filter((c) => !(c.id === id && c.type === type)));

  const updateQuantity = (id, type, qty) => {
    if (qty < 1) return;
    setCart(
      cart.map((c) =>
        c.id === id && c.type === type ? { ...c, quantity: qty } : c,
      ),
    );
  };

  const subtotal = () => cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = () => subtotal() * 0.12;
  const total = () => subtotal() + tax();
  const fmt = (n) => n.toLocaleString("en-US", { minimumFractionDigits: 2 });

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }
    if (!customerInfo.name || !customerInfo.phone) {
      alert("Please enter customer information!");
      return;
    }
    alert(`Payment processed successfully!\nTotal: ₱${fmt(total())}`);
    setCart([]);
    setCustomerInfo({ name: "", phone: "", vehicle: "" });
  };

  const handleClearCart = () => {
    if (window.confirm("Are you sure you want to clear the cart?")) setCart([]);
  };

  return (
    <StaffLayout title="" subtitle="">
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight">
            Point of Sale
          </h1>
          <p className="text-gray-400 mt-1">
            Process transactions for products and services
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products / Services Panel */}
          <div className="lg:col-span-2 bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-white/5">
              {["services", "products"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-6 py-4 text-sm font-black uppercase tracking-wider transition-all ${
                    activeTab === tab
                      ? "text-white border-b-2 border-red-500"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {tab}
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
                  placeholder={`Search ${activeTab}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-800/60 border border-white/10 text-white placeholder-gray-500 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all"
                />
              </div>
            </div>

            {/* Items Grid */}
            <div className="p-4 overflow-y-auto max-h-[600px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeTab === "services" &&
                  filteredServices.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => addToCart(service, "service")}
                      className="bg-gray-800/60 border border-white/5 rounded-xl p-4 hover:border-red-500/30 hover:bg-gray-800 transition-all text-left group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-black text-white text-sm group-hover:text-red-400 transition-colors">
                          {service.name}
                        </h3>
                        <span className="text-xs text-gray-500 bg-gray-700/60 px-2 py-0.5 rounded-full shrink-0 ml-2">
                          {service.duration}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">
                        {service.category}
                      </p>
                      <div className="text-lg font-black text-red-400">
                        ₱{service.price.toLocaleString()}
                      </div>
                    </button>
                  ))}

                {activeTab === "products" &&
                  filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product, "product")}
                      className="bg-gray-800/60 border border-white/5 rounded-xl p-4 hover:border-emerald-500/30 hover:bg-gray-800 transition-all text-left group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-black text-white text-sm group-hover:text-emerald-400 transition-colors">
                          {product.name}
                        </h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full shrink-0 ml-2 ${product.stock <= 8 ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"}`}
                        >
                          {product.stock} left
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">
                        {product.category}
                      </p>
                      <div className="text-lg font-black text-emerald-400">
                        ₱{product.price.toLocaleString()}
                      </div>
                    </button>
                  ))}
              </div>

              {((activeTab === "services" && filteredServices.length === 0) ||
                (activeTab === "products" &&
                  filteredProducts.length === 0)) && (
                <div className="py-16 text-center">
                  <p className="text-gray-500">No {activeTab} found</p>
                </div>
              )}
            </div>
          </div>

          {/* Cart Panel */}
          <div className="bg-gray-900/60 border border-white/5 rounded-2xl backdrop-blur-sm sticky top-8 flex flex-col">
            <div className="px-6 py-4 border-b border-white/5">
              <h2 className="text-lg font-black text-white">
                Cart{" "}
                <span className="text-gray-500 font-normal text-sm">
                  ({cart.length})
                </span>
              </h2>
            </div>

            {/* Customer Info */}
            <div className="p-5 border-b border-white/5 bg-white/[0.02]">
              <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">
                Customer Information
              </p>
              <div className="space-y-2.5">
                {[
                  { key: "name", placeholder: "Customer Name *", type: "text" },
                  { key: "phone", placeholder: "Phone Number *", type: "tel" },
                  {
                    key: "vehicle",
                    placeholder: "Vehicle (Optional)",
                    type: "text",
                  },
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
                    className="w-full bg-gray-800/60 border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all"
                  />
                ))}
              </div>
            </div>

            {/* Cart Items */}
            <div className="p-5 max-h-[280px] overflow-y-auto">
              {cart.length === 0 ? (
                <div className="py-10 text-center">
                  <svg
                    className="w-12 h-12 text-gray-700 mx-auto mb-3"
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
                  <p className="text-gray-600 text-sm">Cart is empty</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {cart.map((item, i) => (
                    <div
                      key={`${item.type}-${item.id}-${i}`}
                      className="bg-gray-800/60 border border-white/5 rounded-xl p-3"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-semibold text-sm truncate">
                            {item.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.type === "service" ? "Service" : "Product"}
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id, item.type)}
                          className="text-gray-600 hover:text-red-400 transition-colors ml-2 shrink-0"
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
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                item.type,
                                item.quantity - 1,
                              )
                            }
                            className="w-6 h-6 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center text-white text-sm transition-colors"
                          >
                            −
                          </button>
                          <span className="text-sm font-bold text-white w-6 text-center">
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
                            className="w-6 h-6 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center text-white text-sm transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-white font-bold text-sm">
                          ₱{(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="px-5 py-4 border-t border-white/5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-300 font-semibold">
                  ₱{fmt(subtotal())}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax (12%)</span>
                <span className="text-gray-300 font-semibold">
                  ₱{fmt(tax())}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-white/5">
                <span className="text-white font-black">Total</span>
                <span className="text-red-400 font-black text-lg">
                  ₱{fmt(total())}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="px-5 pb-5 space-y-2.5">
              <button
                onClick={handleCheckout}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-red-600/20"
              >
                Proceed to Payment
              </button>
              <button
                onClick={handleClearCart}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-semibold py-3 rounded-xl transition-all"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </StaffLayout>
  );
}

export default StaffPOS;