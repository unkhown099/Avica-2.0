import React, { useState, useMemo } from "react";
import CustomerLayout from "./CustomerLayout";

const faqsData = [
  {
    category: "Bookings",
    q: "How do I reschedule a booking?",
    a: "Go to My Bookings, find your appointment and click the 'Reschedule' button. You can choose a new date and time up to 24 hours before your scheduled service.",
  },
  {
    category: "Payment",
    q: "What payment methods do you accept?",
    a: "We accept cash, GCash, Maya, PayMongo, bank transfer, and all major credit/debit cards. Payment can be collected online or at the time of service.",
  },
  {
    category: "Services",
    q: "How long does detailing take?",
    a: "Service duration depends on the package: Exterior Detailing (2–3 hrs), Interior Detailing (3–4 hrs), Full Detailing Package (5–6 hrs), Ceramic Coating (1–2 days).",
  },
  {
    category: "Services",
    q: "Do you offer mobile detailing?",
    a: "Yes! We offer home and mobile detailing within Metro Manila. Transport and setup fees may vary depending on your location.",
  },
  {
    category: "General",
    q: "How does the Car AI Analysis work?",
    a: "Upload a clear photo of your vehicle. Our Gemini AI will detect the make, model, year, color, and analyze visible condition to suggest tailored service packages.",
  },
  {
    category: "Bookings",
    q: "Can I cancel my booking for free?",
    a: "Cancellations made 24+ hours in advance are completely free. Cancellations within 24 hours can be requested online through your customer portal.",
  },
  {
    category: "General",
    q: "Where are your branch locations?",
    a: "We have multiple active branches across Metro Manila. You can select your preferred branch during appointment booking or view branch details in the location selector.",
  },
];

const CATEGORIES = ["All", "Bookings", "Services", "Payment", "General"];

function HelpPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState({ subject: "", message: "" });
  const [sent, setSent] = useState(false);

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

  const handleSend = () => {
    if (!form.subject.trim() || !form.message.trim()) return;
    setSent(true);
    setForm({ subject: "", message: "" });
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <CustomerLayout>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-950/30 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">
            Help & <span className="text-red-600">Support</span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Frequently asked questions, service guides, and customer assistance.
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-10">
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
            {
              icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
              label: "Live Chat",
              value: "Chat with us",
              sub: "Available 24/7",
            },
          ].map(({ icon, label, value, sub }) => (
            <div
              key={label}
              className="bg-gradient-to-br from-gray-900 to-red-950/10 rounded-2xl p-5 sm:p-6 border border-white/5 hover:border-red-600/40 transition-all duration-300 hover:-translate-y-1 group cursor-pointer flex sm:flex-col items-center gap-4 sm:gap-0"
            >
              <div className="w-12 h-12 bg-red-600/10 group-hover:bg-red-600 rounded-xl flex items-center justify-center shrink-0 sm:mx-auto sm:mb-3 transition-all duration-300">
                <svg
                  className="w-6 h-6 text-red-500 group-hover:text-white transition-colors duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                </svg>
              </div>
              <div className="text-left sm:text-center">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  {label}
                </p>
                <p className="text-white font-bold text-sm">{value}</p>
                <p className="text-gray-500 text-xs mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ + Contact Form */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {/* FAQ Column */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-black text-white">
                Frequently Asked Questions
              </h2>
            </div>

            {/* Search & Category Filter */}
            <div className="space-y-3 mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search questions..."
                  className="w-full bg-gray-900/80 border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-red-600 transition-colors"
                />
                <svg
                  className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeCategory === cat
                        ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                        : "bg-gray-900/60 text-gray-400 hover:bg-gray-800 hover:text-white border border-white/5"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Accordion List */}
            <div className="space-y-2.5">
              {filteredFaqs.length === 0 ? (
                <div className="py-8 text-center bg-gray-900/40 rounded-xl border border-white/5">
                  <p className="text-gray-400 text-sm">No matching questions found.</p>
                </div>
              ) : (
                filteredFaqs.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div
                      key={idx}
                      className={`bg-gradient-to-br from-gray-900 to-red-950/10 rounded-xl border transition-all overflow-hidden ${
                        isOpen ? "border-red-600/40 bg-gray-900" : "border-white/5 hover:border-red-600/20"
                      }`}
                    >
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        className="w-full flex items-center justify-between p-4 text-left"
                      >
                        <div className="flex items-center gap-2 pr-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-600/20 text-red-400 shrink-0">
                            {faq.category}
                          </span>
                          <span className="text-white font-semibold text-sm">
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
                        <div className="px-4 pb-4">
                          <p className="text-gray-300 text-sm leading-relaxed border-t border-white/5 pt-3">
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

          {/* Contact Form Column */}
          <div>
            <h2 className="text-xl font-black text-white mb-4">
              Send a Message
            </h2>
            <div className="bg-gradient-to-br from-gray-900 to-red-950/10 rounded-2xl p-4 sm:p-6 border border-white/5">
              {sent ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-white font-black text-xl mb-2">
                    Message Sent!
                  </h3>
                  <p className="text-gray-400 text-sm">
                    We'll get back to you within 24 hours.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={form.subject}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, subject: e.target.value }))
                      }
                      placeholder="What's your concern?"
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-red-600 transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Message
                    </label>
                    <textarea
                      rows={6}
                      value={form.message}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, message: e.target.value }))
                      }
                      placeholder="Describe your issue in detail…"
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-red-600 transition-colors text-sm resize-none"
                    />
                  </div>
                  <button
                    onClick={handleSend}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-xl shadow-red-600/30"
                  >
                    Send Message
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}

export default HelpPage;