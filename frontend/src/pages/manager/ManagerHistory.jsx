import React, { useState } from 'react';
import ManagerLayout from './ManagerLayout';

function ManagerHistory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState('All Services');
  const [statusFilter, setStatusFilter] = useState('All Status');

  // Service history records for San Mateo Rizal branch
  const serviceHistory = [
    { id: 'SH-001', date: '2026-02-20', customer: 'John Doe', vehicle: 'Toyota Corolla 2020', service: 'Oil Change', mechanic: 'Mike Johnson', duration: '45 mins', amount: '₱1,200', status: 'Completed' },
    { id: 'SH-002', date: '2026-02-20', customer: 'Jane Smith', vehicle: 'Honda Civic 2019', service: 'Brake Inspection', mechanic: 'Sarah Connor', duration: '1.5 hours', amount: '₱2,500', status: 'Completed' },
    { id: 'SH-003', date: '2026-02-19', customer: 'Robert Wilson', vehicle: 'Ford Ranger 2021', service: 'Engine Diagnostic', mechanic: 'Mike Johnson', duration: '1 hour', amount: '₱1,800', status: 'Completed' },
    { id: 'SH-004', date: '2026-02-19', customer: 'Emily Brown', vehicle: 'Nissan Altima 2022', service: 'Tire Replacement', mechanic: 'Lisa Davis', duration: '1 hour', amount: '₱4,500', status: 'Completed' },
    { id: 'SH-005', date: '2026-02-18', customer: 'Michael Chen', vehicle: 'Mazda 3 2020', service: 'Full Service', mechanic: 'Mike Johnson', duration: '2 hours', amount: '₱3,800', status: 'Completed' },
    { id: 'SH-006', date: '2026-02-18', customer: 'Sarah Johnson', vehicle: 'Hyundai Tucson 2021', service: 'AC Service', mechanic: 'Sarah Connor', duration: '1.5 hours', amount: '₱2,200', status: 'Completed' },
    { id: 'SH-007', date: '2026-02-17', customer: 'David Martinez', vehicle: 'Kia Sportage 2022', service: 'Battery Replacement', mechanic: 'Lisa Davis', duration: '30 mins', amount: '₱4,800', status: 'Completed' },
    { id: 'SH-008', date: '2026-02-17', customer: 'Patricia Lee', vehicle: 'Toyota Vios 2021', service: 'Brake Repair', mechanic: 'Mike Johnson', duration: '2 hours', amount: '₱3,200', status: 'Completed' },
    { id: 'SH-009', date: '2026-02-16', customer: 'James Wilson', vehicle: 'Honda CR-V 2020', service: 'Oil Change', mechanic: 'Sarah Connor', duration: '40 mins', amount: '₱1,100', status: 'Completed' },
    { id: 'SH-010', date: '2026-02-16', customer: 'Linda Garcia', vehicle: 'Nissan Navara 2022', service: 'Engine Repair', mechanic: 'Mike Johnson', duration: '3 hours', amount: '₱8,500', status: 'Completed' },
    { id: 'SH-011', date: '2026-02-15', customer: 'Kevin Moore', vehicle: 'Mazda CX-5 2021', service: 'Transmission Service', mechanic: 'Lisa Davis', duration: '2.5 hours', amount: '₱5,200', status: 'Completed' },
    { id: 'SH-012', date: '2026-02-15', customer: 'Susan Taylor', vehicle: 'Ford Everest 2020', service: 'Tire Rotation', mechanic: 'Sarah Connor', duration: '45 mins', amount: '₱800', status: 'Completed' }
  ];

  const getStatusBadge = (status) => {
    if (status === 'Completed') {
      return (
        <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
          Completed
        </span>
      );
    }
    return (
      <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
        Pending
      </span>
    );
  };

  const filteredHistory = serviceHistory.filter(record => {
    const matchesSearch = 
      record.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesService = serviceFilter === 'All Services' || record.service === serviceFilter;
    const matchesStatus = statusFilter === 'All Status' || record.status === statusFilter;
    
    return matchesSearch && matchesService && matchesStatus;
  });

  // Calculate total revenue
  const totalRevenue = serviceHistory.reduce((sum, record) => {
    const amount = parseInt(record.amount.replace(/[₱,]/g, ''));
    return sum + amount;
  }, 0);

  return (
    <ManagerLayout 
      title="" 
      subtitle=""
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900 -m-8 p-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Service History</h1>
          <p className="text-slate-300">View completed services for San Mateo Rizal branch</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6 shadow-lg border-2 border-red-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-red-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Services</p>
                <p className="text-3xl font-bold text-gray-900">{serviceHistory.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-lg border-2 border-blue-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">₱{totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 shadow-lg border-2 border-emerald-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-emerald-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-gray-900">{serviceHistory.filter(s => s.status === 'Completed').length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Service History Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Service Records</h2>
            
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
                  placeholder="Search by customer, vehicle, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div className="relative w-full md:w-auto">
                <select
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value)}
                  className="appearance-none w-full md:w-48 bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:ring-2 focus:ring-red-500 focus:border-transparent cursor-pointer"
                >
                  <option>All Services</option>
                  <option>Oil Change</option>
                  <option>Brake Inspection</option>
                  <option>Engine Diagnostic</option>
                  <option>Tire Replacement</option>
                  <option>Full Service</option>
                  <option>AC Service</option>
                  <option>Battery Replacement</option>
                  <option>Brake Repair</option>
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
                  <option>Completed</option>
                  <option>Pending</option>
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
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Customer</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Vehicle</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Service</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Mechanic</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Duration</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredHistory.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 text-sm text-gray-700">{record.date}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{record.customer}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{record.vehicle}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{record.service}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{record.mechanic}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{record.duration}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{record.amount}</td>
                    <td className="px-6 py-4">{getStatusBadge(record.status)}</td>
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
          {filteredHistory.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No records found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>

        {/* Results Counter */}
        {filteredHistory.length > 0 && (
          <div className="mt-4 text-sm text-slate-300">
            Showing {filteredHistory.length} of {serviceHistory.length} service records
          </div>
        )}
      </div>
    </ManagerLayout>
  );
}

export default ManagerHistory;