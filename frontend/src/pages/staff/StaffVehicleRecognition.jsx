import React, { useState, useRef, useCallback } from "react";
import EmployeeLayout from "../employee/EmployeeLayout";
import { API_BASE } from "../../hooks/useAuth.js";

// ── Helpers ───────────────────────────────────────────────────────────────────
const conditionColor = (c = "") => {
  if (!c) return "#6b7280";
  const lc = c.toLowerCase();
  if (lc.includes("excellent")) return "#10b981";
  if (lc.includes("good")) return "#3b82f6";
  if (lc.includes("fair")) return "#f59e0b";
  if (lc.includes("poor")) return "#ef4444";
  return "#6b7280";
};

const confidenceColor = (conf = "") => {
  const num = parseFloat(String(conf).replace("%", ""));
  if (num >= 90) return "#10b981";
  if (num >= 75) return "#3b82f6";
  if (num >= 60) return "#f59e0b";
  return "#ef4444";
};

const SIZE_LABELS = {
  small: "Small (Sedan/Hatchback)",
  medium: "Medium (Crossover/SUV)",
  large: "Large (SUV/Pickup/Van)",
  xl: "XL (Commercial/Bus)",
  motor: "Motorcycle",
};

// 5 Standard Vehicle Inspection Photo Angles
const PHOTO_SLOTS = [
  {
    id: "front",
    label: "Front View",
    tag: "Front",
    required: true,
    hint: "Headlights, bumper, and visible license plate",
    guide: "Capture directly from the front. Ensure full bumper, headlights, and front license plate are visible.",
  },
  {
    id: "back",
    label: "Rear View",
    tag: "Rear",
    required: true,
    hint: "Taillights, trunk, and visible rear license plate",
    guide: "Capture directly from the back. Ensure taillights and rear license plate are clearly visible for AI recognition.",
  },
  {
    id: "side",
    label: "Side Profile",
    tag: "Side",
    required: true,
    hint: "Full side profile (Sedan, SUV, Pickup, or Van)",
    guide: "Capture the full side profile so AI can determine vehicle body type and size class.",
  },
  {
    id: "angle",
    label: "Quarter Angle (45°)",
    tag: "45° Angle",
    required: false,
    hint: "Diagonal angle from front or rear",
    guide: "3/4 perspective for overall body lines and paint condition.",
  },
  {
    id: "detail",
    label: "Minor Issues / Damage",
    tag: "Damage",
    required: false,
    hint: "Scratches, dents, paint chips, or damage",
    guide: "Capture close-up photos of visible minor issues, scratches, dents, paint chips, or defects for AI condition assessment.",
  },
];

// ── Walk-In Quick Modal ───────────────────────────────────────────────────────
function WalkInModal({ analysisResult, initialService = null, onClose }) {
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    service: initialService?.name || analysisResult?.recommendedServices?.[0]?.name || "",
    notes: "",
  });
  const [selectedService, setSelectedService] = useState(
    initialService || analysisResult?.recommendedServices?.[0] || null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const token =
    localStorage.getItem("access_token") ??
    sessionStorage.getItem("access_token");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customerName.trim()) {
      setError("Customer name is required.");
      return;
    }
    if (!form.service) {
      setError("Please select a service.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload = {
        customer_name: form.customerName.trim(),
        phone: form.phone.trim(),
        vehicle: `${analysisResult.make || ""} ${analysisResult.model || ""}`.trim(),
        vehicle_type: analysisResult.vehicleSize || "small",
        plate_number: analysisResult.plateNumber || "",
        service: form.service,
        price: selectedService?.price ?? 0,
        notes: form.notes,
        source: "walk_in",
      };
      const res = await fetch(`${API_BASE}/api/queue/walk-in/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.detail || d?.error || "Failed to add walk-in.");
      }
      setSuccess(true);
      setTimeout(() => onClose(true), 1400);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
        onClick={() => onClose(false)}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 sticky top-0 bg-gray-900 z-10">
            <div>
              <h2 className="text-lg font-black text-white">Create Walk-In Queue Ticket</h2>
              <p className="text-gray-500 text-xs mt-0.5">
                Based on AI vehicle scan —{" "}
                <span className="text-red-400">{analysisResult.make} {analysisResult.model}</span>
              </p>
            </div>
            <button
              onClick={() => onClose(false)}
              className="text-gray-500 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {success ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-white font-black text-lg">Queue Ticket Created!</p>
              <p className="text-gray-500 text-sm">Customer added to active queue</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* AI-Detected Vehicle Summary */}
              <div className="bg-gray-800/60 border border-white/5 rounded-xl p-4 space-y-2">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-3">AI Detected Vehicle</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Vehicle:</span>{" "}
                    <span className="text-white font-bold">{analysisResult.make} {analysisResult.model}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Year:</span>{" "}
                    <span className="text-white font-bold">{analysisResult.year}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Plate:</span>{" "}
                    <span className="text-white font-bold font-mono">{analysisResult.plateNumber || "—"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Size:</span>{" "}
                    <span className="text-white font-bold capitalize">{analysisResult.vehicleSize || "small"}</span>
                  </div>
                </div>
              </div>

              {/* Customer Name */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={form.customerName}
                  onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                  placeholder="e.g. Juan dela Cruz"
                  className="w-full bg-gray-800/60 border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500/60 transition-all"
                />
              </div>

              {/* Contact Number */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Phone / Mobile (optional)</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="0912 345 6789"
                  className="w-full bg-gray-800/60 border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500/60 transition-all"
                />
              </div>

              {/* Service Selection */}
              {analysisResult.recommendedServices?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest">Select Recommended Service ({analysisResult.recommendedServices.length})</p>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {analysisResult.recommendedServices.map((svc, idx) => (
                      <button
                        key={svc.id || idx}
                        type="button"
                        onClick={() => {
                          setSelectedService(svc);
                          setForm((f) => ({ ...f, service: svc.name }));
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${
                          form.service === svc.name
                            ? "border-red-500/60 bg-red-500/10 text-white"
                            : "border-white/10 bg-gray-800/40 text-gray-300 hover:border-white/20"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-500 font-mono">#{svc.rank || idx + 1}</span>
                            <p className="font-semibold text-sm">{svc.name}</p>
                          </div>
                          <p className="text-xs text-gray-500">{svc.category} · {svc.duration} mins</p>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <p className="font-black text-sm text-emerald-400">₱{Number(svc.price).toLocaleString()}</p>
                          {svc.basePrice !== svc.price && (
                            <p className="text-xs text-gray-600 line-through">₱{Number(svc.basePrice).toLocaleString()}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom service fallback */}
              {(!analysisResult.recommendedServices || analysisResult.recommendedServices.length === 0) && (
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Service *</label>
                  <input
                    type="text"
                    value={form.service}
                    onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))}
                    placeholder="e.g. Premium Carwash"
                    className="w-full bg-gray-800/60 border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500/60 transition-all"
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Notes (optional)</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="e.g. Customer requested extra wax on hood"
                  className="w-full bg-gray-800/60 border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500/60 transition-all resize-none"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black px-5 py-3 rounded-xl transition-all shadow-lg shadow-red-600/20"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating Ticket...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add to Queue
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

// ── Print Preview Modal ───────────────────────────────────────────────────────
function PrintModal({ analysisResult, photos, onClose }) {
  const printRef = useRef(null);

  const handlePrint = () => {
    const content = printRef.current?.innerHTML || "";
    const w = window.open("", "_blank");
    w.document.write(`
      <!DOCTYPE html><html>
      <head>
        <title>Vehicle Inspection Sheet - ${analysisResult.plateNumber || "AVICA"}</title>
        <style>
          @page { size: A4 portrait; margin: 10mm; }
          body { font-family: Arial, sans-serif; background: #fff; color: #000; padding: 10px; margin: 0; }
          h1 { font-size: 22px; font-weight: 900; margin-bottom: 4px; }
          h2 { font-size: 14px; color: #555; font-weight: 400; margin-bottom: 24px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 18px; }
          .field { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 14px; }
          .label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px; }
          .value { font-size: 14px; font-weight: 700; }
          .features { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
          .tag { border: 1px solid #d1d5db; border-radius: 999px; padding: 3px 10px; font-size: 11px; }
          .notes { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; font-size: 13px; color: #444; line-height: 1.6; }
          .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #888; font-weight: 700; margin-bottom: 8px; border-bottom: 1px solid #f3f4f6; padding-bottom: 4px; }
          .signature-row { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 32px; }
          .sig-box { border-top: 2px solid #000; padding-top: 8px; text-align: center; font-size: 11px; color: #555; }
          .photos-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
          .photo-box img { width: 100%; height: 110px; object-fit: cover; border-radius: 6px; border: 1px solid #ccc; }
          .photo-caption { font-size: 9px; text-align: center; font-weight: bold; margin-top: 4px; text-transform: uppercase; }
          .plate-box { display: inline-block; border: 2px solid #000; padding: 4px 14px; border-radius: 6px; font-family: monospace; font-size: 18px; font-weight: 900; }
        </style>
      </head>
      <body>${content}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  const today = new Date().toLocaleDateString("en-PH", {
    year: "numeric", month: "long", day: "numeric",
  });

  const photoList = Object.entries(photos || {}).filter(([_, v]) => Boolean(v?.dataUrl));

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 sticky top-0 bg-gray-900 z-10">
            <h2 className="text-lg font-black text-white">Vehicle Inspection Sheet</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="btn-action-gray flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold px-4 py-2 rounded-xl transition-all text-sm shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Sheet
              </button>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div ref={printRef} className="p-8 text-black bg-white">
            <div className="flex justify-between items-start mb-4 border-b pb-4">
              <div>
                <h1 className="text-2xl font-black text-red-600">AVICA AUTO CARE</h1>
                <p className="text-xs text-gray-500">Official Multi-Angle AI Vehicle Inspection Report</p>
                <p className="text-xs text-gray-500">Date: {today}</p>
              </div>
              <div className="text-right">
                <div className="border-2 border-black rounded-lg px-4 py-1 text-center font-mono">
                  <div className="text-[9px] text-gray-600 font-bold uppercase">License Plate</div>
                  <div className="text-lg font-black">{analysisResult.plateNumber || "NO PLATE"}</div>
                </div>
              </div>
            </div>

            {/* Photos Strip */}
            {photoList.length > 0 && (
              <div className="photos-grid mb-4">
                {photoList.map(([key, item]) => (
                  <div key={key} className="photo-box">
                    <img src={item.dataUrl} alt={key} />
                    <div className="photo-caption">{key} Angle</div>
                  </div>
                ))}
              </div>
            )}

            <p className="section-title">Vehicle Identification</p>
            <div className="grid">
              {[
                { label: "Make", value: analysisResult.make },
                { label: "Model", value: analysisResult.model },
                { label: "Year", value: analysisResult.year },
                { label: "Body Type", value: analysisResult.bodyType },
                { label: "Color", value: analysisResult.color },
                { label: "Plate Number", value: analysisResult.plateNumber || "—" },
                { label: "Vehicle Size", value: SIZE_LABELS[analysisResult.vehicleSize] || analysisResult.vehicleSizeLabel || "—" },
                { label: "Condition", value: analysisResult.condition },
              ].map((f) => (
                <div className="field" key={f.label}>
                  <div className="label">{f.label}</div>
                  <div className="value">{f.value || "—"}</div>
                </div>
              ))}
            </div>

            {analysisResult.conditionDetails && (
              <>
                <p className="section-title" style={{ marginTop: 16 }}>Condition Assessment</p>
                <div className="notes">{analysisResult.conditionDetails}</div>
              </>
            )}

            {analysisResult.features?.length > 0 && (
              <>
                <p className="section-title">Notable Features</p>
                <div className="features" style={{ marginBottom: 18 }}>
                  {analysisResult.features.map((f, i) => (
                    <span className="tag" key={i}>{f}</span>
                  ))}
                </div>
              </>
            )}

            {analysisResult.recommendedServices?.length > 0 && (
              <>
                <p className="section-title">Recommended Care Services</p>
                <div className="grid">
                  {analysisResult.recommendedServices.slice(0, 6).map((s, i) => (
                    <div className="field" key={i}>
                      <div className="label">#{s.rank || i + 1} {s.category}</div>
                      <div className="value">{s.name}</div>
                      <div style={{ fontSize: 13, color: "#059669", fontWeight: 700 }}>
                        ₱{Number(s.price).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="signature-row">
              <div className="sig-box">Inspector Signature</div>
              <div className="sig-box">Customer Signature</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
function StaffVehicleRecognition() {
  // Multi-image state: 5 slots
  const [photos, setPhotos] = useState({
    front: null,
    back: null,
    side: null,
    angle: null,
    detail: null,
  });

  const [activeSlotForUpload, setActiveSlotForUpload] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [apiError, setApiError] = useState(null);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);

  // Modals
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [walkInService, setWalkInService] = useState(null);
  const [showPrint, setShowPrint] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  // Camera
  const cameraRef = useRef(null);
  const streamRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraTargetSlot, setCameraTargetSlot] = useState("front");

  // File Input Refs
  const multiFileInputRef = useRef(null);
  const singleFileInputRef = useRef(null);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Compute uploaded count & required status
  const uploadedEntries = Object.entries(photos).filter(([_, v]) => Boolean(v?.dataUrl));
  const uploadedCount = uploadedEntries.length;
  const hasRequiredAngles = Boolean(photos.front && photos.back && photos.side);
  const canAnalyze = uploadedCount >= 3;

  // ── Drag & Drop ──────────────────────────────────────────────────────────
  const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []).filter(f => f.type.startsWith("image/"));
    if (files.length > 0) handleMultipleFiles(files);
  };

  // Convert File to base64
  const readFileAsDataUrl = (file) =>
    new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result);
      reader.onerror = (err) => rej(err);
    });

  // Handle batch selection of 1 to 5 files
  const handleMultipleFiles = async (files) => {
    if (!files || files.length === 0) return;
    const validFiles = files.slice(0, 5);

    const slotOrder = ["front", "back", "side", "angle", "detail"];
    const updated = { ...photos };

    let fileIdx = 0;
    for (const slotId of slotOrder) {
      if (fileIdx >= validFiles.length) break;
      const file = validFiles[fileIdx];
      if (file.size > 8 * 1024 * 1024) {
        showToast(`Skipped ${file.name}: file exceeds 8MB limit.`, "error");
        fileIdx++;
        continue;
      }
      try {
        const dataUrl = await readFileAsDataUrl(file);
        updated[slotId] = { dataUrl, file, name: file.name };
        fileIdx++;
      } catch (err) {
        console.error("Error reading file:", err);
      }
    }

    setPhotos(updated);
    setAnalysisResult(null);
    setApiError(null);
    setIsEditing(false);
    showToast(`Loaded ${fileIdx} photo(s). Ready for multi-angle AI inspection!`);
  };

  // Handle single slot upload
  const handleSlotFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeSlotForUpload) return;
    if (file.size > 8 * 1024 * 1024) {
      alert("File size exceeds 8MB.");
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setPhotos((prev) => ({
        ...prev,
        [activeSlotForUpload]: { dataUrl, file, name: file.name },
      }));
      setAnalysisResult(null);
      setApiError(null);
      showToast(`Updated ${activeSlotForUpload.toUpperCase()} photo.`);
    } catch (err) {
      console.error(err);
    }
    setActiveSlotForUpload(null);
    if (singleFileInputRef.current) singleFileInputRef.current.value = "";
  };

  const removePhotoSlot = (slotId) => {
    setPhotos((prev) => ({ ...prev, [slotId]: null }));
    setAnalysisResult(null);
  };

  const clearAllPhotos = () => {
    setPhotos({
      front: null,
      back: null,
      side: null,
      angle: null,
      detail: null,
    });
    setAnalysisResult(null);
    setApiError(null);
    setIsEditing(false);
    setEditForm(null);
    stopCamera();
    showToast("Cleared all uploaded photos.");
  };

  // ── Camera ────────────────────────────────────────────────────────────────
  const startCamera = async (targetSlot = "front") => {
    setCameraTargetSlot(targetSlot);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (cameraRef.current) cameraRef.current.srcObject = stream;
      setShowCamera(true);
    } catch {
      alert("Camera access denied or unavailable on this device.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const captureFromCamera = () => {
    const video = cameraRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

    canvas.toBlob((blob) => {
      const file = new File([blob], `${cameraTargetSlot}-capture.jpg`, { type: "image/jpeg" });
      setPhotos((prev) => ({
        ...prev,
        [cameraTargetSlot]: { dataUrl, file, name: `${cameraTargetSlot}.jpg` },
      }));
      stopCamera();
      showToast(`Captured ${cameraTargetSlot.toUpperCase()} angle photo.`);
    }, "image/jpeg", 0.92);
  };

  // ── AI Vehicle Analysis (Sends 3 to 5 images) ─────────────────────────────
  const analyzeVehicleWithAI = async () => {
    const imageList = Object.values(photos)
      .filter((p) => Boolean(p?.dataUrl))
      .map((p) => p.dataUrl);

    if (imageList.length < 3) {
      alert("Please upload at least 3 photos (Front, Rear, and Side) for accurate AI recognition.");
      return;
    }

    setIsProcessing(true);
    setAnalysisResult(null);
    setApiError(null);
    setIsEditing(false);

    try {
      const token =
        localStorage.getItem("access_token") ??
        sessionStorage.getItem("access_token");

      const response = await fetch(`${API_BASE}/api/analyze-vehicle/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ images: imageList }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Vehicle analysis failed");
      }

      const data = await response.json();
      setAnalysisResult(data);

      if (data.is_vehicle === false || data.success === false) {
        showToast("No vehicle detected. Please check the photos.", "error");
      } else {
        showToast(`Vehicle recognized: ${data.make} ${data.model}!`);
      }
    } catch (error) {
      console.error(error);
      setApiError("Error connecting to AI Vehicle Analysis. Please check your network and retry.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Edit Mode ─────────────────────────────────────────────────────────────
  const startEdit = () => {
    setEditForm({ ...analysisResult });
    setIsEditing(true);
  };

  const saveEdit = () => {
    setAnalysisResult({ ...editForm });
    setIsEditing(false);
    showToast("Vehicle details updated!");
  };

  const cancelEdit = () => {
    setEditForm(null);
    setIsEditing(false);
  };

  // ── Copy to Clipboard ─────────────────────────────────────────────────────
  const copyToClipboard = () => {
    if (!analysisResult) return;
    const text = `Vehicle Analysis Summary
Make/Model: ${analysisResult.make} ${analysisResult.model}
Year: ${analysisResult.year}
Color: ${analysisResult.color}
Body Type: ${analysisResult.bodyType}
Size: ${SIZE_LABELS[analysisResult.vehicleSize] || analysisResult.vehicleSizeLabel || "—"}
Condition: ${analysisResult.condition}
Plate: ${analysisResult.plateNumber || "—"}
Confidence: ${analysisResult.confidence}
Notes: ${analysisResult.additionalNotes || "—"}`;
    navigator.clipboard.writeText(text).then(() => showToast("Copied to clipboard!"));
  };

  // Result display value (supports edit mode)
  const R = isEditing ? editForm : analysisResult;

  return (
    <EmployeeLayout title="" subtitle="">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[9999] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-semibold transition-all ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {toast.type === "success" ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            )}
          </svg>
          {toast.msg}
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        type="file"
        ref={multiFileInputRef}
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => handleMultipleFiles(Array.from(e.target.files || []))}
      />
      <input
        type="file"
        ref={singleFileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleSlotFileChange}
      />

      {/* Walk-In Modal */}
      {showWalkIn && analysisResult && analysisResult.is_vehicle && (
        <WalkInModal
          analysisResult={analysisResult}
          initialService={walkInService}
          onClose={(created) => {
            setShowWalkIn(false);
            setWalkInService(null);
            if (created) showToast("Walk-in queue ticket created!");
          }}
        />
      )}

      {/* Print Modal */}
      {showPrint && analysisResult && analysisResult.is_vehicle && (
        <PrintModal
          analysisResult={analysisResult}
          photos={photos}
          onClose={() => setShowPrint(false)}
        />
      )}

      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                <span>AI Vehicle Recognition</span>
                <span className="text-xs px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold uppercase tracking-wider">
                  Multi-Angle 3–5 Photos
                </span>
              </h1>
              <p className="text-gray-400 mt-1 text-sm">
                Upload 3 to 5 vehicle angles (Front, Rear, Side) for high-accuracy AI recognition.
              </p>
            </div>

            {uploadedCount > 0 && (
              <button
                onClick={clearAllPhotos}
                className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-bold transition-all"
              >
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear All Photos
              </button>
            )}
          </div>
        </div>

        {/* ── Photography Guide / Instructions Banner ── */}
        <div className="bg-gradient-to-r from-gray-900/90 via-red-950/20 to-gray-900/90 border border-red-500/30 rounded-2xl p-5 mb-6 backdrop-blur-sm shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="p-1.5 bg-red-500/20 rounded-lg text-red-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            <h2 className="text-base font-black text-white uppercase tracking-wider">
              Vehicle Photography Instructions
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="bg-gray-800/60 border border-white/5 rounded-xl p-3">
              <div className="flex items-center gap-2 text-red-400 font-bold mb-1">
                <span className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center text-[10px]">1</span>
                <span>Front Angle</span>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Capture directly from the front. Ensure <strong className="text-white">bumper, headlights</strong>, and <strong className="text-amber-300">front license plate</strong> are clearly visible.
              </p>
            </div>

            <div className="bg-gray-800/60 border border-white/5 rounded-xl p-3">
              <div className="flex items-center gap-2 text-red-400 font-bold mb-1">
                <span className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center text-[10px]">2</span>
                <span>Rear Angle</span>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Capture directly from the back. Ensure <strong className="text-white">taillights, trunk</strong>, and <strong className="text-amber-300">rear license plate</strong> are clearly visible for plate detection.
              </p>
            </div>

            <div className="bg-gray-800/60 border border-white/5 rounded-xl p-3">
              <div className="flex items-center gap-2 text-red-400 font-bold mb-1">
                <span className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center text-[10px]">3</span>
                <span>Side Profile</span>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Full silhouette to determine vehicle body shape: <strong className="text-white">Sedan, SUV, Pickup, or Van</strong>. Ensure good lighting and avoid cropped shots or people.
              </p>
            </div>

            <div className="bg-gray-800/60 border border-amber-500/25 rounded-xl p-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold mb-1">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px]">4</span>
                <span>Minor Issues & Damage</span>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Close-ups of <strong className="text-amber-300">scratches, dents, paint chips</strong>, or dirty panels so AI can assess condition and suggest services.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ── Left 7 Cols: Multi-Photo Slots & Upload ── */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <span>Vehicle Inspection Photos</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      canAnalyze
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}>
                      {uploadedCount} / 5 Uploaded {canAnalyze ? "(Ready)" : "(Requires 3)"}
                    </span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Upload 3 to 5 photos. Click each slot or drag and drop files together.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => multiFileInputRef.current?.click()}
                    className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-lg shadow-red-600/20"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload Multiple Files
                  </button>
                  <button
                    onClick={() => startCamera("front")}
                    className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-semibold px-3 py-2 rounded-xl transition-all"
                  >
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    </svg>
                    Camera
                  </button>
                </div>
              </div>

              {/* Camera Modal / Viewfinder */}
              {showCamera && (
                <div className="mb-5 p-4 bg-gray-950 border border-red-500/40 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-red-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      Capturing angle: <strong className="text-white uppercase">{cameraTargetSlot}</strong>
                    </span>
                    <div className="flex gap-1.5">
                      {PHOTO_SLOTS.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setCameraTargetSlot(s.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            cameraTargetSlot === s.id ? "bg-red-600 text-white" : "bg-white/5 text-gray-400"
                          }`}
                        >
                          {s.tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black">
                    <video ref={cameraRef} autoPlay playsInline className="w-full h-64 object-cover" />
                    <div className="absolute inset-0 pointer-events-none border-2 border-red-500/20 rounded-xl flex items-center justify-center">
                      <div className="w-48 h-32 border border-white/20 rounded-lg" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={stopCamera}
                      className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-semibold px-4 py-2 rounded-xl text-xs transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={captureFromCamera}
                      className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-lg shadow-red-600/30"
                    >
                      Capture Photo ({cameraTargetSlot.toUpperCase()})
                    </button>
                  </div>
                </div>
              )}

              {/* ── 5 Photo Slots Grid ── */}
              <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`grid grid-cols-2 sm:grid-cols-3 gap-3.5 p-3 rounded-2xl border-2 border-dashed transition-all ${
                  isDragging ? "border-red-500 bg-red-500/10" : "border-white/10 bg-gray-950/40"
                }`}
              >
                {PHOTO_SLOTS.map((slot, idx) => {
                  const photoItem = photos[slot.id];
                  return (
                    <div
                      key={slot.id}
                      className={`relative group rounded-xl border overflow-hidden flex flex-col justify-between transition-all ${
                        photoItem
                          ? "border-emerald-500/40 bg-gray-900/90 shadow-md"
                          : slot.required
                          ? "border-white/15 bg-gray-900/40 hover:border-red-500/40"
                          : "border-white/10 bg-gray-900/20 hover:border-white/30"
                      } min-h-[170px]`}
                    >
                      {/* Slot Header */}
                      <div className="p-2.5 flex items-center justify-between border-b border-white/5 bg-gray-900/60 z-10">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-4 h-4 rounded-full bg-white/5 text-[10px] text-gray-400 font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-white truncate">{slot.label}</span>
                        </div>
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                            slot.required
                              ? photoItem
                                ? "bg-emerald-500/20 text-emerald-300"
                                : "bg-red-500/20 text-red-400"
                              : "bg-white/5 text-gray-400"
                          }`}
                        >
                          {photoItem ? "✓ Done" : slot.required ? "Req" : "Opt"}
                        </span>
                      </div>

                      {/* Photo Content or Upload Area */}
                      {photoItem ? (
                        <div className="relative flex-1 group/img overflow-hidden">
                          <img
                            src={photoItem.dataUrl}
                            alt={slot.label}
                            className="w-full h-28 object-cover group-hover/img:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveSlotForUpload(slot.id);
                                singleFileInputRef.current?.click();
                              }}
                              title="Replace Photo"
                              className="p-1.5 bg-white/20 hover:bg-white/40 rounded-lg text-white"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => removePhotoSlot(slot.id)}
                              title="Delete Photo"
                              className="p-1.5 bg-red-600/80 hover:bg-red-600 rounded-lg text-white"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            setActiveSlotForUpload(slot.id);
                            singleFileInputRef.current?.click();
                          }}
                          className="flex-1 flex flex-col items-center justify-center p-3 text-center cursor-pointer hover:bg-white/5 transition-colors"
                        >
                          <div className="w-9 h-9 rounded-full bg-white/5 group-hover:bg-red-500/20 text-gray-500 group-hover:text-red-400 flex items-center justify-center mb-1.5 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </div>
                          <span className="text-[11px] font-bold text-gray-300 group-hover:text-white transition-colors">
                            Click to add {slot.tag}
                          </span>
                          <span className="text-[10px] text-gray-500 line-clamp-2 mt-0.5">
                            {slot.hint}
                          </span>
                        </div>
                      )}

                      {/* Slot Footer info */}
                      <div className="px-2.5 py-1.5 bg-gray-950/80 border-t border-white/5 text-[10px] text-gray-500 flex items-center justify-between">
                        <span>{slot.tag}</span>
                        {!photoItem && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              startCamera(slot.id);
                            }}
                            className="text-red-400 hover:text-red-300 font-semibold inline-flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>Snap</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Bar */}
              <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/5">
                <div className="text-xs text-gray-400">
                  {canAnalyze ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {uploadedCount} photos ready. Click analyze to start multi-angle AI recognition.
                    </span>
                  ) : (
                    <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Upload {3 - uploadedCount} more photo(s) (Required: Front, Rear, Side).
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={!canAnalyze || isProcessing}
                  onClick={analyzeVehicleWithAI}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:hover:bg-red-600 text-white font-black text-sm px-7 py-3 rounded-xl transition-all shadow-xl shadow-red-600/30"
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      AI Analysis (Scanning {uploadedCount} Angles)...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Start AI Vehicle Recognition ({uploadedCount} Photos)
                    </>
                  )}
                </button>
              </div>

              {apiError && (
                <div className="mt-4 bg-red-500/10 border border-red-500/30 text-red-400 p-3.5 rounded-xl text-xs">
                  {apiError}
                </div>
              )}
            </div>
          </div>

          {/* ── Right 5 Cols: AI Results OR Non-Vehicle Rejection ── */}
          <div className="lg:col-span-5 space-y-5">
            {/* Initial Blank State */}
            {!analysisResult && !isProcessing && (
              <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-12 text-center backdrop-blur-sm h-full flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-gray-600 mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-black text-white mb-1">Ready for Inspection</h3>
                <p className="text-gray-500 text-xs max-w-xs leading-relaxed">
                  Upload 3 to 5 vehicle photos and click &quot;Start AI Vehicle Recognition&quot; to inspect make, model, body type, plate number, and recommended services.
                </p>
              </div>
            )}

            {/* Processing State */}
            {isProcessing && (
              <div className="bg-gray-900/60 border border-red-500/30 rounded-2xl p-12 text-center backdrop-blur-sm min-h-[400px] flex flex-col items-center justify-center">
                <div className="relative mb-5">
                  <div className="w-16 h-16 rounded-full border-4 border-red-500/20 border-t-red-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-black text-white mb-1">AI Analyzing Photos...</h3>
                <p className="text-gray-400 text-xs max-w-xs">
                  Scanning front, rear, and side angles. Verifying vehicle presence, reading license plate, and determining vehicle class.
                </p>
              </div>
            )}

            {/* ── CASE 1: NON-VEHICLE DETECTED (REJECTION BANNER) ── */}
            {analysisResult && (analysisResult.is_vehicle === false || analysisResult.success === false) && (
              <div className="bg-gradient-to-b from-red-950/40 to-gray-900/90 border-2 border-red-500/50 rounded-2xl p-6 backdrop-blur-sm shadow-2xl text-center space-y-4 animate-in fade-in duration-300">
                <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500/40 text-red-400 mx-auto flex items-center justify-center shadow-lg shadow-red-500/20">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                    Non-Vehicle Detected
                  </span>
                  <h3 className="text-xl font-black text-white mt-2">
                    No Vehicle Detected in Photos
                  </h3>
                  <p className="text-red-300 text-xs mt-2 font-medium leading-relaxed max-w-sm mx-auto">
                    {analysisResult.rejection_reason || "The uploaded image was not identified as a vehicle (e.g., person, selfie, object, or blurry image)."}
                  </p>
                </div>

                {/* Explanation Box */}
                <div className="bg-gray-950/80 border border-white/5 rounded-xl p-4 text-left text-xs space-y-2 text-gray-300">
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Why is there no Sedan or Pickup category result?
                  </p>
                  <p className="text-gray-400 text-[11px] leading-relaxed">
                    Our AI strictly verifies vehicle presence first. If non-vehicle images (such as people or selfies) are provided, <strong className="text-red-400">it will not output any car category</strong>.
                  </p>
                  <p className="text-gray-400 text-[11px] leading-relaxed">
                    Please follow the instructions above and upload authentic vehicle photos (Front, Rear, and Side).
                  </p>
                </div>

                {/* Prominent Retry Button */}
                <button
                  type="button"
                  onClick={clearAllPhotos}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-black px-6 py-3.5 rounded-xl text-sm transition-all shadow-xl shadow-red-600/30"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Retry / Upload New Photos
                </button>
              </div>
            )}

            {/* ── CASE 2: VALID VEHICLE RECOGNIZED ── */}
            {analysisResult && analysisResult.is_vehicle && (
              <div className="space-y-4 animate-in fade-in duration-300">
                {/* Result Card */}
                <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
                  {/* Top Bar with Plate & Controls */}
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                        Vehicle Verified ({analysisResult.imageCount || uploadedCount} Photos)
                      </span>
                      <h3 className="text-xl font-black text-white mt-1">
                        {R?.make} {R?.model}
                      </h3>
                      {R?.confidence && (
                        <p className="text-xs font-semibold mt-0.5" style={{ color: confidenceColor(R.confidence) }}>
                          AI Confidence: {R.confidence}
                        </p>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={startEdit}
                          title="Edit Details"
                          className="btn-edit-action p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white rounded-lg transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={copyToClipboard}
                          title="Copy Summary"
                          className="btn-edit-action p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white rounded-lg transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setShowPrint(true)}
                          title="Print Inspection Sheet"
                          className="btn-edit-action p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white rounded-lg transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ── Philippine License Plate Display Badge ── */}
                  <div className="mb-5 p-4 rounded-xl bg-gray-950/80 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                        Detected License Plate (Plaka)
                      </span>
                      <p className="text-xs text-gray-500">Extracted from front & rear photos</p>
                    </div>

                    <div className="inline-flex flex-col items-center justify-center bg-white text-gray-950 font-black rounded-lg border-2 border-gray-300 shadow-md px-5 py-2 min-w-[170px] select-all">
                      <span className="text-[9px] uppercase tracking-widest text-blue-700 font-bold -mb-0.5">
                        PILIPINAS
                      </span>
                      <span className="text-xl tracking-wider font-extrabold font-mono text-gray-950">
                        {R?.plateNumber || <span className="text-gray-400 font-sans text-xs">NOT VISIBLE</span>}
                      </span>
                      <span className="text-[8px] uppercase tracking-widest text-emerald-700 font-bold -mt-0.5">
                        MATATAG NA REPUBLIKA
                      </span>
                    </div>
                  </div>

                  {/* ── Edit Form OR Specs Grid ── */}
                  {isEditing && editForm ? (
                    <div className="space-y-3">
                      <p className="text-xs text-amber-400 font-semibold">Edit Mode — ayusin ang detalye bago mag-book</p>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { key: "make", label: "Make" },
                          { key: "model", label: "Model" },
                          { key: "year", label: "Year" },
                          { key: "bodyType", label: "Body Type" },
                          { key: "color", label: "Color" },
                          { key: "plateNumber", label: "Plate Number" },
                        ].map(({ key, label }) => (
                          <div key={key}>
                            <label className="text-[10px] text-gray-400 block mb-1 uppercase font-bold">{label}</label>
                            <input
                              type="text"
                              value={editForm[key] || ""}
                              onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                              className="w-full bg-gray-800 border border-white/10 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-red-500"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button onClick={saveEdit} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 rounded-lg">
                          Save Changes
                        </button>
                        <button onClick={cancelEdit} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold py-2 rounded-lg">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-800/60 border border-white/5 rounded-xl p-3">
                        <div className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">Make</div>
                        <div className="text-white font-black text-sm">{R?.make || "—"}</div>
                      </div>
                      <div className="bg-gray-800/60 border border-white/5 rounded-xl p-3">
                        <div className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">Model</div>
                        <div className="text-white font-black text-sm">{R?.model || "—"}</div>
                      </div>
                      <div className="bg-gray-800/60 border border-white/5 rounded-xl p-3">
                        <div className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">Year Model</div>
                        <div className="text-white font-black text-sm">{R?.year || "—"}</div>
                      </div>
                      <div className="bg-gray-800/60 border border-white/5 rounded-xl p-3">
                        <div className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">Body Type</div>
                        <div className="text-red-400 font-black text-sm">{R?.bodyType || "—"}</div>
                      </div>

                      {/* Color */}
                      <div className="bg-gray-800/60 border border-white/5 rounded-xl p-3">
                        <div className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">Dominant Color</div>
                        <div className="flex items-center gap-2 mt-1">
                          {R?.colorHex && (
                            <span className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: R.colorHex }} />
                          )}
                          <span className="text-white font-bold text-xs">{R?.color || "—"}</span>
                        </div>
                      </div>

                      {/* Size Class */}
                      <div className="bg-gray-800/60 border border-white/5 rounded-xl p-3">
                        <div className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">Vehicle Size Class</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-[10px] font-bold">
                            {(R?.vehicleSize || "small").toUpperCase()}
                          </span>
                          <span className="text-white font-bold text-xs truncate">
                            {SIZE_LABELS[R?.vehicleSize] || R?.vehicleSizeLabel || "Small"}
                          </span>
                        </div>
                      </div>

                      {/* Condition */}
                      <div className="bg-gray-800/60 border border-white/5 rounded-xl p-3 col-span-2">
                        <div className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">Estimated Condition</div>
                        <div className="flex items-start gap-2 mt-1">
                          <div className="w-3 h-3 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: conditionColor(R?.condition) }} />
                          <div>
                            <span className="text-white font-bold text-xs">{R?.condition || "Good"}</span>
                            {R?.conditionDetails && (
                              <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{R.conditionDetails}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Notable Features */}
                      {R?.features?.length > 0 && (
                        <div className="bg-gray-800/60 border border-white/5 rounded-xl p-3 col-span-2">
                          <div className="text-[10px] text-gray-500 uppercase font-bold mb-1.5">Notable Features Identified</div>
                          <div className="flex flex-wrap gap-1.5">
                            {R.features.map((f, i) => (
                              <span key={i} className="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md text-[11px] font-semibold">
                                {f}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Top 10 Recommended Services with Exact Size Pricing ── */}
                {!isEditing && R?.recommendedServices?.length > 0 && (
                  <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-black text-white text-sm flex items-center gap-2">
                          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Top Recommended Services
                        </h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Tugma sa <strong className="text-white">{R.make} {R.model}</strong> ({R.vehicleSizeLabel || R.vehicleSize})
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {R.recommendedServices.length} Matches
                      </span>
                    </div>

                    <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1">
                      {R.recommendedServices.map((svc, idx) => (
                        <div
                          key={svc.id || idx}
                          className="flex items-center justify-between p-3 rounded-xl bg-gray-800/40 border border-white/5 hover:border-red-500/40 transition-all text-xs"
                        >
                          <div className="min-w-0 pr-3">
                            <div className="flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-md bg-white/5 text-[10px] text-gray-400 font-black flex items-center justify-center">
                                #{svc.rank || idx + 1}
                              </span>
                              <p className="text-white font-bold truncate">{svc.name}</p>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-0.5">{svc.category} • {svc.duration} mins</p>
                          </div>

                          <div className="text-right shrink-0 flex items-center gap-2">
                            <div>
                              <p className="text-emerald-400 font-black text-sm">
                                ₱{Number(svc.price).toLocaleString()}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setWalkInService(svc);
                                setShowWalkIn(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] transition-all shadow"
                            >
                              Add to Queue
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom Action Buttons */}
                {!isEditing && (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setShowWalkIn(true)}
                      className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-3 rounded-xl transition-all shadow-lg shadow-red-600/30 text-xs"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Walk-In Ticket
                    </button>
                    <button
                      onClick={() => setShowPrint(true)}
                      className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-bold px-4 py-3 rounded-xl transition-all text-xs"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Print Inspection Sheet
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}

export default StaffVehicleRecognition;
