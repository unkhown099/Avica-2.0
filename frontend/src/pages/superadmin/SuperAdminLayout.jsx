import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../../components/UnifiedSidebar.jsx";
import NotificationDropdown from "../../components/NotificationDropdown.jsx";
import ProfileDropdown from "../../components/ProfileDropdown.jsx";
import logo from "../../assets/otokwikklogo.png";

const PAGE_TITLES = {
  "/super-admin/dashboard": "Dashboard",
  "/super-admin/content": "Content Management",
  "/super-admin/settings": "System Settings",
  "/super-admin/plugins": "Plugins & Extensions",
  "/super-admin/security": "Security & Backup",
  "/super-admin/reports": "Reports & Monitoring",
};

function SuperAdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const isDashboard = location.pathname === "/super-admin/dashboard";

  useEffect(() => {
    const title = PAGE_TITLES[location.pathname] ?? "Super Admin";
    document.title = `${title} | Otokwikk`;
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-950">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:ml-[var(--sidebar-width)] min-h-screen flex flex-col">
        {/* Mobile Header */}
        <header className="flex items-center justify-between px-4 py-3 bg-gray-900 sticky top-0 z-10 shadow-md border-b border-gray-800">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
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
            <img src={logo} alt="Otokwikk" className="h-8 object-contain lg:hidden" />
          </div>

          <div className="flex items-center gap-4">
            {!isDashboard && <NotificationDropdown />}
            <ProfileDropdown />
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

export default SuperAdminLayout;
