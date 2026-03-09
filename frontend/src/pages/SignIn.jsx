import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import logo from "../assets/otokwikklogo.png";

function SignIn() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
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
      localStorage.setItem("user", JSON.stringify(data.user));

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

      await Swal.fire({
        icon: "success",
        title: "Login Successful",
        text: "Welcome back!",
        confirmButtonColor: "#dc2626",
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: err.message,
        confirmButtonColor: "#dc2626",
      });
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
                  <a
                    href="#"
                    className="text-lg text-red-600 hover:text-red-500 font-semibold"
                  >
                    Forgot Password?
                  </a>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-red-600/50 text-xl"
                >
                  Log In
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

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
