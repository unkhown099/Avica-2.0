// components/MaintenanceBanner.jsx
import React, { useEffect, useRef, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export function MaintenanceBanner() {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const tickerRef = useRef(null);

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
        const res = await fetch(`${API_BASE}/system/maintenance-status/`, {
          headers: {
            "Authorization": token ? `Bearer ${token}` : "",
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          setIsMaintenanceMode(data.is_maintenance_mode);
          setMaintenanceMessage(data.maintenance_message);
          
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
          }
        }
      } catch (err) {
        const localData = localStorage.getItem("maintenance_mode");
        if (localData) {
          const parsed = JSON.parse(localData);
          setIsMaintenanceMode(parsed.isActive);
          setMaintenanceMessage(parsed.message);
        }
      }
    };
    
    checkMaintenance();
    
    // Listen for maintenance mode changes
    window.addEventListener("maintenance-mode-changed", checkMaintenance);
    const handleStorage = (e) => {
      if (e.key === "maintenance_mode") checkMaintenance();
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("maintenance-mode-changed", checkMaintenance);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const handleMouseEnter = () => {
    if (tickerRef.current) {
      tickerRef.current.style.animationPlayState = "paused";
    }
  };

  const handleMouseLeave = () => {
    if (tickerRef.current) {
      tickerRef.current.style.animationPlayState = "running";
    }
  };

  // Don't show banner if no maintenance or dismissed
  if (!isMaintenanceMode || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] border-t border-amber-200/20 bg-gradient-to-r from-red-700/95 via-amber-500/95 to-red-700/95 backdrop-blur-md shadow-[0_-10px_30px_rgba(0,0,0,0.35)]">
      <div className="flex h-[52px] items-center justify-between">
        {/* Left static section */}
        <div className="flex h-full shrink-0 items-center gap-2 border-r border-white/10 bg-black/25 px-4">
          <svg className="h-4 w-4 text-amber-100 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="whitespace-nowrap text-[11px] font-black uppercase tracking-[0.28em] text-amber-50">
            Maintenance Mode
          </span>
        </div>

        {/* Scrolling ticker */}
        <div className="flex-1 overflow-hidden">
          <div 
            ref={tickerRef}
            className="whitespace-nowrap py-3 text-center animate-[ticker_28s_linear_infinite]"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {[...Array(6)].map((_, i) => (
              <span key={i} className="mx-6 inline-flex items-center">
                <span className="text-sm font-semibold text-white">
                  ⚠️ {maintenanceMessage || "We're currently performing scheduled maintenance. We'll be back shortly!"} ⚠️
                </span>
                <span className="mx-4 text-amber-100/80">•</span>
              </span>
            ))}
          </div>
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="flex h-full shrink-0 items-center justify-center border-l border-white/10 bg-black/20 px-4 text-amber-100 transition-all duration-300 hover:bg-black/35 hover:text-white"
          aria-label="Dismiss maintenance banner"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
