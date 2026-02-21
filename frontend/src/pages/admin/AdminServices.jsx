import React, { useState } from 'react';
import AdminLayout from './AdminLayout';

function AdminServices() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [branchFilter, setBranchFilter] = useState('All Branches');

  // Services available at the shop
  const [services] = useState([
    {
      id: 'SRV-001',
      name: 'Oil Change',
      category: 'Maintenance',
      description: 'Complete engine oil and filter replacement',
      duration: '30-45 mins',
      price: '₱1,500 - ₱2,500',
      status: 'Active',
      branches: ['San Mateo Rizal', 'South Caloocan', 'North Caloocan', 'Quezon City']
    },
    {
      id: 'SRV-002',
      name: 'Brake Repair',
      category: 'Repair',
      description: 'Brake pad replacement and system inspection',
      duration: '1-2 hours',
      price: '₱3,500 - ₱8,500',
      status: 'Active',
      branches: ['San Mateo Rizal', 'North Caloocan', 'Quezon City']
    },
    {
      id: 'SRV-003',
      name: 'Engine Diagnostic',
      category: 'Diagnostic',
      description: 'Complete engine system diagnostic check',
      duration: '45-60 mins',
      price: '₱2,000 - ₱3,500',
      status: 'Active',
      branches: ['San Mateo Rizal', 'South Caloocan', 'Quezon City']
    },
    {
      id: 'SRV-004',
      name: 'Tire Replacement',
      category: 'Maintenance',
      description: 'Tire installation, balancing, and alignment',
      duration: '1-1.5 hours',
      price: '₱8,000 - ₱15,000',
      status: 'Active',
      branches: ['San Mateo Rizal', 'South Caloocan', 'North Caloocan', 'Quezon City']
    },
    {
      id: 'SRV-005',
      name: 'AC Service',
      category: 'Maintenance',
      description: 'Air conditioning system cleaning and recharge',
      duration: '1-2 hours',
      price: '₱2,500 - ₱5,000',
      status: 'Active',
      branches: ['South Caloocan', 'Quezon City']
    },
    {
      id: 'SRV-006',
      name: 'Transmission Repair',
      category: 'Repair',
      description: 'Transmission system inspection and repair',
      duration: '3-5 hours',
      price: '₱15,000 - ₱35,000',
      status: 'Inactive',
      branches: ['San Mateo Rizal']
    },
    {
      id: 'SRV-007',
      name: 'Battery Replacement',
      category: 'Maintenance',
      description: 'Battery testing and replacement service',
      duration: '20-30 mins',
      price: '₱3,000 - ₱8,000',
      status: 'Active',
      branches: ['San Mateo Rizal', 'South Caloocan', 'North Caloocan', 'Quezon City']
    },
    {
      id: 'SRV-008',
      name: 'Body Work & Paint',
      category: 'Cosmetic',
      description: 'Dent removal, painting, and detailing',
      duration: '1-3 days',
      price: '₱10,000 - ₱50,000',
      status: 'Active',
      branches: ['San Mateo Rizal', 'North Caloocan']
    }
  ]);

  const getStatusBadge = (status) => {
    if (status === 'Active') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Active
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 border border-gray-200">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          Inactive
        </span>
      );
    }
  };

  const getCategoryBadge = (category) => {
    const categoryStyles = {
      'Maintenance': 'bg-blue-50 text-blue-700 border-blue-200',
      'Repair': 'bg-red-50 text-red-700 border-red-200',
      'Diagnostic': 'bg-purple-50 text-purple-700 border-purple-200',
      'Cosmetic': 'bg-pink-50 text-pink-700 border-pink-200'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${categoryStyles[category]}`}>
        {category}
      </span>
    );
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = 
      service.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'All Categories' || service.category === categoryFilter;
    
    const matchesBranch = branchFilter === 'All Branches' || service.branches.includes(branchFilter);
    
    return matchesSearch && matchesCategory && matchesBranch;
  });

  return (
    <AdminLayout 
      title="" 
      subtitle=""
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900 -m-8 p-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Services</h1>
          <p className="text-slate-300">Manage services available at your shop</p>
        </div>

        {/* Header with Add Service Button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Available Services</h2>
          </div>
          <button className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2 transition-colors duration-200 shadow-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Service
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 mb-6">
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
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter Dropdown */}
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:ring-2 focus:ring-red-500 focus:border-transparent cursor-pointer"
              >
                <option>All Categories</option>
                <option>Maintenance</option>
                <option>Repair</option>
                <option>Diagnostic</option>
                <option>Cosmetic</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Branch Filter Dropdown */}
            <div className="relative">
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:ring-2 focus:ring-red-500 focus:border-transparent cursor-pointer"
              >
                <option>All Branches</option>
                <option>San Mateo Rizal</option>
                <option>South Caloocan</option>
                <option>North Caloocan</option>
                <option>Quezon City</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {filteredServices.map((service) => (
            <div key={service.id} className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getCategoryBadge(service.category)}
                    {getStatusBadge(service.status)}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{service.name}</h3>
                  <p className="text-sm text-gray-500">{service.id}</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-600 text-sm mb-4">{service.description}</p>

              {/* Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-600">Duration: <span className="font-medium text-gray-900">{service.duration}</span></span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-600">Price: <span className="font-semibold text-gray-900">{service.price}</span></span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div className="flex-1">
                    <span className="text-gray-600">Available at:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {service.branches.map((branch, index) => (
                        <span key={index} className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-md border border-slate-200">
                          {branch}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors duration-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-medium px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors duration-200">
                  {/* <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg> */}
                  Deactivate
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredServices.length === 0 && (
          <div className="bg-white rounded-xl p-12 shadow-lg border border-gray-200">
            <div className="text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No services found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          </div>
        )}

        {/* Results Summary */}
        {filteredServices.length > 0 && (
          <div className="mt-4 text-sm text-slate-300">
            Showing {filteredServices.length} of {services.length} services
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminServices;