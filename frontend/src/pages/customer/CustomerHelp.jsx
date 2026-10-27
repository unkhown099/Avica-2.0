import React, { useState, useMemo } from "react";
import CustomerLayout from "./CustomerLayout";
import { useTheme } from "../../context/ThemeContext.jsx";

const faqsData = [
  {
    category: "Payment",
    q: "What payment methods do you accept?",
    a: "We only accept on-the-spot payment via Cash or GCash directly at the cashier once your vehicle service is completed. No advance online payment is required.",
  },
  {
    category: "Payment",
    q: "Do I need to pay online when booking an appointment?",
    a: "No online payment is needed. Booking an appointment is completely free. You will settle your payment on the spot via Cash or GCash with the cashier at the branch.",
  },
  {
    category: "Bookings",
    q: "How do I reschedule a booking?",
    a: "Go to My Bookings, find your appointment and click the 'Reschedule' button. You can choose a new date and time up to 24 hours before your scheduled service.",
  },
  {
    category: "Bookings",
    q: "Can I cancel my booking for free?",
    a: "Cancellations made 24+ hours in advance are completely free. Cancellations within 24 hours can be requested online through your customer portal.",
  },
  {
    category: "Services",
    q: "How long does detailing take?",
    a: "Service duration depends on the package: Exterior Detailing (2–3 hrs), Interior Detailing (3–4 hrs), Full Detailing Package (5–6 hrs), Ceramic Coating (1–2 days).",
  },
  {
    category: "Services",
    q: "Do you offer mobile detailing?",
    a: "Yes! We offer home and mobile detailing within Metro Manila and Cavite. Transport and setup fees may vary depending on your location.",
  },
  {
    category: "General",
    q: "How does the Car AI Analysis work?",
    a: "Take or upload photos of your vehicle (Front, Rear, Side, and Condition). Our Vision AI instantly validates and analyzes your vehicle to suggest tailored detailing and maintenance packages.",
  },
  {
    category: "General",
    q: "Where are your branch locations?",
    a: "We have active branches in Tanza (Cavite), San Mateo (Rizal), South Caloocan, and North Caloocan. You can select your preferred branch during appointment booking or view branch details in the location selector.",
  },
];

const CATEGORIES = ["All", "Payment", "Bookings", "Services", "General"];

function HelpPage() {
  const { isDark } = useTheme();
  const [openFaq, setOpenFaq] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqs = useMemo(() => {
    return faqsData.filter((faq) => {
      const matchCat = activeCategory === "All" || faq.category === activeCategory;
      const matchQuery =
        !searchQuery.trim() ||
        faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.a.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [activeCategory, searchQuery]);

  return (
    <CustomerLayout>
      <div className={`min-h-screen p-4 sm:p-6 lg:p-8 transition-colors duration-200 ${isDark ? "bg-gradient-to-br from-black via-gray-900 to-red-950/30 text-white" : "bg-gray-50 text-gray-900"}`}>
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center sm:text-left">
            <h1 className={`text-3xl sm:text-4xl font-bold mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>
              Help & <span className="text-red-600">Support</span>
            </h1>
            <p className={`text-sm sm:text-base ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              Frequently asked questions, on-the-spot payment guidance, and customer assistance.
            </p>
          </div>

          {/* Contact Cards - Call Us and Email Us only (Live Chat removed as requested) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 max-w-2xl mx-auto sm:mx-0">
            {[
              {
                icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
                label: "Call Us",
                value: "+63 2 1234 5678",
                sub: "Mon–Sat, 8AM–6PM",
              },
              {
                icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
                label: "Email Us",
                value: "support@otokwikk.com",
                sub: "Response within 24hrs",
              },
            ].map(({ icon, label, value, sub }) => (
              <div
                key={label}
                className={`rounded-2xl p-5 sm:p-6 border transition-all duration-300 hover:-translate-y-1 group flex items-center gap-4 ${
                  isDark
                    ? "bg-gradient-to-br from-gray-900 to-red-950/10 border-white/5 hover:border-red-600/40"
                    : "bg-white border-gray-200 hover:border-red-500/40 shadow-sm"
                }`}
              >
                <div className="w-12 h-12 bg-red-600/10 group-hover:bg-red-600 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300">
                  <svg
                    className="w-6 h-6 text-red-500 group-hover:text-white transition-colors duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                  </svg>
                </div>
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                    {label}
                  </p>
                  <p className={`font-bold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>{value}</p>
                  <p className={`text-xs mt-0.5 ${isDark ? "text-gray-500" : "text-gray-500"}`}>{sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Payment Notice Banner */}
          <div className={`p-4 rounded-2xl border mb-8 flex items-start gap-3 ${
            isDark ? "bg-red-950/20 border-red-500/30 text-gray-200" : "bg-red-50 border-red-200 text-gray-800"
          }`}>
            <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 font-black text-sm">
              ₱
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-red-500">
                Payment Policy: On-The-Spot Cashier Only
              </p>
              <p className="text-xs mt-1 leading-relaxed">
                All services are paid <strong>on the spot via Cash or GCash</strong> directly at the branch cashier after your service is rendered. No online payment or card pre-payment is collected through this website.
              </p>
            </div>
          </div>

          {/* Frequently Asked Questions */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <h2 className={`text-xl sm:text-2xl font-black ${isDark ? "text-white" : "text-gray-900"}`}>
                Frequently Asked Questions
              </h2>
            </div>

            {/* Search & Category Filter */}
            <div className="space-y-3 mb-6">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search questions (e.g. payment, gcash, reschedule, branch)..."
                  className={`w-full border rounded-xl px-4 py-3 pl-10 text-sm focus:outline-none focus:border-red-600 transition-colors ${
                    isDark
                      ? "bg-gray-900/80 border-white/10 text-white placeholder-gray-500"
                      : "bg-white border-gray-200 text-gray-900 placeholder-gray-400 shadow-sm"
                  }`}
                />
                <svg
                  className={`w-4 h-4 absolute left-3.5 top-3.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      activeCategory === cat
                        ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                        : isDark
                        ? "bg-gray-900/60 text-gray-400 hover:bg-gray-800 hover:text-white border border-white/5"
                        : "bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200 shadow-sm"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Accordion List */}
            <div className="space-y-3">
              {filteredFaqs.length === 0 ? (
                <div className={`py-12 text-center rounded-2xl border ${isDark ? "bg-gray-900/40 border-white/5" : "bg-white border-gray-200"}`}>
                  <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>No matching questions found.</p>
                </div>
              ) : (
                filteredFaqs.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div
                      key={idx}
                      className={`rounded-2xl border transition-all overflow-hidden ${
                        isOpen
                          ? isDark
                            ? "border-red-600/50 bg-gray-900 shadow-lg shadow-red-950/20"
                            : "border-red-500/50 bg-white shadow-md"
                          : isDark
                          ? "border-white/5 bg-gradient-to-br from-gray-900 to-red-950/10 hover:border-red-600/30"
                          : "bg-white border-gray-200 hover:border-red-400/40 shadow-sm"
                      }`}
                    >
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        className="w-full flex items-center justify-between p-4 sm:p-5 text-left"
                      >
                        <div className="flex items-center gap-2.5 pr-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shrink-0 ${
                            faq.category === "Payment"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-red-600/20 text-red-500"
                          }`}>
                            {faq.category}
                          </span>
                          <span className={`font-bold text-sm sm:text-base ${isDark ? "text-white" : "text-gray-900"}`}>
                            {faq.q}
                          </span>
                        </div>
                        <svg
                          className={`w-5 h-5 text-red-500 shrink-0 transition-transform duration-300 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                          <p className={`text-sm sm:text-base leading-relaxed border-t pt-3.5 ${isDark ? "text-gray-300 border-white/5" : "text-gray-600 border-gray-100"}`}>
                            {faq.a}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}

export default HelpPage;