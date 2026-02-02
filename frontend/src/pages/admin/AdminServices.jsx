import React, { useState } from 'react';
import AdminLayout from './AdminLayout';

function AdminServices() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');

  // Mock service requests data
  const [serviceRequests] = useState([
    {
      id: 'SVC-001',
      customer: 'John Doe',
      vehicle: 'Toyota Corolla 2020',
      plateNo: 'ABC-1234',
      service: 'Oil Change & Inspection',
      status: 'In Progress',
      branch: 'San Mateo Rizal',
      mechanic: 'Mike Johnson',
      estCost: '₱2,500'
    },
    {
      id: 'SVC-002',
      customer: 'Jane Smith',
      vehicle: 'Honda Civic 2019',
      plateNo: 'XYZ-5678',
      service: 'Brake Replacement',
      status: 'Pending',
      branch: 'South Caloocan',
      mechanic: 'Not Assigned',
      estCost: '₱8,500'
    },
    {
      id: 'SVC-003',
      customer: 'Robert Wilson',
      vehicle: 'Ford Ranger 2021',
      plateNo: 'DEF-9012',
      service: 'Engine Diagnostic',
      status: 'Completed',
      branch: 'North Caloocan',
      mechanic: 'Sarah Connor',
      estCost: '₱3,500'
    },
    {
      id: 'SVC-004',
      customer: 'Emily Brown',
      vehicle: 'Nissan Altima 2022',
      plateNo: 'GHI-3456',
      service: 'Tire Replacement',
      status: 'In Progress',
      branch: 'Quezon City',
      mechanic: 'Tom Hardy',
      estCost: '₱12,000'
    }
  ]);

  const getStatusBadge = (status) => {
    const statusStyles = {
      'In Progress': 'bg-blue-100 text-blue-700 border-blue-200',
      'Pending': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Completed': 'bg-red-600 text-white border-red-600'
    };

    const statusIcons = {
      'In Progress': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      'Pending': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      'Completed': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    };

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${statusStyles[status]}`}>
        {statusIcons[status]}
        {status}
      </span>
    );
  };

  const filteredRequests = serviceRequests.filter(request => {
    const matchesSearch = 
      request.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.plateNo.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'All Status' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout 
      title="Service Management" 
      subtitle="Manage and track all service requests"
    >
      {/* Header with New Service Button */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Service Requests</h2>
        </div>
        <button className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2 transition-colors duration-200">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Service
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
        <div className="flex items-center gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by ID, customer, vehicle, or plate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:ring-2 focus:ring-red-500 focus:border-transparent cursor-pointer"
            >
              <option>All Status</option>
              <option>In Progress</option>
              <option>Pending</option>
              <option>Completed</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Service Requests Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Service ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Customer</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Vehicle</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Plate No.</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Service</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Branch</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Mechanic</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Est. Cost</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{request.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{request.customer}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{request.vehicle}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{request.plateNo}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{request.service}</td>
                  <td className="px-6 py-4">{getStatusBadge(request.status)}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{request.branch}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{request.mechanic}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{request.estCost}</td>
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
        {filteredRequests.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No service requests found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Results Summary */}
      {filteredRequests.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredRequests.length} of {serviceRequests.length} service requests
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminServices;