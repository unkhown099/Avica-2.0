import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import swal from "sweetalert2";
import logo from "../assets/otokwikklogo.png";
import { GoogleLogin } from "@react-oauth/google";
import { API_BASE } from "../hooks/useAuth.js";
import { useTheme } from "../context/ThemeContext.jsx";

const DARK_SWAL = {
  background: "#111827",
  color: "#fff",
  confirmButtonColor: "#dc2626",
};

const LIGHT_SWAL = {
  background: "#ffffff",
  color: "#0f172a",
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
  if (!rawRole) return null;
  const str = String(rawRole).trim().toLowerCase().replace(/[- ]+/g, "_");
  if (str.includes("super_admin") || str.includes("superadmin")) return "super_admin";
  if (str.includes("business_owner") || str.includes("branch_owner") || str === "owner") return "business_owner";
  if (str.includes("branch_manager") || (str.includes("manager") && !str.includes("inventory"))) return "branch_manager";
  if (str.includes("inventory_manager")) return "inventory_manager";
  if (str.includes("inventory")) return "inventory";
  if (str.includes("admin")) return "admin";
  if (str.includes("cashier") || str.includes("staff")) return "staff";
  if (str.includes("employee") || str.includes("technician") || str.includes("worker") || str.includes("mechanic") || str.includes("detailer")) return "employee";
  if (str.includes("customer") || str.includes("client")) return "customer";

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
  return map[rawRole] ?? str;
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
  const { isDark, toggleTheme } = useTheme();
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
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [landingPosts, setLandingPosts] = useState([]);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policyError, setPolicyError] = useState("");
  const [errors, setErrors] = useState({});
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [publicStats, setPublicStats] = useState({
    customersRegistered: null,
    averageRating: null,
  });

  const loadLandingContent = async () => {
    if (landingPosts.length > 0) return;
    setPolicyLoading(true);
    setPolicyError("");
    try {
      const response = await fetch(`${API_BASE}/api/landing-content/`);
      if (!response.ok) throw new Error("Failed to load content");
      const data = await response.json();
      setLandingPosts(Array.isArray(data.posts) ? data.posts : []);
    } catch {
      setPolicyError("Policy content is currently unavailable.");
    } finally {
      setPolicyLoading(false);
    }
  };

  const openLegalModal = () => {
    setShowLegalModal(true);
    loadLandingContent();
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = name === "password" ? String(value || "").slice(0, 15) : (type === "checkbox" ? checked : value);
    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
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
    // Clear both storages first to prevent stale collision
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("user");

    // Always store in BOTH sessionStorage and localStorage to guarantee persistence across refreshes and tabs
    sessionStorage.setItem("access_token", tokens.access);
    sessionStorage.setItem("refresh_token", tokens.refresh);
    sessionStorage.setItem("user", JSON.stringify(user));

    localStorage.setItem("access_token", tokens.access);
    localStorage.setItem("refresh_token", tokens.refresh);
    localStorage.setItem("user", JSON.stringify(user));
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

  // If already authenticated with a valid session, navigate to the role dashboard
  useEffect(() => {
    try {
      const token = sessionStorage.getItem("access_token") || localStorage.getItem("access_token");
      const userRaw = sessionStorage.getItem("user") || localStorage.getItem("user");
      if (token && userRaw) {
        const u = JSON.parse(userRaw);
        const normRole = normalizeRole(u?.role);
        if (normRole && ROLE_ROUTES[normRole]) {
          navigate(ROLE_ROUTES[normRole], { replace: true });
        }
      }
    } catch {
      // ignore parse error
    }
  }, [navigate]);

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
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] flex items-center justify-center px-4 sm:px-6 relative overflow-hidden transition-colors duration-300">
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
                    <span className="text-sm text-yellow-100 font-semibold inline-flex items-center gap-2">
                      <svg className="w-4 h-4 text-yellow-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>{maintenanceMessage || "System is under maintenance. Only administrators can access after login."}</span>
                    </span>
                    <span className="text-yellow-400/60 mx-4 text-xs">•</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top action controls: Back arrow & Theme toggle */}
      <div className="fixed top-3 left-3 sm:top-5 sm:left-5 z-50 flex items-center gap-2">
        <Link
          to="/"
          className="signin-back-btn w-10 h-10 sm:w-11 sm:h-11 bg-white dark:bg-[#111827] hover:bg-red-600 dark:hover:bg-red-600 border border-gray-200 dark:border-gray-800 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-white dark:hover:text-white transition-all duration-300 shadow-sm"
          title="Back to home"
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

        <button
          type="button"
          onClick={toggleTheme}
          className="w-10 h-10 sm:w-11 sm:h-11 bg-white dark:bg-[#111827] hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all duration-300 shadow-sm"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? (
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>

      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-red-500/5 dark:bg-red-600/5 rounded-full blur-3xl" />
        <div
          className="absolute bottom-0 right-0 w-96 h-96 bg-red-500/5 dark:bg-red-600/5 rounded-full blur-3xl"
        />
      </div>

      {/* Main grid */}
      <div className="w-full max-w-6xl relative z-10 py-8">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          {/* Left branding */}
          <div className="hidden lg:block">
            <div className="space-y-8">
              <img
                src={logo}
                alt="Otokwikk logo"
                className="h-20 object-contain drop-shadow"
              />
              <div>
                <h1 className="text-6xl font-black text-gray-900 dark:text-white mb-5 leading-tight tracking-tight">
                  Welcome
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
                  Sign in to access your account and continue enjoying premium
                  auto detailing services.
                </p>
                <div className="space-y-5">
                  {[
                    "Easy online booking",
                    "Track your service history",
                    "Exclusive member discounts",
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-red-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-red-600/20">
                        <svg
                          className="w-6 h-6 text-white"
                          fill="none"
                          stroke="#ffffff"
                          viewBox="0 0 24 24"
                          strokeWidth={2.5}
                          style={{ fill: "none" }}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                            style={{ fill: "none" }}
                          />
                        </svg>
                      </div>
                      <p className="text-gray-900 dark:text-gray-200 font-semibold text-lg">{feature}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right form */}
          <div className="w-full">
            <div className="bg-white dark:bg-[#111827] rounded-2xl sm:rounded-3xl p-6 sm:p-10 border border-gray-200 dark:border-gray-800 shadow-xl dark:shadow-2xl dark:shadow-black/60 transition-colors duration-300">
              <div className="lg:hidden mb-6 text-center">
                <img
                  src={logo}
                  alt="Otokwikk logo"
                  className="h-14 object-contain mx-auto"
                />
              </div>

              <div className="mb-7">
                <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-2">Sign In</h2>
                <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg">
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
                    className="block text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2"
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
                    placeholder="juan.delacruz@example.com"
                    className={`w-full px-5 py-3.5 bg-gray-50 dark:bg-[#1a2234] border ${
                      errors.email ? "border-red-600" : "border-gray-300 dark:border-gray-700"
                    } rounded-xl text-gray-900 dark:text-white text-base sm:text-lg placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/30 transition-all duration-300`}
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
                    className="block text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      maxLength={15}
                      value={formData.password}
                      onChange={handleChange}
                      autoComplete="off"
                      placeholder="••••••••"
                      className={`w-full px-5 py-3.5 bg-gray-50 dark:bg-[#1a2234] border ${
                        errors.password ? "border-red-600" : "border-gray-300 dark:border-gray-700"
                      } rounded-xl text-gray-900 dark:text-white text-base sm:text-lg placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/30 transition-all duration-300 pr-14`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-white transition-colors"
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
                      className="w-5 h-5 bg-gray-50 dark:bg-[#1a2234] border-gray-300 dark:border-gray-700 rounded text-red-600 focus:ring-red-600 focus:ring-2 cursor-pointer"
                    />
                    <label
                      htmlFor="rememberMe"
                      className="text-base sm:text-lg text-gray-600 dark:text-gray-300 cursor-pointer select-none"
                    >
                      Remember me
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-base sm:text-lg text-red-600 hover:text-red-500 dark:text-red-500 dark:hover:text-red-400 font-semibold transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`login-submit-btn w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-all duration-300 transform text-lg sm:text-xl flex items-center justify-center gap-3 shadow-lg shadow-red-600/30 ${
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
                    <div className="w-full border-t border-gray-200 dark:border-gray-800" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-white dark:bg-[#111827] text-gray-500 dark:text-gray-400 font-medium transition-colors">
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
                        ...(isDark ? DARK_SWAL : LIGHT_SWAL),
                      })
                    }
                    theme={isDark ? "filled_black" : "outline"}
                    shape="pill"
                    size="large"
                    width="100%"
                  />
                </div>

                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">
                    Create an Account{" "}
                    <Link
                      to="/signup"
                      className="text-red-600 hover:text-red-500 dark:text-red-500 dark:hover:text-red-400 font-semibold transition-colors"
                    >
                      Sign Up
                    </Link>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                    By signing in, you agree to our{" "}
                    <button
                      type="button"
                      onClick={openLegalModal}
                      className="text-red-600 hover:text-red-500 dark:text-red-500 dark:hover:text-red-400 font-semibold underline underline-offset-2"
                    >
                      Terms, Privacy & Cookie Policy
                    </button>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md"
            onClick={() => setShowForgotModal(false)}
          />
          <div className="bg-white dark:bg-[#111827] w-full max-w-md rounded-3xl sm:rounded-[32px] border border-gray-200 dark:border-gray-800 shadow-2xl relative z-10 overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-[#161f30]">
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                Reset Password
              </h3>
              <button
                onClick={() => setShowForgotModal(false)}
                className="w-10 h-10 bg-gray-100 hover:bg-red-600 text-gray-500 hover:text-white dark:bg-gray-800 dark:text-gray-400 dark:hover:text-white rounded-xl flex items-center justify-center transition-all"
              >
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
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
            <div className="p-6 sm:p-8 space-y-6">
              <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg leading-relaxed">
                Enter your email address and we'll send you a link to reset your
                password.
              </p>
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3.5 bg-gray-50 dark:bg-[#1a2234] border border-gray-300 dark:border-gray-700 rounded-xl sm:rounded-2xl text-gray-900 dark:text-white focus:outline-none focus:border-red-600 transition-all placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
              <button
                onClick={handleForgotPassword}
                disabled={isSubmittingForgot}
                className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-gray-800 text-white font-black rounded-xl sm:rounded-2xl transition-all tracking-wider uppercase text-sm shadow-lg shadow-red-600/20"
              >
                {isSubmittingForgot ? "Sending..." : "Send Reset Link"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Consolidated Legal Modal */}
      {showLegalModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md"
            onClick={() => setShowLegalModal(false)}
          />
          <div className="bg-white dark:bg-[#111827] w-full max-w-2xl max-h-[85vh] rounded-3xl sm:rounded-[32px] border border-gray-200 dark:border-gray-800 shadow-2xl relative z-10 flex flex-col overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-[#161f30] flex-shrink-0">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                  Terms, Privacy & Cookie Policy
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Consolidated legal and compliance documentation
                </p>
              </div>
              <button
                onClick={() => setShowLegalModal(false)}
                className="w-9 h-9 bg-gray-100 hover:bg-red-600 text-gray-500 hover:text-white dark:bg-gray-800 dark:text-gray-400 dark:hover:text-white rounded-xl flex items-center justify-center transition-all"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {policyLoading && (
                <div className="py-12 text-center text-gray-400">
                  <div className="animate-spin w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full mx-auto mb-3" />
                  Loading policy documents...
                </div>
              )}
              {policyError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-center">
                  {policyError}
                </div>
              )}
              {!policyLoading && (
                <div className="space-y-8">
                  {[
                    { key: "terms", title: "1. Terms and Conditions" },
                    { key: "privacy", title: "2. Privacy Policy" },
                    { key: "cookie", title: "3. Cookie Policy" },
                  ].map(({ key, title }, idx) => {
                    const post = landingPosts.find((p) => String(p.key).toLowerCase() === key);
                    return (
                      <section
                        key={key}
                        id={`legal-${key}`}
                        className={idx > 0 ? "pt-6 border-t border-gray-200 dark:border-gray-800" : ""}
                      >
                        <h4 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                          {post?.title || title}
                        </h4>
                        <div className="text-sm whitespace-pre-line text-gray-600 dark:text-gray-300">
                          {post?.body ||
                            `${title} is currently active and protects all registered users and visitors of Otokwikk Auto Service.`}
                        </div>
                      </section>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="p-4 bg-gray-50 dark:bg-[#161f30] border-t border-gray-200 dark:border-gray-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowLegalModal(false)}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-red-600/30"
              >
                Close
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
