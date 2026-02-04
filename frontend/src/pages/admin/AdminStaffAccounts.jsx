import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import axios from 'axios';
import Swal from 'sweetalert2';

function AdminStaffAccounts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [staffAccounts, setStaffAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const roles = [
    'Admin',
    'Business Owner/Manager',
    'Branch Manager',
    'Service Advisor/Staff',
    'Inventory Manager'
  ];

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/staff/")
      .then(res => {
        setStaffAccounts(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load staff:", err);
        setLoading(false);
      });
  }, []);

  const getRoleBadge = (role) => {
    const styles = {
      'Admin': 'bg-red-600 text-white border-red-600',
      'Business Owner/Manager': 'bg-purple-100 text-purple-700 border-purple-200',
      'Branch Manager': 'bg-blue-100 text-blue-700 border-blue-200',
      'Service Advisor/Staff': 'bg-green-100 text-green-700 border-green-200',
      'Inventory Manager': 'bg-yellow-100 text-yellow-700 border-yellow-200'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[role]}`}>
        {role}
      </span>
    );
  };

  const getStatusBadge = (status) => (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
      status === 'Active'
        ? 'bg-green-100 text-green-700 border-green-200'
        : 'bg-gray-100 text-gray-700 border-gray-200'
    }`}>
      {status}
    </span>
  );

  const filteredStaff = staffAccounts.filter(staff => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      staff.name.toLowerCase().includes(q) ||
      staff.email.toLowerCase().includes(q) ||
      String(staff.id).includes(q);
    const matchesRole =
      roleFilter === 'All Roles' || staff.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <AdminLayout title="Staff Account Management">
        <div className="p-10 text-center text-gray-500">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Staff Account Management" subtitle="Manage staff accounts">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="text-gray-700">Total Staff: <b>{staffAccounts.length}</b></div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
        >
          Create Staff Account
        </button>
      </div>

      <div className="mb-4 flex flex-col md:flex-row gap-4">
        <input
          placeholder="Search..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="border rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="border rounded-lg p-3 w-full md:w-60 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option>All Roles</option>
          {roles.map(r => <option key={r}>{r}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              {['ID','Name','Email','Phone','Role','Branch','Status'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-sm font-medium text-gray-700">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white">
            {filteredStaff.map(staff => (
              <tr key={staff.id} className="border-b hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2">{staff.id}</td>
                <td className="px-4 py-2">{staff.name}</td>
                <td className="px-4 py-2">{staff.email}</td>
                <td className="px-4 py-2">{staff.phone}</td>
                <td className="px-4 py-2">{getRoleBadge(staff.role)}</td>
                <td className="px-4 py-2">{staff.branch}</td>
                <td className="px-4 py-2">{getStatusBadge(staff.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <CreateStaffModal
          roles={roles}
          onClose={() => setShowCreateModal(false)}
          onCreated={(newStaff) => setStaffAccounts(prev => [...prev, newStaff])}
        />
      )}
    </AdminLayout>
  );
}

function CreateStaffModal({ onClose, roles, onCreated }) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: roles[0],
    branch: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      await Swal.fire({ icon: 'error', title: 'Password mismatch', text: 'Passwords do not match' });
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
        branch: form.branch
      });

      onCreated(res.data);

      await Swal.fire({
        icon: 'success',
        title: 'Staff created',
        text: 'The staff account was created successfully',
        timer: 1800,
        showConfirmButton: false
      });

      onClose();

    } catch (err) {
      const msg = err.response?.data?.email?.[0] || err.response?.data?.detail || "Failed to create staff";
      await Swal.fire({ icon: 'error', title: 'Creation failed', text: msg });
      console.error(err.response?.data);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <form onSubmit={submit} className="bg-white p-10 rounded-xl w-full max-w-lg space-y-5 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800">Create Staff</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="firstName" placeholder="First Name" onChange={handleChange} className="border rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-red-500" required />
          <input name="lastName" placeholder="Last Name" onChange={handleChange} className="border rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-red-500" required />
        </div>

        <input name="email" placeholder="Email" onChange={handleChange} className="border rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-red-500" required />
        <input name="phone" placeholder="Phone" onChange={handleChange} className="border rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-red-500" required />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select name="role" onChange={handleChange} className="border rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-red-500">
            {roles.map(r => <option key={r}>{r}</option>)}
          </select>
          <input name="branch" placeholder="Branch" onChange={handleChange} className="border rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-red-500" required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="password" name="password" placeholder="Password" onChange={handleChange} className="border rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-red-500" required />
          <input type="password" name="confirmPassword" placeholder="Confirm Password" onChange={handleChange} className="border rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-red-500" required />
        </div>

        <div className="flex gap-4">
          <button type="button" onClick={onClose} className="border px-4 py-2 rounded-lg w-full hover:bg-gray-100 transition">Cancel</button>
          <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded-lg w-full hover:bg-red-700 transition">Create</button>
        </div>
      </form>
    </div>
  );
}

export default AdminStaffAccounts;