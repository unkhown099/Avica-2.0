import React from 'react';
import AdminLayout from './AdminLayout';

function AdminBranches() {
  const branches = [
    {
      name: 'San Mateo Rizal',
      location: 'San Mateo, Rizal',
      status: 'Active',
      manager: 'Carl Roy Gamilla',
      staff: 15,
      mechanics: 8,
      bayUtilization: 85,
      services: 450,
      revenue: '₱125,000',
      satisfaction: 92
    },
    {
      name: 'South Caloocan',
      location: 'South Caloocan City',
      status: 'Active',
      manager: 'Shawn Cabutin',
      staff: 12,
      mechanics: 6,
      bayUtilization: 78,
      services: 320,
      revenue: '₱98,000',
      satisfaction: 88
    },
    {
      name: 'Quezon City',
      location: 'Quezon City, Metro Manila',
      status: 'Active',
      manager: 'John Charles Aguilar',
      staff: 9,
      mechanics: 5,
      bayUtilization: 74,
      services: 265,
      revenue: '₱82,000',
      satisfaction: 90
    },
    {
      name: 'North Caloocan',
      location: 'North Caloocan City',
      status: 'Active',
      manager: 'Jerald Galdiano',
      staff: 10,
      mechanics: 5,
      bayUtilization: 72,
      services: 280,
      revenue: '₱87,000',
      satisfaction: 85
    },
    {
      name: 'Camarin',
      location: 'Camarin, Caloocan City',
      status: 'Active',
      manager: 'Maria Santos',
      staff: 8,
      mechanics: 4,
      bayUtilization: 68,
      services: 210,
      revenue: '₱65,000',
      satisfaction: 87
    }
  ];

  return (
    <AdminLayout 
      title="Multi-Branch Management" 
      subtitle="Monitor and compare performance across all branches"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {branches.map((branch, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-shadow duration-200">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{branch.name}</h3>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{branch.location}</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                {branch.status}
              </span>
            </div>

            {/* Manager */}
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-1">Manager</p>
              <p className="font-semibold text-gray-900">{branch.manager}</p>
            </div>

            {/* Staff & Mechanics */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className="text-sm text-gray-600">Staff</span>
                </div>
                <p className="text-xl font-bold text-gray-900">{branch.staff}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm text-gray-600">Mechanics</span>
                </div>
                <p className="text-xl font-bold text-gray-900">{branch.mechanics}</p>
              </div>
            </div>

            {/* Bay Utilization */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Bay Utilization</span>
                <span className="text-sm font-semibold text-gray-900">{branch.bayUtilization}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${branch.bayUtilization}%` }}
                ></div>
              </div>
            </div>

            {/* Metrics */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Services</span>
                <span className="font-semibold text-gray-900">{branch.services}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Revenue</span>
                <span className="font-semibold text-gray-900">{branch.revenue}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Satisfaction</span>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="font-semibold text-gray-900">{branch.satisfaction}%</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200">
                View Details
              </button>
              <button className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors duration-200">
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}

export default AdminBranches;