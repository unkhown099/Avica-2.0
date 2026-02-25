import React, { useState } from 'react';
import ManagerLayout from './ManagerLayout';

function ManagerAccountManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All Status');

  // Staff accounts for San Mateo Rizal branch only
  const staffAccounts = [
    { id: 1, name: 'Carl Roy Gamilla', email: 'carl@otokwikk.com', phone: '0917-123-4567', role: 'Branch Manager', status: 'Active' },
    { id: 2, name: 'Mike Johnson', email: 'mike.j@otokwikk.com', phone: '0922-678-9012', role: 'Mechanic', status: 'Active' },
    { id: 3, name: 'Sarah Connor', email: 'sarah.c@otokwikk.com', phone: '0923-789-0123', role: 'Mechanic', status: 'Active' },
    { id: 4, name: 'Lisa Davis', email: 'lisa.d@otokwikk.com', phone: '0925-901-2345', role: 'Mechanic', status: 'Active' },
    { id: 5, name: 'Robert Lee', email: 'robert.l@otokwikk.com', phone: '0926-012-3456', role: 'Service Advisor', status: 'Active' },
    { id: 6, name: 'Jennifer White', email: 'jen.w@otokwikk.com', phone: '0927-123-4567', role: 'Service Advisor', status: 'Active' },
    { id: 7, name: 'David Brown', email: 'david.b@otokwikk.com', phone: '0928-234-5678', role: 'Receptionist', status: 'Active' },
    { id: 8, name: 'Emily Garcia', email: 'emily.g@otokwikk.com', phone: '0929-345-6789', role: 'Receptionist', status: 'Active' },
    { id: 9, name: 'James Wilson', email: 'james.w@otokwikk.com', phone: '0930-456-7890', role: 'Parts Manager', status: 'Active' },
    { id: 10, name: 'Patricia Martinez', email: 'patricia.m@otokwikk.com', phone: '0931-567-8901', role: 'Parts Manager', status: 'Active' },
    { id: 11, name: 'Michael Anderson', email: 'michael.a@otokwikk.com', phone: '0932-678-9012', role: 'Mechanic', status: 'Active' },
    { id: 12, name: 'Susan Taylor', email: 'susan.t@otokwikk.com', phone: '0933-789-0123', role: 'Service Advisor', status: 'Active' },
    { id: 13, name: 'Kevin Moore', email: 'kevin.m@otokwikk.com', phone: '0934-890-1234', role: 'Mechanic', status: 'Active' },
    { id: 14, name: 'Linda Jackson', email: 'linda.j@otokwikk.com', phone: '0935-901-2345', role: 'Receptionist', status: 'Active' },
    { id: 15, name: 'Thomas White', email: 'thomas.w@otokwikk.com', phone: '0936-012-3456', role: 'Mechanic', status: 'Active' }
  ];

  const getRoleBadge = (role) => {
    const colors = {
      'Branch Manager': 'bg-purple-100 text-purple-700 border-purple-200',
      'Mechanic': 'bg-blue-100 text-blue-700 border-blue-200',
      'Service Advisor': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'Receptionist': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Parts Manager': 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[role] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusBadge = (status) => {
    if (status === 'Active') {
      return (
        <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
          Active
        </span>
      );
    }
    return (
      <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 border border-gray-200">
        Inactive
      </span>
    );
  };

  const filteredStaff = staffAccounts.filter(staff => {
    const matchesSearch = 
      staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'All Roles' || staff.role === roleFilter;
    const matchesStatus = statusFilter === 'All Status' || staff.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <ManagerLayout 
      title="" 
      subtitle=""
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900 -m-8 p-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Account Management</h1>
          <p className="text-slate-300">Manage staff accounts for San Mateo Rizal branch</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6 shadow-lg border-2 border-red-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-red-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Staff</p>
                <p className="text-3xl font-bold text-gray-900">{staffAccounts.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-lg border-2 border-blue-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Mechanics</p>
                <p className="text-3xl font-bold text-gray-900">{staffAccounts.filter(s => s.role === 'Mechanic').length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 shadow-lg border-2 border-emerald-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-emerald-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Service Advisors</p>
                <p className="text-3xl font-bold text-gray-900">{staffAccounts.filter(s => s.role === 'Service Advisor').length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 shadow-lg border-2 border-purple-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-purple-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-3xl font-bold text-gray-900">{staffAccounts.filter(s => s.status === 'Active').length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Staff List */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Staff Accounts</h2>
            
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1 relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div className="relative w-full md:w-auto">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="appearance-none w-full md:w-48 bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:ring-2 focus:ring-red-500 focus:border-transparent cursor-pointer"
                >
                  <option>All Roles</option>
                  <option>Branch Manager</option>
                  <option>Mechanic</option>
                  <option>Service Advisor</option>
                  <option>Receptionist</option>
                  <option>Parts Manager</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <div className="relative w-full md:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none w-full md:w-40 bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:ring-2 focus:ring-red-500 focus:border-transparent cursor-pointer"
                >
                  <option>All Status</option>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{staff.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{staff.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{staff.phone}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadge(staff.role)}`}>
                        {staff.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(staff.status)}</td>
                    <td className="px-6 py-4">
                      <button className="text-gray-600 hover:text-red-600 transition-colors duration-200">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredStaff.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No staff found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>

        {/* Results Counter */}
        {filteredStaff.length > 0 && (
          <div className="mt-4 text-sm text-slate-300">
            Showing {filteredStaff.length} of {staffAccounts.length} staff accounts
          </div>
        )}
      </div>
    </ManagerLayout>
  );
}

export default ManagerAccountManagement;