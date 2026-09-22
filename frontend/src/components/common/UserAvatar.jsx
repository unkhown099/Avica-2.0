import React, { useState, useEffect } from "react";
import { API_BASE } from "../../hooks/useAuth.js";

export function resolveAvatarUrl(src) {
  if (!src || typeof src !== "string" || src.trim() === "" || src === "null" || src === "undefined") {
    return null;
  }
  const clean = src.trim();
  if (
    clean.startsWith("http://") ||
    clean.startsWith("https://") ||
    clean.startsWith("data:") ||
    clean.startsWith("blob:")
  ) {
    return clean;
  }
  const base = (API_BASE || "").endsWith("/") ? (API_BASE || "").slice(0, -1) : (API_BASE || "");
  const path = clean.startsWith("/") ? clean : `/${clean}`;
  return `${base}${path}`;
}

export function UserAvatar({
  src,
  name = "User",
  initials: explicitInitials,
  className = "w-9 h-9 rounded-full",
  textClassName = "text-white font-bold text-xs",
  alt = "Avatar",
}) {
  const [hasError, setHasError] = useState(false);
  const resolvedUrl = resolveAvatarUrl(src);

  // Reset error whenever the source URL changes
  useEffect(() => {
    setHasError(false);
  }, [resolvedUrl]);

  const initials =
    explicitInitials ||
    (() => {
      if (!name || typeof name !== "string") return "?";
      const parts = name.trim().split(/\s+/).filter(Boolean);
      if (parts.length === 0) return "?";
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return ((parts[0]?.[0] || "") + (parts[parts.length - 1]?.[0] || "")).toUpperCase() || "?";
    })();

  const showImage = Boolean(resolvedUrl && !hasError);

  return (
    <div
      className={`${className} overflow-hidden flex items-center justify-center shrink-0 shadow-md select-none`}
      style={{
        backgroundColor: "#dc2626",
        backgroundImage: "linear-gradient(135deg, #dc2626, #991b1b)",
        color: "#ffffff",
      }}
    >
      {showImage ? (
        <img
          src={resolvedUrl}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
          loading="lazy"
        />
      ) : (
        <span className={textClassName} style={{ color: "#ffffff" }}>
          {initials}
        </span>
      )}
    </div>
  );
}

export default UserAvatar;
