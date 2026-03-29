import React, { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import axios from "axios";
import { API_BASE } from "../../hooks/useAuth.js";
import Swal from "sweetalert2";
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
];
const createRoles = roles.filter(
  (r) => r !== "Admin" && r !== "Business Owner",
);
const editRoles = roles.filter((r) => r !== "Admin");

const roleColors = {
  Admin: "#ef4444",
  "Business Owner": "#a855f7",
  "Branch Manager": "#3b82f6",
  Staff: "#10b981",
  Employee: "#f59e0b",
  Inventory: "#f97316",
  "Inventory Manager": "#fb923c",
};

const ROLE_BADGE_STYLE = {
  Admin: "bg-red-500/20 text-red-400 border-red-500/30",
  "Business Owner": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Branch Manager": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Staff: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Employee: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Inventory: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "Inventory Manager": "bg-orange-600/20 text-orange-300 border-orange-600/30",
};

const getRoleBadge = (role) => (
  <span
    className={`inline-flex items-center whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-semibold border ${ROLE_BADGE_STYLE[role] || "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}
  >
    {role}
  </span>
);

const getStatusBadge = (status) => (
  <span
    className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${status === "Active" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}
  >
    {status}
  </span>
);

// ── Mobile Staff Card ─────────────────────────────────────────────────────────
function StaffCard({ staff, onEdit }) {
  return (
    <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
            style={{
              backgroundColor: (roleColors[staff.role] ?? "#6b7280") + "33",
              color: roleColors[staff.role] ?? "#6b7280",
            }}
          >
            {staff.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-white font-semibold text-sm">{staff.name}</div>
            <div className="text-gray-500 text-xs">{staff.email}</div>
          </div>
        </div>
        {getRoleBadge(staff.role)}
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{staff.branch || "—"}</span>
        <div className="flex items-center gap-2">
          {getStatusBadge(staff.status)}
          <button
            type="button"
            onClick={() => onEdit(staff)}
            disabled={staff.role === "Admin"}
            className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
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

function AdminStaffAccounts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editStaff, setEditStaff] = useState(null);
  const [staffAccounts, setStaffAccounts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaff = async () => {
      const accessToken =
        localStorage.getItem("access_token") ||
        sessionStorage.getItem("access_token");
      if (!accessToken) {
        Swal.fire({
          icon: "error",
          title: "Unauthorized",
          text: "Please login first",
        });
        setLoading(false);
        return;
      }
      try {
        const [staffRes, branchRes] = await Promise.all([
          axios.get(`${API_BASE}/staff/`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          axios.get(`${API_BASE}/branches/`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ]);
        setStaffAccounts(staffRes.data);
        setBranches(branchRes.data);
      } catch (err) {
        if (err.response?.status === 401)
          Swal.fire({
            icon: "error",
            title: "Unauthorized",
            text: "Your session has expired. Please login again.",
          });
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, []);

  const filteredStaff = staffAccounts.filter((staff) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      staff.name.toLowerCase().includes(q) ||
      staff.email.toLowerCase().includes(q) ||
      String(staff.id).includes(q);
    const matchesRole = roleFilter === "All Roles" || staff.role === roleFilter;
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
    resetDeps: [searchQuery, roleFilter, staffAccounts.length],
  });

  const roleCounts = roles.reduce((acc, role) => {
    acc[role] = staffAccounts.filter((s) => s.role === role).length;
    return acc;
  }, {});

  const verifyAccessPassword = async () => {
    const accessToken =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");
    if (!accessToken) {
      await Swal.fire({
        icon: "error",
        title: "Unauthorized",
        text: "Please login first",
      });
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
      await axios.post(
        `${API_BASE}/staff/verify-password/`,
        { password },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
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
    setEditStaff(null);
    setShowCreateModal(true);
  };

  const openEditModal = async (staff) => {
    if (staff.role === "Admin") {
      await Swal.fire({
        icon: "info",
        title: "Not editable",
        text: "Admin account cannot be edited here.",
        background: "#111827",
        color: "#f9fafb",
      });
      return;
    }
    const verified = await verifyAccessPassword();
    if (!verified) return;
    setEditStaff(staff);
    setShowCreateModal(true);
  };

  if (loading) {
    return (
      <AdminLayout title="" subtitle="">
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-4 sm:-m-8 p-4 sm:p-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400">Loading staff accounts...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="" subtitle="">
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-4 sm:-m-8 p-4 sm:p-8">
        {/* ── Header: title + button stacked on the left ── */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Staff Accounts
          </h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">
            Manage your team members and access levels
          </p>
          <button
            onClick={openCreateModal}
className="mt-4 ml-auto flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-red-600/30 text-sm"          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Staff
          </button>
        </div>

        {/* Stats Cards - horizontal scroll on mobile */}
        <div className="flex gap-3 overflow-x-auto pb-2 mb-6 sm:mb-8 sm:grid sm:grid-cols-3 lg:grid-cols-6 sm:overflow-visible">
          {roles.map((role) => (
            <div
              key={role}
              className="bg-gray-900/60 border border-white/5 rounded-2xl p-3 sm:p-4 backdrop-blur-sm hover:border-white/10 transition-all shrink-0 min-w-[120px] sm:min-w-0"
            >
              <div className="text-xl sm:text-2xl font-black text-white mb-1">
                {roleCounts[role] || 0}
              </div>
              <div className="text-xs text-gray-400 font-medium whitespace-nowrap">
                {role}
              </div>
              <div className="mt-2 h-1 rounded-full bg-gray-800">
                <div
                  className="h-1 rounded-full transition-all duration-500"
                  style={{
                    width: staffAccounts.length
                      ? `${((roleCounts[role] || 0) / staffAccounts.length) * 100}%`
                      : "0%",
                    backgroundColor: roleColors[role],
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
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
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3 mb-4">
          {filteredStaff.length === 0 ? (
            <div className="py-16 text-center">
              <svg
                className="w-12 h-12 text-gray-700 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <p className="text-gray-500">No staff accounts found</p>
            </div>
          ) : (
            paginatedItems.map((staff) => (
              <StaffCard key={staff.id} staff={staff} onEdit={openEditModal} />
            ))
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div className="col-span-2">Name</div>
            <div className="col-span-2">Email</div>
            <div className="col-span-2">Phone</div>
            <div className="col-span-2">Branch</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {filteredStaff.length === 0 ? (
            <div className="py-20 text-center">
              <svg
                className="w-12 h-12 text-gray-700 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <p className="text-gray-500 text-lg">No staff accounts found</p>
              <p className="text-gray-600 text-sm mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            paginatedItems.map((staff) => (
              <div
                key={staff.id}
                className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center"
              >
                <div className="col-span-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{
                        backgroundColor:
                          (roleColors[staff.role] ?? "#6b7280") + "33",
                        color: roleColors[staff.role] ?? "#6b7280",
                      }}
                    >
                      {staff.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-white font-semibold text-sm truncate">
                      {staff.name}
                    </div>
                  </div>
                </div>
                <div className="col-span-2 text-gray-400 text-sm truncate">
                  {staff.email}
                </div>
                <div className="col-span-2 text-gray-400 text-sm">
                  {staff.phone}
                </div>
                <div className="col-span-2 text-gray-400 text-sm truncate">
                  {staff.branch || "—"}
                </div>
                <div className="col-span-2">{getRoleBadge(staff.role)}</div>
                <div className="col-span-1">{getStatusBadge(staff.status)}</div>
                <div className="col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => openEditModal(staff)}
                    disabled={staff.role === "Admin"}
                    className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
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
            ))
          )}

          {filteredStaff.length > 0 && (
            <div className="px-6 py-4">
              <p className="text-gray-500 text-sm">
                Showing{" "}
                <span className="text-white font-semibold">
                  {startItem}-{endItem}
                </span>{" "}
                of{" "}
                <span className="text-white font-semibold">
                  {filteredStaff.length}
                </span>{" "}
                staff members
              </p>
            </div>
          )}
          <Pagination
            current={currentPage}
            total={totalPages}
            onChange={setCurrentPage}
            className="px-6 pb-6"
          />
        </div>

        {/* Mobile pagination */}
        {filteredStaff.length > 0 && (
          <div className="md:hidden mt-2">
            <p className="text-gray-500 text-sm mb-3">
              Showing{" "}
              <span className="text-white font-semibold">
                {startItem}-{endItem}
              </span>{" "}
              of{" "}
              <span className="text-white font-semibold">
                {filteredStaff.length}
              </span>
            </p>
            <Pagination
              current={currentPage}
              total={totalPages}
              onChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateStaffModal
          mode={editStaff ? "edit" : "create"}
          initialStaff={editStaff}
          roles={editStaff ? editRoles : createRoles}
          branches={branches}
          staffAccounts={staffAccounts}
          onClose={() => {
            setShowCreateModal(false);
            setEditStaff(null);
          }}
          onCreated={(newStaff) =>
            setStaffAccounts((prev) => [...prev, newStaff])
          }
          onUpdated={(updatedStaff) =>
            setStaffAccounts((prev) =>
              prev.map((s) => (s.id === updatedStaff.id ? updatedStaff : s)),
            )
          }
        />
      )}
    </AdminLayout>
  );
}

function CreateStaffModal({
  mode,
  initialStaff,
  onClose,
  roles,
  branches,
  staffAccounts,
  onCreated,
  onUpdated,
}) {
  const isEdit = mode === "edit";
  const [initialName] = useState((initialStaff?.name || "").trim());
  const parsedFirstName =
    initialStaff?.first_name ||
    initialName.split(" ").slice(0, -1).join(" ") ||
    initialName;
  const parsedLastName =
    initialStaff?.last_name || initialName.split(" ").slice(-1).join(" ") || "";
  const [form, setForm] = useState({
    firstName: parsedFirstName || "",
    lastName: parsedLastName || "",
    email: initialStaff?.email || "",
    phone: initialStaff?.phone || "",
    role: roles[0],
    branch: "",
    status: initialStaff?.status || "Active",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!isEdit || !initialStaff) return;
    const branchMatch = branches.find(
      (branch) =>
        String(branch.id) === String(initialStaff.branch_id) ||
        branch.name === initialStaff.branch,
    );
    setForm((prev) => ({
      ...prev,
      role: initialStaff.role || prev.role,
      branch: branchMatch ? String(branchMatch.id) : "",
    }));
  }, [isEdit, initialStaff, branches]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const managerBranchNames = new Set(
    staffAccounts
      .filter(
        (s) =>
          s.role === "Branch Manager" && (!isEdit || s.id !== initialStaff?.id),
      )
      .map((s) => s.branch?.trim())
      .filter(Boolean),
  );

  const availableBranches =
    form.role === "Branch Manager"
      ? branches.filter((b) => !managerBranchNames.has(b.name))
      : branches;

  const submit = async (e) => {
    e.preventDefault();
    if (!isEdit && form.password !== form.confirmPassword) {
      await Swal.fire({
        icon: "error",
        title: "Password mismatch",
        text: "Passwords do not match",
      });
      return;
    }
    if (form.role === "Branch Manager") {
      const selectedBranch = branches.find(
        (b) => String(b.id) === String(form.branch),
      );
      if (!selectedBranch) {
        await Swal.fire({
          icon: "error",
          title: "Branch required",
          text: "Please select a valid branch for Branch Manager role.",
        });
        return;
      }
      if (managerBranchNames.has(selectedBranch.name)) {
        await Swal.fire({
          icon: "error",
          title: "Branch unavailable",
          text: "This branch already has a Branch Manager.",
        });
        return;
      }
    }
    try {
      const accessToken =
        localStorage.getItem("access_token") ||
        sessionStorage.getItem("access_token");
      const payload = {
        email: form.email,
        first_name: form.firstName,
        last_name: form.lastName,
        phone: form.phone,
        role: form.role,
        branch: form.branch,
      };
      if (isEdit) payload.status = form.status;
      else payload.password = form.password;
      const res = isEdit
        ? await axios.patch(`${API_BASE}/staff/${initialStaff.id}/`, payload, {
            headers: { Authorization: `Bearer ${accessToken}` },
          })
        : await axios.post(`${API_BASE}/staff/`, payload, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
      if (isEdit) onUpdated(res.data);
      else onCreated(res.data);
      onClose();
      await Swal.fire({
        icon: "success",
        title: isEdit ? "Staff updated" : "Staff created",
        timer: 1800,
        showConfirmButton: false,
        timerProgressBar: true,
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

  const inputCls =
    "w-full bg-gray-800 border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all text-sm";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-end sm:items-center z-50 p-0 sm:p-4">
      <div className="bg-gray-900 border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 sticky top-0 bg-gray-900 z-10">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              {isEdit ? "Edit Staff Account" : "Create Staff Account"}
            </h2>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
              {isEdit
                ? "Update team member information"
                : "Add a new team member"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-all"
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

        <form onSubmit={submit} className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                label: "First Name",
                name: "firstName",
                placeholder: "Enter first name",
              },
              {
                label: "Last Name",
                name: "lastName",
                placeholder: "Enter last name",
              },
            ].map(({ label, name, placeholder }) => (
              <div key={name}>
                <label className="block text-sm font-semibold text-gray-400 mb-2">
                  {label}
                </label>
                <input
                  name={name}
                  placeholder={placeholder}
                  value={form[name]}
                  onChange={handleChange}
                  required
                  className={inputCls}
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              Email
            </label>
            <input
              name="email"
              type="email"
              placeholder="Enter email address"
              value={form.email}
              onChange={handleChange}
              required
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              Phone
            </label>
            <input
              name="phone"
              placeholder="Enter phone number"
              value={form.phone}
              onChange={handleChange}
              required
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">
                Role
              </label>
              <select
                name="role"
                value={form.role}
                onChange={(e) => {
                  const nextRole = e.target.value;
                  if (nextRole === "Branch Manager") {
                    const selectedBranch = branches.find(
                      (b) => String(b.id) === String(form.branch),
                    );
                    if (
                      selectedBranch &&
                      managerBranchNames.has(selectedBranch.name)
                    ) {
                      setForm((prev) => ({
                        ...prev,
                        role: nextRole,
                        branch: "",
                      }));
                      return;
                    }
                  }
                  setForm((prev) => ({ ...prev, role: nextRole }));
                }}
                className={inputCls}
              >
                {roles.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">
                Branch
              </label>
              <select
                name="branch"
                value={form.branch}
                onChange={handleChange}
                required
                className={inputCls}
              >
                <option value="" disabled>
                  Select branch
                </option>
                {availableBranches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isEdit && (
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">
                Status
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className={inputCls}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          )}

          {!isEdit && (
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  label: "Password",
                  name: "password",
                  placeholder: "Enter password",
                },
                {
                  label: "Confirm Password",
                  name: "confirmPassword",
                  placeholder: "Confirm password",
                },
              ].map(({ label, name, placeholder }) => (
                <div key={name}>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">
                    {label}
                  </label>
                  <input
                    type="password"
                    name={name}
                    placeholder={placeholder}
                    value={form[name]}
                    onChange={handleChange}
                    required
                    className={inputCls}
                  />
                </div>
              ))}
            </div>
          )}

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

export default AdminStaffAccounts;
