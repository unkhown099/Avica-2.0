import React, { useState } from 'react';
import AdminLayout from './AdminLayout';

function AdminCustomers() {
  const [searchQuery, setSearchQuery] = useState('');

  // Customer segmentation data
  const segmentationData = [
    {
      label: 'High Value',
      count: 145,
      percentage: '12% of total',
      color: 'bg-red-100 border-red-200',
      dotColor: 'bg-red-600'
    },
    {
      label: 'Regular',
      count: 523,
      percentage: '42% of total',
      color: 'bg-gray-100 border-gray-200',
      dotColor: 'bg-gray-900'
    },
    {
      label: 'New',
      count: 379,
      percentage: '30% of total',
      color: 'bg-blue-100 border-blue-200',
      dotColor: 'bg-blue-600'
    },
    {
      label: 'At Risk',
      count: 200,
      percentage: '16% of total',
      color: 'bg-red-100 border-red-200',
      dotColor: 'bg-red-600'
    }
  ];

  // Customer database
  const [customers] = useState([
    {
      id: 'CUST-001',
      name: 'John Doe',
      email: 'john.doe@email.com',
      phone: '+63 912 345 6789',
      vehicles: 2,
      totalSpent: '₱45,000',
      visits: 12,
      segment: 'High Value',
      satisfaction: '95%'
    },
    {
      id: 'CUST-002',
      name: 'Jane Smith',
      email: 'jane.smith@email.com',
      phone: '+63 923 456 7890',
      vehicles: 1,
      totalSpent: '₱28,000',
      visits: 7,
      segment: 'Regular',
      satisfaction: '88%'
    },
    {
      id: 'CUST-003',
      name: 'Robert Wilson',
      email: 'robert.w@email.com',
      phone: '+63 934 567 8901',
      vehicles: 3,
      totalSpent: '₱67,000',
      visits: 18,
      segment: 'High Value',
      satisfaction: '92%'
    },
    {
      id: 'CUST-004',
      name: 'Emily Brown',
      email: 'emily.brown@email.com',
      phone: '+63 945 678 9012',
      vehicles: 1,
      totalSpent: '₱12,000',
      visits: 3,
      segment: 'New',
      satisfaction: '85%'
    }
  ]);

  const getSegmentBadge = (segment) => {
    const segmentStyles = {
      'High Value': 'bg-red-100 text-red-700 border-red-200',
      'Regular': 'bg-gray-100 text-gray-700 border-gray-200',
      'New': 'bg-blue-100 text-blue-700 border-blue-200',
      'At Risk': 'bg-yellow-100 text-yellow-700 border-yellow-200'
    };

    return (
      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${segmentStyles[segment]}`}>
        {segment}
      </span>
    );
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout 
      title="Customer Management" 
      subtitle="Manage customer profiles and relationships"
    >
      {/* Header with Add Customer Button */}
      <div className="flex items-center justify-end mb-8">
        <button className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2 transition-colors duration-200">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Customer
        </button>
      </div>

      {/* Customer Segmentation */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
        <div className="flex items-center gap-2 mb-6">
          <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h2 className="text-lg font-bold text-gray-900">Customer Segmentation</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {segmentationData.map((segment, index) => (
            <div key={index} className={`rounded-xl p-6 border ${segment.color}`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-700">{segment.label}</span>
                <div className={`w-3 h-3 rounded-full ${segment.dotColor}`}></div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{segment.count}</div>
              <div className="text-sm text-gray-600">{segment.percentage}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer Database */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Customer Database</h2>
          
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Customer ID</th>
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
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{customer.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{customer.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{customer.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{customer.phone}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{customer.vehicles}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{customer.totalSpent}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{customer.visits}</td>
                  <td className="px-6 py-4">{getSegmentBadge(customer.segment)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900">{customer.satisfaction}</span>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No customers found</h3>
            <p className="text-gray-600">Try adjusting your search criteria</p>
          </div>
        )}
      </div>

      {/* Results Summary */}
      {filteredCustomers.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredCustomers.length} of {customers.length} customers
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminCustomers;