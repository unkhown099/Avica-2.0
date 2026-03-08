import React, { useState, useEffect } from "react";
import Navbar from "../components/Landing/LandingNav.jsx";
import logo from "../assets/otokwikklogo.png";
import shopBg from "../assets/otosaranay.png";

function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-black font-sans">
      <Navbar />

      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${shopBg})`,
              filter: "brightness(0.4)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
        </div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-56 h-56 bg-red-600/10 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-20 right-10 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-6 sm:px-8 lg:px-12 max-w-4xl mx-auto pt-20">
          {/* Logo Badge */}
          <div className="mb-5 inline-block animate-[fadeIn_1s_ease-out]">
            <div className="bg-white/5 backdrop-blur-sm p-2.5 rounded-xl border border-white/10 shadow-2xl">
              <img
                src={logo}
                alt="Otokwikk logo"
                className="h-11 md:h-14 object-contain filter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
              />
            </div>
          </div>

          {/* Main Heading */}
          <h1
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white mb-5 leading-[0.9] tracking-tighter"
            style={{
              animation: "slideUp 1s cubic-bezier(0.2, 0.8, 0.2, 1) both",
              textShadow: "0 10px 40px rgba(0,0,0,0.8)",
            }}
          >
            PRECISION
            <br />
            <span className="text-red-600 bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-red-400">
              DETAILING
            </span>
          </h1>

          {/* Subheading */}
          <p
            className="text-sm sm:text-base md:text-lg text-gray-300 mb-8 font-medium tracking-[0.2em] uppercase max-w-xl mx-auto"
            style={{
              animation: "slideUp 1s cubic-bezier(0.2, 0.8, 0.2, 1) 0.2s both",
            }}
          >
            Experience the Art of Automotive Perfection
          </p>

          {/* CTA Button */}
          <div
            style={{
              animation: "slideUp 1s cubic-bezier(0.2, 0.8, 0.2, 1) 0.4s both",
            }}
          >
            <a href="/signup">
              <button className="group relative bg-red-600 hover:bg-red-700 text-white font-black text-lg px-12 py-5 rounded-full transition-all duration-500 overflow-hidden shadow-[0_0_40px_rgba(220,38,38,0.3)] hover:shadow-[0_0_60px_rgba(220,38,38,0.5)] transform hover:-translate-y-1">
                <span className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-500 to-red-700 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="relative z-10 flex items-center gap-3">
                  BOOK YOUR EXPERIENCE
                  <svg
                    className="w-4 h-4 transform group-hover:translate-x-2 transition-transform duration-500"
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
            </a>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <section className="py-16 bg-gradient-to-b from-black via-gray-900 to-black relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
            }}
          />
        </div>

        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
              Our Services
            </h2>
            <div className="w-16 h-1 bg-red-600 mx-auto rounded-full" />
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {/* Service Card 1 */}
            <div className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-8 hover:transform hover:-translate-y-3 transition-all duration-500 border border-white/10 hover:border-red-600/50 hover:bg-white/10 overflow-hidden shadow-xl">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-red-600/10 rounded-full blur-3xl group-hover:bg-red-600/20 transition-all duration-500" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-red-600/20 rounded-xl flex items-center justify-center mb-6 transform group-hover:rotate-[10deg] transition-all duration-500 border border-red-600/30">
                  <svg
                    className="w-8 h-8 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-white mb-2 tracking-tight">
                  EXTERIOR
                  <span className="block text-red-600 text-base font-bold">
                    Showroom Shine
                  </span>
                </h3>
                <p className="text-gray-400 text-base leading-relaxed font-medium">
                  Multi-stage washing process, clay bar treatment, and machine
                  polishing for a mirror-like finish.
                </p>
              </div>
            </div>

            {/* Service Card 2 */}
            <div className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-8 hover:transform hover:-translate-y-3 transition-all duration-500 border border-white/10 hover:border-red-600/50 hover:bg-white/10 overflow-hidden shadow-xl">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-red-600/10 rounded-full blur-3xl group-hover:bg-red-600/20 transition-all duration-500" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-red-600/20 rounded-xl flex items-center justify-center mb-6 transform group-hover:rotate-[10deg] transition-all duration-500 border border-red-600/30">
                  <svg
                    className="w-8 h-8 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-white mb-2 tracking-tight">
                  INTERIOR
                  <span className="block text-red-600 text-base font-bold">
                    Pure Luxury
                  </span>
                </h3>
                <p className="text-gray-400 text-base leading-relaxed font-medium">
                  Steam cleaning, leather conditioning, and deep extraction for
                  a sterile, fresh-from-factory interior.
                </p>
              </div>
            </div>

            {/* Service Card 3 */}
            <div className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-8 hover:transform hover:-translate-y-3 transition-all duration-500 border border-white/10 hover:border-red-600/50 hover:bg-white/10 overflow-hidden shadow-xl">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-red-600/10 rounded-full blur-3xl group-hover:bg-red-600/20 transition-all duration-500" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-red-600/20 rounded-xl flex items-center justify-center mb-6 transform group-hover:rotate-[10deg] transition-all duration-500 border border-red-600/30">
                  <svg
                    className="w-8 h-8 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-white mb-2 tracking-tight">
                  PROTECTION
                  <span className="block text-red-600 text-base font-bold">
                    Ultima Guard
                  </span>
                </h3>
                <p className="text-gray-400 text-base leading-relaxed font-medium">
                  Grade-A Ceramic coatings and PPF applications providing 9H
                  hardness and hydrophobic properties.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-600/5 to-transparent" />

        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                Why Choose
                <br />
                Otokwikk?
              </h2>
              <div className="w-16 h-1 bg-red-600 rounded-full mb-6" />

              <div className="space-y-5">
                {[
                  {
                    title: "Expert Technicians",
                    desc: "Highly trained professionals with years of experience",
                  },
                  {
                    title: "Premium Products",
                    desc: "We use only the finest automotive care products",
                  },
                  {
                    title: "Satisfaction Guaranteed",
                    desc: "Your complete satisfaction is our top priority",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 group">
                    <div className="flex-shrink-0 w-11 h-11 bg-red-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">
                        {item.title}
                      </h3>
                      <p className="text-gray-400 text-base">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-red-600/20 blur-[100px] rounded-full animate-pulse" />
              <div className="relative bg-white/5 backdrop-blur-xl rounded-[32px] p-8 border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]">
                <div className="text-center">
                  <div className="text-7xl font-black text-white mb-1 tracking-tighter">
                    10K<span className="text-red-600">+</span>
                  </div>
                  <div className="text-gray-400 font-bold tracking-widest uppercase mb-8 text-sm">
                    Premium Clients Served
                  </div>

                  <div className="grid grid-cols-2 gap-5 mb-8">
                    <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                      <div className="text-4xl font-black text-red-600 mb-0.5">
                        5.0
                      </div>
                      <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">
                        Average Rating
                      </div>
                    </div>
                    <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                      <div className="text-4xl font-black text-red-600 mb-0.5">
                        15+
                      </div>
                      <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">
                        Years Expertise
                      </div>
                    </div>
                  </div>

                  <button className="w-full bg-white text-black hover:bg-red-600 hover:text-white font-black py-5 rounded-full transition-all duration-500 transform hover:scale-[1.02] shadow-xl text-base">
                    BOOK YOUR SESSION
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Location & Feedbacks Section */}
      <section className="py-16 bg-neutral-900 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 uppercase tracking-tighter">
              VISIT OUR SHOP AT <span className="text-red-600">SARANAY</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto font-medium">
              Experience the pinnacle of automotive care at our flagship North
              Caloocan location.
            </p>
          </div>

          <div
            className={`${isMapExpanded ? "grid-cols-1" : "lg:grid-cols-2"} grid gap-8 items-start mb-16 transition-all duration-700`}
          >
            {/* Google Maps Embed */}
            <div
              className={`relative group rounded-[28px] overflow-hidden border border-white/10 shadow-2xl transition-all duration-700 ${isMapExpanded ? "h-[60vh] col-span-full" : "h-[380px]"}`}
            >
              <div className="absolute inset-0 bg-red-600/5 group-hover:bg-transparent transition-colors duration-500 z-10 pointer-events-none" />

              <button
                onClick={() => setIsMapExpanded(!isMapExpanded)}
                className="absolute top-4 right-4 z-20 bg-black/60 hover:bg-red-600 backdrop-blur-md text-white p-3 rounded-xl border border-white/20 transition-all duration-300 shadow-2xl"
                title={isMapExpanded ? "Collapse Map" : "Expand Map"}
              >
                {isMapExpanded ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M9 9L4 4m0 0l5 0m-5 0l0 5m11 0l5-5m0 0l-5 0m5 0l0 5m-5 11l5 5m0 0l-5 0m5 0l0-5m-11 0l-5 5m0 0l5 0m-5 0l0-5"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                    />
                  </svg>
                )}
              </button>

              <iframe
                title="Otokwikk Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1930.5615!2d121.023!3d14.752!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397b1b477bf30a7%3A0x34a49388d0848c77!2sOtokwikk%20North%20Caloocan!5e0!3m2!1sen!2sph!4v1708740000000!5m2!1sen!2sph"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="grayscale opacity-80 contrast-125 hover:grayscale-0 hover:opacity-100 transition-all duration-700"
              />
            </div>

            {/* Contact & Hours Details */}
            <div
              className={`space-y-5 transition-all duration-700 ${isMapExpanded ? "opacity-0 h-0 overflow-hidden absolute" : "opacity-100"}`}
            >
              <div className="bg-white/5 backdrop-blur-sm rounded-[24px] p-6 border border-white/10 hover:border-red-600/30 transition-all">
                <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                  <span className="w-1 h-5 bg-red-600 rounded-full" />
                  SHOP DETAILS
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z",
                      label: "Our Location",
                      value:
                        "Lot 1 Block 1, Camarin Road, North Caloocan, Metro Manila",
                    },
                    {
                      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
                      label: "Operating Hours",
                      value: "Monday - Sunday: 8:00 AM - 7:00 PM",
                    },
                    {
                      icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
                      label: "Contact Us",
                      value: "+63 9XX XXX XXXX | info@otokwikk.com",
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-red-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-5 h-5 text-red-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d={item.icon}
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-200 font-bold text-base mb-0.5">
                          {item.label}
                        </p>
                        <p className="text-gray-400 text-base">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button className="w-full group bg-red-600 hover:bg-red-700 text-white font-black py-5 rounded-[18px] transition-all duration-500 flex items-center justify-center gap-3 text-base">
                GET DIRECTIONS
                <svg
                  className="w-4 h-4 transform group-hover:translate-x-2 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Feedbacks Header */}
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tighter">
              WHAT OUR <span className="text-red-600">CLIENTS</span> SAY
            </h2>
            <div className="flex justify-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className="w-4 h-4 text-red-600 fill-current"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
              Certified 5.0 Rated Detailing Service
            </p>
          </div>

          {/* Reviews Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Lorenzo M.",
                role: "Superbike Enthusiast",
                comment:
                  "The precision they show is unmatched. My bike looks even better than the day I bought it. Best detailing in North Caloocan!",
              },
              {
                name: "Maria K.",
                role: "SUV Owner",
                comment:
                  "Professional staff and premium products. The ceramic coating they applied is purely magical. Highly recommended!",
              },
              {
                name: "Paolo D.",
                role: "Luxury Sedan Owner",
                comment:
                  "Attention to detail is their signature. They didn't miss a single spot. Otokwikk truly understands automotive art.",
              },
            ].map((review, i) => (
              <div
                key={i}
                className="bg-white/5 backdrop-blur-xl rounded-[24px] p-6 border border-white/5 hover:border-red-600/30 transition-all duration-500 group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center text-white font-black text-lg shadow-lg ring-2 ring-red-600/20">
                    {review.name[0]}
                  </div>
                  <div>
                    <h4 className="text-white font-black text-base leading-tight">
                      {review.name}
                    </h4>
                    <p className="text-red-500 text-sm font-bold">
                      {review.role}
                    </p>
                  </div>
                </div>
                <p className="text-gray-400 text-base leading-relaxed italic font-medium">
                  "{review.comment}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-16 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-600/5 to-transparent pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="mb-5">
                <img
                  src={logo}
                  alt="Otokwikk logo"
                  className="h-12 md:h-16 object-contain filter brightness-110"
                />
              </div>
              <p className="text-gray-400 text-base mb-6 leading-relaxed max-w-sm font-medium">
                Redefining automotive care with precision detailing and showroom
                excellence across Metro Manila.
              </p>
              <div className="flex gap-3">
                {[
                  {
                    icon: "facebook",
                    path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
                  },
                  {
                    icon: "twitter",
                    path: "M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z",
                  },
                  {
                    icon: "instagram",
                    path: "M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z",
                  },
                ].map((social, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-12 h-12 bg-white/5 hover:bg-red-600 rounded-xl flex items-center justify-center transition-all duration-300 border border-white/10 group shadow-lg"
                  >
                    <svg
                      className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d={social.path} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-base font-black mb-5 tracking-widest uppercase text-white/50">
                Navigation
              </h3>
              <ul className="space-y-3">
                {["Services", "Our Process", "Gallery", "Contact"].map(
                  (link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-gray-400 hover:text-red-500 transition-colors duration-300 text-base font-medium"
                      >
                        {link}
                      </a>
                    </li>
                  ),
                )}
              </ul>
            </div>

            <div>
              <h3 className="text-base font-black mb-5 tracking-widest uppercase text-white/50">
                Contact
              </h3>
              <ul className="space-y-4 text-gray-400 text-base font-medium">
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-600/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg
                      className="w-4 h-4 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <span>
                    Lot 1 Block 1, Camarin Road,
                    <br />
                    North Caloocan, Metro Manila
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-600/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg
                      className="w-4 h-4 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <span>+63 9XX XXX XXXX</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-base font-medium">
              &copy; 2026 <span className="text-white font-bold">Otokwikk</span>
              . All rights reserved.
            </p>
            <div className="flex gap-6 text-gray-500 text-base font-medium">
              <a href="#" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}

export default LandingPage;