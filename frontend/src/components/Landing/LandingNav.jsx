import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { API_BASE } from "../../hooks/useAuth.js";
import { useTheme } from "../../context/ThemeContext.jsx";
import Swal from "sweetalert2";
import logo from "../../assets/otokwikklogo.png";

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { toggleTheme, isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const loadUser = useCallback(() => {
    const storedUser =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    setUser(storedUser ? JSON.parse(storedUser) : null);
  }, []);

  useEffect(() => {
    loadUser();
  }, [location, loadUser]);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  useEffect(() => {
    window.addEventListener("storage", loadUser);
    return () => window.removeEventListener("storage", loadUser);
  }, [loadUser]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const handleLogout = async () => {
    setMenuOpen(false);
    const refresh =
      localStorage.getItem("refresh_token") ||
      sessionStorage.getItem("refresh_token");

    try {
      await fetch(`${API_BASE}/logout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${
            localStorage.getItem("access_token") ||
            sessionStorage.getItem("access_token")
          }`,
        },
        body: JSON.stringify({ refresh }),
      });
    } catch (_) {
      // fail silently
    }

    ["access_token", "refresh_token", "user"].forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    setUser(null);

    await Swal.fire({
      icon: "success",
      title: "Logged Out",
      text: "You have been successfully logged out.",
      background: "linear-gradient(to bottom right, #1f2937, #111827)",
      color: "#fff",
      confirmButtonColor: "#dc2626",
    });

    navigate("/");
  };

  const displayName = user
    ? user.name
      ? user.name.split(" ")[0]
      : user.email?.split("@")[0]
    : null;

  return (
    <>
      {/* ── Main nav bar ── */}
      <nav
        className="fixed top-0 w-full z-50 bg-black border-b border-white/10 shadow-lg transition-colors duration-300"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 transition-all duration-300">

            {/* Logo */}
            <div className="flex items-center transform hover:scale-105 transition-transform duration-300 flex-shrink-0">
              <Link to="/">
                <img
                  src={logo}
                  alt="Otokwikk logo"
                  className="h-9 sm:h-12 md:h-14 object-contain filter drop-shadow-2xl"
                />
              </Link>
            </div>

            {/* ── Desktop: Theme Toggle + Auth ── */}
            <div className="hidden sm:flex items-center gap-3 md:gap-4">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="w-10 h-10 rounded-full flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all duration-300"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? (
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {/* ── Logged OUT ── */}
              {!user && (
                <div className="flex items-center gap-3 md:gap-5">
                  <Link to="/signin">
                    <button className="text-white/80 hover:text-white font-medium px-3 md:px-4 py-2 transition-all duration-300 relative group text-sm md:text-base">
                      Sign In
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-600 transition-all duration-300 group-hover:w-full" />
                    </button>
                  </Link>
                  <Link to="/signup">
                    <button className="relative inline-flex items-center justify-center px-6 md:px-8 py-2.5 md:py-3 overflow-hidden font-bold text-white transition duration-300 ease-out border-2 border-red-600 rounded-full shadow-md group text-sm md:text-base">
                      <span className="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-red-600 group-hover:translate-x-0 ease">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </span>
                      <span className="absolute flex items-center justify-center w-full h-full text-red-600 transition-all duration-300 transform group-hover:translate-x-full ease">
                        Sign Up
                      </span>
                      <span className="relative invisible">Sign Up</span>
                    </button>
                  </Link>
                </div>
              )}

              {/* ── Logged IN ── */}
              {user && (
                <div className="flex items-center gap-3 md:gap-5">
                  {user.role === "customer" && (
                    <>
                      <Link to="/dashboard">
                        <button className="text-white/80 hover:text-white font-medium px-3 md:px-4 py-2 transition-all duration-300 relative group text-sm md:text-base">
                          Dashboard
                          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-600 transition-all duration-300 group-hover:w-full" />
                        </button>
                      </Link>
                      <Link to="/profile">
                        <button className="text-white/80 hover:text-white font-medium px-3 md:px-4 py-2 transition-all duration-300 relative group text-sm md:text-base">
                          Profile
                          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-600 transition-all duration-300 group-hover:w-full" />
                        </button>
                      </Link>
                    </>
                  )}

                  {user.role === "admin" && (
                    <Link to="/admin/dashboard">
                      <button className="text-white/80 hover:text-white font-medium px-3 md:px-4 py-2 transition-all duration-300 relative group text-sm md:text-base">
                        Admin Panel
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-600 transition-all duration-300 group-hover:w-full" />
                      </button>
                    </Link>
                  )}

                  {/* Welcome badge */}
                  <div className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-full border border-red-600/40 bg-red-600/10 backdrop-blur-sm">
                    <span className="relative flex h-2 w-2 flex-shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
                    </span>
                    <span className="text-xs md:text-sm font-medium text-white/70 whitespace-nowrap">
                      Hey, <span className="font-black text-white">{displayName}</span>!
                    </span>
                  </div>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="relative inline-flex items-center justify-center px-6 md:px-8 py-2.5 md:py-3 overflow-hidden font-bold text-white transition duration-300 ease-out border-2 border-red-600 rounded-full shadow-md group text-sm md:text-base"
                  >
                    <span className="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-red-600 group-hover:translate-x-0 ease">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </span>
                    <span className="absolute flex items-center justify-center w-full h-full text-red-600 transition-all duration-300 transform group-hover:translate-x-full ease">
                      Logout
                    </span>
                    <span className="relative invisible">Logout</span>
                  </button>
                </div>
              )}
            </div>

            {/* ── Mobile: Hamburger button ── */}
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="sm:hidden flex items-center justify-center w-10 h-10 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md text-white transition-all duration-300 hover:border-red-600/50 hover:bg-red-600/10 flex-shrink-0"
              aria-label="Toggle menu"
            >
              <div className="w-5 h-4 flex flex-col justify-between">
                <span
                  className={`block h-0.5 bg-white rounded-full transition-all duration-300 origin-center ${
                    menuOpen ? "rotate-45 translate-y-[7px]" : ""
                  }`}
                />
                <span
                  className={`block h-0.5 bg-white rounded-full transition-all duration-300 ${
                    menuOpen ? "opacity-0 scale-x-0" : ""
                  }`}
                />
                <span
                  className={`block h-0.5 bg-white rounded-full transition-all duration-300 origin-center ${
                    menuOpen ? "-rotate-45 -translate-y-[7px]" : ""
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile Drawer ── */}
      <div
        className={`fixed inset-0 z-40 sm:hidden transition-all duration-500 ${
          menuOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          onClick={() => setMenuOpen(false)}
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${
            menuOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Slide-in panel */}
        <div
          className={`absolute top-0 right-0 h-full w-72 max-w-[85vw] bg-[#0a0a0a] border-l border-white/10 shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex flex-col ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
            <img src={logo} alt="Otokwikk logo" className="h-8 object-contain" />
            <button
              onClick={() => setMenuOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-red-600/50 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Drawer body */}
          <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-2">

            {/* Logged-in welcome */}
            {user && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-red-600/30 bg-red-600/10 mb-4">
                <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
                </span>
                <span className="text-sm font-medium text-white/70">
                  Hey, <span className="font-black text-white">{displayName}</span>!
                </span>
              </div>
            )}

            {/* Nav links */}
            {!user && (
              <>
                <MobileNavLink to="/signin" onClick={() => setMenuOpen(false)}>Sign In</MobileNavLink>
                <MobileNavLink to="/signup" onClick={() => setMenuOpen(false)} accent>Sign Up</MobileNavLink>
              </>
            )}

            {user?.role === "customer" && (
              <>
                <MobileNavLink to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</MobileNavLink>
                <MobileNavLink to="/profile" onClick={() => setMenuOpen(false)}>Profile</MobileNavLink>
              </>
            )}

            {user?.role === "admin" && (
              <MobileNavLink to="/admin/dashboard" onClick={() => setMenuOpen(false)}>Admin Panel</MobileNavLink>
            )}

            {/* Mobile Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-full px-4 py-3.5 rounded-2xl font-bold text-base transition-all duration-200 flex items-center justify-between text-white/70 hover:text-white hover:bg-white/5 border border-white/10 mt-2"
            >
              <div className="flex items-center gap-3">
                {isDark ? (
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
                <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
              </div>
              <div className={`relative w-8 h-4 rounded-full transition-colors duration-300 ${isDark ? "bg-gray-700" : "bg-red-500"}`}>
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all duration-300 ${isDark ? "left-0.5" : "left-[18px]"}`} />
              </div>
            </button>
          </div>

          {/* Logout at bottom */}
          {user && (
            <div className="px-6 pb-8 border-t border-white/10 pt-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white font-black py-3.5 rounded-2xl transition-all duration-300 shadow-[0_8px_20px_rgba(220,38,38,0.3)]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

/* Helper: mobile nav link */
function MobileNavLink({ to, onClick, accent, children }) {
  return (
    <Link to={to} onClick={onClick}>
      <div
        className={`w-full px-4 py-3.5 rounded-2xl font-bold text-base transition-all duration-200 flex items-center justify-between group ${
          accent
            ? "bg-red-600 text-white shadow-[0_6px_20px_rgba(220,38,38,0.3)] hover:bg-red-700"
            : "text-white/70 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
        }`}
      >
        {children}
        <svg
          className={`w-4 h-4 transition-transform duration-200 group-hover:translate-x-1 ${
            accent ? "text-white/80" : "text-white/30 group-hover:text-white/60"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

export default Navbar;
