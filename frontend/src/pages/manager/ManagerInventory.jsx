import React, { useState, useEffect } from "react";
import ManagerLayout from "./ManagerLayout";
import { API_BASE } from "../../hooks/useAuth.js";
import axios from "axios";
import Swal from "sweetalert2";

function ManagerInventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("inventory");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // State for API data - initialize as empty arrays
  const [services, setServices] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [updatingServiceId, setUpdatingServiceId] = useState(null);
  const [requestingRestockId, setRequestingRestockId] = useState(null);

  // Categories for services
  const serviceCategories = [
    "Maintenance",
    "Brakes",
    "AC",
    "Engine",
    "Tires",
    "Electrical",
    "Suspension",
    "Transmission",
    "Diagnostic",
  ];

  // Debug function to check all storage on component mount
  useEffect(() => {
    debugStorage();
  }, []);

  const debugStorage = () => {
    // Comment out or remove these console logs
    // console.log("=== LOCALSTORAGE CONTENTS ===");
    // for (let i = 0; i < localStorage.length; i++) {
    //   const key = localStorage.key(i);
    //   const value = localStorage.getItem(key);
    //   console.log(`${key}:`, value ? value.substring(0, 20) + "..." : value);
    // }
    // console.log("=== SESSIONSTORAGE CONTENTS ===");
    // for (let i = 0; i < sessionStorage.length; i++) {
    //   const key = sessionStorage.key(i);
    //   const value = sessionStorage.getItem(key);
    //   console.log(`${key}:`, value ? value.substring(0, 20) + "..." : value);
    // }
  };

  // Helper function to get JWT token from both localStorage and sessionStorage
  const getAuthToken = () => {
    // Common JWT token key names to check
    const tokenKeys = [
      "accessToken",
      "access_token",
      "token",
      "jwt",
      "access",
      "authToken",
      "Authorization",
    ];

    // Check localStorage first
    for (const key of tokenKeys) {
      const token = localStorage.getItem(key);
      if (token) {
        return token;
      }
    }

    // Check sessionStorage
    for (const key of tokenKeys) {
      const token = sessionStorage.getItem(key);
      if (token) {
        return token;
      }
    }

    // Check for user object that might contain token
    try {
      const userStr =
        localStorage.getItem("user") || sessionStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        // Check common token properties in user object
        const tokenProps = [
          "accessToken",
          "access_token",
          "token",
          "jwt",
          "access",
        ];
        for (const prop of tokenProps) {
          if (user[prop]) {
            return user[prop];
          }
        }
      }
    } catch (e) {
      // Silent fail
    }

    // Check for token in auth data
    try {
      const authStr =
        localStorage.getItem("auth") || sessionStorage.getItem("auth");
      if (authStr) {
        const auth = JSON.parse(authStr);
        const tokenProps = [
          "accessToken",
          "access_token",
          "token",
          "jwt",
          "access",
        ];
        for (const prop of tokenProps) {
          if (auth[prop]) {
            return auth[prop];
          }
        }
      }
    } catch (e) {
      // Silent fail
    }

    return null;
  };

  const getInventoryStatusKey = (item) => {
    const quantity = Number(item?.quantity ?? item?.current ?? 0);
    const minimum = Number(item?.minimum ?? item?.minimum_qty ?? 0);
    const raw = String(item?.status ?? "")
      .trim()
      .toLowerCase();

    if (quantity <= 0 || raw.includes("out of stock")) return "out_of_stock";
    if (minimum > 0 && quantity <= minimum) return "reorder_now";
    if (minimum > 0 && quantity <= Math.ceil(minimum * 1.5)) return "running_low";
    if (raw.includes("critical") || raw.includes("reorder")) return "reorder_now";
    if (raw.includes("low")) return "running_low";
    return "available";
  };

  const getInventoryStatusLabel = (item) => {
    const key = getInventoryStatusKey(item);
    if (key === "available") return "Available 🟢";
    if (key === "running_low") return "Running Low 🟡";
    if (key === "reorder_now") return "Reorder Now 🔴";
    return "Out of Stock ⚫";
  };

  // Helper function to handle API errors
  const handleApiError = (err, defaultMessage) => {
    if (err.response?.status === 401) {
      // Token expired or invalid - clear tokens and redirect to login
      const tokenKeys = [
        "accessToken",
        "access_token",
        "token",
        "jwt",
        "access",
        "authToken",
        "Authorization",
        "user",
        "auth",
      ];

      tokenKeys.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      // Redirect to login page
      window.location.href = "/login";
      return "Your session has expired. Please login again.";
    }

    return (
      err.response?.data?.detail ||
      err.response?.data?.message ||
      defaultMessage
    );
  };

  // Create axios instance with default headers
  const createApiClient = () => {
    const token = getAuthToken();

    const instance = axios.create({
      baseURL: API_BASE,
      headers: token
        ? {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
        : {
          "Content-Type": "application/json",
        },
    });

    // Add request interceptor to ensure token is always fresh
    instance.interceptors.request.use(
      (config) => {
        const currentToken = getAuthToken();
        if (currentToken) {
          config.headers.Authorization = `Bearer ${currentToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // Add response interceptor to handle token expiration
    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired - clear and redirect
          handleApiError(error, "Authentication failed");
        }
        return Promise.reject(error);
      },
    );

    return instance;
  };

  // Fetch services on component mount and when tab changes
  useEffect(() => {
    if (activeTab === "services") {
      fetchServices();
    }
  }, [activeTab, categoryFilter, searchQuery]);

  // Fetch inventory when tab is inventory and filters change
  useEffect(() => {
    if (activeTab === "inventory") {
      fetchInventory();
    }
  }, [activeTab, categoryFilter, statusFilter, searchQuery]);

  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      if (!token) {
        setError("Please login to continue");
        setLoading(false);
        return;
      }

      const apiClient = createApiClient();

      // Build query params
      const params = new URLSearchParams();
      if (categoryFilter !== "All Categories") {
        params.append("category", categoryFilter);
      }
      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const url = `services/${params.toString() ? `?${params.toString()}` : ""}`;

      const response = await apiClient.get(url);

      // Ensure response.data is an array
      const servicesData = Array.isArray(response.data) ? response.data : [];

      // Transform API data to match frontend format with is_active status
      const transformedServices = servicesData.map((service) => ({
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
      }));

      setServices(transformedServices);
    } catch (err) {
      const errorMessage = handleApiError(
        err,
        "Failed to load services. Please try again.",
      );
      setError(errorMessage);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      if (!token) {
        setError("Please login to continue");
        setLoading(false);
        return;
      }

      const apiClient = createApiClient();

      // Build query params
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      if (categoryFilter !== "All Categories") {
        params.append("category", categoryFilter);
      }
      const url = `inventory/${params.toString() ? `?${params.toString()}` : ""}`;

      const response = await apiClient.get(url);

      // Ensure response.data is an array
      const inventoryData = Array.isArray(response.data) ? response.data : [];

      // If the API returns data in a different format, transform it
      const transformedInventory = inventoryData.map((item) => ({
        id: item.id || `INV-${Math.random().toString(36).substr(2, 9)}`,
        originalId: item.id,
        name: item.name || "",
        category: item.category || "",
        sku: item.sku || "",
        quantity: item.quantity || 0,
        unit: item.unit || "Pieces",
        price: item.price ? `₱${Number(item.price).toLocaleString()}` : "₱0",
        supplier: item.supplier || "",
        status: item.status || (item.quantity && item.quantity < 10 ? "Low Stock" : "In Stock"),
        minimum: item.minimum_stock || 10,
      }));

      setInventoryItems(transformedInventory);
    } catch (err) {
      const errorMessage = handleApiError(
        err,
        "Failed to load inventory. Please try again.",
      );
      setError(errorMessage);
      setInventoryItems([]);
    } finally {
      setLoading(false);
    }
  };

  const requestRestock = async (item) => {
    if (!item?.originalId) {
      setError("Unable to request restock for this item.");
      return;
    }

    const defaultQty = Math.max((item.minimum || 10) - (item.current || 0), 1);
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
      setSuccessMessage(`Restock request submitted for "${item.name}".`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const errorMessage = handleApiError(
        err,
        "Failed to submit restock request. Please try again.",
      );
      setError(errorMessage);
    } finally {
      setRequestingRestockId(null);
    }
  };

  const toggleServiceStatus = async (service) => {
    setUpdatingServiceId(service.originalId);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        setError("Please login to continue");
        setUpdatingServiceId(null);
        return;
      }

      const apiClient = createApiClient();
      const newStatus = !service.is_active;

      // Update the service status via API
      await apiClient.patch(`services/${service.originalId}/`, {
        is_active: newStatus,
      });

      // Update local state
      setServices((prevServices) =>
        prevServices.map((s) =>
          s.originalId === service.originalId
            ? { ...s, is_active: newStatus }
            : s,
        ),
      );

      setSuccessMessage(
        `Service "${service.name}" ${newStatus ? "activated" : "deactivated"} successfully!`,
      );

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const errorMessage = handleApiError(
        err,
        "Failed to update service status. Please try again.",
      );
      setError(errorMessage);
    } finally {
      setUpdatingServiceId(null);
    }
  };

  // Safely calculate low stock items - ensure inventoryItems is array
  const lowStockItems = Array.isArray(inventoryItems)
    ? inventoryItems
      .filter(
        (item) => {
          const key = getInventoryStatusKey(item);
          return key === "running_low" || key === "reorder_now" || key === "out_of_stock";
        },
      )
      .map((item) => ({
        originalId: item.originalId,
        sku: item.sku,
        name: item.name,
        current: item.quantity,
        minimum: item.minimum || 10,
        unit: item.unit || "Pieces",
      }))
    : [];

  const getStatusBadge = (item, isActive = true) => {
    if (!isActive) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-gray-500/20 text-gray-400 border-gray-500/30">
          Inactive
        </span>
      );
    }

    const key = getInventoryStatusKey(item);
    const label = getInventoryStatusLabel(item);

    if (key === "available") {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
          {label}
        </span>
      );
    }

    if (key === "running_low") {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-amber-500/20 text-amber-400 border-amber-500/30">
          {label}
        </span>
      );
    }

    if (key === "out_of_stock") {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-gray-500/20 text-gray-300 border-gray-500/30">
          {label}
        </span>
      );
    }

    return (
      <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-red-500/20 text-red-400 border-red-500/30">
        {label}
      </span>
    );
  };

  // Safely filter inventory - ensure inventoryItems is array
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

  // Safely filter services - ensure services is array
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

  // Helper function to render stats icons
  const renderStatIcon = (color, iconType) => {
    const iconPaths = {
      inventory: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
      ),
      value: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
      alert: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      ),
      services: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      ),
      categories: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l5 5a2 2 0 01.586 1.414V19a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"
        />
      ),
      duration: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
    };

    return iconPaths[iconType] || iconPaths.inventory;
  };

  // Calculate active services count
  const activeServicesCount = Array.isArray(services)
    ? services.filter((s) => s.is_active).length
    : 0;

  // Calculate inventory stats safely
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
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Inventory Management
            </h1>
            <p className="text-gray-400 mt-1">
              Track and manage inventory for San Mateo Rizal branch. Services are now managed in the Dashboard.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-gray-900/60 p-1 rounded-xl border border-white/5 w-fit">
          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === "inventory"
                ? "bg-red-500 text-white shadow-lg shadow-red-500/25"
                : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
          >
            Inventory
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {(activeTab === "inventory" ? inventoryStats : serviceStats).map(
            (stat) => (
              <div
                key={stat.label}
                className="bg-gray-900/60 border border-white/5 rounded-2xl p-5 backdrop-blur-sm hover:border-white/10 transition-all"
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
                <div className="text-2xl font-black text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500">{stat.label}</div>
                <div className="text-xs text-gray-600 mt-0.5">{stat.sub}</div>
              </div>
            ),
          )}
        </div>

        {/* Low Stock Alert - Only show for inventory */}
        {activeTab === "inventory" && lowStockItems.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 mb-8 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <svg
                className="w-4 h-4 text-red-400"
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
                  className="bg-gray-900/60 border border-white/5 rounded-xl p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="text-white font-semibold text-sm">
                      {item.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Current:{" "}
                      <span className="text-red-400 font-bold">
                        {item.current} {item.unit}
                      </span>
                      <span className="mx-2 text-gray-700">·</span>
                      Min:{" "}
                      <span className="text-gray-300">
                        {item.minimum} {item.unit}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => requestRestock(item)}
                    disabled={requestingRestockId === item.originalId}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all"
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
              placeholder={`Search ${activeTab === "inventory"
                  ? "by name, SKU, or category..."
                  : "by service name or category..."
                }`}
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
                className="bg-gray-900/60 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all cursor-pointer min-w-[150px]"
              >
                {[
                  "All Categories",
                  "Lubricants",
                  "Brakes",
                  "Filters",
                  "Batteries",
                  "Tires",
                  "Ignition",
                ].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-900/60 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all cursor-pointer min-w-[150px]"
              >
                {[
                  { value: "all", label: "All Status" },
                  { value: "available", label: "Available 🟢" },
                  { value: "running_low", label: "Running Low 🟡" },
                  { value: "reorder_now", label: "Reorder Now 🔴" },
                  { value: "out_of_stock", label: "Out of Stock ⚫" },
                ].map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-gray-900/60 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all cursor-pointer min-w-[150px]"
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

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-red-500 border-t-transparent"></div>
            <p className="text-gray-400 mt-2">Loading...</p>
          </div>
        )}

        {/* Table */}
        {!loading && (
          <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="grid grid-cols-12 gap-3 px-6 py-4 border-b border-white/5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {activeTab === "inventory" ? (
                <>
                  <div className="col-span-2">Name</div>
                  <div className="col-span-2">Category</div>
                  <div className="col-span-2">SKU</div>
                  <div className="col-span-2">Quantity</div>
                  <div className="col-span-1">Price</div>
                  <div className="col-span-2">Supplier</div>
                  <div className="col-span-1 text-right">Status</div>
                </>
              ) : (
                <>
                  <div className="col-span-3">Service Name</div>
                  <div className="col-span-2">Category</div>
                  <div className="col-span-2">Duration</div>
                  <div className="col-span-2">Price</div>
                  <div className="col-span-2">Description</div>
                  <div className="col-span-1 text-center">Status</div>
                </>
              )}
            </div>

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
                    className="grid grid-cols-12 gap-3 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center group"
                  >
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
                        {item.unit}
                      </span>
                    </div>
                    <div className="col-span-1 text-white font-bold text-sm">
                      {item.price}
                    </div>
                    <div className="col-span-2 text-gray-400 text-sm">
                      {item.supplier}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      {getStatusBadge(item)}
                    </div>
                  </div>
                ))
              )
            ) : filteredServices.length === 0 ? (
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
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-gray-500 text-lg">No services found</p>
                <p className="text-gray-600 text-sm mt-1">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              filteredServices.map((service) => (
                <div
                  key={service.id}
                  className="grid grid-cols-12 gap-3 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center group"
                >
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
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${service.is_active ? "bg-emerald-500" : "bg-gray-600"
                        } ${updatingServiceId === service.originalId ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      title={
                        service.is_active
                          ? "Click to deactivate"
                          : "Click to activate"
                      }
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${service.is_active ? "translate-x-6" : "translate-x-1"
                          }`}
                      />
                    </button>
                  </div>
                </div>
              ))
            )}

            {((activeTab === "inventory" && filteredInventory.length > 0) ||
              (activeTab === "services" && filteredServices.length > 0)) && (
                <div className="px-6 py-4">
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
