import React from "react";
import logo from "../../assets/otokwikklogo.png";

function Footer() {
  return (
    <footer className="bg-black text-white py-24 border-t border-white/5 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-16 mb-20">
          <div className="md:col-span-2">
            <img src={logo} alt="Otokwikk" className="h-16 mb-8 filter brightness-110" />
            <p className="text-gray-500 text-lg font-medium max-w-sm leading-relaxed">
              Professional auto detailing services across Metro Manila. We bring
              showroom shine to your doorstep with precision and excellence.
            </p>
          </div>

          <div>
            <h3 className="text-white font-black uppercase tracking-widest mb-8 opacity-50 text-sm">SOCIALS</h3>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-14 h-14 bg-white/5 hover:bg-red-600 rounded-2xl flex items-center justify-center transition-all group border border-white/10 shadow-xl"
              >
                <svg className="w-6 h-6 transform group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="#"
                className="w-14 h-14 bg-white/5 hover:bg-red-600 rounded-2xl flex items-center justify-center transition-all group border border-white/10 shadow-xl"
              >
                <svg className="w-6 h-6 transform group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.166.054 1.798.249 2.22.413.56.216.958.477 1.38.898.42.42.681.818.897 1.379.164.422.359 1.054.413 2.22.058 1.266.07 1.645.07 4.85s-.012 3.584-.07 4.85c-.054 1.166-.249 1.798-.413 2.22-.216.561-.477.957-.898 1.378-.42.42-.818.681-1.379.897-.422.164-1.054.359-2.22.413-1.266.058-1.645.07-4.85.07s-3.584-.012-4.85-.07c-1.166-.054-1.798-.249-2.22-.413-.561-.216-.957-.477-1.378-.898-.42-.42-.818-.681-1.38-.897-.421-.164-1.053-.359-2.219-.413-1.266-.058-1.645-.07-4.85-.07s-3.584.012-4.85.07c-1.166.054-1.798.249-2.22.413-.56.216-.958.477-1.38.898-.42.42-.681.818-.897 1.379-.164.422-.359 1.054-.413 2.22-.058 1.266-.07 1.645-.07 4.85s.012 3.584.07 4.85c.054 1.166.249 1.798.413 2.22.216.56.477.958.898 1.38.42.42.818.681 1.379.897.422.164 1.054.359 2.22.413 1.266.058 1.645.07 4.85.07s3.584-.012 4.85-.07c1.166-.054 1.798-.249 2.22-.413.561-.216.957-.477 1.378-.898.42-.42.818-.681 1.38-.897.42-.164 1.054-.359 2.22-.413 1.266-.058 1.645-.07 4.85-.07zM12 0c-3.259 0-3.668.014-4.947.072-1.277.06-2.148.261-2.913.558-.788.305-1.458.715-2.126 1.383-.668.667-1.078 1.338-1.383 2.126-.297.765-.499 1.636-.558 2.913-.06 1.28-.072 1.688-.072 4.947s.012 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.305.788.715 1.459 1.383 2.126.667.668 1.338 1.078 2.126 1.383.765.297 1.636.499 2.913.558 1.28.06 1.688.072 4.947.072s3.667-.012 4.947-.072c1.277-.06 2.148-.261 2.913-.558.788-.305 1.459-.715 2.126-1.383.668-.667 1.078-1.338 1.383-2.126.297-.765.499-1.636.558-2.913.06-1.28.072-1.688.072-4.947s-.012-3.667-.072-4.947c-.06-1.277-.261-2.148-.558-2.913-.305-.788-.715-1.459-1.383-2.126-.667-.668-1.338-1.078-2.126-1.383-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zM12 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zM12 16c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zM18.406 4.154c.795 0 1.439.644 1.439 1.439s-.644 1.439-1.439 1.439-1.439-.644-1.439-1.439.644-1.439 1.439-1.439z" />
                </svg>
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
  );
}

export default Footer;
