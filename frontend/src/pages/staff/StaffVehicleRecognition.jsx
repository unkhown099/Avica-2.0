import React, { useState, useRef, useCallback } from "react";
import EmployeeLayout from "../employee/EmployeeLayout";
import { API_BASE, getAuthHeaders } from "../../hooks/useAuth.js";

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

// ── Walk-In Quick Modal ───────────────────────────────────────────────────────
function WalkInModal({ analysisResult, onClose }) {
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    service: analysisResult?.recommendedServices?.[0]?.name || "",
    notes: "",
  });
  const [selectedService, setSelectedService] = useState(
    analysisResult?.recommendedServices?.[0] || null
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
                    <span className="text-white font-bold">{analysisResult.plateNumber || "—"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Size:</span>{" "}
                    <span className="text-white font-bold">{SIZE_LABELS[analysisResult.vehicleSize] || analysisResult.vehicleSizeLabel || "—"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Color:</span>{" "}
                    <span className="inline-flex items-center gap-1.5 font-bold text-white">
                      {analysisResult.colorHex && (
                        <span className="w-3 h-3 rounded-full inline-block border border-white/20" style={{ backgroundColor: analysisResult.colorHex }} />
                      )}
                      {analysisResult.color}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Condition:</span>{" "}
                    <span className="font-bold" style={{ color: conditionColor(analysisResult.condition) }}>
                      {analysisResult.condition}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="space-y-3">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest">Customer Info</p>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Customer Name *</label>
                  <input
                    type="text"
                    value={form.customerName}
                    onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                    placeholder="e.g. Juan dela Cruz"
                    className="w-full bg-gray-800/60 border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500/60 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Phone Number</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="e.g. 09XX XXX XXXX"
                    className="w-full bg-gray-800/60 border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500/60 transition-all"
                  />
                </div>
              </div>

              {/* Service Selection */}
              {analysisResult.recommendedServices?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest">Select Service</p>
                  <div className="space-y-2">
                    {analysisResult.recommendedServices.map((svc) => (
                      <button
                        key={svc.id}
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
                          <p className="font-semibold text-sm">{svc.name}</p>
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
function PrintModal({ analysisResult, imageUrl, onClose }) {
  const printRef = useRef(null);

  const handlePrint = () => {
    const content = printRef.current?.innerHTML || "";
    const w = window.open("", "_blank");
    w.document.write(`
      <!DOCTYPE html><html>
      <head>
        <title>Vehicle Inspection Sheet</title>
        <style>
          body { font-family: Arial, sans-serif; background: #fff; color: #000; padding: 32px; }
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
          img.vehicle { max-width: 100%; border-radius: 10px; margin-bottom: 18px; max-height: 200px; object-fit: cover; }
          .header-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
          .badge { background: #000; color: #fff; border-radius: 999px; font-size: 10px; font-weight: 700; padding: 4px 12px; letter-spacing: 0.05em; }
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
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-xl transition-all text-sm shadow-lg shadow-red-600/20"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Sheet
              </button>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Print Content */}
          <div ref={printRef} className="p-6">
            <div className="header-bar">
              <div>
                <h1 style={{ color: "#000", margin: 0, fontWeight: 900, fontSize: 20 }}>
                  Vehicle Inspection Sheet
                </h1>
                <h2 style={{ color: "#888", margin: 0, fontWeight: 400, fontSize: 13 }}>
                  Date: {today}
                </h2>
              </div>
              <span className="badge">AI-POWERED ANALYSIS</span>
            </div>

            {imageUrl && (
              <img className="vehicle" src={imageUrl} alt="Inspected Vehicle" />
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

            {analysisResult.additionalNotes && (
              <>
                <p className="section-title">AI Notes</p>
                <div className="notes">{analysisResult.additionalNotes}</div>
              </>
            )}

            {analysisResult.recommendedServices?.length > 0 && (
              <>
                <p className="section-title">Recommended Services</p>
                <div className="grid">
                  {analysisResult.recommendedServices.map((s, i) => (
                    <div className="field" key={i}>
                      <div className="label">{s.category}</div>
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
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [apiError, setApiError] = useState(null);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);

  // Modals
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [showPrint, setShowPrint] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  // Camera
  const cameraRef = useRef(null);
  const streamRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Drag & Drop ──────────────────────────────────────────────────────────
  const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) handleFile(files[0]);
  };
  const handleFileInput = (e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); };

  const handleFile = (file) => {
    if (!file.type.startsWith("image/")) { alert("Please upload an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { alert("File size too large. Max 5MB."); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target.result);
      setIsEditing(false);
      setEditForm(null);
      analyzeVehicleWithAI(file);
    };
    reader.readAsDataURL(file);
  };

  const imageToBase64 = (file) =>
    new Promise((res, rej) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => res(reader.result.split(",")[1]);
      reader.onerror = (err) => rej(err);
    });

  const analyzeVehicleWithAI = async (file) => {
    setIsProcessing(true);
    setAnalysisResult(null);
    setApiError(null);
    setIsEditing(false);
    try {
      const base64Image = await imageToBase64(file);
      const token =
        localStorage.getItem("access_token") ??
        sessionStorage.getItem("access_token");
      const response = await fetch(`${API_BASE}/api/analyze-vehicle/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ image: base64Image }),
      });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      setAnalysisResult(data);
    } catch (error) {
      console.error(error);
      setApiError("Error analyzing vehicle. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setUploadedImage(null);
    setAnalysisResult(null);
    setIsProcessing(false);
    setApiError(null);
    setIsEditing(false);
    setEditForm(null);
    stopCamera();
  };

  // ── Camera ────────────────────────────────────────────────────────────────
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (cameraRef.current) cameraRef.current.srcObject = stream;
      setShowCamera(true);
    } catch {
      alert("Camera access denied or unavailable.");
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
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
      const url = URL.createObjectURL(blob);
      setUploadedImage(url);
      stopCamera();
      analyzeVehicleWithAI(file);
    }, "image/jpeg", 0.92);
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

  // ── Result display value (supports edit mode) ─────────────────────────────
  const R = isEditing ? editForm : analysisResult;

  return (
    <EmployeeLayout title="" subtitle="">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[9999] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-semibold transition-all ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {toast.type === "success"
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            }
          </svg>
          {toast.msg}
        </div>
      )}

      {/* Walk-In Modal */}
      {showWalkIn && analysisResult && (
        <WalkInModal
          analysisResult={analysisResult}
          onClose={(created) => {
            setShowWalkIn(false);
            if (created) showToast("Walk-in queue ticket created!");
          }}
        />
      )}

      {/* Print Modal */}
      {showPrint && analysisResult && (
        <PrintModal
          analysisResult={analysisResult}
          imageUrl={uploadedImage}
          onClose={() => setShowPrint(false)}
        />
      )}

      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight">AI Vehicle Analysis</h1>
          <p className="text-gray-400 mt-1">Upload or capture a vehicle image for AI-powered analysis and identification</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Left Panel: Upload / Camera ── */}
          <div className="space-y-5">
            <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-black text-white">Upload Vehicle Image</h2>
                {/* Camera Button */}
                {!uploadedImage && !showCamera && (
                  <button
                    onClick={startCamera}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Use Camera
                  </button>
                )}
              </div>

              {/* Camera View */}
              {showCamera && (
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black">
                    <video ref={cameraRef} autoPlay playsInline className="w-full h-auto" />
                    <div className="absolute inset-0 pointer-events-none border-2 border-red-500/30 rounded-2xl" />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={stopCamera}
                      className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={captureFromCamera}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-red-600/20"
                    >
                      Capture & Analyze
                    </button>
                  </div>
                </div>
              )}

              {!showCamera && !uploadedImage && (
                <div
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                    isDragging ? "border-red-500 bg-red-500/10" : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <h3 className="text-base font-black text-white mb-1">
                    {isDragging ? "Drop image here" : "Drag & drop vehicle image here"}
                  </h3>
                  <p className="text-gray-500 text-sm mb-5">or</p>
                  <label className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-3 rounded-xl cursor-pointer transition-all shadow-lg shadow-red-600/20">
                    Browse Files
                    <input type="file" accept="image/*" onChange={handleFileInput} className="hidden" />
                  </label>
                  <p className="text-xs text-gray-600 mt-4">Supported: JPG, PNG, HEIC (Max 5MB)</p>
                </div>
              )}

              {!showCamera && uploadedImage && (
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden border border-white/10">
                    <img src={uploadedImage} alt="Uploaded vehicle" className="w-full h-auto" />
                    {isProcessing && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                        <div className="text-center">
                          <svg className="animate-spin w-10 h-10 text-red-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          <p className="text-white font-black text-sm">AI Analyzing Vehicle...</p>
                          <p className="text-gray-400 text-xs mt-1">Identifying make, model, condition & more</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {apiError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">{apiError}</div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={handleClear}
                      className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all"
                    >
                      Clear & Upload New
                    </button>
                    {!isProcessing && !analysisResult && (
                      <button
                        onClick={() => fetch(uploadedImage).then(r => r.blob()).then(blob =>
                          analyzeVehicleWithAI(new File([blob], "image.jpg", { type: "image/jpeg" }))
                        )}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-red-600/20"
                      >
                        Retry Analysis
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="font-black text-white mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Tips for Best Results
              </h3>
              <ul className="space-y-2.5">
                {[
                  "Take clear photos showing the entire vehicle side or front",
                  "Include front, 3/4, and side views for better accuracy",
                  "Ensure good lighting — avoid harsh shadows",
                  "Include the license plate if you want plate detection",
                  "Avoid blurry, obstructed, or dark images",
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-400">
                    <svg className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ── Right Panel: Results ── */}
          <div>
            {!analysisResult && !isProcessing && (
              <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-16 text-center backdrop-blur-sm h-full flex flex-col items-center justify-center">
                <svg className="w-20 h-20 text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-xl font-black text-white mb-2">No Analysis Yet</h3>
                <p className="text-gray-500 text-sm">Upload or capture a vehicle image to see AI analysis results</p>
              </div>
            )}

            {analysisResult && (
              <div className="space-y-4">
                {/* Results Header */}
                <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-500/20 p-2.5 rounded-xl">
                        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-base font-black text-white">Vehicle Analysis Results</h3>
                        {analysisResult.confidence && (
                          <p className="text-xs mt-0.5" style={{ color: confidenceColor(analysisResult.confidence) }}>
                            Confidence: {analysisResult.confidence}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {!isEditing && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={startEdit}
                          title="Edit Details"
                          className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white rounded-lg transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={copyToClipboard}
                          title="Copy Summary"
                          className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white rounded-lg transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setShowPrint(true)}
                          title="Print Inspection Sheet"
                          className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white rounded-lg transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Edit Mode Form */}
                  {isEditing && editForm ? (
                    <div className="space-y-3">
                      <p className="text-xs text-amber-400 font-semibold">Edit Mode — correct any detected fields</p>
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
                            <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                            <input
                              type="text"
                              value={editForm[key] || ""}
                              onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                              className="w-full bg-gray-800/80 border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-red-500/60 transition-all"
                            />
                          </div>
                        ))}
                        <div className="col-span-2">
                          <label className="text-xs text-gray-500 mb-1 block">Vehicle Size</label>
                          <select
                            value={editForm.vehicleSize || "small"}
                            onChange={(e) => setEditForm((f) => ({ ...f, vehicleSize: e.target.value }))}
                            className="w-full bg-gray-800/80 border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-red-500/60 transition-all"
                          >
                            {Object.entries(SIZE_LABELS).map(([k, v]) => (
                              <option key={k} value={k}>{v}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs text-gray-500 mb-1 block">Condition</label>
                          <select
                            value={editForm.condition || "Good"}
                            onChange={(e) => setEditForm((f) => ({ ...f, condition: e.target.value }))}
                            className="w-full bg-gray-800/80 border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-red-500/60 transition-all"
                          >
                            {["Excellent", "Good", "Fair", "Poor"].map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-3 pt-1">
                        <button
                          onClick={cancelEdit}
                          className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveEdit}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-600/20"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Results Grid */
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Make", value: R?.make },
                        { label: "Model", value: R?.model },
                        { label: "Year", value: R?.year },
                        { label: "Body Type", value: R?.bodyType },
                      ].map((field) => (
                        <div key={field.label} className="bg-gray-800/60 border border-white/5 rounded-xl p-3">
                          <div className="text-xs text-gray-500 mb-1">{field.label}</div>
                          <div className="text-white font-bold text-sm">{field.value || "—"}</div>
                        </div>
                      ))}

                      {/* Color */}
                      <div className="bg-gray-800/60 border border-white/5 rounded-xl p-3">
                        <div className="text-xs text-gray-500 mb-1">Color</div>
                        <div className="flex items-center gap-2">
                          {R?.colorHex ? (
                            <div className="w-4 h-4 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: R.colorHex }} />
                          ) : R?.color ? (
                            <div className="w-4 h-4 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: R.color.toLowerCase() }} />
                          ) : null}
                          <span className="text-white font-bold text-sm">{R?.color || "—"}</span>
                        </div>
                      </div>

                      {/* Plate Number */}
                      <div className="bg-gray-800/60 border border-white/5 rounded-xl p-3">
                        <div className="text-xs text-gray-500 mb-1">Plate Number</div>
                        <div className="text-white font-bold text-sm font-mono tracking-wider">
                          {R?.plateNumber || <span className="text-gray-600 font-sans font-normal text-xs">Not visible</span>}
                        </div>
                      </div>

                      {/* Vehicle Size */}
                      <div className="bg-gray-800/60 border border-white/5 rounded-xl p-3 col-span-2">
                        <div className="text-xs text-gray-500 mb-1">Vehicle Size Class</div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-semibold">
                            {(R?.vehicleSize || "small").toUpperCase()}
                          </span>
                          <span className="text-white font-bold text-sm">
                            {SIZE_LABELS[R?.vehicleSize] || R?.vehicleSizeLabel || "—"}
                          </span>
                        </div>
                      </div>

                      {/* Condition */}
                      <div className="bg-gray-800/60 border border-white/5 rounded-xl p-3 col-span-2">
                        <div className="text-xs text-gray-500 mb-1">Estimated Condition</div>
                        <div className="flex items-start gap-2">
                          <div className="w-3 h-3 rounded-full shrink-0 mt-1" style={{ backgroundColor: conditionColor(R?.condition) }} />
                          <div>
                            <span className="text-white font-bold text-sm">{R?.condition || "—"}</span>
                            {R?.conditionDetails && (
                              <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{R.conditionDetails}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Features */}
                      {R?.features?.length > 0 && (
                        <div className="bg-gray-800/60 border border-white/5 rounded-xl p-3 col-span-2">
                          <div className="text-xs text-gray-500 mb-2">Notable Features</div>
                          <div className="flex flex-wrap gap-1.5">
                            {R.features.map((f, i) => (
                              <span key={i} className="px-2.5 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-xs font-semibold">{f}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Additional Notes */}
                      {R?.additionalNotes && (
                        <div className="bg-gray-800/60 border border-white/5 rounded-xl p-3 col-span-2">
                          <div className="text-xs text-gray-500 mb-1">AI Notes</div>
                          <p className="text-gray-300 text-sm leading-relaxed">{R.additionalNotes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Recommended Services */}
                {!isEditing && R?.recommendedServices?.length > 0 && (
                  <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                    <h3 className="font-black text-white mb-4 flex items-center gap-2">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Recommended Services
                      <span className="text-xs text-gray-500 font-normal">based on vehicle size & condition</span>
                    </h3>
                    <div className="space-y-2">
                      {R.recommendedServices.map((svc) => (
                        <div key={svc.id} className="flex items-center justify-between bg-gray-800/40 border border-white/5 rounded-xl px-4 py-3">
                          <div>
                            <p className="text-white font-semibold text-sm">{svc.name}</p>
                            <p className="text-gray-500 text-xs">{svc.category}{svc.duration ? ` · ${svc.duration} mins` : ""}</p>
                            {svc.description && <p className="text-gray-600 text-xs mt-0.5 line-clamp-1">{svc.description}</p>}
                          </div>
                          <div className="text-right shrink-0 ml-4">
                            <p className="text-emerald-400 font-black text-sm">₱{Number(svc.price).toLocaleString()}</p>
                            {svc.basePrice !== svc.price && (
                              <p className="text-gray-600 text-xs line-through">₱{Number(svc.basePrice).toLocaleString()}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {!isEditing && (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setShowWalkIn(true)}
                      className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-3 rounded-xl transition-all shadow-lg shadow-red-600/20 text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Walk-In Ticket
                    </button>
                    <button
                      onClick={() => setShowPrint(true)}
                      className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-bold px-4 py-3 rounded-xl transition-all text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Print Inspection Sheet
                    </button>
                  </div>
                )}

                {/* AI Badge */}
                {!isEditing && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <p className="text-sm text-red-300">
                        <span className="font-black">AI-Powered Analysis:</span>{" "}
                        Results are generated by AI based on the uploaded image. Use the edit button to correct any details before creating a ticket.
                      </p>
                    </div>
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
