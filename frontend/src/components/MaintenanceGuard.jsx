// components/MaintenanceGuard.jsx
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMaintenanceGuard } from "../hooks/useMaintenanceGuard";
import MaintenancePage from "../pages/MaintenancePage";

// Routes that are ALWAYS accessible during maintenance (for login)
const PUBLIC_ROUTES = ["/signin", "/reset-password", "/forgot-password", "/signup", "/maintenance"];

function MaintenanceCheckingScreen() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 text-sm tracking-wide">
          Checking system status…
        </p>
      </div>
    </div>
  );
}

function MaintenanceGuard({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    shouldShowMaintenance, 
    maintenanceMessage, 
    checking,
    canBypass,
    isMaintenanceMode,
    isAuthenticated
  } = useMaintenanceGuard();

  // Handle redirect for authenticated users during maintenance
  useEffect(() => {
    if (!checking && isMaintenanceMode && !canBypass && isAuthenticated) {
      // Store the intended destination
      sessionStorage.setItem("maintenance_redirect", location.pathname);
    }
  }, [checking, isMaintenanceMode, canBypass, isAuthenticated, location.pathname]);

  if (checking) {
    return <MaintenanceCheckingScreen />;
  }

  const isGuestOnLanding = location.pathname === "/" && !isAuthenticated;

  // Allow public routes (so users can log in)
  if (PUBLIC_ROUTES.includes(location.pathname) || isGuestOnLanding) {
    return children;
  }

  // Show maintenance page for users who cannot bypass
  if (shouldShowMaintenance) {
    return <MaintenancePage customMessage={maintenanceMessage || undefined} />;
  }

  // Allow allowed roles to access everything
  return children;
}

export default MaintenanceGuard;
