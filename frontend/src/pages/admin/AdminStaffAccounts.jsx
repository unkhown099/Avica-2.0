
import React, { useState, useEffect, useRef } from "react";
import AdminLayout from "./AdminLayout";
import axios from "axios";
import { API_BASE } from "../../hooks/useAuth.js";
import Swal from "sweetalert2";
import Pagination from "../../components/Pagination";
import usePagination from "../../hooks/usePagination";

const roles = [
  "Admin",
  "Branch Manager",
  "Cashier",
  "Employee",
  "Inventory",
  "Inventory Manager",
];

const kpiRoles = [
  "Branch Manager",
  "Cashier",
  "Employee",
  "Inventory",
  "Inventory Manager",
];

const createRoles = roles.filter(
  (role) => role !== "Admin" && role !== "Business Owner",
);

const editRoles = roles.filter((role) => role !== "Admin");

const roleColors = {
  Admin: "#ef4444",
  "Business Owner": "#a855f7",
  "Branch Manager": "#3b82f6",
  Staff: "#10b981",
  Cashier: "#10b981",
  Employee: "#f59e0b",
  Inventory: "#f97316",
  "Inventory Manager": "#fb923c",
};

const ROLE_BADGE_STYLE = {
  Admin: "bg-red-500/20 text-red-400 border-red-500/30",
  "Business Owner": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Branch Manager": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Staff: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Cashier: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Employee: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Inventory: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "Inventory Manager": "bg-orange-600/20 text-orange-300 border-orange-600/30",
};

const getRoleBadge = (role) => (
  <span
    className={`inline-flex items-center whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-semibold border ${
      ROLE_BADGE_STYLE[role] ||
      (role === "Staff" ? ROLE_BADGE_STYLE.Cashier : "bg-gray-500/20 text-gray-400 border-gray-500/30")
    }`}
  >
    {role === "Staff" ? "Cashier" : role}
  </span>
);

const getStatusBadge = (status) => (
  <span
    className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
      status === "Active"
        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
        : "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }`}
  >
    {status}
  </span>
);

function EditIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  );
}

function StaffCard({ staff, onEdit }) {
  return (
    <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
            style={{
              backgroundColor: (roleColors[staff.role] || "#6b7280") + "33",
              color: roleColors[staff.role] || "#6b7280",
            }}
          >
            {staff.name?.charAt(0)?.toUpperCase() || "?"}
          </div>

          <div className="min-w-0">
            <div className="text-white font-semibold text-sm truncate">
              {staff.name}
            </div>
            <div className="text-gray-500 text-xs truncate">
              {staff.email}
            </div>
          </div>
        </div>

        {getRoleBadge(staff.role)}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 gap-2">
        <span className="truncate">{staff.branch || "—"}</span>

        <div className="flex items-center gap-2 shrink-0">
          {getStatusBadge(staff.status)}

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit(staff);
            }}
            disabled={staff.role === "Admin"}
            aria-label={`Edit ${staff.name}'s account`}
            title="Edit staff account"
            className="btn-edit-action p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <EditIcon />
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
    let cancelled = false;

    const fetchStaff = async () => {
      const accessToken =
        localStorage.getItem("access_token") ||
        sessionStorage.getItem("access_token");

      if (!accessToken) {
        if (!cancelled) {
          Swal.fire({
            icon: "error",
            title: "Unauthorized",
            text: "Please login first",
          });
          setLoading(false);
        }
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

        if (cancelled) return;

        const visibleStaff = (
          Array.isArray(staffRes.data) ? staffRes.data : []
        ).filter((item) => {
          const role = String(item?.role || "").trim().toLowerCase();
          return (
            role !== "business owner" &&
            role !== "super_admin" &&
            role !== "super admin"
          );
        });

        setStaffAccounts(visibleStaff);
        setBranches(Array.isArray(branchRes.data) ? branchRes.data : []);
      } catch (err) {
        if (cancelled) return;

        if (err.response?.status === 401) {
          Swal.fire({
            icon: "error",
            title: "Unauthorized",
            text: "Your session has expired. Please login again.",
          });
        } else {
          console.error("Failed to load staff accounts:", err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchStaff();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredStaff = staffAccounts.filter((staff) => {
    const q = searchQuery.toLowerCase().trim();

    const matchesSearch =
      String(staff.name || "").toLowerCase().includes(q) ||
      String(staff.email || "").toLowerCase().includes(q) ||
      String(staff.id || "").includes(q);

    const matchesRole =
      roleFilter === "All Roles" || staff.role === roleFilter;

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
    acc[role] = staffAccounts.filter((staff) => staff.role === role).length;
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
        name: "staffAccessVerification",
        id: "staff-access-verification",
        autocomplete: "current-password",
        autocapitalize: "off",
        autocorrect: "off",
        spellcheck: "false",
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
    if (!(await verifyAccessPassword())) return;

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

    if (!(await verifyAccessPassword())) return;

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
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Staff Accounts
          </h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">
            Manage your team members and access levels
          </p>

          <button
            type="button"
            onClick={openCreateModal}
            className="mt-4 ml-auto flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-red-600/30 text-sm"
          >
            <span aria-hidden="true">+</span>
            Add Staff
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6 sm:mb-8">
          {kpiRoles.map((role) => (
            <div
              key={role}
              className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-white/5 rounded-2xl p-3 sm:p-4 backdrop-blur-sm hover:border-gray-300 dark:hover:border-white/10 transition-all shadow-sm dark:shadow-none"
            >
              <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mb-1">
                {roleCounts[role] || 0}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-medium whitespace-nowrap">
                {role}
              </div>
              <div className="mt-2 h-1 rounded-full bg-gray-100 dark:bg-gray-800">
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

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="search"
            name="staffAccountSearch"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Search by name, email, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 w-full bg-gray-900/60 border border-white/10 text-white placeholder-gray-500 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 text-sm"
          />

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-gray-900/60 border border-white/10 text-white rounded-xl px-4 py-3 text-sm"
          >
            <option value="All Roles">All Roles</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        <div className="md:hidden space-y-3 mb-4">
          {filteredStaff.length === 0 ? (
            <p className="py-16 text-center text-gray-500">
              No staff accounts found
            </p>
          ) : (
            paginatedItems.map((staff, index) => (
              <div key={staff.id} className="relative">
                <div className="absolute left-3 top-2 text-[11px] text-gray-500 z-10">
                  #{startItem + index}
                </div>
                <StaffCard staff={staff} onEdit={openEditModal} />
              </div>
            ))
          )}
        </div>

        <div className="hidden md:block bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden">
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
            <div className="py-20 text-center text-gray-500">
              No staff accounts found. Try adjusting your search or filters.
            </div>
          ) : (
            paginatedItems.map((staff, index) => (
              <div
                key={staff.id}
                className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center"
              >
                <div className="col-span-1 text-xs text-gray-500">
                  #{startItem + index}
                </div>

                <div className="col-span-2 text-white font-semibold text-sm truncate">
                  {staff.name}
                </div>

                <div className="col-span-2 text-gray-400 text-sm truncate">
                  {staff.email}
                </div>

                <div className="col-span-2 text-gray-400 text-sm">
                  {staff.phone}
                </div>

                <div className="col-span-1 text-gray-400 text-sm truncate">
                  {staff.branch || "—"}
                </div>

                <div className="col-span-2">{getRoleBadge(staff.role)}</div>

                <div className="col-span-1">
                  {getStatusBadge(staff.status)}
                </div>

                <div className="col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openEditModal(staff);
                    }}
                    disabled={staff.role === "Admin"}
                    aria-label={`Edit ${staff.name}'s account`}
                    title="Edit staff account"
                    className="btn-edit-action p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <EditIcon />
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

        {filteredStaff.length > 0 && (
          <div className="md:hidden mt-2">
            <p className="text-gray-500 text-sm mb-3">
              Showing {startItem}-{endItem} of {filteredStaff.length}
            </p>
            <Pagination
              current={currentPage}
              total={totalPages}
              onChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      <CreateStaffModal
        isOpen={showCreateModal}
        mode={editStaff ? "edit" : "create"}
        initialStaff={editStaff}
        roles={editStaff ? editRoles : createRoles}
        branches={branches}
        staffAccounts={staffAccounts}
        onClose={() => {
          setShowCreateModal(false);
          setEditStaff(null);
        }}
        onCreated={(newStaff) => {
          setStaffAccounts((prev) => [...prev, newStaff]);
        }}
        onUpdated={(updatedStaff) => {
          setStaffAccounts((prev) =>
            prev.map((staff) =>
              staff.id === updatedStaff.id ? updatedStaff : staff,
            ),
          );
        }}
      />
    </AdminLayout>
  );
}

function CreateStaffModal({
  isOpen,
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

  const validateName = (value) =>
    /^[A-Za-z]+(?: [A-Za-z]+)*$/.test(String(value || "").trim());

  const validatePhone = (value) =>
    /^\+63\d{10}$/.test(String(value || "").trim());

  const sanitizeNameInput = (value) =>
    String(value || "")
      .replace(/[^A-Za-z\s]/g, "")
      .replace(/\s{2,}/g, " ");

  const sanitizePhoneInput = (value) => {
    let digits = String(value || "").replace(/\D/g, "");

    if (digits.startsWith("63")) {
      digits = digits.slice(2);
    }

    if (digits.startsWith("0")) {
      digits = digits.slice(1);
    }

    return digits.slice(0, 10);
  };

  const getInitialDraft = () => ({
    firstName: "",
    lastName: "",
    email: "",
    phone: "+63",
    role: roles[0] || "",
    branch: "",
    status: "Active",
    password: "",
    confirmPassword: "",
  });

  const buildEditForm = (staff) => {
    const initialName = String(staff?.name || "").trim();

    const parsedFirstName =
      staff?.first_name ||
      initialName.split(" ").slice(0, -1).join(" ") ||
      initialName;

    const parsedLastName =
      staff?.last_name ||
      initialName.split(" ").slice(-1).join(" ") ||
      "";

    const existingPhone = String(staff?.phone || "").trim();

    const normalizedPhone = `+63${sanitizePhoneInput(existingPhone)}`;

    const branchMatch = branches.find(
      (branch) =>
        String(branch.id) === String(staff?.branch_id) ||
        branch.name === staff?.branch,
    );

    return {
      firstName: parsedFirstName || "",
      lastName: parsedLastName || "",
      email: staff?.email || "",
      phone: normalizedPhone,
      role: staff?.role || roles[0] || "",
      branch: branchMatch ? String(branchMatch.id) : "",
      status: staff?.status || "Active",
      password: "",
      confirmPassword: "",
    };
  };

  const createDraftRef = useRef(getInitialDraft());
  const contextRef = useRef("create");

  const [form, setForm] = useState(() =>
    isEdit ? buildEditForm(initialStaff) : getInitialDraft(),
  );

  useEffect(() => {
    if (!isEdit) {
      createDraftRef.current = form;
    }
  }, [form, isEdit]);

  useEffect(() => {
    const nextContext = isEdit
      ? `edit:${initialStaff?.id ?? "new"}`
      : "create";

    if (contextRef.current === nextContext) return;

    if (nextContext === "create") {
      setForm(createDraftRef.current);
    } else {
      setForm(buildEditForm(initialStaff));
    }

    contextRef.current = nextContext;
  }, [isEdit, initialStaff, roles, branches]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let nextValue = value;

    if (name === "firstName" || name === "lastName") {
      nextValue = sanitizeNameInput(value);
    }

    if (name === "phone") {
      nextValue = `+63${sanitizePhoneInput(value)}`;
    }

    setForm((prev) => ({ ...prev, [name]: nextValue }));
  };

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

    if (!validateName(form.firstName)) {
      await Swal.fire({
        icon: "error",
        title: "Invalid first name",
        text: "First name must contain letters and spaces only.",
      });
      return;
    }

    if (!validateName(form.lastName)) {
      await Swal.fire({
        icon: "error",
        title: "Invalid last name",
        text: "Last name must contain letters and spaces only.",
      });
      return;
    }

    if (!validatePhone(form.phone)) {
      await Swal.fire({
        icon: "error",
        title: "Invalid phone number",
        text: "Phone must be a valid PH number: +63 followed by 10 digits.",
      });
      return;
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
            `${API_BASE}/staff/${initialStaff.id}/`,
            payload,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            },
          )
        : await axios.post(`${API_BASE}/staff/`, payload, {
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
        timer: 1800,
        showConfirmButton: false,
        timerProgressBar: true,
      });
    } catch (err) {
      console.error("Staff save failed:", err.response?.data || err);

      const responseData = err.response?.data || {};

      const msg =
        responseData.email?.[0] ||
        responseData.first_name?.[0] ||
        responseData.last_name?.[0] ||
        responseData.phone?.[0] ||
        responseData.role?.[0] ||
        responseData.branch?.[0] ||
        responseData.detail ||
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

  if (!isOpen) return null;

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
            aria-label="Close modal"
            className="text-gray-500 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-all"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={submit}
          autoComplete="off"
          className="p-4 sm:p-6 space-y-4"
        >
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
                <label
                  htmlFor={`staff-${name}`}
                  className="block text-sm font-semibold text-gray-400 mb-2"
                >
                  {label}
                </label>
                <input
                  id={`staff-${name}`}
                  name={name}
                  autoComplete="off"
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
            <label
              htmlFor="staff-email"
              className="block text-sm font-semibold text-gray-400 mb-2"
            >
              Email
            </label>
            <input
              id="staff-email"
              name="staffEmail"
              type="email"
              autoComplete="off"
              placeholder="Enter email address"
              value={form.email}
              onChange={handleChange}
              required
              className={inputCls}
            />
          </div>

          <div>
            <label
              htmlFor="staff-phone"
              className="block text-sm font-semibold text-gray-400 mb-2"
            >
              Phone
            </label>

            <div className="flex items-center rounded-xl border border-white/10 bg-gray-800 focus-within:border-red-500/50 focus-within:ring-1 focus-within:ring-red-500/30 transition-all">
              <span className="px-4 text-gray-300 border-r border-white/10">
                +63
              </span>

              <input
                id="staff-phone"
                name="phone"
                type="tel"
                autoComplete="off"
                placeholder="9XXXXXXXXX"
                value={form.phone.replace(/^\+63/, "")}
                onChange={handleChange}
                required
                inputMode="numeric"
                maxLength={10}
                className="w-full bg-transparent text-white placeholder-gray-600 rounded-r-xl px-4 py-3 focus:outline-none text-sm"
              />
            </div>

            <p className="text-gray-500 text-xs mt-1">
              Enter 10 digits beginning with 9.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="staff-role"
                className="block text-sm font-semibold text-gray-400 mb-2"
              >
                Role
              </label>

              <select
                id="staff-role"
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
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="staff-branch"
                className="block text-sm font-semibold text-gray-400 mb-2"
              >
                Branch
              </label>

              <select
                id="staff-branch"
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
              <label
                htmlFor="staff-status"
                className="block text-sm font-semibold text-gray-400 mb-2"
              >
                Status
              </label>

              <select
                id="staff-status"
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
                  <label
                    htmlFor={`staff-${name}`}
                    className="block text-sm font-semibold text-gray-400 mb-2"
                  >
                    {label}
                  </label>
                  <input
                    id={`staff-${name}`}
                    type="password"
                    name={name}
                    autoComplete="new-password"
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
