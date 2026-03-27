import re

file_path = r"c:\Users\ABC\Downloads\Avica-2.0\frontend\src\pages\Signup.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Imports
content = content.replace('import { API_BASE } from "../hooks/useAuth.js";', 'import { API_BASE } from "../hooks/useAuth.js";\nimport { GoogleLogin } from "@react-oauth/google";')

# 2. State definitions
state_find = '''  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    suffix: "",
    email: "",'''
state_replace = '''  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    suffix: "",
    age: "",
    email: "",'''
content = content.replace(state_find, state_replace)

state2_find = '''  const [showPrivacyModal, setShowPrivacyModal] = useState(false);'''
state2_replace = '''  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showCookieModal, setShowCookieModal] = useState(false);
  const [isGoogleSignup, setIsGoogleSignup] = useState(false);
  const [googleToken, setGoogleToken] = useState(null);'''
content = content.replace(state2_find, state2_replace)

# 3. Google Success Handler
handle_change_find = '''  const handleChange = (e) => {'''
handle_google_func = '''  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const base64Url = credentialResponse.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const payload = JSON.parse(jsonPayload);

      setFormData(prev => ({
        ...prev,
        firstName: payload.given_name || "",
        lastName: payload.family_name || "",
        email: payload.email || "",
      }));
      setIsGoogleSignup(true);
      setGoogleToken(credentialResponse.credential);
      setCurrentStep(1);
      
      swal.fire({
        title: "Almost there!",
        text: "Please complete the remaining details (Age, Suffix) to finish your Google Sign Up.",
        icon: "info",
        background: "linear-gradient(to bottom right, #1f2937, #111827)",
        color: "#fff",
        confirmButtonColor: "#dc2626",
      });
    } catch (e) {
      console.error("Token parsing error:", e);
    }
  };\n\n'''
content = content.replace(handle_change_find, handle_google_func + handle_change_find)

# 4. validateStep 1
val1_find = '''      if (!formData.lastName.trim())
        newErrors.lastName = "Last name is required";
      else if (!/^[a-zA-Z\s]+$/.test(formData.lastName))
        newErrors.lastName = "Last name can only contain letters and spaces";
    } else if (step === 2) {'''
val1_replace = '''      if (!formData.lastName.trim())
        newErrors.lastName = "Last name is required";
      else if (!/^[a-zA-Z\s]+$/.test(formData.lastName))
        newErrors.lastName = "Last name can only contain letters and spaces";
      if (!formData.age)
        newErrors.age = "Age is required";
      else if (isNaN(formData.age) || parseInt(formData.age) < 18)
        newErrors.age = "You must be at least 18 years old";
    } else if (step === 2) {'''
content = content.replace(val1_find, val1_replace)

# 5. validateStep 3
val3_find = '''    } else if (step === 3) {
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
      if (!formData.agreeToTerms)'''
val3_replace = '''    } else if (step === 3) {
      if (!isGoogleSignup) {
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
      }
      if (!formData.agreeToTerms)'''
content = content.replace(val3_find, val3_replace)

# 6. handleSubmit
submit_find = '''    const userData = {
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
          icon: "success",'''
submit_replace = '''    const userData = {
      email: formData.email,
      password: formData.password,
      first_name: formData.firstName,
      last_name: formData.lastName,
      suffix: formData.suffix,
      age: formData.age,
      is_signup: isGoogleSignup,
      token: googleToken,
      phone: cleanedPhone ? `${formData.countryCode}${cleanedPhone}` : null,
      role: formData.role,
    };
    try {
      const endpoint = isGoogleSignup ? `${API_BASE}/google-login/` : `${API_BASE}/signup/`;
      const response = await fetch(
        endpoint,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        },
      );
      const data = await response.json();
      if (response.ok && data.success !== false) {
        if (isGoogleSignup) {
           sessionStorage.setItem("access_token", data.tokens.access);
           sessionStorage.setItem("refresh_token", data.tokens.refresh);
           sessionStorage.setItem("user", JSON.stringify(data.user));
           swal.fire({
             title: "Account Created!",
             text: "Welcome to Otokwikk!",
             icon: "success",
             background: "linear-gradient(to bottom right, #1f2937, #111827)",
             color: "#fff",
             confirmButtonColor: "#dc2626",
           }).then(() => {
             navigate("/");
           });
           return;
        }

        swal.fire({
          title: data.title || "Account Created!",
          text: data.message || "Please check your email to verify your account before logging in.",
          icon: "success",'''
content = content.replace(submit_find, submit_replace)

# 7. Add HTML for Age
age_html = '''                    <div>
                      <label
                        htmlFor="age"
                        className="block text-base font-semibold text-gray-300 mb-2"
                      >
                        Age <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="number"
                        id="age"
                        name="age"
                        value={formData.age}
                        onChange={handleChange}
                        autoComplete="off"
                        className={`w-full px-4 py-3.5 bg-gray-900 border ${errors.age ? "border-red-600" : "border-gray-700"} rounded-xl text-white text-base placeholder-gray-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/50 transition-all duration-300`}
                        placeholder="18"
                      />
                      {errors.age && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.age}
                        </p>
                      )}
                    </div>'''
suffix_html = '''                      </select>
                    </div>'''
content = content.replace(suffix_html, suffix_html + '\n' + age_html)

# 8. Password hide logic
pass_find = '''                {/* Step 3: Account Security */}
                {currentStep === 3 && (
                  <div className="space-y-5">
                    <div>
                      <label
                        htmlFor="password"'''
pass_replace = '''                {/* Step 3: Account Security */}
                {currentStep === 3 && (
                  <div className="space-y-5">
                    {!isGoogleSignup && (
                      <>
                    <div>
                      <label
                        htmlFor="password"'''
content = content.replace(pass_find, pass_replace)

pass_find2 = '''                      )}
                    </div>'''
pass_replace2 = '''                      )}
                    </div>
                      </>
                    )}'''
# Find the exact second div closer for password fields
# Let's target the confirm password wrapper section
conf_find = '''                        <p className="text-red-500 text-sm mt-1">
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-start gap-3">'''
conf_replace = '''                        <p className="text-red-500 text-sm mt-1">
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>
                    </>
                    )}

                    <div>
                      <div className="flex items-start gap-3">'''
content = content.replace(conf_find, conf_replace)

# Disable email field if isGoogleSignup
email_find = '''                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        autoComplete="off"
                        className={`w-full px-4 py-3.5 bg-gray-900 border ${errors.email ? "border-red-600" : "border-gray-700"} rounded-xl text-white text-base placeholder-gray-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/50 transition-all duration-300`}
                        placeholder="john.doe@example.com"'''
email_replace = '''                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        autoComplete="off"
                        disabled={isGoogleSignup}
                        className={`w-full px-4 py-3.5 bg-gray-900 border ${errors.email ? "border-red-600" : "border-gray-700"} rounded-xl text-white text-base placeholder-gray-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/50 transition-all duration-300 ${isGoogleSignup ? 'opacity-50 cursor-not-allowed' : ''}`}
                        placeholder="john.doe@example.com"'''
content = content.replace(email_find, email_replace)

# Cookies Policy link
link_find = '''                          <button
                            type="button"
                            onClick={() => setShowPrivacyModal(true)}
                            className="text-red-600 hover:text-red-500 font-semibold"
                          >
                            Privacy Policy
                          </button>
                        </label>'''
link_replace = '''                          <button
                            type="button"
                            onClick={() => setShowPrivacyModal(true)}
                            className="text-red-600 hover:text-red-500 font-semibold"
                          >
                            Privacy Policy
                          </button>
                          , and{" "}
                          <button
                            type="button"
                            onClick={() => setShowCookieModal(true)}
                            className="text-red-600 hover:text-red-500 font-semibold"
                          >
                            Cookie Policy
                          </button>
                        </label>'''
content = content.replace(link_find, link_replace)

# Add GoogleLogin button before login link
google_btn = '''                {/* Sign In Link */}
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
                      useOneTap
                      theme="filled_black"
                      shape="pill"
                      size="large"
                      width="100%"
                    />
                  </div>
                  <p className="text-gray-400 text-lg">
                    Already have an account?{" "}'''
content = content.replace('''                {/* Sign In Link */}
                <div className="text-center">
                  <p className="text-gray-400 text-lg">
                    Already have an account?{" "}''', google_btn)

# Add Cookie Modal
cookie_content = '''
  const CookieContent = () => (
    <div className="space-y-6">
      <section>
        <h4 className="text-white font-bold mb-2 uppercase tracking-wide">1. WHAT ARE COOKIES?</h4>
        <p>Cookies are small pieces of text sent to your web browser by a website you visit. They help the website remember information about your visit.</p>
      </section>
      <section>
        <h4 className="text-white font-bold mb-2 uppercase tracking-wide">2. HOW WE USE COOKIES</h4>
        <p>We use cookies to maintain your session (so you don't have to keep logging in), track your settings, and improve our platform's performance based on your usage.</p>
      </section>
      <section>
        <h4 className="text-white font-bold mb-2 uppercase tracking-wide">3. YOUR CHOICES</h4>
        <p>You can choose to disable cookies through your browser settings, although this may affect the availability and functionality of some features on our platform.</p>
      </section>
    </div>
  );
'''
content = content.replace('  const PrivacyContent = () => (', cookie_content + '  const PrivacyContent = () => (')

cookie_modal = '''      <Modal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} title="Privacy Policy">
        <PrivacyContent />
      </Modal>

      <Modal isOpen={showCookieModal} onClose={() => setShowCookieModal(false)} title="Cookie Policy">
        <CookieContent />
      </Modal>'''
content = content.replace('''      <Modal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} title="Privacy Policy">
        <PrivacyContent />
      </Modal>''', cookie_modal)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Signup updated successfully!")
