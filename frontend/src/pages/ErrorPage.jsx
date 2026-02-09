import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/otokwikklogo.png";

function ErrorPage({ type = "404" }) {
  const errorConfig = {
    404: {
      code: "404",
      title: "Page Not Found",
      message:
        "Oops! The page you're looking for seems to have driven off the road. Let's get you back on track.",
      icon: (
        <svg
          className="w-32 h-32 mx-auto mb-8 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    401: {
      code: "401",
      title: "Unauthorized",
      message:
        "You need to be signed in to access this area. Please log in to continue your journey with Otokwikk.",
      icon: (
        <svg
          className="w-32 h-32 mx-auto mb-8 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
    },
    403: {
      code: "403",
      title: "Access Forbidden",
      message:
        "You don't have permission to access this area. If you believe this is a mistake, please contact your administrator.",
      icon: (
        <svg
          className="w-32 h-32 mx-auto mb-8 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
          />
        </svg>
      ),
    },
    500: {
      code: "500",
      title: "Server Error",
      message:
        "Something went wrong on our end. Our mechanics are working hard to fix the issue. Please try again later.",
      icon: (
        <svg
          className="w-32 h-32 mx-auto mb-8 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
    },
  };

  const config = errorConfig[type] || errorConfig["404"];

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl w-full">
        <div className="text-center">
          {/* Logo */}
          <div className="mb-12">
            <Link to="/">
              {/* Logo */}
              <div>
                <img
                  src={logo}
                  alt="Otokwikk logo"
                  className="h-16 md:h-20 object-contain"
                />
              </div>
            </Link>
          </div>

          {/* Error Icon */}
          {config.icon}

          {/* Error Code */}
          <div className="mb-6">
            <h1 className="text-9xl font-black text-white mb-4 tracking-tight">
              {config.code}
            </h1>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              {config.title}
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              {config.message}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
            <Link
              to="/"
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-red-600/50 flex items-center justify-center gap-2"
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
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Go Home
            </Link>

            {type === "401" && (
              <Link
                to="/signin"
                className="w-full sm:w-auto bg-white hover:bg-gray-100 text-gray-900 font-bold px-8 py-4 rounded-lg transition-all duration-300 shadow-xl flex items-center justify-center gap-2"
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
                    strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
                Sign In
              </Link>
            )}

            {type !== "401" && (
              <button
                onClick={() => window.history.back()}
                className="w-full sm:w-auto bg-gray-800 hover:bg-gray-700 text-white font-bold px-8 py-4 rounded-lg transition-all duration-300 shadow-xl flex items-center justify-center gap-2"
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
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Go Back
              </button>
            )}
          </div>

          {/* Additional Help */}
          <div className="mt-16 pt-8 border-t border-gray-800">
            <p className="text-gray-500 mb-4">
              Need help? Contact our support team
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <a
                href="mailto:support@otokwikk.com"
                className="text-gray-400 hover:text-red-600 transition-colors duration-300 flex items-center gap-2"
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
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                support@otokwikk.com
              </a>
              <a
                href="tel:+63XXXXXXXXX"
                className="text-gray-400 hover:text-red-600 transition-colors duration-300 flex items-center gap-2"
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
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                +63 XXX XXX XXXX
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Individual error page components for easy routing
export function Error404() {
  return <ErrorPage type="404" />;
}

export function Error401() {
  return <ErrorPage type="401" />;
}

export function Error403() {
  return <ErrorPage type="403" />;
}

export function Error500() {
  return <ErrorPage type="500" />;
}

export default ErrorPage;
