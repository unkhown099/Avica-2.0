import React, { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "../components/Landing/LandingNav.jsx";
import BorderGlow from "../components/Landing/BorderGlow.jsx";
import logo from "../assets/otokwikklogo.png";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext.jsx";

// ─── API base ─────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

// ─── Normalize media URLs (handles relative paths from Django) ────────────────
const toAbsoluteUrl = (url) => {
  if (!url) return url;
  if (url.startsWith("http")) return url;
  if (!url.startsWith("/")) url = "/" + url;
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

// ─── Official Branch Facebook Pages ─────────────────────────────────────────
export const OFFICIAL_FB_PAGES = [
  {
    branchId: 1,
    name: "Otokwikk - Saranay Branch (North Caloocan)",
    matchKeys: ["saranay", "north caloocan", "north", "1"],
    url: "https://www.facebook.com/profile.php?id=100090897126761",
  },
  {
    branchId: 2,
    name: "Otokwikk - Tanza Cavite Branch",
    matchKeys: ["tanza", "cavite", "2"],
    url: "https://www.facebook.com/otokwikk.tanzacavite",
  },
  {
    branchId: 3,
    name: "Otokwikk - Camarin Branch",
    matchKeys: ["camarin", "3"],
    url: "https://www.facebook.com/profile.php?id=61586571534281",
  },
  {
    branchId: 4,
    name: "Otokwikk - South Caloocan Branch",
    matchKeys: ["south caloocan", "south", "4"],
    url: "https://www.facebook.com/profile.php?id=61572528405228",
  },
  {
    branchId: 5,
    name: "Otokwikk - San Mateo Rizal Branch",
    matchKeys: ["san mateo", "rizal", "5"],
    url: "https://www.facebook.com/profile.php?id=61556323569842",
  },
  {
    branchId: 6,
    name: "Otokwikk - Quezon City Branch",
    matchKeys: ["quezon", "qc", "6"],
    url: "https://www.facebook.com/profile.php?id=61577247173903",
  },
];

// Helper: Format official display name for a branch
export const getBranchDisplayName = (branch) => {
  if (!branch) return "";
  const name = branch.name || "";
  const lower = name.toLowerCase();
  if (lower.includes("saranay") || lower.includes("north caloocan")) {
    return "Otokwikk - Saranay Branch (North Caloocan)";
  }
  if (lower.startsWith("otokwikk")) {
    return name;
  }
  const cleanName = name.replace(/\s*branch$/i, "").trim();
  return `Otokwikk - ${cleanName} Branch`;
};

// Helper: Get verified official Facebook URL for a branch
export const getBranchFbUrl = (branch) => {
  if (!branch) return OFFICIAL_FB_PAGES[0].url;
  const branchNameLower = (branch.name || "").toLowerCase();
  const branchId = String(branch.id || "");

  const matched = OFFICIAL_FB_PAGES.find((item) => {
    if (String(item.branchId) === branchId) return true;
    return item.matchKeys.some((k) => branchNameLower.includes(k));
  });

  if (matched) return matched.url;
  if (branch.fb_url && branch.fb_url.trim()) return branch.fb_url;
  return OFFICIAL_FB_PAGES[0].url;
};

// ─── Hardcoded fallback (used only if API is unreachable) ─────────────────────
const EMPTY_LANDING_CONTENT = {
  hero: {
    headline: "PRECISION",
    headlineAccent: "DETAILING",
    subtitle: "Experience the Art of Automotive Perfection",
    ctaLoggedIn: "GO TO DASHBOARD",
    ctaGuest: "BOOK YOUR EXPERIENCE",
    signInPrompt: "Part of the elite?",
    signInLabel: "SIGN IN HERE",
    bgMode: "slideshow",
    imageUrl: "",
    images: [],
    videoUrl: "",
  },
  services: {
    sectionTitle: "FEATURED",
    sectionTitleAccent: "REELS & HIGHLIGHTS",
    sectionSubtitle: "Watch our latest car detailing transformations, ceramic coats, and viral Facebook reels.",
    items: [
      { url: "https://www.facebook.com/reel/100090897126761" },
      { url: "https://www.facebook.com/reel/61572528405228" },
      { url: "https://www.facebook.com/reel/61586571534281" },
    ],
  },
  branches: [
    {
      id: 1,
      name: "Saranay Branch",
      address: "Ph9 Pkg7c Blk20 Lot 3&4 Brgy 176-E Bagong Silang Caloocan City",
      hours: "8:00 AM - 7:00 PM",
      phone: "+639612804108",
      latitude: 14.7520,
      longitude: 121.0230,
      fb_url: "https://www.facebook.com/profile.php?id=100090897126761",
      is_active: true,
    },
    {
      id: 2,
      name: "Tanza Cavite Branch",
      address: "6810 De Roman Subd. Daang Amaya 1, Tanza, Philippines, 4108",
      hours: "8:00 AM - 7:00 PM",
      phone: "+639123456783",
      latitude: 14.3938,
      longitude: 120.8534,
      fb_url: "https://www.facebook.com/otokwikk.tanzacavite",
      is_active: true,
    },
    {
      id: 3,
      name: "Camarin Branch",
      address: "Block 15 Lot 4 Capt. Samano Street, Area A Camarin Road, Caloocan, Philippines, 1423",
      hours: "8:00 AM - 7:00 PM",
      phone: "+639123456783",
      latitude: 14.7570,
      longitude: 121.0330,
      fb_url: "https://www.facebook.com/profile.php?id=61586571534281",
      is_active: true,
    },
    {
      id: 4,
      name: "South Caloocan Branch",
      address: "77 General Trio Street, Caloocan, Philippines",
      hours: "8:00 AM - 7:00 PM",
      phone: "+639123456782",
      latitude: 14.6624,
      longitude: 120.9878,
      fb_url: "https://www.facebook.com/profile.php?id=61572528405228",
      is_active: true,
    },
    {
      id: 5,
      name: "San Mateo Rizal Branch",
      address: "0186 B General Luna Street Guitnang Bayan 2 San Mateo Rizal",
      hours: "8:00 AM - 7:00 PM",
      phone: "+639123456782",
      latitude: 14.6960,
      longitude: 121.1210,
      fb_url: "https://www.facebook.com/profile.php?id=61556323569842",
      is_active: true,
    },
    {
      id: 6,
      name: "Quezon City Branch",
      address: "123 Mabini Street, Barangay Malinis, Quezon City, 1100 Metro Manila, Philippines",
      hours: "8:00 AM - 7:00 PM",
      phone: "+639123456776",
      latitude: 14.6450,
      longitude: 121.0500,
      fb_url: "https://www.facebook.com/profile.php?id=61577247173903",
      is_active: true,
    },
  ],
  reviews: [
    { name: "SIR BJ", city: "Tanza, Cavite", text: "Ang ganda ng linis, may pafoot paper and wheel plastic covering pa! Dami magpapalinis pag ganyan. Heheh Dito ko na papalinis mga kotse ng skul." },
    { name: "SIR CLARENZ", city: "Quezon City", text: "Panalo yung engine wash nyo sir! Linis lahat! Papuntahin ko yung ninong ko dyan ipa engine wash nya yung Innova nya." },
    { name: "SIR JOHN RONAN", city: "San Mateo, Rizal", text: "SOLID! Worth it yung bayad! Mura na, QUALITY pa." },
    { name: "SIR GERMAINE DANCA", city: "North Caloocan", text: "For top notch and premium car care and affordable price.. Visit #Otokwikk at Saranay Road, Caloocan City." },
    { name: "SIR MIGS ONG", city: "South Caloocan", text: "Thanks heaps for the top-notch service, Otokwikk! Highly recommended! Pogi na ulit si Sky!" },
  ],
  fbPages: OFFICIAL_FB_PAGES.map((p) => ({ name: p.name, url: p.url })),
  footer: {
    tagline: "Empowering car owners with precision care and premium detailing that protects every drive.",
    copyright: "Copyright © 2026, otokwikk. All Rights Reserved.",
    siteMapLinks: [
      { label: "Homepage", href: "#hero" },
      { label: "Services", href: "#services" },
      { label: "Branches", href: "#branches" },
      { label: "Client Reviews", href: "#reviews" },
      { label: "Facebook Pages", href: "#branches" },
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

  const normalizeImage = (url) => {
    if (!url) return "";
    return toAbsoluteUrl(url);
  };

  const heroImageUrl = normalizeImage(data.hero?.imageUrl ?? "");
  const heroVideoUrl = data.hero?.videoUrl ? toAbsoluteUrl(data.hero.videoUrl) : "";
  const heroImages = Array.isArray(data.hero?.images)
    ? data.hero.images
      .filter((img) => img && img.trim() !== "")
      .map(normalizeImage)
    : [];

  return {
    hero: {
      ...EMPTY_LANDING_CONTENT.hero,
      ...data.hero,
      bgMode: data.hero?.bgMode || "slideshow",
      videoUrl: heroVideoUrl,
      imageUrl: heroImageUrl,
      images:
        heroImages.length > 0
          ? heroImages
          : heroImageUrl
            ? [heroImageUrl]
            : [],
    },
    services: {
      ...EMPTY_LANDING_CONTENT.services,
      ...data.services,
      items: Array.isArray(data.services?.items) && data.services.items.length > 0
        ? data.services.items.map((item) => {
            if (typeof item === "string") return { url: item };
            return {
              ...item,
              url: item?.url || item?.link || item?.image || "",
            };
          })
        : EMPTY_LANDING_CONTENT.services.items,
    },
    branches: Array.isArray(data.branches) && data.branches.length > 0
      ? data.branches
      : EMPTY_LANDING_CONTENT.branches,
    reviews: Array.isArray(data.reviews) && data.reviews.length > 0
      ? data.reviews
      : EMPTY_LANDING_CONTENT.reviews,
    fbPages: Array.isArray(data.fbPages) && data.fbPages.length > 0
      ? data.fbPages
      : EMPTY_LANDING_CONTENT.fbPages,
    footer: {
      ...EMPTY_LANDING_CONTENT.footer,
      ...data.footer,
      siteMapLinks: Array.isArray(data.footer?.siteMapLinks)
        ? data.footer.siteMapLinks.map((l) =>
            l.href === "#facebook-pages" ? { ...l, href: "#branches" } : l
          )
        : EMPTY_LANDING_CONTENT.footer.siteMapLinks,
      legalLinks: Array.isArray(data.footer?.legalLinks)
        ? data.footer.legalLinks
        : EMPTY_LANDING_CONTENT.footer.legalLinks,
    },
  };
}

// ─── Load Facebook JS SDK once globally ───────────────────────────────────────
function loadFBSDK() {
  if (document.getElementById("facebook-jssdk")) return;
  const existingInit = window.fbAsyncInit;
  window.fbAsyncInit = function () {
    if (window.FB) {
      window.FB.init({ xfbml: true, version: "v20.0" });
    }
    if (existingInit) existingInit();
  };
  const js = document.createElement("script");
  js.id = "facebook-jssdk";
  js.src = "https://connect.facebook.net/en_US/sdk.js";
  js.async = true;
  js.defer = true;
  document.head.appendChild(js);
}

// ─── FBVideoEmbed — Automatic Muted Playback, Looping & Graceful Fallbacks ───
function FBVideoEmbed({ url, index, isDark = true }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const [loadError, setLoadError] = useState(false);
  const [useIframeFallback, setUseIframeFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isDirect = Boolean(
    url &&
    (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url) ||
      (url.includes("/media/") && !url.includes("facebook.com")))
  );

  const initPlayer = useCallback(() => {
    if (!containerRef.current || !url || isDirect) return;
    const FB = window.FB;
    if (!FB) return;

    try {
      FB.XFBML.parse(containerRef.current, () => {
        setIsLoading(false);
        const videoEl = containerRef.current?.querySelector(".fb-video");
        if (!videoEl) return;

        FB.Event.subscribe("xfbml.ready", (msg) => {
          if (msg.type === "video" && videoEl.contains(msg.instance?._element)) {
            playerRef.current = msg.instance;
            try {
              if (typeof msg.instance.mute === "function") msg.instance.mute();
              if (typeof msg.instance.play === "function") {
                const p = msg.instance.play();
                if (p && typeof p.catch === "function") {
                  p.catch(() => {});
                }
              }
              if (typeof msg.instance.subscribe === "function") {
                msg.instance.subscribe("finishedPlaying", () => {
                  try {
                    msg.instance.seek(0);
                    msg.instance.play();
                  } catch (_) {}
                });
              }
            } catch (_) {}
          }
        });
      });
    } catch (err) {
      console.warn("FB SDK parse error, using iframe fallback:", err);
      setUseIframeFallback(true);
      setIsLoading(false);
    }
  }, [url, isDirect]);

  useEffect(() => {
    if (!url || isDirect) {
      setIsLoading(false);
      return;
    }

    loadFBSDK();

    // Fallback: If FB SDK is blocked by client ad blocker or doesn't initialize within 3.5s, switch to plugin iframe
    const fallbackTimer = setTimeout(() => {
      if (!window.FB || !playerRef.current) {
        setUseIframeFallback(true);
        setIsLoading(false);
      }
    }, 3500);

    if (window.FB) {
      initPlayer();
    } else {
      const prev = window.fbAsyncInit;
      window.fbAsyncInit = () => {
        if (window.FB) {
          window.FB.init({ xfbml: true, version: "v20.0" });
        }
        if (prev) prev();
        initPlayer();
      };
    }

    return () => clearTimeout(fallbackTimer);
  }, [initPlayer, url, isDirect]);

  if (!url) {
    return (
      <div className={`group relative rounded-[28px] sm:rounded-[32px] overflow-hidden border shadow-2xl flex flex-col h-[560px] sm:h-[620px] w-full items-center justify-center transition-colors ${
        isDark ? "bg-gray-950 border-white/10 text-gray-400" : "bg-white border-gray-200 text-gray-600 shadow-md"
      }`}>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 text-red-500 ${
          isDark ? "bg-red-600/10 border border-red-600/20" : "bg-red-50 border border-red-200"
        }`}>
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
          </svg>
        </div>
        <span className={`text-xs font-black uppercase tracking-widest ${isDark ? "text-gray-300" : "text-gray-800"}`}>
          Featured Reel #{index + 1}
        </span>
      </div>
    );
  }

  // Direct video file (e.g. .mp4, /media/video.mp4)
  if (isDirect) {
    return (
      <div className={`group relative rounded-[28px] sm:rounded-[32px] overflow-hidden border shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(220,38,38,0.25)] flex flex-col h-[560px] sm:h-[620px] w-full bg-black ${
        isDark ? "border-white/10" : "border-gray-200"
      }`}>
        <video
          src={toAbsoluteUrl(url)}
          autoPlay
          loop
          muted
          playsInline
          controls
          className="w-full h-full object-cover"
          onError={() => setLoadError(true)}
        />
        {loadError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 text-white p-6 text-center">
            <p className="text-sm font-semibold mb-3">Video playback unavailable</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg"
            >
              Watch Original Video
            </a>
          </div>
        )}
      </div>
    );
  }

  // Facebook Reel / Video embed
  return (
    <div
      ref={containerRef}
      className={`group relative rounded-[28px] sm:rounded-[32px] overflow-hidden border shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(220,38,38,0.25)] flex flex-col h-[560px] sm:h-[620px] w-full ${
        isDark ? "border-white/10 bg-gray-950" : "border-gray-200 bg-white"
      }`}
    >
      {/* Loading Skeleton */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xs z-10 pointer-events-none">
          <div className="w-10 h-10 border-3 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
        </div>
      )}

      {useIframeFallback ? (
        <iframe
          src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&autoplay=1&mute=1`}
          className="w-full h-full border-0"
          style={{ minHeight: "100%" }}
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowFullScreen={true}
          title={`Facebook Reel ${index + 1}`}
          onLoad={() => setIsLoading(false)}
        />
      ) : (
        <div
          className="fb-video w-full h-full"
          data-href={url}
          data-width="auto"
          data-show-text="false"
          data-autoplay="true"
          data-allowfullscreen="true"
          data-controls="true"
          style={{ minHeight: "100%", display: "flex", flexDirection: "column" }}
        />
      )}

      {/* Direct Facebook Link Overlay Badge */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open Reel on Facebook"
        className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 hover:bg-black text-white text-[11px] font-bold border border-white/20 shadow-lg backdrop-blur-md transition-all hover:scale-105"
      >
        <svg className="w-3.5 h-3.5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
        <span>Reel</span>
      </a>
    </div>
  );
}


const SERVICE_ICONS = [
  "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  "M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z",
  "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z",
];

function LandingPage() {
  const navigate = useNavigate();
  const { isDark } = useTheme() || { isDark: true };

  // ─── State ────────────────────────────────────────────────────────────────
  const [pageContent, setPageContent] = useState(null);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [heroBgs, setHeroBgs] = useState([]);
  const [bgIndex, setBgIndex] = useState(0);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [branches, setBranches] = useState([]);
  const [activeBranch, setActiveBranch] = useState(null);
  const [user, setUser] = useState(null);
  const [mapSkin, setMapSkin] = useState("satellite");
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", body: "" });
  const [legalPosts, setLegalPosts] = useState([]);

  // ─── Map refs ─────────────────────────────────────────────────────────────
  const mapRef = React.useRef(null);
  const mapInstanceRef = React.useRef(null);
  const markersRef = React.useRef([]);
  const tileLayerRef = React.useRef(null);

  // ─── Re-size map when expanded ────────────────────────────────────────────
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => mapInstanceRef.current.invalidateSize(), 300);
    }
  }, [isMapExpanded]);

  // ─── Drag to scroll for reviews ──────────────────────────────────────────
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  // ─── Leaflet map init + markers ───────────────────────────────────────────
  useEffect(() => {
    if (!contentLoaded || !branches.length || !mapRef.current || !window.L)
      return;

    if (!mapInstanceRef.current) {
      const map = window.L.map(mapRef.current, {
        center: [14.6, 121.0],
        zoom: 11,
        zoomControl: false,
      });
      window.L.control.zoom({ position: "bottomright" }).addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    const mapOptions = {
      dark: { 
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", 
        attr: "&copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
        maxZoom: 16
      },
      satellite: { 
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", 
        attr: "&copy; Esri &mdash; Source: Esri, Maxar",
        maxZoom: 19
      },
      streets: { 
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", 
        attr: "&copy; OpenStreetMap contributors",
        maxZoom: 19
      }
    };

    const currentSkin = mapOptions[mapSkin] || mapOptions.satellite;

    if (tileLayerRef.current) tileLayerRef.current.remove();
    tileLayerRef.current = window.L.tileLayer(currentSkin.url, {
      attribution: currentSkin.attr,
      maxZoom: currentSkin.maxZoom || 19
    }).addTo(map);

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    branches.forEach((b) => {
      if (b.latitude && b.longitude) {
        const isActive = activeBranch?.id === b.id;
        const marker = window.L.marker([b.latitude, b.longitude], {
          icon: window.L.divIcon({
            className: "custom-div-icon",
            html: `<div style="background-color:${isActive ? "#ef4444" : "#ffffff"};width:14px;height:14px;border-radius:50%;border:3px solid ${isActive ? "white" : "#ef4444"};box-shadow:0 0 15px ${isActive ? "rgba(239,68,68,0.6)" : "rgba(0,0,0,0.3)"};transition:all 0.3s ease;"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          }),
        }).addTo(map);

        marker.on("click", () => setActiveBranch(b));
        markersRef.current.push(marker);
      }
    });

    if (activeBranch?.latitude && activeBranch?.longitude) {
      map.flyTo([activeBranch.latitude, activeBranch.longitude], 15, {
        duration: 2,
        easeLinearity: 0.25,
      });
    }
  }, [contentLoaded, branches, activeBranch, mapSkin]);

  // ─── Component Init: fetch landing content ────────────────────────────────
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
        
        // Load legal posts from the content
        if (data.posts && Array.isArray(data.posts)) {
          setLegalPosts(data.posts);
        }

        // Set up hero backgrounds
        let bgImages = [];
        if (normalized.hero.images && normalized.hero.images.length > 0) {
          bgImages = normalized.hero.images.filter(
            (img) => img && img.trim() !== ""
          );
          console.log("Using images array for slideshow:", bgImages);
        } else if (
          normalized.hero.imageUrl &&
          normalized.hero.imageUrl.trim() !== ""
        ) {
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
        setContentLoaded(true);
      });
  }, []);

  // ─── Intersection Observer for reveal animations ───────────────────────────
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
        { threshold: 0.1 }
      );
      document.querySelectorAll(".reveal").forEach((el) => obs.observe(el));
    }, 150);

    return () => {
      clearTimeout(timer);
      if (obs) obs.disconnect();
    };
  }, [contentLoaded]);

  // ─── Standalone Branch Fetch ──────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/branches/`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const activeOnly = Array.isArray(data)
          ? data.filter((b) => b.is_active)
          : [];
        const finalBranches =
          activeOnly.length > 0
            ? activeOnly
            : EMPTY_LANDING_CONTENT.branches;

        setBranches(finalBranches);
        setActiveBranch(finalBranches[0] ?? null);
      })
      .catch((err) => {
        console.error("Branches fetch failed:", err);
        setBranches(EMPTY_LANDING_CONTENT.branches);
        setActiveBranch(EMPTY_LANDING_CONTENT.branches[0] ?? null);
      });
  }, []);

  // ─── Hero Slideshow ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!contentLoaded || heroBgs.length <= 1) return;

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

  // ─── Modal handlers ───────────────────────────────────────────────────────
  const openModal = (postKey) => {
    const post = legalPosts.find(p => p.key === postKey);
    if (post) {
      setModalContent({
        title: post.title,
        body: post.body
      });
      setModalOpen(true);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  // Manage body scroll locking when modal is open
  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [modalOpen]);

  // Close modal on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && modalOpen) {
        closeModal();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [modalOpen]);

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

  // ─── Smooth scroll to any section by ID ──────────────────────────────────
  const scrollToSection = (e, href) => {
    if (!href || href === "#") { e.preventDefault(); return; }
    let target = href;
    if (target === "#facebook-pages") {
      target = "#branches";
    }
    if (target.startsWith("#")) {
      e.preventDefault();
      const el = document.getElementById(target.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
    // External / path links fall through naturally
  };

  // ── Loading skeleton ───────────────────────────────────────────────────────
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

  const { hero, services, reviews, fbPages, footer } = pageContent;
  const filteredServices = Array.isArray(services.items) ? services.items : [];
  const currentStation = activeBranch ?? null;
  const currentFbUrl = getBranchFbUrl(currentStation);
  const currentDisplayName = getBranchDisplayName(currentStation);

  return (
    <div className={`min-h-screen font-sans selection:bg-red-600 selection:text-white transition-colors duration-300 ${
      isDark ? "bg-black text-white" : "bg-slate-50 text-gray-900"
    }`}>
      <Navbar />

      {/* Modal Popup */}
      {modalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-all duration-300"
          onClick={closeModal}
        >
          <div 
            className={`relative rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-hidden border shadow-2xl transform transition-all duration-300 scale-100 ${
              isDark 
                ? "bg-gradient-to-br from-gray-900 to-black border-white/20 text-white" 
                : "bg-white border-gray-200 text-gray-900"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-6 border-b ${isDark ? "border-white/10 bg-red-600/10" : "border-gray-200 bg-red-50"}`}>
              <h2 className={`text-2xl font-black tracking-tighter ${isDark ? "text-white" : "text-gray-900"}`}>
                {modalContent.title}
              </h2>
              <button
                onClick={closeModal}
                className={`p-2 rounded-xl transition-colors ${isDark ? "text-gray-400 hover:text-white hover:bg-white/10" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
              <div className="prose max-w-none">
                {modalContent.body.split('\n').map((paragraph, idx) => (
                  <p key={idx} className={`leading-relaxed mb-4 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className={`p-6 border-t ${isDark ? "border-white/10 bg-black/50" : "border-gray-200 bg-gray-50"}`}>
              <button
                onClick={closeModal}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-red-900/30"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Hero Section with Background (Video or Slideshow) ── */}
      <div id="hero" className="landing-hero relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background container */}
        <div className="absolute inset-0 overflow-hidden">
          {hero.bgMode === "video" && hero.videoUrl ? (
            <video
              key={hero.videoUrl}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover pointer-events-none scale-105"
              style={{ filter: "brightness(0.35)" }}
              src={toAbsoluteUrl(hero.videoUrl)}
            />
          ) : (
            heroBgs.map((bg, index) => (
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
            ))
          )}

          {/* Fallback gradient if no images and no video */}
          {(!hero.bgMode || hero.bgMode === "slideshow") && heroBgs.length === 0 && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black" />
          )}

          {/* Overlay gradient for high contrast and readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/99 pointer-events-none" />
        </div>

        {/* Glow orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
          <div className="absolute top-20 left-10 w-64 h-64 md:w-96 md:h-96 bg-red-600/20 rounded-full blur-[120px] animate-pulse" />
          <div
            className="absolute bottom-20 right-10 w-80 h-80 md:w-[500px] md:h-[500px] bg-blue-600/10 rounded-full blur-[150px] animate-pulse"
            style={{ animationDelay: "2s" }}
          />
        </div>

        <div className="relative text-center">
          {/* Headline */}
          <h1
            className="font-black text-white mb-4 sm:mb-6 leading-[0.85] tracking-tighter text-[clamp(2.2rem,9vw,5.5rem)]"
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
            className="text-xs sm:text-sm md:text-lg text-gray-400 mb-8 sm:mb-10 font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase max-w-2xl mx-auto opacity-80"
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
      <section id="services" className={`py-20 sm:py-28 md:py-32 relative transition-colors duration-300 ${isDark ? "bg-black" : "bg-slate-50"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 reveal">
          <div className="text-center mb-12 sm:mb-16 md:mb-20">
            <h2 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 uppercase tracking-tighter ${isDark ? "text-white" : "text-gray-900"}`}>
              {services.sectionTitle}{" "}
              <span className="text-red-600">{services.sectionTitleAccent}</span>
            </h2>
            <div className="w-20 sm:w-24 h-1.5 bg-red-600 mx-auto rounded-full mb-4 sm:mb-6" />
            <p className={`text-base sm:text-lg font-medium max-w-2xl mx-auto px-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              {services.sectionSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {filteredServices.slice(0, 3).map((svc, i) => {
              const reelUrl = typeof svc === "string" ? svc : (svc?.url || svc?.link || svc?.image || "");
              return (
                <FBVideoEmbed key={i} url={reelUrl} index={i} isDark={isDark} />
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Branches / Map Section ── */}
      <section id="branches" className={`py-20 sm:py-24 relative transition-colors duration-300 ${isDark ? "bg-neutral-900" : "bg-slate-100"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 reveal">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className={`text-3xl sm:text-4xl md:text-5xl font-black mb-4 uppercase tracking-tighter leading-tight ${isDark ? "text-white" : "text-gray-900"}`}>
              LOCATE OUR <span className="text-red-600">STATIONS</span>
            </h2>
            <p className={`text-base sm:text-lg max-w-xl mx-auto font-medium px-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              Select a branch below to view its location and contact
              information.
            </p>

            {/* Branch Dropdown */}
            <div className="mt-8 relative w-full max-w-xl sm:max-w-2xl mx-auto z-30 px-3 sm:px-0">
              <select
                value={activeBranch?.id ?? ""}
                onChange={(e) =>
                  setActiveBranch(
                    branches.find((b) => String(b.id) === e.target.value) ??
                    null
                  )
                }
                aria-label="Select Branch Location"
                className={`w-full font-black text-xs sm:text-sm uppercase tracking-[0.08em] sm:tracking-[0.12em] pl-5 sm:pl-7 pr-14 sm:pr-16 py-3.5 sm:py-4 rounded-2xl border appearance-none focus:outline-none focus:border-red-600 transition-all cursor-pointer shadow-xl backdrop-blur-xl truncate ${
                  isDark 
                    ? "bg-black/80 text-white border-white/20 hover:border-red-500/50" 
                    : "bg-white text-gray-900 border-gray-300 hover:border-red-400 shadow-md"
                }`}
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id} className={isDark ? "bg-neutral-900 text-white py-2" : "bg-white text-gray-900 py-2"}>
                    {getBranchDisplayName(b).toUpperCase()}
                  </option>
                ))}
              </select>
              <div className="absolute right-5 sm:right-6 top-1/2 -translate-y-1/2 pointer-events-none text-red-600">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Map + Info layout */}
          <div
            className={`flex flex-col ${isMapExpanded ? "lg:flex-col" : "lg:flex-row"
              } gap-6 sm:gap-10 items-stretch transition-all duration-700`}
          >
            {/* Interactive Leaflet Map */}
            <div
              className={`relative group rounded-[24px] sm:rounded-[40px] overflow-hidden border shadow-3xl transition-all duration-700 ${
                isDark ? "border-white/10 bg-gray-900" : "border-gray-200 bg-gray-100"
              } ${isMapExpanded
                ? "h-[600px] sm:h-[800px] lg:w-full"
                : "h-[400px] sm:h-[500px] lg:w-2/3"
                }`}
            >
              <div ref={mapRef} className="w-full h-full z-0" />

              {/* Map label */}
              <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <div className={`map-badge px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl backdrop-blur-md transition-colors ${
                  isDark
                    ? "bg-black/80 border-white/10 text-red-500"
                    : "bg-white border-gray-200 text-red-600 shadow-md"
                }`}>
                  {currentStation?.name || "Live Precision Map"}
                </div>
              </div>

              {/* Expand/collapse + Skin selector */}
              <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2 map-floating-controls">
                <button
                  onClick={() => setIsMapExpanded((prev) => !prev)}
                  className={`map-control-btn p-3 rounded-xl border shadow-xl active:scale-95 flex items-center justify-center w-12 h-12 cursor-pointer backdrop-blur-md transition-all ${
                    isDark
                      ? "bg-black/80 border-white/20 text-white hover:border-red-500/50 hover:bg-neutral-900"
                      : "bg-white border-gray-300 text-gray-800 hover:border-red-500 hover:bg-red-50 shadow-md"
                  }`}
                  title={isMapExpanded ? "Collapse Map" : "Expand Map"}
                >
                  <svg
                    className={`w-5 h-5 ${isDark ? "text-white" : "text-gray-800"}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {isMapExpanded ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M9 9L4 4m0 0v5m0-5h5m11 0l-5 5m5-5v5m0-5h-5M4 20l5-5m-5 5v-5m0 5h5m11 0l-5-5m5 5v-5m0 5h-5"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M15 3l6 6m0 0v-5m0 5h-5M9 3L3 9m0 0v-5m0 5h5M15 21l6-6m0 0v5m0-5h-5M9 21l-6-6m0 0v5m0-5h5"
                      />
                    )}
                  </svg>
                </button>

                {/* Skin Selector */}
                <div className={`map-skin-box flex flex-col gap-1.5 p-1.5 rounded-xl border shadow-xl backdrop-blur-md transition-colors ${
                  isDark
                    ? "bg-black/80 border-white/20"
                    : "bg-white border-gray-300 shadow-md"
                }`}>
                  {["dark", "satellite", "streets"].map((skin) => (
                    <button
                      key={skin}
                      onClick={() => setMapSkin(skin)}
                      className={`map-skin-btn px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                        mapSkin === skin
                          ? "map-skin-btn-active bg-red-600 text-white shadow-md font-black"
                          : isDark
                          ? "text-gray-300 hover:text-white hover:bg-white/10"
                          : "text-gray-700 hover:text-red-600 hover:bg-red-50 font-bold"
                      }`}
                    >
                      {skin}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Station info + FB button */}
            <div
              className={`${isMapExpanded ? "hidden" : "flex"
                } flex-col gap-4 sm:gap-6 lg:w-1/3`}
            >
              <div className={`backdrop-blur-xl rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 border transition-all flex-grow shadow-2xl ${
                isDark 
                  ? "bg-neutral-950/80 border-white/15 hover:border-red-600/40 text-white" 
                  : "bg-white border-gray-200 hover:border-red-500/40 text-gray-900 shadow-lg"
              }`}>
                <div className="mb-6 sm:mb-8">
                  <h3 className={`text-xl sm:text-2xl font-black flex items-center gap-3 sm:gap-4 ${isDark ? "text-white" : "text-gray-900"}`}>
                    <span className="w-1.5 h-7 sm:h-8 bg-red-600 rounded-full" />
                    STATION INFO
                  </h3>
                  <p className="text-red-600 text-xs sm:text-sm font-black tracking-wider uppercase mt-1 pl-4 sm:pl-5">
                    {currentDisplayName}
                  </p>
                </div>
                <div className="space-y-6 sm:space-y-8">
                  {[
                    {
                      icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z",
                      label: "ADDRESS",
                      value: currentStation?.address,
                    },
                    {
                      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
                      label: "OPERATING HOURS",
                      value: currentStation?.hours,
                    },
                    {
                      icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
                      label: "CONTACT LINE",
                      value: currentStation?.phone || "Coming Soon",
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 sm:gap-4">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 border shadow-inner ${
                        isDark 
                          ? "bg-red-600/10 border-red-600/20" 
                          : "bg-red-50 border-red-200"
                      }`}>
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
                        <p className={`text-base sm:text-lg font-bold leading-tight ${isDark ? "text-gray-300" : "text-gray-800"}`}>
                          {item.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {currentFbUrl && (
                <a
                  href={currentFbUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full group bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black py-4 px-6 rounded-xl sm:rounded-2xl transition-all duration-300 flex items-center justify-between text-xs sm:text-sm uppercase tracking-wider shadow-xl shadow-red-900/30 transform hover:-translate-y-1 cursor-pointer"
                >
                  <span className="flex items-center gap-3 truncate">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span className="truncate">VISIT OFFICIAL FACEBOOK PAGE</span>
                  </span>
                  <svg
                    className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Reviews Marquee ── */}
      <section id="reviews" className="py-20 sm:py-24 bg-red-600 overflow-hidden relative">
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

        <div
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className={`relative overflow-x-auto scrollbar-hide snap-x snap-mandatory flex pb-8 px-4 sm:px-10 cursor-grab active:cursor-grabbing select-none`}
        >
          <div className={`flex ${!isDragging ? 'animate-marquee hover:[animation-play-state:paused]' : ''} whitespace-nowrap`}>
            {Array(20).fill(reviews).flat().map((f, i) => (
              <div key={i} className="inline-block px-3 sm:px-4">
                <div className={`w-[280px] sm:w-[350px] md:w-[420px] p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] shadow-2xl border whitespace-normal transition-colors ${
                  isDark 
                    ? "bg-black text-white border-white/10" 
                    : "bg-white text-gray-900 border-red-200 shadow-xl"
                }`}>
                  <p className={`text-base sm:text-xl italic font-bold leading-relaxed mb-5 sm:mb-6 ${isDark ? "text-white" : "text-gray-800"}`}>
                    "{f.text}"
                  </p>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-600 text-white rounded-full flex items-center justify-center font-black text-base sm:text-lg flex-shrink-0 shadow-md">
                      {f.name[0]}
                    </div>
                    <div>
                      <h4 className={`font-black uppercase tracking-tight text-sm sm:text-base ${isDark ? "text-white" : "text-gray-900"}`}>
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

      {/* ── Footer ── */}
      <footer className={`landing-footer relative overflow-hidden transition-colors duration-300 ${
        isDark ? "bg-[#09090b] text-white border-t border-white/15" : "bg-slate-50 text-gray-900 border-t-2 border-red-600 shadow-2xl"
      }`}>
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
            <p className={`max-w-sm text-base sm:text-xl font-medium leading-relaxed ${isDark ? "text-gray-200" : "text-gray-600"}`}>
              {footer.tagline || "Your trusted automotive companion"}
            </p>
            <button
              onClick={handleBackToTop}
              className="mt-8 sm:mt-10 inline-flex items-center gap-3 border border-red-600 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-5 sm:px-6 py-3 rounded-xl text-xs sm:text-sm font-bold tracking-[0.16em] transition-all shadow-md hover:shadow-lg shadow-red-900/30 cursor-pointer"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <path d="M12 19V6" strokeLinecap="round" strokeLinejoin="round" />
                <path
                  d="m6 12 6-6 6 6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              BACK TO TOP
            </button>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:gap-12 lg:gap-20">
            <div className="footer-col">
              <h3 className={`mb-5 sm:mb-6 text-base sm:text-lg font-black tracking-wide uppercase flex items-center gap-2 ${
                isDark ? "text-white" : "text-gray-900"
              }`}>
                <span className="w-1.5 h-4 bg-red-600 rounded-full inline-block" />
                Site Map
              </h3>
              <ul className={`space-y-3 sm:space-y-4 text-sm sm:text-base ${isDark ? "text-gray-200" : "text-gray-600"}`}>
                {footer.siteMapLinks && footer.siteMapLinks.length > 0 ? (
                  footer.siteMapLinks.map((item, index) => {
                    const targetHref = item.href === "#facebook-pages" ? "#branches" : item.href;
                    return (
                      <li key={index}>
                        <a
                          href={targetHref}
                          onClick={(e) => scrollToSection(e, targetHref)}
                          className={`font-medium underline-offset-4 transition ${
                            isDark 
                              ? "hover:text-red-400 hover:underline" 
                              : "text-gray-700 hover:text-red-600 hover:underline"
                          }`}
                        >
                          {item.label}
                        </a>
                      </li>
                    );
                  })
                ) : (
                  <li className={isDark ? "text-gray-400" : "text-gray-500"}>No links available</li>
                )}
              </ul>
            </div>
            <div className="footer-col">
              <h3 className={`mb-5 sm:mb-6 text-base sm:text-lg font-black tracking-wide uppercase flex items-center gap-2 ${
                isDark ? "text-white" : "text-gray-900"
              }`}>
                <span className="w-1.5 h-4 bg-red-600 rounded-full inline-block" />
                Legal
              </h3>
              <ul className={`space-y-3 sm:space-y-4 text-sm sm:text-base ${isDark ? "text-gray-200" : "text-gray-600"}`}>
                {footer.legalLinks && footer.legalLinks.length > 0 ? (
                  footer.legalLinks.map((item, index) => {
                    // Map the label to the post key
                    let postKey = "";
                    if (item.label.toLowerCase().includes("privacy")) {
                      postKey = "privacy";
                    } else if (item.label.toLowerCase().includes("terms")) {
                      postKey = "terms";
                    } else if (item.label.toLowerCase().includes("cookie")) {
                      postKey = "cookie";
                    } else {
                      postKey = item.label.toLowerCase().replace(/\s+/g, "-");
                    }
                    
                    return (
                      <li key={index}>
                        <button
                          onClick={() => openModal(postKey)}
                          className={`font-medium underline-offset-4 transition cursor-pointer text-left ${
                            isDark 
                              ? "hover:text-red-400 hover:underline" 
                              : "text-gray-700 hover:text-red-600 hover:underline"
                          }`}
                        >
                          {item.label}
                        </button>
                      </li>
                    );
                  })
                ) : (
                  <li className={isDark ? "text-gray-400" : "text-gray-500"}>No links available</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom border-t border-white/10 bg-[#7f1d1d] px-4 sm:px-6 py-3 text-center text-xs font-bold tracking-wider text-white">
          {footer.copyright || "Copyright © 2026, otokwikk. All Rights Reserved."}
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
          animation: marquee 200s linear infinite;
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
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(239, 68, 68, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(239, 68, 68, 0.8);
        }
      `}</style>
    </div>
  );
}

export default LandingPage;