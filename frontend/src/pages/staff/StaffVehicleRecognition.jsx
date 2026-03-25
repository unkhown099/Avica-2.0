import React, { useState } from "react";
import StaffLayout from "./StaffLayout";
import { API_BASE } from "../../hooks/useAuth.js";

function StaffVehicleRecognition() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [apiError, setApiError] = useState(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) handleFile(files[0]);
  };
  const handleFileInput = (e) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  const handleFile = (file) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File size too large. Max 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target.result);
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
    try {
      const base64Image = await imageToBase64(file);
      const getCsrfToken = () =>
        document.cookie
          .split("; ")
          .find((r) => r.startsWith("csrftoken="))
          ?.split("=")[1];
      const response = await fetch(
        `${API_BASE}/api/analyze-vehicle/`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCsrfToken(),
          },
          body: JSON.stringify({ image: base64Image }),
        },
      );
      if (!response.ok) throw new Error(await response.text());
      setAnalysisResult(await response.json());
    } catch (error) {
      console.error(error);
      setApiError("Error analyzing vehicle.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setUploadedImage(null);
    setAnalysisResult(null);
    setIsProcessing(false);
    setApiError(null);
  };

  const conditionColor = (c = "") => {
    const lc = c.toLowerCase();
    if (lc.includes("excellent")) return "#10b981";
    if (lc.includes("good")) return "#3b82f6";
    if (lc.includes("fair")) return "#f59e0b";
    if (lc.includes("poor")) return "#ef4444";
    return "#6b7280";
  };

  return (
    <StaffLayout title="" subtitle="">
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/30 -m-8 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight">
            AI Vehicle Analysis
          </h1>
          <p className="text-gray-400 mt-1">
            Upload a vehicle image for AI-powered analysis and identification
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <div className="space-y-5">
            <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
              <h2 className="text-lg font-black text-white mb-6">
                Upload Vehicle Image
              </h2>

              {!uploadedImage ? (
                <div
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${isDragging
                      ? "border-red-500 bg-red-500/10"
                      : "border-white/10 hover:border-white/20"
                    }`}
                >
                  <svg
                    className="w-16 h-16 text-gray-600 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <h3 className="text-base font-black text-white mb-1">
                    {isDragging
                      ? "Drop image here"
                      : "Drag & drop vehicle image here"}
                  </h3>
                  <p className="text-gray-500 text-sm mb-5">or</p>
                  <label className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-3 rounded-xl cursor-pointer transition-all shadow-lg shadow-red-600/20">
                    Browse Files
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileInput}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-600 mt-4">
                    Supported: JPG, PNG, HEIC (Max 5MB)
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden border border-white/10">
                    <img
                      src={uploadedImage}
                      alt="Uploaded vehicle"
                      className="w-full h-auto"
                    />
                    {isProcessing && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                        <div className="text-center">
                          <svg
                            className="animate-spin w-10 h-10 text-red-400 mx-auto mb-3"
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
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          <p className="text-white font-black text-sm">
                            AI Analyzing Vehicle...
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {apiError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
                      {apiError}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={handleClear}
                      className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-semibold px-4 py-3 rounded-xl transition-all"
                    >
                      Clear & Upload New
                    </button>
                    {!isProcessing && !analysisResult && (
                      <button
                        onClick={() => {
                          fetch(uploadedImage)
                            .then((r) => r.blob())
                            .then((blob) => {
                              analyzeVehicleWithAI(
                                new File([blob], "image.jpg", {
                                  type: "image/jpeg",
                                }),
                              );
                            });
                        }}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-3 rounded-xl transition-all shadow-lg shadow-red-600/20"
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
                <svg
                  className="w-4 h-4 text-blue-400"
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
                Tips for Best Results
              </h3>
              <ul className="space-y-2.5">
                {[
                  "Take clear photos showing the entire vehicle",
                  "Include front, side, and rear views for better accuracy",
                  "Ensure good lighting conditions",
                  "Avoid blurry or obstructed images",
                ].map((tip, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-sm text-gray-400"
                  >
                    <svg
                      className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0"
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
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Results Section */}
          <div>
            {!analysisResult && !isProcessing && (
              <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-16 text-center backdrop-blur-sm h-full flex flex-col items-center justify-center">
                <svg
                  className="w-20 h-20 text-gray-700 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="text-xl font-black text-white mb-2">
                  No Analysis Yet
                </h3>
                <p className="text-gray-500 text-sm">
                  Upload a vehicle image to see AI analysis results
                </p>
              </div>
            )}

            {analysisResult && (
              <div className="space-y-5">
                <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-purple-500/20 p-3 rounded-xl">
                      <svg
                        className="w-5 h-5 text-purple-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-black text-white">
                      Vehicle Analysis Results
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        label: "Make",
                        value: analysisResult.make || "Not detected",
                      },
                      {
                        label: "Model",
                        value: analysisResult.model || "Not detected",
                      },
                      {
                        label: "Year",
                        value: analysisResult.year || "Not detected",
                      },
                      {
                        label: "Body Type",
                        value: analysisResult.bodyType || "Not detected",
                      },
                      {
                        label: "Confidence",
                        value: analysisResult.confidence || "Not specified",
                      },
                    ].map((field) => (
                      <div
                        key={field.label}
                        className="bg-gray-800/60 border border-white/5 rounded-xl p-3"
                      >
                        <div className="text-xs text-gray-500 mb-1">
                          {field.label}
                        </div>
                        <div className="text-white font-bold text-sm">
                          {field.value}
                        </div>
                      </div>
                    ))}

                    {/* Color */}
                    <div className="bg-gray-800/60 border border-white/5 rounded-xl p-3">
                      <div className="text-xs text-gray-500 mb-1">Color</div>
                      <div className="flex items-center gap-2">
                        {analysisResult.color &&
                          analysisResult.color !== "Not detected" && (
                            <div
                              className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                              style={{
                                backgroundColor:
                                  analysisResult.color.toLowerCase(),
                              }}
                            />
                          )}
                        <span className="text-white font-bold text-sm">
                          {analysisResult.color || "Not detected"}
                        </span>
                      </div>
                    </div>

                    {/* Condition */}
                    <div className="bg-gray-800/60 border border-white/5 rounded-xl p-3 col-span-2">
                      <div className="text-xs text-gray-500 mb-1">
                        Estimated Condition
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{
                            backgroundColor: conditionColor(
                              analysisResult.condition,
                            ),
                          }}
                        />
                        <span className="text-white font-bold text-sm">
                          {analysisResult.condition || "Not detected"}
                        </span>
                      </div>
                    </div>

                    {/* Features */}
                    {analysisResult.features?.length > 0 && (
                      <div className="bg-gray-800/60 border border-white/5 rounded-xl p-3 col-span-2">
                        <div className="text-xs text-gray-500 mb-2">
                          Notable Features
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {analysisResult.features.map((f, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-semibold"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Additional Notes */}
                    {analysisResult.additionalNotes && (
                      <div className="bg-gray-800/60 border border-white/5 rounded-xl p-3 col-span-2">
                        <div className="text-xs text-gray-500 mb-1">
                          Additional Notes
                        </div>
                        <p className="text-gray-300 text-sm">
                          {analysisResult.additionalNotes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Badge */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-4 h-4 text-blue-400 mt-0.5 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    <p className="text-sm text-blue-300">
                      <span className="font-black">AI-Powered Analysis:</span>{" "}
                      This vehicle information was generated by artificial
                      intelligence based on the uploaded image. Results may vary
                      based on image quality and clarity.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </StaffLayout>
  );
}

export default StaffVehicleRecognition;