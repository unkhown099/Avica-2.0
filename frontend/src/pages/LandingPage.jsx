import React, { useState, useEffect } from "react";
import Navbar from "../components/Landing/LandingNav.jsx";
import logo from "../assets/otokwikklogo.png";
import bg1 from "../assets/bg1.jpg";
import bg2 from "../assets/bg2.jpg";
import bg3 from "../assets/bg3.jpg";
import bg4 from "../assets/bg4.jpg";
import { useNavigate } from "react-router-dom";

// ─── API base ─────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

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
const FALLBACK_CONTENT = {
  hero: {
    headline: "PRECISION",
    headlineAccent: "DETAILING",
    subtitle: "Experience the Art of Automotive Perfection",
    ctaLoggedIn: "GO TO DASHBOARD",
    ctaGuest: "BOOK YOUR EXPERIENCE",
    signInPrompt: "Part of the elite?",
    signInLabel: "SIGN IN HERE",
  },
  services: {
    sectionTitle: "OUR",
    sectionTitleAccent: "SERVICES",
    sectionSubtitle:
      "Precision-driven solutions for every automotive need. We bring out the best in every vehicle.",
    items: [
      {
        title: "EXTERIOR",
        sub: "Showroom Shine",
        desc: "Multi-stage washing process, clay bar treatment, and machine polishing for a mirror-like finish.",
        icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      },
      {
        title: "INTERIOR",
        sub: "Pure Luxury",
        desc: "Steam cleaning, leather conditioning, and deep extraction for a sterile, fresh-from-factory interior.",
        icon: "M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z",
      },
      {
        title: "PROTECTION",
        sub: "Ultima Guard",
        desc: "Grade-A Ceramic coatings and PPF applications providing 9H hardness and hydrophobic properties.",
        icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z",
      },
    ],
  },
  branches: [
    {
      name: "North Caloocan",
      id: "north",
      mapUrl:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1930.5615!2d121.023!3d14.752!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397b1b477bf30a7%3A0x34a49388d0848c77!2sOtokwikk%20North%20Caloocan!5e0!3m2!1sen!2sph!4v1708740000000!5m2!1sen!2sph",
      address: "Lot 1 Block 1, Camarin Road, North Caloocan, Metro Manila",
      fb: "https://www.facebook.com/profile.php?id=100090897126761",
      hours: "8:00 AM - 7:00 PM",
      phone: "+63 9XX XXX XXXX",
    },
    {
      name: "South Caloocan",
      id: "south",
      mapUrl:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3860.1066!2d120.9878!3d14.6624!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397b73d971961bd%3A0x44a251e7c7d1e2bc!2sOtokwikk%20South%20Caloocan!5e0!3m2!1sen!2sph!4v1742220000000!5m2!1sen!2sph",
      address: "77 General Tinio, Morning Breeze Subdivision, Caloocan",
      fb: "https://www.facebook.com/profile.php?id=61572528405228",
      hours: "8:00 AM - 7:00 PM",
      phone: "+63 9XX XXX XXXX",
    },
  ],
  reviews: [
    {
      name: "SIR BJ",
      city: "Tanza, Cavite",
      text: "Ang ganda ng linis, may pafoot paper and wheel plastic covering pa! Dami magpapalinis pag ganyan. Heheh Dito ko na papalinis mga kotse ng skul.",
    },
    {
      name: "SIR CLARENZ",
      city: "Quezon City",
      text: "Panalo yung engine wash nyo sir! Linis lahat! Papuntahin ko yung ninong ko dyan ipa engine wash nya yung Innova nya. Dyan ko tinuro sabi ko maganda at linis nung serbisyo nyo.",
    },
    {
      name: "SIR JOHN RONAN",
      city: "San Mateo, Rizal",
      text: "SOLID! Worth it yung bayad! Mura na, QUALITY pa.",
    },
    {
      name: "SIR GERMAINE DANCA",
      city: "North Caloocan",
      text: "For top notch and premium car care and affordable price.. Visit #Otokwikk at Saranay Road, Caloocan City.",
    },
    {
      name: "SIR MIGS ONG",
      city: "South Caloocan",
      text: "Thanks heaps for the top-notch service, Otokwikk! Highly recommended! Pogi na ulit si Sky!",
    },
  ],
  fbPages: [
    {
      name: "Otokwikk - North Caloocan",
      url: "https://www.facebook.com/profile.php?id=100090897126761",
    },
    {
      name: "Otokwikk - Tanza Cavite",
      url: "https://www.facebook.com/otokwikk.tanzacavite",
    },
    {
      name: "Otokwikk - Camarin",
      url: "https://www.facebook.com/profile.php?id=61586571534281",
    },
    {
      name: "Otokwikk - Quezon City",
      url: "https://www.facebook.com/profile.php?id=61577247173903",
    },
    {
      name: "Otokwikk - South Caloocan",
      url: "https://www.facebook.com/profile.php?id=61572528405228",
    },
    {
      name: "Otokwikk - San Mateo Rizal",
      url: "https://www.facebook.com/profile.php?id=61556323569842",
    },
  ],
  footer: {
    tagline:
      "Empowering car owners with precision care and premium detailing that protects every drive.",
    copyright: "Copyright © 2026, otokwikk. All Rights Reserved.",
    siteMapLinks: [
      { label: "Homepage", href: "#" },
      { label: "Services", href: "#" },
      { label: "Branches", href: "#" },
      { label: "Client Reviews", href: "#" },
      { label: "Facebook Pages", href: "#" },
      { label: "Sign In", href: "/signin" },
      { label: "Sign Up", href: "/signup" },
    ],
    legalLinks: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Cookie Policy", href: "#" },
    ],
  },
};

function normalizeLandingContent(content) {
  const data = content || {};

  return {
    hero: { ...FALLBACK_CONTENT.hero, ...data.hero },
    services: {
      ...FALLBACK_CONTENT.services,
      ...data.services,
      items:
        Array.isArray(data.services?.items) && data.services.items.length
          ? data.services.items
          : FALLBACK_CONTENT.services.items,
    },
    branches:
      Array.isArray(data.branches) && data.branches.length
        ? data.branches
        : FALLBACK_CONTENT.branches,
    reviews:
      Array.isArray(data.reviews) && data.reviews.length
        ? data.reviews
        : FALLBACK_CONTENT.reviews,
    fbPages:
      Array.isArray(data.fbPages) && data.fbPages.length
        ? data.fbPages
        : FALLBACK_CONTENT.fbPages,
    footer: {
      ...FALLBACK_CONTENT.footer,
      ...data.footer,
      siteMapLinks:
        Array.isArray(data.footer?.siteMapLinks) &&
          data.footer.siteMapLinks.length
          ? data.footer.siteMapLinks
          : FALLBACK_CONTENT.footer.siteMapLinks,
      legalLinks:
        Array.isArray(data.footer?.legalLinks) && data.footer.legalLinks.length
          ? data.footer.legalLinks
          : FALLBACK_CONTENT.footer.legalLinks,
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
  const [pageContent, setPageContent] = useState(null); // null = loading
  const [contentLoaded, setContentLoaded] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  const heroBgs = [bg1, bg2, bg3, bg4];

  // ─── External Dynamic Data ────────────────────────────────────────────────
  const [branches, setBranches] = useState([]);
  const [activeBranch, setActiveBranch] = useState(null);
  const [user, setUser] = useState(null);
  const [mapType, setMapType] = useState('dark');

  // ─── Map logic ─────────────────────────────────────────────────────────────
  const mapRef = React.useRef(null);
  const mapInstanceRef = React.useRef(null);
  const markersRef = React.useRef([]);
  const tileLayerRef = React.useRef(null);

  // Re-size map when expanded
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => mapInstanceRef.current.invalidateSize(), 300);
    }
  }, [isMapExpanded]);

  useEffect(() => {
    if (!contentLoaded || !branches.length || !mapRef.current || !window.L) return;

    if (!mapInstanceRef.current) {
      const map = window.L.map(mapRef.current, {
        center: [14.6, 121.0],
        zoom: 11,
        zoomControl: false,
      });
      window.L.control.zoom({ position: 'bottomright' }).addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Manage tile layers
    if (tileLayerRef.current) tileLayerRef.current.remove();

    tileLayerRef.current = window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CARTO',
      maxZoom: 20
    }).addTo(map);

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Add pins for all branches
    branches.forEach(b => {
      if (b.latitude && b.longitude) {
        const marker = window.L.marker([b.latitude, b.longitude], {
          icon: window.L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color: ${activeBranch?.id === b.id ? '#ef4444' : '#ffffff'}; width: 14px; height: 14px; border-radius: 50%; border: 3px solid ${activeBranch?.id === b.id ? 'white' : '#ef4444'}; box-shadow: 0 0 15px ${activeBranch?.id === b.id ? 'rgba(239, 68, 68, 0.6)' : 'rgba(0,0,0,0.3)'}; transition: all 0.3s ease;"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          })
        }).addTo(map);

        marker.on('click', () => setActiveBranch(b));
        markersRef.current.push(marker);
      }
    });

    // Fly to active branch
    if (activeBranch && activeBranch.latitude && activeBranch.longitude) {
      map.flyTo([activeBranch.latitude, activeBranch.longitude], 15, {
        duration: 2,
        easeLinearity: 0.25
      });
    }

  }, [contentLoaded, branches, activeBranch]);

  // ─── Component Init ───────────────────────────────────────────────────────
  const getUser = () => {
    try {
      const u = localStorage.getItem("user") || sessionStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  };

  useEffect(() => {
    setUser(getUser());

    // 1. Fetch Landing CMS Content
    fetch(`${API_BASE}/api/landing-content/`)
      .then(r => r.ok ? r.json() : FALLBACK_CONTENT)
      .then(data => {
        setPageContent(normalizeLandingContent(data));
        setContentLoaded(true);
      })
      .catch(() => {
        setPageContent(normalizeLandingContent(FALLBACK_CONTENT));
        setContentLoaded(true);
      });

    // 2. Hero Slideshow
    const bgInterval = setInterval(() => {
      setBgIndex(p => (p + 1) % heroBgs.length);
    }, 6000);

    return () => clearInterval(bgInterval);
  }, []);

  // 3. Reveal Observer
  useEffect(() => {
    if (!contentLoaded) return;
    let obs;
    const timer = setTimeout(() => {
      obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) e.target.classList.add("reveal-visible");
          });
        },
        { threshold: 0.1 },
      );
      document.querySelectorAll(".reveal").forEach((el) => obs.observe(el));
    }, 150);

    return () => {
      clearTimeout(timer);
      if (obs) obs.disconnect();
    };
  }, [contentLoaded]);

  // 4. Standalone Branch Fetch (Single Source of Truth)
  useEffect(() => {
    fetch(`${API_BASE}/branches/`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const activeOnly = Array.isArray(data) ? data.filter(b => b.is_active) : [];
        const finalBranches = activeOnly.length > 0 ? activeOnly : FALLBACK_CONTENT.branches;

        setBranches(finalBranches);
        setActiveBranch(finalBranches[0]);
      })
      .catch(err => {
        console.error("Branches fetch failed:", err);
        setBranches(FALLBACK_CONTENT.branches);
        setActiveBranch(FALLBACK_CONTENT.branches[0]);
      });
  }, []);

  const isLoggedIn = !!getToken(); function getToken() { return localStorage.getItem("access_token") || sessionStorage.getItem("access_token"); }

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

  // ── Loading skeleton — matches overall page bg so there's no flash ──────────
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

  const { hero, services, reviews, fbPages, footer, branches: cmsBranches } = pageContent;
  const currentStation = activeBranch || (cmsBranches?.length ? cmsBranches[0] : FALLBACK_CONTENT.branches[0]);

  return (
    <div className="min-h-screen bg-black font-sans selection:bg-red-600 selection:text-white">
      <Navbar />

      {/* ── Hero Section ── */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background slides */}
        <div className="absolute inset-0">
          {heroBgs.map((bg, index) => (
            <div
              key={index}
              className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-[2000ms] ease-in-out ${index === bgIndex
                ? "opacity-100 scale-110"
                : "opacity-0 scale-100"
                }`}
              style={{
                backgroundImage: `url(${bg})`,
                filter: "brightness(0.35)",
              }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/99" />
        </div>

        {/* Glow orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
          <div className="absolute top-20 left-10 w-64 h-64 md:w-96 md:h-96 bg-red-600/20 rounded-full blur-[120px] animate-pulse" />
          <div
            className="absolute bottom-20 right-10 w-80 h-80 md:w-[500px] md:h-[500px] bg-blue-600/10 rounded-full blur-[150px] animate-pulse"
            style={{ animationDelay: "2s" }}
          />
        </div>

        {/* Hero content */}
        <div className="relative z-10 text-center px-4 sm:px-8 lg:px-12 max-w-5xl mx-auto pt-24 pb-16 w-full">
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
              animation:
                "slideUp 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) 0.2s both",
            }}
          >
            {hero.subtitle}
          </p>

          <div
            style={{
              animation:
                "slideUp 1.4s cubic-bezier(0.2, 0.8, 0.2, 1) 0.4s both",
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
              <span className="text-red-600">
                {services.sectionTitleAccent}
              </span>
            </h2>
            <div className="w-20 sm:w-24 h-1.5 bg-red-600 mx-auto rounded-full mb-4 sm:mb-6" />
            <p className="text-gray-500 text-base sm:text-lg font-medium max-w-2xl mx-auto px-2">
              {services.sectionSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {services.items.map((svc, i) => (
              <div
                key={i}
                className="group relative bg-white/5 backdrop-blur-xl rounded-3xl p-8 sm:p-10 border border-white/10 hover:border-red-600/50 transition-all duration-700 overflow-hidden shadow-2xl"
              >
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
            ))}
          </div>
        </div>
      </section>

      {/* ── Branches / Map Section ── */}
      <section className="py-20 sm:py-24 bg-neutral-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 reveal">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 uppercase tracking-tighter leading-tight">
              LOOCATE OUR <span className="text-red-600">STATIONS</span>
            </h2>
            <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto font-medium px-2">
              Select a branch below to view its location and contact information.
            </p>

            {/* Premium Branch Dropdown */}
            <div className="mt-8 relative w-full sm:w-72 mx-auto z-30">
              <select
                value={activeBranch?.id}
                onChange={(e) => setActiveBranch(branches.find(b => String(b.id) === e.target.value))}
                className="w-full bg-black/60 text-white font-black text-sm uppercase tracking-[0.2em] px-6 py-4 rounded-2xl border border-white/10 appearance-none focus:outline-none focus:border-red-600 transition-all cursor-pointer shadow-2xl backdrop-blur-xl"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id} className="bg-neutral-900 py-2">
                    {b.name.toUpperCase()}
                  </option>
                ))}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-red-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className={`flex flex-col ${isMapExpanded ? 'lg:flex-col' : 'lg:flex-row'} gap-6 sm:gap-10 items-stretch transition-all duration-1000 ease-in-out`}>
            {/* Interactive Leaflet Map */}
            <div className={`relative group rounded-[24px] sm:rounded-[40px] overflow-hidden border border-white/10 shadow-3xl transition-all duration-1000 ease-in-out bg-gray-900 ${isMapExpanded ? 'h-[600px] sm:h-[800px] lg:w-full' : 'h-[400px] sm:h-[500px] lg:w-2/3'}`}>
              <div ref={mapRef} className={`w-full h-full z-0 transition-all duration-700 ${mapType === 'dark' ? 'grayscale-[0.3] hover:grayscale-0' : ''}`} />

              {/* Map Controls */}
              <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <div className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-[10px] font-black text-red-500 uppercase tracking-[0.2em] shadow-2xl">
                  {currentStation?.name || 'Live Precision Map'}
                </div>
              </div>

              <div className="absolute top-4 right-4 z-20 flex gap-2">
                <button
                  onClick={() => setIsMapExpanded(prev => !prev)}
                  className="bg-black/70 backdrop-blur-md p-2.5 rounded-xl border border-white/10 text-white hover:bg-white/10 transition-all shadow-2xl active:scale-95"
                  title={isMapExpanded ? "Collapse Map" : "Expand Map"}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isMapExpanded ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 9L4 4m0 0v5m0-5h5m11 0l-5 5m5-5v5m0-5h-5M4 20l5-5m-5 5v-5m0 5h5m11 0l-5-5m5 5v-5m0 5h-5" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 3l6 6m0 0v-5m0 5h-5M9 3L3 9m0 0v-5m0 5h5M15 21l6-6m0 0v5m0-5h-5M9 21l-6-6m0 0v5m0-5h5" />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Station info + FB button */}
            <div className="flex flex-col gap-4 sm:gap-6 lg:w-1/3">
              <div className="bg-white/5 backdrop-blur-xl rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 border border-white/10 hover:border-red-600/30 transition-all flex-grow shadow-2xl">
                <h3 className="text-xl sm:text-2xl font-black text-white mb-6 sm:mb-8 flex items-center gap-3 sm:gap-4">
                  <span className="w-1.5 h-7 sm:h-8 bg-red-600 rounded-full" />
                  STATION INFO
                </h3>
                <div className="space-y-6 sm:space-y-8">
                  {[
                    {
                      icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z",
                      label: "ADDRESS",
                      value: currentStation.address,
                    },
                    {
                      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
                      label: "OPERATING HOURS",
                      value: currentStation.hours,
                    },
                    {
                      icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
                      label: "CONTACT LINE",
                      value: currentStation.phone || "Coming Soon",
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

              {currentStation.fb_url && (
                <a
                  href={currentStation.fb_url}
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
              )}
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
              <svg
                key={s}
                className="w-4 h-4 sm:w-5 sm:h-5 text-black fill-current"
                viewBox="0 0 20 20"
              >
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
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
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
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative overflow-hidden bg-black text-white border-t border-white/10">
        {/* Decorative borders */}
        <div className="pointer-events-none absolute inset-0 hidden sm:block">
          <div className="absolute -right-16 -top-28 h-[420px] w-[420px] rotate-[24deg] border border-red-500/20" />
          <div className="absolute right-40 top-32 h-[420px] w-[420px] rotate-[24deg] border border-white/10" />
          <div className="absolute right-20 bottom-[-240px] h-[460px] w-[460px] rotate-[24deg] border border-red-500/15" />
        </div>

        <div className="relative mx-auto flex max-w-7xl flex-col gap-10 sm:gap-14 px-4 sm:px-6 py-14 sm:py-20 lg:flex-row lg:justify-between">
          {/* Brand column */}
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
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                aria-hidden="true"
              >
                <path
                  d="M12 19V6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="m6 12 6-6 6 6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              BACK TO TOP
            </button>
          </div>

          {/* Links columns */}
          <div className="grid grid-cols-2 gap-8 sm:gap-12 lg:gap-20">
            <div>
              <h3 className="mb-5 sm:mb-6 text-base sm:text-lg font-semibold text-white">
                Site Map
              </h3>
              <ul className="space-y-3 sm:space-y-4 text-base sm:text-lg text-gray-300">
                {footer.siteMapLinks.map((item) => (
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

            <div>
              <h3 className="mb-5 sm:mb-6 text-base sm:text-lg font-semibold text-white">
                Legal
              </h3>
              <ul className="space-y-3 sm:space-y-4 text-base sm:text-lg text-gray-300">
                {footer.legalLinks.map((item) => (
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
