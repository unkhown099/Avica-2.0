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

          <div className="mt-10 flex items-center gap-4 text-white/90">
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X"
              className="rounded-md border border-white/10 p-2 transition hover:border-red-500/50 hover:bg-red-600/10"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.901 1.154h3.68l-8.03 9.178L24 22.846h-7.406l-5.8-7.584-6.64 7.584H.471l8.59-9.816L0 1.154h7.594l5.24 6.932L18.901 1.154zm-1.29 19.492h2.04L6.486 3.24H4.298l13.313 17.406z" />
              </svg>
            </a>
            <a
              href="https://www.linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="rounded-md border border-white/10 p-2 transition hover:border-red-500/50 hover:bg-red-600/10"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M4.98 3.5C4.98 4.88 3.86 6 2.48 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V24h-4V8zm7 0h3.84v2.18h.06c.53-1.01 1.84-2.18 3.79-2.18C19.24 8 21 10.05 21 13.76V24h-4v-8.93c0-2.13-.04-4.87-2.97-4.87-2.97 0-3.43 2.32-3.43 4.72V24h-4V8z" />
              </svg>
            </a>
            <a
              href="https://www.instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="rounded-md border border-white/10 p-2 transition hover:border-red-500/50 hover:bg-red-600/10"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M7.75 2h8.5A5.75 5.75 0 0122 7.75v8.5A5.75 5.75 0 0116.25 22h-8.5A5.75 5.75 0 012 16.25v-8.5A5.75 5.75 0 017.75 2zm0 1.5A4.25 4.25 0 003.5 7.75v8.5A4.25 4.25 0 007.75 20.5h8.5a4.25 4.25 0 004.25-4.25v-8.5a4.25 4.25 0 00-4.25-4.25h-8.5zm8.88 1.62a1.1 1.1 0 110 2.2 1.1 1.1 0 010-2.2zM12 7a5 5 0 110 10 5 5 0 010-10zm0 1.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z" />
              </svg>
            </a>
            <a
              href="https://www.facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="rounded-md border border-white/10 p-2 transition hover:border-red-500/50 hover:bg-red-600/10"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M13.5 22v-8.2h2.8l.42-3.2H13.5V8.57c0-.93.26-1.56 1.62-1.56h1.73V4.15c-.3-.04-1.33-.13-2.52-.13-2.49 0-4.2 1.52-4.2 4.31v2.41H7.3v3.2h2.83V22h3.37z" />
              </svg>
            </a>
          </div>

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
