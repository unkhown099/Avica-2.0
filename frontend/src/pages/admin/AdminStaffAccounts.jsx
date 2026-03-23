import React, { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import axios from "axios";
import Swal from "sweetalert2";
import Pagination from "../../components/Pagination";
import usePagination from "../../hooks/usePagination";

function AdminStaffAccounts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editStaff, setEditStaff] = useState(null);
  const [staffAccounts, setStaffAccounts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  const roles = [
    "Admin",
    "Business Owner",
    "Branch Manager",
    "Staff",
    "Employee",
    "Inventory",
  ];

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
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/staff/`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/branches/`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ]);
        setStaffAccounts(staffRes.data);
        setBranches(branchRes.data);
      } catch (err) {
        console.error("Failed to load staff:", err);
        if (err.response?.status === 401) {
          Swal.fire({
            icon: "error",
            title: "Unauthorized",
            text: "Your session has expired. Please login again.",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, []);

  const getRoleBadge = (role) => {
    const styles = {
      Admin: "bg-red-500/20 text-red-400 border-red-500/30",
      "Business Owner": "bg-purple-500/20 text-purple-400 border-purple-500/30",
      "Branch Manager": "bg-blue-500/20 text-blue-400 border-blue-500/30",
      Staff: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      Employee: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      Inventory: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    };
    return (
      <span
        className={`inline-flex items-center whitespace-nowrap px-3 py-1 rounded-full text-xs font-semibold border ${styles[role] || "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}
      >
        {role}
      </span>
    );
  };

  const getStatusBadge = (status) => (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold border ${
        status === "Active"
          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
          : "bg-gray-500/20 text-gray-400 border-gray-500/30"
      }`}
    >
      {status}
    </span>
  );

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

  const roleColors = {
    Admin: "#ef4444",
    "Business Owner": "#a855f7",
    "Branch Manager": "#3b82f6",
    Staff: "#10b981",
    Employee: "#f59e0b",
    Inventory: "#f97316"
  };

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
      inputAttributes: {
        autocapitalize: "off",
        autocorrect: "off",
      },
      showCancelButton: true,
      confirmButtonText: "Verify",
      confirmButtonColor: "#dc2626",
      background: "#111827",
      color: "#f9fafb",
    });

    if (!password) return false;

    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/staff/verify-password/`,
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
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-lg">Loading staff accounts...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="" subtitle="">
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Staff Accounts
            </h1>
            <p className="text-gray-400 mt-1">
              Manage your team members and their access levels
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-red-600/30 hover:shadow-red-600/50 hover:scale-105 self-start md:self-auto"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Staff
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {roles.map((role) => (
            <div
              key={role}
              className="bg-gray-900/60 border border-white/5 rounded-2xl p-4 backdrop-blur-sm hover:border-white/10 transition-all"
            >
              <div className="text-2xl font-black text-white mb-1">
                {roleCounts[role] || 0}
              </div>
              <div className="text-xs text-gray-400 font-medium">{role}</div>
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
              className="w-full bg-gray-900/60 border border-white/10 text-white placeholder-gray-500 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-gray-900/60 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all cursor-pointer min-w-[160px]"
          >
            <option value="All Roles">All Roles</option>
            {roles.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div className="col-span-2">Name</div>
            <div className="col-span-2">Email</div>
            <div className="col-span-2">Phone</div>
            <div className="col-span-2">Branch</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {/* Table Body */}
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
            paginatedItems.map((staff, index) => (
              <div
                key={staff.id}
                className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/3 transition-colors items-center"
              >
              
                <div className="col-span-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{
                        backgroundColor: roleColors[staff.role] + "33",
                        color: roleColors[staff.role],
                      }}
                    >
                      {staff.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">
                        {staff.name}
                      </div>
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
                      className="px-3 py-1.5 text-xs font-semibold text-blue-300 border border-blue-500/30 rounded-lg hover:bg-blue-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Edit
                    </button>
                 </div>
              </div>
            ))
          )}

          {/* Footer */}
          {filteredStaff.length > 0 && (
            <div className="px-6 py-4 flex items-center justify-between">
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
      </div>

      {showCreateModal && (
        <CreateStaffModal
          mode={editStaff ? "edit" : "create"}
          initialStaff={editStaff}
          roles={roles.filter((role) => role !== "Admin")}
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
              prev.map((staff) => (staff.id === updatedStaff.id ? updatedStaff : staff)),
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
    initialStaff?.first_name || initialName.split(" ").slice(0, -1).join(" ") || initialName;
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
        (staff) =>
          staff.role === "Branch Manager" &&
          (!isEdit || staff.id !== initialStaff?.id),
      )
      .map((staff) => staff.branch?.trim())
      .filter(Boolean),
  );

  const availableBranches =
    form.role === "Branch Manager"
      ? branches.filter((branch) => !managerBranchNames.has(branch.name))
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
        (branch) => String(branch.id) === String(form.branch),
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
      if (isEdit) {
        payload.status = form.status;
      } else {
        payload.password = form.password;
      }

      const res = isEdit
        ? await axios.patch(
            `${import.meta.env.VITE_API_BASE_URL}/staff/${initialStaff.id}/`,
            payload,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            },
          )
        : await axios.post(`${import.meta.env.VITE_API_BASE_URL}/staff/`, payload, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

      if (isEdit) {
        onUpdated(res.data);
      } else {
        onCreated(res.data);
      }
      onClose();

      await Swal.fire({
        icon: "success",
        title: isEdit ? "Staff updated" : "Staff created",
        text: isEdit
          ? "The staff account was updated successfully"
          : "The staff account was created successfully",
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

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-black text-white">
              {isEdit ? "Edit Staff Account" : "Create Staff Account"}
            </h2>
            <p className="text-gray-500 text-sm mt-0.5">
              {isEdit
                ? "Update team member information"
                : "Fill in the details to add a new team member"}
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

        <form onSubmit={submit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="w-full bg-gray-800 border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all"
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
              className="w-full bg-gray-800 border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all"
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
              className="w-full bg-gray-800 border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      (branch) => String(branch.id) === String(form.branch),
                    );
                    if (
                      selectedBranch &&
                      managerBranchNames.has(selectedBranch.name)
                    ) {
                      setForm((prev) => ({ ...prev, role: nextRole, branch: "" }));
                      return;
                    }
                  }
                  setForm((prev) => ({ ...prev, role: nextRole }));
                }}
                className="w-full bg-gray-800 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all cursor-pointer"
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
                className="w-full bg-gray-800 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all cursor-pointer"
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
                className="w-full bg-gray-800 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all cursor-pointer"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          )}

          {!isEdit && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="w-full bg-gray-800 border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all"
                />
              </div>
            ))}
          </div>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 px-6 py-3 rounded-xl transition-all font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl transition-all font-semibold shadow-lg shadow-red-600/30"
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
