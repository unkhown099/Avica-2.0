import React, { useState } from "react";
import CustomerLayout from "./CustomerLayout.jsx";

const services = [
  {
    id: 1,
    category: "Exterior",
    title: "Exterior Detailing",
    desc: "Full exterior wash, clay bar treatment, polish and wax to restore your vehicle's shine.",
    price: "₱2,500",
    duration: "2–3 hrs",
    popular: true,
    icon: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12",
  },
  {
    id: 2,
    category: "Interior",
    title: "Interior Detailing",
    desc: "Deep steam cleaning, leather conditioning, odor elimination and sanitization.",
    price: "₱3,000",
    duration: "3–4 hrs",
    popular: false,
    icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  },
  {
    id: 3,
    category: "Protection",
    title: "Ceramic Coating",
    desc: "9H hardness nano-ceramic coating for long-lasting paint protection and hydrophobic finish.",
    price: "₱15,000+",
    duration: "1–2 days",
    popular: true,
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  },
  {
    id: 4,
    category: "Protection",
    title: "Paint Protection Film",
    desc: "Self-healing PPF applied to high-impact zones to prevent rock chips and scratches.",
    price: "₱25,000+",
    duration: "2–3 days",
    popular: false,
    icon: "M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  },
  {
    id: 5,
    category: "Correction",
    title: "Paint Correction",
    desc: "Multi-stage machine polishing to remove swirl marks, light scratches and oxidation.",
    price: "₱6,500+",
    duration: "4–6 hrs",
    popular: false,
    icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  },
  {
    id: 6,
    category: "Exterior",
    title: "Undercarriage Protection",
    desc: "Rubberized undercoating to prevent rust, corrosion, and road noise.",
    price: "₱8,500",
    duration: "3–4 hrs",
    popular: false,
    icon: "M19 9l-7 7-7-7",
  },
  {
    id: 7,
    category: "Full Package",
    title: "Full Detailing Package",
    desc: "Complete exterior + interior detailing for the ultimate vehicle transformation.",
    price: "₱5,000",
    duration: "5–6 hrs",
    popular: true,
    icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
  },
  {
    id: 8,
    category: "Interior",
    title: "Interior Deep Extraction",
    desc: "Industrial wet-vacuum extraction for upholstery, carpets and hard-to-reach areas.",
    price: "₱3,500",
    duration: "2–3 hrs",
    popular: false,
    icon: "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z",
  },
];

const categories = [
  "All",
  "Exterior",
  "Interior",
  "Protection",
  "Correction",
  "Full Package",
];

function ServicesPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = services.filter((s) => {
    const matchCat = activeCategory === "All" || s.category === activeCategory;
    const matchSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.desc.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <CustomerLayout>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-950/30 p-4 sm:p-6 lg:p-8">
        {" "}
        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">
            Our <span className="text-red-600">Services</span>
          </h1>
          <p className="text-gray-400">
            Professional auto detailing services crafted to keep your vehicle in
            showroom condition.
          </p>
        </div>
        {/* Search + Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
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
              className="w-full bg-gray-900 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition-colors"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 ${
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
        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((service) => (
            <div
              key={service.id}
              className="group bg-gradient-to-br from-gray-900 to-red-950/10 rounded-2xl p-6 border border-white/5 hover:border-red-600/50 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
            >
              {service.popular && (
                <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-black px-2 py-1 rounded-full uppercase tracking-wider">
                  Popular
                </div>
              )}
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
                    d={service.icon}
                  />
                </svg>
              </div>
              <div className="text-xs font-bold text-red-600 uppercase tracking-widest mb-1">
                {service.category}
              </div>
              <h3 className="text-lg font-black text-white mb-2">
                {service.title}
              </h3>
              <p className="text-gray-400 text-sm mb-5 leading-relaxed">
                {service.desc}
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-black text-white">
                    {service.price}
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
                <button className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg shadow-red-600/20 text-sm">
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-24 text-gray-500">
            <svg
              className="w-16 h-16 mx-auto mb-4 opacity-30"
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
            <p className="text-lg font-semibold">No services found</p>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}

export default ServicesPage;
