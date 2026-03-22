import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import swal from "sweetalert2";
import logo from "../assets/otokwikklogo.png";

function SignUpPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    suffix: "",
    email: "",
    countryCode: "+63",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "customer",
    agreeToTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    text: "",
    color: "",
  });

  const countryCodes = [
    { code: "+63", country: "PH", flag: "🇵🇭" },
    { code: "+1", country: "US", flag: "🇺🇸" },
    { code: "+44", country: "GB", flag: "🇬🇧" },
    { code: "+81", country: "JP", flag: "🇯🇵" },
    { code: "+82", country: "KR", flag: "🇰🇷" },
    { code: "+86", country: "CN", flag: "🇨🇳" },
    { code: "+65", country: "SG", flag: "🇸🇬" },
    { code: "+60", country: "MY", flag: "🇲🇾" },
    { code: "+66", country: "TH", flag: "🇹🇭" },
    { code: "+84", country: "VN", flag: "🇻🇳" },
    { code: "+61", country: "AU", flag: "🇦🇺" },
    { code: "+64", country: "NZ", flag: "🇳🇿" },
  ];

  const formatPhoneNumber = (value) => {
    const phoneNumber = value.replace(/\D/g, "");
    if (phoneNumber.length <= 3) return phoneNumber;
    else if (phoneNumber.length <= 6)
      return `${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3)}`;
    else
      return `${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3, 6)} ${phoneNumber.slice(6, 10)}`;
  };

  const calculatePasswordStrength = (password) => {
    let score = 0;
    if (!password) return { score: 0, text: "", color: "" };
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z\d]/.test(password)) score++;
    if (score <= 2) return { score: 1, text: "Weak", color: "bg-red-600" };
    else if (score <= 4)
      return { score: 2, text: "Medium", color: "bg-yellow-500" };
    else return { score: 3, text: "Strong", color: "bg-green-600" };
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "phone") {
      const formattedPhone = formatPhoneNumber(value);
      setFormData((prev) => ({ ...prev, phone: formattedPhone }));
      if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" }));
      return;
    }
    if (name === "password") {
      const strength = calculatePasswordStrength(value);
      setPasswordStrength(strength);
    }
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.firstName.trim())
        newErrors.firstName = "First name is required";
      else if (!/^[a-zA-Z\s]+$/.test(formData.firstName))
        newErrors.firstName = "First name can only contain letters and spaces";
      if (!formData.lastName.trim())
        newErrors.lastName = "Last name is required";
      else if (!/^[a-zA-Z\s]+$/.test(formData.lastName))
        newErrors.lastName = "Last name can only contain letters and spaces";
    } else if (step === 2) {
      if (!formData.email.trim()) newErrors.email = "Email address is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
        newErrors.email = "Email must be in format: example@domain.com";
      if (formData.phone) {
        const phoneDigits = formData.phone.replace(/\s/g, "");
        if (!/^\d+$/.test(phoneDigits))
          newErrors.phone = "Phone number can only contain digits";
        else if (phoneDigits.length !== 10)
          newErrors.phone = "Phone number must be exactly 10 digits";
      }
    } else if (step === 3) {
      if (!formData.password) newErrors.password = "Password is required";
      else if (formData.password.length < 8)
        newErrors.password = "Password must be at least 8 characters";
      else if (!/(?=.*[a-z])/.test(formData.password))
        newErrors.password =
          "Password must contain at least one lowercase letter";
      else if (!/(?=.*[A-Z])/.test(formData.password))
        newErrors.password =
          "Password must contain at least one uppercase letter";
      else if (!/(?=.*\d)/.test(formData.password))
        newErrors.password = "Password must contain at least one number";
      else if (passwordStrength.score < 2)
        newErrors.password =
          "Password is too weak. Please create a stronger password";
      if (!formData.confirmPassword)
        newErrors.confirmPassword = "Please confirm your password";
      else if (formData.password !== formData.confirmPassword)
        newErrors.confirmPassword = "Passwords do not match";
      if (!formData.agreeToTerms)
        newErrors.agreeToTerms = "You must agree to the Terms and Conditions";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
      setErrors({});
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => prev - 1);
    setErrors({});
  };

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(3)) return;
    const cleanedPhone = formData.phone
      ? formData.phone.replace(/\s/g, "")
      : "";
    const userData = {
      email: formData.email,
      password: formData.password,
      first_name: formData.firstName,
      last_name: formData.lastName,
      suffix: formData.suffix,
      phone: cleanedPhone ? `${formData.countryCode}${cleanedPhone}` : null,
      role: formData.role,
    };
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/signup/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        },
      );
      const data = await response.json();
      if (response.ok) {
        swal.fire({
          title: data.title || "Account Created!",
          text: data.message || "Please check your email to verify your account before logging in.",
          icon: "success",
          background: "linear-gradient(to bottom right, #1f2937, #111827)",
          color: "#fff",
          confirmButtonColor: "#dc2626",
          confirmButtonText: "Got it!",
        });
        setFormData({
          firstName: "",
          lastName: "",
          suffix: "",
          email: "",
          countryCode: "+63",
          phone: "",
          password: "",
          confirmPassword: "",
          role: "customer",
          agreeToTerms: false,
        });
        setCurrentStep(1);
        setErrors({});
        setPasswordStrength({ score: 0, text: "", color: "" });
      } else {
        swal.fire({
          title: data.title || "Signup Failed",
          text: JSON.stringify(data.errors || data.detail),
          icon: "error",
          background: "linear-gradient(to bottom right, #1f2937, #111827)",
          color: "#fff",
          confirmButtonColor: "#dc2626",
          confirmButtonText: "Try Again",
        });
      }
    } catch (error) {
      swal.fire({
        title: "Error",
        text: "Something went wrong. Please try again.",
        icon: "error",
        background: "linear-gradient(to bottom right, #1f2937, #111827)",
        color: "#fff",
        confirmButtonColor: "#dc2626",
        confirmButtonText: "Ok",
      });
    }
  };

  const eyeOff = (
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
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
      />
    </svg>
  );
  const eyeOn = (
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
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );

  const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />
        <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-red-950/20 w-full max-w-2xl rounded-[32px] border border-white/10 shadow-3xl relative z-10 overflow-hidden flex flex-col max-h-[85vh]">
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/20">
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{title}</h3>
            <button onClick={onClose} className="w-10 h-10 bg-white/5 hover:bg-red-600 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="p-8 overflow-y-auto custom-scrollbar text-gray-400 space-y-6 text-lg leading-relaxed">
            {children}
          </div>
          <div className="p-8 border-t border-white/5 bg-black/20 text-center">
            <button onClick={onClose} className="px-10 py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl transition-all tracking-widest uppercase text-sm">Close</button>
          </div>
        </div>
      </div>
    );
  };

  const TermsContent = () => (
    <div className="space-y-6">
      <section>
        <h4 className="text-white font-bold mb-2 uppercase tracking-wide">1. SERVICE DESCRIPTION</h4>
        <p>Otokwikk provides premium automotive detailing services, including exterior restoration, interior sterilization, and various protection packages. By booking a service, you agree to our quality standards and operational procedures.</p>
      </section>
      <section>
        <h4 className="text-white font-bold mb-2 uppercase tracking-wide">2. BOOKING & CANCELLATIONS</h4>
        <p>Reservations must be made at least 24 hours in advance. Cancellations made less than 12 hours before the scheduled appointment may be subject to a rescheduling fee at the branch's discretion.</p>
      </section>
      <section>
        <h4 className="text-white font-bold mb-2 uppercase tracking-wide">3. CUSTOMER RESPONSIBILITIES</h4>
        <p>Customers must remove all personal belongings from their vehicles before handing them over to Otokwikk staff. Otokwikk is not liable for any lost or damaged personal items left inside the vehicle.</p>
      </section>
      <section>
        <h4 className="text-white font-bold mb-2 uppercase tracking-wide">4. LIABILITY</h4>
        <p>While we use aerospace-grade products and surgical precision, Otokwikk is not responsible for pre-existing paint defects, clear coat failure, or structural damage that may become prominent during the restoration process.</p>
      </section>
    </div>
  );

  const PrivacyContent = () => (
    <div className="space-y-6">
      <section>
        <h4 className="text-white font-bold mb-2 uppercase tracking-wide">1. DATA COLLECTION</h4>
        <p>We collect personal information such as name, email, and phone number solely for account management, service scheduling, and quality assurance purposes.</p>
      </section>
      <section>
        <h4 className="text-white font-bold mb-2 uppercase tracking-wide">2. USAGE & SECURITY</h4>
        <p>Your data is stored securely and is never shared with third parties for marketing purposes. We use industry-standard encryption to protect your account details.</p>
      </section>
      <section>
        <h4 className="text-white font-bold mb-2 uppercase tracking-wide">3. SERVICE TRACKING</h4>
        <p>We maintain a history of your detailing services to provide personalized recommendations and exclusive discounts. You may request your data profile at any time.</p>
      </section>
    </div>
  );

  return (
    <div className="h-screen bg-black flex items-center justify-center px-6 relative overflow-hidden">
      {/* Top-left back arrow */}
      <Link
        to="/"
        className="fixed top-5 left-5 z-50 w-11 h-11 bg-white/5 hover:bg-red-600 border border-white/10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300 shadow-lg backdrop-blur-sm"
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
            strokeWidth={2.5}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </Link>

      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Main Container */}
      <div className="w-full max-w-6xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          {/* Left Side - Branding */}
          <div className="hidden lg:block">
            <div className="space-y-8">
              <img
                src={logo}
                alt="Otokwikk logo"
                className="h-20 object-contain"
              />
              <div>
                <h1 className="text-6xl font-black text-white mb-5 leading-tight">
                  Join Otokwikk
                  <br />
                  Today
                </h1>
                <p className="text-xl text-gray-400 leading-relaxed mb-8">
                  Experience premium auto detailing services across Metro
                  Manila. Create your account and get started.
                </p>
                <div className="space-y-5">
                  {[
                    "Easy online booking",
                    "Track your service history",
                    "Exclusive member discounts",
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-6 h-6 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                      </div>
                      <p className="text-gray-300 text-lg">{feature}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Sign Up Form */}
          <div className="w-full">
            <div className="bg-gradient-to-br from-gray-900 to-red-950/20 rounded-3xl p-10 border border-white/5 shadow-2xl">
              {/* Mobile Logo */}
              <div className="lg:hidden mb-6 text-center">
                <img
                  src={logo}
                  alt="Otokwikk logo"
                  className="h-12 object-contain mx-auto"
                />
              </div>

              <div className="mb-6">
                <h2 className="text-4xl font-black text-white mb-1">
                  Create Account
                </h2>
                <p className="text-gray-400 text-lg">
                  {currentStep === 1 && "Step 1: Personal Information"}
                  {currentStep === 2 && "Step 2: Contact Information"}
                  {currentStep === 3 && "Step 3: Account Security"}
                </p>
              </div>

              {/* Step Indicators */}
              <div className="flex items-center mb-7">
                <div className="flex items-center w-full">
                  {[1, 2, 3].map((step, idx) => (
                    <React.Fragment key={step}>
                      <div
                        className={`flex items-center ${currentStep >= step ? "text-red-600" : "text-gray-500"}`}
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base border-2 
                          ${currentStep >= step ? "border-red-600 bg-red-600 text-white" : "border-gray-600 text-gray-500"}`}
                        >
                          {step}
                        </div>
                        <span className="ml-2 text-base font-medium hidden sm:block">
                          {step === 1
                            ? "Personal"
                            : step === 2
                              ? "Contact"
                              : "Security"}
                        </span>
                      </div>
                      {idx < 2 && (
                        <div
                          className={`flex-1 h-1 mx-4 ${currentStep > step ? "bg-red-600" : "bg-gray-700"}`}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
                autoComplete="off"
              >
                {/* Step 1: Personal Information */}
                {currentStep === 1 && (
                  <div className="space-y-5">
                    <div>
                      <label
                        htmlFor="firstName"
                        className="block text-base font-semibold text-gray-300 mb-2"
                      >
                        First Name <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        autoComplete="off"
                        className={`w-full px-4 py-3.5 bg-gray-900 border ${errors.firstName ? "border-red-600" : "border-gray-700"} rounded-xl text-white text-base placeholder-gray-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/50 transition-all duration-300`}
                        placeholder="John"
                      />
                      {errors.firstName && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.firstName}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="lastName"
                        className="block text-base font-semibold text-gray-300 mb-2"
                      >
                        Last Name <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        autoComplete="off"
                        className={`w-full px-4 py-3.5 bg-gray-900 border ${errors.lastName ? "border-red-600" : "border-gray-700"} rounded-xl text-white text-base placeholder-gray-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/50 transition-all duration-300`}
                        placeholder="Doe"
                      />
                      {errors.lastName && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.lastName}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="suffix"
                        className="block text-base font-semibold text-gray-300 mb-2"
                      >
                        Suffix (Optional)
                      </label>
                      <select
                        id="suffix"
                        name="suffix"
                        value={formData.suffix}
                        onChange={handleChange}
                        className="w-full px-4 py-3.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-base focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/50 transition-all duration-300"
                      >
                        <option value="">Select suffix (optional)</option>
                        <option value="Jr.">Jr.</option>
                        <option value="Sr.">Sr.</option>
                        <option value="II">II</option>
                        <option value="III">III</option>
                        <option value="IV">IV</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Step 2: Contact Information */}
                {currentStep === 2 && (
                  <div className="space-y-5">
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-base font-semibold text-gray-300 mb-2"
                      >
                        Email Address <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        autoComplete="off"
                        className={`w-full px-4 py-3.5 bg-gray-900 border ${errors.email ? "border-red-600" : "border-gray-700"} rounded-xl text-white text-base placeholder-gray-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/50 transition-all duration-300`}
                        placeholder="john.doe@example.com"
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.email}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-base font-semibold text-gray-300 mb-2"
                      >
                        Phone Number
                      </label>
                      <div className="flex gap-3">
                        <select
                          name="countryCode"
                          value={formData.countryCode}
                          onChange={handleChange}
                          className="px-3 py-3.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-base focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/50 transition-all duration-300 cursor-pointer"
                          style={{ width: "120px" }}
                        >
                          {countryCodes.map((item) => (
                            <option key={item.code} value={item.code}>
                              {item.flag} {item.code}
                            </option>
                          ))}
                        </select>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          autoComplete="off"
                          className={`flex-1 px-4 py-3.5 bg-gray-900 border ${errors.phone ? "border-red-600" : "border-gray-700"} rounded-xl text-white text-base placeholder-gray-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/50 transition-all duration-300`}
                          placeholder="XXX XXX XXXX"
                        />
                      </div>
                      {errors.phone && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.phone}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3: Account Security */}
                {currentStep === 3 && (
                  <div className="space-y-5">
                    <div>
                      <label
                        htmlFor="password"
                        className="block text-base font-semibold text-gray-300 mb-2"
                      >
                        Password <span className="text-red-600">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          id="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          autoComplete="new-password"
                          className={`w-full px-4 py-3.5 bg-gray-900 border ${errors.password ? "border-red-600" : "border-gray-700"} rounded-xl text-white text-base placeholder-gray-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/50 transition-all duration-300 pr-12`}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        >
                          {showPassword ? eyeOff : eyeOn}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.password}
                        </p>
                      )}
                      {formData.password && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                                style={{
                                  width: `${(passwordStrength.score / 3) * 100}%`,
                                }}
                              />
                            </div>
                            <span
                              className={`text-sm font-semibold ${passwordStrength.score === 1 ? "text-red-600" : passwordStrength.score === 2 ? "text-yellow-500" : "text-green-600"}`}
                            >
                              {passwordStrength.text}
                            </span>
                          </div>
                          <p className="text-gray-500 text-sm">
                            Use 8+ characters with uppercase, lowercase, numbers
                            & symbols
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="block text-base font-semibold text-gray-300 mb-2"
                      >
                        Confirm Password <span className="text-red-600">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          id="confirmPassword"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          autoComplete="new-password"
                          className={`w-full px-4 py-3.5 bg-gray-900 border ${errors.confirmPassword ? "border-red-600" : "border-gray-700"} rounded-xl text-white text-base placeholder-gray-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/50 transition-all duration-300 pr-12`}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        >
                          {showConfirmPassword ? eyeOff : eyeOn}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="agreeToTerms"
                          name="agreeToTerms"
                          checked={formData.agreeToTerms}
                          onChange={handleChange}
                          className={`w-5 h-5 mt-0.5 bg-gray-900 border-gray-700 rounded text-red-600 focus:ring-red-600 focus:ring-2 cursor-pointer ${errors.agreeToTerms ? "border-red-600" : ""}`}
                        />
                        <label
                          htmlFor="agreeToTerms"
                          className="text-base text-gray-400 cursor-pointer"
                        >
                          I agree to the{" "}
                          <button
                            type="button"
                            onClick={() => setShowTermsModal(true)}
                            className="text-red-600 hover:text-red-500 font-semibold"
                          >
                            Terms and Conditions
                          </button>{" "}
                          and{" "}
                          <button
                            type="button"
                            onClick={() => setShowPrivacyModal(true)}
                            className="text-red-600 hover:text-red-500 font-semibold"
                          >
                            Privacy Policy
                          </button>
                        </label>
                      </div>
                      {errors.agreeToTerms && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.agreeToTerms}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex gap-4 pt-2">
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={handlePrevious}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-xl transition-all duration-300 text-lg"
                    >
                      Previous
                    </button>
                  )}
                  {currentStep < 3 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-red-600/50 text-lg"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-red-600/50 text-lg"
                    >
                      Create Account
                    </button>
                  )}
                </div>

                {/* Sign In Link */}
                <div className="text-center">
                  <p className="text-gray-400 text-lg">
                    Already have an account?{" "}
                    <Link
                      to="/signin"
                      className="text-red-600 hover:text-red-500 font-semibold"
                    >
                      Sign In
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} title="Terms and Conditions">
        <TermsContent />
      </Modal>

      <Modal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} title="Privacy Policy">
        <PrivacyContent />
      </Modal>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(220, 38, 38, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(220, 38, 38, 0.5);
        }
        input[type="checkbox"]:checked {
          background-color: #dc2626;
          border-color: #dc2626;
        }
      `}</style>
    </div>
  );
}

export default SignUpPage;
