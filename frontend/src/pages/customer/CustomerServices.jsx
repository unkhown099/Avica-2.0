import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CustomerLayout from "./CustomerLayout.jsx";
import { API_BASE } from "../../hooks/useAuth.js";

const SERVICE_ICON =
  "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z";

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
            "Content-Type": "application/json",
          },
        });
        if (!res.ok)
          throw new Error(`Failed to fetch categories (${res.status})`);
        const data = await res.json();
        const rows = Array.isArray(data) ? data : data.results || [];
        setCategories(rows.map((c) => c.name).filter(Boolean));
      } catch (err) {
        setCategoriesError(err.message || "Failed to load categories.");
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
            "Content-Type": "application/json",
          },
        });
        if (!res.ok)
          throw new Error(`Failed to fetch services (${res.status})`);
        const data = await res.json();
        setServices(Array.isArray(data) ? data : data.results || []);
      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };
    const debounce = setTimeout(fetchServices, 300);
    return () => clearTimeout(debounce);
  }, [activeCategory, search, authHeaderValue]);

  const categoryOptions = [
    "All",
    ...new Set([
      ...categories,
      ...services.map((s) => s.category).filter(Boolean),
    ]),
  ];

  return (
    <CustomerLayout>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-950/30">
        {/* ── Hero ── */}
        <div className="px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-4 sm:pb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1">
            Our <span className="text-red-600">Services</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-400">
            Professional auto detailing services crafted to keep your vehicle in
            showroom condition.
          </p>
        </div>

        {/* ── Search ── */}
        <div className="px-4 sm:px-6 lg:px-8 mb-3 sm:mb-4">
          <div className="relative">
            <svg
              className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500"
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
              placeholder="Search services…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-900 border border-white/10 rounded-xl pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition-colors"
            />
          </div>
        </div>

        {/* ── Category Pills — horizontal scroll on mobile ── */}
        <div className="mb-5 sm:mb-6 md:mb-8">
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 sm:px-6 lg:px-8 pb-1">
            {categoryOptions.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 ${
                  activeCategory === cat
                    ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                    : "bg-gray-900 text-gray-400 border border-white/10 hover:border-red-600/40 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
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
                  className="group bg-gray-900/80 border border-white/5 rounded-2xl overflow-hidden active:scale-[0.98] transition-transform duration-150"
                >
                  {/* Top accent stripe */}
                  <div className="h-0.5 bg-gradient-to-r from-red-600 to-red-900 w-full" />

                  <div className="flex items-center gap-4 p-4">
                    {/* Icon */}
                    <div className="w-11 h-11 bg-red-600/10 rounded-xl flex items-center justify-center shrink-0">
                      <svg
                        className="w-5 h-5 text-red-500"
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
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-0.5">
                        {service.category}
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
                        onClick={() =>
                          navigate("/bookings", {
                            state: {
                              openBooking: true,
                              prefillServiceId: service.id,
                            },
                          })
                        }
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
                  className="group bg-gradient-to-br from-gray-900 to-red-950/10 rounded-2xl p-6 border border-white/5 hover:border-red-600/50 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
                >
                  <div className="w-12 h-12 bg-red-600/10 group-hover:bg-red-600 rounded-xl flex items-center justify-center mb-4 transition-all duration-300">
                    <svg
                      className="w-6 h-6 text-red-500 group-hover:text-white transition-colors duration-300"
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
                  </div>
                  <div className="text-xs font-bold text-red-600 uppercase tracking-widest mb-1">
                    {service.category}
                  </div>
                  <h3 className="text-lg font-black text-white mb-2">
                    {service.name}
                  </h3>
                  <p className="text-gray-400 text-sm mb-5 leading-relaxed">
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
                      onClick={() =>
                        navigate("/bookings", {
                          state: {
                            openBooking: true,
                            prefillServiceId: service.id,
                          },
                        })
                      }
                      className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg shadow-red-600/20 text-sm"
                    >
                      Book Now
                    </button>
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
    </CustomerLayout>
  );
}

export default ServicesPage;