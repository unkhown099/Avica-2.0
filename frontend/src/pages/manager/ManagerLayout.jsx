import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import UnifiedSidebar from "../../components/UnifiedSidebar.jsx";
import NotificationDropdown from "../../components/NotificationDropdown.jsx";
import logo from "../../assets/otokwikklogo.png"

const PAGE_TITLES = {
  "/manager/dashboard": "Dashboard",
  "/manager/appointments": "Appointments",
  "/manager/inventory": "Inventory",
  "/manager/accounts": "Account Management",
  "/manager/history": "History",
  "/manager/customers": "Customer Management",
};

function ManagerLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const title = PAGE_TITLES[location.pathname] ?? "Manager";
    document.title = `${title} | Otokwikk`;
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-950">
      <UnifiedSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:ml-[var(--sidebar-width)] min-h-screen flex flex-col">
        <header className="lg:hidden flex items-center gap-4 px-4 py-3 bg-gray-900 sticky top-0 z-10 shadow-md border-b border-gray-800">
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
            src={logo}
            alt="Otokwikk"
            className="h-8 object-contain"
          />
        </header>

        <main className="p-4 sm:p-6 lg:p-8 flex-1 relative">
          <div className="absolute top-4 sm:top-6 lg:top-8 right-4 sm:right-6 lg:right-8 z-20">
            <NotificationDropdown />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

export default ManagerLayout;
