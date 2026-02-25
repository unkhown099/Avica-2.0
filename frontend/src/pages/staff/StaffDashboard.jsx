import React from "react";
import StaffLayout from "./StaffLayout.jsx";

function StaffDashboard() {
    return (
        <StaffLayout title="Dashboard" subtitle="Welcome to your dashboard">
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Staff Dashboard</h1>
                <p>Welcome to the staff dashboard! Here you can manage your tasks and view important information.</p>
            </div>
        </StaffLayout>
    );
}

export default StaffDashboard;