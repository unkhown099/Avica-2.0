import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import swal from "sweetalert2";
import logo from "../assets/otokwikklogo.png";

function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState("verifying"); // verifying, success, error

    useEffect(() => {
        const verify = async () => {
            const token = searchParams.get("token");
            const uid = searchParams.get("uid");

            if (!token || !uid) {
                setStatus("error");
                return;
            }

            try {
                const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/verify-email/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token, uid }),
                });

                const data = await res.json();

                if (res.ok && data.success) {
                    setStatus("success");
                    swal.fire({
                        icon: "success",
                        title: "Email Verified!",
                        text: "Your account is now active. You can log in.",
                        confirmButtonColor: "#dc2626",
                    });
                } else {
                    setStatus("error");
                }
            } catch (err) {
                setStatus("error");
            }
        };

        verify();
    }, [searchParams]);

    return (
        <div className="h-screen bg-black flex items-center justify-center px-6 relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
            </div>

            <div className="w-full max-w-lg relative z-10 text-center">
                <img src={logo} alt="Otokwikk logo" className="h-20 mx-auto mb-8" />

                <div className="bg-gradient-to-br from-gray-900 to-red-950/20 rounded-3xl p-10 border border-white/5 shadow-2xl">
                    {status === "verifying" && (
                        <div className="space-y-6">
                            <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <h2 className="text-3xl font-black text-white">Verifying Email...</h2>
                            <p className="text-gray-400">Please wait while we activate your account.</p>
                        </div>
                    )}

                    {status === "success" && (
                        <div className="space-y-6">
                            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto">
                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-3xl font-black text-white">Email Verified!</h2>
                            <p className="text-gray-400">Your account has been successfully activated.</p>
                            <Link to="/signin" className="inline-block w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-all duration-300 transform hover:scale-105 text-xl">
                                Go to Sign In
                            </Link>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="space-y-6">
                            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto">
                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h2 className="text-3xl font-black text-white">Verification Failed</h2>
                            <p className="text-gray-400">The link is invalid or has expired.</p>
                            <Link to="/signup" className="inline-block w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-xl transition-all duration-300 text-lg">
                                Back to Sign Up
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default VerifyEmail;
