import React from "react";
import SuperAdminLayout from "./SuperAdminLayout.jsx";

export default function SuperAdminReports() {
  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-gray-900/80 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-red-400">Super Admin</div>
              <h1 className="text-3xl font-black text-white">Reports & Monitoring</h1>
              <p className="max-w-2xl text-sm text-gray-400">
                Review system performance, audit logs, and activity summaries from the super admin dashboard.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-gray-900/80 p-6">
            <div className="text-sm uppercase tracking-[0.25em] text-gray-400">Revenue Snapshot</div>
            <div className="mt-4 text-3xl font-black text-white">$0.00</div>
            <p className="mt-2 text-sm text-gray-400">Upcoming revenue reports and branch breakdowns will appear here.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-gray-900/80 p-6">
            <div className="text-sm uppercase tracking-[0.25em] text-gray-400">Bookings Trend</div>
            <div className="mt-4 text-3xl font-black text-white">0</div>
            <p className="mt-2 text-sm text-gray-400">Track bookings performance across all locations.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-gray-900/80 p-6">
            <div className="text-sm uppercase tracking-[0.25em] text-gray-400">Security Events</div>
            <div className="mt-4 text-3xl font-black text-white">0</div>
            <p className="mt-2 text-sm text-gray-400">Monitor audit logs and unusual activity in one place.</p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-gray-900/80 p-6">
          <div className="text-lg font-semibold text-white">What’s next</div>
          <p className="mt-3 text-sm text-gray-400">This page is ready for integration with the backend reporting API. Use these cards as placeholders until real data is available.</p>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
