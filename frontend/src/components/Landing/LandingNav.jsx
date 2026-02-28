import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/otokwikklogo.png";

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
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled
          ? "bg-black/80 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
          : "bg-transparent"
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-24 transition-all duration-500">
          {/* Logo */}
          <div className="flex items-center transform hover:scale-105 transition-transform duration-300">
            <Link to="/">
              <img
                src={logo}
                alt="Otokwikk logo"
                className="h-12 md:h-16 object-contain filter drop-shadow-2xl"
              />
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-6">
            <Link to="/signin">
              <button className="text-white/80 hover:text-white font-medium px-4 py-2 transition-all duration-300 relative group">
                Sign In
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-600 transition-all duration-300 group-hover:w-full"></span>
              </button>
            </Link>
            <Link to="/signup">
              <button className="relative inline-flex items-center justify-center px-8 py-3 overflow-hidden font-bold text-white transition duration-300 ease-out border-2 border-red-600 rounded-full shadow-md group">
                <span className="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-red-600 group-hover:translate-x-0 ease">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </span>
                <span className="absolute flex items-center justify-center w-full h-full text-red-600 transition-all duration-300 transform group-hover:translate-x-full ease">Sign Up</span>
                <span className="relative invisible">Sign Up</span>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;