import React from 'react';
import MechanicSidebar from '../../components/employee/MechanicSidebar.jsx';

function MechanicLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <MechanicSidebar />

      {/* Main Content Area */}
      <div className="ml-60">
        {/* Page Content */}
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}

export default MechanicLayout;