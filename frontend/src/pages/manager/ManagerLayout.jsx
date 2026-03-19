import React, { useState } from "react";
import UnifiedSidebar from "../../components/UnifiedSidebar.jsx";
import NotificationIcon from "../../components/NotificationIcon";

function ManagerLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-950">
      <UnifiedSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:ml-60 min-h-screen flex flex-col">
        {/* Mobile Top Bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-gray-900 sticky top-0 z-10 shadow-md border-b border-gray-800">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
              aria-label="Open sidebar"
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
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <img
              src="/assets/otokwikklogo.png"
              alt="Otokwikk"
              className="h-8 object-contain"
            />
          </div>
          <NotificationIcon />
        </header>

        {/* Desktop Top Bar */}
        <header className="hidden lg:flex items-center justify-end px-8 py-4 bg-gray-950/50 backdrop-blur-md sticky top-0 z-10 border-b border-white/5">
          <NotificationIcon />
        </header>

        <main className="p-4 sm:p-6 lg:p-8 flex-1">{children}</main>
      </div>
    </div>
  );
}

export default ManagerLayout;