import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { API_BASE } from "../../hooks/useAuth.js";
import Swal from "sweetalert2";
import logo from "../../assets/otokwikklogo.png";

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);
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

  useEffect(() => {
    window.addEventListener("storage", loadUser);
    return () => window.removeEventListener("storage", loadUser);
  }, [loadUser]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    const refresh =
      localStorage.getItem("refresh_token") ||
      sessionStorage.getItem("refresh_token");

    try {
      await fetch(`${API_BASE}/logout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token") || sessionStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({ refresh }),
      });
    } catch (_) {
      // fail silently — still clear storage
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

  // Friendly display name: first name > email prefix
  const displayName = user
    ? user.name
      ? user.name.split(" ")[0]
      : user.email?.split("@")[0]
    : null;

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

          {/* ── Logged OUT ── */}
          {!user && (
            <div className="flex items-center gap-6">
              <Link to="/signin">
                <button className="text-white/80 hover:text-white font-medium px-4 py-2 transition-all duration-300 relative group">
                  Sign In
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-600 transition-all duration-300 group-hover:w-full" />
                </button>
              </Link>
              <Link to="/signup">
                <button className="relative inline-flex items-center justify-center px-8 py-3 overflow-hidden font-bold text-white transition duration-300 ease-out border-2 border-red-600 rounded-full shadow-md group">
                  <span className="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-red-600 group-hover:translate-x-0 ease">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
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
            <div className="flex items-center gap-5">
              {/* Nav links by role */}
              {user.role === "customer" && (
                <>
                  <Link to="/dashboard">
                    <button className="text-white/80 hover:text-white font-medium px-4 py-2 transition-all duration-300 relative group">
                      Dashboard
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-600 transition-all duration-300 group-hover:w-full" />
                    </button>
                  </Link>
                  <Link to="/profile">
                    <button className="text-white/80 hover:text-white font-medium px-4 py-2 transition-all duration-300 relative group">
                      Profile
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-600 transition-all duration-300 group-hover:w-full" />
                    </button>
                  </Link>
                </>
              )}

              {user.role === "admin" && (
                <Link to="/admin/dashboard">
                  <button className="text-white/80 hover:text-white font-medium px-4 py-2 transition-all duration-300 relative group">
                    Admin Panel
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-600 transition-all duration-300 group-hover:w-full" />
                  </button>
                </Link>
              )}

              {/* ── Welcome Badge ── */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-red-600/40 bg-red-600/10 backdrop-blur-sm">
                {/* Ping dot */}
                <span className="relative flex h-2 w-2 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
                </span>
                <span className="text-sm font-medium text-white/70 whitespace-nowrap">
                  Hey,{" "}
                  <span className="font-black text-white">{displayName}</span>!
                </span>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="relative inline-flex items-center justify-center px-8 py-3 overflow-hidden font-bold text-white transition duration-300 ease-out border-2 border-red-600 rounded-full shadow-md group"
              >
                <span className="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-red-600 group-hover:translate-x-0 ease">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
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
      </div>
    </nav>
  );
};

export default Navbar;
