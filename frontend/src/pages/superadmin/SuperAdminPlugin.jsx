import React, { useState, useEffect, useCallback } from "react";
import SuperAdminLayout from "./SuperAdminLayout.jsx";
import { API_BASE, getAuthHeadersAsync } from "../../hooks/useAuth.js";

export default function SuperAdminPlugin() {
  const [plugins, setPlugins] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [selectedPlugin, setSelectedPlugin] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [newPlugin, setNewPlugin] = useState({
    name: "",
    slug: "",
    description: "",
    version: "1.0.0",
    author: "",
    website: "",
    category: "other",
  });

  const fetchPlugins = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeadersAsync();
      const res = await fetch(`${API_BASE}/super-admin/plugins/`, { headers });
      if (!res.ok) throw new Error("Failed to fetch plugins");
      const data = await res.json();
      setPlugins(data.plugins);
      setStatusCounts(data.status_counts);
      setCategories(data.categories);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlugins();
  }, [fetchPlugins]);

  const handlePluginAction = async (pluginId, action, settings = null) => {
    try {
      const headers = await getAuthHeadersAsync();
      const body = settings ? { action, settings } : { action };
      const res = await fetch(`${API_BASE}/super-admin/plugins/${pluginId}/`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Action failed");
      }

      const data = await res.json();
      setMessage({ type: "success", text: data.message });
      fetchPlugins(); // Refresh list

      if (showConfigModal) setShowConfigModal(false);
      if (selectedPlugin) setSelectedPlugin(null);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleUninstall = async (pluginId, pluginName) => {
    if (
      !window.confirm(
        `Are you sure you want to uninstall "${pluginName}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      const headers = await getAuthHeadersAsync();
      const res = await fetch(`${API_BASE}/super-admin/plugins/${pluginId}/`, {
        method: "DELETE",
        headers,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Uninstall failed");
      }

      const data = await res.json();
      setMessage({ type: "success", text: data.message });
      fetchPlugins();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleInstall = async () => {
    if (!newPlugin.name || !newPlugin.slug) {
      setMessage({ type: "error", text: "Name and slug are required" });
      return;
    }

    try {
      const headers = await getAuthHeadersAsync();
      const res = await fetch(`${API_BASE}/super-admin/plugins/`, {
        method: "POST",
        headers,
        body: JSON.stringify(newPlugin),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Install failed");
      }

      const data = await res.json();
      setMessage({ type: "success", text: data.message });
      setShowInstallModal(false);
      setNewPlugin({
        name: "",
        slug: "",
        description: "",
        version: "1.0.0",
        author: "",
        website: "",
        category: "other",
      });
      fetchPlugins();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: "text-green-400 bg-green-500/10 border-green-500/20",
      inactive: "text-gray-400 bg-gray-500/10 border-gray-500/20",
      installed: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
      needs_update: "text-orange-400 bg-orange-500/10 border-orange-500/20",
      error: "text-red-400 bg-red-500/10 border-red-500/20",
    };
    return colors[status] || colors.inactive;
  };

  const filteredPlugins = plugins.filter((plugin) => {
    if (filterStatus !== "all" && plugin.status !== filterStatus) return false;
    if (filterCategory !== "all" && plugin.category !== filterCategory)
      return false;
    return true;
  });

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-3xl border border-white/10 bg-gray-900/80 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-red-400">
                Super Admin
              </div>
              <h1 className="text-3xl font-black text-white">
                Plugins & Extensions
              </h1>
              <p className="max-w-2xl text-sm text-gray-400">
                Manage plugins, feature toggles, and connected extensions from
                one location.
              </p>
            </div>
            <button
              onClick={() => setShowInstallModal(true)}
              className="rounded-2xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-400"
            >
              + Install New Plugin
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {statusCounts && Object.keys(statusCounts).length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-gray-900/80 p-4">
              <div className="text-xs uppercase text-gray-500">
                Total Plugins
              </div>
              <div className="text-2xl font-bold text-white">
                {plugins.length}
              </div>
            </div>
            <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
              <div className="text-xs uppercase text-green-400">Active</div>
              <div className="text-2xl font-bold text-green-400">
                {statusCounts.active || 0}
              </div>
            </div>
            <div className="rounded-2xl border border-gray-500/20 bg-gray-500/10 p-4">
              <div className="text-xs uppercase text-gray-400">Inactive</div>
              <div className="text-2xl font-bold text-gray-400">
                {statusCounts.inactive || 0}
              </div>
            </div>
            <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4">
              <div className="text-xs uppercase text-orange-400">
                Needs Update
              </div>
              <div className="text-2xl font-bold text-orange-400">
                {statusCounts.needs_update || 0}
              </div>
            </div>
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
              <div className="text-xs uppercase text-red-400">Error</div>
              <div className="text-2xl font-bold text-red-400">
                {statusCounts.error || 0}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="rounded-3xl border border-white/10 bg-gray-900/80 p-5">
          <div className="flex flex-wrap gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-xl border border-white/10 bg-gray-950 px-3 py-2 text-sm text-gray-300"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="installed">Installed</option>
              <option value="needs_update">Needs Update</option>
              <option value="error">Error</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="rounded-xl border border-white/10 bg-gray-950 px-3 py-2 text-sm text-gray-300"
            >
              <option value="all">All Categories</option>
              {Object.entries(categories).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Message Banner */}
        {message.text && (
          <div
            className={`rounded-3xl border px-5 py-4 text-sm ${
              message.type === "success"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                : "border-red-500/20 bg-red-500/10 text-red-300"
            }`}
          >
            {message.type === "success" ? "✓ " : "✕ "}
            {message.text}
          </div>
        )}

        {/* Plugins List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-3xl border border-white/10 bg-gray-900/80 p-6 animate-pulse"
              >
                <div className="h-6 w-48 bg-white/10 rounded mb-2"></div>
                <div className="h-4 w-96 bg-white/5 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPlugins.map((plugin) => (
              <div
                key={plugin.id}
                className="rounded-3xl border border-white/10 bg-gray-900/80 p-6 transition hover:border-white/20"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-semibold text-white">
                        {plugin.name}
                      </h3>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs ${getStatusColor(plugin.status)}`}
                      >
                        {plugin.status.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        v{plugin.version}
                      </span>
                      {plugin.is_system && (
                        <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400">
                          System
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-gray-400">
                      {plugin.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                      <span>By: {plugin.author || "Unknown"}</span>
                      <span>
                        Category:{" "}
                        {categories[plugin.category] || plugin.category}
                      </span>
                      {plugin.website && (
                        <a
                          href={plugin.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-red-400 hover:underline"
                        >
                          Website
                        </a>
                      )}
                    </div>
                    {plugin.dependencies?.length > 0 && (
                      <div className="mt-2 text-xs text-yellow-400">
                        Requires: {plugin.dependencies.join(", ")}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {plugin.is_active ? (
                      <button
                        onClick={() =>
                          handlePluginAction(plugin.id, "deactivate")
                        }
                        className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-2 text-sm font-semibold text-yellow-400 hover:bg-yellow-500/20"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          handlePluginAction(plugin.id, "activate")
                        }
                        disabled={plugin.status === "error"}
                        className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400 disabled:opacity-50"
                      >
                        Activate
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedPlugin(plugin);
                        setShowConfigModal(true);
                      }}
                      className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-white/10"
                    >
                      Configure
                    </button>

                    {!plugin.is_system && (
                      <button
                        onClick={() => handleUninstall(plugin.id, plugin.name)}
                        className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/20"
                      >
                        Uninstall
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Configuration Modal */}
      {showConfigModal && selectedPlugin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-gray-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                Configure {selectedPlugin.name}
              </h2>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {Object.entries(selectedPlugin.settings || {}).map(
                ([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      {key
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </label>
                    {typeof value === "boolean" ? (
                      <select
                        value={value}
                        onChange={(e) => {
                          const newSettings = {
                            ...selectedPlugin.settings,
                            [key]: e.target.value === "true",
                          };
                          setSelectedPlugin({
                            ...selectedPlugin,
                            settings: newSettings,
                          });
                        }}
                        className="w-full rounded-xl border border-white/10 bg-gray-950 px-3 py-2 text-gray-100"
                      >
                        <option value="true">Enabled</option>
                        <option value="false">Disabled</option>
                      </select>
                    ) : typeof value === "number" ? (
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => {
                          const newSettings = {
                            ...selectedPlugin.settings,
                            [key]: parseInt(e.target.value),
                          };
                          setSelectedPlugin({
                            ...selectedPlugin,
                            settings: newSettings,
                          });
                        }}
                        className="w-full rounded-xl border border-white/10 bg-gray-950 px-3 py-2 text-gray-100"
                      />
                    ) : (
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => {
                          const newSettings = {
                            ...selectedPlugin.settings,
                            [key]: e.target.value,
                          };
                          setSelectedPlugin({
                            ...selectedPlugin,
                            settings: newSettings,
                          });
                        }}
                        className="w-full rounded-xl border border-white/10 bg-gray-950 px-3 py-2 text-gray-100"
                      />
                    )}
                  </div>
                ),
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() =>
                    handlePluginAction(
                      selectedPlugin.id,
                      null,
                      selectedPlugin.settings,
                    )
                  }
                  className="flex-1 rounded-xl bg-red-500 py-2 font-semibold text-white hover:bg-red-400"
                >
                  Save Settings
                </button>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="flex-1 rounded-xl border border-white/20 py-2 font-semibold text-gray-300 hover:bg-white/5"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Install Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-gray-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                Install New Plugin
              </h2>
              <button
                onClick={() => setShowInstallModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Plugin Name *
                </label>
                <input
                  type="text"
                  value={newPlugin.name}
                  onChange={(e) =>
                    setNewPlugin({
                      ...newPlugin,
                      name: e.target.value,
                      slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-gray-950 px-3 py-2 text-gray-100"
                  placeholder="e.g., Analytics Tracker"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  value={newPlugin.slug}
                  onChange={(e) =>
                    setNewPlugin({
                      ...newPlugin,
                      slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-gray-950 px-3 py-2 text-gray-100"
                  placeholder="e.g., analytics-tracker"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={newPlugin.description}
                  onChange={(e) =>
                    setNewPlugin({ ...newPlugin, description: e.target.value })
                  }
                  rows={3}
                  className="w-full rounded-xl border border-white/10 bg-gray-950 px-3 py-2 text-gray-100"
                  placeholder="Brief description of the plugin"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Version
                  </label>
                  <input
                    type="text"
                    value={newPlugin.version}
                    onChange={(e) =>
                      setNewPlugin({ ...newPlugin, version: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/10 bg-gray-950 px-3 py-2 text-gray-100"
                    placeholder="1.0.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Author
                  </label>
                  <input
                    type="text"
                    value={newPlugin.author}
                    onChange={(e) =>
                      setNewPlugin({ ...newPlugin, author: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/10 bg-gray-950 px-3 py-2 text-gray-100"
                    placeholder="Author name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    value={newPlugin.website}
                    onChange={(e) =>
                      setNewPlugin({ ...newPlugin, website: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/10 bg-gray-950 px-3 py-2 text-gray-100"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newPlugin.category}
                    onChange={(e) =>
                      setNewPlugin({ ...newPlugin, category: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/10 bg-gray-950 px-3 py-2 text-gray-100"
                  >
                    {Object.entries(categories).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleInstall}
                  className="flex-1 rounded-xl bg-red-500 py-2 font-semibold text-white hover:bg-red-400"
                >
                  Install Plugin
                </button>
                <button
                  onClick={() => setShowInstallModal(false)}
                  className="flex-1 rounded-xl border border-white/20 py-2 font-semibold text-gray-300 hover:bg-white/5"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
}