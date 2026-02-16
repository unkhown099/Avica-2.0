import React, { useState } from 'react';
import AdminLayout from './AdminLayout';

function AdminAppointments() {
  const [selectedDate, setSelectedDate] = useState(2);
  const [currentMonth] = useState('February 2026');
  const [branchFilter, setBranchFilter] = useState('All Branches');

  // Calendar days
  const calendarDays = [
    { day: 1, appointments: [] },
    { day: 2, appointments: ['confirmed', 'pending'] },
    { day: 3, appointments: [] },
    { day: 4, appointments: ['confirmed'] },
    { day: 5, appointments: [] },
    { day: 6, appointments: [] },
    { day: 7, appointments: ['pending'] },
    { day: 8, appointments: [] },
    { day: 9, appointments: [] },
    { day: 10, appointments: ['confirmed'] },
    { day: 11, appointments: [] },
    { day: 12, appointments: [] },
    { day: 13, appointments: [] },
    { day: 14, appointments: [] },
    { day: 15, appointments: ['confirmed', 'pending'] },
    { day: 16, appointments: [] },
    { day: 17, appointments: [] },
    { day: 18, appointments: [] },
    { day: 19, appointments: [] },
    { day: 20, appointments: [] },
    { day: 21, appointments: [] },
    { day: 22, appointments: [] },
    { day: 23, appointments: [] },
    { day: 24, appointments: [] },
    { day: 25, appointments: [] },
    { day: 26, appointments: [] },
    { day: 27, appointments: [] },
    { day: 28, appointments: [] }
  ];

  // All appointments with dates
  const allAppointments = [
    {
      date: 2,
      customer: 'John Doe',
      status: 'Confirmed',
      vehicle: 'Toyota Corolla 2020',
      time: '09:00 AM',
      service: 'Oil Change',
      branch: 'San Mateo Rizal',
      mechanic: 'Mike Johnson'
    },
    {
      date: 2,
      customer: 'Jane Smith',
      status: 'Pending',
      vehicle: 'Honda Civic 2019',
      time: '11:00 AM',
      service: 'Brake Inspection',
      branch: 'South Caloocan',
      mechanic: 'Unassigned'
    },
    {
      date: 4,
      customer: 'Robert Wilson',
      status: 'Confirmed',
      vehicle: 'Ford Ranger 2021',
      time: '10:00 AM',
      service: 'Engine Diagnostic',
      branch: 'North Caloocan',
      mechanic: 'Sarah Connor'
    },
    {
      date: 7,
      customer: 'Emily Brown',
      status: 'Pending',
      vehicle: 'Nissan Altima 2022',
      time: '02:00 PM',
      service: 'Tire Replacement',
      branch: 'Quezon City',
      mechanic: 'Tom Hardy'
    },
    {
      date: 10,
      customer: 'Michael Chen',
      status: 'Confirmed',
      vehicle: 'Mazda 3 2020',
      time: '08:00 AM',
      service: 'Full Service',
      branch: 'San Mateo Rizal',
      mechanic: 'Mike Johnson'
    },
    {
      date: 15,
      customer: 'Sarah Johnson',
      status: 'Confirmed',
      vehicle: 'Hyundai Tucson 2021',
      time: '01:00 PM',
      service: 'AC Service',
      branch: 'South Caloocan',
      mechanic: 'Lisa Davis'
    },
    {
      date: 15,
      customer: 'David Martinez',
      status: 'Pending',
      vehicle: 'Kia Sportage 2022',
      time: '03:00 PM',
      service: 'Battery Replacement',
      branch: 'Quezon City',
      mechanic: 'Unassigned'
    }
  ];

  // Filter appointments by selected date and branch
  const filteredAppointments = allAppointments.filter(apt => {
    const matchesDate = apt.date === selectedDate;
    const matchesBranch = branchFilter === 'All Branches' || apt.branch === branchFilter;
    return matchesDate && matchesBranch;
  });

  const getStatusBadge = (status) => {
    if (status === 'Confirmed') {
      return (
        <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
          Confirmed
        </span>
      );
    }
    return (
      <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
        Pending
      </span>
    );
  };

  return (
    <AdminLayout 
      title="" 
      subtitle=""
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900 -m-8 p-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Appointments</h1>
          <p className="text-slate-300">Manage service appointments and schedules</p>
        </div>

        {/* Branch Filter */}
        <div className="mb-6">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20 inline-block">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Filter by Branch:</label>
              <div className="relative">
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-red-500 focus:border-transparent cursor-pointer"
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-6">
              <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h2 className="text-lg font-bold text-gray-900">Calendar</h2>
            </div>

            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h3 className="font-semibold text-gray-900">{currentMonth}</h3>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((item) => {
                const hasAppointments = item.appointments.length > 0;
                return (
                  <button
                    key={item.day}
                    onClick={() => setSelectedDate(item.day)}
                    className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm font-medium transition-all relative ${
                      selectedDate === item.day
                        ? 'bg-red-600 text-white shadow-md'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span>{item.day}</span>
                    {hasAppointments && (
                      <div className="flex gap-0.5 mt-1">
                        {item.appointments.map((apt, idx) => (
                          <div
                            key={idx}
                            className={`w-1.5 h-1.5 rounded-full ${
                              selectedDate === item.day
                                ? 'bg-white'
                                : apt === 'confirmed'
                                ? 'bg-emerald-500'
                                : 'bg-yellow-500'
                            }`}
                          ></div>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-gray-600">Confirmed Appointments</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-600">Pending Appointments</span>
              </div>
            </div>
          </div>

          {/* Selected Date's Appointments */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">
                  Appointments - February {selectedDate}, 2026
                </h2>
                <span className="text-sm text-gray-600">
                  {filteredAppointments.length} {filteredAppointments.length === 1 ? 'appointment' : 'appointments'}
                </span>
              </div>

              <div className="space-y-4">
                {filteredAppointments.map((apt, index) => (
                  <div key={index} className="border-2 border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-bold text-gray-900">{apt.customer}</h3>
                          {getStatusBadge(apt.status)}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span className="font-medium">{apt.vehicle}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">{apt.time}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{apt.service}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{apt.branch}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>Mechanic: {apt.mechanic}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium border border-gray-300">
                          View
                        </button>
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium">
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Empty State */}
              {filteredAppointments.length === 0 && (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No appointments scheduled</h3>
                  <p className="text-gray-600">There are no appointments for this date</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminAppointments;