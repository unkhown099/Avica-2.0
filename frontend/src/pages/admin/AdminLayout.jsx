import React, { useState } from "react";
import Sidebar from "../../components/admin/AdminSidebar.jsx";

function AdminLayout({ children, title, subtitle }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="lg:ml-60 min-h-screen flex flex-col">
        {/* Mobile Top Bar */}
        <header className="lg:hidden flex items-center gap-4 px-4 py-3 bg-gray-900 sticky top-0 z-10 shadow-md">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
            aria-label="Open sidebar"
          >
            {/* Hamburger 3 stripes */}
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
          <span className="text-white font-bold text-lg tracking-wide">
            Admin Panel
          </span>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1">{children}</main>
      </div>
    </div>
  );
}

export default AdminLayout;
