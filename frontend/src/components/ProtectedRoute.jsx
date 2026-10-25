// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

export const normalizeRole = (role) => {
  if (!role) return null;
  const str = String(role).trim().toLowerCase().replace(/[- ]+/g, "_");
  if (str.includes("super_admin") || str.includes("superadmin")) return "super_admin";
  if (str.includes("business_owner") || str.includes("branch_owner") || str === "owner") return "business_owner";
  if (str.includes("branch_manager") || (str.includes("manager") && !str.includes("inventory"))) return "branch_manager";
  if (str.includes("inventory_manager")) return "inventory_manager";
  if (str.includes("inventory")) return "inventory";
  if (str.includes("admin")) return "admin";
  if (str.includes("cashier") || str.includes("staff")) return "staff";
  if (str.includes("employee") || str.includes("technician") || str.includes("worker") || str.includes("mechanic") || str.includes("detailer")) return "employee";
  if (str.includes("customer") || str.includes("client")) return "customer";

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
  return map[role] ?? str;
};

const ROLE_ROUTES = {
  super_admin: "/super-admin/dashboard",
  admin: "/admin/dashboard",
  business_owner: "/branch-owner/dashboard",
  branch_manager: "/manager/dashboard",
  inventory: "/inventory/dashboard",
  inventory_manager: "/inventory-manager/dashboard",
  staff: "/staff/dashboard",
  employee: "/employee/dashboard",
  customer: "/dashboard",
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  // Check sessionStorage first for current active tab session, then localStorage
  const raw = sessionStorage.getItem("user") || localStorage.getItem("user");
  const user = raw ? JSON.parse(raw) : null;

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  const userRole = normalizeRole(user.role);
  const normalizedAllowedRoles = (allowedRoles || []).map(normalizeRole);

  // Super admin can access administrative and system pages
  if (userRole === "super_admin") {
    return children;
  }

  if (allowedRoles && !normalizedAllowedRoles.includes(userRole)) {
    // Redirect to the user's appropriate role dashboard rather than kicking to "/"
    const destination = ROLE_ROUTES[userRole] || "/";
    return <Navigate to={destination} replace />;
  }

  return children;
};

export default ProtectedRoute;