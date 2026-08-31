import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import swal from "sweetalert2";
import logo from "../assets/otokwikklogo.png";
import { GoogleLogin } from "@react-oauth/google";
import { API_BASE } from "../hooks/useAuth.js";

const DARK_SWAL = {
  background: "linear-gradient(to bottom right, #1f2937, #111827)",
  color: "#fff",
  confirmButtonColor: "#dc2626",
};

const ROLE_ROUTES = {
  super_admin: "/super-admin/dashboard",
  admin: "/admin/dashboard",
  business_owner: "/branch-owner/dashboard",
  branch_manager: "/manager/dashboard",
  inventory: "/inventory/dashboard",
  inventory_manager: "/inventory-manager/dashboard",
  staff: "/staff/dashboard",
  employee: "/employee/dashboard",
  customer: "/dashboard",
};

const MAINTENANCE_ALLOWED_ROLES = [
  "super_admin",
  "admin",
  "business_owner",
  "branch_manager",
  "staff",
  "employee",
  "inventory",
  "inventory_manager",
];

function normalizeRole(rawRole) {
  const map = {
    "Admin": "admin",
    "Business Owner": "business_owner",
    "Branch Manager": "branch_manager",
    "Staff": "staff",
    "Employee": "employee",
    "Inventory": "inventory",
    "Inventory Manager": "inventory_manager",
    "Super Admin": "super_admin",
  };
  return map[rawRole] ?? rawRole ?? null;
}

async function getMaintenanceStatus(token) {
  try {
    const res = await fetch(`${API_BASE}/system/maintenance-status/`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (res.ok) {
      return res.json();
    }
  } catch (error) {
    console.error("Failed to verify maintenance status after login:", error);
  }

  return {
    is_maintenance_mode: false,
    maintenance_message: "",
    can_bypass: false,
  };
}

function SignIn() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);
  const [errors, setErrors] = useState({});
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [publicStats, setPublicStats] = useState({
    customersRegistered: null,
    averageRating: null,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const storeSession = (tokens, user, remember) => {
    const store = remember ? localStorage : sessionStorage;
    store.setItem("access_token", tokens.access);
    store.setItem("refresh_token", tokens.refresh);
    store.setItem("user", JSON.stringify(user));
  };

  // ── Regular login ───────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || isLoading) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Invalid email or password");
      }

      const normalizedRole = normalizeRole(data.user.role);
      data.user.role = normalizedRole;
      storeSession(data.tokens, data.user, formData.rememberMe);

      const maintenanceStatus = await getMaintenanceStatus(data.tokens.access);
      const mustRedirectToMaintenance =
        maintenanceStatus.is_maintenance_mode &&
        !MAINTENANCE_ALLOWED_ROLES.includes(normalizedRole);

      if (mustRedirectToMaintenance) {
        localStorage.setItem(
          "maintenance_mode",
          JSON.stringify({
            isActive: true,
            message: maintenanceStatus.maintenance_message,
            canBypass: false,
          }),
        );
      }

      const destination = ROLE_ROUTES[normalizedRole] ?? "/";
      const nextRoute = mustRedirectToMaintenance ? "/maintenance" : destination;

      // Fire the alert FIRST, navigate only after it's dismissed.
      // This prevents SweetAlert2's backdrop from mounting on the destination
      // page and blocking all interaction.
      await swal.fire({
        icon: "success",
        title: "Login Successful",
        text: `Welcome back, ${data.user.first_name ?? ""}!`.trim(),
        timer: 1500, // auto-close so user doesn't have to click
        timerProgressBar: true,
        showConfirmButton: false,
        ...DARK_SWAL,
      });

      navigate(nextRoute, { replace: true });
    } catch (err) {
      swal.fire({
        icon: "error",
        title: "Login Failed",
        text: err.message,
        ...DARK_SWAL,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Forgot password ─────────────────────────────────────────────────────────
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      swal.fire({
        icon: "error",
        title: "Error",
        text: "Please enter your email address",
        ...DARK_SWAL,
      });
      return;
    }

    setIsSubmittingForgot(true);
    try {
      const res = await fetch(
        `${API_BASE}/forgot-password/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: forgotEmail }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      swal.fire({
        icon: "success",
        title: "Email Sent",
        text: data.message,
        ...DARK_SWAL,
      });
      setShowForgotModal(false);
      setForgotEmail("");
    } catch (err) {
      swal.fire({
        icon: "error",
        title: "Error",
        text: err.message,
        ...DARK_SWAL,
      });
    } finally {
      setIsSubmittingForgot(false);
    }
  };

  // ── Google login ────────────────────────────────────────────────────────────
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await fetch(
        `${API_BASE}/google-login/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: credentialResponse.credential }),
        },
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Google Login failed");
      }

      // Google login always uses sessionStorage (no "remember me" checkbox)
      const normalizedRole = normalizeRole(data.user.role);
      data.user.role = normalizedRole;
      storeSession(data.tokens, data.user, false);

      const maintenanceStatus = await getMaintenanceStatus(data.tokens.access);
      const mustRedirectToMaintenance =
        maintenanceStatus.is_maintenance_mode &&
        !MAINTENANCE_ALLOWED_ROLES.includes(normalizedRole);

      if (mustRedirectToMaintenance) {
        localStorage.setItem(
          "maintenance_mode",
          JSON.stringify({
            isActive: true,
            message: maintenanceStatus.maintenance_message,
            canBypass: false,
          }),
        );
      }

      const destination = ROLE_ROUTES[normalizedRole] ?? "/";
      const nextRoute = mustRedirectToMaintenance ? "/maintenance" : destination;

      // If new Google user, notify about temporary password
      if (data.is_temporary) {
        await swal.fire({
          icon: "warning",
          title: "Temporary Password Sent",
          text: `Welcome, ${data.user.first_name}! Since you signed up via Google, we've sent a temporary password to your email (${data.user.email}). Please use it to set a secure permanent password in your account settings.`,
          showConfirmButton: true,
          confirmButtonText: "Go to Settings",
          showCancelButton: true,
          cancelButtonText: "Later",
          ...DARK_SWAL,
        }).then((result) => {
          if (result.isConfirmed) {
            navigate(
              mustRedirectToMaintenance ? "/maintenance" : "/settings",
              { replace: true },
            );
          } else {
            navigate(nextRoute, { replace: true });
          }
        });
      } else {
        await swal.fire({
          icon: "success",
          title: "Login Successful",
          text: "Welcome back!",
          timer: 1500,
          timerProgressBar: true,
          showConfirmButton: false,
          ...DARK_SWAL,
        });
        navigate(nextRoute, { replace: true });
      }
    } catch (err) {
      swal.fire({
        icon: "error",
        title: "Google Login Failed",
        text: err.message,
        ...DARK_SWAL,
      });
    }
  };

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const res = await fetch(`${API_BASE}/system/maintenance-status/`);
        if (res.ok) {
          const data = await res.json();
          setIsMaintenanceMode(data.is_maintenance_mode);
          setMaintenanceMessage(data.maintenance_message);
        }
      } catch (err) {
        console.error("Failed to check maintenance:", err);
      }
    };
    checkMaintenance();
    
    // Listen for maintenance changes
    const handleChange = () => checkMaintenance();
    window.addEventListener("maintenance-mode-changed", handleChange);
    return () => window.removeEventListener("maintenance-mode-changed", handleChange);
  }, []);

  useEffect(() => {
    const fetchPublicStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/public/signin-stats/`);
        if (!res.ok) return;

        const data = await res.json();
        setPublicStats({
          customersRegistered: Number(data.customers_registered) || 0,
          averageRating: Number(data.average_rating) || 0,
        });
      } catch (err) {
        console.error("Failed to fetch sign-in stats:", err);
      }
    };

    fetchPublicStats();
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen bg-black flex items-center justify-center px-6 relative overflow-hidden">
      {/* Maintenance Warning Banner */}
        {isMaintenanceMode && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-red-600/95 via-yellow-500/95 to-red-600/95 border-t border-yellow-500/50 backdrop-blur-md shadow-2xl">
            <div className="flex items-center">
              {/* Static label */}
              <div className="flex items-center gap-2 bg-black/50 px-4 py-3 shrink-0">
                <svg className="h-4 w-4 text-yellow-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-[10px] font-black uppercase tracking-wider text-yellow-400 whitespace-nowrap">
                  MAINTENANCE MODE
                </span>
              </div>
              
              {/* Scrolling message */}
              <div className="flex-1 overflow-hidden">
                <div className="whitespace-nowrap animate-[ticker_20s_linear_infinite] py-3 hover:animation-pause">
                  {[...Array(6)].map((_, i) => (
                    <span key={i} className="inline-flex items-center mx-8">
                      <span className="text-sm text-yellow-100 font-semibold">
                        ⚠️ {maintenanceMessage || "System is under maintenance. Only administrators can access after login."} ⚠️
                      </span>
                      <span className="text-yellow-400 mx-4 text-lg">✦</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      {/* Back arrow */}
      <Link
        to="/"
        className="fixed top-5 left-5 z-50 w-11 h-11 bg-white/5 hover:bg-red-600 border border-white/10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300 shadow-lg backdrop-blur-sm"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </Link>

      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Main grid */}
      <div className="w-full max-w-6xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          {/* Left branding */}
          <div className="hidden lg:block">
            <div className="space-y-8">
              <img
                src={logo}
                alt="Otokwikk logo"
                className="h-20 object-contain"
              />
              <div>
                <h1 className="text-6xl font-black text-white mb-5 leading-tight">
                  Welcome
                  <br />
                  Back!
                </h1>
                <p className="text-xl text-gray-400 leading-relaxed mb-8">
                  Sign in to access your account and continue enjoying premium
                  auto detailing services.
                </p>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-gray-900 to-red-950/20 rounded-2xl p-7 border border-white/5">
                    <div className="text-5xl font-black text-red-600 mb-2">
                      {publicStats.customersRegistered !== null
                        ? publicStats.customersRegistered.toLocaleString()
                        : "—"}
                    </div>
                    <div className="text-lg text-gray-400">Served Customers</div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-900 to-red-950/20 rounded-2xl p-7 border border-white/5">
                    <div className="text-5xl font-black text-red-600 mb-2">
                      {publicStats.averageRating !== null
                        ? `${publicStats.averageRating.toFixed(1)}★`
                        : "—"}
                    </div>
                    <div className="text-lg text-gray-400">Average Rating</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right form */}
          <div className="w-full">
            <div className="bg-gradient-to-br from-gray-900 to-red-950/20 rounded-3xl p-10 border border-white/5 shadow-2xl">
              <div className="lg:hidden mb-6 text-center">
                <img
                  src={logo}
                  alt="Otokwikk logo"
                  className="h-14 object-contain mx-auto"
                />
              </div>

              <div className="mb-7">
                <h2 className="text-4xl font-black text-white mb-2">Sign In</h2>
                <p className="text-gray-400 text-lg">
                  Enter your credentials to access your account
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
                autoComplete="off"
              >
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-lg font-semibold text-gray-300 mb-2"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="off"
                    placeholder="john.doe@example.com"
                    className={`w-full px-5 py-3.5 bg-gray-900 border ${errors.email ? "border-red-600" : "border-gray-700"
                      } rounded-xl text-white text-lg placeholder-gray-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/50 transition-all duration-300`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-base mt-1">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-lg font-semibold text-gray-300 mb-2"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      autoComplete="off"
                      placeholder="••••••••"
                      className={`w-full px-5 py-3.5 bg-gray-900 border ${errors.password ? "border-red-600" : "border-gray-700"
                        } rounded-xl text-white text-lg placeholder-gray-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/50 transition-all duration-300 pr-14`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-base mt-1">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Remember me & Forgot */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleChange}
                      className="w-5 h-5 bg-gray-900 border-gray-700 rounded text-red-600 focus:ring-red-600 focus:ring-2 cursor-pointer"
                    />
                    <label
                      htmlFor="rememberMe"
                      className="text-lg text-gray-400 cursor-pointer"
                    >
                      Remember me
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-lg text-red-600 hover:text-red-500 font-semibold"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-all duration-300 transform text-xl flex items-center justify-center gap-3 shadow-lg shadow-red-600/30 ${
                    isLoading
                      ? "opacity-80 cursor-not-allowed"
                      : "hover:scale-[1.02] hover:shadow-2xl hover:shadow-red-600/50"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin h-6 w-6 text-white"
                        xmlns="http://www.w3.org/2000/svg"
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
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>Logging in...</span>
                    </>
                  ) : (
                    <span>Log In</span>
                  )}
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-900 text-gray-400">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() =>
                      swal.fire({
                        icon: "error",
                        title: "Google Login Failed",
                        ...DARK_SWAL,
                      })
                    }
                    theme="filled_black"
                    shape="pill"
                    size="large"
                    width="100%"
                  />
                </div>

                <div className="text-center">
                  <p className="text-gray-400 text-lg">
                    Create an Account{" "}
                    <Link
                      to="/signup"
                      className="text-red-600 hover:text-red-500 font-semibold"
                    >
                      Sign Up
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            onClick={() => setShowForgotModal(false)}
          />
          <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-red-950/20 w-full max-w-md rounded-[32px] border border-white/10 shadow-3xl relative z-10 overflow-hidden">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/20">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
                Reset Password
              </h3>
              <button
                onClick={() => setShowForgotModal(false)}
                className="w-10 h-10 bg-white/5 hover:bg-red-600 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-8 space-y-6">
              <p className="text-gray-400 text-lg leading-relaxed">
                Enter your email address and we'll send you a link to reset your
                password.
              </p>
              <div>
                <label className="block text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">
                  Email Address
                </label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-5 py-4 bg-black border border-white/10 rounded-2xl text-white focus:outline-none focus:border-red-600 transition-all placeholder-gray-600"
                />
              </div>
              <button
                onClick={handleForgotPassword}
                disabled={isSubmittingForgot}
                className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-800 text-white font-black rounded-2xl transition-all tracking-widest uppercase shadow-lg shadow-red-600/20"
              >
                {isSubmittingForgot ? "Sending..." : "Send Reset Link"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        input[type="checkbox"]:checked {
          background-color: #dc2626;
          border-color: #dc2626;
        }
      `}</style>
    </div>
  );
}

export default SignIn;
