import React, { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import axios from "axios";
import Swal from "sweetalert2";

function AdminStaffAccounts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [staffAccounts, setStaffAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const roles = [
    "Admin",
    "Business Owner",
    "Branch Manager",
    "Staff", // Cashier
    "Employee", // Mechanic
  ];

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/staff/")
      .then((res) => {
        setStaffAccounts(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load staff:", err);
        setLoading(false);
      });
  }, []);

  const getRoleBadge = (role) => {
    const styles = {
      Admin: "bg-red-100 text-red-700 border-red-200",
      "Business Owner": "bg-purple-100 text-purple-700 border-purple-200",
      "Branch Manager": "bg-red-50 text-red-700 border-red-200",
      Staff: "bg-green-100 text-green-700 border-green-200",
      Employee: "bg-yellow-100 text-yellow-700 border-yellow-200",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[role]}`}
      >
        {role}
      </span>
    );
  };

  const getStatusBadge = (status) => (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold border ${status === "Active"
          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
          : "bg-gray-100 text-gray-700 border-gray-200"
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

  if (loading) {
    return (
      <AdminLayout title="" subtitle="">
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-950/50 -m-8 p-8">
          <div className="p-10 text-center text-slate-300">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title=""
      subtitle=""
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900 -m-8 p-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Staff</h1>
          <p className="text-slate-300">Manage staff accounts and permissions</p>
        </div>

        {/* Header with Stats and Create Button */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="text-slate-300 text-lg">
            Total Staff: <span className="font-bold text-white">{staffAccounts.length}</span>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2 transition-colors duration-200 shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Staff Account
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                placeholder="Search by name, email, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            {/* Role Filter */}
            <div className="relative md:w-60">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 w-full focus:ring-2 focus:ring-red-500 focus:border-transparent cursor-pointer"
              >
                <option>All Roles</option>
                {roles.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Staff Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Branch</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStaff.map((staff) => (
                  <tr
                    key={staff.id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{staff.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{staff.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{staff.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{staff.phone}</td>
                    <td className="px-6 py-4">{getRoleBadge(staff.role)}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{staff.branch}</td>
                    <td className="px-6 py-4">{getStatusBadge(staff.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredStaff.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No staff found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>

        {/* Results Summary */}
        {filteredStaff.length > 0 && (
          <div className="mt-4 text-sm text-slate-300">
            Showing {filteredStaff.length} of {staffAccounts.length} staff members
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateStaffModal
          roles={roles}
          onClose={() => setShowCreateModal(false)}
          onCreated={(newStaff) =>
            setStaffAccounts((prev) => [...prev, newStaff])
          }
        />
      )}
    </AdminLayout>
  );
}

function CreateStaffModal({ onClose, roles, onCreated }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: roles[0], // defaults to "Admin"
    branch: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      await Swal.fire({
        icon: "error",
        title: "Password mismatch",
        text: "Passwords do not match",
      });
      return;
    }

    try {
      const res = await axios.post("http://127.0.0.1:8000/staff/", {
        email: form.email,
        password: form.password,
        first_name: form.firstName,
        last_name: form.lastName,
        phone: form.phone,
        role: form.role,
        branch: form.branch,
      });

      // Update parent state first
      onCreated(res.data);

      // Close modal BEFORE showing alert
      onClose();

      // Show success alert after modal is closed
      await Swal.fire({
        icon: "success",
        title: "Staff created",
        text: "The staff account was created successfully",
        timer: 1800,
        showConfirmButton: false,
        timerProgressBar: true,
      });
    } catch (err) {
      const msg =
        err.response?.data?.email?.[0] ||
        err.response?.data?.detail ||
        "Failed to create staff";
      await Swal.fire({ icon: "error", title: "Creation failed", text: msg });
      console.error(err.response?.data);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <form
        onSubmit={submit}
        className="bg-white p-8 rounded-xl w-full max-w-2xl space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Create Staff Account</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
            <input
              name="firstName"
              placeholder="Enter first name"
              onChange={handleChange}
              className="border border-gray-300 rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
            <input
              name="lastName"
              placeholder="Enter last name"
              onChange={handleChange}
              className="border border-gray-300 rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            name="email"
            type="email"
            placeholder="Enter email address"
            onChange={handleChange}
            className="border border-gray-300 rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
          <input
            name="phone"
            placeholder="Enter phone number"
            onChange={handleChange}
            className="border border-gray-300 rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              name="role"
              onChange={handleChange}
              className="border border-gray-300 rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {roles.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
            <input
              name="branch"
              placeholder="Enter branch name"
              onChange={handleChange}
              className="border border-gray-300 rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter password"
              onChange={handleChange}
              className="border border-gray-300 rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm password"
              onChange={handleChange}
              className="border border-gray-300 rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="border border-gray-300 px-6 py-3 rounded-lg w-full hover:bg-gray-50 transition-colors font-medium text-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-red-600 text-white px-6 py-3 rounded-lg w-full hover:bg-red-700 transition-colors font-semibold shadow-lg"
          >
            Create Staff Account
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminStaffAccounts;