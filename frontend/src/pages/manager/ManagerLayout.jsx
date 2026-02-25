import React from "react";
import Sidebar from "../../components/manager/ManagerSidebar.jsx";

function AdminLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />

      {/* Main Content Area */}
      <div className="ml-60">
        {/* Page Content */}
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}

export default AdminLayout;