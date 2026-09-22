import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Cropper from "react-easy-crop";
import CustomerLayout from "./CustomerLayout";
import { API_BASE } from "../../hooks/useAuth.js";
import getCroppedImg from "../../utils/cropImage.js";

const getHeaders = () => {
  const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  return {
    Authorization: `Bearer ${token}`
  };
};

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

const normalizePhoneLocal = (value) =>
  String(value || "")
    .replace(/\D/g, "")
    .replace(/^63/, "")
    .replace(/^0/, "")
    .slice(0, 10);

function CustomerProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });

  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Vehicle Section & Stats State
  const [vehicleData, setVehicleData] = useState({
    car_make: "",
    car_model: "",
    car_year: "",
    car_color: "",
    car_plate: "",
  });
  const [initialVehicleData, setInitialVehicleData] = useState({
    car_make: "",
    car_model: "",
    car_year: "",
    car_color: "",
    car_plate: "",
  });
  const [profileStats, setProfileStats] = useState({
    tasksCompleted: 0,
    rating: "5.0 ★",
    yearsExperience: "1 Year",
  });

  // Password Modal State
  const [showPassModal, setShowPassModal] = useState(false);
  const [passForm, setPassForm] = useState({
    current: "",
    new: "",
    confirm: ""
  });
  const [passErrors, setPassErrors] = useState({});

  // Crop Modal State
  const [imageToCrop, setImageToCrop] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const [userRes, custRes, bookingsRes] = await Promise.allSettled([
        axios.get(`${API_BASE}/me/`, { headers: getHeaders() }),
        axios.get(`${API_BASE}/api/customers/me/`, { headers: getHeaders() }),
        axios.get(`${API_BASE}/api/bookings/`, { headers: getHeaders() }),
      ]);

      if (userRes.status === "fulfilled") {
        const u = userRes.value.data;
        setUserData(u);
        setFormData({
          first_name: u.first_name || "",
          last_name: u.last_name || "",
          email: u.email || "",
          phone: u.phone || "",
        });
        const createdDate = new Date(u.created_at || Date.now());
        const diffYears = Math.max(1, new Date().getFullYear() - createdDate.getFullYear());
        setProfileStats((prev) => ({
          ...prev,
          yearsExperience: `${diffYears} Year${diffYears > 1 ? "s" : ""}`,
        }));
      }

      if (custRes.status === "fulfilled" && custRes.value.data) {
        const c = custRes.value.data;
        const v = {
          car_make: c.car_make || "",
          car_model: c.car_model || "",
          car_year: c.car_year || "",
          car_color: c.car_color || "",
          car_plate: c.car_plate || "",
        };
        setVehicleData(v);
        setInitialVehicleData(v);
        if (c.avg_rating) {
          setProfileStats((prev) => ({ ...prev, rating: `${c.avg_rating} ★` }));
        }
      }

      if (bookingsRes.status === "fulfilled" && bookingsRes.value.data) {
        const rows = Array.isArray(bookingsRes.value.data)
          ? bookingsRes.value.data
          : bookingsRes.value.data.results || [];
        const completed = rows.filter((b) => b.status === "done").length;
        setProfileStats((prev) => ({
          ...prev,
          tasksCompleted: completed,
        }));
      }
    } catch (err) {
      console.error("Failed to fetch user data:", err);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to load profile data." });
    } finally {
      setLoading(false);
    }
  };

  const validateField = (name, value) => {
    let error = "";
    if (name === "first_name" || name === "last_name") {
      if (!value.trim()) error = `${name === "first_name" ? "First" : "Last"} name is required`;
      else if (value.length < 2) error = "Too short";
    }
    if (name === "phone") {
      const phoneRegex = /^\+639\d{9}$/;
      if (value && !phoneRegex.test(value)) error = "Invalid PH phone number (e.g. +639123456789)";
    }
    setErrors(prev => ({ ...prev, [name]: error }));
    return !error;
  };

  const handleInputChange = (name, value) => {
    let nextValue = value;
    if (name === "phone") {
      const local = normalizePhoneLocal(value);
      nextValue = local ? `+63${local}` : "";
    }
    setFormData(prev => ({ ...prev, [name]: nextValue }));
    validateField(name, nextValue);
    setIsDirty(true);
  };

  const onCropComplete = useCallback((_croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setImageToCrop(reader.result);
      setShowCropModal(true);
    };
  };

  const updateStoredUser = (newData) => {
    const key = localStorage.getItem("user") ? "user" : sessionStorage.getItem("user") ? "user" : null;
    if (!key) return;

    const storage = localStorage.getItem(key) ? localStorage : sessionStorage;
    try {
      const current = JSON.parse(storage.getItem(key));
      const updated = { ...current, ...newData };
      storage.setItem(key, JSON.stringify(updated));
      window.dispatchEvent(new Event("userUpdate"));
    } catch (e) {
      console.error("Failed to update stored user", e);
    }
  };

  const handleCropSave = async () => {
    try {
      setSaving(true);
      const croppedImageBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);

      const uploadData = new FormData();
      uploadData.append("profile_picture", croppedImageBlob, "profile.jpg");

      const res = await axios.put(`${API_BASE}/me/`, uploadData, {
        headers: {
          ...getHeaders(),
          "Content-Type": "multipart/form-data",
        },
      });

      setUserData(res.data);
      updateStoredUser(res.data);
      setShowCropModal(false);
      setImageToCrop(null);

      Swal.fire({
        icon: "success",
        title: "Photo Updated",
        text: "Your profile picture has been changed.",
        timer: 1500,
        showConfirmButton: false,
        background: "#111827",
        color: "#fff",
      });
    } catch (err) {
      console.error("Crop/Upload error", err);
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: "Failed to process or upload image.",
        background: "#111827",
        color: "#fff",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (userData) {
      setFormData({
        first_name: userData.first_name || "",
        last_name: userData.last_name || "",
        email: userData.email || "",
        phone: userData.phone || "",
      });
    }
    setVehicleData(initialVehicleData);
    setErrors({});
    setIsDirty(false);
    setIsEditing(false);
  };

  const handleVehicleChange = (field, value) => {
    setVehicleData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleUpdateProfile = async (e) => {
    if (e) e.preventDefault();

    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    const fValid = validateField("first_name", formData.first_name);
    const lValid = validateField("last_name", formData.last_name);
    const pValid = validateField("phone", formData.phone);

    if (!fValid || !lValid || !pValid) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please fix the errors before saving.",
        background: "#111827",
        color: "#fff",
      });
      return;
    }

    setSaving(true);
    try {
      const [res] = await Promise.all([
        axios.put(`${API_BASE}/me/`, {
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
        }, { headers: getHeaders() }),
        axios.put(`${API_BASE}/api/customers/me/`, vehicleData, { headers: getHeaders() }),
      ]);

      setUserData(res.data);
      setInitialVehicleData(vehicleData);
      updateStoredUser(res.data);
      setIsDirty(false);
      setIsEditing(false);
      Swal.fire({
        icon: "success",
        title: "Profile Updated",
        text: "Your information and vehicle details have been successfully updated.",
        timer: 1500,
        showConfirmButton: false,
        background: "#111827",
        color: "#fff",
      });
    } catch (err) {
      console.error("Failed to update profile:", err);
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: err.response?.data?.detail || "Failed to update profile information.",
        background: "#111827",
        color: "#fff",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    if (e) e.preventDefault();
    if (passForm.new !== passForm.confirm) return;
    if (passForm.new.length < 8) return;

    setSaving(true);
    try {
      await axios.post(`${API_BASE}/change-password/`, {
        old_password: passForm.current,
        new_password: passForm.new,
      }, { headers: getHeaders() });

      setShowPassModal(false);
      setPassForm({ current: "", new: "", confirm: "" });
      Swal.fire({
        icon: "success",
        title: "Password Changed",
        text: "Your password has been successfully updated.",
        timer: 1500,
        showConfirmButton: false,
        background: "#111827",
        color: "#fff",
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.detail || "Failed to change password.",
        background: "#111827",
        color: "#fff",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePassChange = (name, value) => {
    const newForm = { ...passForm, [name]: value };
    setPassForm(newForm);

    let errs = { ...passErrors };
    if (name === "new") {
      if (value.length < 8) errs.new = "Minimum 8 characters";
      else delete errs.new;
    }
    if (name === "confirm" || name === "new") {
      if (newForm.confirm && newForm.new !== newForm.confirm) errs.confirm = "Passwords do not match";
      else delete errs.confirm;
    }
    setPassErrors(errs);
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </CustomerLayout>
    );
  }

  const isPassValid = passForm.current && passForm.new && passForm.confirm && !passErrors.new && !passErrors.confirm;

  return (
    <CustomerLayout>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-950/30 p-4 sm:p-6 lg:p-8">
        {/* Image Crop Modal */}
        {showCropModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowCropModal(false)}></div>
            <div className="relative bg-gray-900 border border-white/10 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl scale-in duration-300">
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-white">Adjust Photo</h3>
                  <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-1">Crop and center your profile picture</p>
                </div>
                <button onClick={() => setShowCropModal(false)} className="text-gray-500 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="relative h-[400px] bg-black/50">
                <Cropper
                  image={imageToCrop}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    <span>Zoom</span>
                    <span>{Math.round(zoom * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-red-600"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setShowCropModal(false)}
                    className="flex-1 px-6 py-4 bg-gray-800 text-white rounded-2xl font-black hover:bg-gray-700 transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCropSave}
                    disabled={saving}
                    className="flex-1 px-6 py-4 bg-red-600 text-white rounded-2xl font-black shadow-xl shadow-red-600/20 active:scale-95 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      "Set Profile Picture"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Password Change Modal */}
        {showPassModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowPassModal(false)}></div>
            <div className="relative bg-gray-900 border border-white/10 rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl scale-in duration-300">
              <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 bg-red-600/20 rounded-2xl flex items-center justify-center text-red-500 mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-white">Security Update</h3>
                <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mt-1">Change Account Password</p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Current Password</label>
                  <input
                    type="password"
                    required
                    value={passForm.current}
                    onChange={(e) => handlePassChange("current", e.target.value)}
                    className="w-full bg-black/40 border-2 border-white/5 rounded-2xl px-5 py-3.5 text-white font-bold focus:border-red-600 focus:ring-4 focus:ring-red-600/10 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={passForm.new}
                    onChange={(e) => handlePassChange("new", e.target.value)}
                    className={`w-full bg-black/40 border-2 rounded-2xl px-5 py-3.5 text-white font-bold outline-none transition-all ${passErrors.new ? "border-red-600/50" : "border-white/5 focus:border-red-600 focus:ring-4 focus:ring-red-600/10"
                      }`}
                  />
                  {passErrors.new && <p className="text-red-500 text-[10px] font-bold ml-1">{passErrors.new}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={passForm.confirm}
                    onChange={(e) => handlePassChange("confirm", e.target.value)}
                    className={`w-full bg-black/40 border-2 rounded-2xl px-5 py-3.5 text-white font-bold outline-none transition-all ${passErrors.confirm ? "border-red-600/50" : "border-white/5 focus:border-red-600 focus:ring-4 focus:ring-red-600/10"
                      }`}
                  />
                  {passErrors.confirm && <p className="text-red-500 text-[10px] font-bold ml-1">{passErrors.confirm}</p>}
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPassModal(false)}
                    className="flex-1 px-6 py-4 bg-gray-800 text-white rounded-2xl font-black hover:bg-gray-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!isPassValid || saving}
                    className={`flex-1 px-6 py-4 rounded-2xl font-black transition-all ${isPassValid && !saving ? "bg-red-600 text-white shadow-xl shadow-red-600/20 active:scale-95" : "bg-gray-800 text-gray-500 cursor-not-allowed"
                      }`}
                  >
                    {saving ? "UPDATING..." : "CONFIRM"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto py-6 animate-in fade-in duration-500">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-black text-white tracking-tight">MY <span className="text-red-600">PROFILE</span></h1>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em] mt-2">Manage your account information and security</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">

            {/* Left Profile Card */}
            <div className="lg:w-1/3">
              <div className="bg-gray-900/40 border border-white/5 rounded-[2.5rem] p-8 flex flex-col items-center text-center backdrop-blur-xl sticky top-8 shadow-2xl overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-red-600/10 to-transparent"></div>

                <div className="relative group mb-6 z-10">
                  <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-tr from-gray-800 to-black border-4 border-gray-900 flex items-center justify-center text-5xl font-black text-white shadow-[0_20px_40px_rgba(0,0,0,0.4)] overflow-hidden transition-all group-hover:scale-105 duration-500">
                    {userData?.profile_picture && !imgError ? (
                      <img
                        src={
                          userData.profile_picture.startsWith('http')
                            ? userData.profile_picture
                            : `${API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE}${userData.profile_picture.startsWith('/') ? userData.profile_picture : '/' + userData.profile_picture}`
                        }
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={() => setImgError(true)}
                      />
                    ) : (
                      (userData?.first_name || "?").charAt(0).toUpperCase()
                    )}
                  </div>
                  <label className="absolute -bottom-2 -right-2 bg-red-600 hover:bg-red-700 text-white p-3 rounded-2xl shadow-lg transition-all transform cursor-pointer border-4 border-gray-900 hover:scale-110 active:scale-95 z-20">
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </label>
                </div>

                <div className="z-10">
                  <h2 className="text-2xl font-black text-white tracking-tight">{userData?.first_name} {userData?.last_name}</h2>
                  <div className="mt-3 inline-flex items-center px-4 py-1.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-red-600/20">
                    Customer
                  </div>
                </div>

                <div className="mt-8 w-full space-y-3 z-10">
                  <button
                    onClick={handleUpdateProfile}
                    disabled={saving || (isEditing && !isDirty)}
                    className={`w-full px-6 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-lg ${isEditing
                      ? "bg-red-600 hover:bg-red-700 text-white shadow-red-600/30"
                      : "bg-white text-black hover:bg-red-600 hover:text-white"
                      }`}
                  >
                    {saving ? (
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        {isEditing ? (
                          <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>Save Changes</>
                        ) : (
                          <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>Edit Profile</>
                        )}
                      </>
                    )}
                  </button>

                  {isEditing && (
                    <button
                      onClick={handleCancel}
                      className="w-full px-6 py-4 rounded-2xl font-black bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-all border border-white/5"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                <div className="mt-12 pt-8 border-t border-white/5 w-full text-center">
                  <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2 text-center">Customer Since</p>
                  <p className="text-gray-400 font-bold text-sm">{formatDate(userData?.created_at)}</p>
                </div>
              </div>
            </div>

            {/* Right Content Sections */}
            <div className="lg:w-2/3 space-y-6">

              {/* Profile Stats Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-gray-900/40 border border-white/5 rounded-2xl p-4 backdrop-blur-xl">
                  <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-500 flex items-center justify-center mb-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Vehicle</p>
                  <p className="text-sm font-black text-white truncate mt-0.5">
                    {vehicleData.car_make ? `${vehicleData.car_make} ${vehicleData.car_model}` : "Not Added"}
                  </p>
                  <p className="text-[10px] text-gray-400 font-bold truncate mt-0.5">
                    {vehicleData.car_plate ? `Plate: ${vehicleData.car_plate}` : "No plate set"}
                  </p>
                </div>

                <div className="bg-gray-900/40 border border-white/5 rounded-2xl p-4 backdrop-blur-xl">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Tasks Done</p>
                  <p className="text-xl font-black text-white mt-0.5">{profileStats.tasksCompleted}</p>
                  <p className="text-[10px] text-gray-400 font-bold truncate mt-0.5">Services Finished</p>
                </div>

                <div className="bg-gray-900/40 border border-white/5 rounded-2xl p-4 backdrop-blur-xl">
                  <div className="w-8 h-8 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center mb-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Rating</p>
                  <p className="text-xl font-black text-amber-400 mt-0.5">{profileStats.rating}</p>
                  <p className="text-[10px] text-gray-400 font-bold truncate mt-0.5">Customer Score</p>
                </div>

                <div className="bg-gray-900/40 border border-white/5 rounded-2xl p-4 backdrop-blur-xl">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center mb-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Experience</p>
                  <p className="text-xl font-black text-white mt-0.5">{profileStats.yearsExperience}</p>
                  <p className="text-[10px] text-gray-400 font-bold truncate mt-0.5">Years of Membership</p>
                </div>
              </div>

              {/* Account Profile Section */}
              <div className="bg-gray-900/40 border border-white/5 rounded-[2.5rem] p-8 sm:p-10 backdrop-blur-xl shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4 sm:gap-5">
                    <div className="p-3.5 sm:p-4 bg-red-600 text-white rounded-[1.25rem] shadow-xl shadow-red-600/20">
                      <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">Personal Information</h3>
                      <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                        {isEditing ? "Modify your profile settings" : "View your current account details"}
                      </p>
                    </div>
                  </div>
                  {!isEditing && (
                    <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-green-500/10 rounded-xl border border-green-500/20">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-500 text-[10px] font-black uppercase tracking-widest">Active Member</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">First Name</label>
                    <input
                      type="text"
                      value={formData.first_name}
                      disabled={!isEditing}
                      onChange={(e) => handleInputChange("first_name", e.target.value)}
                      className={`w-full bg-black/40 border-2 rounded-2xl px-5 py-3.5 text-white font-bold transition-all outline-none ${!isEditing
                        ? "border-transparent text-gray-500 cursor-not-allowed"
                        : errors.first_name
                          ? "border-red-600/50 focus:ring-4 focus:ring-red-600/10"
                          : "border-white/5 focus:border-red-600 focus:ring-4 focus:ring-red-600/10"
                        }`}
                    />
                    {isEditing && errors.first_name && <p className="text-red-500 text-[10px] font-bold ml-1">{errors.first_name}</p>}
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Last Name</label>
                    <input
                      type="text"
                      value={formData.last_name}
                      disabled={!isEditing}
                      onChange={(e) => handleInputChange("last_name", e.target.value)}
                      className={`w-full bg-black/40 border-2 rounded-2xl px-5 py-3.5 text-white font-bold transition-all outline-none ${!isEditing
                        ? "border-transparent text-gray-500 cursor-not-allowed"
                        : errors.last_name
                          ? "border-red-600/50 focus:ring-4 focus:ring-red-600/10"
                          : "border-white/5 focus:border-red-600 focus:ring-4 focus:ring-red-600/10"
                        }`}
                    />
                    {isEditing && errors.last_name && <p className="text-red-500 text-[10px] font-bold ml-1">{errors.last_name}</p>}
                  </div>

                  <div className="space-y-2 opacity-60 text-left">
                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                      Email Address
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </label>
                    <div className="bg-transparent border-2 border-transparent px-5 py-3.5 text-gray-500 font-bold cursor-not-allowed">
                      {formData.email}
                    </div>
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Phone Number</label>
                    <div className={`flex items-center bg-black/40 border-2 rounded-2xl overflow-hidden transition-all ${!isEditing
                      ? "border-transparent text-gray-500 cursor-not-allowed"
                      : errors.phone
                        ? "border-red-600/50 focus-within:ring-4 focus-within:ring-red-600/10"
                        : "border-white/5 focus-within:border-red-600 focus-within:ring-4 focus-within:ring-red-600/10"
                      }`}>
                      <span className="px-5 py-3.5 text-gray-400 border-r border-white/10 font-bold">+63</span>
                      <input
                        type="tel"
                        value={String(formData.phone || "").replace(/^\+63/, "")}
                        disabled={!isEditing}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="9XXXXXXXXX"
                        className="w-full bg-transparent px-5 py-3.5 text-white font-bold outline-none placeholder-gray-600 disabled:text-gray-500 disabled:cursor-not-allowed"
                      />
                    </div>
                    {isEditing && errors.phone && <p className="text-red-500 text-[10px] font-bold ml-1">{errors.phone}</p>}
                  </div>
                </div>
              </div>

              {/* Vehicle Section */}
              <div className="bg-gray-900/40 border border-white/5 rounded-[2.5rem] p-8 sm:p-10 backdrop-blur-xl shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4 sm:gap-5">
                    <div className="p-3.5 sm:p-4 bg-amber-600 text-white rounded-[1.25rem] shadow-xl shadow-amber-600/20">
                      <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">Vehicle Information</h3>
                      <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                        {isEditing ? "Update your registered vehicle details" : "Your primary vehicle for service appointments"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-6">
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Car Make / Brand</label>
                    <input
                      type="text"
                      placeholder="e.g. Toyota, Honda"
                      value={vehicleData.car_make}
                      disabled={!isEditing}
                      onChange={(e) => handleVehicleChange("car_make", e.target.value)}
                      className={`w-full bg-black/40 border-2 rounded-2xl px-5 py-3.5 text-white font-bold transition-all outline-none ${!isEditing
                        ? "border-transparent text-gray-500 cursor-not-allowed"
                        : "border-white/5 focus:border-red-600 focus:ring-4 focus:ring-red-600/10"
                        }`}
                    />
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Car Model</label>
                    <input
                      type="text"
                      placeholder="e.g. Vios, Civic"
                      value={vehicleData.car_model}
                      disabled={!isEditing}
                      onChange={(e) => handleVehicleChange("car_model", e.target.value)}
                      className={`w-full bg-black/40 border-2 rounded-2xl px-5 py-3.5 text-white font-bold transition-all outline-none ${!isEditing
                        ? "border-transparent text-gray-500 cursor-not-allowed"
                        : "border-white/5 focus:border-red-600 focus:ring-4 focus:ring-red-600/10"
                        }`}
                    />
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Year</label>
                    <input
                      type="text"
                      placeholder="e.g. 2022"
                      value={vehicleData.car_year}
                      disabled={!isEditing}
                      onChange={(e) => handleVehicleChange("car_year", e.target.value)}
                      className={`w-full bg-black/40 border-2 rounded-2xl px-5 py-3.5 text-white font-bold transition-all outline-none ${!isEditing
                        ? "border-transparent text-gray-500 cursor-not-allowed"
                        : "border-white/5 focus:border-red-600 focus:ring-4 focus:ring-red-600/10"
                        }`}
                    />
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Color</label>
                    <input
                      type="text"
                      placeholder="e.g. Pearl White"
                      value={vehicleData.car_color}
                      disabled={!isEditing}
                      onChange={(e) => handleVehicleChange("car_color", e.target.value)}
                      className={`w-full bg-black/40 border-2 rounded-2xl px-5 py-3.5 text-white font-bold transition-all outline-none ${!isEditing
                        ? "border-transparent text-gray-500 cursor-not-allowed"
                        : "border-white/5 focus:border-red-600 focus:ring-4 focus:ring-red-600/10"
                        }`}
                    />
                  </div>

                  <div className="space-y-2 text-left sm:col-span-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Plate Number</label>
                    <input
                      type="text"
                      placeholder="e.g. ABC 1234"
                      value={vehicleData.car_plate}
                      disabled={!isEditing}
                      onChange={(e) => handleVehicleChange("car_plate", e.target.value)}
                      className={`w-full bg-black/40 border-2 rounded-2xl px-5 py-3.5 text-white font-bold transition-all outline-none ${!isEditing
                        ? "border-transparent text-gray-500 cursor-not-allowed"
                        : "border-white/5 focus:border-red-600 focus:ring-4 focus:ring-red-600/10"
                        }`}
                    />
                  </div>
                </div>
              </div>

              {/* Security Section */}
              <div className="bg-gray-900/40 border border-white/5 rounded-[2.5rem] p-10 backdrop-blur-xl shadow-2xl overflow-hidden group">
                <div className="flex items-center gap-5 mb-10">
                  <div className="p-4 bg-gray-800 text-white rounded-[1.25rem] border border-white/5 shadow-xl group-hover:bg-red-600 transition-colors duration-500">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-tight">Security & Access</h3>
                </div>

                <div className="bg-white/5 rounded-[2rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 border border-white/5 relative">
                  <div className="text-center md:text-left">
                    <h5 className="text-white font-black text-xl">Change Password</h5>
                    <p className="text-gray-500 text-sm font-medium mt-2 max-w-sm">Keep your account secure with a strong password.</p>
                  </div>
                  <button
                    onClick={() => setShowPassModal(true)}
                    className="px-10 py-4.5 bg-white text-black hover:bg-red-600 hover:text-white rounded-2xl font-black transition-all shadow-xl active:scale-95 text-sm uppercase tracking-widest whitespace-nowrap"
                  >
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}

export default CustomerProfile;
