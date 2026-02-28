import React, { useState } from 'react';
import Navbar from '../../components/customer/CustomerNavbar.jsx';
import Footer from '../../components/customer/CustomerFooter.jsx';

function CustomerDashboard() {
  // Mock user data - replace with actual user data from authentication
  const [user] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+63 912 345 6789',
    memberSince: '2024',
    carInfo: null
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const handleCarImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewImage(URL.createObjectURL(file));
      await performCarAnalysis(file);
    }
  };

  const performCarAnalysis = async (file) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    const formData = new FormData();
    formData.append('car_image', file);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}api/car-recognition/`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        const result = data.result;

        // Generate recommendations based on detected info
        const recommendations = generateRecommendations(result);

        setAnalysisResult({
          ...result,
          recommendations
        });

        if (data.demo_mode) {
          console.warn("Gemini API Key not configured. Using Demo Mode.");
        }
      } else {
        alert(data.message || "An error occurred during car analysis.");
        setPreviewImage(null);
      }
    } catch (error) {
      console.error("Analysis Error:", error);
      alert("Failed to connect to the analysis server.");
      setPreviewImage(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateRecommendations = (car) => {
    const { make, model, year, color } = car;
    const recs = [];

    // General premium recommendations
    recs.push({
      title: "Ceramic Coating",
      reason: `Protect your ${make}'s ${color} finish from UV rays and road debris.`,
      price: "₱15,000+"
    });

    // Model specific logic (examples)
    const modelLower = model.toLowerCase();
    if (modelLower.includes('fortuner') || modelLower.includes('hilux') || modelLower.includes('raptor')) {
      recs.push({
        title: "Undercarriage Protection",
        reason: "Essential for 4x4 vehicles to prevent rust and damage from off-road adventures.",
        price: "₱8,500"
      });
    } else {
      recs.push({
        title: "Interior Deep Extraction",
        reason: "Keep your cabin fresh and allergen-free with our deep steam cleaning.",
        price: "₱3,500"
      });
    }

    // Age specific logic
    const currentYear = new Date().getFullYear();
    const carYear = parseInt(year);
    if (!isNaN(carYear) && (currentYear - carYear > 5)) {
      recs.push({
        title: "Paint Correction",
        reason: "Restore the original shine of your vehicle by removing light scratches and swirls.",
        price: "₱6,500+"
      });
    } else {
      recs.push({
        title: "Paint Protection Film (Front)",
        reason: "Prevent future rock chips on your relatively new vehicle's front end.",
        price: "₱25,000+"
      });
    }

    return recs;
  };

  // Mock upcoming bookings
  const upcomingBookings = [
    {
      id: 1,
      service: 'Exterior Detailing',
      date: '2026-02-05',
      time: '10:00 AM',
      status: 'confirmed',
      price: '₱2,500'
    },
    {
      id: 2,
      service: 'Interior Detailing',
      date: '2026-02-10',
      time: '2:00 PM',
      status: 'pending',
      price: '₱3,000'
    }
  ];

  // Mock service history
  const serviceHistory = [
    {
      id: 1,
      service: 'Full Detailing',
      date: '2026-01-15',
      status: 'completed',
      price: '₱5,000'
    },
    {
      id: 2,
      service: 'Paint Protection',
      date: '2025-12-20',
      status: 'completed',
      price: '₱8,000'
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      <Navbar user={user} />

      {/* Main Content */}
      <div className="pt-20">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-b from-red-950/20 via-black to-black py-16 border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
                  Welcome back, {user.firstName}!
                </h1>
                <p className="text-xl text-gray-400">
                  Ready to keep your car looking its best?
                </p>
              </div>
              <button className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-red-600/50 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Book New Service
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <div className="bg-gradient-to-br from-gray-900 to-red-950/20 rounded-2xl p-6 border border-white/5 hover:border-red-600/30 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-3xl font-black text-white">{upcomingBookings.length}</div>
                  <div className="text-sm text-gray-400">Upcoming</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-red-950/20 rounded-2xl p-6 border border-white/5 hover:border-red-600/30 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-3xl font-black text-white">{serviceHistory.length}</div>
                  <div className="text-sm text-gray-400">Completed</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-red-950/20 rounded-2xl p-6 border border-white/5 hover:border-red-600/30 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-3xl font-black text-white">0</div>
                  <div className="text-sm text-gray-400">Rewards Points</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-red-950/20 rounded-2xl p-6 border border-white/5 hover:border-red-600/30 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <div>
                  <div className="text-3xl font-black text-white">5.0</div>
                  <div className="text-sm text-gray-400">Your Rating</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-12">
            <h2 className="text-3xl font-black text-white mb-6">Quick Actions</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <button className="group bg-gradient-to-br from-gray-900 to-red-950/20 rounded-2xl p-8 border border-white/5 hover:border-red-600 transition-all duration-300 hover:transform hover:scale-105 text-left">
                <div className="w-14 h-14 bg-red-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Book a Service</h3>
                <p className="text-gray-400">Schedule your next auto detailing appointment</p>
              </button>

              <button className="group bg-gradient-to-br from-gray-900 to-red-950/20 rounded-2xl p-8 border border-white/5 hover:border-red-600 transition-all duration-300 hover:transform hover:scale-105 text-left">
                <div className="w-14 h-14 bg-red-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Manage Bookings</h3>
                <p className="text-gray-400">View and modify your appointments</p>
              </button>

              <button className="group bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 hover:border-red-600 transition-all duration-300 hover:transform hover:scale-105 text-left">
                <div className="w-14 h-14 bg-red-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Service History</h3>
                <p className="text-gray-400">Review your past services</p>
              </button>
            </div>
          </div>

          {/* Car AI Recognition Feature */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-black text-white">Car AI Analysis</h2>
              <div className="flex items-center gap-2 px-3 py-1 bg-red-600/20 rounded-full border border-red-600/30">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Powered by Gemini AI</span>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 items-stretch">
              {/* Upload Card */}
              <div className="bg-gradient-to-br from-red-950/30 to-black rounded-3xl p-8 border border-red-600/20 shadow-[0_0_50px_rgba(220,38,38,0.1)] flex flex-col items-center justify-center text-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {!previewImage ? (
                  <>
                    <div className="w-20 h-20 bg-red-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                      <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2">Identify Your Car</h3>
                    <p className="text-gray-400 mb-8 max-w-xs">Upload a photo of your vehicle for personalized service recommendations</p>
                    <label className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-4 rounded-xl cursor-pointer transition-all duration-300 shadow-xl shadow-red-600/30">
                      Upload Car Photo
                      <input type="file" className="hidden" accept="image/*" onChange={handleCarImageUpload} />
                    </label>
                  </>
                ) : (
                  <div className="w-full h-full relative group/preview">
                    <img src={previewImage} alt="Car preview" className="w-full h-64 object-cover rounded-2xl border border-white/10" />
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl">
                        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-white font-bold animate-pulse uppercase tracking-widest text-sm">Analyzing Vehicle...</p>
                      </div>
                    )}
                    <button
                      onClick={() => { setPreviewImage(null); setAnalysisResult(null); }}
                      className="absolute top-4 right-4 bg-black/60 hover:bg-red-600 p-2 rounded-lg text-white border border-white/20 transition-all opacity-0 group-hover/preview:opacity-100"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Result & Recommendation Card */}
              <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-8 border border-white/5 shadow-2zl flex flex-col">
                {analysisResult ? (
                  <div className="animate-[slideUp_0.5s_ease-out]">
                    <div className="flex items-start justify-between mb-8">
                      <div>
                        <div className="text-sm font-bold text-red-600 uppercase tracking-widest mb-1">Detected Vehicle</div>
                        <h3 className="text-4xl font-black text-white">{analysisResult.make} {analysisResult.model}</h3>
                        <p className="text-gray-400 font-medium">{analysisResult.year} • {analysisResult.color}</p>
                      </div>
                      <div className="bg-green-600/20 text-green-500 px-4 py-2 rounded-xl border border-green-600/30 font-bold text-sm">
                        98% Match
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">Tailored Recommendations</div>
                      {analysisResult.recommendations.map((rec, idx) => (
                        <div key={idx} className="bg-white/5 rounded-2xl p-4 border border-white/5 hover:border-red-600/30 transition-all group/rec">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="text-white font-bold mb-1 group-hover/rec:text-red-500 transition-colors">{rec.title}</h4>
                              <p className="text-sm text-gray-400">{rec.reason}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-black text-white mb-1">{rec.price}</div>
                              <button className="text-xs font-bold text-red-600 hover:text-red-500 uppercase">Book Now</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                    <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500 italic">Analysis results will appear here after upload</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Upcoming Bookings */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-black text-white">Upcoming Bookings</h2>
              <a href="/bookings" className="text-red-600 hover:text-red-500 font-semibold">View All</a>
            </div>
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="bg-gradient-to-br from-gray-900 to-red-950/20 rounded-2xl p-6 border border-white/5 hover:border-red-600 transition-all duration-300">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white">{booking.service}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${booking.status === 'confirmed'
                          ? 'bg-green-600/20 text-green-400'
                          : 'bg-yellow-600/20 text-yellow-400'
                          }`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-gray-400">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{booking.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{booking.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-black text-white">{booking.price}</div>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-300">
                          Reschedule
                        </button>
                        <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-300">
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Service History */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-black text-white">Recent Service History</h2>
              <a href="/history" className="text-red-600 hover:text-red-500 font-semibold">View All</a>
            </div>
            <div className="space-y-4">
              {serviceHistory.map((service) => (
                <div key={service.id} className="bg-gradient-to-br from-gray-900 to-red-950/20 rounded-2xl p-6 border border-white/5 transition-all duration-300 hover:border-red-600/30">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white">{service.service}</h3>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-600/20 text-green-400">
                          Completed
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{service.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-black text-white">{service.price}</div>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-300">
                          Book Again
                        </button>
                        <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-300">
                          Leave Review
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default CustomerDashboard;