import React, { useState } from 'react';
import AdminLayout from './AdminLayout';

function AdminAI() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file) => {
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = () => {
    // Handle AI analysis
    console.log('Analyzing vehicle...');
  };

  const handleTakePhoto = () => {
    // Handle camera photo
    console.log('Opening camera...');
  };

  return (
    <AdminLayout 
      title="AI Vehicle Recognition & Damage Detection" 
      subtitle="Upload vehicle images for automatic recognition and damage assessment"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side - Image Upload */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-6">
              <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h2 className="text-xl font-bold text-gray-900">Vehicle Image Upload</h2>
            </div>

            {/* Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
                isDragging 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-300 bg-gray-50'
              }`}
            >
              {selectedImage ? (
                <div className="space-y-4">
                  <img 
                    src={selectedImage} 
                    alt="Selected vehicle" 
                    className="max-h-96 mx-auto rounded-lg shadow-lg"
                  />
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="text-red-600 hover:text-red-700 font-medium"
                  >
                    Remove Image
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <svg className="w-16 h-16 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div>
                    <p className="text-gray-700 font-medium mb-1">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-block cursor-pointer text-red-600 hover:text-red-700 font-medium"
                  >
                    Browse Files
                  </label>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <button
                onClick={handleAnalyze}
                disabled={!selectedImage}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Analyze Vehicle
              </button>
              <button
                onClick={handleTakePhoto}
                className="bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3 rounded-lg border border-gray-300 flex items-center justify-center gap-2 transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Take Photo
              </button>
            </div>
          </div>
        </div>

        {/* Right Side - AI Detection Statistics */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">AI Detection Statistics</h2>

            {/* Total Scans Today */}
            <div className="bg-red-50 border border-red-100 rounded-xl p-6 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Total Scans Today</span>
                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-4xl font-bold text-gray-900">47</div>
            </div>

            {/* Average Accuracy */}
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Average Accuracy</span>
                <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="text-4xl font-bold text-gray-900">94.2%</div>
            </div>

            {/* Damages Detected */}
            <div className="bg-red-50 border border-red-100 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Damages Detected</span>
                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <div className="text-4xl font-bold text-gray-900">23</div>
            </div>
          </div>

          {/* Recent Scans (Optional) */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Vehicle scan completed - 2 mins ago</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-600">Damage detected - 15 mins ago</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Vehicle scan completed - 32 mins ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminAI;