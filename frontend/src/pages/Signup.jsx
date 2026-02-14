import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import swal from 'sweetalert2';
import logo from "../assets/otokwikklogo.png"

function SignUpPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    countryCode: '+63', // Default to Philippines
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'customer', // Default role for new signups
    agreeToTerms: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: '', color: '' });

  // Common country codes
  const countryCodes = [
    { code: '+63', country: 'PH', flag: '🇵🇭' },
    { code: '+1', country: 'US', flag: '🇺🇸' },
    { code: '+44', country: 'GB', flag: '🇬🇧' },
    { code: '+81', country: 'JP', flag: '🇯🇵' },
    { code: '+82', country: 'KR', flag: '🇰🇷' },
    { code: '+86', country: 'CN', flag: '🇨🇳' },
    { code: '+65', country: 'SG', flag: '🇸🇬' },
    { code: '+60', country: 'MY', flag: '🇲🇾' },
    { code: '+66', country: 'TH', flag: '🇹🇭' },
    { code: '+84', country: 'VN', flag: '🇻🇳' },
    { code: '+61', country: 'AU', flag: '🇦🇺' },
    { code: '+64', country: 'NZ', flag: '🇳🇿' },
  ];

  // Format phone number with spaces (XXX XXX XXXX)
  const formatPhoneNumber = (value) => {
    // Remove all non-digit characters
    const phoneNumber = value.replace(/\D/g, '');
    
    // Format with spaces: XXX XXX XXXX
    if (phoneNumber.length <= 3) {
      return phoneNumber;
    } else if (phoneNumber.length <= 6) {
      return `${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3)}`;
    } else {
      return `${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3, 6)} ${phoneNumber.slice(6, 10)}`;
    }
  };

  // Calculate password strength
  const calculatePasswordStrength = (password) => {
    let score = 0;
    
    if (!password) {
      return { score: 0, text: '', color: '' };
    }

    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;

    // Character variety checks
    if (/[a-z]/.test(password)) score++; // lowercase
    if (/[A-Z]/.test(password)) score++; // uppercase
    if (/\d/.test(password)) score++;    // numbers
    if (/[^a-zA-Z\d]/.test(password)) score++; // special characters

    // Determine strength
    if (score <= 2) {
      return { score: 1, text: 'Weak', color: 'bg-red-600' };
    } else if (score <= 4) {
      return { score: 2, text: 'Medium', color: 'bg-yellow-500' };
    } else {
      return { score: 3, text: 'Strong', color: 'bg-green-600' };
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Special handling for phone number
    if (name === 'phone') {
      const formattedPhone = formatPhoneNumber(value);
      setFormData(prev => ({
        ...prev,
        phone: formattedPhone
      }));
      
      // Clear error when user starts typing
      if (errors.phone) {
        setErrors(prev => ({ ...prev, phone: '' }));
      }
      return;
    }

    // Special handling for password to update strength meter
    if (name === 'password') {
      const strength = calculatePasswordStrength(value);
      setPasswordStrength(strength);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate first name - only letters and spaces
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.firstName)) {
      newErrors.firstName = 'First name can only contain letters and spaces';
    } else if (/\d/.test(formData.firstName)) {
      newErrors.firstName = 'First name cannot contain numbers';
    }

    // Validate last name - only letters and spaces
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.lastName)) {
      newErrors.lastName = 'Last name can only contain letters and spaces';
    } else if (/\d/.test(formData.lastName)) {
      newErrors.lastName = 'Last name cannot contain numbers';
    }

    // Validate email - must end with @domain.extension
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email must be in format: example@domain.com';
    } else if (!formData.email.includes('@')) {
      newErrors.email = 'Email must contain @ symbol';
    } else {
      // Check if email has valid domain after @
      const emailParts = formData.email.split('@');
      if (emailParts.length !== 2 || !emailParts[1].includes('.')) {
        newErrors.email = 'Email must end with @domain.com format';
      }
    }

    // Validate phone format (optional but if provided, should be valid)
    if (formData.phone) {
      // Remove spaces for validation
      const phoneDigits = formData.phone.replace(/\s/g, '');
      if (!/^\d+$/.test(phoneDigits)) {
        newErrors.phone = 'Phone number can only contain digits';
      } else if (phoneDigits.length !== 10) {
        newErrors.phone = 'Phone number must be exactly 10 digits';
      }
    }

    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    } else if (passwordStrength.score < 2) {
      // PREVENT WEAK PASSWORDS - Must be at least "Medium" strength
      newErrors.password = 'Password is too weak. Please create a stronger password';
    }

    // Validate confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Validate terms agreement
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the Terms and Conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Remove spaces from phone number before sending
    const cleanedPhone = formData.phone ? formData.phone.replace(/\s/g, '') : '';

    const userData = {
      email: formData.email,
      password: formData.password, // will be hashed on backend
      first_name: formData.firstName,
      last_name: formData.lastName,
      phone: cleanedPhone ? `${formData.countryCode}${cleanedPhone}` : null,
      role: formData.role
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/signup/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();
      console.log("Signup response:", data);

      if (response.ok) {
      // SweetAlert for success
      swal.fire({
        title: data.title || "Account Created!",
        text: data.message || "Your customer account has been successfully created.",
        icon: 'success',
        background: 'linear-gradient(to bottom right, #1f2937, #111827)', // matches your bg-gradient-to-br from-gray-800 to-gray-900
        color: '#fff',
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'Great!'
      });

      // Optionally, reset the form or redirect
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        countryCode: '+63',
        phone: '',
        password: '',
        confirmPassword: '',
        role: 'customer',
        agreeToTerms: false
      });
      setErrors({});
      setPasswordStrength({ score: 0, text: '', color: '' });
      } else {
      // SweetAlert for failure
      swal.fire({
        title: data.title || "Signup Failed",
        text: JSON.stringify(data.errors || data.detail),
        icon: 'error',
        background: 'linear-gradient(to bottom right, #1f2937, #111827)',
        color: '#fff',
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'Try Again'
      });
    }
    } catch (error) {
      console.error("Error during signup:", error);
      swal.fire({
        title: "Error",
        text: "Something went wrong. Please try again.",
        icon: 'error',
        background: 'linear-gradient(to bottom right, #1f2937, #111827)',
        color: '#fff',
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'Ok'
      });
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Main Container */}
      <div className="w-full max-w-6xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding */}
          <div className="hidden lg:block">
            <div className="space-y-8">
              {/* Logo */}
              <div>
                <img
                  src={logo}
                  alt="Otokwikk logo"
                  className="h-16 md:h-20 object-contain"
                />
              </div>

              <div>
                <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
                  Join Otokwikk<br />Today
                </h1>
                <p className="text-xl text-gray-400 leading-relaxed mb-8">
                  Experience premium auto detailing services across Metro Manila. Create your account and get started.
                </p>

                {/* Features List */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <p className="text-gray-300 text-lg">Easy online booking</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <p className="text-gray-300 text-lg">Track your service history</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <p className="text-gray-300 text-lg">Exclusive member discounts</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Sign Up Form */}
          <div className="w-full">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 md:p-12 border border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
              {/* Mobile Logo */}
              <div className="lg:hidden mb-8 text-center">
                <div className="bg-white rounded-full px-8 py-3 inline-block shadow-2xl">
                  <span className="text-3xl font-black tracking-tight">
                    <span className="text-red-600">oto</span>
                    <span className="text-black">kwikk</span>
                  </span>
                </div>
              </div>

              <div className="mb-8">
                <div className="mb-4">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Landing Page
                  </Link>
                </div>

                <h2 className="text-3xl md:text-4xl font-black text-white mb-2">Create Account</h2>
                <p className="text-gray-400">Fill in your details to get started</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
                {/* Name Fields */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-semibold text-gray-300 mb-2">
                      First Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      autoComplete="off"
                      className={`w-full px-4 py-3 bg-gray-900 border ${errors.firstName ? 'border-red-600' : 'border-gray-700'} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/50 transition-all duration-300`}
                      placeholder="John"
                    />
                    {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-semibold text-gray-300 mb-2">
                      Last Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      autoComplete="off"
                      className={`w-full px-4 py-3 bg-gray-900 border ${errors.lastName ? 'border-red-600' : 'border-gray-700'} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/50 transition-all duration-300`}
                      placeholder="Doe"
                    />
                    {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-300 mb-2">
                    Email Address <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="off"
                    className={`w-full px-4 py-3 bg-gray-900 border ${errors.email ? 'border-red-600' : 'border-gray-700'} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/50 transition-all duration-300`}
                    placeholder="john.doe@example.com"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                {/* Phone with Country Code Dropdown */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <div className="flex gap-2">
                    {/* Country Code Dropdown */}
                    <select
                      name="countryCode"
                      value={formData.countryCode}
                      onChange={handleChange}
                      className="px-3 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/50 transition-all duration-300 cursor-pointer"
                      style={{ width: '110px' }}
                    >
                      {countryCodes.map((item) => (
                        <option key={item.code} value={item.code}>
                          {item.flag} {item.code}
                        </option>
                      ))}
                    </select>

                    {/* Phone Number Input */}
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      autoComplete="off"
                      className={`flex-1 px-4 py-3 bg-gray-900 border ${errors.phone ? 'border-red-600' : 'border-gray-700'} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/50 transition-all duration-300`}
                      placeholder="XXX XXX XXXX"
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-300 mb-2">
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
                      className={`w-full px-4 py-3 bg-gray-900 border ${errors.password ? 'border-red-600' : 'border-gray-700'} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/50 transition-all duration-300 pr-12`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                  
                  {/* Password Strength Meter */}
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                            style={{ width: `${(passwordStrength.score / 3) * 100}%` }}
                          />
                        </div>
                        <span className={`text-xs font-semibold ${
                          passwordStrength.score === 1 ? 'text-red-600' : 
                          passwordStrength.score === 2 ? 'text-yellow-500' : 
                          'text-green-600'
                        }`}>
                          {passwordStrength.text}
                        </span>
                      </div>
                      <p className="text-gray-500 text-xs">Use 8+ characters with uppercase, lowercase, numbers & symbols</p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-300 mb-2">
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
                      className={`w-full px-4 py-3 bg-gray-900 border ${errors.confirmPassword ? 'border-red-600' : 'border-gray-700'} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/50 transition-all duration-300 pr-12`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>

                {/* Terms and Conditions */}
                <div>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="agreeToTerms"
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onChange={handleChange}
                      className={`w-5 h-5 mt-0.5 bg-gray-900 border-gray-700 rounded text-red-600 focus:ring-red-600 focus:ring-2 cursor-pointer ${errors.agreeToTerms ? 'border-red-600' : ''}`}
                    />
                    <label htmlFor="agreeToTerms" className="text-sm text-gray-400 cursor-pointer">
                      I agree to the{' '}
                      <a href="#" className="text-red-600 hover:text-red-500 font-semibold">
                        Terms and Conditions
                      </a>
                      {' '}and{' '}
                      <a href="#" className="text-red-600 hover:text-red-500 font-semibold">
                        Privacy Policy
                      </a>
                    </label>
                  </div>
                  {errors.agreeToTerms && <p className="text-red-500 text-sm mt-1">{errors.agreeToTerms}</p>}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-red-600/50"
                >
                  Create Account
                </button>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-gray-800 text-gray-400">Or continue with</span>
                  </div>
                </div>

                {/* Social Sign Up */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    className="flex items-center justify-center gap-3 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white hover:bg-gray-800 hover:border-gray-600 transition-all duration-300"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span className="font-semibold">Facebook</span>
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-center gap-3 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white hover:bg-gray-800 hover:border-gray-600 transition-all duration-300"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span className="font-semibold">Google</span>
                  </button>
                </div>

                {/* Sign In Link */}
                 <div className="text-center mt-6">
                  <p className="text-gray-400">
                    Already have an account?{' '}
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

      {/* CSS for custom checkbox and scrollbar */}
      <style>{`
        input[type="checkbox"]:checked {
          background-color: #dc2626;
          border-color: #dc2626;
        }
        
        /* Custom scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #dc2626;
        }
      `}</style>
    </div>
  );
}

export default SignUpPage;