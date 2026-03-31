import React from "react";
import logo from "../../assets/otokwikklogo.png";

function Footer() {
  const legalLinks = [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
  ];

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative overflow-hidden bg-black text-white border-t border-white/10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-16 -top-28 h-[420px] w-[420px] rotate-[24deg] border border-red-500/20" />
        <div className="absolute right-40 top-32 h-[420px] w-[420px] rotate-[24deg] border border-white/10" />
        <div className="absolute right-20 bottom-[-240px] h-[460px] w-[460px] rotate-[24deg] border border-red-500/15" />
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col gap-14 px-6 py-20 lg:flex-row lg:justify-between">
        <div className="max-w-md">
          <div className="mb-8 flex items-center gap-3">
            <img src={logo} alt="Otokwikk logo" className="h-12 w-auto object-contain drop-shadow-[0_0_22px_rgba(220,38,38,0.25)]" />
          </div>

          <p className="max-w-sm text-2xl leading-relaxed text-gray-200">
            Professional auto detailing services across Metro Manila with precision, consistency, and premium care.
          </p>



          <button
            onClick={handleBackToTop}
            className="mt-10 inline-flex items-center gap-3 border border-red-500/60 bg-red-600/10 px-6 py-3 text-sm font-semibold tracking-[0.16em] text-white transition hover:bg-red-600/20"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <path d="M12 19V6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="m6 12 6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            BACK TO TOP
          </button>
        </div>

        <div>
          <h3 className="mb-6 text-lg font-semibold text-white">Legal</h3>
          <ul className="space-y-4 text-lg text-gray-300">
            {legalLinks.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  className="underline-offset-4 transition hover:text-red-400 hover:underline"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 bg-[#7f1d1d] px-6 py-2.5 text-center text-xs font-semibold tracking-wide text-white/90">
        Copyright © 2026, otokwikk. All Rights Reserved.
      </div>
    </footer>
  );
}

export default Footer;
