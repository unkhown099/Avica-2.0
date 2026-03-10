// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const raw =
    localStorage.getItem("user") || sessionStorage.getItem("user");

  const user = raw ? JSON.parse(raw) : null;

  if (!user) {
    return <Navigate to="/error" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;