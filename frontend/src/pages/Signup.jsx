import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import swal from "sweetalert2";
import logo from "../assets/otokwikklogo.png";
import { API_BASE } from "../hooks/useAuth.js";
import { GoogleLogin } from "@react-oauth/google";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const DARK_SWAL = {
  background: "linear-gradient(to bottom right, #1f2937, #111827)",
  color: "#fff",
  confirmButtonColor: "#dc2626",
};

const ROLE_ROUTES = {
  admin: "/admin/dashboard",
  business_owner: "/branch-owner/dashboard",
  branch_manager: "/manager/dashboard",
  inventory: "/inventory/dashboard",
  inventory_manager: "/inventory-manager/dashboard",
  staff: "/staff/dashboard",
  employee: "/employee/dashboard",
  customer: "/dashboard",
};

const storeSession = (tokens, user, remember) => {
  const store = remember ? localStorage : sessionStorage;
  store.setItem("access_token", tokens.access);
  store.setItem("refresh_token", tokens.refresh);
  store.setItem("user", JSON.stringify(user));
};

// Custom Input Component for Birth Date with masking logic
const BirthdayInput = React.forwardRef(({ value, onClick, onChange, placeholder, hasError }, ref) => {
  const handleInputChange = (e) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 8) val = val.substring(0, 8);

    let masked = "";
    if (val.length > 0) {
      let mm = val.substring(0, 2);
      if (mm.length === 1 && parseInt(mm) > 1) {
        mm = "0" + mm;
        val = mm + val.substring(1);
      }
      if (mm.length === 2 && parseInt(mm) > 12) mm = "12";
      if (mm.length === 2 && parseInt(mm) === 0) mm = "01";
      masked = mm;

      if (val.length > 2) {
        let dd = val.substring(2, 4);
        if (dd.length === 1 && parseInt(dd) > 3) {
          dd = "0" + dd;
          val = val.substring(0, 2) + dd + val.substring(3);
        }
        if (dd.length === 2 && parseInt(dd) > 31) dd = "31";
        if (dd.length === 2 && parseInt(dd) === 0) dd = "01";
        masked += "/" + dd;

        if (val.length > 4) {
          masked += "/" + val.substring(4, 8);
        }
      }
    }
    e.target.value = masked;
    onChange(e);
  };

  return (
    <div className="relative w-full group">
      <input
        ref={ref}
        value={value}
        onClick={onClick}
        placeholder={placeholder || "mm/dd/yyyy"}
        className={`w-full px-4 py-3.5 bg-gray-900 border ${hasError ? "border-red-600 focus:ring-red-600/50" : "border-gray-700 focus:border-red-600 focus:ring-red-600/50"} rounded-xl text-white text-base placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-300 pr-12 cursor-pointer group-hover:border-gray-600`}
        onChange={handleInputChange}
        autoComplete="off"
      />
      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-colors group-hover:text-red-500">
        <svg className="w-5 h-5 transition-transform duration-300 transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    </div>
  );
});

function SignUpPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    suffix: "",
    birthDate: "",
    email: "",
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
  const [isGoogleSignup, setIsGoogleSignup] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    text: "",
    color: "",
  });

  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [hasReadPrivacy, setHasReadPrivacy] = useState(false);
  const [landingPosts, setLandingPosts] = useState([]);
  const [policyLoading, setPolicyLoading] = useState(true);
  const [policyError, setPolicyError] = useState("");

  // Auto-check agreement when both documents are read
  useEffect(() => {
    if (hasReadTerms && hasReadPrivacy) {
      setFormData(prev => ({ ...prev, agreeToTerms: true }));
      if (errors.agreeToTerms) {
        setErrors(prev => ({ ...prev, agreeToTerms: "" }));
      }
    }
  }, [hasReadTerms, hasReadPrivacy]);

  useEffect(() => {
    const loadLandingContent = async () => {
      setPolicyLoading(true);
      setPolicyError("");
      try {
        const response = await fetch(`${API_BASE}/api/landing-content/`);
        if (!response.ok) {
          throw new Error(`Failed to load landing content: ${response.status}`);
        }
        const data = await response.json();
        setLandingPosts(Array.isArray(data.posts) ? data.posts : []);
      } catch (error) {
        console.error(error);
        setPolicyError("Unable to load policy content.");
        setLandingPosts([]);
      } finally {
        setPolicyLoading(false);
      }
    };

    loadLandingContent();
  }, []);

  const location = useLocation();
  const navigate = useNavigate();

  // Real-time password and confirm password validation
  useEffect(() => {
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;

    setErrors((prev) => {
      const newErrors = { ...prev };

      // Password real-time validation
      if (password) {
        if (password.length < 8) {
          newErrors.password = "Password must be at least 8 characters";
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(password)) {
          newErrors.password = "Must include uppercase, lowercase, and number";
        } else {
          delete newErrors.password;
        }
      } else {
        delete newErrors.password;
      }

      // Match real-time validation
      if (confirmPassword) {
        if (confirmPassword !== password) {
          newErrors.confirmPassword = "Passwords do not match";
        } else {
          delete newErrors.confirmPassword;
        }
      } else {
        delete newErrors.confirmPassword;
      }

      // To avoid infinite loop, only return new object if it actually changed
      if (JSON.stringify(newErrors) !== JSON.stringify(prev)) {
        return newErrors;
      }
      return prev;
    });
  }, [formData.password, formData.confirmPassword]);

  const normalizeLocalPhone = (value) =>
    String(value || "")
      .replace(/\D/g, "")
      .replace(/^63/, "")
      .replace(/^0/, "")
      .slice(0, 10);

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

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await fetch(
        `${API_BASE}/google-login/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: credentialResponse.credential }),
        },
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Google Signup failed");
      }

      storeSession(data.tokens, data.user, false);
      const destination = ROLE_ROUTES[data.user.role] ?? "/";

      // If new Google user, notify about temporary password
      if (data.is_temporary) {
        await swal.fire({
          icon: "warning",
          title: "Temporary Password Sent",
          text: `Welcome, ${data.user.first_name}! We've sent a temporary password to your email (${data.user.email}). Please use it to set a secure permanent password in your account settings.`,
          showConfirmButton: true,
          confirmButtonText: "Go to Settings",
          showCancelButton: true,
          cancelButtonText: "Later",
          ...DARK_SWAL,
        }).then((result) => {
          if (result.isConfirmed) {
            navigate("/settings");
          } else {
            navigate(destination);
          }
        });
      } else {
        await swal.fire({
          icon: "success",
          title: "Login Successful",
          text: "Welcome back!",
          timer: 1500,
          timerProgressBar: true,
          showConfirmButton: false,
          ...DARK_SWAL,
        });
        navigate(destination);
      }
    } catch (err) {
      swal.fire({
        icon: "error",
        title: "Google Signup Failed",
        text: err.message,
        ...DARK_SWAL,
      });
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Real-time validation: block numbers and force Title Case for name fields
    if (name === "firstName" || name === "lastName") {
      const sanitizedValue = value.replace(/[^a-zA-Z\s]/g, "");
      // Convert to Title Case: first letter of each word caps, rest lower
      const titleCaseValue = sanitizedValue
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");

      setFormData((prev) => ({ ...prev, [name]: titleCaseValue }));
      if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
      return;
    }

    if (name === "phone") {
      const localPhone = normalizeLocalPhone(value);
      setFormData((prev) => ({ ...prev, phone: localPhone }));
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

    // Real-time email existence check
    if (name === "email" && value.includes("@") && value.includes(".")) {
      checkEmailExists(value);
    }
  };

  const checkEmailExists = async (email) => {
    try {
      const res = await fetch(`${API_BASE}/check-email/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.exists) {
        setErrors(prev => ({ ...prev, email: "This email is already registered" }));
      } else {
        setErrors(prev => {
          const { email, ...rest } = prev;
          return rest;
        });
      }
    } catch (err) {
      console.error("Email check error:", err);
    }
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
      if (!formData.birthDate) {
        newErrors.birthDate = "Birth date is required";
      } else {
        const birthDate = new Date(formData.birthDate);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        if (age < 17) newErrors.birthDate = "You must be at least 17 years old";
        else if (age > 100) newErrors.birthDate = "You must be 100 years old or younger";
      }
    } else if (step === 2) {
      if (!formData.email.trim()) newErrors.email = "Email address is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
        newErrors.email = "Email must be in format: example@domain.com";
      else if (errors.email === "This email is already registered")
        newErrors.email = "This email is already registered";
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

  const handleNext = async () => {
    // For step 2, do a final re-check of email existence to be 100% sure
    if (currentStep === 2 && formData.email) {
      try {
        const res = await fetch(`${API_BASE}/check-email/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email }),
        });
        const data = await res.json();
        if (data.exists) {
          setErrors(prev => ({ ...prev, email: "This email is already registered" }));
          return;
        }
      } catch (err) {
        console.error("Email check error:", err);
      }
    }

    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
      setErrors({});
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => prev - 1);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(3)) return;
    const cleanedPhone = formData.phone ? normalizeLocalPhone(formData.phone) : "";
    const userData = {
      email: formData.email,
      password: formData.password,
      first_name: formData.firstName,
      last_name: formData.lastName,
      suffix: formData.suffix,
      birth_date: formData.birthDate,
      phone: cleanedPhone ? `+63${cleanedPhone}` : null,
      role: formData.role,
    };
    try {
      const response = await fetch(
        `${API_BASE}/signup/`,
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
          birthDate: "",
          email: "",
          phone: "",
          password: "",
          confirmPassword: "",
          role: "customer",
          agreeToTerms: false,
        });
        setCurrentStep(1);
        setErrors({});
        setPasswordStrength({ score: 0, text: "", color: "" });
        setIsGoogleSignup(false);
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

  const Modal = ({ isOpen, onClose, title, children, onScrollEnd, hasRead }) => {
    const contentRef = useRef(null);

    useEffect(() => {
      if (!isOpen || !contentRef.current) return;
      const el = contentRef.current;
      if (el.scrollHeight <= el.clientHeight) {
        if (onScrollEnd) onScrollEnd();
      }
    }, [isOpen, children, onScrollEnd]);

    if (!isOpen) return null;

    const handleScroll = (e) => {
      const { scrollTop, scrollHeight, clientHeight } = e.target;
      // Use a small buffer (5px) for the scroll check
      if (scrollHeight - scrollTop <= clientHeight + 5) {
        if (onScrollEnd) onScrollEnd();
      }
    };

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
          <div
            ref={contentRef}
            className="p-8 overflow-y-auto custom-scrollbar text-gray-400 space-y-6 text-lg leading-relaxed"
            onScroll={handleScroll}
          >
            {children}
          </div>
          <div className="p-8 border-t border-white/5 bg-black/20 text-center flex flex-col items-center gap-4">
            {!hasRead && <p className="text-sm text-red-500 font-bold uppercase tracking-widest">Scroll to the bottom to acknowledge</p>}
            <button
              onClick={onClose}
              disabled={!hasRead}
              className={`px-10 py-4 font-black rounded-2xl transition-all tracking-widest uppercase text-sm ${hasRead ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
            >
              {hasRead ? "I Accept & Close" : "Please Read Entirely"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const getPostByKey = (key) =>
    landingPosts.find((post) => post.key === key);

  const renderPostBody = (post) => {
    if (!post) return null;
    return (
      <section key={post.key}>
        <h4 className="text-white font-bold mb-2 uppercase tracking-wide">
          {post.title}
        </h4>
        <p>{post.body}</p>
      </section>
    );
  };

  const TermsContent = () => {
    if (policyLoading) {
      return <div className="text-gray-400">Loading terms and conditions…</div>;
    }

    if (policyError) {
      return <div className="text-red-400">{policyError}</div>;
    }

    const termsPost = getPostByKey("terms");
    if (!termsPost) {
      return (
        <div className="text-gray-400">
          Terms and conditions content is not available at the moment.
        </div>
      );
    }

    return <div className="space-y-6">{renderPostBody(termsPost)}</div>;
  };

  const PrivacyAndCookieContent = () => {
    if (policyLoading) {
      return <div className="text-gray-400">Loading privacy and cookie policy…</div>;
    }

    if (policyError) {
      return <div className="text-red-400">{policyError}</div>;
    }

    const privacyPost = getPostByKey("privacy");
    const cookiePost = getPostByKey("cookie");

    if (!privacyPost && !cookiePost) {
      return (
        <div className="text-gray-400">
          Privacy and cookie policy content is not available at the moment.
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {privacyPost && renderPostBody(privacyPost)}
        {cookiePost && renderPostBody(cookiePost)}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black flex items-start lg:items-center justify-center px-3 sm:px-6 py-16 sm:py-10 relative overflow-x-hidden overflow-y-auto">
      {/* Top-left back arrow */}
      <Link
        to="/"
        className="fixed top-3 left-3 sm:top-5 sm:left-5 z-50 w-10 h-10 sm:w-11 sm:h-11 bg-white/5 hover:bg-red-600 border border-white/10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300 shadow-lg backdrop-blur-sm"
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
        <div className="absolute top-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-red-600/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-red-600/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Main Container */}
      <div className="w-full max-w-6xl relative z-10 mx-auto">
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-10 lg:gap-14 items-center">
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
            <div className="bg-gradient-to-br from-gray-900 to-red-950/20 rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 border border-white/5 shadow-2xl">
              {/* Mobile Logo */}
              <div className="lg:hidden mb-6 text-center">
                <img
                  src={logo}
                  alt="Otokwikk logo"
                  className="h-12 object-contain mx-auto"
                />
              </div>

              <div className="mb-5 sm:mb-6">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-1">
                  Create Account
                </h2>
                <p className="text-gray-400 text-sm sm:text-base lg:text-lg">
                  {currentStep === 1 && "Step 1: Personal Information"}
                  {currentStep === 2 && "Step 2: Contact Information"}
                  {currentStep === 3 && "Step 3: Account Security"}
                </p>
              </div>

              {/* Step Indicators */}
              <div className="flex items-center mb-6 sm:mb-7">
                <div className="flex items-center w-full">
                  {[1, 2, 3].map((step, idx) => (
                    <React.Fragment key={step}>
                      <div
                        className={`flex items-center ${currentStep >= step ? "text-red-600" : "text-gray-500"}`}
                      >
                        <div
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-base border-2 
                          ${currentStep >= step ? "border-red-600 bg-red-600 text-white" : "border-gray-600 text-gray-500"}`}
                        >
                          {step}
                        </div>
                        <span className="ml-2 text-sm sm:text-base font-medium hidden sm:block">
                          {step === 1
                            ? "Personal"
                            : step === 2
                              ? "Contact"
                              : "Security"}
                        </span>
                      </div>
                      {idx < 2 && (
                        <div
                          className={`flex-1 h-1 mx-2 sm:mx-4 ${currentStep > step ? "bg-red-600" : "bg-gray-700"}`}
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
                        autoCapitalize="none"
                        spellCheck="false"
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
                        autoCapitalize="none"
                        spellCheck="false"
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
                    <div>
                      <label
                        htmlFor="birthDate"
                        className="block text-base font-semibold text-gray-300 mb-2"
                      >
                        Birth Date <span className="text-red-600">*</span>
                      </label>
                      <DatePicker
                        selected={formData.birthDate ? new Date(formData.birthDate) : null}
                        onChange={(date) => {
                          if (date && !isNaN(date)) {
                            const dateStr = date.toISOString().split("T")[0];
                            setFormData(prev => ({ ...prev, birthDate: dateStr }));
                            if (errors.birthDate) setErrors(prev => ({ ...prev, birthDate: "" }));
                          } else {
                            setFormData(prev => ({ ...prev, birthDate: "" }));
                          }
                        }}
                        maxDate={new Date(new Date().setFullYear(new Date().getFullYear() - 17))}
                        minDate={new Date(new Date().setFullYear(new Date().getFullYear() - 100))}
                        showYearDropdown
                        showMonthDropdown
                        dropdownMode="select"
                        dateFormat="MM/dd/yyyy"
                        placeholderText="Select your birth date (mm/dd/yyyy)"
                        customInput={<BirthdayInput hasError={!!errors.birthDate} />} />
                      {errors.birthDate && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.birthDate}
                        </p>
                      )}
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
                        autoCapitalize="none"
                        spellCheck="false"
                        disabled={isGoogleSignup}
                        className={`w-full px-4 py-3.5 bg-gray-900 border ${errors.email ? "border-red-600" : "border-gray-700"} rounded-xl text-white text-base placeholder-gray-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/50 transition-all duration-300 ${isGoogleSignup ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                      <div className={`flex items-center rounded-xl bg-gray-900 border ${errors.phone ? "border-red-600" : "border-gray-700"} focus-within:border-red-600 focus-within:ring-2 focus-within:ring-red-600/50 transition-all duration-300`}>
                        <span className="px-4 py-3.5 text-gray-300 border-r border-gray-700 font-semibold">
                          +63
                        </span>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          autoComplete="off"
                          inputMode="numeric"
                          maxLength={10}
                          className="flex-1 px-4 py-3.5 bg-transparent text-white text-base placeholder-gray-500 focus:outline-none"
                          placeholder="9XXXXXXXXX"
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
                      {formData.confirmPassword && !errors.confirmPassword && formData.password && (
                        <p className="text-green-500 text-sm mt-1 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          Passwords match!
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
                          disabled={!(hasReadTerms && hasReadPrivacy)}
                          onChange={handleChange}
                          className={`w-5 h-5 mt-0.5 bg-gray-900 border-gray-700 rounded text-red-600 focus:ring-red-600 focus:ring-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${errors.agreeToTerms ? "border-red-600" : ""}`}
                        />
                        <label
                          htmlFor="agreeToTerms"
                          className="text-base text-gray-400 cursor-pointer"
                        >
                          I agree to the{" "}
                          <button
                            type="button"
                            onClick={() => setShowTermsModal(true)}
                            className="text-red-600 hover:text-red-500 font-bold underline underline-offset-4"
                          >
                            Terms and Conditions
                          </button>
                          {" "}and{" "}
                          <button
                            type="button"
                            onClick={() => setShowPrivacyModal(true)}
                            className="text-red-600 hover:text-red-500 font-bold underline underline-offset-4"
                          >
                            Privacy & Cookie Policy
                          </button>
                        </label>
                      </div>
                      {errors.agreeToTerms && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.agreeToTerms}
                        </p>
                      )}
                      {!(hasReadTerms && hasReadPrivacy) && (
                        <p className="text-gray-500 text-xs mt-2 italic">
                          * Please read both documents to acknowledge
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={handlePrevious}
                      className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-black py-3.5 sm:py-4 rounded-2xl transition-all duration-300 text-base sm:text-lg flex items-center justify-center gap-2 border border-white/10 group shadow-lg"
                    >
                      <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                      </svg>
                      Back
                    </button>
                  )}
                  {currentStep < 3 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 sm:py-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-red-600/50 text-base sm:text-lg"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 sm:py-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-red-600/50 text-base sm:text-lg"
                    >
                      Create Account
                    </button>
                  )}
                </div>

                {/* Sign In Link */}
                <div className="text-center">
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-700" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-gray-900 text-gray-400">
                        Or sign up with
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-center mb-6">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => console.log('Login Failed')}
                      theme="filled_black"
                      shape="pill"
                      size="large"
                      width="100%"
                      text="signup_with"
                    />
                  </div>
                  <p className="text-gray-400 text-base sm:text-lg">
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

      <Modal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        title="Terms and Conditions"
        onScrollEnd={() => setHasReadTerms(true)}
        hasRead={hasReadTerms}
      >
        <TermsContent />
      </Modal>

      <Modal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        title="Privacy & Cookie Policy"
        onScrollEnd={() => setHasReadPrivacy(true)}
        hasRead={hasReadPrivacy}
      >
        <PrivacyAndCookieContent />
      </Modal>

      <style>{`
        .react-datepicker-wrapper {
          width: 100%;
        }
        .react-datepicker {
          font-family: inherit;
          background-color: #111827;
          border: 1px solid #374151;
          border-radius: 1rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          color: #fff;
          padding: 10px;
        }
        .react-datepicker__header {
          background-color: transparent;
          border-bottom: 1px solid #374151;
          padding-top: 10px;
        }
        .react-datepicker__current-month, .react-datepicker-time__header, .react-datepicker-year-header {
          color: #fff;
          font-weight: 700;
          font-size: 1.1rem;
        }
        .react-datepicker__day-name, .react-datepicker__day, .react-datepicker__time-name {
          color: #d1d5db;
          width: 2.5rem;
          line-height: 2.5rem;
          margin: 0.2rem;
          border-radius: 0.5rem;
          transition: all 0.2s;
        }
        .react-datepicker__day:hover, .react-datepicker__month-text:hover, .react-datepicker__quarter-text:hover, .react-datepicker__year-text:hover {
          background-color: #374151;
          color: #fff;
        }
        .react-datepicker__day--selected, .react-datepicker__day--in-selecting-range, .react-datepicker__day--in-range {
          background-color: #dc2626 !important;
          color: #fff !important;
          font-weight: bold;
        }
        .react-datepicker__day--keyboard-selected {
          background-color: #b91c1c;
        }
        .react-datepicker__triangle {
          display: none;
        }
        .react-datepicker__navigation-icon::before {
          border-color: #9ca3af;
        }
        .react-datepicker__navigation:hover *::before {
          border-color: #fff;
        }
        .react-datepicker__month-select, .react-datepicker__year-select {
          background-color: #1f2937;
          color: #fff;
          border: 1px solid #4b5563;
          border-radius: 0.5rem;
          padding: 4px 8px;
          outline: none;
          cursor: pointer;
        }
        .react-datepicker__month-select:focus, .react-datepicker__year-select:focus {
          border-color: #dc2626;
        }
        .react-datepicker-popper {
          z-index: 60;
        }
        .react-datepicker__day--disabled {
          color: #4b5563 !important;
        }
        .react-datepicker__day--disabled:hover {
          background-color: transparent !important;
          color: #4b5563 !important;
        }

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
        @media (max-width: 640px) {
          .react-datepicker {
            padding: 6px;
          }
          .react-datepicker__day-name, .react-datepicker__day, .react-datepicker__time-name {
            width: 1.9rem;
            line-height: 1.9rem;
            margin: 0.08rem;
            font-size: 0.8rem;
          }
          .react-datepicker__current-month, .react-datepicker-time__header, .react-datepicker-year-header {
            font-size: 0.95rem;
          }
        }

      `}</style>
    </div>
  );
}

export default SignUpPage;
