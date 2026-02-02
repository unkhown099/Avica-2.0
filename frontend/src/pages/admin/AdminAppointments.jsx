import React, { useState } from 'react';
import AdminLayout from './AdminLayout';

function AdminAppointments() {
  const [selectedDate, setSelectedDate] = useState(2);
  const [currentMonth] = useState('February 2026');

  // Calendar days
  const calendarDays = [
    { day: 1, appointments: [] },
    { day: 2, appointments: ['confirmed', 'pending'] },
    { day: 3, appointments: [] },
    { day: 4, appointments: [] },
    { day: 5, appointments: [] },
    { day: 6, appointments: [] },
    { day: 7, appointments: [] },
    { day: 8, appointments: [] },
    { day: 9, appointments: [] },
    { day: 10, appointments: [] },
    { day: 11, appointments: [] },
    { day: 12, appointments: [] },
    { day: 13, appointments: [] },
    { day: 14, appointments: [] },
    { day: 15, appointments: [] },
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

  // Today's appointments
  const todaysAppointments = [
    {
      customer: 'John Doe',
      status: 'Confirmed',
      vehicle: 'Toyota Corolla 2020',
      time: '09:00 AM',
      service: 'Oil Change',
      branch: 'San Mateo Rizal',
      mechanic: 'Mike Johnson'
    },
    {
      customer: 'Jane Smith',
      status: 'Pending',
      vehicle: 'Honda Civic 2019',
      time: '11:00 AM',
      service: 'Brake Inspection',
      branch: 'South Caloocan',
      mechanic: 'Unassigned'
    }
  ];

  // Time slots
  const timeSlots = [
    { time: '08:00 AM', status: 'available' },
    { time: '09:00 AM', status: 'booked' },
    { time: '10:00 AM', status: 'available' },
    { time: '11:00 AM', status: 'booked' },
    { time: '01:00 PM', status: 'available' }
  ];

  const getStatusBadge = (status) => {
    if (status === 'Confirmed') {
      return (
        <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-red-600 text-white">
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
      title="Appointment Scheduling" 
      subtitle="Manage service appointments and schedules"
    >
      {/* Header with New Appointment Button */}
      <div className="flex items-center justify-end mb-8">
        <button className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2 transition-colors duration-200">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Appointment
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
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
            {calendarDays.map((item) => (
              <button
                key={item.day}
                onClick={() => setSelectedDate(item.day)}
                className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                  selectedDate === item.day
                    ? 'bg-red-600 text-white'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                {item.day}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-red-600 rounded-full"></div>
              <span className="text-gray-600">Confirmed Appointments</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span className="text-gray-600">Pending Appointments</span>
            </div>
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Today's Appointments - 2026-01-27</h2>

            <div className="space-y-4">
              {todaysAppointments.map((apt, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{apt.customer}</h3>
                        {getStatusBadge(apt.status)}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{apt.vehicle}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{apt.time}</span>
                        </div>
                        <div className="text-sm text-gray-600"><strong>Service:</strong> {apt.service}</div>
                        <div className="text-sm text-gray-600"><strong>Branch:</strong> {apt.branch}</div>
                        <div className="text-sm text-gray-600"><strong>Mechanic:</strong> {apt.mechanic}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium">
                        View
                      </button>
                      <button className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium">
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Time Slot Availability */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Time Slot Availability - 2026-01-27</h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {timeSlots.map((slot, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 text-center ${
                    slot.status === 'available'
                      ? 'border-gray-300 hover:border-red-600 cursor-pointer transition-colors'
                      : 'border-gray-200 bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="font-semibold text-gray-900">{slot.time}</div>
                  {slot.status === 'booked' && (
                    <div className="text-xs text-gray-500 mt-1">Booked</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminAppointments;