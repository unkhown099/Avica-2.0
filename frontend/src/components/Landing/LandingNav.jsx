import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? "bg-black/95 backdrop-blur-md shadow-lg" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center">
            <div className="bg-white rounded-full px-6 py-2.5 shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <span className="text-3xl font-black tracking-tight">
                <span className="text-red-600">oto</span>
                <span className="text-black">kwikk</span>
              </span>
            </div>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-4">
            <Link to="/signin">
            <button className="text-white hover:text-red-600 font-semibold px-6 py-2.5 rounded-lg transition-all duration-300 hover:bg-white/10 border border-transparent hover:border-white/20">
              Sign In
            </button>
            </Link>
            <Link to="/signup">
            <button className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-2.5 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-red-600/50">
              Sign Up
            </button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;