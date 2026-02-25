import React, { useState } from 'react';
import ManagerLayout from './ManagerLayout';

function ManagerCustomerManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('All Segments');

  // Customer data for San Mateo Rizal branch
  const customers = [
    { id: 1, name: 'John Doe', email: 'john.doe@email.com', phone: '0917-111-2222', vehicles: 2, totalSpent: '₱45,200', visits: 12, segment: 'High Value', satisfaction: 95 },
    { id: 2, name: 'Jane Smith', email: 'jane.smith@email.com', phone: '0918-222-3333', vehicles: 1, totalSpent: '₱32,500', visits: 8, segment: 'Regular', satisfaction: 92 },
    { id: 3, name: 'Robert Wilson', email: 'robert.w@email.com', phone: '0919-333-4444', vehicles: 3, totalSpent: '₱68,900', visits: 15, segment: 'High Value', satisfaction: 98 },
    { id: 4, name: 'Emily Brown', email: 'emily.b@email.com', phone: '0920-444-5555', vehicles: 1, totalSpent: '₱12,300', visits: 3, segment: 'New', satisfaction: 88 },
    { id: 5, name: 'Michael Chen', email: 'michael.c@email.com', phone: '0921-555-6666', vehicles: 2, totalSpent: '₱38,700', visits: 10, segment: 'Regular', satisfaction: 94 },
    { id: 6, name: 'Sarah Johnson', email: 'sarah.j@email.com', phone: '0922-666-7777', vehicles: 1, totalSpent: '₱15,800', visits: 5, segment: 'Regular', satisfaction: 90 },
    { id: 7, name: 'David Martinez', email: 'david.m@email.com', phone: '0923-777-8888', vehicles: 2, totalSpent: '₱28,400', visits: 7, segment: 'Regular', satisfaction: 86 },
    { id: 8, name: 'Patricia Lee', email: 'patricia.l@email.com', phone: '0924-888-9999', vehicles: 1, totalSpent: '₱8,500', visits: 2, segment: 'New', satisfaction: 85 },
    { id: 9, name: 'James Wilson', email: 'james.w@email.com', phone: '0925-999-0000', vehicles: 2, totalSpent: '₱52,300', visits: 14, segment: 'High Value', satisfaction: 96 },
    { id: 10, name: 'Linda Garcia', email: 'linda.g@email.com', phone: '0926-000-1111', vehicles: 1, totalSpent: '₱24,600', visits: 6, segment: 'Regular', satisfaction: 89 },
    { id: 11, name: 'Kevin Moore', email: 'kevin.m@email.com', phone: '0927-111-2222', vehicles: 1, totalSpent: '₱18,200', visits: 4, segment: 'Regular', satisfaction: 91 },
    { id: 12, name: 'Susan Taylor', email: 'susan.t@email.com', phone: '0928-222-3333', vehicles: 3, totalSpent: '₱72,500', visits: 18, segment: 'High Value', satisfaction: 97 }
  ];

  const getSegmentBadge = (segment) => {
    const colors = {
      'High Value': 'bg-red-100 text-red-700 border-red-200',
      'Regular': 'bg-gray-100 text-gray-700 border-gray-200',
      'New': 'bg-blue-100 text-blue-700 border-blue-200',
      'At Risk': 'bg-yellow-100 text-yellow-700 border-yellow-200'
    };
    return colors[segment] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery);
    
    const matchesSegment = segmentFilter === 'All Segments' || customer.segment === segmentFilter;
    
    return matchesSearch && matchesSegment;
  });

  // Calculate stats
  const totalCustomers = customers.length;
  const highValueCustomers = customers.filter(c => c.segment === 'High Value').length;
  const averageSatisfaction = Math.round(customers.reduce((sum, c) => sum + c.satisfaction, 0) / customers.length);
  const totalRevenue = customers.reduce((sum, c) => {
    const amount = parseInt(c.totalSpent.replace(/[₱,]/g, ''));
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
          <h1 className="text-4xl font-bold text-white mb-2">Customer Management</h1>
          <p className="text-slate-300">Manage customers for San Mateo Rizal branch</p>
        </div>

        {/* Customer Segmentation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6 shadow-lg border-2 border-red-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-red-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Customers</p>
                <p className="text-3xl font-bold text-gray-900">{totalCustomers}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-lg border-2 border-blue-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">High Value</p>
                <p className="text-3xl font-bold text-gray-900">{highValueCustomers}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 shadow-lg border-2 border-emerald-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-emerald-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg. Satisfaction</p>
                <p className="text-3xl font-bold text-gray-900">{averageSatisfaction}%</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 shadow-lg border-2 border-purple-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-purple-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">₱{totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Customer List</h2>
            
            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1 relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div className="relative w-full md:w-auto">
                <select
                  value={segmentFilter}
                  onChange={(e) => setSegmentFilter(e.target.value)}
                  className="appearance-none w-full md:w-48 bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:ring-2 focus:ring-red-500 focus:border-transparent cursor-pointer"
                >
                  <option>All Segments</option>
                  <option>High Value</option>
                  <option>Regular</option>
                  <option>New</option>
                  <option>At Risk</option>
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
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Vehicles</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Total Spent</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Visits</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Segment</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Satisfaction</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{customer.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{customer.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{customer.phone}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{customer.vehicles}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{customer.totalSpent}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{customer.visits}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getSegmentBadge(customer.segment)}`}>
                        {customer.segment}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm font-semibold text-gray-900">{customer.satisfaction}%</span>
                      </div>
                    </td>
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
          {filteredCustomers.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No customers found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>

        {/* Results Counter */}
        {filteredCustomers.length > 0 && (
          <div className="mt-4 text-sm text-slate-300">
            Showing {filteredCustomers.length} of {customers.length} customers
          </div>
        )}
      </div>
    </ManagerLayout>
  );
}

export default ManagerCustomerManagement;