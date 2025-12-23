import React from "react";
import { useNavigate } from "react-router-dom";

export default function LoginOptions() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center items-center p-6 relative overflow-hidden">

            {/* Background Decor */}
            <div className="absolute top-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-amber-200/20 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-stone-300/20 rounded-full blur-[100px]"></div>
            </div>

            <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 p-10 transform transition-all hover:scale-[1.01] animate-slide-up">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-stone-900 mb-2 font-serif italic">Welcome Back</h2>
                    <p className="text-stone-500 font-medium">Please select your portal</p>
                </div>

                <div className="space-y-5">
                    {/* Admin Button */}
                    <button
                        onClick={() => navigate("/admin/login")}
                        className="group w-full p-5 rounded-2xl border border-transparent bg-stone-900 text-white hover:bg-stone-800 transition-all duration-300 flex items-center justify-between shadow-xl shadow-stone-900/10"
                    >
                        <div className="text-left">
                            <span className="block font-bold text-lg">Admin Access</span>
                            <span className="text-stone-400 text-sm group-hover:text-stone-300 transition-colors">Manage system & papers</span>
                        </div>
                        <div className="w-10 h-10 bg-stone-800 rounded-full flex items-center justify-center group-hover:bg-amber-600 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </div>
                    </button>

                    {/* User Button */}
                    <button
                        onClick={() => navigate("/login")}
                        className="group w-full p-5 rounded-2xl border-2 border-slate-100 bg-white text-stone-900 hover:border-amber-200 hover:bg-amber-50/50 transition-all duration-300 flex items-center justify-between shadow-sm hover:shadow-md"
                    >
                        <div className="text-left">
                            <span className="block font-bold text-lg">User Access</span>
                            <span className="text-stone-500 text-sm">Students & Candidates</span>
                        </div>
                        <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-stone-400 group-hover:text-amber-800 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </div>
                    </button>
                </div>

                <div className="mt-10 text-center border-t border-stone-100 pt-8">
                    <p className="text-stone-400 text-sm mb-3 font-medium">Don't have an account?</p>
                    <button
                        onClick={() => navigate("/register")}
                        className="text-stone-800 font-bold hover:text-amber-700 transition-colors text-sm uppercase tracking-wider underline underline-offset-4 decoration-amber-300 decoration-2"
                    >
                        Create an Account
                    </button>
                </div>
            </div>
        </div>
    );
}
