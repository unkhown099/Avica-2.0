import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../../components/UnifiedSidebar.jsx";
import NotificationDropdown from "../../components/NotificationDropdown.jsx";
import logo from "../../assets/otokwikklogo.png";

const PAGE_TITLES = {
  "/admin/dashboard": "Dashboard",
  "/admin/services": "Services",
  "/admin/customers": "Customers",
  "/admin/staff": "Staff",
  "/admin/inventory": "Inventory",
  "/admin/appointments": "Appointments",
  "/admin/branches": "Branches",
};

function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  
  // Check if current route is dashboard
  const isDashboard = location.pathname === "/admin/dashboard";

  useEffect(() => {
    const title = PAGE_TITLES[location.pathname] ?? "Admin";
    document.title = `${title} | Otokwikk`;
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-950">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

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
          
          {/* Show notification dropdown in mobile header only if not on dashboard */}
          {!isDashboard && (
            <div className="ml-auto">
              <NotificationDropdown />
            </div>
          )}
        </header>

        <main className="p-4 sm:p-6 lg:p-8 flex-1 relative">
          {/* Show notification dropdown in main content area only if not on dashboard */}
          {!isDashboard && (
            <div className="absolute top-4 sm:top-6 lg:top-8 right-4 sm:right-6 lg:right-8 z-20">
              <NotificationDropdown />
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
