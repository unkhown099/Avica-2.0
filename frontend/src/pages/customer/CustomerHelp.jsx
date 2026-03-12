import React, { useState } from "react";
import CustomerLayout from "./CustomerLayout";

const faqs = [
  {
    q: "How do I reschedule a booking?",
    a: "Go to My Bookings, find your appointment and click the 'Reschedule' button. You can choose a new date and time up to 24 hours before your scheduled service.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept cash, GCash, Maya, bank transfer, and all major credit/debit cards. Payment is collected at the time of service.",
  },
  {
    q: "How long does detailing take?",
    a: "Service duration varies: Exterior Detailing (2–3 hrs), Interior Detailing (3–4 hrs), Full Package (5–6 hrs), Ceramic Coating (1–2 days). You will receive updates via SMS.",
  },
  {
    q: "Do you offer mobile detailing?",
    a: "Yes! We offer mobile detailing within Metro Manila. Additional transport fees may apply depending on your location.",
  },
  {
    q: "How does the Car AI Analysis work?",
    a: "Upload a clear photo of your vehicle. Our Gemini AI will identify the make, model, year and color, then generate personalized service recommendations.",
  },
  {
    q: "Can I cancel my booking for free?",
    a: "Cancellations made 24+ hours in advance are free of charge. Cancellations within 24 hours may incur a cancellation fee of ₱500.",
  },
];

function HelpPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const [form, setForm] = useState({ subject: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!form.subject || !form.message) return;
    setSent(true);
    setForm({ subject: "", message: "" });
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <CustomerLayout>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-950/30 p-4 sm:p-6 lg:p-8">
        {" "}
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">
            Help & <span className="text-red-600">Support</span>
          </h1>
          <p className="text-gray-400">
            We're here to help. Find answers or reach out to us.
          </p>
        </div>
        {/* Contact Cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
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
              sub: "Available now",
            },
          ].map(({ icon, label, value, sub }) => (
            <div
              key={label}
              className="bg-gradient-to-br from-gray-900 to-red-950/10 rounded-2xl p-6 border border-white/5 hover:border-red-600/40 transition-all duration-300 hover:-translate-y-1 text-center group cursor-pointer"
            >
              <div className="w-12 h-12 bg-red-600/10 group-hover:bg-red-600 rounded-xl flex items-center justify-center mx-auto mb-3 transition-all duration-300">
                <svg
                  className="w-6 h-6 text-red-500 group-hover:text-white transition-colors duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={icon}
                  />
                </svg>
              </div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                {label}
              </p>
              <p className="text-white font-bold text-sm">{value}</p>
              <p className="text-gray-500 text-xs mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          {/* FAQ */}
          <div>
            <h2 className="text-xl font-black text-white mb-4">
              Frequently Asked Questions
            </h2>
            <div className="space-y-2">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-br from-gray-900 to-red-950/10 rounded-xl border border-white/5 hover:border-red-600/20 transition-all overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <span className="text-white font-semibold text-sm pr-4">
                      {faq.q}
                    </span>
                    <svg
                      className={`w-5 h-5 text-red-600 shrink-0 transition-transform duration-300 ${openFaq === idx ? "rotate-180" : ""}`}
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
                  {openFaq === idx && (
                    <div className="px-4 pb-4">
                      <p className="text-gray-400 text-sm leading-relaxed border-t border-white/5 pt-3">
                        {faq.a}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h2 className="text-xl font-black text-white mb-4">
              Send a Message
            </h2>
            <div className="bg-gradient-to-br from-gray-900 to-red-950/10 rounded-2xl p-6 border border-white/5">
              {sent ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-green-500"
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
