import React, { useState } from 'react';
import StaffLayout from './StaffLayout';

function StaffAppointments() {
  const [showAddWalkIn, setShowAddWalkIn] = useState(false);
  const [selectedDate, setSelectedDate] = useState(2);
  const [currentMonth] = useState('February 2026');

  // Form state for walk-in customer
  const [walkInForm, setWalkInForm] = useState({
    customerName: '',
    phone: '',
    email: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    plateNumber: '',
    service: '',
    notes: ''
  });

  // Calendar days
  const calendarDays = Array.from({ length: 28 }, (_, i) => ({
    day: i + 1,
    appointments: i === 1 ? ['confirmed', 'pending'] : i === 3 ? ['confirmed'] : i === 6 ? ['pending'] : i === 9 ? ['confirmed'] : i === 14 ? ['confirmed', 'pending'] : []
  }));

  // Appointments for San Mateo Rizal branch
  const allAppointments = [
    { date: 2, customer: 'John Doe', status: 'Confirmed', vehicle: 'Toyota Corolla 2020', time: '09:00 AM', service: 'Oil Change', mechanic: 'Mike Johnson', type: 'Scheduled' },
    { date: 2, customer: 'Jane Smith', status: 'Pending', vehicle: 'Honda Civic 2019', time: '11:00 AM', service: 'Brake Inspection', mechanic: 'Unassigned', type: 'Walk-in' },
    { date: 4, customer: 'Robert Wilson', status: 'Confirmed', vehicle: 'Ford Ranger 2021', time: '10:00 AM', service: 'Engine Diagnostic', mechanic: 'Sarah Connor', type: 'Scheduled' },
    { date: 7, customer: 'Emily Brown', status: 'Pending', vehicle: 'Nissan Altima 2022', time: '02:00 PM', service: 'Tire Replacement', mechanic: 'Tom Hardy', type: 'Walk-in' },
    { date: 10, customer: 'Michael Chen', status: 'Confirmed', vehicle: 'Mazda 3 2020', time: '08:00 AM', service: 'Full Service', mechanic: 'Mike Johnson', type: 'Scheduled' },
    { date: 15, customer: 'Sarah Johnson', status: 'Confirmed', vehicle: 'Hyundai Tucson 2021', time: '01:00 PM', service: 'AC Service', mechanic: 'Lisa Davis', type: 'Scheduled' },
    { date: 15, customer: 'David Martinez', status: 'Pending', vehicle: 'Kia Sportage 2022', time: '03:00 PM', service: 'Battery Replacement', mechanic: 'Unassigned', type: 'Walk-in' }
  ];

  const filteredAppointments = allAppointments.filter(apt => apt.date === selectedDate);

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

  const getTypeBadge = (type) => {
    if (type === 'Walk-in') {
      return (
        <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
          Walk-in
        </span>
      );
    }
    return (
      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
        Scheduled
      </span>
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setWalkInForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitWalkIn = (e) => {
    e.preventDefault();
    // Here you would handle the form submission
    console.log('Walk-in customer added:', walkInForm);
    // Reset form and close modal
    setWalkInForm({
      customerName: '',
      phone: '',
      email: '',
      vehicleMake: '',
      vehicleModel: '',
      vehicleYear: '',
      plateNumber: '',
      service: '',
      notes: ''
    });
    setShowAddWalkIn(false);
    // Show success message (you can implement this with a toast notification)
    alert('Walk-in customer added successfully!');
  };

  return (
    <StaffLayout 
      title="" 
      subtitle=""
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900 -m-8 p-8">
        {/* Page Title */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Appointments</h1>
            <p className="text-slate-300">View appointments and add walk-in customers</p>
          </div>
          <button
            onClick={() => setShowAddWalkIn(true)}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors duration-200 shadow-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Add Walk-in Customer
          </button>
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

            <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-gray-600">Confirmed</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-600">Pending</span>
              </div>
            </div>
          </div>

          {/* Appointments List */}
          <div className="lg:col-span-2">
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
                          {getTypeBadge(apt.type)}
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
                      </div>
                    </div>
                  </div>
                ))}
              </div>

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

        {/* Add Walk-in Customer Modal */}
        {showAddWalkIn && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                <h2 className="text-2xl font-bold text-gray-900">Add Walk-in Customer</h2>
                <button
                  onClick={() => setShowAddWalkIn(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmitWalkIn} className="p-6">
                {/* Customer Information */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Customer Name *
                      </label>
                      <input
                        type="text"
                        name="customerName"
                        value={walkInForm.customerName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Enter customer name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={walkInForm.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="0917-XXX-XXXX"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={walkInForm.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="customer@email.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vehicle Make *
                      </label>
                      <input
                        type="text"
                        name="vehicleMake"
                        value={walkInForm.vehicleMake}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="e.g., Toyota"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vehicle Model *
                      </label>
                      <input
                        type="text"
                        name="vehicleModel"
                        value={walkInForm.vehicleModel}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="e.g., Corolla"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Year *
                      </label>
                      <input
                        type="text"
                        name="vehicleYear"
                        value={walkInForm.vehicleYear}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="e.g., 2020"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Plate Number *
                      </label>
                      <input
                        type="text"
                        name="plateNumber"
                        value={walkInForm.plateNumber}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="ABC 1234"
                      />
                    </div>
                  </div>
                </div>

                {/* Service Information */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Service Required *
                      </label>
                      <select
                        name="service"
                        value={walkInForm.service}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      >
                        <option value="">Select a service</option>
                        <option value="Oil Change">Oil Change</option>
                        <option value="Brake Inspection">Brake Inspection</option>
                        <option value="Engine Diagnostic">Engine Diagnostic</option>
                        <option value="Tire Replacement">Tire Replacement</option>
                        <option value="Full Service">Full Service</option>
                        <option value="AC Service">AC Service</option>
                        <option value="Battery Replacement">Battery Replacement</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Notes
                      </label>
                      <textarea
                        name="notes"
                        value={walkInForm.notes}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Any additional information..."
                      ></textarea>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowAddWalkIn(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Add Walk-in Customer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </StaffLayout>
  );
}

export default StaffAppointments;