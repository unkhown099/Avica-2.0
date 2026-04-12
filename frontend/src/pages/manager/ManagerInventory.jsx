import React, { useState, useEffect } from "react";
import ManagerLayout from "./ManagerLayout";
import { API_BASE } from "../../hooks/useAuth.js";
import axios from "axios";
import Swal from "sweetalert2";

function ManagerInventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("all");
  const [productStateFilter, setProductStateFilter] = useState("active");
  const activeTab = "inventory";
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [restockRequests, setRestockRequests] = useState([]);
  const [updatingServiceId, setUpdatingServiceId] = useState(null);
  const [requestingRestockId, setRequestingRestockId] = useState(null);
  const [disablingInventoryId, setDisablingInventoryId] = useState(null);

  const notify = (icon, title) => {
    Swal.fire({
      toast: true,
      position: "top-end",
      timer: 2200,
      timerProgressBar: true,
      showConfirmButton: false,
      icon,
      title,
      background: "#111827",
      color: "#f9fafb",
    });
  };



  useEffect(() => {
    debugStorage();
  }, []);
  const debugStorage = () => {};

  const getAuthToken = () => {
    const tokenKeys = [
      "accessToken",
      "access_token",
      "token",
      "jwt",
      "access",
      "authToken",
      "Authorization",
    ];
    for (const key of tokenKeys) {
      const t = localStorage.getItem(key);
      if (t) return t;
    }
    for (const key of tokenKeys) {
      const t = sessionStorage.getItem(key);
      if (t) return t;
    }
    try {
      const userStr =
        localStorage.getItem("user") || sessionStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        for (const p of [
          "accessToken",
          "access_token",
          "token",
          "jwt",
          "access",
        ]) {
          if (user[p]) return user[p];
        }
      }
    } catch (e) {}
    try {
      const authStr =
        localStorage.getItem("auth") || sessionStorage.getItem("auth");
      if (authStr) {
        const auth = JSON.parse(authStr);
        for (const p of [
          "accessToken",
          "access_token",
          "token",
          "jwt",
          "access",
        ]) {
          if (auth[p]) return auth[p];
        }
      }
    } catch (e) {}
    return null;
  };

  const getInventoryStatusKey = (item) => {
    const quantity = Number(item?.quantity ?? item?.current ?? 0);
    const minimum = Number(item?.minimum ?? item?.minimum_qty ?? 0);
    const raw = String(item?.status ?? "")
      .trim()
      .toLowerCase();
    if (quantity <= 0 || raw.includes("out of stock")) return "out_of_stock";
    if (minimum > 0 && quantity <= minimum) return "running_low";
    if (raw.includes("critical") || raw.includes("reorder"))
      return "running_low";
    if (raw.includes("low")) return "running_low";
    return "available";
  };

  const getInventoryStatusLabel = (item) => {
    const key = getInventoryStatusKey(item);
    if (key === "available") return "Available 🟢";
    if (key === "running_low") return "Running Low 🟡";
    return "Out of Stock ⚫";
  };

  const handleApiError = (err, defaultMessage) => {
    if (err.response?.status === 401) {
      [
        "accessToken",
        "access_token",
        "token",
        "jwt",
        "access",
        "authToken",
        "Authorization",
        "user",
        "auth",
      ].forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      window.location.href = "/login";
      return "Your session has expired. Please login again.";
    }
    return (
      err.response?.data?.detail ||
      err.response?.data?.message ||
      defaultMessage
    );
  };

  const createApiClient = () => {
    const token = getAuthToken();
    const instance = axios.create({
      baseURL: API_BASE,
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        : { "Content-Type": "application/json" },
    });
    instance.interceptors.request.use(
      (config) => {
        const t = getAuthToken();
        if (t) config.headers.Authorization = `Bearer ${t}`;
        return config;
      },
      (error) => Promise.reject(error),
    );
    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401)
          handleApiError(error, "Authentication failed");
        return Promise.reject(error);
      },
    );
    return instance;
  };

  useEffect(() => {
    if (activeTab === "services") fetchServices();
  }, [activeTab, categoryFilter, searchQuery]);
  useEffect(() => {
    if (activeTab === "inventory") fetchInventory();
  }, [activeTab, categoryFilter, statusFilter, searchQuery, productStateFilter]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        notify("error", "Please login to continue");
        setLoading(false);
        return;
      }
      const apiClient = createApiClient();
      const params = new URLSearchParams();
      if (categoryFilter !== "All Categories")
        params.append("category", categoryFilter);
      if (searchQuery) params.append("search", searchQuery);
      const url = `services/${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await apiClient.get(url);
      const servicesData = Array.isArray(response.data) ? response.data : [];
      setServices(
        servicesData.map((service) => ({
          id: `SVC-${service.id?.toString().padStart(3, "0") || "000"}`,
          originalId: service.id,
          name: service.name || "",
          category: service.category || "",
          duration: service.duration || "1 hour",
          price: service.price
            ? `₱${Number(service.price).toLocaleString()}`
            : "₱0",
          description: service.description || "",
          is_active: service.is_active !== undefined ? service.is_active : true,
          branches: service.branches || [],
        })),
      );
    } catch (err) {
      notify("error", handleApiError(err, "Failed to load services."));
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        notify("error", "Please login to continue");
        setLoading(false);
        return;
      }
      const apiClient = createApiClient();
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (categoryFilter !== "All Categories")
        params.append("category", categoryFilter);
      params.append("archived", productStateFilter === "disabled" ? "true" : "false");
      const url = `inventory/${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await apiClient.get(url);
      const inventoryData = Array.isArray(response.data) ? response.data : [];
      setInventoryItems(
        inventoryData.map((item) => ({
          id: item.id || `INV-${Math.random().toString(36).substr(2, 9)}`,
          originalId: item.id,
          name: item.name || "",
          category: item.category || "",
          sku: item.sku || "",
          quantity: item.quantity || 0,
          unit: "Pieces",
          price: item.price ? `₱${Number(item.price).toLocaleString()}` : "₱0",
          supplier: item.supplier || "",
          status:
            item.status ||
            ((item.quantity || 0) <= (item.minimum_qty || 0)
              ? "Low Stock"
              : "In Stock"),
          minimum: item.minimum_qty ?? 0,
          is_active: item.is_active !== false,
        })),
      );
    } catch (err) {
      notify("error", handleApiError(err, "Failed to load inventory."));
      setInventoryItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRestockRequests = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      const apiClient = createApiClient();
      const response = await apiClient.get("inventory/restock-requests/");
      setRestockRequests(Array.isArray(response.data) ? response.data : []);
    } catch {
      setRestockRequests([]);
    }
  };

  useEffect(() => {
    if (activeTab === "inventory") fetchRestockRequests();
  }, [activeTab]);

  const requestRestock = async (item) => {
    if (!item?.originalId) {
      notify("error", "Unable to request restock for this item.");
      return;
    }
    const defaultQty = Math.max((item.minimum || 0) - (item.quantity || 0), 1);
    const qtyPrompt = await Swal.fire({
      title: "Request Restock",
      text: `${item.name} (${item.sku})`,
      input: "number",
      inputValue: defaultQty,
      inputLabel: "Quantity to request",
      inputAttributes: { min: 1, step: 1 },
      showCancelButton: true,
      confirmButtonText: "Next",
      confirmButtonColor: "#dc2626",
      background: "#111827",
      color: "#f9fafb",
      inputValidator: (value) => {
        const n = Number(value);
        if (!Number.isFinite(n) || n <= 0) return "Enter a valid quantity.";
        return undefined;
      },
    });
    if (!qtyPrompt.isConfirmed) return;
    const notePrompt = await Swal.fire({
      title: "Add Note (Optional)",
      input: "text",
      inputPlaceholder: "e.g. urgent demand this week",
      showCancelButton: true,
      confirmButtonText: "Submit Request",
      confirmButtonColor: "#dc2626",
      background: "#111827",
      color: "#f9fafb",
    });
    if (!notePrompt.isConfirmed) return;
    try {
      setRequestingRestockId(item.originalId);
      const apiClient = createApiClient();
      await apiClient.post("inventory/restock-requests/", {
        inventory_item: item.originalId,
        quantity_requested: Number(qtyPrompt.value),
        notes: notePrompt.value || "",
      });
      notify("success", `Restock request submitted for "${item.name}".`);
    } catch (err) {
      notify("error", handleApiError(err, "Failed to submit restock request."));
    } finally {
      setRequestingRestockId(null);
    }
  };

  const toggleServiceStatus = async (service) => {
    setUpdatingServiceId(service.originalId);
    try {
      const token = getAuthToken();
      if (!token) {
        notify("error", "Please login to continue");
        setUpdatingServiceId(null);
        return;
      }
      const apiClient = createApiClient();
      const newStatus = !service.is_active;
      await apiClient.patch(`services/${service.originalId}/`, {
        is_active: newStatus,
      });
      setServices((prevServices) =>
        prevServices.map((s) =>
          s.originalId === service.originalId
            ? { ...s, is_active: newStatus }
            : s,
        ),
      );
      notify(
        "success",
        `Service "${service.name}" ${newStatus ? "activated" : "deactivated"} successfully!`,
      );
    } catch (err) {
      notify("error", handleApiError(err, "Failed to update service status."));
    } finally {
      setUpdatingServiceId(null);
    }
  };

  const toggleInventoryItemStatus = async (item) => {
    if (!item?.originalId) {
      notify("error", "Unable to update this product.");
      return;
    }

    setDisablingInventoryId(item.originalId);
    try {
      const token = getAuthToken();
      if (!token) {
        notify("error", "Please login to continue");
        return;
      }
      const apiClient = createApiClient();
      const newStatus = !item.is_active;
      await apiClient.patch(`inventory/${item.originalId}/`, { is_active: newStatus });
      await fetchInventory();
      notify(
        "success",
        `Product "${item.name}" ${newStatus ? "enabled" : "disabled"}.`,
      );
    } catch (err) {
      notify("error", handleApiError(err, "Failed to update product status."));
    } finally {
      setDisablingInventoryId(null);
    }
  };

  const lowStockItems = Array.isArray(inventoryItems)
    ? inventoryItems
        .filter((item) => {
          const key = getInventoryStatusKey(item);
          return (
            key === "running_low" ||
            key === "out_of_stock"
          );
        })
        .map((item) => ({
          originalId: item.originalId,
          sku: item.sku,
          name: item.name,
          current: item.quantity,
          minimum: item.minimum || 0,
          unit: "Pieces",
        }))
    : [];

  const getStatusBadge = (item, isActive = true) => {
    if (!isActive)
      return (
        <span className="px-2 py-1 rounded-full text-xs font-semibold border bg-gray-500/20 text-gray-400 border-gray-500/30">
          Inactive
        </span>
      );
    const key = getInventoryStatusKey(item);
    const label = getInventoryStatusLabel(item);
    if (key === "available")
      return (
        <span className="px-2 py-1 rounded-full text-xs font-semibold border bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
          {label}
        </span>
      );
    if (key === "running_low")
      return (
        <span className="px-2 py-1 rounded-full text-xs font-semibold border bg-amber-500/20 text-amber-400 border-amber-500/30">
          {label}
        </span>
      );
    if (key === "out_of_stock")
      return (
        <span className="px-2 py-1 rounded-full text-xs font-semibold border bg-gray-500/20 text-gray-300 border-gray-500/30">
          {label}
        </span>
      );
    return (
      <span className="px-2 py-1 rounded-full text-xs font-semibold border bg-red-500/20 text-red-400 border-red-500/30">
        {label}
      </span>
    );
  };

  const filteredInventory = Array.isArray(inventoryItems)
    ? inventoryItems.filter((item) => {
        const q = searchQuery.toLowerCase();
        return (
          (item.name?.toLowerCase().includes(q) ||
            item.sku?.toLowerCase().includes(q) ||
            item.category?.toLowerCase().includes(q)) &&
          (categoryFilter === "All Categories" ||
            item.category === categoryFilter) &&
          (statusFilter === "all" ||
            getInventoryStatusKey(item) === statusFilter)
        );
      })
    : [];

  const approvedRestockRequests = Array.isArray(restockRequests)
    ? restockRequests.filter((req) => req.status === "approved")
    : [];
  const pendingRestockRequests = Array.isArray(restockRequests)
    ? restockRequests.filter((req) => req.status === "pending")
    : [];
  const inventoryCategoryOptions = [
    "All Categories",
    ...Array.from(
      new Set(
        (Array.isArray(inventoryItems) ? inventoryItems : [])
          .map((item) => item.category)
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b)),
  ];
  const filteredServices = Array.isArray(services)
    ? services.filter((service) => {
        const q = searchQuery.toLowerCase();
        return (
          service.name.toLowerCase().includes(q) ||
          service.category.toLowerCase().includes(q) ||
          service.description.toLowerCase().includes(q)
        );
      })
    : [];

  const renderStatIcon = (color, iconType) => {
    const paths = {
      inventory:
        "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
      value:
        "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      alert:
        "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
      services:
        "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
      categories:
        "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l5 5a2 2 0 01.586 1.414V19a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z",
    };
    return (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d={paths[iconType] || paths.inventory}
      />
    );
  };

  const activeServicesCount = Array.isArray(services)
    ? services.filter((s) => s.is_active).length
    : 0;
  const inventoryStats = [
    {
      label: "Total Items",
      value: (Array.isArray(inventoryItems)
        ? inventoryItems.length
        : 0
      ).toString(),
      sub: "In this branch",
      color: "#ef4444",
      iconType: "inventory",
    },
    {
      label: "Inventory Value",
      value: `₱${(Array.isArray(inventoryItems)
        ? inventoryItems.reduce((sum, item) => {
            const price = parseFloat(item.price?.replace(/[₱,]/g, "") || "0");
            return sum + price * (item.quantity || 0);
          }, 0)
        : 0
      ).toLocaleString()}`,
      sub: "Total stock value",
      color: "#3b82f6",
      iconType: "value",
    },
    {
      label: "Low Stock Alert",
      value: lowStockItems.length,
      sub: "Items need reordering",
      color: "#f59e0b",
      iconType: "alert",
    },
  ];
  const serviceStats = [
    {
      label: "Total Services",
      value: (Array.isArray(services) ? services.length : 0).toString(),
      sub: "All services",
      color: "#10b981",
      iconType: "services",
    },
    {
      label: "Active Services",
      value: activeServicesCount.toString(),
      sub: "Currently available",
      color: "#3b82f6",
      iconType: "services",
    },
    {
      label: "Service Categories",
      value: (Array.isArray(services)
        ? [...new Set(services.map((s) => s.category))].length
        : 0
      ).toString(),
      sub: "Different types",
      color: "#8b5cf6",
      iconType: "categories",
    },
  ];

  return (
    <ManagerLayout title="" subtitle="">
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-4 sm:-m-8 p-4 sm:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Inventory Management
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Track and manage inventory for San Mateo Rizal branch.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {(activeTab === "inventory" ? inventoryStats : serviceStats).map(
            (stat) => (
              <div
                key={stat.label}
                className="bg-gray-900/60 border border-white/5 rounded-2xl p-4 sm:p-5 backdrop-blur-sm hover:border-white/10 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: stat.color + "22" }}
                  >
                    <svg
                      className="w-5 h-5"
                      style={{ color: stat.color }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {renderStatIcon(stat.color, stat.iconType)}
                    </svg>
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500">{stat.label}</div>
                <div className="text-xs text-gray-600 mt-0.5">{stat.sub}</div>
              </div>
            ),
          )}
        </div>

        {/* Low Stock Alert */}
        {activeTab === "inventory" && lowStockItems.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 sm:p-5 mb-6 sm:mb-8 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <svg
                className="w-4 h-4 text-red-400 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h2 className="text-sm font-black text-red-400 uppercase tracking-wider">
                Low Stock Alert
              </h2>
              <span className="ml-auto text-xs text-gray-500">
                {lowStockItems.length} items
              </span>
            </div>
            <div className="space-y-2.5">
              {lowStockItems.map((item, i) => (
                <div
                  key={i}
                  className="bg-gray-900/60 border border-white/5 rounded-xl p-3 sm:p-4 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-white font-semibold text-sm truncate">
                      {item.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Current:{" "}
                      <span className="text-red-400 font-bold">
                        {item.current} Pieces
                      </span>
                      <span className="mx-2 text-gray-700">·</span>
                      Min:{" "}
                      <span className="text-gray-300">
                        {item.minimum} Pieces
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => requestRestock(item)}
                    disabled={requestingRestockId === item.originalId}
                    className="shrink-0 px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all"
                  >
                    {requestingRestockId === item.originalId
                      ? "Requesting..."
                      : "Request Restock"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "inventory" && pendingRestockRequests.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 sm:p-5 mb-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-black text-amber-400 uppercase tracking-wider">
                Pending Restock Requests
              </h2>
              <span className="text-xs text-gray-500">
                {pendingRestockRequests.length} pending
              </span>
            </div>
            <div className="space-y-2">
              {pendingRestockRequests.slice(0, 4).map((req) => (
                <div
                  key={req.id}
                  className="bg-gray-900/60 border border-white/5 rounded-xl px-4 py-3"
                >
                  <p className="text-sm text-white font-semibold">
                    {req.inventory_item_name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Qty {req.quantity_requested} · {req.branch_name || "—"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "inventory" && approvedRestockRequests.length > 0 && (
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-4 sm:p-5 mb-6 sm:mb-8 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-black text-cyan-400 uppercase tracking-wider">
                Approved Requests
              </h2>
              <span className="text-xs text-gray-500">
                {approvedRestockRequests.length} approved
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Waiting for Inventory to confirm stock receipt.
            </p>
            <div className="space-y-2">
              {approvedRestockRequests.slice(0, 4).map((req) => (
                <div
                  key={req.id}
                  className="bg-gray-900/60 border border-white/5 rounded-xl px-4 py-3"
                >
                  <p className="text-sm text-white font-semibold">
                    {req.inventory_item_name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Qty {req.quantity_requested} · {req.branch_name || "—"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder={`Search ${activeTab === "inventory" ? "by name, SKU, or category..." : "by service name or category..."}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900/60 border border-white/10 text-white placeholder-gray-500 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all"
            />
          </div>
          {activeTab === "inventory" ? (
            <>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-gray-900/60 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 cursor-pointer"
              >
                {inventoryCategoryOptions.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-900/60 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 cursor-pointer"
              >
                {[
                  { value: "all", label: "All Status" },
                  { value: "available", label: "Available 🟢" },
                  { value: "running_low", label: "Running Low 🟡" },
                  { value: "out_of_stock", label: "Out of Stock ⚫" },
                ].map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <select
                value={productStateFilter}
                onChange={(e) => setProductStateFilter(e.target.value)}
                className="bg-gray-900/60 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 cursor-pointer"
              >
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
            </>
          ) : (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-gray-900/60 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 cursor-pointer"
            >
              <option value="All Categories">All Categories</option>
              {serviceCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-red-500 border-t-transparent"></div>
            <p className="text-gray-400 mt-2">Loading...</p>
          </div>
        )}

        {/* Table */}
        {!loading && (
          <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
            {/* Desktop header */}
            {activeTab === "inventory" ? (
              <div className="hidden sm:grid grid-cols-12 gap-3 px-6 py-4 border-b border-white/5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="col-span-2">Name</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-2">SKU</div>
                <div className="col-span-2">Quantity</div>
                <div className="col-span-1">Price</div>
                <div className="col-span-1">Supplier</div>
                <div className="col-span-1 text-center">Status</div>
                <div className="col-span-1 text-right">Action</div>
              </div>
            ) : (
              <div className="hidden sm:grid grid-cols-12 gap-3 px-6 py-4 border-b border-white/5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="col-span-3">Service Name</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-2">Duration</div>
                <div className="col-span-2">Price</div>
                <div className="col-span-2">Description</div>
                <div className="col-span-1 text-center">Status</div>
              </div>
            )}

            {activeTab === "inventory" ? (
              filteredInventory.length === 0 ? (
                <div className="py-20 text-center">
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
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                  <p className="text-gray-500 text-lg">No items found</p>
                  <p className="text-gray-600 text-sm mt-1">
                    Try adjusting your search or filters
                  </p>
                </div>
              ) : (
                filteredInventory.map((item) => (
                  <div
                    key={item.id}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Desktop */}
                    <div className="hidden sm:grid grid-cols-12 gap-3 px-6 py-4 items-center">
                      <div className="col-span-2 text-white font-semibold text-sm">
                        {item.name}
                      </div>
                      <div className="col-span-2 text-gray-400 text-sm">
                        {item.category}
                      </div>
                      <div className="col-span-2 text-gray-500 text-xs font-mono">
                        {item.sku}
                      </div>
                      <div className="col-span-2 text-gray-300 text-sm font-semibold">
                        {item.quantity}{" "}
                        <span className="text-gray-600 font-normal text-xs">
                          Pieces
                        </span>
                      </div>
                      <div className="col-span-1 text-white font-bold text-sm">
                        {item.price}
                      </div>
                      <div className="col-span-1 text-gray-400 text-sm truncate">
                        {item.supplier}
                      </div>
                      <div className="col-span-1 flex justify-center items-center">
                        {getStatusBadge(item)}
                      </div>
                      <div className="col-span-1 flex justify-end items-center">
                        <button
                          type="button"
                          onClick={() => toggleInventoryItemStatus(item)}
                          disabled={disablingInventoryId === item.originalId}
                          title={item.is_active ? "Disable Product" : "Enable Product"}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${item.is_active ? "bg-emerald-500" : "bg-gray-600"} ${disablingInventoryId === item.originalId ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${item.is_active ? "translate-x-6" : "translate-x-1"}`}
                          />
                        </button>
                      </div>
                    </div>
                    {/* Mobile card */}
                    <div className="sm:hidden px-4 py-3">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div>
                          <div className="text-white font-semibold text-sm">
                            {item.name}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {item.category} ·{" "}
                            <span className="font-mono">{item.sku}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(item)}
                          <button
                            type="button"
                            onClick={() => toggleInventoryItemStatus(item)}
                            disabled={disablingInventoryId === item.originalId}
                            title={item.is_active ? "Disable Product" : "Enable Product"}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.is_active ? "bg-emerald-500" : "bg-gray-600"} ${disablingInventoryId === item.originalId ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${item.is_active ? "translate-x-6" : "translate-x-1"}`}
                            />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 mt-1">
                        <span className="text-gray-300 font-semibold">
                          {item.quantity} Pieces
                        </span>
                        <span>{item.price}</span>
                        {item.supplier && <span>{item.supplier}</span>}
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : filteredServices.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-gray-500 text-lg">No services found</p>
                <p className="text-gray-600 text-sm mt-1">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              filteredServices.map((service) => (
                <div
                  key={service.id}
                  className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                >
                  {/* Desktop */}
                  <div className="hidden sm:grid grid-cols-12 gap-3 px-6 py-4 items-center">
                    <div className="col-span-3 text-white font-semibold text-sm">
                      {service.name}
                    </div>
                    <div className="col-span-2 text-gray-400 text-sm">
                      {service.category}
                    </div>
                    <div className="col-span-2 text-gray-400 text-sm">
                      {service.duration}
                    </div>
                    <div className="col-span-2 text-white font-bold text-sm">
                      {service.price}
                    </div>
                    <div className="col-span-2 text-gray-400 text-sm truncate">
                      {service.description}
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button
                        onClick={() => toggleServiceStatus(service)}
                        disabled={updatingServiceId === service.originalId}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${service.is_active ? "bg-emerald-500" : "bg-gray-600"} ${updatingServiceId === service.originalId ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${service.is_active ? "translate-x-6" : "translate-x-1"}`}
                        />
                      </button>
                    </div>
                  </div>
                  {/* Mobile card */}
                  <div className="sm:hidden px-4 py-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <div className="text-white font-semibold text-sm">
                          {service.name}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {service.category} · {service.duration}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-white font-bold text-sm">
                          {service.price}
                        </span>
                        <button
                          onClick={() => toggleServiceStatus(service)}
                          disabled={updatingServiceId === service.originalId}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${service.is_active ? "bg-emerald-500" : "bg-gray-600"} ${updatingServiceId === service.originalId ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${service.is_active ? "translate-x-6" : "translate-x-1"}`}
                          />
                        </button>
                      </div>
                    </div>
                    {service.description && (
                      <div className="text-gray-500 text-xs mt-0.5 line-clamp-1">
                        {service.description}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {((activeTab === "inventory" && filteredInventory.length > 0) ||
              (activeTab === "services" && filteredServices.length > 0)) && (
              <div className="px-4 sm:px-6 py-4">
                <p className="text-gray-500 text-sm">
                  Showing{" "}
                  <span className="text-white font-semibold">
                    {activeTab === "inventory"
                      ? filteredInventory.length
                      : filteredServices.length}
                  </span>{" "}
                  of{" "}
                  <span className="text-white font-semibold">
                    {activeTab === "inventory"
                      ? inventoryItems.length
                      : services.length}
                  </span>{" "}
                  {activeTab === "inventory" ? "items" : "services"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </ManagerLayout>
  );
}

export default ManagerInventory;
