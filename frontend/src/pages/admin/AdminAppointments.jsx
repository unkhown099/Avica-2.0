import React, { useState } from "react";
import AdminLayout from "./AdminLayout";

function AdminAppointments() {
  const [selectedDate, setSelectedDate] = useState(2);
  const [currentMonth] = useState("February 2026");
  const [branchFilter, setBranchFilter] = useState("All Branches");

  const calendarDays = [
    { day: 1, appointments: [] },
    { day: 2, appointments: ["confirmed", "pending"] },
    { day: 3, appointments: [] },
    { day: 4, appointments: ["confirmed"] },
    { day: 5, appointments: [] },
    { day: 6, appointments: [] },
    { day: 7, appointments: ["pending"] },
    { day: 8, appointments: [] },
    { day: 9, appointments: [] },
    { day: 10, appointments: ["confirmed"] },
    { day: 11, appointments: [] },
    { day: 12, appointments: [] },
    { day: 13, appointments: [] },
    { day: 14, appointments: [] },
    { day: 15, appointments: ["confirmed", "pending"] },
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
    { day: 28, appointments: [] },
  ];

  const allAppointments = [
    {
      date: 2,
      customer: "John Doe",
      status: "Confirmed",
      vehicle: "Toyota Corolla 2020",
      time: "09:00 AM",
      service: "Oil Change",
      branch: "San Mateo Rizal",
      mechanic: "Mike Johnson",
    },
    {
      date: 2,
      customer: "Jane Smith",
      status: "Pending",
      vehicle: "Honda Civic 2019",
      time: "11:00 AM",
      service: "Brake Inspection",
      branch: "South Caloocan",
      mechanic: "Unassigned",
    },
    {
      date: 4,
      customer: "Robert Wilson",
      status: "Confirmed",
      vehicle: "Ford Ranger 2021",
      time: "10:00 AM",
      service: "Engine Diagnostic",
      branch: "North Caloocan",
      mechanic: "Sarah Connor",
    },
    {
      date: 7,
      customer: "Emily Brown",
      status: "Pending",
      vehicle: "Nissan Altima 2022",
      time: "02:00 PM",
      service: "Tire Replacement",
      branch: "Quezon City",
      mechanic: "Tom Hardy",
    },
    {
      date: 10,
      customer: "Michael Chen",
      status: "Confirmed",
      vehicle: "Mazda 3 2020",
      time: "08:00 AM",
      service: "Full Service",
      branch: "San Mateo Rizal",
      mechanic: "Mike Johnson",
    },
    {
      date: 15,
      customer: "Sarah Johnson",
      status: "Confirmed",
      vehicle: "Hyundai Tucson 2021",
      time: "01:00 PM",
      service: "AC Service",
      branch: "South Caloocan",
      mechanic: "Lisa Davis",
    },
    {
      date: 15,
      customer: "David Martinez",
      status: "Pending",
      vehicle: "Kia Sportage 2022",
      time: "03:00 PM",
      service: "Battery Replacement",
      branch: "Quezon City",
      mechanic: "Unassigned",
    },
  ];

  const filteredAppointments = allAppointments.filter(
    (a) =>
      a.date === selectedDate &&
      (branchFilter === "All Branches" || a.branch === branchFilter),
  );

  const statusStyle = {
    Confirmed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    Pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  };

  const confirmedCount = allAppointments.filter(
    (a) => a.status === "Confirmed",
  ).length;
  const pendingCount = allAppointments.filter(
    (a) => a.status === "Pending",
  ).length;

  return (
    <AdminLayout title="" subtitle="">
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Appointments
            </h1>
            <p className="text-gray-400 mt-1">
              Manage service appointments and schedules
            </p>
          </div>
        </div>

        {/* Stats + Branch Filter Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-4 backdrop-blur-sm">
            <div className="text-2xl font-black text-white mb-1">
              {allAppointments.length}
            </div>
            <div className="text-xs text-gray-400">Total This Month</div>
          </div>
          <div className="bg-gray-900/60 border border-emerald-500/20 rounded-2xl p-4 backdrop-blur-sm">
            <div className="text-2xl font-black text-emerald-400 mb-1">
              {confirmedCount}
            </div>
            <div className="text-xs text-gray-400">Confirmed</div>
          </div>
          <div className="bg-gray-900/60 border border-amber-500/20 rounded-2xl p-4 backdrop-blur-sm">
            <div className="text-2xl font-black text-amber-400 mb-1">
              {pendingCount}
            </div>
            <div className="text-xs text-gray-400">Pending</div>
          </div>
          <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-4 backdrop-blur-sm flex items-center">
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full bg-transparent text-white text-sm focus:outline-none cursor-pointer"
            >
              <option className="bg-gray-900" value="All Branches">
                All Branches
              </option>
              {[
                "San Mateo Rizal",
                "South Caloocan",
                "North Caloocan",
                "Quezon City",
              ].map((b) => (
                <option key={b} className="bg-gray-900">
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-white">Calendar</h2>
              <div className="flex items-center gap-1">
                <button className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <span className="text-sm text-gray-300 font-semibold px-2">
                  {currentMonth}
                </span>
                <button className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <div
                  key={d}
                  className="text-center text-xs font-semibold text-gray-600 py-1"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((item) => {
                const hasApts = item.appointments.length > 0;
                const isSelected = selectedDate === item.day;
                return (
                  <button
                    key={item.day}
                    onClick={() => setSelectedDate(item.day)}
                    className={`aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-semibold transition-all relative ${
                      isSelected
                        ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                        : "hover:bg-white/5 text-gray-400 hover:text-white"
                    }`}
                  >
                    <span>{item.day}</span>
                    {hasApts && (
                      <div className="flex gap-0.5 mt-0.5">
                        {item.appointments.map((apt, idx) => (
                          <div
                            key={idx}
                            className={`w-1 h-1 rounded-full ${isSelected ? "bg-white/70" : apt === "confirmed" ? "bg-emerald-400" : "bg-amber-400"}`}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-5 border-t border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                Confirmed Appointments
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                Pending Appointments
              </div>
            </div>
          </div>

          {/* Appointments Panel */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-black text-white">
                    February {selectedDate}, 2026
                  </h2>
                  <p className="text-gray-500 text-sm mt-0.5">
                    {filteredAppointments.length} appointment
                    {filteredAppointments.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {filteredAppointments.length === 0 ? (
                <div className="py-16 text-center">
                  <svg
                    className="w-12 h-12 text-gray-700 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-gray-500 text-lg">No appointments</p>
                  <p className="text-gray-600 text-sm mt-1">
                    No appointments scheduled for this date
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAppointments.map((apt, i) => (
                    <div
                      key={i}
                      className="bg-gray-800/60 border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black ${
                              apt.status === "Confirmed"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-amber-500/20 text-amber-400"
                            }`}
                          >
                            {apt.customer.charAt(0)}
                          </div>
                          <div>
                            <div className="text-white font-black text-base">
                              {apt.customer}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {apt.time}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusStyle[apt.status]}`}
                          >
                            {apt.status}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
                        {[
                          {
                            icon: (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                              />
                            ),
                            label: apt.vehicle,
                          },
                          {
                            icon: (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            ),
                            label: apt.service,
                          },
                          {
                            icon: (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            ),
                            label: apt.branch,
                          },
                          {
                            icon: (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            ),
                            label: `Mechanic: ${apt.mechanic}`,
                          },
                        ].map((row, j) => (
                          <div
                            key={j}
                            className="flex items-center gap-2 text-sm"
                          >
                            <svg
                              className="w-3.5 h-3.5 text-gray-600 shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              {row.icon}
                            </svg>
                            <span className="text-gray-400 truncate">
                              {row.label}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2 pt-3 border-t border-white/5">
                        <button className="flex-1 text-center text-sm font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 py-2 rounded-xl transition-all">
                          View
                        </button>
                        <button className="flex-1 text-center text-sm font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 py-2 rounded-xl transition-all">
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
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
