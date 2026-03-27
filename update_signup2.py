import re

file_path = r"c:\Users\ABC\Downloads\Avica-2.0\frontend\src\pages\Signup.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. replace age with birthDate in state
state_find = '''  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    suffix: "",
    age: "",'''
state_replace = '''  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    suffix: "",
    birthDate: "",'''
content = content.replace(state_find, state_replace)

# 2. handle validateStep 1
val1_find = '''      if (!formData.age)
        newErrors.age = "You must be at least 18 years old";
      else if (isNaN(formData.age) || parseInt(formData.age) < 18)
        newErrors.age = "You must be at least 18 years old";'''
val1_replace = '''      if (!formData.birthDate) {
        newErrors.birthDate = "Birth date is required";
      } else {
        const birthDate = new Date(formData.birthDate);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        if (age < 18) newErrors.birthDate = "You must be at least 18 years old";
        else if (age > 100) newErrors.birthDate = "You must be 100 years old or younger";
      }'''
content = content.replace(val1_find, val1_replace)

# Fallback string if previous was exactly "Age is required"
val1_alt_find = '''      if (!formData.age)
        newErrors.age = "Age is required";
      else if (isNaN(formData.age) || parseInt(formData.age) < 18)
        newErrors.age = "You must be at least 18 years old";'''
content = content.replace(val1_alt_find, val1_replace)

# 3. Always require Password in Step 3! (Remove !isGoogleSignup conditional)
val3_find = '''    } else if (step === 3) {
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
      }'''

val3_replace = '''    } else if (step === 3) {
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
        newErrors.confirmPassword = "Passwords do not match";'''
content = content.replace(val3_find, val3_replace)

# 4. Remove automatic logic in handleSubmit
submit_find = '''    const userData = {
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

submit_replace = '''    const userData = {
      email: formData.email,
      password: formData.password,
      first_name: formData.firstName,
      last_name: formData.lastName,
      suffix: formData.suffix,
      birth_date: formData.birthDate,
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
content = content.replace(submit_find, submit_replace)

# 5. Fix HTML input to display DatePicker
age_html_find = '''                    <div>
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
                                                
age_html_replace = '''                    <div>
                      <label
                        htmlFor="birthDate"
                        className="block text-base font-semibold text-gray-300 mb-2"
                      >
                        Birth Date <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="date"
                        id="birthDate"
                        name="birthDate"
                        value={formData.birthDate}
                        onChange={handleChange}
                        max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                        min={new Date(new Date().setFullYear(new Date().getFullYear() - 100)).toISOString().split('T')[0]}
                        className={`w-full px-4 py-3.5 bg-gray-900 border ${errors.birthDate ? "border-red-600" : "border-gray-700"} rounded-xl text-white text-base placeholder-gray-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/50 transition-all duration-300`}
                      />
                      {errors.birthDate && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.birthDate}
                        </p>
                      )}
                    </div>'''
content = content.replace(age_html_find, age_html_replace)

# 6. Always display password inputs
pass_ui_find = '''                {currentStep === 3 && (
                  <div className="space-y-5">
                    {!isGoogleSignup && (
                      <>
                    <div>
                      <label
                        htmlFor="password"'''
pass_ui_replace = '''                {currentStep === 3 && (
                  <div className="space-y-5">
                    <div>
                      <label
                        htmlFor="password"'''
content = content.replace(pass_ui_find, pass_ui_replace)

pass_ui2_find = '''                      )}
                    </div>
                      </>
                    )}'''
pass_ui2_replace = '''                      )}
                    </div>'''
# Replace only the first occurrence of this exact string representing the end of password conditional block
content = content.replace(pass_ui2_find, pass_ui2_replace)


msg_find = '''      swal.fire({
        title: "Almost there!",
        text: "Please complete the remaining details (Age, Suffix) to finish your Google Sign Up.",'''
msg_replace = '''      swal.fire({
        title: "Almost there!",
        text: "Please complete the remaining details like Birth Date, Suffix, and your custom password to finish your sign up.",'''
content = content.replace(msg_find, msg_replace)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Signup component updated successfully again.")
