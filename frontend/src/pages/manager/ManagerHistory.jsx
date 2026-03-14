import React, { useState } from 'react';
import ManagerLayout from './ManagerLayout';

function ManagerHistory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState('All Services');
  const [statusFilter, setStatusFilter] = useState('All Status');

  const serviceHistory = [
    { id: 'SH-001', date: '2026-02-20', customer: 'John Doe',      vehicle: 'Toyota Corolla 2020', service: 'Oil Change',          mechanic: 'Mike Johnson',  duration: '45 mins',   amount: '₱1,200', status: 'Completed' },
    { id: 'SH-002', date: '2026-02-20', customer: 'Jane Smith',     vehicle: 'Honda Civic 2019',   service: 'Brake Inspection',    mechanic: 'Sarah Connor',  duration: '1.5 hours', amount: '₱2,500', status: 'Completed' },
    { id: 'SH-003', date: '2026-02-19', customer: 'Robert Wilson',  vehicle: 'Ford Ranger 2021',   service: 'Engine Diagnostic',   mechanic: 'Mike Johnson',  duration: '1 hour',    amount: '₱1,800', status: 'Completed' },
    { id: 'SH-004', date: '2026-02-19', customer: 'Emily Brown',    vehicle: 'Nissan Altima 2022', service: 'Tire Replacement',    mechanic: 'Lisa Davis',    duration: '1 hour',    amount: '₱4,500', status: 'Completed' },
    { id: 'SH-005', date: '2026-02-18', customer: 'Michael Chen',   vehicle: 'Mazda 3 2020',       service: 'Full Service',        mechanic: 'Mike Johnson',  duration: '2 hours',   amount: '₱3,800', status: 'Completed' },
    { id: 'SH-006', date: '2026-02-18', customer: 'Sarah Johnson',  vehicle: 'Hyundai Tucson 2021',service: 'AC Service',          mechanic: 'Sarah Connor',  duration: '1.5 hours', amount: '₱2,200', status: 'Completed' },
    { id: 'SH-007', date: '2026-02-17', customer: 'David Martinez', vehicle: 'Kia Sportage 2022',  service: 'Battery Replacement', mechanic: 'Lisa Davis',    duration: '30 mins',   amount: '₱4,800', status: 'Completed' },
    { id: 'SH-008', date: '2026-02-17', customer: 'Patricia Lee',   vehicle: 'Toyota Vios 2021',   service: 'Brake Repair',        mechanic: 'Mike Johnson',  duration: '2 hours',   amount: '₱3,200', status: 'Completed' },
    { id: 'SH-009', date: '2026-02-16', customer: 'James Wilson',   vehicle: 'Honda CR-V 2020',    service: 'Oil Change',          mechanic: 'Sarah Connor',  duration: '40 mins',   amount: '₱1,100', status: 'Completed' },
    { id: 'SH-010', date: '2026-02-16', customer: 'Linda Garcia',   vehicle: 'Nissan Navara 2022', service: 'Engine Repair',       mechanic: 'Mike Johnson',  duration: '3 hours',   amount: '₱8,500', status: 'Completed' },
    { id: 'SH-011', date: '2026-02-15', customer: 'Kevin Moore',    vehicle: 'Mazda CX-5 2021',    service: 'Transmission Service',mechanic: 'Lisa Davis',    duration: '2.5 hours', amount: '₱5,200', status: 'Completed' },
    { id: 'SH-012', date: '2026-02-15', customer: 'Susan Taylor',   vehicle: 'Ford Everest 2020',  service: 'Tire Rotation',       mechanic: 'Sarah Connor',  duration: '45 mins',   amount: '₱800',   status: 'Completed' },
  ];

  const totalRevenue = serviceHistory.reduce((s, r) => s + parseInt(r.amount.replace(/[₱,]/g, '')), 0);

  const filteredHistory = serviceHistory.filter(r =>
    (r.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
     r.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
     r.id.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (serviceFilter === 'All Services' || r.service === serviceFilter) &&
    (statusFilter === 'All Status' || r.status === statusFilter)
  );

  return (
    <ManagerLayout title="" subtitle="">
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8">

        <div className="mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight">Service History</h1>
          <p className="text-gray-400 mt-1">View completed services for San Mateo Rizal branch</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Services', value: serviceHistory.length,                                         color: '#ef4444', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /> },
            { label: 'Total Revenue',  value: `₱${totalRevenue.toLocaleString()}`,                           color: '#3b82f6', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
            { label: 'Completed',      value: serviceHistory.filter(s => s.status === 'Completed').length,   color: '#10b981', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /> },
          ].map(stat => (
            <div key={stat.label} className="bg-gray-900/60 border border-white/5 rounded-2xl p-5 backdrop-blur-sm hover:border-white/10 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 rounded-xl" style={{ backgroundColor: stat.color + '22' }}>
                  <svg className="w-5 h-5" style={{ color: stat.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">{stat.icon}</svg>
                </div>
              </div>
              <div className="text-2xl font-black text-white mb-1">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Search by customer, vehicle, or ID..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900/60 border border-white/10 text-white placeholder-gray-500 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all" />
          </div>
          {[
            { value: serviceFilter, onChange: setServiceFilter, options: ['All Services','Oil Change','Brake Inspection','Engine Diagnostic','Tire Replacement','Full Service','AC Service','Battery Replacement','Brake Repair'] },
            { value: statusFilter,  onChange: setStatusFilter,  options: ['All Status','Completed','Pending'] },
          ].map((sel, i) => (
            <select key={i} value={sel.value} onChange={e => sel.onChange(e.target.value)}
              className="bg-gray-900/60 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all cursor-pointer min-w-[150px]">
              {sel.options.map(o => <option key={o}>{o}</option>)}
            </select>
          ))}
        </div>

        {/* Table */}
        <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="grid grid-cols-12 gap-3 px-6 py-4 border-b border-white/5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div className="col-span-1">Date</div>
            <div className="col-span-2">Customer</div>
            <div className="col-span-2">Vehicle</div>
            <div className="col-span-2">Service</div>
            <div className="col-span-1">Mechanic</div>
            <div className="col-span-1">Duration</div>
            <div className="col-span-1">Amount</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1 text-right">Act.</div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="py-20 text-center">
              <svg className="w-12 h-12 text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-500 text-lg">No records found</p>
              <p className="text-gray-600 text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          ) : filteredHistory.map(record => (
            <div key={record.id} className="grid grid-cols-12 gap-3 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center group">
              <div className="col-span-1 text-gray-500 text-xs">{record.date.slice(5)}</div>
              <div className="col-span-2 text-white font-semibold text-sm">{record.customer}</div>
              <div className="col-span-2 text-gray-400 text-sm truncate">{record.vehicle}</div>
              <div className="col-span-2 text-gray-400 text-sm">{record.service}</div>
              <div className="col-span-1 text-gray-500 text-xs">{record.mechanic.split(' ')[0]}</div>
              <div className="col-span-1 text-gray-500 text-xs">{record.duration}</div>
              <div className="col-span-1 text-white font-bold text-sm">{record.amount}</div>
              <div className="col-span-1">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold border bg-emerald-500/20 text-emerald-400 border-emerald-500/30">{record.status}</span>
              </div>
              <div className="col-span-1 flex justify-end">
                <button className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}

          {filteredHistory.length > 0 && (
            <div className="px-6 py-4">
              <p className="text-gray-500 text-sm">
                Showing <span className="text-white font-semibold">{filteredHistory.length}</span> of <span className="text-white font-semibold">{serviceHistory.length}</span> records
              </p>
            </div>
          )}
        </div>
      </div>
    </ManagerLayout>
  );
}

export default ManagerHistory;