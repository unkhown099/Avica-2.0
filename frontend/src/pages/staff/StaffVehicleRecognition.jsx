import React, { useState } from "react";
import StaffLayout from "./StaffLayout";

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
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size too large. Please upload an image smaller than 5MB.");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target.result);
      // Automatically start processing
      analyzeVehicleWithAI(file);
    };
    reader.readAsDataURL(file);
  };

  // Convert image file to base64
  const imageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(",")[1]); // Remove data URL prefix
      reader.onerror = (error) => reject(error);
    });
  };

  const analyzeVehicleWithAI = async (file) => {
    setIsProcessing(true);
    setAnalysisResult(null);
    setApiError(null);

    try {
      const base64Image = await imageToBase64(file);

      const getCsrfToken = () => {
        return document.cookie
          .split("; ")
          .find((row) => row.startsWith("csrftoken="))
          ?.split("=")[1];
      };

      const response = await fetch(
        "http://127.0.0.1:8000/api/analyze-vehicle/",
        {
          method: "POST",
          credentials: "include", // <-- important (sends cookies)
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCsrfToken(), // <-- send CSRF token
          },
          body: JSON.stringify({
            image: base64Image,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const data = await response.json();
      setAnalysisResult(data);
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

  return (
    <StaffLayout title="" subtitle="">
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900 -m-8 p-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            AI Vehicle Analysis
          </h1>
          <p className="text-slate-300">
            Upload a vehicle image for AI-powered analysis and identification
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Upload Vehicle Image
              </h2>

              {/* Drag & Drop Area */}
              {!uploadedImage ? (
                <div
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-4 border-dashed rounded-xl p-12 text-center transition-all ${
                    isDragging
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <svg
                    className="w-20 h-20 text-gray-400 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {isDragging
                      ? "Drop image here"
                      : "Drag & drop vehicle image here"}
                  </h3>
                  <p className="text-gray-600 mb-4">or</p>
                  <label className="inline-block px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold cursor-pointer transition-colors">
                    Browse Files
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileInput}
                      className="hidden"
                    />
                  </label>
                  <p className="text-sm text-gray-500 mt-4">
                    Supported formats: JPG, PNG, HEIC (Max 5MB)
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Image Preview */}
                  <div className="relative rounded-xl overflow-hidden border-2 border-gray-200">
                    <img
                      src={uploadedImage}
                      alt="Uploaded vehicle"
                      className="w-full h-auto"
                    />
                    {isProcessing && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="text-center">
                          <svg
                            className="animate-spin w-12 h-12 text-white mx-auto mb-3"
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
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          <p className="text-white font-semibold">
                            AI Analyzing Vehicle...
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* API Error Message */}
                  {apiError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                      {apiError}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleClear}
                      className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold transition-colors"
                    >
                      Clear & Upload New
                    </button>
                    {!isProcessing && !analysisResult && (
                      <button
                        onClick={() => {
                          // Convert base64 back to file for reprocessing
                          fetch(uploadedImage)
                            .then((res) => res.blob())
                            .then((blob) => {
                              const file = new File([blob], "image.jpg", {
                                type: "image/jpeg",
                              });
                              analyzeVehicleWithAI(file);
                            });
                        }}
                        className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                      >
                        Retry Analysis
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-600"
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
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <svg
                    className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0"
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
                  <span>Take clear photos showing the entire vehicle</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg
                    className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0"
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
                  <span>
                    Include front, side, and rear views for better accuracy
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <svg
                    className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0"
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
                  <span>Ensure good lighting conditions</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg
                    className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0"
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
                  <span>Avoid blurry or obstructed images</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Results Section */}
          <div>
            {!analysisResult && !isProcessing && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
                <svg
                  className="w-24 h-24 text-gray-300 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No Analysis Yet
                </h3>
                <p className="text-gray-600">
                  Upload a vehicle image to see AI analysis results
                </p>
              </div>
            )}

            {analysisResult && (
              <div className="space-y-6">
                {/* Vehicle Information */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <svg
                        className="w-6 h-6 text-purple-600"
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
                    <h3 className="text-xl font-bold text-gray-900">
                      Vehicle Analysis Results
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Make */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="text-sm text-gray-600">Make</label>
                      <p className="font-bold text-gray-900 text-lg">
                        {analysisResult.make || "Not detected"}
                      </p>
                    </div>

                    {/* Model */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="text-sm text-gray-600">Model</label>
                      <p className="font-bold text-gray-900 text-lg">
                        {analysisResult.model || "Not detected"}
                      </p>
                    </div>

                    {/* Year */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="text-sm text-gray-600">Year</label>
                      <p className="font-bold text-gray-900">
                        {analysisResult.year || "Not detected"}
                      </p>
                    </div>

                    {/* Color */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="text-sm text-gray-600">Color</label>
                      <div className="flex items-center gap-2">
                        {analysisResult.color &&
                          analysisResult.color !== "Not detected" && (
                            <div
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{
                                backgroundColor:
                                  analysisResult.color.toLowerCase(),
                              }}
                            ></div>
                          )}
                        <p className="font-bold text-gray-900">
                          {analysisResult.color || "Not detected"}
                        </p>
                      </div>
                    </div>

                    {/* Body Type */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="text-sm text-gray-600">Body Type</label>
                      <p className="font-bold text-gray-900">
                        {analysisResult.bodyType || "Not detected"}
                      </p>
                    </div>

                    {/* Confidence */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="text-sm text-gray-600">
                        Confidence Level
                      </label>
                      <p className="font-bold text-gray-900 capitalize">
                        {analysisResult.confidence || "Not specified"}
                      </p>
                    </div>

                    {/* Features */}
                    {analysisResult.features &&
                      analysisResult.features.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                          <label className="text-sm text-gray-600 mb-2">
                            Notable Features
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {analysisResult.features.map((feature, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Condition */}
                    <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                      <label className="text-sm text-gray-600">
                        Estimated Condition
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            analysisResult.condition
                              ?.toLowerCase()
                              .includes("excellent")
                              ? "bg-green-500"
                              : analysisResult.condition
                                    ?.toLowerCase()
                                    .includes("good")
                                ? "bg-blue-500"
                                : analysisResult.condition
                                      ?.toLowerCase()
                                      .includes("fair")
                                  ? "bg-yellow-500"
                                  : analysisResult.condition
                                        ?.toLowerCase()
                                        .includes("poor")
                                    ? "bg-red-500"
                                    : "bg-gray-500"
                          }`}
                        ></div>
                        <p className="font-bold text-gray-900">
                          {analysisResult.condition || "Not detected"}
                        </p>
                      </div>
                    </div>

                    {/* Additional Notes */}
                    {analysisResult.additionalNotes && (
                      <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                        <label className="text-sm text-gray-600">
                          Additional Notes
                        </label>
                        <p className="text-gray-700 mt-1">
                          {analysisResult.additionalNotes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Analysis Badge */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5 text-blue-600"
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
                    <p className="text-sm text-blue-800">
                      <span className="font-semibold">
                        AI-Powered Analysis:
                      </span>{" "}
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
