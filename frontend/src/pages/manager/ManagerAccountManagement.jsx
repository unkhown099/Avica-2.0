import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { API_BASE } from "../../hooks/useAuth.js";
import ManagerLayout from "./ManagerLayout";
import Pagination from "../../components/Pagination";
import usePagination from "../../hooks/usePagination";

const roles = [
  "Branch Manager",
  "Employee",
  "Service Advisor",
  "Receptionist",
  "Parts Manager",
];
const createRoles = roles.filter((r) => r !== "Branch Manager");

const roleBadge = {
  "Branch Manager": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Employee: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Service Advisor": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Receptionist: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Parts Manager": "bg-red-500/20 text-red-400 border-red-500/30",
};

const roleColors = {
  "Branch Manager": "#a855f7",
  Employee: "#3b82f6",
  "Service Advisor": "#10b981",
  Receptionist: "#f59e0b",
  "Parts Manager": "#ef4444",
};

const tokenHeaders = () => {
  const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

function CreateManagerStaffModal({
  mode,
  initialStaff,
  managerBranchId,
  managerBranchName,
  onClose,
  onCreated,
  onUpdated,
  roleOptions,
}) {
  const isEdit = mode === "edit";
  const [form, setForm] = useState({
    firstName: initialStaff?.first_name || (initialStaff?.name || "").split(" ").slice(0, -1).join(" "),
    lastName: initialStaff?.last_name || (initialStaff?.name || "").split(" ").slice(-1).join(" "),
    email: initialStaff?.email || "",
    phone: initialStaff?.phone || "",
    role: roleOptions[0] || "Employee",
    status: initialStaff?.status || "Active",
    password: "",
    confirmPassword: "",
  });

  const inputCls =
    "w-full bg-gray-800 border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all text-sm";

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!managerBranchId) {
      await Swal.fire({ icon: "error", title: "Missing branch", text: "Manager branch is not assigned." });
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
        ? await axios.patch(`${API_BASE}/staff/${initialStaff.id}/`, payload, { headers: tokenHeaders() })
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
      await Swal.fire({ icon: "error", title: isEdit ? "Update failed" : "Creation failed", text: msg });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-end sm:items-center z-50 p-0 sm:p-4">
      <div className="bg-gray-900 border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 sticky top-0 bg-gray-900 z-10">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white">{isEdit ? "Edit Staff Account" : "Create Staff Account"}</h2>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">Branch: {managerBranchName || "Your Branch"}</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-all">✕</button>
        </div>

        <form onSubmit={submit} className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input name="firstName" placeholder="First Name" value={form.firstName} onChange={handleChange} required className={inputCls} />
            <input name="lastName" placeholder="Last Name" value={form.lastName} onChange={handleChange} required className={inputCls} />
          </div>
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required className={inputCls} />
          <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} required className={inputCls} />
          <div className="grid grid-cols-2 gap-4">
            <select name="role" value={form.role} onChange={handleChange} className={inputCls}>
              {roleOptions.map((r) => (<option key={r}>{r}</option>))}
            </select>
            <input value={managerBranchName || "Assigned Branch"} disabled className={`${inputCls} opacity-70 cursor-not-allowed`} />
          </div>
          {isEdit && (
            <select name="status" value={form.status} onChange={handleChange} className={inputCls}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          )}
          <div className="grid grid-cols-2 gap-4">
            <input name="password" type="password" placeholder={isEdit ? "New Password (optional)" : "Password"} value={form.password} onChange={handleChange} required={!isEdit} className={inputCls} />
            <input name="confirmPassword" type="password" placeholder={isEdit ? "Confirm New Password" : "Confirm Password"} value={form.confirmPassword} onChange={handleChange} required={!isEdit} className={inputCls} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-white/10 text-gray-400 hover:text-white px-4 py-3 rounded-xl transition-all font-semibold text-sm">Cancel</button>
            <button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl transition-all font-semibold text-sm shadow-lg shadow-red-600/30">{isEdit ? "Save Changes" : "Create Staff Account"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ManagerAccountManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [staffAccounts, setStaffAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [managerBranchId, setManagerBranchId] = useState("");
  const [managerBranchName, setManagerBranchName] = useState("");

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const headers = tokenHeaders();
        const [staffRes, branchesRes, meRes] = await Promise.all([
          axios.get(`${API_BASE}/staff/`, { headers }),
          axios.get(`${API_BASE}/branches/`, { headers }),
          axios.get(`${API_BASE}/me/`, { headers }),
        ]);
        const me = meRes?.data || {};
        const branchId = String(me?.staff_profile?.branch_id || "");
        setManagerBranchId(branchId);
        const branches = Array.isArray(branchesRes.data) ? branchesRes.data : [];
        const matchedBranch = branches.find((b) => String(b.id) === branchId);
        setManagerBranchName(matchedBranch?.name || "");
        setStaffAccounts(Array.isArray(staffRes.data) ? staffRes.data : []);
      } catch (error) {
        console.error("Failed to load staff accounts:", error);
        setStaffAccounts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, []);

  const roleCounts = roles.reduce((acc, r) => {
    acc[r] = staffAccounts.filter((s) => s.role === r).length;
    return acc;
  }, {});

  const filteredStaff = staffAccounts.filter(
    (s) =>
      (s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (roleFilter === "All Roles" || s.role === roleFilter) &&
      (statusFilter === "All Status" || s.status === statusFilter),
  );

  const visibleRoles = useMemo(() => {
    const set = new Set(filteredStaff.map((s) => s.role));
    return roles.filter((r) => set.has(r));
  }, [filteredStaff]);

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
    resetDeps: [searchQuery, roleFilter, statusFilter, staffAccounts.length],
  });

  if (loading) {
    return (
      <ManagerLayout title="" subtitle="">
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </ManagerLayout>
    );
  }

  return (
    <ManagerLayout title="" subtitle="">
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-4 sm:-m-8 p-4 sm:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Account Management</h1>
          <p className="text-gray-400 mt-1 text-sm">Manage staff accounts for {managerBranchName || "your branch"}</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-red-600/30 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Staff
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {visibleRoles.map((role) => (
            <div key={role} className="bg-gray-900/60 border border-white/5 rounded-2xl p-3 sm:p-4 backdrop-blur-sm hover:border-white/10 transition-all">
              <div className="text-xl sm:text-2xl font-black text-white mb-1">{roleCounts[role] || 0}</div>
              <div className="text-xs text-gray-400 font-medium leading-snug">{role}</div>
              <div className="mt-2 h-1 rounded-full bg-gray-800">
                <div
                  className="h-1 rounded-full"
                  style={{
                    width: staffAccounts.length ? `${((roleCounts[role] || 0) / staffAccounts.length) * 100}%` : "0%",
                    backgroundColor: roleColors[role],
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900/60 border border-white/10 text-white placeholder-gray-500 rounded-xl pl-4 pr-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all"
            />
          </div>
          {[{ value: roleFilter, onChange: setRoleFilter, options: ["All Roles", ...roles] }, { value: statusFilter, onChange: setStatusFilter, options: ["All Status", "Active", "Inactive"] }].map((sel, i) => (
            <select
              key={i}
              value={sel.value}
              onChange={(e) => sel.onChange(e.target.value)}
              className="bg-gray-900/60 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 cursor-pointer min-w-[150px]"
            >
              {sel.options.map((o) => (<option key={o}>{o}</option>))}
            </select>
          ))}
        </div>

        <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div className="col-span-1">#</div>
            <div className="col-span-2">Name</div>
            <div className="col-span-3">Phone</div>
            <div className="col-span-3">Role</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {filteredStaff.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-gray-500 text-lg">No staff found</p>
            </div>
          ) : (
            paginatedItems.map((staff, index) => (
              <div key={staff.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-4 items-center">
                  <div className="col-span-1 text-xs text-gray-500">#{startItem + index}</div>
                  <div className="col-span-2 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0" style={{ backgroundColor: (roleColors[staff.role] || "#6b7280") + "22", color: roleColors[staff.role] || "#6b7280" }}>
                      {(staff.name || "?").charAt(0)}
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">{staff.name}</div>
                      <div className="text-gray-500 text-xs truncate max-w-[150px]">{staff.email}</div>
                    </div>
                  </div>
                  <div className="col-span-3 text-gray-400 text-sm">{staff.phone}</div>
                  <div className="col-span-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${roleBadge[staff.role] || "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}>{staff.role}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-emerald-500/20 text-emerald-400 border-emerald-500/30">{staff.status}</span>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      onClick={() => {
                        setEditingStaff(staff);
                        setShowCreateModal(true);
                      }}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="sm:hidden px-4 py-3">
                  <div className="text-xs text-gray-500 mb-1">#{startItem + index}</div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: (roleColors[staff.role] || "#6b7280") + "22", color: roleColors[staff.role] || "#6b7280" }}>
                        {(staff.name || "?").charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-white font-semibold text-sm truncate">{staff.name}</div>
                        <div className="text-gray-500 text-xs truncate">{staff.email}</div>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${roleBadge[staff.role] || "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}>{staff.role}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 pl-10">
                    <span>{staff.phone}</span>
                    <span className="px-2 py-0.5 rounded-full border bg-emerald-500/20 text-emerald-400 border-emerald-500/30">{staff.status}</span>
                  </div>
                </div>
              </div>
            ))
          )}

          {filteredStaff.length > 0 && (
            <div className="px-4 sm:px-6 py-4">
              <p className="text-gray-500 text-sm">
                Showing <span className="text-white font-semibold">{startItem}-{endItem}</span> of <span className="text-white font-semibold">{filteredStaff.length}</span> staff accounts
              </p>
            </div>
          )}
          <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} className="px-4 sm:px-6 pb-6" />
        </div>
      </div>

      {showCreateModal && (
        <CreateManagerStaffModal
          mode={editingStaff ? "edit" : "create"}
          initialStaff={editingStaff}
          managerBranchId={managerBranchId}
          managerBranchName={managerBranchName}
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
          roleOptions={createRoles}
        />
      )}
    </ManagerLayout>
  );
}

export default ManagerAccountManagement;
