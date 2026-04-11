// hooks/useMaintenanceGuard.js
import { useState, useEffect, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

// Roles that can access the app during maintenance
export const MAINTENANCE_ALLOWED_ROLES = [
  "super_admin",
  "admin", 
  "business_owner",
];

// Helper to get user role from storage
const getUserRoleFromStorage = () => {
  try {
    // Check user data in storage
    const userData = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (userData) {
      const parsed = JSON.parse(userData);
      const role = parsed?.role || parsed?.profile?.role;
      if (role) return role.toLowerCase();
    }
    
    // Check JWT token for role
    const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const role = payload?.role || payload?.user_role;
        if (role) return role.toLowerCase();
      } catch (e) {}
    }
  } catch (e) {}
  return null;
};

export function useMaintenanceGuard() {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [canBypass, setCanBypass] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [userRole, setUserRole] = useState(null);

  const checkStatus = useCallback(async () => {
    setChecking(true);
    
    try {
      // Get current user role from storage
      const role = getUserRoleFromStorage();
      setUserRole(role);
      
      // Get auth token if exists
      const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
      
      console.log(`[MaintenanceGuard] Checking status... Role: ${role || 'guest'}, Has token: ${!!token}`);

      // Check maintenance status from backend
      const res = await fetch(`${API_BASE}/system/maintenance-status/`, {
        headers: { 
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : "",
          "Cache-Control": "no-cache",
        },
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`[MaintenanceGuard] Response:`, data);
        
        setIsMaintenanceMode(data.is_maintenance_mode);
        setMaintenanceMessage(data.maintenance_message);
        setCanBypass(data.can_bypass || false);
        setIsAuthenticated(data.is_authenticated || false);
        
        // Store in localStorage for other components
        if (data.is_maintenance_mode) {
          localStorage.setItem("maintenance_mode", JSON.stringify({
            isActive: true,
            message: data.maintenance_message,
            canBypass: data.can_bypass,
          }));
        } else {
          localStorage.removeItem("maintenance_mode");
        }
      } else {
        // Fallback to localStorage
        const localData = localStorage.getItem("maintenance_mode");
        if (localData) {
          const parsed = JSON.parse(localData);
          setIsMaintenanceMode(parsed.isActive);
          setMaintenanceMessage(parsed.message);
          setCanBypass(parsed.canBypass || false);
        }
      }
    } catch (err) {
      console.error("Failed to check maintenance status:", err);
      // Fallback to localStorage on error
      const localData = localStorage.getItem("maintenance_mode");
      if (localData) {
        const parsed = JSON.parse(localData);
        setIsMaintenanceMode(parsed.isActive);
        setMaintenanceMessage(parsed.message);
        setCanBypass(parsed.canBypass || false);
      }
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
    
    // Listen for maintenance mode changes
    const handleMaintenanceChange = () => {
      console.log("[MaintenanceGuard] Maintenance mode changed, re-checking");
      checkStatus();
    };
    
    window.addEventListener("maintenance-mode-changed", handleMaintenanceChange);
    window.addEventListener("storage", (e) => {
      if (e.key === "maintenance_mode") {
        checkStatus();
      }
    });
    
    return () => {
      window.removeEventListener("maintenance-mode-changed", handleMaintenanceChange);
    };
  }, [checkStatus]);

  // Determine if we should show maintenance page
  // Show if maintenance is active AND user cannot bypass
  const shouldShowMaintenance = isMaintenanceMode && !canBypass;

  return {
    isMaintenanceMode,
    maintenanceMessage,
    checking,
    userRole,
    canBypass,
    isAuthenticated,
    shouldShowMaintenance,
    refresh: checkStatus,
  };
}