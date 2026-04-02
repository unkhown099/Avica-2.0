import React, { useState, useEffect } from "react";
import Navbar from "../components/Landing/LandingNav.jsx";
import BorderGlow from "../components/Landing/BorderGlow.jsx";
import logo from "../assets/otokwikklogo.png";
import { useNavigate } from "react-router-dom";

// ─── API base ─────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

// ─── Normalize media URLs (handles relative paths from Django) ────────────────
const toAbsoluteUrl = (url) => {
  if (!url) return url;
  if (url.startsWith("http")) return url;
  // Ensure URL starts with /
  if (!url.startsWith("/")) {
    url = "/" + url;
  }
  return `${API_BASE}${url}`;
};

function getToken() {
  return (
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token")
  );
}

function getUser() {
  try {
    const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const roleRoutes = {
  admin: "/admin/dashboard",
  business_owner: "/branch-owner/dashboard",
  branch_manager: "/manager/dashboard",
  staff: "/staff/dashboard",
  employee: "/employee/dashboard",
  customer: "/dashboard",
};

// ─── Hardcoded fallback (used only if API is unreachable) ─────────────────────
const EMPTY_LANDING_CONTENT = {
  hero: {
    headline: "",
    headlineAccent: "",
    subtitle: "",
    ctaLoggedIn: "GO TO DASHBOARD",
    ctaGuest: "BOOK YOUR EXPERIENCE",
    signInPrompt: "",
    signInLabel: "SIGN IN HERE",
    imageUrl: "",
    images: [],
  },
  services: {
    sectionTitle: "",
    sectionTitleAccent: "",
    sectionSubtitle: "",
    items: [],
  },
  branches: [],
  reviews: [],
  fbPages: [],
  footer: {
    tagline: "",
    copyright: "",
    siteMapLinks: [],
    legalLinks: [],
  },
};

function normalizeLandingContent(content) {
  const data = content || {};

  // Helper to normalize a single image URL
  const normalizeImage = (url) => {
    if (!url) return "";
    return toAbsoluteUrl(url);
  };

  const heroImageUrl = normalizeImage(data.hero?.imageUrl ?? "");
  const heroImages = Array.isArray(data.hero?.images)
    ? data.hero.images
        .filter((img) => img && img.trim() !== "")
        .map(normalizeImage)
    : [];

  return {
    hero: {
      ...EMPTY_LANDING_CONTENT.hero,
      ...data.hero,
      imageUrl: heroImageUrl,
      images: heroImages.length > 0
        ? heroImages
        : heroImageUrl
          ? [heroImageUrl]
          : [],
    },
    services: {
      ...EMPTY_LANDING_CONTENT.services,
      ...data.services,
      items: Array.isArray(data.services?.items)
        ? data.services.items
        : EMPTY_LANDING_CONTENT.services.items,
    },
    branches: Array.isArray(data.branches)
      ? data.branches
      : EMPTY_LANDING_CONTENT.branches,
    reviews: Array.isArray(data.reviews)
      ? data.reviews
      : EMPTY_LANDING_CONTENT.reviews,
    fbPages: Array.isArray(data.fbPages)
      ? data.fbPages
      : EMPTY_LANDING_CONTENT.fbPages,
    footer: {
      ...EMPTY_LANDING_CONTENT.footer,
      ...data.footer,
      siteMapLinks: Array.isArray(data.footer?.siteMapLinks)
        ? data.footer.siteMapLinks
        : EMPTY_LANDING_CONTENT.footer.siteMapLinks,
      legalLinks: Array.isArray(data.footer?.legalLinks)
        ? data.footer.legalLinks
        : EMPTY_LANDING_CONTENT.footer.legalLinks,
    },
  };
}

// Icon paths for each service position (index-matched, cycles if more services added)
const SERVICE_ICONS = [
  "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  "M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z",
  "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z",
];

function LandingPage() {
  const navigate = useNavigate();
  const [pageContent, setPageContent] = useState(null);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [heroBgs, setHeroBgs] = useState([]);
  const [bgIndex, setBgIndex] = useState(0);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [user, setUser] = useState(null);
  const [activeBranch, setActiveBranch] = useState({});

  useEffect(() => {
    setUser(getUser());

    console.log("Fetching landing content from:", `${API_BASE}/api/landing-content/`);
    
    fetch(`${API_BASE}/api/landing-content/`)
      .then((r) => {
        if (!r.ok) throw new Error(`API error: ${r.status}`);
        return r.json();
      })
      .then((data) => {
        console.log("Raw landing content received:", data);
        const normalized = normalizeLandingContent(data);
        console.log("Normalized content:", normalized);
        
        setPageContent(normalized);
        setActiveBranch(normalized.branches?.[0] ?? null);
        
        // Set up hero backgrounds - prioritize images array, then single imageUrl
        let bgImages = [];
        
        // First try the images array
        if (normalized.hero.images && normalized.hero.images.length > 0) {
          bgImages = normalized.hero.images.filter(img => img && img.trim() !== "");
          console.log("Using images array for slideshow:", bgImages);
        } 
        // Fallback to single imageUrl
        else if (normalized.hero.imageUrl && normalized.hero.imageUrl.trim() !== "") {
          bgImages = [normalized.hero.imageUrl];
          console.log("Using single imageUrl for background:", bgImages);
        }
        
        setHeroBgs(bgImages);
        setBgIndex(0);
        setContentLoaded(true);
      })
      .catch((error) => {
        console.error("Failed to fetch landing content:", error);
        const normalized = normalizeLandingContent({});
        setPageContent(normalized);
        setHeroBgs([]);
        setActiveBranch(normalized.branches[0] ?? {});
        setContentLoaded(true);
      });
  }, []);

  useEffect(() => {
    if (!contentLoaded) return;

    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("reveal-visible");
            }
          });
        },
        { threshold: 0.1 },
      );

      document
        .querySelectorAll(".reveal")
        .forEach((el) => observer.observe(el));

      return () => {
        observer.disconnect();
      };
    }, 100);

    return () => clearTimeout(timer);
  }, [contentLoaded]);

  // Slideshow effect
  useEffect(() => {
    if (!contentLoaded || heroBgs.length <= 1) {
      console.log("Slideshow not started - conditions not met:", { 
        contentLoaded, 
        bgCount: heroBgs.length 
      });
      return;
    }

    console.log("Starting slideshow with", heroBgs.length, "images");
    
    const interval = setInterval(() => {
      setBgIndex((prev) => {
        const next = (prev + 1) % heroBgs.length;
        console.log(`Slideshow: ${prev} -> ${next}`);
        return next;
      });
    }, 6000);

    return () => {
      console.log("Cleaning up slideshow interval");
      clearInterval(interval);
    };
  }, [contentLoaded, heroBgs]);

  const isLoggedIn = !!getToken();

  const handleBooking = () => {
    if (isLoggedIn && user) {
      navigate(roleRoutes[user.role] || "/dashboard");
    } else {
      navigate("/signup");
    }
  };

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!contentLoaded || !pageContent) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <svg
          className="w-8 h-8 animate-spin text-red-600"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      </div>
    );
  }

  const { hero, services, branches, reviews, fbPages, footer } = pageContent;
  const filteredServices = Array.isArray(services.items) ? services.items : [];

  return (
    <div className="min-h-screen bg-black font-sans selection:bg-red-600 selection:text-white">
      <Navbar />

      {/* ── Hero Section with Slideshow ── */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background image with slideshow */}
        {heroBgs.length > 0 && (
          <div 
            className="absolute inset-0 transition-all duration-[2000ms] ease-in-out"
            style={{
              backgroundImage: `url("${heroBgs[bgIndex]}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              filter: "brightness(0.35)",
            }}
          />
        )}
        
        {/* Fallback gradient if no images */}
        {heroBgs.length === 0 && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black" />
        )}
        
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/95" />

        {/* Glow orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
          <div className="absolute top-20 left-10 w-64 h-64 md:w-96 md:h-96 bg-red-600/20 rounded-full blur-[120px] animate-pulse" />
          <div
            className="absolute bottom-20 right-10 w-80 h-80 md:w-[500px] md:h-[500px] bg-blue-600/10 rounded-full blur-[150px] animate-pulse"
            style={{ animationDelay: "2s" }}
          />
        </div>

          <div className="relative text-center">
            {/* Logo card */}
            <div className="mb-6 sm:mb-8 inline-block animate-[fadeIn_1s_ease-out]">
              <div className="bg-white/5 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <img
                  src={logo}
                  alt="Otokwikk logo"
                  className="h-10 sm:h-14 md:h-16 object-contain filter drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                />
              </div>
            </div>

            {/* Headline */}
            <h1
              className="font-black text-white mb-4 sm:mb-6 leading-[0.85] tracking-tighter
                       text-[clamp(3rem,14vw,8rem)]"
              style={{
                animation: "slideUp 1s cubic-bezier(0.2, 0.8, 0.2, 1) both",
              }}
            >
              {hero.headline}
              <br />
              <span className="text-red-600 bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-red-400">
                {hero.headlineAccent}
              </span>
            </h1>

          <p
            className="text-xs sm:text-sm md:text-lg text-gray-400 mb-8 sm:mb-10 font-bold
                       tracking-[0.2em] sm:tracking-[0.3em] uppercase max-w-2xl mx-auto opacity-80"
            style={{
              animation: "slideUp 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) 0.2s both",
            }}
          >
            {hero.subtitle}
          </p>

          <div
            style={{
              animation: "slideUp 1.4s cubic-bezier(0.2, 0.8, 0.2, 1) 0.4s both",
            }}
          >
            <button
              onClick={handleBooking}
              className="group relative bg-red-600 hover:bg-red-700 text-white font-black
                         text-base sm:text-lg md:text-xl
                         px-8 sm:px-12 md:px-14
                         py-4 sm:py-5 md:py-6
                         rounded-full transition-all duration-500
                         shadow-[0_0_50px_rgba(220,38,38,0.4)]
                         hover:shadow-[0_0_80px_rgba(220,38,38,0.6)]
                         transform hover:-translate-y-2 active:scale-95
                         w-full sm:w-auto"
            >
              <span className="relative z-10 flex items-center justify-center gap-3 sm:gap-4">
                {isLoggedIn ? hero.ctaLoggedIn : hero.ctaGuest}
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-3 transition-transform duration-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </span>
            </button>

            {!isLoggedIn && (
              <p className="mt-4 sm:mt-6 text-gray-500 text-xs sm:text-sm font-medium">
                {hero.signInPrompt}{" "}
                <a
                  href="/signin"
                  className="text-red-500 hover:text-red-400 font-bold underline underline-offset-4 decoration-2 transition-all"
                >
                  {hero.signInLabel}
                </a>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Services Section ── */}
      <section className="py-20 sm:py-28 md:py-32 bg-black relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 reveal">
          <div className="text-center mb-12 sm:mb-16 md:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 uppercase tracking-tighter">
              {services.sectionTitle}{" "}
              <span className="text-red-600">{services.sectionTitleAccent}</span>
            </h2>
            <div className="w-20 sm:w-24 h-1.5 bg-red-600 mx-auto rounded-full mb-4 sm:mb-6" />
            <p className="text-gray-500 text-base sm:text-lg font-medium max-w-2xl mx-auto px-2">
              {services.sectionSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredServices.map((svc, i) => (
              <BorderGlow
                key={i}
                className="group relative overflow-hidden"
                borderRadius={32}
                glowRadius={36}
                glowIntensity={0.8}
                colors={["#f97316", "#f43f5e", "#8b5cf6"]}
                backgroundColor="rgba(15, 23, 42, 0.85)"
              >
                <div className="relative z-10 p-8 sm:p-10">
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-red-600/5 rounded-full blur-[60px] group-hover:bg-red-600/15 transition-all duration-700" />
                  <div className="relative z-10">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-600/20 rounded-2xl flex items-center justify-center mb-6 sm:mb-8 border border-red-600/30 group-hover:rotate-[15deg] transition-all duration-500">
                      <svg
                        className="w-7 h-7 sm:w-9 sm:h-9 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d={svc.icon || SERVICE_ICONS[i % SERVICE_ICONS.length]}
                        />
                      </svg>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black text-white mb-2 sm:mb-3 tracking-tighter">
                      {svc.title}
                      <span className="block text-red-600 text-base sm:text-lg font-bold mt-1">
                        {svc.sub}
                      </span>
                    </h3>
                    <p className="text-gray-400 text-base sm:text-lg leading-relaxed font-medium">
                      {svc.desc}
                    </p>
                  </div>
                </div>
              </BorderGlow>
            ))}
          </div>
        </div>
      </section>

      {/* ── Branches / Map Section ── */}
      <section className="py-20 sm:py-24 bg-neutral-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 reveal">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 uppercase tracking-tighter leading-tight">
              VISIT OUR SHOP AT{" "}
              <span className="text-red-600">ANY BRANCHES</span>
            </h2>
            <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto font-medium px-2">
              Experience the pinnacle of automotive care at our flagship{" "}
              {branches[0]?.name} location.
            </p>

            {/* Branch selector */}
            <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/10 w-full sm:w-fit mx-auto mt-6 sm:mt-8 backdrop-blur-xl overflow-hidden">
              {branches.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setActiveBranch(b)}
                  className={`flex-1 sm:flex-none px-4 sm:px-8 py-3 rounded-xl font-black text-xs sm:text-sm transition-all duration-500 tracking-widest ${
                    activeBranch.id === b.id
                      ? "bg-red-600 text-white shadow-lg"
                      : "text-gray-500 hover:text-white"
                  }`}
                >
                  {b.name.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Map + Info layout */}
          <div
            className={`flex flex-col ${
              isMapExpanded ? "" : "lg:flex-row"
            } gap-6 sm:gap-10 items-stretch transition-all duration-700`}
          >
            {/* Map iframe */}
            <div
              className={`relative group rounded-[24px] sm:rounded-[40px] overflow-hidden border border-white/10 shadow-3xl transition-all duration-700 flex-grow ${
                isMapExpanded
                  ? "h-[60vh] sm:h-[70vh]"
                  : "h-[300px] sm:h-[400px] lg:h-[500px] lg:w-2/3"
              }`}
            >
              <button
                onClick={() => setIsMapExpanded(!isMapExpanded)}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 bg-black/80 hover:bg-red-600 text-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/20 transition-all shadow-2xl backdrop-blur-md"
              >
                {isMapExpanded ? (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                )}
              </button>
              <iframe
                title={`Otokwikk ${activeBranch.name}`}
                src={activeBranch.mapUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                className="grayscale opacity-90 contrast-125 hover:grayscale-0 hover:opacity-100 transition-all duration-1000"
              />
            </div>

            {/* Station info + FB button */}
            <div
              className={`${
                isMapExpanded ? "hidden" : "flex"
              } flex-col gap-4 sm:gap-6 lg:w-1/3`}
            >
              <BorderGlow
                className="flex-grow"
                borderRadius={32}
                glowRadius={38}
                glowIntensity={0.9}
                colors={["#38bdf8", "#a855f7", "#fb7185"]}
                backgroundColor="rgba(10, 14, 27, 0.9)"
                animated
              >
                <div className="p-6 sm:p-8">
                  <h3 className="text-xl sm:text-2xl font-black text-white mb-6 sm:mb-8 flex items-center gap-3 sm:gap-4">
                    <span className="w-1.5 h-7 sm:h-8 bg-red-600 rounded-full" />
                    STATION INFO
                  </h3>
                  <div className="space-y-6 sm:space-y-8">
                    {[
                      {
                        icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z",
                        label: "ADDRESS",
                        value: activeBranch.address,
                      },
                      {
                        icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
                        label: "OPERATING HOURS",
                        value: activeBranch.hours,
                      },
                      {
                        icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
                        label: "CONTACT LINE",
                        value: activeBranch.phone,
                      },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-600/10 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 border border-red-600/20 shadow-inner">
                          <svg
                            className="w-5 h-5 sm:w-6 sm:h-6 text-red-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d={item.icon}
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-red-600 font-black text-[10px] sm:text-xs tracking-widest mb-1">
                            {item.label}
                          </p>
                          <p className="text-gray-300 text-base sm:text-lg font-bold leading-tight">
                            {item.value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </BorderGlow>

              <a
                href={activeBranch.fb}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full group bg-red-600 hover:bg-red-700 text-white font-black py-5 sm:py-6 rounded-[20px] sm:rounded-[24px] transition-all duration-500 flex items-center justify-center gap-3 sm:gap-4 text-base sm:text-lg shadow-[0_15px_30px_rgba(220,38,38,0.3)] hover:shadow-[0_20px_40px_rgba(220,38,38,0.5)] transform hover:-translate-y-2"
              >
                FACEBOOK PAGE
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 transform group-hover:translate-x-3 transition-transform"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Reviews Marquee ── */}
      <section className="py-20 sm:py-24 bg-red-600 overflow-hidden relative">
        <div
          className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #000, #000 1px, transparent 1px, transparent 10px)",
          }}
        />

        <div className="text-center mb-12 sm:mb-16 relative z-10 px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter">
            CLIENT <span className="text-black">REVIEWS</span>
          </h2>
          <div className="flex justify-center gap-1.5 mt-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <svg key={s} className="w-4 h-4 sm:w-5 sm:h-5 text-black fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="flex animate-marquee hover:[animation-play-state:paused] whitespace-nowrap">
            {[...reviews, ...reviews].map((f, i) => (
              <div key={i} className="inline-block px-3 sm:px-4">
                <div className="w-[280px] sm:w-[350px] md:w-[420px] bg-black text-white p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] shadow-2xl border border-white/10 whitespace-normal">
                  <p className="text-base sm:text-xl italic font-bold leading-relaxed mb-5 sm:mb-6">
                    "{f.text}"
                  </p>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-600 rounded-full flex items-center justify-center font-black text-base sm:text-lg flex-shrink-0">
                      {f.name[0]}
                    </div>
                    <div>
                      <h4 className="font-black uppercase tracking-tight text-sm sm:text-base">
                        {f.name}
                      </h4>
                      <p className="text-red-600 text-xs sm:text-sm font-black tracking-widest">
                        {f.city}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── All Branches Facebook Links ── */}
      <section className="py-20 sm:py-24 bg-black border-t border-white/5 reveal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter uppercase">
              OFFICIAL <span className="text-red-600">FACEBOOK PAGES</span>
            </h2>
            <div className="w-14 sm:w-16 h-1 bg-red-600 mx-auto mt-5 sm:mt-6 rounded-full" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {fbPages.map((branch, i) => (
              <a
                key={i}
                href={branch.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/5 hover:bg-white/10 p-5 sm:p-6 rounded-2xl border border-white/5 hover:border-red-600/30 transition-all duration-300 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#1877F2]/10 rounded-lg flex items-center justify-center text-[#1877F2] group-hover:bg-[#1877F2] group-hover:text-white transition-all flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <span className="text-white font-bold tracking-tight block text-sm sm:text-base truncate">
                      {branch.name}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-gray-500 font-black uppercase tracking-widest group-hover:text-red-500 transition-colors">
                      Visit Page
                    </span>
                  </div>
                </div>
                <svg
                  className="w-4 h-4 text-gray-600 group-hover:text-white transform group-hover:translate-x-1 transition-all flex-shrink-0 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative overflow-hidden bg-black text-white border-t border-white/10">
        <div className="pointer-events-none absolute inset-0 hidden sm:block">
          <div className="absolute -right-16 -top-28 h-[420px] w-[420px] rotate-[24deg] border border-red-500/20" />
          <div className="absolute right-40 top-32 h-[420px] w-[420px] rotate-[24deg] border border-white/10" />
          <div className="absolute right-20 bottom-[-240px] h-[460px] w-[460px] rotate-[24deg] border border-red-500/15" />
        </div>

        <div className="relative mx-auto flex max-w-7xl flex-col gap-10 sm:gap-14 px-4 sm:px-6 py-14 sm:py-20 lg:flex-row lg:justify-between">
          <div className="max-w-full lg:max-w-md">
            <div className="mb-6 sm:mb-8 flex items-center gap-3">
              <img
                src={logo}
                alt="Otokwikk logo"
                className="h-10 sm:h-12 w-auto object-contain drop-shadow-[0_0_22px_rgba(220,38,38,0.25)]"
              />
            </div>
            <p className="max-w-sm text-lg sm:text-2xl leading-relaxed text-gray-200">
              {footer.tagline}
            </p>
            <button
              onClick={handleBackToTop}
              className="mt-8 sm:mt-10 inline-flex items-center gap-3 border border-red-500/60 bg-red-600/10 px-5 sm:px-6 py-3 text-xs sm:text-sm font-semibold tracking-[0.16em] text-white transition hover:bg-red-600/20"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                <path d="M12 19V6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="m6 12 6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              BACK TO TOP
            </button>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:gap-12 lg:gap-20">
            <div>
              <h3 className="mb-5 sm:mb-6 text-base sm:text-lg font-semibold text-white">Site Map</h3>
              <ul className="space-y-3 sm:space-y-4 text-base sm:text-lg text-gray-300">
                {footer.siteMapLinks.map((item) => (
                  <li key={item.label}>
                    <a href={item.href} className="underline-offset-4 transition hover:text-red-400 hover:underline">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-5 sm:mb-6 text-base sm:text-lg font-semibold text-white">Legal</h3>
              <ul className="space-y-3 sm:space-y-4 text-base sm:text-lg text-gray-300">
                {footer.legalLinks.map((item) => (
                  <li key={item.label}>
                    <a href={item.href} className="underline-offset-4 transition hover:text-red-400 hover:underline">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 bg-[#7f1d1d] px-4 sm:px-6 py-2.5 text-center text-xs font-semibold tracking-wide text-white/90">
          {footer.copyright}
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
          display: flex;
          width: fit-content;
        }
        .reveal {
          opacity: 0;
          transform: translateY(50px);
          transition: all 1s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .reveal-visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}

export default LandingPage;