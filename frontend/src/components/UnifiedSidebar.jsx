import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/otokwikklogo.png";
import Swal from "sweetalert2";
import { useAuth, API_BASE } from "../hooks/useAuth.js";

// ─── Menu configs per role ────────────────────────────────────────────────────
// Items with `type: "divider"` render as a section label, not a nav link.

const MENU_ITEMS = {
  super_admin: [
    { type: "divider", label: "Overview" },
    {
      name: "Dashboard",
      path: "/super-admin/dashboard",
      icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
    },

    { type: "divider", label: "User Management" },
    {
      name: "User & Role Management",
      path: "/super-admin/users",
      icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
      children: [
        { key: "all-users", label: "All Users" },
        { key: "roles", label: "Roles & Permissions" },
        { key: "add-user", label: "Add User" },
      ],
    },
    {
      name: "Branches",
      path: "/admin/branches",
      icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z",
    },

    { type: "divider", label: "Content" },
    {
      name: "Content Management",
      path: "/super-admin/content",
      icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
      children: [
        { key: "pages", label: "Pages" },
        { key: "posts", label: "Posts" },
        { key: "media", label: "Media Library" },
        { key: "approvals", label: "Pending Approvals" },
      ],
    },

    { type: "divider", label: "System" },
    {
      name: "System Settings",
      path: "/super-admin/settings",
      icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
      children: [
        { key: "general", label: "General" },
        { key: "email", label: "Email Settings" },
        { key: "security", label: "Security" },
      ],
    },
    {
      name: "Plugins & Extensions",
      path: "/super-admin/plugins",
      icon: "M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z",
    },

    { type: "divider", label: "Security & Monitoring" },
    {
      name: "Security & Backup",
      path: "/super-admin/security",
      icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
      children: [
        { key: "backups", label: "Backups" },
        { key: "activity", label: "Suspicious Activity" },
        { key: "login-security", label: "Login Security" },
      ],
    },
    {
      name: "Reports & Monitoring",
      path: "/super-admin/reports",
      icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
      children: [
        { key: "analytics", label: "Analytics" },
        { key: "audit-logs", label: "Audit Logs" },
        { key: "user-actions", label: "User Actions" },
      ],
    },
  ],

  admin: [
    { type: "divider", label: "Overview" },
    {
      name: "Dashboard",
      path: "/admin/dashboard",
      icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
      children: [
        { key: "overview", label: "Overview" },
        { key: "revenue", label: "Revenue" },
        { key: "appointment", label: "Appointment" },
        { key: "customers", label: "Customers" },
        { key: "inventory", label: "Inventory" },
        { key: "services", label: "Services" },
        { key: "employees", label: "Employees" },
      ],
    },

    { type: "divider", label: "Operations" },
    {
      name: "Services",
      path: "/admin/services",
      icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    },
    {
      name: "Appointments",
      path: "/admin/appointments",
      icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    },

    { type: "divider", label: "People" },
    {
      name: "Customers",
      path: "/admin/customers",
      icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    },
    {
      name: "Staff",
      path: "/admin/staff",
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    },

    { type: "divider", label: "Location" },
    {
      name: "Branches",
      path: "/admin/branches",
      icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
    },
  ],

  business_owner: [
    { type: "divider", label: "Overview" },
    {
      name: "Dashboard",
      path: "/branch-owner/dashboard",
      icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
      children: [
        { key: "overview", label: "Overview" },
        { key: "revenue", label: "Revenue" },
        { key: "appointment", label: "Appointment" },
        { key: "customers", label: "Customers" },
        { key: "inventory", label: "Inventory" },
        { key: "services", label: "Services" },
      ],
    },

    { type: "divider", label: "Operations" },
    {
      name: "Appointments",
      path: "/branch-owner/appointments",
      icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    },
    {
      name: "Services",
      path: "/branch-owner/services",
      icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    },
    {
      name: "Inventory",
      path: "/branch-owner/inventory",
      icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
      alertBadge: true,
    },

    { type: "divider", label: "Management" },
    {
      name: "Employee Accounts",
      path: "/branch-owner/accounts",
      icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    },
    {
      name: "Branches",
      path: "/branch-owner/branches",
      icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    },
  ],

  branch_manager: [
    { type: "divider", label: "Overview" },
    {
      name: "Dashboard",
      path: "/manager/dashboard",
      icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
      children: [
        { key: "overview", label: "Overview" },
        { key: "revenue", label: "Revenue" },
        { key: "appointment", label: "Appointment" },
        { key: "customers", label: "Customers" },
        { key: "inventory", label: "Inventory" },
        { key: "services", label: "Services" },
        { key: "employees", label: "Employees" },
      ],
    },

    { type: "divider", label: "Operations" },
    {
      name: "Appointments",
      path: "/manager/appointments",
      icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    },
    {
      name: "Inventory",
      path: "/manager/inventory",
      icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
      alertBadge: true,
    },
    {
      name: "History",
      path: "/manager/history",
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
      children: [
        { key: "service-history", label: "Service History" },
        { key: "inventory-transaction", label: "Inventory Transaction" },
      ],
    },

    { type: "divider", label: "People" },
    {
      name: "Customer Management",
      path: "/manager/customers",
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    },
    {
      name: "Account Management",
      path: "/manager/accounts",
      icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    },

    { type: "divider", label: "Configuration" },
    {
      name: "Contents",
      path: "/manager/contents",
      icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
      children: [
        { key: "schedule", label: "Schedule" },
        { key: "exceptions", label: "Exceptions" },
        { key: "services", label: "Services" },
      ],
    },
  ],

  staff: [
    { type: "divider", label: "Overview" },
    {
      name: "Dashboard",
      path: "/staff/dashboard",
      icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
    },
    { type: "divider", label: "Work" },
    {
      name: "POS",
      path: "/staff/pos",
      icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
    },
    {
      name: "Appointments",
      path: "/staff/appointments",
      icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    },
    {
      name: "Queue Management",
      path: "/staff/queue",
      icon: "M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h9l2-2zm0 0l2-5h3l2 5v1h-2m-5 0H9",
    },
  ],

  employee: [
    { type: "divider", label: "Overview" },
    {
      name: "Dashboard",
      path: "/employee/dashboard",
      icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    },
    { type: "divider", label: "My Work" },
    {
      name: "Active Jobs",
      path: "/employee/active-jobs",
      icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    },
    {
      name: "Schedule",
      path: "/employee/schedule",
      icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    },
    {
      name: "Vehicle Recognition",
      path: "/employee/vehicle-recognition",
      icon: "M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h9l2-2zm0 0l2-5h3l2 5v1h-2m-5 0H9",
    },
    { type: "divider", label: "Records" },
    {
      name: "Job History",
      path: "/employee/job-history",
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    },
  ],

  inventory: [
    { type: "divider", label: "Overview" },
    {
      name: "Dashboard",
      path: "/inventory/dashboard",
      icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
   
    },
    { type: "divider", label: "Stock" },
    {
      name: "Stock Overview",
      path: "/inventory/stock",
      icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    },
    {
      name: "Reorder Alerts",
      path: "/inventory/alerts",
      icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
      alertBadge: true,
    },
    { type: "divider", label: "Records" },
    {
      name: "Movement Log",
      path: "/inventory/movement-log",
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    },
  ],

  inventory_manager: [
    { type: "divider", label: "Overview" },
    {
      name: "Dashboard",
      path: "/inventory-manager/dashboard",
      icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
   
    },
    { type: "divider", label: "Stock" },
    {
      name: "Inventory",
      path: "/inventory-manager/inventory",
      icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
      alertBadge: true,
    },
    { type: "divider", label: "Records" },
    {
      name: "Transaction History",
      path: "/inventory-manager/transactions",
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    },
  ],
};

// ─── Role Labels ──────────────────────────────────────────────────────────────

const ROLE_LABELS = {
  super_admin: { title: "Super Admin", subtitle: "System Root" },
  admin: { title: "Admin User", subtitle: "System Administrator" },
  business_owner: { title: "Branch Owner", subtitle: "Business Manager" },
  branch_manager: { title: "Manager", subtitle: "Branch Manager" },
  staff: { title: "Staff", subtitle: "Cashier" },
  employee: { title: "Employee", subtitle: "Service Employee" },
  inventory: { title: "Inventory", subtitle: "Stock & Supply" },
  inventory_manager: { title: "Inventory Manager", subtitle: "Stock & Supply" },
};

// ─── Section Divider component ────────────────────────────────────────────────

function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-2 px-5 pt-4 pb-1">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-gray-800/70" />
    </div>
  );
}

// ─── Unified Sidebar ──────────────────────────────────────────────────────────

function UnifiedSidebar({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, role, user, headers } = useAuth();

  const [alertCount, setAlertCount] = useState(null);
  const [expandedItems, setExpandedItems] = useState({});
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebar_collapsed") === "1";
    } catch {
      return false;
    }
  });

  const menuItems = MENU_ITEMS[role] ?? [];
  const roleLabel = ROLE_LABELS[role] ?? { title: "User", subtitle: "" };

  // Fetch live reorder-alert count
  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    const fetchCount = async () => {
      const token =
        localStorage.getItem("access_token") ??
        sessionStorage.getItem("access_token");

      if (!token || cancelled) return;

      try {
        const res = await fetch(`${API_BASE}/inventory/?status=low,out`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (cancelled) return;
        if (!res.ok) {
          setAlertCount(null);
          return;
        }
        const data = await res.json();
        if (!cancelled) setAlertCount((data ?? []).length);
      } catch {
        // Network error - leave existing count in place
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 2 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isAuthenticated, role]);

  useEffect(() => {
    setExpandedItems((prev) => {
      const updated = { ...prev };
      menuItems.forEach((item) => {
        if (item.children && item.path === location.pathname) {
          updated[item.path] = true;
        }
      });
      return updated;
    });
  }, [location.pathname, role]);

  useEffect(() => {
    try {
      localStorage.setItem("sidebar_collapsed", collapsed ? "1" : "0");
    } catch {
      // ignore
    }
    document.documentElement.style.setProperty("--sidebar-width", collapsed ? "5rem" : "15rem");
  }, [collapsed]);

  const isActive = (path) => location.pathname === path;

  const handleNavClick = () => {
    if (onClose && window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Confirm Logout",
      text: "Are you sure you want to log out?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#374151",
      confirmButtonText: "Yes, logout",
      background: "linear-gradient(to bottom right, #1f2937, #111827)",
      color: "#fff",
    });

    if (!result.isConfirmed) return;

    const refresh =
      localStorage.getItem("refresh_token") ||
      sessionStorage.getItem("refresh_token");
    const access =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");

    try {
      await fetch(`${API_BASE}/logout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access}`,
        },
        body: JSON.stringify({ refresh }),
      });
    } catch {
      // fail silently — still clear storage
    }

    ["access_token", "refresh_token", "user"].forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    await Swal.fire({
      icon: "success",
      title: "Logged Out",
      text: "You have been successfully logged out.",
      background: "linear-gradient(to bottom right, #1f2937, #111827)",
      color: "#fff",
      confirmButtonColor: "#dc2626",
    });

    navigate("/signin");
  };

  return (
    <>
      <aside
        className={`
          fixed lg:fixed top-0 left-0 h-full w-72 bg-gradient-to-b from-gray-900 to-gray-950 
          flex flex-col z-40 shadow-2xl
          transition-all duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 ${collapsed ? "lg:w-20" : "lg:w-64"}
        `}
      >
        {/* Logo Section with Close Button */}
        <div className="p-5 border-b border-gray-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="Otokwikk logo"
              className="h-10 md:h-12 object-contain transition-all duration-300 hover:scale-105"
            />
          </div>
          <button
            onClick={() => setCollapsed((prev) => !prev)}
            className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg bg-gray-800/50 hover:bg-gray-700 text-gray-300 transition-all duration-200"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800/50 hover:bg-red-600/20 text-gray-400 hover:text-red-500 transition-all duration-200"
            aria-label="Close sidebar"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {menuItems.map((item, index) => {
            // ── Divider / section label ──────────────────────────────────
            if (item.type === "divider") {
              return collapsed ? null : <SectionDivider key={`divider-${index}`} label={item.label} />;
            }

            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedItems[item.path] ?? false;

            // ── Collapsible parent ───────────────────────────────────────
            if (hasChildren) {
              const active = location.pathname === item.path;
              return (
                <div key={item.path} className="mb-1">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedItems((prev) => ({
                        ...prev,
                        [item.path]: !prev[item.path],
                      }))
                    }
                    className={`w-full flex items-center gap-3 px-5 py-3 transition-all duration-200 group ${active
                        ? "bg-gradient-to-r from-red-600/20 to-transparent text-white border-l-4 border-red-600"
                        : "text-gray-400 hover:text-white hover:bg-gray-800/50 border-l-4 border-transparent"
                      }`}
                    title={item.name}
                  >
                    <svg
                      className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${active ? "text-red-500" : ""
                        }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={item.icon}
                      />
                    </svg>
                    <span className={`font-medium text-sm flex-1 text-left ${collapsed ? "lg:hidden" : ""}`}>
                      {item.name}
                    </span>
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${collapsed ? "lg:hidden" : ""} ${isExpanded ? "rotate-90" : "rotate-0"
                        }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>

                  {isExpanded && !collapsed && (
                    <div className="ml-10 mt-1 space-y-1">
                      {item.children.map((child, idx) => {
                        const childTo = `${item.path}#${child.key}`;
                        const hashActive =
                          location.pathname === item.path &&
                          location.hash === `#${child.key}`;
                        const activeChild =
                          location.pathname === item.path &&
                          ((!location.hash && idx === 0) || hashActive);

                        return (
                          <Link
                            key={child.key}
                            to={childTo}
                            onClick={handleNavClick}
                            className={`block pl-4 pr-5 py-2 text-xs rounded-lg transition-all ${activeChild
                                ? "text-red-400 bg-red-500/10 border-l-2 border-red-500"
                                : "text-gray-500 hover:text-gray-300 hover:bg-white/5 border-l-2 border-transparent"
                              }`}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // ── Plain nav link ───────────────────────────────────────────
            const active = isActive(item.path);
            const showBadge =
              item.alertBadge && alertCount != null && alertCount > 0;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-5 py-3 transition-all duration-200 group ${active
                    ? "bg-gradient-to-r from-red-600/20 to-transparent text-white border-l-4 border-red-600"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50 border-l-4 border-transparent"
                  }`}
                title={item.name}
              >
                <svg
                  className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${active ? "text-red-500" : ""
                    }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={item.icon}
                  />
                </svg>
                <span className={`font-medium text-sm flex-1 ${collapsed ? "lg:hidden" : ""}`}>{item.name}</span>

                {showBadge && !collapsed && (
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full animate-pulse ${active
                        ? "bg-red-500 text-white"
                        : "bg-red-500/20 text-red-400"
                      }`}
                  >
                    {alertCount > 99 ? "99+" : alertCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-800/50 bg-gray-900/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div className={`flex-1 min-w-0 ${collapsed ? "lg:hidden" : ""}`}>
              <p className="text-white font-semibold text-sm truncate">
                {user?.first_name && user?.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : (user?.full_name ?? user?.name ?? roleLabel.title)}
              </p>
              <p className="text-gray-400 text-xs truncate">
                {user?.email || roleLabel.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800/50 hover:bg-red-600/20 text-gray-400 hover:text-red-400 rounded-xl transition-all duration-200 group"
            title="Logout"
          >
            <svg
              className="w-5 h-5 transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span className={`font-medium text-sm ${collapsed ? "lg:hidden" : ""}`}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
}

export default UnifiedSidebar;
