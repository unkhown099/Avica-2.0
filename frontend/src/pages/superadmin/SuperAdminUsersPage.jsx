import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../../hooks/api";
import SuperAdminLayout from "./SuperAdminLayout.jsx";

// ── Validation Functions ──────────────────────────────────────────────────────
const isValidName = (value) =>
  /^[A-Za-z]+(?: [A-Za-z]+)*$/.test(String(value || "").trim());
const isValidPhone = (value) =>
  /^\+63\d+$/.test(String(value || "").trim()) &&
  String(value || "").trim().length <= 12;
const sanitizeNameInput = (value) =>
  String(value || "")
    .replace(/[^A-Za-z\s]/g, "")
    .replace(/\s{2,}/g, " ");
const sanitizePhoneInput = (value) => {
  const raw = String(value || "");
  let digits = raw.replace(/[^\d]/g, "");
  if (digits.startsWith("63")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, 10);
};

// ── Toast Component ──────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor =
    type === "success"
      ? "bg-green-500/20 border-green-500/50"
      : "bg-red-500/20 border-red-500/50";
  const textColor = type === "success" ? "text-green-400" : "text-red-400";
  const icon = type === "success" ? "✓" : "✕";

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div
        className={`${bgColor} border rounded-xl px-4 py-3 shadow-xl backdrop-blur-sm min-w-[280px]`}
      >
        <div className="flex items-center gap-3">
          <div className={`${textColor} font-bold text-lg`}>{icon}</div>
          <p className={`${textColor} text-sm flex-1`}>{message}</p>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Small components ──────────────────────────────────────────────────────────
function StatCard({ title, value, icon, accentBg, accentText, border, sub }) {
  return (
    <div
      className={`bg-gray-900/60 border ${border} rounded-2xl p-4 sm:p-5 backdrop-blur-sm hover:border-opacity-60 transition-all`}
    >
      <div className="mb-3 sm:mb-4">
        <div
          className={`${accentBg} ${accentText} p-2 sm:p-3 rounded-xl w-fit`}
        >
          {icon}
        </div>
      </div>
      <div className="text-xl sm:text-2xl font-black text-white mb-1 truncate">
        {value ?? "—"}
      </div>
      <div className="text-xs sm:text-sm text-gray-500 mb-1 truncate">
        {title}
      </div>
      {sub && (
        <div className={`text-xs font-semibold ${accentText} truncate`}>
          {sub}
        </div>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-4 sm:p-5 animate-pulse">
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-800 mb-3 sm:mb-4" />
      <div className="h-6 sm:h-7 w-20 sm:w-24 bg-gray-800 rounded mb-2" />
      <div className="h-3 sm:h-4 w-24 sm:w-32 bg-gray-800 rounded" />
    </div>
  );
}

const Icon = ({ d }) => (
  <svg
    className="w-5 h-5 sm:w-6 sm:h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
  </svg>
);

// ── User Table Component (Mobile Responsive) ──────────────────────────────────
function UsersTable({ users, loading, onArchive, onDelete, onRestore }) {
  if (loading) {
    return (
      <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 border-b border-white/5 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-800" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-gray-800 rounded mb-2" />
                <div className="h-3 w-48 bg-gray-800 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!users?.length) {
    return (
      <div className="bg-gray-900/60 border border-white/5 rounded-2xl px-6 py-12 text-center text-gray-500 text-sm">
        No users found.
      </div>
    );
  }

  const roleColors = {
    super_admin: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    Admin: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "Branch Manager": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    Employee: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    "Inventory Manager":
      "bg-orange-500/10 text-orange-400 border-orange-500/20",
    "Business Owner": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    Staff: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  };

  const customerBadge = "bg-green-500/10 text-green-400 border-green-500/20";

  const getRoleBadgeClass = (user) => {
    if (user.account_type === "customer") return customerBadge;
    return (
      roleColors[user.profile?.role] ||
      "bg-gray-500/10 text-gray-400 border-gray-500/20"
    );
  };

  const getRoleLabel = (user) => {
    if (user.account_type === "customer") return "Customer";
    return user.profile?.role || user.account_type || "—";
  };

  const getInitial = (user) =>
    user.profile?.name?.charAt(0)?.toUpperCase() ||
    user.email.charAt(0).toUpperCase();

  const getStatusBadge = (user) => {
    if (user.is_archived)
      return {
        label: "Archived",
        cls: "bg-gray-500/10 text-gray-400 border border-gray-500/20",
      };
    if (user.is_active)
      return {
        label: "Active",
        cls: "bg-green-500/10 text-green-400 border border-green-500/20",
      };
    return {
      label: "Inactive",
      cls: "bg-red-500/10 text-red-400 border border-red-500/20",
    };
  };

  return (
    <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
      {/* ── Desktop Table ── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800/50 border-b border-white/5">
            <tr>
              {[
                "User",
                "Role",
                "Branch",
                "Status",
                "Last Login",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((user) => {
              const status = getStatusBadge(user);
              return (
                <tr
                  key={user.id}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  {/* User */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 text-sm font-bold text-white">
                        {getInitial(user)}
                      </div>
                      <div>
                        <div className="text-white font-semibold text-sm leading-tight">
                          {user.profile?.name || "—"}
                        </div>
                        <div className="text-gray-500 text-xs mt-0.5">
                          {user.email}
                        </div>
                        {user.profile?.phone && (
                          <div className="text-gray-600 text-xs mt-0.5">
                            {user.profile.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeClass(user)}`}
                    >
                      {getRoleLabel(user)}
                    </span>
                  </td>

                  {/* Branch */}
                  <td className="px-6 py-4">
                    {user.profile?.branch ? (
                      <span className="text-gray-400 text-sm">
                        {user.profile.branch}
                      </span>
                    ) : (
                      <span className="text-gray-600 text-sm">—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold w-fit ${status.cls}`}
                      >
                        {status.label}
                      </span>
                      {!user.email_verified &&
                        user.account_type === "customer" && (
                          <span className="text-yellow-500 text-xs">
                            Unverified email
                          </span>
                        )}
                    </div>
                  </td>

                  {/* Last Login */}
                  <td className="px-6 py-4 text-gray-400 text-sm whitespace-nowrap">
                    {user.last_login
                      ? new Date(user.last_login).toLocaleDateString()
                      : "Never"}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      {!user.is_archived ? (
                        <button
                          onClick={() => onArchive(user)}
                          title="Archive"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-yellow-400 hover:bg-yellow-400/10 transition-all"
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
                              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                            />
                          </svg>
                        </button>
                      ) : (
                        <button
                          onClick={() => onRestore(user)}
                          title="Restore"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-green-400 hover:bg-green-400/10 transition-all"
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
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(user)}
                        title="Permanently delete"
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Mobile Cards ── */}
      <div className="md:hidden divide-y divide-white/5">
        {users.map((user) => {
          const status = getStatusBadge(user);
          return (
            <div
              key={user.id}
              className="p-4 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 text-base font-bold text-white">
                    {getInitial(user)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold text-sm truncate">
                      {user.profile?.name || "—"}
                    </div>
                    <div className="text-gray-500 text-xs truncate">
                      {user.email}
                    </div>
                    {user.profile?.phone && (
                      <div className="text-gray-600 text-xs mt-0.5">
                        {user.profile.phone}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onDelete(user)}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-all ml-2"
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadgeClass(user)}`}
                >
                  {getRoleLabel(user)}
                </span>
                <span
                  className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${status.cls}`}
                >
                  {status.label}
                </span>
                {user.profile?.branch && (
                  <span className="text-gray-400 text-xs bg-gray-800 px-2.5 py-0.5 rounded-full">
                    {user.profile.branch}
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/5">
                <span className="text-gray-600 text-xs">
                  Last login:{" "}
                  {user.last_login
                    ? new Date(user.last_login).toLocaleDateString()
                    : "Never"}
                </span>
                {!user.is_archived ? (
                  <button
                    onClick={() => onArchive(user)}
                    className="text-xs font-semibold text-yellow-400 hover:text-yellow-300"
                  >
                    Archive
                  </button>
                ) : (
                  <button
                    onClick={() => onRestore(user)}
                    className="text-xs font-semibold text-green-400 hover:text-green-300"
                  >
                    Restore
                  </button>
                )}
              </div>
              {!user.email_verified && user.account_type === "customer" && (
                <div className="mt-1.5 text-yellow-500 text-xs">
                  ⚠ Unverified email
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Add User Form Component (Mobile Responsive) ───────────────────────────────
function AddUserForm({ onSubmit, onCancel, branches, roles, loading }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
    phone: "",
    account_type: "staff",
    role: "",
    branch_id: "",
    send_welcome_email: true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords don't match");
      return;
    }
    if (!isValidName(formData.first_name)) {
      alert("First name must contain letters and spaces only.");
      return;
    }
    if (!isValidName(formData.last_name)) {
      alert("Last name must contain letters and spaces only.");
      return;
    }
    if (formData.phone && !isValidPhone(formData.phone)) {
      alert(
        "Phone must start with +63, contain digits only, and be at most 12 characters.",
      );
      return;
    }
    onSubmit(formData);
  };

  const filteredRoles =
    formData.account_type === "staff"
      ? roles.filter((r) => r !== "customer")
      : roles.filter((r) => r === "customer");

  const roleLabels = {
    super_admin: "Super Admin",
    admin: "Admin",
    branch_manager: "Branch Manager",
    employee: "Employee",
    inventory_manager: "Inventory Manager",
    customer: "Customer",
  };

  return (
    <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-4 sm:p-6 backdrop-blur-sm">
      <h3 className="text-lg sm:text-xl font-bold text-white mb-4">
        Add New User
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">
              First Name *
            </label>
            <input
              type="text"
              required
              value={formData.first_name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  first_name: sanitizeNameInput(e.target.value),
                })
              }
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              required
              value={formData.last_name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  last_name: sanitizeNameInput(e.target.value),
                })
              }
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1">
            Email *
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1">
            Phone
          </label>
          <div className="flex items-center rounded-lg border border-gray-700 bg-gray-800 focus-within:border-red-500">
            <span className="px-3 text-gray-300 border-r border-gray-700">+63</span>
            <input
              type="tel"
              value={String(formData.phone || "").replace(/^\+63/, "")}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  phone: sanitizePhoneInput(e.target.value)
                    ? `+63${sanitizePhoneInput(e.target.value)}`
                    : "",
                })
              }
              inputMode="numeric"
              maxLength={10}
              placeholder="9XXXXXXXXX"
              className="w-full px-3 py-2 bg-transparent text-white text-sm placeholder-gray-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">
              Account Type *
            </label>
            <select
              required
              value={formData.account_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  account_type: e.target.value,
                  role: "",
                })
              }
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
            >
              <option value="staff">Staff</option>
              <option value="customer">Customer</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">
              Role *
            </label>
            <select
              required
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
            >
              <option value="">Select role</option>
              {filteredRoles.map((role) => (
                <option key={role} value={role}>
                  {roleLabels[role] || role}
                </option>
              ))}
            </select>
          </div>
        </div>

        {formData.account_type === "staff" && (
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">
              Branch *
            </label>
            <select
              required
              value={formData.branch_id}
              onChange={(e) =>
                setFormData({ ...formData, branch_id: e.target.value })
              }
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
            >
              <option value="">Select branch</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">
              Password *
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">
              Confirm Password *
            </label>
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="sendEmail"
            checked={formData.send_welcome_email}
            onChange={(e) =>
              setFormData({ ...formData, send_welcome_email: e.target.checked })
            }
            className="rounded bg-gray-800 border-gray-700 text-red-500 focus:ring-red-500"
          />
          <label
            htmlFor="sendEmail"
            className="text-xs sm:text-sm text-gray-400"
          >
            Send welcome email with login instructions
          </label>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 transition-colors text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create User"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Edit User Modal (Mobile Responsive) ───────────────────────────────────────
function EditUserModal({ user, onClose, onSave, branches, loading }) {
  const [formData, setFormData] = useState({
    is_active: false,
    staff_role: "",
    staff_branch: "",
    first_name: "",
    last_name: "",
    phone: "",
  });

  useEffect(() => {
    if (user) {
      const nameParts = user.profile?.name?.split(" ") || ["", ""];
      setFormData({
        is_active: user.is_active,
        staff_role: user.profile?.role || "",
        staff_branch: user.profile?.branch_id || "",
        first_name: nameParts[0] || "",
        last_name: nameParts.slice(1).join(" ") || "",
        phone: user.profile?.phone || "",
      });
    }
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValidName(formData.first_name)) {
      alert("First name must contain letters and spaces only.");
      return;
    }
    if (!isValidName(formData.last_name)) {
      alert("Last name must contain letters and spaces only.");
      return;
    }
    if (formData.phone && !isValidPhone(formData.phone)) {
      alert(
        "Phone must start with +63, contain digits only, and be at most 12 characters.",
      );
      return;
    }
    onSave(user.id, formData);
  };

  if (!user) return null;

  const roleLabels = {
    super_admin: "Super Admin",
    admin: "Admin",
    branch_manager: "Branch Manager",
    employee: "Employee",
    inventory_manager: "Inventory Manager",
  };

  const staffRoles = [
    "super_admin",
    "admin",
    "branch_manager",
    "employee",
    "inventory_manager",
  ];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 border-b border-white/10 px-4 sm:px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">Edit User</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1"
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">
              Email
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-500 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">
                First Name
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    first_name: sanitizeNameInput(e.target.value),
                  })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    last_name: sanitizeNameInput(e.target.value),
                  })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">
              Phone
            </label>
            <div className="flex items-center rounded-lg border border-gray-700 bg-gray-800 focus-within:border-red-500">
              <span className="px-3 text-gray-300 border-r border-gray-700">+63</span>
              <input
                type="tel"
                value={String(formData.phone || "").replace(/^\+63/, "")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    phone: sanitizePhoneInput(e.target.value)
                      ? `+63${sanitizePhoneInput(e.target.value)}`
                      : "",
                  })
                }
                inputMode="numeric"
                maxLength={10}
                placeholder="9XXXXXXXXX"
                className="w-full px-3 py-2 bg-transparent text-white text-sm placeholder-gray-500 focus:outline-none"
              />
            </div>
          </div>
          {user.account_type === "staff" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">
                  Role
                </label>
                <select
                  value={formData.staff_role}
                  onChange={(e) =>
                    setFormData({ ...formData, staff_role: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
                >
                  {staffRoles.map((role) => (
                    <option key={role} value={role}>
                      {roleLabels[role]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">
                  Branch
                </label>
                <select
                  value={formData.staff_branch}
                  onChange={(e) =>
                    setFormData({ ...formData, staff_branch: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
                >
                  <option value="">Select branch</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="rounded bg-gray-800 border-gray-700 text-red-500 focus:ring-red-500"
              />
              <span className="text-sm text-gray-400">Active Account</span>
            </label>
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SuperAdminUsers() {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [toast, setToast] = useState(null);

  const showToast = (message, type) => {
    setToast({ message, type });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [usersData, branchesData, rolesData] = await Promise.all([
        apiFetch("/super-admin/users/"),
        apiFetch("/branches/"),
        apiFetch("/super-admin/roles/"),
      ]);

      setUsers(usersData);
      setBranches(branchesData);
      setRoles(rolesData?.roles || []);
    } catch (err) {
      setError(err.message || "Failed to fetch data");
      showToast(err.message || "Failed to fetch data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleArchiveUser = async (user) => {
    if (
      !confirm(
        `Archive ${user.email}? Archived users will be restricted from logging in and can be restored later.`,
      )
    )
      return;

    try {
      await apiFetch(`/super-admin/users/${user.id}/archive/`, {
        method: "POST",
      });
      fetchData();
      showToast(`User ${user.email} has been archived.`, "success");
    } catch (err) {
      showToast(err.message || "Failed to archive user.", "error");
    }
  };

  const handleRestoreUser = async (user) => {
    if (
      !confirm(
        `Restore ${user.email}? This will allow the user to access the system again.`,
      )
    )
      return;

    try {
      await apiFetch(`/super-admin/users/${user.id}/restore/`, {
        method: "POST",
      });
      fetchData();
      showToast(`User ${user.email} has been restored.`, "success");
    } catch (err) {
      showToast(err.message || "Failed to restore user.", "error");
    }
  };

  const handleDeleteUser = async (user) => {
    if (
      !confirm(
        `⚠️ PERMANENT DELETION ⚠️\n\nAre you ABSOLUTELY SURE you want to permanently delete ${user.email}?\n\nThis action is IRREVERSIBLE and will:\n- Permanently remove all user data\n- Delete all associated records\n- Remove all activity history\n\nThis cannot be undone!`,
      )
    )
      return;

    try {
      await apiFetch(`/super-admin/users/${user.id}/permanent-delete/`, {
        method: "DELETE",
      });
      setUsers((prevUsers) => prevUsers.filter((u) => u.id !== user.id));
      showToast(`User ${user.email} has been PERMANENTLY DELETED.`, "success");
    } catch (err) {
      showToast(err.message || "Failed to delete user.", "error");
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchTerm === "" ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.profile?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole =
      selectedRole === "all" || user.profile?.role === selectedRole;
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "active" && user.is_active && !user.is_archived) ||
      (selectedStatus === "inactive" && !user.is_active && !user.is_archived) ||
      (selectedStatus === "archived" && user.is_archived);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    total: users.length,
    active: users.filter((u) => u.is_active && !u.is_archived).length,
    archived: users.filter((u) => u.is_archived).length,
    staff: users.filter((u) => u.account_type === "staff" && !u.is_archived)
      .length,
    customers: users.filter(
      (u) => u.account_type === "customer" && !u.is_archived,
    ).length,
  };

  const roleLabels = {
    super_admin: "Super Admin",
    admin: "Admin",
    branch_manager: "Branch Manager",
    employee: "Employee",
    inventory_manager: "Inventory Manager",
    customer: "Customer",
  };

  return (
    <SuperAdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-4 sm:-m-8 p-3 sm:p-8">
        {/* Toast Notifications */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">
              User Management
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
              Manage system users - Archive, Restore, or Permanently Delete
            </p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 border border-white/10 text-gray-300 hover:text-white hover:bg-gray-700 transition-all text-sm font-semibold w-fit"
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 sm:px-5 py-3 sm:py-4">
            <svg
              className="w-5 h-5 text-red-400 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
            <p className="text-red-400 text-sm flex-1">{error}</p>
            <button
              onClick={fetchData}
              className="text-red-400 hover:text-red-300 text-sm font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatCard
            title="Total Users"
            value={stats.total.toLocaleString()}
            accentBg="bg-purple-500/10"
            accentText="text-purple-400"
            border="border-purple-500/20"
            icon={
              <Icon d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            }
          />
          <StatCard
            title="Active Users"
            value={stats.active.toLocaleString()}
            accentBg="bg-green-500/10"
            accentText="text-green-400"
            border="border-green-500/20"
            icon={<Icon d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
          />
          <StatCard
            title="Archived"
            value={stats.archived.toLocaleString()}
            accentBg="bg-gray-500/10"
            accentText="text-gray-400"
            border="border-gray-500/20"
            icon={
              <Icon d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            }
          />
          <StatCard
            title="Staff Members"
            value={stats.staff.toLocaleString()}
            accentBg="bg-blue-500/10"
            accentText="text-blue-400"
            border="border-blue-500/20"
            icon={
              <Icon d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            }
          />
        </div>

        {/* Filters */}
        <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500"
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
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-red-500"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="flex-1 sm:flex-none px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-red-500"
              >
                <option value="all">All Roles</option>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {roleLabels[role] || role}
                  </option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="flex-1 sm:flex-none px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-red-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table/Cards */}
        <UsersTable
          users={filteredUsers}
          loading={loading}
          onArchive={handleArchiveUser}
          onDelete={handleDeleteUser}
          onRestore={handleRestoreUser}
        />
      </div>
    </SuperAdminLayout>
  );
}