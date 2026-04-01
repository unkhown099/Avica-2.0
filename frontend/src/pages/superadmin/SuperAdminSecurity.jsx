import React from "react";
import SuperAdminLayout from "./SuperAdminLayout.jsx";

export default function SuperAdminSecurity() {
  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-gray-900/80 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-red-400">Super Admin</div>
              <h1 className="text-3xl font-black text-white">Security & Backup</h1>
              <p className="max-w-2xl text-sm text-gray-400">
                Configure authentication, access controls, and monitoring for the entire platform.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-gray-900/80 p-6">
            <div className="text-sm uppercase tracking-[0.25em] text-gray-400">Login Security</div>
            <div className="mt-4 text-3xl font-black text-white">Enabled</div>
            <p className="mt-2 text-sm text-gray-400">Password policy, lockouts, and access enforcement will be managed here.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-gray-900/80 p-6">
            <div className="text-sm uppercase tracking-[0.25em] text-gray-400">Backup Status</div>
            <div className="mt-4 text-3xl font-black text-white">Not configured</div>
            <p className="mt-2 text-sm text-gray-400">Set up backups and restore procedures for critical data.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-gray-900/80 p-6">
            <div className="text-sm uppercase tracking-[0.25em] text-gray-400">Two-factor Auth</div>
            <div className="mt-4 text-3xl font-black text-white">Pending</div>
            <p className="mt-2 text-sm text-gray-400">Enable platform-wide 2FA for extra login protection.</p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-gray-900/80 p-6">
          <div className="text-lg font-semibold text-white">Live controls</div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <button className="rounded-2xl bg-white/5 px-5 py-4 text-left text-sm text-gray-200 hover:bg-white/10">Configure security policies</button>
            <button className="rounded-2xl bg-white/5 px-5 py-4 text-left text-sm text-gray-200 hover:bg-white/10">Review audit logs</button>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
