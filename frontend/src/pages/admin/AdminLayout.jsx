import React from 'react';
import Sidebar from '../../components/admin/AdminSidebar.jsx';

function AdminLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="ml-60">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <nav className="text-sm text-gray-500 mb-2">
                {title}
              </nav>
              <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
              {subtitle && (
                <p className="text-gray-600 mt-1">{subtitle}</p>
              )}
            </div>
            <div className="text-right">
              <h2 className="text-lg font-semibold text-gray-900">Otokwikk Auto Service Center</h2>
              <p className="text-sm text-gray-500">Management System</p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;