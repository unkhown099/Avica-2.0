import React, { useState, useEffect, useRef } from "react";
import Navbar from "../components/Landing/LandingNav.jsx";
import logo from "../assets/otokwikklogo.png";
import shopBg from "../assets/otosaranay.png";
import bg1 from "../assets/bg1.jpg";
import bg2 from "../assets/bg2.jpg";
import bg3 from "../assets/bg3.jpg";
import bg4 from "../assets/bg4.jpg";
import { useNavigate } from "react-router-dom";

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
  staff: "/staff/pos",
  employee: "/mechanic/dashboard",
  customer: "/dashboard",
};

const branches = [
  {
    name: "North Caloocan",
    id: "north",
    mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1930.5615!2d121.023!3d14.752!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397b1b477bf30a7%3A0x34a49388d0848c77!2sOtokwikk%20North%20Caloocan!5e0!3m2!1sen!2sph!4v1708740000000!5m2!1sen!2sph",
    address: "Lot 1 Block 1, Camarin Road, North Caloocan, Metro Manila",
    fb: "https://www.facebook.com/profile.php?id=100090897126761",
    hours: "8:00 AM - 7:00 PM",
    phone: "+63 9XX XXX XXXX"
  },
  {
    name: "South Caloocan",
    id: "south",
    mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3860.1066!2d120.9878!3d14.6624!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397b73d971961bd%3A0x44a251e7c7d1e2bc!2sOtokwikk%20South%20Caloocan!5e0!3m2!1sen!2sph!4v1742220000000!5m2!1sen!2sph",
    address: "77 General Tinio, Morning Breeze Subdivision, Caloocan",
    fb: "https://www.facebook.com/profile.php?id=61572528405228",
    hours: "8:00 AM - 7:00 PM",
    phone: "+63 9XX XXX XXXX"
  }
];

const allBranches = [
  { name: "Otokwikk - North Caloocan", url: "https://www.facebook.com/profile.php?id=100090897126761" },
  { name: "Otokwikk - Tanza Cavite", url: "https://www.facebook.com/otokwikk.tanzacavite" },
  { name: "Otokwikk - Camarin", url: "https://www.facebook.com/profile.php?id=61586571534281" },
  { name: "Otokwikk - Quezon City", url: "https://www.facebook.com/profile.php?id=61577247173903" },
  { name: "Otokwikk - South Caloocan", url: "https://www.facebook.com/profile.php?id=61572528405228" },
  { name: "Otokwikk - San Mateo Rizal", url: "https://www.facebook.com/profile.php?id=61556323569842" },
];

const feedbacks = [
  { name: "SIR BJ", city: "Caloocan City", text: "Ang ganda ng linis, may pafoot paper and wheel plastic covering pa! Dami magpapalinis pag ganyan. Heheh Dito ko na papalinis mga kotse ng skul." },
  { name: "SIR CLARENZ", city: "Caloocan City", text: "Panalo yung engine wash nyo sir! Linis lahat! Papuntahin ko yung ninong ko dyan ipa engine wash nya yung Innova nya. Dyan ko tinuro sabi ko maganda at linis nung serbisyo nyo." },
  { name: "SIR JOHN RONAN", city: "Caloocan City", text: "SOLID! Worth it yung bayad! Mura na, QUALITY pa." },
  { name: "SIR GERMAINE DANCA", city: "Caloocan City", text: "For top notch and premium car care and affordable price.. Visit #Otokwikk at Saranay Road, Caloocan City." },
  { name: "SIR MIGS ONG", city: "Caloocan City", text: "Thanks heaps for the top-notch service, Otokwikk! Highly recommended! Pogi na ulit si Sky!" },
];

function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [user, setUser] = useState(null);
  const [activeBranch, setActiveBranch] = useState(branches[0]);
  const [bgIndex, setBgIndex] = useState(0);
  const heroBgs = [bg1, bg2, bg3, bg4];

  useEffect(() => {
    setUser(getUser());
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);

    // Scroll Animation Observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // Background Slideshow Interval
    const bgInterval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % heroBgs.length);
    }, 6000);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
      clearInterval(bgInterval);
    };
  }, [heroBgs.length]);

  const isLoggedIn = !!getToken();

  const handleBooking = () => {
    if (isLoggedIn && user) {
      navigate(roleRoutes[user.role] || "/dashboard");
    } else {
      navigate("/signup");
    }
  };

  return (
    <div className="min-h-screen bg-black font-sans selection:bg-red-600 selection:text-white">
      <Navbar />

      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          {heroBgs.map((bg, index) => (
            <div
              key={index}
              className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-[2000ms] ease-in-out ${index === bgIndex ? "opacity-100 scale-110" : "opacity-0 scale-100"
                }`}
              style={{
                backgroundImage: `url(${bg})`,
                filter: "brightness(0.35)",
              }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/99" />
        </div>

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-red-600/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: "2s" }} />
        </div>

        <div className="relative z-10 text-center px-6 sm:px-8 lg:px-12 max-w-5xl mx-auto pt-20">
          <div className="mb-8 inline-block animate-[fadeIn_1s_ease-out]">
            <div className="bg-white/5 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              <img src={logo} alt="Otokwikk logo" className="h-14 md:h-18 object-contain filter drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]" />
            </div>
          </div>

          <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-white mb-6 leading-[0.85] tracking-tighter"
            style={{ animation: "slideUp 1s cubic-bezier(0.2, 0.8, 0.2, 1) both" }}>
            PRECISION
            <br />
            <span className="text-red-600 bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-red-400">
              DETAILING
            </span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-gray-400 mb-10 font-bold tracking-[0.3em] uppercase max-w-2xl mx-auto opacity-80"
            style={{ animation: "slideUp 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) 0.2s both" }}>
            Experience the Art of Automotive Perfection
          </p>

          <div style={{ animation: "slideUp 1.4s cubic-bezier(0.2, 0.8, 0.2, 1) 0.4s both" }}>
            <button onClick={handleBooking} className="group relative bg-red-600 hover:bg-red-700 text-white font-black text-xl px-14 py-6 rounded-full transition-all duration-500 shadow-[0_0_50px_rgba(220,38,38,0.4)] hover:shadow-[0_0_80px_rgba(220,38,38,0.6)] transform hover:-translate-y-2 active:scale-95">
              <span className="relative z-10 flex items-center gap-4">
                {isLoggedIn ? "GO TO DASHBOARD" : "BOOK YOUR EXPERIENCE"}
                <svg className="w-5 h-5 transform group-hover:translate-x-3 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </button>
            {!isLoggedIn && (
              <p className="mt-6 text-gray-500 text-sm font-medium">
                Part of the elite? <a href="/signin" className="text-red-500 hover:text-red-400 font-bold underline underline-offset-4 decoration-2 transition-all">SIGN IN HERE</a>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Services Section */}
      <section className="py-32 bg-black relative">
        <div className="max-w-7xl mx-auto px-6 reveal">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black text-white mb-4 uppercase tracking-tighter">OUR <span className="text-red-600">SERVICES</span></h2>
            <div className="w-24 h-1.5 bg-red-600 mx-auto rounded-full mb-6" />
            <p className="text-gray-500 text-lg font-medium max-w-2xl mx-auto">Precision-driven solutions for every automotive need. We bring out the best in every vehicle.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z", title: "EXTERIOR", sub: "Showroom Shine", desc: "Multi-stage washing process, clay bar treatment, and machine polishing for a mirror-like finish." },
              { icon: "M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z", title: "INTERIOR", sub: "Pure Luxury", desc: "Steam cleaning, leather conditioning, and deep extraction for a sterile, fresh-from-factory interior." },
              { icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z", title: "PROTECTION", sub: "Ultima Guard", desc: "Grade-A Ceramic coatings and PPF applications providing 9H hardness and hydrophobic properties." }
            ].map((svc, i) => (
              <div key={i} className="group relative bg-white/5 backdrop-blur-xl rounded-3xl p-10 border border-white/10 hover:border-red-600/50 transition-all duration-700 overflow-hidden shadow-2xl">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-red-600/5 rounded-full blur-[60px] group-hover:bg-red-600/15 transition-all duration-700" />
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-red-600/20 rounded-2xl flex items-center justify-center mb-8 border border-red-600/30 group-hover:rotate-[15deg] transition-all duration-500 scale-110">
                    <svg className="w-9 h-9 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={svc.icon} />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-black text-white mb-3 tracking-tighter">
                    {svc.title}
                    <span className="block text-red-600 text-lg font-bold mt-1">{svc.sub}</span>
                  </h3>
                  <p className="text-gray-400 text-lg leading-relaxed font-medium">{svc.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-neutral-900 relative">
        <div className="max-w-7xl mx-auto px-6 reveal">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 uppercase tracking-tighter">
              VISIT OUR SHOP AT <span className="text-red-600">ANY BRANCHES</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto font-medium">
              Experience the pinnacle of automotive care at our flagship North Caloocan location.
            </p>

            {/* Branch Selector */}
            <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/10 w-fit mx-auto mt-8 backdrop-blur-xl">
              {branches.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setActiveBranch(b)}
                  className={`px-8 py-3 rounded-xl font-black text-sm transition-all duration-500 tracking-widest ${activeBranch.id === b.id
                    ? "bg-red-600 text-white shadow-lg"
                    : "text-gray-500 hover:text-white"
                    }`}
                >
                  {b.name.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className={`${isMapExpanded ? "flex-col" : "lg:flex-row"} flex gap-10 items-stretch transition-all duration-700`}>
            <div className={`relative group rounded-[40px] overflow-hidden border border-white/10 shadow-3xl transition-all duration-700 flex-grow ${isMapExpanded ? "h-[70vh]" : "h-[500px] lg:w-2/3"}`}>
              <button
                onClick={() => setIsMapExpanded(!isMapExpanded)}
                className="absolute top-6 right-6 z-20 bg-black/80 hover:bg-red-600 text-white p-4 rounded-2xl border border-white/20 transition-all shadow-2xl backdrop-blur-md"
              >
                {isMapExpanded ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
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

            <div className={`lg:w-1/3 flex flex-col gap-6 transition-all duration-700 ${isMapExpanded ? "hidden" : "flex"}`}>
              <div className="bg-white/5 backdrop-blur-xl rounded-[32px] p-8 border border-white/10 hover:border-red-600/30 transition-all flex-grow shadow-2xl">
                <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-4">
                  <span className="w-1.5 h-8 bg-red-600 rounded-full" />
                  STATION INFO
                </h3>
                <div className="space-y-8">
                  {[
                    { icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z", label: "ADDRESS", value: activeBranch.address },
                    { icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", label: "OPERATING HOURS", value: activeBranch.hours },
                    { icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z", label: "CONTACT LINE", value: activeBranch.phone }
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-red-600/10 rounded-2xl flex items-center justify-center flex-shrink-0 border border-red-600/20 shadow-inner">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={item.icon} />
                        </svg>
                      </div>
                      <div>
                        <p className="text-red-600 font-black text-xs tracking-widest mb-1">{item.label}</p>
                        <p className="text-gray-300 text-lg font-bold leading-tight">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <a href={activeBranch.fb} target="_blank" rel="noopener noreferrer" className="w-full group bg-red-600 hover:bg-red-700 text-white font-black py-6 rounded-[24px] transition-all duration-500 flex items-center justify-center gap-4 text-lg shadow-[0_15px_30px_rgba(220,38,38,0.3)] hover:shadow-[0_20px_40px_rgba(220,38,38,0.5)] transform hover:-translate-y-2">
                FACEBOOK PAGE
                <svg className="w-6 h-6 transform group-hover:translate-x-3 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Sliding Feedbacks */}
      <section className="py-24 bg-red-600 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none"
          style={{ backgroundImage: "repeating-linear-gradient(45deg, #000, #000 1px, transparent 1px, transparent 10px)" }} />

        <div className="text-center mb-16 relative z-10 px-6">
          <h2 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter">CLIENT <span className="text-black">REVIEWS</span></h2>
          <div className="flex justify-center gap-1.5 mt-4">
            {[1, 2, 3, 4, 5].map(s => <svg key={s} className="w-5 h-5 text-black fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
          </div>
        </div>

        <div className="relative">
          <div className="flex animate-marquee hover:[animation-play-state:paused] whitespace-nowrap">
            {[...feedbacks, ...feedbacks].map((f, i) => (
              <div key={i} className="inline-block px-4">
                <div className="w-[350px] md:w-[450px] bg-black text-white p-8 rounded-[32px] shadow-2xl border border-white/10 whitespace-normal">
                  <p className="text-xl italic font-bold leading-relaxed mb-6">"{f.text}"</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center font-black text-lg">{f.name[0]}</div>
                    <div>
                      <h4 className="font-black uppercase tracking-tight">{f.name}</h4>
                      <p className="text-red-600 text-sm font-black tracking-widest">{f.city}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Branches List */}
      <section className="py-24 bg-black border-t border-white/5 reveal">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white tracking-tighter uppercase">OFFICIAL <span className="text-red-600">FACEBOOK PAGES</span></h2>

            <div className="w-16 h-1 bg-red-600 mx-auto mt-6 rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allBranches.map((branch, i) => (
              <a
                key={i}
                href={branch.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/5 hover:bg-white/10 p-6 rounded-2xl border border-white/5 hover:border-red-600/30 transition-all duration-300 flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#1877F2]/10 rounded-lg flex items-center justify-center text-[#1877F2] group-hover:bg-[#1877F2] group-hover:text-white transition-all">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                  </div>
                  <div>
                    <span className="text-white font-bold tracking-tight block">{branch.name}</span>
                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest group-hover:text-red-500 transition-colors">Visit Page</span>
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-600 group-hover:text-white transform group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-24 border-t border-white/5 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-16 mb-20">
            <div className="md:col-span-2">
              <img src={logo} alt="Otokwikk" className="h-16 mb-8 filter brightness-110" />
              <p className="text-gray-500 text-lg font-medium max-w-sm leading-relaxed">
                The absolute standard in automotive luxury care. Precision in every pass, excellence in every detail.
              </p>
            </div>
            <div>
              <h4 className="text-white font-black uppercase tracking-widest mb-8 opacity-50 text-sm">SOCIALS</h4>
              <div className="flex gap-4">
                <a href="#" className="w-14 h-14 bg-white/5 hover:bg-red-600 rounded-2xl flex items-center justify-center transition-all group border border-white/10 shadow-xl">
                  <svg className="w-6 h-6 transform group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                </a>
                <a href="#" className="w-14 h-14 bg-white/5 hover:bg-red-600 rounded-2xl flex items-center justify-center transition-all group border border-white/10 shadow-xl">
                  <svg className="w-6 h-6 transform group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.166.054 1.798.249 2.22.413.56.216.958.477 1.38.898.42.42.681.818.897 1.379.164.422.359 1.054.413 2.22.058 1.266.07 1.645.07 4.85s-.012 3.584-.07 4.85c-.054 1.166-.249 1.798-.413 2.22-.216.561-.477.957-.898 1.378-.42.42-.818.681-1.379.897-.422.164-1.054.359-2.22.413-1.266.058-1.645.07-4.85.07s-3.584-.012-4.85-.07c-1.166-.054-1.798-.249-2.22-.413-.561-.216-.957-.477-1.378-.898-.42-.42-.818-.681-1.38-.897-.421-.164-1.053-.359-2.219-.413-1.266-.058-1.645-.07-4.85-.07s-3.584.012-4.85.07c-1.166.054-1.798.249-2.22.413-.56.216-.958.477-1.38.898-.42.42-.681.818-.897 1.379-.164.422-.359 1.054-.413 2.22-.058 1.266-.07 1.645-.07 4.85s.012 3.584.07 4.85c.054 1.166.249 1.798.413 2.22.216.56.477.958.898 1.38.42.42.818.681 1.379.897.422.164 1.054.359 2.22.413 1.266.058 1.645.07 4.85.07s3.584-.012 4.85-.07c1.166-.054 1.798-.249 2.22-.413.561-.216.957-.477 1.378-.898.42-.42.818-.681 1.38-.897.42-.164 1.054-.359 2.22-.413 1.266-.058 1.645-.07 4.85-.07zM12 0c-3.259 0-3.668.014-4.947.072-1.277.06-2.148.261-2.913.558-.788.305-1.458.715-2.126 1.383-.668.667-1.078 1.338-1.383 2.126-.297.765-.499 1.636-.558 2.913-.06 1.28-.072 1.688-.072 4.947s.012 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.305.788.715 1.459 1.383 2.126.667.668 1.338 1.078 2.126 1.383.765.297 1.636.499 2.913.558 1.28.06 1.688.072 4.947.072s3.667-.012 4.947-.072c1.277-.06 2.148-.261 2.913-.558.788-.305 1.459-.715 2.126-1.383.668-.667 1.078-1.338 1.383-2.126.297-.765.499-1.636.558-2.913.06-1.28.072-1.688.072-4.947s-.012-3.667-.072-4.947c-.06-1.277-.261-2.148-.558-2.913-.305-.788-.715-1.459-1.383-2.126-.667-.668-1.338-1.078-2.126-1.383-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zM12 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zM12 16c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zM18.406 4.154c.795 0 1.439.644 1.439 1.439s-.644 1.439-1.439 1.439-1.439-.644-1.439-1.439.644-1.439 1.439-1.439z" /></svg>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-10 flex flex-col md:flex-row justify-between items-center gap-6 opacity-30">
            <p className="font-bold text-sm tracking-widest">&copy; 2026 OTOKWIKK. ALL RIGHTS RESERVED.</p>
            <div className="flex gap-8 text-xs font-black tracking-widest uppercase">
              <a href="#" className="hover:text-red-500 transition-colors">Privacy</a>
              <a href="#" className="hover:text-red-500 transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes subtle-zoom {
          from { transform: scale(1); }
          to { transform: scale(1.1); }
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
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