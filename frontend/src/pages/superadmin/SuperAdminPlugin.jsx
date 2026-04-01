import React from "react";
import SuperAdminLayout from "./SuperAdminLayout.jsx";

const plugins = [
  { name: "Analytics Tracker", status: "Active" },
  { name: "Email Notifications", status: "Inactive" },
  { name: "Inventory Sync", status: "Active" },
];

export default function SuperAdminPlugin() {
  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-gray-900/80 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-red-400">Super Admin</div>
              <h1 className="text-3xl font-black text-white">Plugins & Extensions</h1>
              <p className="max-w-2xl text-sm text-gray-400">
                Manage plugins, feature toggles, and connected extensions from one location.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-gray-900/80 p-6">
          <div className="text-lg font-semibold text-white">Installed extensions</div>
          <div className="mt-4 space-y-3">
            {plugins.map((plugin) => (
              <div key={plugin.name} className="flex items-center justify-between rounded-3xl border border-white/10 bg-gray-950/80 px-4 py-4">
                <div>
                  <div className="font-semibold text-white">{plugin.name}</div>
                  <div className="text-sm text-gray-400">Status: {plugin.status}</div>
                </div>
                <button className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400">
                  Manage
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-gray-900/80 p-6">
          <div className="text-lg font-semibold text-white">Upcoming plugin actions</div>
          <p className="mt-3 text-sm text-gray-400">This section is a placeholder for plugin installation, activation, and extension settings.</p>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
