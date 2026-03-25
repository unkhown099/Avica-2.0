import React, { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import swal from "sweetalert2";
import logo from "../assets/otokwikklogo.png";
import { API_BASE } from "../hooks/useAuth.js";

function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token");
    const uid = searchParams.get("uid");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            swal.fire({ icon: "error", title: "Error", text: "Passwords do not match" });
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`${API_BASE}/reset-password/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token,
                    uid,
                    password
                }),
            });
            const data = await res.json();

            if (res.ok) {
                await swal.fire({
                    icon: "success",
                    title: "Success",
                    text: "Your password has been reset successfully!",
                    background: "linear-gradient(to bottom right, #1f2937, #111827)",
                    color: "#fff",
                    confirmButtonColor: "#dc2626"
                });
                navigate("/signin");
            } else {
                throw new Error(data.message);
            }
        } catch (err) {
            swal.fire({ icon: "error", title: "Reset Failed", text: err.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!token || !uid) {
        return (
            <div className="h-screen bg-black flex items-center justify-center p-6 text-center">
                <div className="max-w-md space-y-6">
                    <h1 className="text-4xl font-black text-white">Invalid Link</h1>
                    <p className="text-gray-400">This password reset link is invalid or has expired.</p>
                    <Link to="/signin" className="inline-block bg-red-600 text-white px-8 py-3 rounded-xl font-bold">Back to Login</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-black flex items-center justify-center px-6 relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-10">
                    <img src={logo} alt="Otokwikk" className="h-16 mx-auto mb-8" />
                    <h2 className="text-4xl font-black text-white mb-2 uppercase tracking-tighter">Choose New Password</h2>
                    <p className="text-gray-400">Please enter and confirm your new password below.</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-gradient-to-br from-gray-900 via-gray-900 to-red-950/20 p-10 rounded-[40px] border border-white/5 shadow-2xl space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">New Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full px-5 py-4 bg-black border border-white/5 rounded-2xl text-white focus:outline-none focus:border-red-600 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Confirm Password</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full px-5 py-4 bg-black border border-white/5 rounded-2xl text-white focus:outline-none focus:border-red-600 transition-all"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-5 bg-red-600 hover:bg-red-700 disabled:bg-gray-800 text-white font-black rounded-2xl transition-all tracking-widest uppercase shadow-xl shadow-red-600/20 transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {isSubmitting ? "Updating..." : "Reset Password"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ResetPassword;
