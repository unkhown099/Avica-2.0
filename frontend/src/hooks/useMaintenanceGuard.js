// hooks/useMaintenanceGuard.js
import { useState, useEffect, useCallback } from "react";
import { API_BASE, getAuthHeadersAsync } from "./useAuth.js";

// Roles that can access the app during maintenance
export const MAINTENANCE_ALLOWED_ROLES = [
  "super_admin",
  "admin", 
  "business_owner",
  "branch_manager",
  "staff",
  "employee",
  "inventory",
  "inventory_manager",
];

// Helper to get user role from storage
const getUserRoleFromStorage = () => {
  try {
    // Check user data in storage
    const userData = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed?.is_superuser || parsed?.is_staff) return "super_admin";
      const role = parsed?.role || parsed?.profile?.role || parsed?.user_role;
      if (role) return role.toLowerCase().replace(/\s+/g, "_");
    }
    
    // Check JWT token for role
    const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const role = payload?.role || payload?.user_role;
        if (role) return role.toLowerCase().replace(/\s+/g, "_");
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

  const checkStatus = useCallback(async (showCheckingScreen = false) => {
    if (showCheckingScreen) {
      setChecking(true);
    }
    
    try {
      // Get current user role from storage
      const role = getUserRoleFromStorage();
      setUserRole(role);
      const isAllowedRole = role ? MAINTENANCE_ALLOWED_ROLES.includes(role) : false;
      
      const authHeaders = await getAuthHeadersAsync();
      
      console.log(`[MaintenanceGuard] Checking status... Role: ${role || 'guest'}, Has auth: ${!!authHeaders.Authorization}`);

      // Check maintenance status from backend
      const res = await fetch(`${API_BASE}/system/maintenance-status/`, {
        headers: { 
          ...authHeaders,
          "Cache-Control": "no-cache",
        },
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`[MaintenanceGuard] Response:`, data);
        
        const backendCanBypass = Boolean(data.can_bypass);
        const effectiveCanBypass = backendCanBypass || isAllowedRole;

        setIsMaintenanceMode(data.is_maintenance_mode);
        setMaintenanceMessage(data.maintenance_message);
        setCanBypass(effectiveCanBypass);
        setIsAuthenticated(data.is_authenticated || Boolean(authHeaders.Authorization) || isAllowedRole);
        
        // Store in localStorage for other components
        if (data.is_maintenance_mode) {
          localStorage.setItem("maintenance_mode", JSON.stringify({
            isActive: true,
            message: data.maintenance_message,
            canBypass: effectiveCanBypass,
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
          setCanBypass(parsed.canBypass || isAllowedRole);
        } else {
          setCanBypass(isAllowedRole);
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
        setCanBypass(parsed.canBypass || isAllowedRole);
      } else {
        setCanBypass(isAllowedRole);
      }
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    // Initial check shows checking screen if needed
    checkStatus(true);
    
    // Listen for maintenance mode changes silently (do not set checking screen)
    const handleMaintenanceChange = () => {
      console.log("[MaintenanceGuard] Maintenance mode changed, re-checking silently");
      checkStatus(false);
    };
    
    const handleStorage = (e) => {
      if (e.key === "maintenance_mode") {
        checkStatus(false);
      }
    };

    window.addEventListener("maintenance-mode-changed", handleMaintenanceChange);
    window.addEventListener("storage", handleStorage);
    
    return () => {
      window.removeEventListener("maintenance-mode-changed", handleMaintenanceChange);
      window.removeEventListener("storage", handleStorage);
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
    refresh: () => checkStatus(false),
  };
}