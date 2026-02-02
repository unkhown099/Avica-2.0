import React, { useState } from 'react';
import AdminLayout from './AdminLayout';

function AdminInventory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');

  // Inventory stats
  const stats = [
    {
      label: 'Total Items',
      value: '5',
      subtitle: 'Across all branches',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      iconColor: 'text-red-600',
      iconBg: 'bg-red-100'
    },
    {
      label: 'Inventory Value',
      value: '₱161,550',
      subtitle: 'Total stock value',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      iconColor: 'text-gray-900',
      iconBg: 'bg-gray-100'
    },
    {
      label: 'Low Stock Alert',
      value: '3',
      subtitle: 'Items need reordering',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      iconColor: 'text-red-600',
      iconBg: 'bg-red-100'
    }
  ];

  // Low stock items
  const lowStockItems = [
    {
      name: 'Brake Pads Set',
      current: 12,
      minimum: 15,
      unit: 'Sets'
    },
    {
      name: 'Air Filter',
      current: 8,
      minimum: 10,
      unit: 'Pieces'
    },
    {
      name: 'Battery 12V 60Ah',
      current: 5,
      minimum: 8,
      unit: 'Pieces'
    }
  ];

  // Inventory items
  const [inventoryItems] = useState([
    {
      id: 'INV-001',
      name: 'Engine Oil 5W-30',
      category: 'Lubricants',
      sku: 'EO-5W30-001',
      quantity: 45,
      unit: 'Liters',
      price: '₱450',
      supplier: 'Shell Philippines',
      status: 'In Stock'
    },
    {
      id: 'INV-002',
      name: 'Brake Pads Set',
      category: 'Brakes',
      sku: 'BP-SET-002',
      quantity: 12,
      unit: 'Sets',
      price: '₱2,500',
      supplier: 'Brembo',
      status: 'Low Stock'
    },
    {
      id: 'INV-003',
      name: 'Air Filter',
      category: 'Filters',
      sku: 'AF-STD-003',
      quantity: 8,
      unit: 'Pieces',
      price: '₱350',
      supplier: 'Mann Filter',
      status: 'Low Stock'
    },
    {
      id: 'INV-004',
      name: 'Battery 12V 60Ah',
      category: 'Batteries',
      sku: 'BAT-12V-004',
      quantity: 5,
      unit: 'Pieces',
      price: '₱4,200',
      supplier: 'Motolite',
      status: 'Low Stock'
    },
    {
      id: 'INV-005',
      name: 'Tire 195/65R15',
      category: 'Tires',
      sku: 'TR-195-005',
      quantity: 24,
      unit: 'Pieces',
      price: '₱3,500',
      supplier: 'Bridgestone',
      status: 'In Stock'
    }
  ]);

  const getStatusBadge = (status) => {
    if (status === 'In Stock') {
      return (
        <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700 border border-green-200">
          In Stock
        </span>
      );
    }
    return (
      <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700 border border-red-200">
        Low Stock
      </span>
    );
  };

  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'All Categories' || item.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <AdminLayout 
      title="Inventory Management" 
      subtitle="Track and manage parts and supplies inventory"
    >
      {/* Header with Add Item Button */}
      <div className="flex items-center justify-end mb-8">
        <button className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2 transition-colors duration-200">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Item
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
                <p className="text-sm text-gray-500 mt-1">{stat.subtitle}</p>
              </div>
              <div className={`${stat.iconBg} ${stat.iconColor} p-3 rounded-lg`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Low Stock Alert */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-lg font-bold text-gray-900">Low Stock Alert</h2>
        </div>

        <div className="space-y-3">
          {lowStockItems.map((item, index) => (
            <div key={index} className="bg-white rounded-lg p-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-600">Current: {item.current} {item.unit} | Min: {item.minimum} {item.unit}</p>
              </div>
              <button className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors duration-200">
                Reorder
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Inventory Items */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Inventory Items</h2>
          
          {/* Search and Filter */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by name, SKU, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:ring-2 focus:ring-red-500 focus:border-transparent cursor-pointer"
              >
                <option>All Categories</option>
                <option>Lubricants</option>
                <option>Brakes</option>
                <option>Filters</option>
                <option>Batteries</option>
                <option>Tires</option>
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
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Item ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Category</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">SKU</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Quantity</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Unit Price</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Supplier</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{item.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{item.category}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{item.sku}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{item.quantity} {item.unit}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{item.price}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{item.supplier}</td>
                  <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
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
        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminInventory;