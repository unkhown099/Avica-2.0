import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import swal from "sweetalert2";
import logo from "../assets/otokwikklogo.png";
import { GoogleLogin } from "@react-oauth/google";

function SignIn() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/login/`, {
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

      // Store tokens
      const { access, refresh } = data.tokens;
      if (formData.rememberMe) {
        localStorage.setItem("access_token", access);
        localStorage.setItem("refresh_token", refresh);
      } else {
        sessionStorage.setItem("access_token", access);
        sessionStorage.setItem("refresh_token", refresh);
      }

      // Store user info if you want immediate access
      if (formData.rememberMe) {
        localStorage.setItem("user", JSON.stringify(data.user));
      } else {
        sessionStorage.setItem("user", JSON.stringify(data.user));
      }

      // Navigate based on role
      const roleRoutes = {
        admin: "/admin/dashboard",
        business_owner: "/branch-owner/dashboard",
        branch_manager: "/manager/dashboard",
        staff: "/staff/pos",
        employee: "/mechanic/dashboard",
        customer: "/dashboard",
      };

      navigate(roleRoutes[data.user.role] || "/");

      await swal.fire({
        icon: "success",
        title: "Login Successful",
        text: "Welcome back!",
        confirmButtonColor: "#dc2626",
      });
    } catch (err) {
      swal.fire({
        icon: "error",
        title: "Login Failed",
        text: err.message,
        confirmButtonColor: "#dc2626",
      });
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      swal.fire({ icon: "error", title: "Error", text: "Please enter your email address" });
      return;
    }

    setIsSubmittingForgot(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/forgot-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();

      if (res.ok) {
        swal.fire({
          icon: "success",
          title: "Email Sent",
          text: data.message,
          background: "linear-gradient(to bottom right, #1f2937, #111827)",
          color: "#fff",
          confirmButtonColor: "#dc2626"
        });
        setShowForgotModal(false);
        setForgotEmail("");
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      swal.fire({ icon: "error", title: "Error", text: err.message });
    } finally {
      setIsSubmittingForgot(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/google-login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Google Login failed");
      }

      // Store tokens and navigate (simplified for brevity, should follow existing logic)
      const { access, refresh } = data.tokens;
      sessionStorage.setItem("access_token", access);
      sessionStorage.setItem("refresh_token", refresh);
      sessionStorage.setItem("user", JSON.stringify(data.user));

      const roleRoutes = {
        admin: "/admin/dashboard",
        business_owner: "/branch-owner/dashboard",
        branch_manager: "/manager/dashboard",
        staff: "/staff/pos",
        employee: "/mechanic/dashboard",
        customer: "/dashboard",
      };

      navigate(roleRoutes[data.user.role] || "/");
      swal.fire({ icon: "success", title: "Login Successful", text: "Welcome!" });

    } catch (err) {
      swal.fire({ icon: "error", title: "Google Login Failed", text: err.message });
    }
  };

  return (
    <div className="h-screen bg-black flex items-center justify-center px-6 relative overflow-hidden">
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

      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Main */}
      <div className="w-full max-w-6xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          {/* Left Branding */}
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
                      10K+
                    </div>
                    <div className="text-lg text-gray-400">Happy Customers</div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-900 to-red-950/20 rounded-2xl p-7 border border-white/5">
                    <div className="text-5xl font-black text-red-600 mb-2">
                      5★
                    </div>
                    <div className="text-lg text-gray-400">Average Rating</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form */}
          <div className="w-full">
            <div className="bg-gradient-to-br from-gray-900 to-red-950/20 rounded-3xl p-6 sm:p-10 border border-white/5 shadow-2xl">
              <div className="lg:hidden mb-6 text-center">
                <img
                  src={logo}
                  alt="Otokwikk logo"
                  className="h-14 object-contain mx-auto"
                />
              </div>

              <div className="mb-7">
                <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">Sign In</h2>
                <p className="text-gray-400 text-base sm:text-lg">
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
                    className={`w-full px-5 py-3.5 bg-gray-900 border ${errors.email ? "border-red-600" : "border-gray-700"} rounded-xl text-white text-lg placeholder-gray-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/50 transition-all duration-300`}
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
                      className={`w-full px-5 py-3.5 bg-gray-900 border ${errors.password ? "border-red-600" : "border-gray-700"} rounded-xl text-white text-lg placeholder-gray-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/50 transition-all duration-300 pr-14`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
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

                {/* Remember Me & Forgot */}
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
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 sm:py-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-red-600/50 text-lg sm:text-xl"
                >
                  Log In
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-900 text-gray-400">Or continue with</span>
                  </div>
                </div>

                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => swal.fire({ icon: "error", title: "Google Login Failed" })}
                    useOneTap
                    theme="filled_black"
                    shape="pill"
                    size="large"
                    width="100%"
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setShowForgotModal(false)} />
          <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-red-950/20 w-full max-w-md rounded-[32px] border border-white/10 shadow-3xl relative z-10 overflow-hidden">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/20">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Reset Password</h3>
              <button
                onClick={() => setShowForgotModal(false)}
                className="w-10 h-10 bg-white/5 hover:bg-red-600 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-8 space-y-6">
              <p className="text-gray-400 text-lg leading-relaxed">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              <div>
                <label className="block text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Email Address</label>
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
