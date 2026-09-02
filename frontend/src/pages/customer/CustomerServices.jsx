import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CustomerLayout from "./CustomerLayout.jsx";
import { API_BASE } from "../../hooks/useAuth.js";

const SERVICE_ICON =
  "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z";

const CATEGORY_COLORS = {
  Maintenance: {
    badge: "bg-red-500/20 text-red-400 border-red-500/30",
    accent: "#ef4444",
  },
  Repair: {
    badge: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    accent: "#f59e0b",
  },
  Diagnostic: {
    badge: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    accent: "#a855f7",
  },
  Cosmetic: {
    badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    accent: "#3b82f6",
  },
  "Premium Carwash": {
    badge: "bg-sky-500/20 text-sky-400 border-sky-500/30",
    accent: "#0ea5e9",
  },
  "Engine Steamed Wash": {
    badge: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    accent: "#06b6d4",
  },
  "Under Wash": {
    badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    accent: "#3b82f6",
  },
  "Premium Hand Wax": {
    badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    accent: "#10b981",
  },
  Buffing: {
    badge: "bg-teal-500/20 text-teal-400 border-teal-500/30",
    accent: "#14b8a6",
  },
  "Headlight Restoration": {
    badge: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    accent: "#f43f5e",
  },
  "Interior Detailing": {
    badge: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    accent: "#6366f1",
  },
  "Exterior Detailing": {
    badge: "bg-violet-500/20 text-violet-400 border-violet-500/30",
    accent: "#8b5cf6",
  },
  "Acid Rain Removal (Glass)": {
    badge: "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30",
    accent: "#d946ef",
  },
  "All Shine": {
    badge: "bg-lime-500/20 text-lime-400 border-lime-500/30",
    accent: "#84cc16",
  },
  "Ceramic Coating": {
    badge: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    accent: "#f97316",
  },
};

const PRICE_TIERS = [
  { key: "motor", label: "Motorcycle" },
  { key: "small", label: "Small (Sedan/Hatch)" },
  { key: "medium", label: "Medium (CUV/SUV)" },
  { key: "large", label: "Large (Van/Pickup)" },
  { key: "xl", label: "XL (Commercial/Bus)" },
];

const FALLBACK_CATEGORIES = [
  "Maintenance",
  "Repair",
  "Diagnostic",
  "Cosmetic",
];

const CategoryBadge = ({ category }) => (
  <span
    className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-black/60 text-white border-white/20 backdrop-blur-md shadow-sm inline-flex items-center"
  >
    {category}
  </span>
);

function ServicesPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);

  const handleServiceClick = (svc) => {
    setSelectedService(svc);
    // Auto-select first available tier if price_list exists
    if (svc.price_list && Object.keys(svc.price_list).length > 0) {
      const firstTier = PRICE_TIERS.find((t) => svc.price_list[t.key]);
      setSelectedTier(firstTier?.key || null);
    } else {
      setSelectedTier(null);
    }
  };

  const authHeaderValue =
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        setCategoriesError(null);
        const res = await fetch(`${API_BASE}/services/categories/`, {
          headers: {
            Authorization: `Bearer ${authHeaderValue}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setCategories(data.map((c) => c.name || c));
          } else {
            setCategories([]);
          }
        } else {
          setCategories([]);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, [authHeaderValue]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        if (activeCategory !== "All") params.append("category", activeCategory);
        if (search.trim()) params.append("search", search.trim());

        const res = await fetch(`${API_BASE}/services/?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${authHeaderValue}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setServices(Array.isArray(data) ? data : data.results || []);
        } else {
          setError("Failed to load services");
        }
      } catch (err) {
        console.error("Failed to fetch services:", err);
        setError("Failed to connect to server");
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchServices, 300);
    return () => clearTimeout(timer);
  }, [activeCategory, search, authHeaderValue]);

  const categoryOptions = React.useMemo(() => {
    const options = ["All"];
    if (categories.length > 0) {
      categories.forEach((c) => {
        if (!options.includes(c)) options.push(c);
      });
    } else if (services.length > 0) {
      services.forEach((s) => {
        if (s.category && !options.includes(s.category)) {
          options.push(s.category);
        }
      });
    } else {
      FALLBACK_CATEGORIES.forEach((c) => {
        if (!options.includes(c)) options.push(c);
      });
    }
    return options;
  }, [categories, services]);

  return (
    <CustomerLayout>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-950/30">
        {/* ── Hero ── */}
        <div className="px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-4 sm:pb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-1 tracking-tight">
            Our <span className="text-red-600">Services</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-400">
            Professional auto detailing services crafted to keep your vehicle in
            showroom condition.
          </p>
        </div>

        {/* ── Search ── */}
        <div className="px-4 sm:px-6 lg:px-8 mb-4 sm:mb-6">
          <div className="relative max-w-2xl">
            <svg
              className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none"
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
              placeholder="Search services by name or description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-900/90 border border-white/10 rounded-2xl pl-11 sm:pl-12 pr-4 py-3 text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition-colors shadow-inner"
            />
          </div>
        </div>

        {/* ── Category Pills — horizontal scroll on mobile ── */}
        <div className="mb-6 sm:mb-8">
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar px-4 sm:px-6 lg:px-8 pb-2">
            {categoryOptions.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`category-pill flex-shrink-0 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "active bg-red-600 text-white shadow-lg shadow-red-600/30 border border-red-600"
                      : "bg-gray-900/80 text-gray-400 border border-white/10 hover:border-red-600/40 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {!categoriesLoading && categoriesError && (
          <p className="mb-4 text-xs text-yellow-500 px-4 sm:px-6 lg:px-8">
            {categoriesError} Using detected categories from available services.
          </p>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <div className="text-center py-24 px-4">
            <p className="text-red-400 font-semibold text-lg">{error}</p>
            <button
              onClick={() => setSearch("")}
              className="mt-4 text-sm text-gray-500 hover:text-white transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {/* ── Service Cards ── */}
        {!loading && !error && services.length > 0 && (
          <div className="px-4 sm:px-6 lg:px-8 pb-10">
            {/* MOBILE: compact horizontal-strip list */}
            <div className="flex flex-col gap-3 sm:hidden">
              {services.map((service) => (
                <div
                  key={service.id}
                  onClick={() => handleServiceClick(service)}
                  className="group bg-gray-900/80 border border-white/5 rounded-2xl overflow-hidden active:scale-[0.98] transition-all duration-150 cursor-pointer"
                >
                  {/* Top accent stripe */}
                  <div className="h-0.5 bg-gradient-to-r from-red-600 to-red-900 w-full" />

                  <div className="flex items-center gap-4 p-4">
                    {/* Image/Icon */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-red-600/10 flex items-center justify-center">
                      {service.image ? (
                        <img
                          src={service.image.startsWith('http') ? service.image : `${API_BASE}${service.image}`}
                          className="w-full h-full object-cover"
                          alt={service.name}
                        />
                      ) : (
                        <svg
                          className="w-6 h-6 text-red-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d={SERVICE_ICON}
                          />
                        </svg>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="mb-0.5">
                        <CategoryBadge category={service.category} />
                      </div>
                      <h3 className="text-sm font-black text-white truncate">
                        {service.name}
                      </h3>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {service.description}
                      </p>
                    </div>

                    {/* Price + CTA */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <div className="text-base font-black text-white">
                        {service.price_display}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-500">
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
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {service.duration}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("/bookings", {
                            state: {
                              openBooking: true,
                              prefillServiceId: service.id,
                            },
                          });
                        }}
                        className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold px-3 py-1 rounded-lg text-xs transition-colors shadow-md shadow-red-600/20"
                      >
                        Book
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* TABLET / DESKTOP: original card grid */}
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 lg:gap-6">
              {services.map((service) => (
                <div
                  key={service.id}
                  onClick={() => handleServiceClick(service)}
                  className="group bg-gray-900 border border-white/5 rounded-3xl overflow-hidden hover:border-red-600/30 transition-all duration-500 hover:-translate-y-2 flex flex-col relative cursor-pointer"
                >
                  <div className="relative aspect-[4/3] w-full bg-gray-800 overflow-hidden">
                    {service.image ? (
                      <img
                        src={service.image.startsWith('http') ? service.image : `${API_BASE}${service.image}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        alt={service.name}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                        <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={SERVICE_ICON} />
                          </svg>
                        </div>
                      </div>
                    )}
                    <div className="absolute top-3.5 left-3.5 z-10">
                      <CategoryBadge category={service.category} />
                    </div>
                  </div>

                  <div className="p-6 pt-2 flex flex-col flex-1">
                    <h3 className="text-xl font-black text-white mb-2 group-hover:text-red-500 transition-colors">
                      {service.name}
                    </h3>
                    <p className="text-gray-400 text-sm mb-6 line-clamp-2 leading-relaxed">
                      {service.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xl font-black text-white">
                          {service.price_display}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
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
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {service.duration}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("/bookings", {
                            state: {
                              openBooking: true,
                              prefillServiceId: service.id,
                            },
                          });
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg shadow-red-600/20 text-sm"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && services.length === 0 && (
          <div className="text-center py-24 text-gray-500 px-4">
            <svg
              className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 opacity-30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-base sm:text-lg font-semibold">
              No services found
            </p>
          </div>
        )}
      </div>

      {/* Hide scrollbar utility */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ── Service Detail Modal ── */}
      {selectedService && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl transition-opacity animate-in fade-in duration-500" onClick={() => setSelectedService(null)} />
          <div className="relative bg-[#0a0a0a] border border-white/5 w-full max-w-5xl rounded-[3rem] overflow-hidden shadow-[0_0_50px_-12px_rgba(239,68,68,0.3)] animate-in fade-in zoom-in duration-500 max-h-[90vh] flex flex-col lg:flex-row">
            <div className="relative lg:w-[45%] shrink-0 group aspect-[16/10] lg:aspect-auto overflow-hidden">
              {selectedService.image ? (
                <img
                  src={selectedService.image.startsWith('http') ? selectedService.image : `${API_BASE}${selectedService.image}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                  alt={selectedService.name}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-900">
                  <div className="w-24 h-24 rounded-full bg-red-600/5 flex items-center justify-center border border-red-600/10">
                    <svg className="w-10 h-10 text-red-600/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={SERVICE_ICON} />
                    </svg>
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-[#0a0a0a] pointer-events-none" />
              <div className="absolute bottom-10 left-10 flex flex-col gap-3 z-10">
                <div className="flex"><CategoryBadge category={selectedService.category} /></div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-1 bg-red-600 rounded-full" />
                  <span className="text-white/40 text-[9px] uppercase font-black tracking-[0.3em]">Premium Service</span>
                </div>
              </div>
              <button onClick={() => setSelectedService(null)} className="lg:hidden absolute top-6 right-6 w-10 h-10 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-all border border-white/20 z-20">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a]">
              <div className="hidden lg:flex items-center justify-between p-8 pb-0 shrink-0">
                <div />
                <button onClick={() => setSelectedService(null)} className="w-10 h-10 hover:bg-white/5 rounded-2xl flex items-center justify-center text-gray-500 hover:text-white transition-all group">
                  <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-8 lg:p-10 pt-4 lg:pt-6 overflow-y-auto no-scrollbar flex-1">
                <h2 className="text-4xl lg:text-5xl font-black text-white mb-6 leading-[1.1] tracking-tight">{selectedService.name}</h2>
                <div className="grid grid-cols-2 gap-4 mb-10">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-red-600/10 flex items-center justify-center shrink-0">
                      <svg
                        className="w-5 h-5 text-red-500"
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
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">
                        Duration
                      </div>
                      <div className="text-white font-bold text-sm tracking-tight">
                        {selectedService.duration}
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600/10 flex items-center justify-center shrink-0">
                      <svg
                        className="w-5 h-5 text-emerald-500"
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
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">
                        Pricing
                      </div>
                      <div className="text-emerald-400 font-black text-lg tracking-tighter">
                        {selectedService.price_display}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-10">
                  <div>
                    <div className="flex items-center gap-4 mb-4"><h4 className="text-xs font-black text-red-600 uppercase tracking-[0.2em] whitespace-nowrap">Service Description</h4><div className="h-px w-full bg-white/5" /></div>
                    <p className="text-gray-400 text-lg leading-relaxed whitespace-pre-wrap font-medium">{selectedService.description || "No full description available for this service."}</p>
                  </div>
                  {selectedService.price_list && Object.keys(selectedService.price_list).length > 0 && (
                    <div className="p-4 rounded-xl bg-red-600/5 border border-red-600/10 flex items-start gap-3">
                      <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-[10px] text-red-400 font-black uppercase tracking-widest mb-1">Price Disclosure</p>
                        <p className="text-xs text-gray-400 leading-relaxed">
                          Please note that the final price will be determined upon vehicle check-in. Our employees will professionally assess your vehicle's size and condition to apply the correct tiered pricing.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-8 lg:p-10 border-t border-white/5 bg-[#0d0d0d]/80 backdrop-blur-xl flex gap-4 shrink-0">
                <button onClick={() => { setSelectedService(null); setSelectedTier(null); }} className="flex-1 px-8 py-4 rounded-2xl border border-white/10 text-gray-500 font-bold hover:text-white hover:bg-white/5 transition-all text-sm uppercase tracking-widest">Close</button>
                <button
                  onClick={() => {
                    navigate("/bookings", {
                      state: {
                        openBooking: true,
                        prefillServiceId: selectedService.id,
                        prefillVehicleSize: selectedTier
                      }
                    });
                    setSelectedService(null);
                    setSelectedTier(null);
                  }}
                  className="flex-[2] bg-red-600 hover:bg-red-700 text-white font-black px-10 py-5 rounded-2xl transition-all shadow-[0_10px_30px_-10px_rgba(220,38,38,0.5)] active:scale-[0.98] text-lg uppercase tracking-wider"
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </CustomerLayout>
  );
}

export default ServicesPage;
