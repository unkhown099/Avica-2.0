// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
  const user = raw ? JSON.parse(raw) : null;

  if (!user) {
    return <Navigate to="/error" replace />;
  }

  const normalizeRole = (role) => {
    const map = {
      "Admin": "admin",
      "Business Owner": "business_owner",
      "Branch Manager": "branch_manager",
      "Staff": "staff",
      "Employee": "employee",
      "Inventory": "inventory",
      "Inventory Manager": "inventory_manager",
      "Super Admin": "super_admin",
    };
    return map[role] ?? role ?? null;
  };

  const userRole = normalizeRole(user.role);
  const normalizedAllowedRoles = allowedRoles.map(normalizeRole);

  if (allowedRoles && !normalizedAllowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;