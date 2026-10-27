import React, { useState } from "react";
import logo from "../../assets/otokwikklogo.png";
import { useTheme } from "../../context/ThemeContext.jsx";
import { Link } from "react-router-dom";

function Footer() {
  const { isDark = true } = useTheme?.() || {};
  const [showLegalModal, setShowLegalModal] = useState(false);

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer
      className={`relative overflow-hidden transition-colors duration-300 border-t ${
        isDark
          ? "bg-[#09090b] text-white border-white/10"
          : "bg-white text-gray-900 border-gray-200 shadow-sm"
      }`}
    >
      {/* Subtle decorative geometric background accents */}
      <div className="pointer-events-none absolute inset-0 hidden sm:block">
        <div
          className={`absolute -right-16 -top-28 h-[420px] w-[420px] rotate-[24deg] border ${
            isDark ? "border-red-500/15" : "border-red-500/10"
          }`}
        />
        <div
          className={`absolute right-40 top-32 h-[420px] w-[420px] rotate-[24deg] border ${
            isDark ? "border-white/5" : "border-gray-200"
          }`}
        />
        <div
          className={`absolute right-20 bottom-[-240px] h-[460px] w-[460px] rotate-[24deg] border ${
            isDark ? "border-red-500/10" : "border-red-500/5"
          }`}
        />
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col gap-10 sm:gap-14 px-6 py-14 sm:py-16 lg:flex-row lg:justify-between">
        {/* Brand Column */}
        <div className="max-w-md">
          <div className="mb-6 flex items-center gap-3">
            <Link to="/" className="inline-block">
              <img
                src={logo}
                alt="Otokwikk logo"
                className="h-10 sm:h-12 w-auto object-contain drop-shadow-[0_0_22px_rgba(220,38,38,0.25)]"
              />
            </Link>
          </div>

          <p
            className={`max-w-sm text-sm sm:text-base leading-relaxed font-medium ${
              isDark ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Professional auto detailing services across Metro Manila, Cavite, and Rizal with precision,
            consistency, and premium care.
          </p>

          {/* Polished Back to Top Button */}
          <div className="mt-8 sm:mt-10">
            <button
              type="button"
              onClick={handleBackToTop}
              className="group inline-flex items-center gap-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white !text-white px-5 sm:px-6 py-3 rounded-xl text-xs sm:text-sm font-black tracking-widest uppercase transition-all duration-300 shadow-md shadow-red-600/30 hover:shadow-xl hover:shadow-red-600/40 hover:-translate-y-0.5 border border-red-500/40 cursor-pointer"
            >
              <svg
                className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-1 text-white !text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <path d="M12 19V6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="m6 12 6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-white !text-white">BACK TO TOP</span>
            </button>
          </div>
        </div>

        {/* Legal Column */}
        <div>
          <h3
            className={`mb-5 text-sm sm:text-base font-black uppercase tracking-wider flex items-center gap-2 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            <span className="w-1.5 h-3.5 bg-red-600 rounded-full inline-block" />
            Legal
          </h3>
          <ul className={`space-y-3 text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>
            <li>
              <button
                type="button"
                onClick={() => setShowLegalModal(true)}
                className="font-medium underline-offset-4 transition hover:text-red-600 dark:hover:text-red-400 hover:underline cursor-pointer text-left"
              >
                Terms, Privacy &amp; Cookie Policy
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Copyright Strip */}
      <div
        className={`border-t px-6 py-3 text-center text-xs font-semibold tracking-wide ${
          isDark
            ? "border-white/10 bg-[#7f1d1d] text-white/95"
            : "border-red-200 bg-[#7f1d1d] text-white"
        }`}
      >
        Copyright © 2026, otokwikk. All Rights Reserved.
      </div>

      {/* Consolidated Legal Policy Modal */}
      {showLegalModal && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowLegalModal(false)}
        >
          <div
            className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${
              isDark ? "bg-gray-900 border-white/10" : "bg-white border-gray-200 text-gray-900"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className={`p-5 sm:p-6 border-b flex justify-between items-center ${
                isDark ? "border-white/10 bg-gray-950/60" : "border-gray-200 bg-gray-50"
              }`}
            >
              <div>
                <h3
                  className={`text-lg sm:text-xl font-black uppercase tracking-tight ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  Terms, Privacy &amp; Cookie Policy
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  Official Legal Policies of Otokwikk Auto Service
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowLegalModal(false)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm transition-colors ${
                  isDark
                    ? "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-gray-900"
                }`}
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div
              className={`p-6 sm:p-8 overflow-y-auto space-y-6 text-sm leading-relaxed ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              <section className="space-y-2">
                <h4
                  className={`text-base font-bold uppercase tracking-wider pb-1 border-b ${
                    isDark ? "text-white border-white/10" : "text-gray-900 border-gray-200"
                  }`}
                >
                  1. Terms &amp; Conditions
                </h4>
                <p>
                  Welcome to Otokwikk. By scheduling services, visiting our branches, or using our
                  platform, you agree to comply with our service standards, appointment protocols,
                  and vehicle handling terms. We commit to delivering high-quality automotive care,
                  transparent pricing, and certified workmanship across all our locations.
                </p>
              </section>

              <section className="space-y-2 pt-4">
                <h4
                  className={`text-base font-bold uppercase tracking-wider pb-1 border-b ${
                    isDark ? "text-white border-white/10" : "text-gray-900 border-gray-200"
                  }`}
                >
                  2. Privacy Policy
                </h4>
                <p>
                  Your privacy is essential to us. Otokwikk collects customer contact information,
                  vehicle details (plate number, make, model), and service history solely for
                  processing appointments, providing warranty records, and sending service updates.
                  We do not sell or disclose your personal data to unauthorized third parties.
                </p>
              </section>

              <section className="space-y-2 pt-4">
                <h4
                  className={`text-base font-bold uppercase tracking-wider pb-1 border-b ${
                    isDark ? "text-white border-white/10" : "text-gray-900 border-gray-200"
                  }`}
                >
                  3. Cookie Policy
                </h4>
                <p>
                  Our web application utilizes functional cookies and secure session tokens to
                  maintain your login state, preserve your theme preference (dark/light mode), and
                  ensure fast page load performance. You can control cookie preferences in your
                  browser settings at any time.
                </p>
              </section>
            </div>

            {/* Modal Footer */}
            <div
              className={`p-4 border-t flex justify-end ${
                isDark ? "border-white/10 bg-gray-950/60" : "border-gray-200 bg-gray-50"
              }`}
            >
              <button
                type="button"
                onClick={() => setShowLegalModal(false)}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-red-600/30"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}

export default Footer;
