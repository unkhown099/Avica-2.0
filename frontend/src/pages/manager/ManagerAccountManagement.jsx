import React, { useEffect, useMemo, useState, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { API_BASE } from "../../hooks/useAuth.js";
import ManagerLayout from "./ManagerLayout";
import Pagination from "../../components/Pagination";
import usePagination from "../../hooks/usePagination";

const roles = [
  "Admin",
  "Business Owner",
  "Branch Manager",
  "Staff",
  "Employee",
  "Inventory",
  "Inventory Manager",
  "super_admin",
];

const createRoles = ["Staff", "Employee", "Inventory", "Inventory Manager"];
const editRoles = ["Staff", "Employee", "Inventory", "Inventory Manager", "Branch Manager"];

const roleColors = {
  Admin: "#ef4444",
  "Business Owner": "#a855f7",
  "Branch Manager": "#3b82f6",
  Staff: "#10b981",
  Employee: "#f59e0b",
  Inventory: "#f97316",
  "Inventory Manager": "#fb923c",
  super_admin: "#22d3ee",
};

const ROLE_BADGE_STYLE = {
  Admin: "bg-red-500/20 text-red-400 border-red-500/30",
  "Business Owner": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Branch Manager": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Staff: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Employee: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Inventory: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "Inventory Manager": "bg-orange-600/20 text-orange-300 border-orange-600/30",
  super_admin: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
};

const tokenHeaders = () => {
  const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const normalizeRole = (role) => {
  const value = String(role || "").trim();
  if (value === "Super Admin") return "super_admin";
  return value;
};

const isProtectedRole = (role) => {
  const norm = normalizeRole(role);
  return norm === "Admin" || norm === "Business Owner" || norm === "super_admin";
};

const getRoleBadge = (role) => {
  const normalized = normalizeRole(role);
  const label = normalized === "super_admin" ? "Super Admin" : normalized;
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-semibold border ${ROLE_BADGE_STYLE[normalized] || "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}
    >
      {label}
    </span>
  );
};

const getStatusBadge = (status) => {
  const active = String(status || "").toLowerCase() === "active";
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${active ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}
    >
      {status || "Inactive"}
    </span>
  );
};

function StaffCard({ staff, onEdit }) {
  const roleKey = normalizeRole(staff.role);
  return (
    <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
            style={{
              backgroundColor: (roleColors[roleKey] ?? "#6b7280") + "33",
              color: roleColors[roleKey] ?? "#6b7280",
            }}
          >
            {(staff.name || "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-white font-semibold text-sm truncate">{staff.name}</div>
            <div className="text-gray-500 text-xs truncate">{staff.email}</div>
          </div>
        </div>
        {getRoleBadge(staff.role)}
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500 gap-2">
        <span className="truncate">{staff.branch || "-"}</span>
        <div className="flex items-center gap-2 shrink-0">
          {getStatusBadge(staff.status)}
          <button
            type="button"
            onClick={() => onEdit(staff)}
            disabled={isProtectedRole(staff.role)}
            className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateManagerStaffModal({
  isOpen,
  mode,
  initialStaff,
  managerBranchId,
  managerBranchName,
  onClose,
  roleOptions,
  onCreated,
  onUpdated,
}) {
  const isEdit = mode === "edit";
  const createDraftRef = useRef({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: roleOptions[0] || "",
    status: "Active",
    password: "",
    confirmPassword: "",
  });
  const contextRef = useRef("create");

  const buildEditForm = (staff) => {
    const initialName = (staff?.name || "").trim();
    const parsedFirstName =
      staff?.first_name ||
      initialName.split(" ").slice(0, -1).join(" ") ||
      initialName;
    const parsedLastName =
      staff?.last_name || initialName.split(" ").slice(-1).join(" ") || "";

    return {
      firstName: parsedFirstName || "",
      lastName: parsedLastName || "",
      email: staff?.email || "",
      phone: staff?.phone || "",
      role: staff?.role && roleOptions.includes(staff.role) ? staff.role : roleOptions[0],
      status: staff?.status || "Active",
      password: "",
      confirmPassword: "",
    };
  };

  const [form, setForm] = useState(() =>
    isEdit ? buildEditForm(initialStaff) : createDraftRef.current,
  );

  useEffect(() => {
    if (!isEdit) createDraftRef.current = form;
  }, [form, isEdit]);

  useEffect(() => {
    const nextContext = isEdit ? `edit:${initialStaff?.id ?? "new"}` : "create";
    if (contextRef.current === nextContext) return;

    if (nextContext === "create") {
      setForm(createDraftRef.current);
    } else {
      setForm(buildEditForm(initialStaff));
    }
    contextRef.current = nextContext;
  }, [isEdit, initialStaff, roleOptions]);

  const inputCls =
    "w-full bg-gray-800 border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all text-sm";

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();

    if (!managerBranchId) {
      await Swal.fire({ icon: "error", title: "Branch required", text: "Manager branch is not assigned." });
      return;
    }

    if (!isEdit && form.password !== form.confirmPassword) {
      await Swal.fire({ icon: "error", title: "Password mismatch", text: "Passwords do not match." });
      return;
    }

    try {
      const payload = {
        email: form.email,
        first_name: form.firstName,
        last_name: form.lastName,
        phone: form.phone,
        role: form.role,
        branch: managerBranchId,
      };

      if (isEdit) {
        payload.status = form.status;
        if (form.password) payload.password = form.password;
      } else {
        payload.password = form.password;
      }

      const res = isEdit
        ? await axios.patch(`${API_BASE}/staff/${initialStaff.id}/`, payload, {
            headers: tokenHeaders(),
          })
        : await axios.post(`${API_BASE}/staff/`, payload, {
            headers: tokenHeaders(),
          });

      if (isEdit) onUpdated(res.data);
      else onCreated(res.data);
      onClose();

      await Swal.fire({
        icon: "success",
        title: isEdit ? "Staff updated" : "Staff created",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      const msg =
        err.response?.data?.email?.[0] ||
        err.response?.data?.role?.[0] ||
        err.response?.data?.branch?.[0] ||
        err.response?.data?.detail ||
        (isEdit ? "Failed to update staff" : "Failed to create staff");

      await Swal.fire({
        icon: "error",
        title: isEdit ? "Update failed" : "Creation failed",
        text: msg,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-end sm:items-center z-50 p-0 sm:p-4">
      <div className="bg-gray-900 border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 sticky top-0 bg-gray-900 z-10">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              {isEdit ? "Edit Staff Account" : "Create Staff Account"}
            </h2>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">Branch: {managerBranchName || "Your Branch"}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">First Name</label>
              <input name="firstName" value={form.firstName} onChange={handleChange} required className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">Last Name</label>
              <input name="lastName" value={form.lastName} onChange={handleChange} required className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required className={inputCls} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} required className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">Role</label>
              <select name="role" value={form.role} onChange={handleChange} className={inputCls}>
                {roleOptions.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">Branch</label>
              <input value={managerBranchName || "Assigned Branch"} disabled className={`${inputCls} opacity-70 cursor-not-allowed`} />
            </div>
          </div>

          {isEdit && (
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">Status</label>
              <select name="status" value={form.status} onChange={handleChange} className={inputCls}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">{isEdit ? "New Password (optional)" : "Password"}</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required={!isEdit}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">{isEdit ? "Confirm New Password" : "Confirm Password"}</label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required={!isEdit}
                className={inputCls}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-white/10 text-gray-400 hover:text-white px-4 py-3 rounded-xl transition-all font-semibold text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl transition-all font-semibold text-sm shadow-lg shadow-red-600/30"
            >
              {isEdit ? "Save Changes" : "Create Staff Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ManagerAccountManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [staffAccounts, setStaffAccounts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [managerBranchId, setManagerBranchId] = useState("");
  const [managerBranchName, setManagerBranchName] = useState("");
  const [managerStaffId, setManagerStaffId] = useState(null);
  const [managerEmail, setManagerEmail] = useState("");

  const branchScopedStaff = useMemo(() => {
    if (!managerBranchId) return [];
    const inBranchById = staffAccounts.filter((s) => String(s.branch_id || "") === String(managerBranchId));
    const inBranch =
      inBranchById.length > 0
        ? inBranchById
        : staffAccounts.filter((s) => (s.branch || "").trim() === (managerBranchName || "").trim());

    return inBranch.filter((s) => {
      const sameStaffId = managerStaffId != null && String(s.id) === String(managerStaffId);
      const sameEmail =
        managerEmail &&
        String(s.email || "").trim().toLowerCase() === String(managerEmail).trim().toLowerCase();
      return !sameStaffId && !sameEmail;
    });
  }, [staffAccounts, managerBranchId, managerBranchName, managerStaffId, managerEmail]);

  useEffect(() => {
    const fetchStaff = async () => {
      const headers = tokenHeaders();
      if (!headers.Authorization) {
        await Swal.fire({ icon: "error", title: "Unauthorized", text: "Please login first." });
        setLoading(false);
        return;
      }

      try {
        const [staffRes, branchRes, meRes] = await Promise.all([
          axios.get(`${API_BASE}/staff/`, { headers }),
          axios.get(`${API_BASE}/branches/`, { headers }),
          axios.get(`${API_BASE}/me/`, { headers }),
        ]);

        const me = meRes?.data || {};
        const branchId = String(me?.staff_profile?.branch_id || "");
        const myStaffId = me?.staff_profile?.id ?? null;
        const myEmail = me?.email || "";
        const branchList = Array.isArray(branchRes.data) ? branchRes.data : [];
        const matchedBranch = branchList.find((b) => String(b.id) === branchId);

        setManagerBranchId(branchId);
        setManagerBranchName(matchedBranch?.name || "");
        setManagerStaffId(myStaffId);
        setManagerEmail(myEmail);
        setBranches(branchList);
        setStaffAccounts(Array.isArray(staffRes.data) ? staffRes.data : []);
      } catch (err) {
        console.error("Failed to load staff accounts:", err);
        setStaffAccounts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, []);

  const roleCounts = roles.reduce((acc, role) => {
    acc[role] = branchScopedStaff.filter((s) => normalizeRole(s.role) === role).length;
    return acc;
  }, {});

  const kpiCards = [
    {
      key: "total",
      label: "Total Accounts",
      count: branchScopedStaff.length,
      pct: 100,
      color: "#ef4444",
    },
    {
      key: "staff",
      label: "Staff",
      count: roleCounts.Staff || 0,
      pct: branchScopedStaff.length ? ((roleCounts.Staff || 0) / branchScopedStaff.length) * 100 : 0,
      color: roleColors.Staff,
    },
    {
      key: "employee",
      label: "Employee",
      count: roleCounts.Employee || 0,
      pct: branchScopedStaff.length ? ((roleCounts.Employee || 0) / branchScopedStaff.length) * 100 : 0,
      color: roleColors.Employee,
    },
    {
      key: "inventory",
      label: "Inventory Team",
      count: (roleCounts.Inventory || 0) + (roleCounts["Inventory Manager"] || 0),
      pct:
        branchScopedStaff.length
          ? (((roleCounts.Inventory || 0) + (roleCounts["Inventory Manager"] || 0)) / branchScopedStaff.length) * 100
          : 0,
      color: roleColors["Inventory Manager"],
    },
  ];

  const filteredStaff = branchScopedStaff.filter((staff) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (staff.name || "").toLowerCase().includes(q) ||
      (staff.email || "").toLowerCase().includes(q) ||
      String(staff.id || "").includes(q);
    const roleKey = normalizeRole(staff.role);
    const matchesRole = roleFilter === "All Roles" || roleKey === roleFilter;
    return matchesSearch && matchesRole;
  });

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    startItem,
    endItem,
    paginatedItems,
  } = usePagination({
    items: filteredStaff,
    pageSize: 10,
    resetDeps: [searchQuery, roleFilter, branchScopedStaff.length],
  });

  const verifyAccessPassword = async () => {
    const headers = tokenHeaders();
    if (!headers.Authorization) {
      await Swal.fire({ icon: "error", title: "Unauthorized", text: "Please login first." });
      return false;
    }

    const { value: password } = await Swal.fire({
      title: "Verify Password",
      input: "password",
      inputLabel: "Enter your password to continue",
      inputPlaceholder: "Current password",
      inputAttributes: { autocapitalize: "off", autocorrect: "off" },
      showCancelButton: true,
      confirmButtonText: "Verify",
      confirmButtonColor: "#dc2626",
      background: "#111827",
      color: "#f9fafb",
    });

    if (!password) return false;

    try {
      await axios.post(`${API_BASE}/staff/verify-password/`, { password }, { headers });
      return true;
    } catch {
      await Swal.fire({
        icon: "error",
        title: "Verification failed",
        text: "Invalid password.",
        background: "#111827",
        color: "#f9fafb",
      });
      return false;
    }
  };

  const openCreateModal = async () => {
    const verified = await verifyAccessPassword();
    if (!verified) return;
    setEditingStaff(null);
    setShowCreateModal(true);
  };

  const openEditModal = async (staff) => {
    if (isProtectedRole(staff.role)) {
      await Swal.fire({
        icon: "info",
        title: "Not editable",
        text: "This account cannot be edited from manager access.",
        background: "#111827",
        color: "#f9fafb",
      });
      return;
    }

    const verified = await verifyAccessPassword();
    if (!verified) return;

    setEditingStaff(staff);
    setShowCreateModal(true);
  };

  if (loading) {
    return (
      <ManagerLayout title="" subtitle="">
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-4 sm:-m-8 p-4 sm:p-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400">Loading staff accounts...</p>
          </div>
        </div>
      </ManagerLayout>
    );
  }

  return (
    <ManagerLayout title="" subtitle="">
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-4 sm:-m-8 p-4 sm:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Account Management</h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">Manage your branch team and access levels</p>
          <button
            onClick={openCreateModal}
            className="mt-4 ml-auto flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-red-600/30 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Staff
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6 sm:mb-8">
          {kpiCards.map((card) => {
            return (
              <div
                key={card.key}
                className="bg-gray-900/60 border border-white/5 rounded-2xl p-3 sm:p-4 backdrop-blur-sm hover:border-white/10 transition-all"
              >
                <div className="text-xl sm:text-2xl font-black text-white mb-1">{card.count}</div>
                <div className="text-xs text-gray-400 font-medium whitespace-nowrap">{card.label}</div>
                <div className="mt-2 h-1 rounded-full bg-gray-800">
                  <div
                    className="h-1 rounded-full transition-all duration-500"
                    style={{
                      width: `${card.pct}%`,
                      backgroundColor: card.color || "#6b7280",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900/60 border border-white/10 text-white placeholder-gray-500 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all text-sm"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-gray-900/60 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 transition-all cursor-pointer text-sm"
          >
            <option value="All Roles">All Roles</option>
            {roles.map((r) => (
              <option key={r} value={r}>{r === "super_admin" ? "Super Admin" : r}</option>
            ))}
          </select>
        </div>

        <div className="md:hidden space-y-3 mb-4">
          {filteredStaff.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-gray-500">No staff accounts found</p>
            </div>
          ) : (
            paginatedItems.map((staff, index) => (
              <div key={staff.id} className="relative">
                <div className="absolute left-3 top-2 text-[11px] text-gray-500 z-10">#{startItem + index}</div>
                <StaffCard staff={staff} onEdit={openEditModal} />
              </div>
            ))
          )}
        </div>

        <div className="hidden md:block bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div className="col-span-1">#</div>
            <div className="col-span-2">Name</div>
            <div className="col-span-2">Email</div>
            <div className="col-span-2">Phone</div>
            <div className="col-span-1">Branch</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {filteredStaff.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-gray-500 text-lg">No staff accounts found</p>
              <p className="text-gray-600 text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            paginatedItems.map((staff, index) => {
              const roleKey = normalizeRole(staff.role);
              return (
                <div
                  key={staff.id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center"
                >
                  <div className="col-span-1 text-xs text-gray-500">#{startItem + index}</div>
                  <div className="col-span-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                        style={{
                          backgroundColor: (roleColors[roleKey] ?? "#6b7280") + "33",
                          color: roleColors[roleKey] ?? "#6b7280",
                        }}
                      >
                        {(staff.name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="text-white font-semibold text-sm truncate">{staff.name}</div>
                    </div>
                  </div>
                  <div className="col-span-2 text-gray-400 text-sm truncate">{staff.email}</div>
                  <div className="col-span-2 text-gray-400 text-sm">{staff.phone}</div>
                  <div className="col-span-1 text-gray-400 text-sm truncate">{staff.branch || "-"}</div>
                  <div className="col-span-2">{getRoleBadge(staff.role)}</div>
                  <div className="col-span-1">{getStatusBadge(staff.status)}</div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => openEditModal(staff)}
                      disabled={isProtectedRole(staff.role)}
                      className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {filteredStaff.length > 0 && (
            <div className="px-6 py-4">
              <p className="text-gray-500 text-sm">
                Showing <span className="text-white font-semibold">{startItem}-{endItem}</span> of <span className="text-white font-semibold">{filteredStaff.length}</span> staff members
              </p>
            </div>
          )}

          <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} className="px-6 pb-6" />
        </div>

        {filteredStaff.length > 0 && (
          <div className="md:hidden mt-2">
            <p className="text-gray-500 text-sm mb-3">
              Showing <span className="text-white font-semibold">{startItem}-{endItem}</span> of <span className="text-white font-semibold">{filteredStaff.length}</span>
            </p>
            <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
          </div>
        )}
      </div>

      <CreateManagerStaffModal
        isOpen={showCreateModal}
        mode={editingStaff ? "edit" : "create"}
        initialStaff={editingStaff}
        managerBranchId={managerBranchId}
        managerBranchName={managerBranchName}
        roleOptions={editingStaff ? editRoles : createRoles}
        onClose={() => {
          setShowCreateModal(false);
          setEditingStaff(null);
        }}
        onCreated={(newStaff) => setStaffAccounts((prev) => [...prev, newStaff])}
        onUpdated={(updatedStaff) =>
          setStaffAccounts((prev) =>
            prev.map((s) => (s.id === updatedStaff.id ? updatedStaff : s)),
          )
        }
      />
    </ManagerLayout>
  );
}

export default ManagerAccountManagement;
