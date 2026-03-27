import React, { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import ManagerLayout from "./ManagerLayout";
import { API_BASE, useAuth } from "../../hooks/useAuth.js";
import Swal from "sweetalert2";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const createDefaultSchedule = () => {
  const days = DAYS.reduce((acc, day) => {
    acc[day] = {
      enabled: day !== "Sunday",
      start: "08:00",
      end: "17:00",
      hasBreak: true,
      breakStart: "12:00",
      breakEnd: "13:00",
    };
    return acc;
  }, {});

  return {
    recurringWeekly: true,
    slotDuration: "30",
    maxPatientsPerDay: 35,
    days,
    assignments: {},
    exceptions: [],
  };
};

const mergeScheduleConfig = (raw) => {
  const base = createDefaultSchedule();
  if (!raw || typeof raw !== "object") return base;

  const mergedDays = DAYS.reduce((acc, day) => {
    acc[day] = {
      ...base.days[day],
      ...(raw?.days?.[day] ?? {}),
    };
    return acc;
  }, {});

  return {
    ...base,
    ...raw,
    days: mergedDays,
    assignments:
      raw?.assignments && typeof raw.assignments === "object"
        ? raw.assignments
        : {},
    exceptions: Array.isArray(raw?.exceptions) ? raw.exceptions : [],
  };
};

const SECTION_KEYS = ["schedule", "exceptions", "services"];

function ManagerContents() {
  const location = useLocation();
  const { headers } = useAuth();
  const [scheduleConfig, setScheduleConfig] = useState(createDefaultSchedule);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [serviceQuery, setServiceQuery] = useState("");
  const [serviceCategory, setServiceCategory] = useState("All Categories");
  const [updatingServiceId, setUpdatingServiceId] = useState(null);
  const [activeSection, setActiveSection] = useState("schedule");
  const [exceptionDraft, setExceptionDraft] = useState({
    type: "holiday",
    date: "",
    start: "",
    end: "",
    reason: "",
  });

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

  React.useEffect(() => {
    const fetchData = async () => {
      if (!headers.Authorization) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const [servicesRes, scheduleRes] = await Promise.all([
          fetch(`${API_BASE}/services/`, { headers }),
          fetch(`${API_BASE}/api/manager/schedule-config/`, { headers }),
        ]);

        if (!servicesRes.ok) throw new Error("Failed to load services.");
        if (!scheduleRes.ok)
          throw new Error("Failed to load schedule settings.");

        const servicesJson = await servicesRes.json();
        const scheduleJson = await scheduleRes.json();

        const serviceRows = Array.isArray(servicesJson)
          ? servicesJson
          : Array.isArray(servicesJson?.results)
            ? servicesJson.results
            : [];

        setServices(serviceRows);
        setScheduleConfig(mergeScheduleConfig(scheduleJson?.config ?? scheduleJson));
      } catch (err) {
        notify("error", err.message || "Failed to load contents data.");
        setServices([]);
        setScheduleConfig(createDefaultSchedule());
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [headers]);

  React.useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (SECTION_KEYS.includes(hash)) {
      setActiveSection(hash);
      return;
    }
    setActiveSection("schedule");
  }, [location.hash]);

  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
    try {
      const res = await fetch(`${API_BASE}/api/manager/schedule-config/`, {
        method: "PUT",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ config: scheduleConfig }),
      });

      if (!res.ok) throw new Error("Failed to save schedule settings.");

      notify("success", "Schedule settings saved.");
    } catch (err) {
      notify("error", err.message || "Failed to save schedule settings.");
    } finally {
      setSavingSchedule(false);
    }
  };

  const updateDay = (day, patch) => {
    setScheduleConfig((prev) => ({
      ...prev,
      days: {
        ...prev.days,
        [day]: { ...prev.days[day], ...patch },
      },
    }));
  };

  const addException = () => {
    if (!exceptionDraft.date) {
      notify("warning", "Please select a date for the exception.");
      return;
    }

    setScheduleConfig((prev) => ({
      ...prev,
      exceptions: [
        {
          id: Date.now(),
          ...exceptionDraft,
        },
        ...prev.exceptions,
      ],
    }));

    setExceptionDraft({ type: "holiday", date: "", start: "", end: "", reason: "" });
    notify("success", "Schedule override added.");
  };

  const removeException = (id) => {
    setScheduleConfig((prev) => ({
      ...prev,
      exceptions: prev.exceptions.filter((item) => item.id !== id),
    }));
  };

  const toggleServiceStatus = async (service) => {
    setUpdatingServiceId(service.id);

    try {
      const res = await fetch(`${API_BASE}/services/${service.id}/`, {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_active: !service.is_active }),
      });

      if (!res.ok) throw new Error("Failed to update service status.");

      setServices((prev) =>
        prev.map((item) =>
          item.id === service.id ? { ...item, is_active: !item.is_active } : item,
        ),
      );
      notify(
        "success",
        `${service.name} ${service.is_active ? "deactivated" : "activated"}.`,
      );
    } catch (err) {
      notify("error", err.message || "Failed to update service status.");
    } finally {
      setUpdatingServiceId(null);
    }
  };

  const serviceCategories = useMemo(() => {
    const categories = services.map((s) => s.category).filter(Boolean);
    return ["All Categories", ...Array.from(new Set(categories))];
  }, [services]);

  const filteredServices = useMemo(() => {
    const q = serviceQuery.trim().toLowerCase();
    return services.filter((service) => {
      const matchQuery =
        !q ||
        String(service.name || "")
          .toLowerCase()
          .includes(q) ||
        String(service.description || "")
          .toLowerCase()
          .includes(q) ||
        String(service.category || "")
          .toLowerCase()
          .includes(q);

      const matchCategory =
        serviceCategory === "All Categories" || service.category === serviceCategory;

      return matchQuery && matchCategory;
    });
  }, [services, serviceCategory, serviceQuery]);

  if (loading) {
    return (
      <ManagerLayout title="" subtitle="">
        <div className="min-h-screen bg-gray-950 p-8 flex items-center justify-center">
          <div className="text-gray-400 animate-pulse font-bold">
            Loading contents...
          </div>
        </div>
      </ManagerLayout>
    );
  }

  const sectionMeta = {
    schedule: {
      title: "Schedule Management",
      subtitle: "Define working days, hours, break windows, slot duration, and booking limits.",
    },
    exceptions: {
      title: "Exceptions / Overrides",
      subtitle: "Add holidays, half-days, or emergency closures that override regular schedules.",
    },
    services: {
      title: "Services Management",
      subtitle: "Activate, deactivate, and review branch services from this panel.",
    },
  };

  const currentSection = sectionMeta[activeSection] ?? sectionMeta.schedule;

  return (
    <ManagerLayout title="" subtitle="">
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-4 sm:p-6 lg:p-8">
        <div className="mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">{currentSection.title}</h2>
            <p className="text-sm text-gray-500 mt-1">{currentSection.subtitle}</p>
          </div>
        </div>

        {activeSection === "exceptions" && (
          <div className="mb-6 flex justify-start sm:justify-end">
            <button
              onClick={handleSaveSchedule}
              disabled={savingSchedule}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors"
            >
              {savingSchedule ? "Saving..." : "Save Schedule Settings"}
            </button>
          </div>
        )}

        {activeSection === "schedule" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-red-500"
                  checked={scheduleConfig.recurringWeekly}
                  onChange={(e) =>
                    setScheduleConfig((prev) => ({
                      ...prev,
                      recurringWeekly: e.target.checked,
                    }))
                  }
                />
                Recurring weekly schedule
              </label>
              <button
                onClick={handleSaveSchedule}
                disabled={savingSchedule}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors"
              >
                {savingSchedule ? "Saving..." : "Save Schedule Settings"}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {DAYS.map((day) => {
                const cfg = scheduleConfig.days[day];
                return (
                  <div key={day} className="bg-gray-950/70 border border-white/5 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="flex items-center gap-2 text-white font-semibold">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-red-500"
                          checked={cfg.enabled}
                          onChange={(e) => updateDay(day, { enabled: e.target.checked })}
                        />
                        {day}
                      </label>
                      <span
                        className={`text-xs px-2 py-1 rounded-full border ${
                          cfg.enabled
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : "bg-gray-700/50 text-gray-400 border-gray-600"
                        }`}
                      >
                        {cfg.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <label className="text-xs text-gray-400">
                        Start Time
                        <input
                          type="time"
                          disabled={!cfg.enabled}
                          value={cfg.start}
                          onChange={(e) => updateDay(day, { start: e.target.value })}
                          className="mt-1 w-full bg-gray-900 border border-white/10 text-white rounded-lg px-3 py-2 disabled:opacity-50"
                        />
                      </label>
                      <label className="text-xs text-gray-400">
                        End Time
                        <input
                          type="time"
                          disabled={!cfg.enabled}
                          value={cfg.end}
                          onChange={(e) => updateDay(day, { end: e.target.value })}
                          className="mt-1 w-full bg-gray-900 border border-white/10 text-white rounded-lg px-3 py-2 disabled:opacity-50"
                        />
                      </label>
                    </div>

                    <label className="flex items-center gap-2 text-xs text-gray-300 mb-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-red-500"
                        checked={cfg.hasBreak}
                        disabled={!cfg.enabled}
                        onChange={(e) => updateDay(day, { hasBreak: e.target.checked })}
                      />
                      Enable break time
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="text-xs text-gray-400">
                        Break Start
                        <input
                          type="time"
                          disabled={!cfg.enabled || !cfg.hasBreak}
                          value={cfg.breakStart}
                          onChange={(e) => updateDay(day, { breakStart: e.target.value })}
                          className="mt-1 w-full bg-gray-900 border border-white/10 text-white rounded-lg px-3 py-2 disabled:opacity-50"
                        />
                      </label>
                      <label className="text-xs text-gray-400">
                        Break End
                        <input
                          type="time"
                          disabled={!cfg.enabled || !cfg.hasBreak}
                          value={cfg.breakEnd}
                          onChange={(e) => updateDay(day, { breakEnd: e.target.value })}
                          className="mt-1 w-full bg-gray-900 border border-white/10 text-white rounded-lg px-3 py-2 disabled:opacity-50"
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="text-sm text-gray-400">
                Slot Duration
                <select
                  value={scheduleConfig.slotDuration}
                  onChange={(e) =>
                    setScheduleConfig((prev) => ({ ...prev, slotDuration: e.target.value }))
                  }
                  className="mt-1 w-full bg-gray-900 border border-white/10 text-white rounded-lg px-3 py-2"
                >
                  <option value="15">15 mins</option>
                  <option value="30">30 mins</option>
                  <option value="60">1 hour</option>
                </select>
              </label>
              <label className="text-sm text-gray-400">
                Maximum Jobs Per Day
                <input
                  type="number"
                  min="1"
                  value={scheduleConfig.maxPatientsPerDay}
                  onChange={(e) =>
                    setScheduleConfig((prev) => ({
                      ...prev,
                      maxPatientsPerDay: Number(e.target.value) || 1,
                    }))
                  }
                  className="mt-1 w-full bg-gray-900 border border-white/10 text-white rounded-lg px-3 py-2"
                />
              </label>
            </div>
          </div>
        )}

        {activeSection === "exceptions" && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
              <select
                value={exceptionDraft.type}
                onChange={(e) => setExceptionDraft((prev) => ({ ...prev, type: e.target.value }))}
                className="bg-gray-900 border border-white/10 text-white rounded-lg px-3 py-2"
              >
                <option value="holiday">Holiday</option>
                <option value="half_day">Half-day</option>
                <option value="emergency_closure">Emergency closure</option>
              </select>
              <input
                type="date"
                value={exceptionDraft.date}
                onChange={(e) => setExceptionDraft((prev) => ({ ...prev, date: e.target.value }))}
                className="bg-gray-900 border border-white/10 text-white rounded-lg px-3 py-2"
              />
              <input
                type="time"
                value={exceptionDraft.start}
                onChange={(e) => setExceptionDraft((prev) => ({ ...prev, start: e.target.value }))}
                className="bg-gray-900 border border-white/10 text-white rounded-lg px-3 py-2"
              />
              <input
                type="time"
                value={exceptionDraft.end}
                onChange={(e) => setExceptionDraft((prev) => ({ ...prev, end: e.target.value }))}
                className="bg-gray-900 border border-white/10 text-white rounded-lg px-3 py-2"
              />
              <input
                type="text"
                placeholder="Reason"
                value={exceptionDraft.reason}
                onChange={(e) => setExceptionDraft((prev) => ({ ...prev, reason: e.target.value }))}
                className="bg-gray-900 border border-white/10 text-white rounded-lg px-3 py-2"
              />
            </div>

            <div className="flex justify-end mb-4">
              <button
                onClick={addException}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold"
              >
                Add Override
              </button>
            </div>

            {scheduleConfig.exceptions.length === 0 ? (
              <p className="text-sm text-gray-500">No exceptions configured.</p>
            ) : (
              <div className="space-y-2">
                {scheduleConfig.exceptions.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gray-950/70 border border-white/5 rounded-xl p-3 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-sm text-white font-semibold">
                        {item.type.replace("_", " ")} - {item.date}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {item.start || "--:--"} - {item.end || "--:--"}
                        {item.reason ? ` - ${item.reason}` : ""}
                      </div>
                    </div>
                    <button
                      onClick={() => removeException(item.id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSection === "services" && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-5">
              <div className="grid grid-cols-2 gap-2 w-full md:w-auto md:min-w-[360px]">
                <input
                  type="text"
                  placeholder="Search service"
                  value={serviceQuery}
                  onChange={(e) => setServiceQuery(e.target.value)}
                  className="bg-gray-900 border border-white/10 text-white rounded-lg px-3 py-2"
                />
                <select
                  value={serviceCategory}
                  onChange={(e) => setServiceCategory(e.target.value)}
                  className="bg-gray-900 border border-white/10 text-white rounded-lg px-3 py-2"
                >
                  {serviceCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="bg-gray-950/70 border border-white/5 rounded-xl p-3">
                <div className="text-gray-500 text-xs">Total Services</div>
                <div className="text-white text-2xl font-black mt-1">{services.length}</div>
              </div>
              <div className="bg-gray-950/70 border border-white/5 rounded-xl p-3">
                <div className="text-gray-500 text-xs">Active Services</div>
                <div className="text-emerald-300 text-2xl font-black mt-1">
                  {services.filter((s) => s.is_active !== false).length}
                </div>
              </div>
              <div className="bg-gray-950/70 border border-white/5 rounded-xl p-3">
                <div className="text-gray-500 text-xs">Visible in List</div>
                <div className="text-red-300 text-2xl font-black mt-1">{filteredServices.length}</div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[760px]">
                <thead className="bg-gray-950/80 text-gray-400 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3 text-left">Service</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">Duration</th>
                    <th className="px-4 py-3 text-left">Price</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServices.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-10 text-center text-gray-500">
                        No services found.
                      </td>
                    </tr>
                  ) : (
                    filteredServices.map((service) => (
                      <tr key={service.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                        <td className="px-4 py-3">
                          <div className="text-white font-semibold text-sm">{service.name}</div>
                          <div className="text-gray-500 text-xs mt-0.5 line-clamp-1">
                            {service.description || "No description"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-300 text-sm">{service.category || "-"}</td>
                        <td className="px-4 py-3 text-gray-300 text-sm">{service.duration || "-"}</td>
                        <td className="px-4 py-3 text-white text-sm font-semibold">
                          {service.price_display ||
                            (service.price ? `P${Number(service.price).toLocaleString()}` : "P0")}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => toggleServiceStatus(service)}
                            disabled={updatingServiceId === service.id}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              service.is_active !== false ? "bg-emerald-500" : "bg-gray-600"
                            } ${
                              updatingServiceId === service.id
                                ? "opacity-50 cursor-not-allowed"
                                : "cursor-pointer"
                            }`}
                            title={service.is_active !== false ? "Deactivate" : "Activate"}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                service.is_active !== false ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </ManagerLayout>
  );
}

export default ManagerContents;
