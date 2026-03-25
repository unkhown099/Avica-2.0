import React, { useState, useEffect, useMemo } from "react";
import CustomerLayout from "./CustomerLayout";
import { API_BASE } from "../../hooks/useAuth.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const TIME_SLOTS = [
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
];

const STEPS = ["Service", "Branch", "Schedule", "Details"];

const statusConfig = {
  confirmed: {
    label: "Confirmed",
    color: "bg-green-600/20 text-green-400 border-green-600/30",
  },
  pending: {
    label: "Pending",
    color: "bg-yellow-600/20 text-yellow-400 border-yellow-600/30",
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-600/20 text-red-400 border-red-600/30",
  },
  done: {
    label: "Completed",
    color: "bg-blue-600/20 text-blue-400 border-blue-600/30",
  },
};

const CATEGORY_ICON = {
  Maintenance: "🔧",
  Repair: "🔩",
  Diagnostic: "🔍",
  Cosmetic: "✨",
};

const PAGE_SIZE = 10; // bookings per page

// ─── Utilities ────────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function authHeaders() {
  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("access") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("access_token") ||
    sessionStorage.getItem("access") ||
    sessionStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function formatTimeForAPI(timeString) {
  if (!timeString) return "";
  const [time, modifier] = timeString.split(" ");
  let [hours, minutes] = time.split(":");
  if (modifier === "PM" && hours !== "12") hours = parseInt(hours, 10) + 12;
  else if (modifier === "AM" && hours === "12") hours = "00";
  return `${hours.toString().padStart(2, "0")}:${minutes}:00`;
}

function toDisplayTime(t) {
  if (!t) return "";
  if (t.includes("AM") || t.includes("PM")) return t;
  const [hStr, mStr] = t.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr || "00";
  const period = h >= 12 ? "PM" : "AM";
  if (h > 12) h -= 12;
  else if (h === 0) h = 12;
  return `${h}:${m} ${period}`;
}

// ─── Pagination Controls ──────────────────────────────────────────────────────

function Pagination({ current, total, onChange }) {
  if (total <= 1) return null;

  const pages = [];
  for (let i = 1; i <= total; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      <button
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-red-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
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

      {pages.map((p) => {
        // Show first, last, current, and neighbours; collapse others with ellipsis
        const show = p === 1 || p === total || Math.abs(p - current) <= 1;
        const ellipsisBefore = p === current - 2 && current > 3;
        const ellipsisAfter = p === current + 2 && current < total - 2;

        if (ellipsisBefore || ellipsisAfter) {
          return (
            <span
              key={`dots-${p}`}
              className="w-9 h-9 flex items-center justify-center text-gray-600 text-sm"
            >
              …
            </span>
          );
        }
        if (!show) return null;

        return (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${p === current
              ? "bg-red-600 text-white shadow-lg shadow-red-600/30 border border-red-500"
              : "border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-red-500/50"
              }`}
          >
            {p}
          </button>
        );
      })}

      <button
        onClick={() => onChange(current + 1)}
        disabled={current === total}
        className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-red-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
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
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }) {
  return (
    <div className="flex items-center px-6 py-4 border-b border-white/8 flex-shrink-0">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${done
                  ? "bg-red-600 text-white"
                  : active
                    ? "bg-red-600/20 border-2 border-red-500 text-red-400"
                    : "bg-white/5 border border-white/10 text-gray-600"
                  }`}
              >
                {done ? (
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-[10px] font-semibold tracking-wide uppercase ${active
                  ? "text-red-400"
                  : done
                    ? "text-gray-400"
                    : "text-gray-600"
                  }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-px flex-1 mx-2 mb-4 transition-all duration-500 ${done ? "bg-red-600" : "bg-white/8"}`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Damage Detection Modal ───────────────────────────────────────────────────

function DamageDetectionModal({ onClose, onBack }) {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState("");

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImages((prev) => [
      ...prev,
      ...files.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        name: file.name,
      })),
    ]);
    setError("");
  };

  const removeImage = (index) => {
    setImages((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[index].preview);
      next.splice(index, 1);
      return next;
    });
  };

  const analyzeDamage = async () => {
    if (images.length === 0) {
      setError("Please upload at least one image");
      return;
    }
    setUploading(true);
    setError("");
    try {
      await new Promise((r) => setTimeout(r, 2000));
      setAnalysisResult({
        damageDetected: true,
        confidence: 0.92,
        damages: [
          {
            type: "Scratch",
            location: "Front bumper",
            severity: "Minor",
            confidence: 0.95,
          },
          {
            type: "Dent",
            location: "Driver's door",
            severity: "Moderate",
            confidence: 0.88,
          },
          {
            type: "Paint chip",
            location: "Hood",
            severity: "Minor",
            confidence: 0.93,
          },
        ],
        recommendations: [
          "Paint touch-up recommended for scratches",
          "Paintless dent removal possible for door dent",
          "Full exterior detailing suggested",
        ],
        estimatedCost: "₱3,500 – ₱5,000",
      });
    } catch {
      setError("Failed to analyze images. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <div
        className="fixed inset-y-0 right-0 z-50 w-full max-w-lg flex flex-col bg-[#0a0a0a] border-l border-white/8 shadow-2xl overflow-hidden"
        style={{ animation: "drawerIn 0.32s cubic-bezier(0.16,1,0.3,1)" }}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/8 flex-shrink-0">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">
              <span className="text-red-500">AI Damage</span> Detection
            </h2>
            <p className="text-gray-500 text-xs mt-0.5">
              Upload photos for AI analysis
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white transition-colors flex items-center justify-center"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!analysisResult ? (
            <>
              <div className="mb-6">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                  Upload Vehicle Photos
                </p>
                <div
                  className="border-2 border-dashed border-white/10 rounded-2xl p-6 text-center hover:border-red-500/50 transition-colors cursor-pointer"
                  onClick={() =>
                    document.getElementById("damage-images").click()
                  }
                >
                  <input
                    type="file"
                    id="damage-images"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <div className="w-16 h-16 bg-red-600/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="w-8 h-8 text-red-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-white font-semibold mb-1">
                    Click to upload photos
                  </p>
                  <p className="text-gray-600 text-xs">
                    Supported: JPG, PNG, HEIC (max 10MB each)
                  </p>
                </div>
              </div>
              {images.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                    Uploaded Photos ({images.length})
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {images.map((img, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={img.preview}
                          alt={`Damage ${i + 1}`}
                          className="w-full h-32 object-cover rounded-xl border border-white/10"
                        />
                        <button
                          onClick={() => removeImage(i)}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-600/90 hover:bg-red-700 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="bg-white/4 rounded-xl p-4 border border-white/8">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                  Tips for best results
                </p>
                <ul className="space-y-2 text-sm text-gray-400">
                  {[
                    "Take photos in good lighting",
                    "Capture damages from multiple angles",
                    "Include a reference object for scale",
                    "Avoid blurry or dark images",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2">
                      <span className="text-red-500">•</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-green-600/20 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-bold text-lg">
                    Analysis Complete
                  </p>
                  <p className="text-gray-500 text-sm">
                    Confidence: {(analysisResult.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Detected Damages
                </p>
                {analysisResult.damages.map((d, i) => (
                  <div
                    key={i}
                    className="bg-white/4 rounded-xl p-4 border border-white/8"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-semibold">{d.type}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${d.severity === "Minor" ? "bg-yellow-600/20 text-yellow-400" : d.severity === "Moderate" ? "bg-orange-600/20 text-orange-400" : "bg-red-600/20 text-red-400"}`}
                      >
                        {d.severity}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Location: {d.location}
                    </p>
                    <p className="text-gray-500 text-xs">
                      Confidence: {(d.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                ))}
              </div>
              <div className="mb-6">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                  Recommendations
                </p>
                <ul className="space-y-2">
                  {analysisResult.recommendations.map((r, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-gray-300 text-sm"
                    >
                      <span className="text-red-500">•</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-red-600/10 rounded-xl p-4 border border-red-600/20">
                <p className="text-gray-400 text-sm mb-1">
                  Estimated Repair Cost
                </p>
                <p className="text-2xl font-black text-white">
                  {analysisResult.estimatedCost}
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  *Final cost may vary after physical inspection
                </p>
              </div>
            </div>
          )}
          {error && (
            <div className="mt-4 flex items-center gap-2 bg-red-600/10 border border-red-600/25 rounded-xl px-4 py-3 text-red-400 text-sm">
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-5 border-t border-white/8 flex-shrink-0 bg-[#0a0a0a]">
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-xl border border-white/10 bg-white/5 text-gray-300 hover:text-white font-semibold text-sm transition-all"
          >
            Cancel
          </button>
          {!analysisResult ? (
            <button
              onClick={analyzeDamage}
              disabled={images.length === 0 || uploading}
              className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Analyzing...
                </>
              ) : (
                "Analyze Damage"
              )}
            </button>
          ) : (
            <button
              onClick={() =>
                onBack({ type: "booking", damageData: analysisResult })
              }
              className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              Proceed to Booking
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
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ─── New Booking Modal ────────────────────────────────────────────────────────

function NewBookingModal({ onClose, onSuccess, initialDamageData }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    service: null,
    branch: null,
    date: "",
    time: "",
    vehicle: "",
    plateNumber: "",
    notes: initialDamageData
      ? `Damage detected: ${initialDamageData.damages.map((d) => d.type).join(", ")}. Recommendations: ${initialDamageData.recommendations.join(", ")}`
      : "",
    damageData: initialDamageData,
  });

  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState("");

  useEffect(() => {
    setServicesLoading(true);
    fetch(`${API_BASE}/services/`, {
      headers: authHeaders(),
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load services.");
        return r.json();
      })
      .then((data) =>
        setServices(
          (Array.isArray(data) ? data : (data.results ?? [])).filter(
            (s) => s.is_active !== false,
          ),
        ),
      )
      .catch((err) => setServicesError(err.message))
      .finally(() => setServicesLoading(false));
  }, []);

  const [branches, setBranches] = useState([]);
  const [branchLoading, setBranchLoading] = useState(true);
  const [branchError, setBranchError] = useState("");

  useEffect(() => {
    setBranchLoading(true);
    fetch(`${API_BASE}/branches/`, {
      headers: authHeaders(),
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load branches.");
        return r.json();
      })
      .then((data) =>
        setBranches(Array.isArray(data) ? data : (data.results ?? [])),
      )
      .catch((err) => setBranchError(err.message))
      .finally(() => setBranchLoading(false));
  }, []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const set = (key, value) => {
    setForm((p) => ({ ...p, [key]: value }));
    setError("");
    setFieldErrors((prev) => ({ ...prev, [key]: null }));
  };

  const canAdvance = () => {
    if (step === 0) return !!form.service;
    if (step === 1) return !!form.branch;
    if (step === 2) return !!form.date && !!form.time;
    return true;
  };

  const handleNext = () => {
    if (!canAdvance()) {
      setError("Please complete this step before continuing.");
      return;
    }
    setError("");
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setFieldErrors({});
    try {
      if (!form.service?.id) throw new Error("Please select a service");
      if (!form.branch?.id) throw new Error("Please select a branch");
      if (!form.date || !form.time)
        throw new Error("Please select date and time");
      const vehicle = (form.vehicle ?? "").trim();
      const plateNumber = (form.plateNumber ?? "").trim();
      if (!vehicle || !plateNumber)
        throw new Error("Please enter vehicle details");

      const payload = {
        service: form.service.name,
        branch_id: parseInt(form.branch.id, 10),
        date: form.date,
        time: formatTimeForAPI(form.time),
        vehicle,
        plate_number: plateNumber,
        notes: form.notes || "",
        price: parseFloat(form.service.price_min ?? form.service.price ?? 0),
      };

      const res = await fetch(
        `${API_BASE}/api/bookings/`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (errorData && typeof errorData === "object") {
          const newFieldErrors = {};
          let errorMessage = "";
          Object.entries(errorData).forEach(([field, errors]) => {
            if (field === "non_field_errors" || field === "detail")
              errorMessage = Array.isArray(errors) ? errors[0] : errors;
            else
              newFieldErrors[field] = Array.isArray(errors)
                ? errors[0]
                : errors;
          });
          if (Object.keys(newFieldErrors).length > 0) {
            setFieldErrors(newFieldErrors);
            throw new Error(
              Object.values(newFieldErrors)[0] ||
              "Please check the form for errors.",
            );
          } else if (errorMessage) throw new Error(errorMessage);
          else
            throw new Error(
              "Failed to create booking. Please check your input.",
            );
        }
        throw new Error(`Error ${res.status}: Failed to create booking.`);
      }

      onSuccess(await res.json());
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <div
        className="fixed inset-y-0 right-0 z-50 w-full max-w-lg flex flex-col bg-[#0a0a0a] border-l border-white/8 shadow-2xl overflow-hidden"
        style={{ animation: "drawerIn 0.32s cubic-bezier(0.16,1,0.3,1)" }}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/8 flex-shrink-0">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Book an <span className="text-red-500">Appointment</span>
            </h2>
            <p className="text-gray-500 text-xs mt-0.5">
              Step {step + 1} of {STEPS.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white transition-colors flex items-center justify-center"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <StepIndicator current={step} />

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* STEP 0 — Service */}
          {step === 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                Choose a Service
              </p>
              {servicesLoading ? (
                <div className="flex items-center justify-center py-16 text-gray-500">
                  <svg
                    className="w-5 h-5 animate-spin mr-3"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Loading services…
                </div>
              ) : servicesError ? (
                <div className="text-center py-16 text-red-400 text-sm">
                  {servicesError}
                </div>
              ) : services.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  No services available.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {services.map((s) => {
                    const active = form.service?.id === s.id;
                    const icon = CATEGORY_ICON[s.category] ?? "🔧";
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => set("service", s)}
                        className={`p-4 rounded-2xl border text-left transition-all duration-200 relative ${active ? "border-red-500 bg-red-600/12 shadow-lg shadow-red-600/10" : "border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/5"}`}
                      >
                        <div className="text-2xl mb-2">{icon}</div>
                        <div
                          className={`font-bold text-sm mb-1 ${active ? "text-white" : "text-gray-300"}`}
                        >
                          {s.name}
                        </div>
                        <div className="text-red-400 font-black text-base">
                          {s.price_min &&
                            s.price_max &&
                            s.price_min !== s.price_max
                            ? `₱${parseFloat(s.price_min).toLocaleString()} – ₱${parseFloat(s.price_max).toLocaleString()}`
                            : `₱${parseFloat(s.price_min || s.price || 0).toLocaleString()}`}
                        </div>
                        {s.duration && (
                          <div className="text-gray-600 text-xs mt-1">
                            ⏱ {s.duration}
                          </div>
                        )}
                        {s.category && (
                          <div className="text-gray-600 text-xs">
                            {s.category}
                          </div>
                        )}
                        {active && (
                          <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-red-600 flex items-center justify-center">
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 1 — Branch */}
          {step === 1 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                Choose a Branch
              </p>
              {branchLoading ? (
                <div className="flex items-center justify-center py-16 text-gray-500">
                  <svg
                    className="w-5 h-5 animate-spin mr-3"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Loading branches…
                </div>
              ) : branchError ? (
                <div className="text-center py-16 text-red-400 text-sm">
                  {branchError}
                </div>
              ) : branches.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  No branches available.
                </div>
              ) : (
                <div className="space-y-3">
                  {branches.map((b) => {
                    const active = form.branch?.id === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => set("branch", b)}
                        className={`w-full p-4 rounded-2xl border text-left transition-all duration-200 flex items-start gap-4 ${active ? "border-red-500 bg-red-600/12 shadow-lg shadow-red-600/10" : "border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/5"}`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${active ? "bg-red-600" : "bg-white/8"}`}
                        >
                          <svg
                            className={`w-4 h-4 ${active ? "text-white" : "text-gray-500"}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className={`font-bold text-sm mb-0.5 ${active ? "text-white" : "text-gray-200"}`}
                          >
                            {b.name}
                          </div>
                          <div className="text-gray-500 text-xs mb-1 truncate">
                            {b.address}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-gray-600 text-xs">
                              {b.hours}
                            </span>
                            <span className="text-green-400 text-xs font-semibold">
                              {b.slots} slots open
                            </span>
                          </div>
                        </div>
                        {active && (
                          <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0 mt-1">
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 2 — Schedule */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                  Pick a Date
                </p>
                <input
                  type="date"
                  min={todayISO()}
                  value={form.date}
                  onChange={(e) => set("date", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500 transition-colors [color-scheme:dark]"
                />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                  Pick a Time Slot
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {TIME_SLOTS.map((t) => {
                    const active = form.time === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => set("time", t)}
                        className={`py-3 rounded-xl border text-sm font-bold transition-all duration-200 ${active ? "border-red-500 bg-red-600/15 text-white shadow-md shadow-red-600/10" : "border-white/8 bg-white/3 text-gray-400 hover:border-white/20 hover:text-white"}`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
              {form.date && form.time && (
                <div className="flex items-center gap-3 bg-white/4 rounded-xl px-4 py-3 border border-white/8">
                  <svg
                    className="w-4 h-4 text-red-500 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-gray-300 text-sm">
                    <span className="text-white font-semibold">
                      {form.date}
                    </span>{" "}
                    at{" "}
                    <span className="text-white font-semibold">
                      {form.time}
                    </span>
                    {" · "}
                    <span className="text-gray-500">{form.branch?.name}</span>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* STEP 3 — Details */}
          {step === 3 && (
            <div className="space-y-5">
              {form.damageData && (
                <div className="bg-blue-600/10 border border-blue-600/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <svg
                      className="w-5 h-5 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-blue-400 font-semibold text-sm">
                      Damage Detection Data Included
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs">
                    AI analysis results will be attached to your booking
                  </p>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Vehicle Type <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Toyota Vios, Honda Civic..."
                  value={form.vehicle}
                  onChange={(e) => set("vehicle", e.target.value)}
                  className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-red-500 transition-colors ${fieldErrors.vehicle ? "border-red-500" : "border-white/10"}`}
                />
                {fieldErrors.vehicle && (
                  <p className="text-red-400 text-xs mt-1">
                    {fieldErrors.vehicle}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Plate Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. ABC 1234"
                  value={form.plateNumber}
                  onChange={(e) => set("plateNumber", e.target.value)}
                  className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-red-500 transition-colors ${fieldErrors.plate_number ? "border-red-500" : "border-white/10"}`}
                />
                {fieldErrors.plate_number && (
                  <p className="text-red-400 text-xs mt-1">
                    {fieldErrors.plate_number}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Special Requests{" "}
                  <span className="text-gray-600 font-normal normal-case">
                    (optional)
                  </span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Specific areas of concern, access instructions..."
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-red-500 transition-colors resize-none"
                />
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/3 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/8">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    Booking Summary
                  </p>
                </div>
                <div className="divide-y divide-white/5">
                  {[
                    { label: "Service", value: form.service?.name },
                    { label: "Branch", value: form.branch?.name },
                    { label: "Date", value: form.date },
                    { label: "Time", value: form.time },
                    {
                      label: "Price Range",
                      value: form.service
                        ? form.service.price_min &&
                          form.service.price_max &&
                          form.service.price_min !== form.service.price_max
                          ? `₱${parseFloat(form.service.price_min).toLocaleString()} – ₱${parseFloat(form.service.price_max).toLocaleString()}`
                          : `₱${parseFloat(form.service.price_min || form.service.price || 0).toLocaleString()}`
                        : "—",
                      highlight: true,
                    },
                  ].map(({ label, value, highlight }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between px-4 py-2.5"
                    >
                      <span className="text-gray-500 text-sm">{label}</span>
                      <span
                        className={`text-sm font-semibold ${highlight ? "text-red-400 text-base font-black" : "text-white"}`}
                      >
                        {value || "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-center gap-2 bg-red-600/10 border border-red-600/25 rounded-xl px-4 py-3 text-red-400 text-sm">
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-5 border-t border-white/8 flex-shrink-0 bg-[#0a0a0a]">
          <button
            type="button"
            onClick={
              step > 0
                ? () => {
                  setStep((s) => s - 1);
                  setError("");
                  setFieldErrors({});
                }
                : onClose
            }
            className="px-5 py-3 rounded-xl border border-white/10 bg-white/5 text-gray-300 hover:text-white hover:border-white/20 font-semibold text-sm transition-all"
          >
            {step > 0 ? "Back" : "Cancel"}
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-lg shadow-red-600/25 transition-all flex items-center justify-center gap-2"
            >
              Continue
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
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg shadow-red-600/25 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  Confirm Booking
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </>
              )}
            </button>
          )}
        </div>
      </div>
      <style>{`@keyframes drawerIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </>
  );
}

// ─── Option Selector Modal ────────────────────────────────────────────────────

function OptionSelectorModal({ onClose, onSelectOption }) {
  return (
    <>
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <div
        className="fixed inset-y-0 right-0 z-50 w-full max-w-md flex flex-col bg-[#0a0a0a] border-l border-white/8 shadow-2xl overflow-hidden"
        style={{ animation: "drawerIn 0.32s cubic-bezier(0.16,1,0.3,1)" }}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/8 flex-shrink-0">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Choose <span className="text-red-500">Option</span>
            </h2>
            <p className="text-gray-500 text-xs mt-0.5">
              Select what you'd like to do
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white transition-colors flex items-center justify-center"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="space-y-4">
            {[
              {
                key: "booking",
                title: "Book an Appointment",
                desc: "Schedule a service for your vehicle",
                accent: "red",
                icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
                cta: "Get started",
              },
              {
                key: "damage",
                title: "Damage Detection",
                desc: "Use AI to analyze vehicle damage before booking",
                accent: "blue",
                icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
                cta: "Upload photos",
              },
            ].map(({ key, title, desc, accent, icon, cta }) => (
              <button
                key={key}
                onClick={() => onSelectOption(key)}
                className={`w-full p-6 rounded-2xl border border-white/8 bg-gradient-to-br from-gray-900 to-${accent}-950/10 hover:border-${accent}-500 hover:bg-${accent}-600/5 transition-all duration-300 text-left group`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-14 h-14 rounded-xl bg-${accent}-600/20 flex items-center justify-center group-hover:bg-${accent}-600/30 transition-colors`}
                  >
                    <svg
                      className={`w-7 h-7 text-${accent}-500`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={icon}
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">
                      {title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-3">{desc}</p>
                    <div
                      className={`flex items-center gap-2 text-${accent}-400 text-sm font-semibold`}
                    >
                      {cta}
                      <svg
                        className="w-4 h-4 group-hover:translate-x-1 transition-transform"
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
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Success Toast ─────────────────────────────────────────────────────────────

function SuccessToast({ message, onDismiss }) {
  return (
    <div
      className="fixed bottom-6 right-6 z-[60] flex items-center gap-3 bg-green-600 text-white px-5 py-4 rounded-2xl shadow-2xl shadow-green-600/40"
      style={{ animation: "toastUp 0.3s ease-out" }}
    >
      <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <span className="font-semibold text-sm">{message}</span>
      <button onClick={onDismiss} className="ml-1 opacity-70 hover:opacity-100">
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
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
      <style>{`
        @keyframes toastUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes drawerIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [showOptionModal, setShowOptionModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showDamageModal, setShowDamageModal] = useState(false);
  const [damageData, setDamageData] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/bookings/`, {
      headers: authHeaders(),
    })
      .then((r) => {
        if (!r.ok)
          throw new Error(`Error ${r.status}: Failed to load bookings.`);
        return r.json();
      })
      .then((data) =>
        setBookings(Array.isArray(data) ? data : (data.results ?? [])),
      )
      .catch((err) => setFetchError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Reset to page 1 whenever filter changes
  useEffect(() => {
    setPage(1);
  }, [filter]);

  const filtered = useMemo(
    () =>
      filter === "all" ? bookings : bookings.filter((b) => b.status === filter),
    [bookings, filter],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleCancel = async (id) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/bookings/${id}/`,
        {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({ status: "cancelled" }),
        },
      );
      if (!res.ok) throw new Error();
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)),
      );
    } catch {
      setToast("Failed to cancel booking. Please try again.");
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleBookingSuccess = (newBooking) => {
    setBookings((prev) => [newBooking, ...prev]);
    setShowBookingModal(false);
    setShowDamageModal(false);
    setDamageData(null);
    setPage(1);
    setToast("Your booking was submitted successfully!");
    setTimeout(() => setToast(null), 4500);
  };

  const handleOptionSelect = (option) => {
    setShowOptionModal(false);
    option === "booking" ? setShowBookingModal(true) : setShowDamageModal(true);
  };

  const handleDamageComplete = (data) => {
    if (data.type === "booking" && data.damageData) {
      setDamageData(data.damageData);
      setShowDamageModal(false);
      setShowBookingModal(true);
    }
  };

  return (
    <CustomerLayout>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-950/30 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">
              My <span className="text-red-600">Bookings</span>
            </h1>
            <p className="text-gray-400">
              Manage and track all your appointments.
            </p>
          </div>
          <button
            onClick={() => setShowOptionModal(true)}
            className="self-start sm:self-auto bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-xl shadow-red-600/30 flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Booking
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total", value: bookings.length, color: "text-white" },
            {
              label: "Confirmed",
              value: bookings.filter((b) => b.status === "confirmed").length,
              color: "text-green-400",
            },
            {
              label: "Pending",
              value: bookings.filter((b) => b.status === "pending").length,
              color: "text-yellow-400",
            },
            {
              label: "Completed",
              value: bookings.filter((b) => b.status === "done").length,
              color: "text-blue-400",
            },
            {
              label: "Cancelled",
              value: bookings.filter((b) => b.status === "cancelled").length,
              color: "text-red-400",
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="bg-gradient-to-br from-gray-900 to-red-950/10 rounded-xl p-5 border border-white/5 text-center"
            >
              <div className={`text-3xl font-black ${color} mb-1`}>{value}</div>
              <div className="text-sm text-gray-500">{label}</div>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {["all", "confirmed", "pending", "done", "cancelled"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-xl font-semibold text-sm capitalize transition-all ${filter === f
                ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                : "bg-gray-900 text-gray-400 border border-white/10 hover:text-white hover:border-red-600/40"
                }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Results meta */}
        {!loading && !fetchError && filtered.length > 0 && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              Showing{" "}
              <span className="text-white font-semibold">
                {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, filtered.length)}
              </span>{" "}
              of{" "}
              <span className="text-white font-semibold">
                {filtered.length}
              </span>{" "}
              bookings
            </p>
            <p className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </p>
          </div>
        )}

        {/* Bookings List */}
        <div className="space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-24 text-gray-500">
              <svg
                className="w-6 h-6 animate-spin mr-3"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Loading your bookings…
            </div>
          )}

          {!loading && fetchError && (
            <div className="flex items-center gap-3 bg-red-600/10 border border-red-600/25 rounded-2xl px-6 py-5 text-red-400">
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {fetchError}
            </div>
          )}

          {!loading &&
            !fetchError &&
            paginated.map((booking) => {
              const sc = statusConfig[booking.status] || statusConfig.pending;

              const rawSvc = booking.service;
              const serviceName =
                booking.service_name ||
                booking.service_detail?.name ||
                (typeof rawSvc === "string" &&
                  rawSvc.trim() !== "" &&
                  isNaN(rawSvc)
                  ? rawSvc
                  : typeof rawSvc === "number" ||
                    (typeof rawSvc === "string" && !isNaN(rawSvc))
                    ? `Service #${rawSvc}`
                    : String(rawSvc || "Unknown Service"));

              const displayTime = toDisplayTime(booking.time);

              const rawPrice = parseFloat(booking.price);
              const priceDisplay =
                !isNaN(rawPrice) &&
                  booking.price != null &&
                  booking.price !== ""
                  ? rawPrice > 0
                    ? `₱${rawPrice.toLocaleString("en-PH")}`
                    : "To be assessed"
                  : "—";

              return (
                <div
                  key={booking.id}
                  className="bg-gradient-to-br from-gray-900 to-red-950/10 rounded-2xl p-6 border border-white/5 hover:border-red-600/30 transition-all duration-300"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <h3 className="text-xl font-black text-white">
                          {serviceName}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${sc.color}`}
                        >
                          {sc.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-5 gap-y-2 text-gray-400 text-sm">
                        {[
                          {
                            icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
                            text: booking.date,
                          },
                          {
                            icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
                            text: displayTime,
                          },
                          booking.staff && {
                            icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
                            text: booking.staff,
                          },
                          booking.branch && {
                            icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z",
                            text:
                              typeof booking.branch === "object"
                                ? booking.branch.name
                                : booking.branch,
                          },
                        ]
                          .filter(Boolean)
                          .map(
                            ({ icon, text }) =>
                              text && (
                                <div
                                  key={icon}
                                  className="flex items-center gap-2"
                                >
                                  <svg
                                    className="w-4 h-4 text-red-600 flex-shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d={icon}
                                    />
                                  </svg>
                                  {text}
                                </div>
                              ),
                          )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="text-2xl font-black text-white">
                        {priceDisplay}
                      </div>
                      {booking.status !== "cancelled" &&
                        booking.status !== "done" && (
                          <div className="flex gap-2">
                            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-sm font-semibold transition-colors">
                              Reschedule
                            </button>
                            <button
                              onClick={() => handleCancel(booking.id)}
                              className="px-4 py-2 bg-red-600/20 hover:bg-red-600 border border-red-600/40 text-red-400 hover:text-white rounded-xl text-sm font-semibold transition-all duration-200"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              );
            })}

          {!loading && !fetchError && filtered.length === 0 && (
            <div className="text-center py-24 text-gray-500">
              <svg
                className="w-16 h-16 mx-auto mb-4 opacity-20"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-lg font-semibold">No bookings found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <Pagination current={page} total={totalPages} onChange={setPage} />
      </div>

      {showOptionModal && (
        <OptionSelectorModal
          onClose={() => setShowOptionModal(false)}
          onSelectOption={handleOptionSelect}
        />
      )}
      {showBookingModal && (
        <NewBookingModal
          onClose={() => {
            setShowBookingModal(false);
            setDamageData(null);
          }}
          onSuccess={handleBookingSuccess}
          initialDamageData={damageData}
        />
      )}
      {showDamageModal && (
        <DamageDetectionModal
          onClose={() => setShowDamageModal(false)}
          onBack={handleDamageComplete}
        />
      )}
      {toast && (
        <SuccessToast message={toast} onDismiss={() => setToast(null)} />
      )}
    </CustomerLayout>
  );
}

export default BookingsPage;
