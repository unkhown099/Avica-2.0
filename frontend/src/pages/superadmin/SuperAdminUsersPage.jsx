import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../../hooks/api";
import SuperAdminLayout from "./SuperAdminLayout.jsx";

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
function UsersTable({ users, loading, onEdit, onDelete, onStatusToggle }) {
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

  const getRoleBadge = (role) => {
    const colors = {
      super_admin: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      admin: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      branch_manager: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      employee: "bg-gray-500/10 text-gray-400 border-gray-500/20",
      inventory_manager:
        "bg-orange-500/10 text-orange-400 border-orange-500/20",
      customer: "bg-green-500/10 text-green-400 border-green-500/20",
    };
    return colors[role] || "bg-gray-500/10 text-gray-400 border-gray-500/20";
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
    <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
      {/* Desktop Table View - Hidden on mobile */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                #
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Last Login
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((user, index) => (
              <tr
                key={user.id}
                className="hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-6 py-4 text-xs text-gray-500">
                  #{index + 1}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-400 font-medium text-sm">
                        {user.profile?.name?.charAt(0) || user.email.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">
                        {user.profile?.name || "—"}
                      </div>
                      <div className="text-gray-500 text-xs">{user.email}</div>
                      {user.profile?.phone && (
                        <div className="text-gray-600 text-xs mt-1">
                          {user.profile.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleBadge(user.profile?.role)}`}
                  >
                    {roleLabels[user.profile?.role] || user.account_type}
                  </span>
                  {user.profile?.branch && (
                    <div className="text-gray-600 text-xs mt-1">
                      {user.profile.branch}
                    </div>
                  )}
                  {user.profile?.loyalty_points && (
                    <div className="text-green-500 text-xs mt-1">
                      {user.profile.loyalty_points} pts
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit ${
                        user.is_active
                          ? "bg-green-500/10 text-green-400 border border-green-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}
                    >
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                    {!user.email_verified &&
                      user.account_type === "customer" && (
                        <span className="text-yellow-500 text-xs">
                          Email not verified
                        </span>
                      )}
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-400 text-sm">
                  {user.last_login
                    ? new Date(user.last_login).toLocaleDateString()
                    : "Never"}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(user)}
                      className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                      title="Edit user"
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
                    <button
                      onClick={() => onStatusToggle(user)}
                      className={`p-2 transition-colors ${
                        user.is_active
                          ? "text-red-400 hover:text-red-300"
                          : "text-green-400 hover:text-green-300"
                      }`}
                      title={
                        user.is_active ? "Deactivate user" : "Activate user"
                      }
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
                          d={
                            user.is_active
                              ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                              : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          }
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(user)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      title="Delete user"
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
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-white/5">
        {users.map((user, index) => (
          <div
            key={user.id}
            className="p-4 hover:bg-white/[0.02] transition-colors"
          >
            <div className="text-[11px] text-gray-500 mb-2">#{index + 1}</div>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-400 font-medium text-base">
                    {user.profile?.name?.charAt(0) || user.email.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold text-sm truncate">
                    {user.profile?.name || "—"}
                  </div>
                  <div className="text-gray-500 text-xs truncate">
                    {user.email}
                  </div>
                  {user.profile?.phone && (
                    <div className="text-gray-600 text-xs mt-1">
                      {user.profile.phone}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => onEdit(user)}
                  className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
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
                <button
                  onClick={() => onDelete(user)}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
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
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <span
                className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleBadge(user.profile?.role)}`}
              >
                {roleLabels[user.profile?.role] || user.account_type}
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                  user.is_active
                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}
              >
                {user.is_active ? "Active" : "Inactive"}
              </span>
              {user.profile?.branch && (
                <span className="text-gray-500 text-xs bg-gray-800 px-2 py-1 rounded-full">
                  {user.profile.branch}
                </span>
              )}
              {user.profile?.loyalty_points && (
                <span className="text-green-500 text-xs bg-green-500/10 px-2 py-1 rounded-full">
                  {user.profile.loyalty_points} pts
                </span>
              )}
            </div>
            <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/5">
              <div className="text-gray-500 text-xs">
                Last login:{" "}
                {user.last_login
                  ? new Date(user.last_login).toLocaleDateString()
                  : "Never"}
              </div>
              <button
                onClick={() => onStatusToggle(user)}
                className={`text-xs font-semibold ${
                  user.is_active ? "text-red-400" : "text-green-400"
                }`}
              >
                {user.is_active ? "Deactivate" : "Activate"}
              </button>
            </div>
            {!user.email_verified && user.account_type === "customer" && (
              <div className="mt-2 text-yellow-500 text-xs">
                Email not verified
              </div>
            )}
          </div>
        ))}
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
                setFormData({ ...formData, first_name: e.target.value })
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
                setFormData({ ...formData, last_name: e.target.value })
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
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
          />
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
                  setFormData({ ...formData, first_name: e.target.value })
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
                  setFormData({ ...formData, last_name: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
            />
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

function RolesPermissionsModal({ roles, onClose }) {
  const roleLabels = {
    super_admin: "Super Admin",
    admin: "Admin",
    branch_manager: "Branch Manager",
    employee: "Employee",
    inventory_manager: "Inventory Manager",
    customer: "Customer",
  };

  const defaultPermissions = {
    create: true,
    read: true,
    update: true,
    delete: false,
  };

  const [roleSettings, setRoleSettings] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("superadmin_role_settings") || "null",
      );
      return roles.map((role) => ({
        key: role,
        label:
          saved?.find((item) => item.key === role)?.label ||
          roleLabels[role] ||
          role,
        permissions:
          saved?.find((item) => item.key === role)?.permissions ||
          defaultPermissions,
      }));
    } catch {
      return roles.map((role) => ({
        key: role,
        label: roleLabels[role] || role,
        permissions: defaultPermissions,
      }));
    }
  });

  useEffect(() => {
    setRoleSettings((prev) => {
      const saved = JSON.parse(
        localStorage.getItem("superadmin_role_settings") || "null",
      );
      return roles.map((role) => {
        const existing = prev.find((item) => item.key === role) || {};
        const savedItem = saved?.find((item) => item.key === role);
        return {
          key: role,
          label: savedItem?.label || existing.label || roleLabels[role] || role,
          permissions:
            savedItem?.permissions ||
            existing.permissions ||
            defaultPermissions,
        };
      });
    });
  }, [roles]);

  const handleLabelChange = (key, value) => {
    setRoleSettings((prev) =>
      prev.map((item) => (item.key === key ? { ...item, label: value } : item)),
    );
  };

  const togglePermission = (key, perm) => {
    setRoleSettings((prev) =>
      prev.map((item) =>
        item.key === key
          ? {
              ...item,
              permissions: {
                ...item.permissions,
                [perm]: !item.permissions[perm],
              },
            }
          : item,
      ),
    );
  };

  const saveSettings = () => {
    localStorage.setItem(
      "superadmin_role_settings",
      JSON.stringify(roleSettings),
    );
    alert("Role settings saved.");
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 border-b border-white/10 px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">
              Roles & Permissions
            </h3>
            <p className="text-gray-400 text-sm">
              Super admins can update role labels and permission defaults here.
            </p>
          </div>
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

        <div className="p-4 sm:p-6 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-gray-800/80 p-4 text-sm text-gray-300">
            Only users with Super Admin access can edit these role settings. The
            interface is intentionally lightweight so it can be expanded later
            with real role permission definitions.
          </div>

          {roleSettings.length > 0 ? (
            <div className="space-y-4">
              {roleSettings.map((role) => (
                <div
                  key={role.key}
                  className="rounded-2xl border border-white/10 bg-gray-900/80 p-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {roleLabels[role.key] || role.key}
                      </div>
                      <div className="text-xs text-gray-500">
                        Role key: {role.key}
                      </div>
                    </div>
                    <div className="w-full sm:w-72">
                      <label className="block text-xs font-semibold text-gray-400 mb-1">
                        Display name
                      </label>
                      <input
                        type="text"
                        value={role.label}
                        onChange={(e) =>
                          handleLabelChange(role.key, e.target.value)
                        }
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-4">
                    {Object.keys(role.permissions).map((perm) => (
                      <button
                        key={perm}
                        type="button"
                        onClick={() => togglePermission(role.key, perm)}
                        className={`rounded-2xl px-3 py-2 text-xs font-semibold transition-all ${
                          role.permissions[perm]
                            ? "bg-green-500/15 text-green-300 border border-green-500/20"
                            : "bg-gray-800 text-gray-400 border border-white/10 hover:border-gray-600"
                        }`}
                      >
                        {perm.charAt(0).toUpperCase() + perm.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-gray-900/80 p-6 text-center text-gray-400">
              No roles loaded yet.
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gray-800 border border-white/10 text-gray-300 hover:text-white hover:bg-gray-700 transition-all text-sm font-semibold"
            >
              Close
            </button>
            <button
              onClick={saveSettings}
              className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all text-sm font-semibold"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SuperAdminUsers() {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [roles, setRoles] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [editingUser, setEditingUser] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showRolesModal, setShowRolesModal] = useState(false);
  const [activeSection, setActiveSection] = useState("all-users");
  const [submitting, setSubmitting] = useState(false);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (location.pathname !== "/super-admin/users") return;

    const hash = location.hash;
    if (hash === "#roles") {
      setShowRolesModal(true);
      setShowAddForm(false);
      setActiveSection("roles");
      return;
    }

    if (hash === "#add-user") {
      setShowAddForm(true);
      setShowRolesModal(false);
      setActiveSection("add-user");
      return;
    }

    setShowAddForm(false);
    setShowRolesModal(false);
    setActiveSection("all-users");
  }, [location.pathname, location.hash]);

  const closeSection = () => {
    setShowAddForm(false);
    setShowRolesModal(false);
    setActiveSection("all-users");
    navigate("/super-admin/users", { replace: true });
  };

  const openAddUserSection = () => {
    if (showAddForm && activeSection === "add-user") {
      closeSection();
      return;
    }
    navigate("/super-admin/users#add-user", { replace: true });
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
  };

  const handleSaveUser = async (userId, formData) => {
    setSubmitting(true);
    try {
      const token =
        localStorage.getItem("access_token") ??
        sessionStorage.getItem("access_token");

      const payload = {
        is_active: formData.is_active,
      };

      if (formData.staff_role) {
        payload.staff_role = formData.staff_role;
      }

      if (formData.staff_branch) {
        payload.staff_branch = formData.staff_branch;
      }

      await apiFetch(`/super-admin/users/${userId}/`, {
        method: "PATCH",
        body: payload,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update user");
      }

      setEditingUser(null);
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (
      !confirm(
        `Are you sure you want to delete ${user.email}? This action cannot be undone.`,
      )
    )
      return;

    try {
      await apiFetch(`/super-admin/users/${user.id}/`, { method: "DELETE" });

      setUsers((prevUsers) => prevUsers.filter((u) => u.id !== user.id));

      alert(`User ${user.email} has been deleted.`);
    } catch (err) {
      alert(err.message || "Failed to delete user.");
    }
  };

  const handleStatusToggle = async (user) => {
    try {
      const response = await apiFetch(`/super-admin/users/${user.id}/`, {
        method: "PATCH",
        body: { is_active: !user.is_active },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update user status");
      }
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddUser = async (formData) => {
    setSubmitting(true);
    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        account_type: formData.account_type,
        role: formData.role,
        branch_id: formData.branch_id || null,
        send_welcome_email: formData.send_welcome_email,
      };

      const response = await apiFetch("/super-admin/create/", {
        method: "POST",
        body: payload,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create user");
      }

      fetchData();
      setShowAddForm(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
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
      (selectedStatus === "active" && user.is_active) ||
      (selectedStatus === "inactive" && !user.is_active);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    total: users.length,
    active: users.filter((u) => u.is_active).length,
    staff: users.filter((u) => u.account_type === "staff").length,
    customers: users.filter((u) => u.account_type === "customer").length,
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
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">
              User Management
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
              Manage system users, roles, and permissions
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={openAddUserSection}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all text-sm font-semibold"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add User
            </button>
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 border border-white/10 text-gray-300 hover:text-white hover:bg-gray-700 transition-all text-sm font-semibold"
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
            title="Staff Members"
            value={stats.staff.toLocaleString()}
            accentBg="bg-blue-500/10"
            accentText="text-blue-400"
            border="border-blue-500/20"
            icon={
              <Icon d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            }
          />
          <StatCard
            title="Customers"
            value={stats.customers.toLocaleString()}
            accentBg="bg-yellow-500/10"
            accentText="text-yellow-400"
            border="border-yellow-500/20"
            icon={
              <Icon d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            }
          />
        </div>

        {/* Add User Form */}
        {showAddForm && (
          <div className="mb-6">
            <AddUserForm
              onSubmit={handleAddUser}
              onCancel={closeSection}
              branches={branches}
              roles={roles}
              loading={submitting}
            />
          </div>
        )}

        {/* Roles & Permissions Modal */}
        {showRolesModal && (
          <RolesPermissionsModal roles={roles} onClose={closeSection} />
        )}

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
              </select>
            </div>
          </div>
        </div>

        {/* Users Table/Cards */}
        <UsersTable
          users={filteredUsers}
          loading={loading}
          onEdit={handleEditUser}
          onDelete={handleDeleteUser}
          onStatusToggle={handleStatusToggle}
        />

        {/* Edit User Modal */}
        {editingUser && (
          <EditUserModal
            user={editingUser}
            onClose={() => setEditingUser(null)}
            onSave={handleSaveUser}
            branches={branches}
            loading={submitting}
          />
        )}
      </div>
    </SuperAdminLayout>
  );
}
