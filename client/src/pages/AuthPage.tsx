import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../stores/authStore";
import { Activity, ShieldCheck, Mail, Lock, Loader2, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";

export const AuthPage: React.FC = () => {
    const { signInAsGuest } = useAuthStore();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");
        setSuccessMsg("");

        try {
            if (isSignUp) {
                const { error, data } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                if (data.session) {
                    setSuccessMsg("Account created and signed in successfully!");
                } else {
                    setSuccessMsg("Account created! Check your email for confirmation link, or use Demo Mode to test immediately.");
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            }
        } catch (err: any) {
            const rawMsg = err.message || "Authentication error occurred";
            if (rawMsg.includes("Failed to fetch") || import.meta.env.VITE_SUPABASE_URL?.includes("your-project-id")) {
                setErrorMsg("Cannot connect to Supabase. You can click 'Instant Demo Mode' below to explore immediately!");
            } else {
                setErrorMsg(rawMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
            {/* Background Ambient Glows */}
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-800/80 p-6 sm:p-8 relative z-10">
                {/* Brand Logo & Name */}
                <div className="flex items-center justify-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-2xl text-white shadow-lg shadow-indigo-500/30">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-blue-300 to-indigo-200">
                            CuraLab AI
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">
                            <Sparkles className="w-2.5 h-2.5" /> Clinical Intelligence
                        </div>
                    </div>
                </div>

                {/* Segmented Auth Mode Switcher */}
                <div className="flex items-center p-1 bg-slate-950/60 rounded-xl border border-slate-800 mb-6">
                    <button
                        type="button"
                        onClick={() => {
                            setIsSignUp(false);
                            setErrorMsg("");
                            setSuccessMsg("");
                        }}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                            !isSignUp
                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                                : "text-slate-400 hover:text-slate-200"
                        }`}
                    >
                        Sign In
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setIsSignUp(true);
                            setErrorMsg("");
                            setSuccessMsg("");
                        }}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                            isSignUp
                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                                : "text-slate-400 hover:text-slate-200"
                        }`}
                    >
                        Create Account
                    </button>
                </div>

                <div className="text-center mb-6">
                    <h2 className="text-lg font-bold text-white">
                        {isSignUp ? "Create your clinical portal" : "Welcome back"}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                        {isSignUp
                            ? "Sign up to parse lab reports and monitor biomarkers"
                            : "Enter your credentials to access your lab reports"}
                    </p>
                </div>

                {/* Error Banner */}
                {errorMsg && (
                    <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl leading-relaxed">
                        {errorMsg}
                    </div>
                )}

                {/* Success Banner */}
                {successMsg && (
                    <div className="mb-4 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-xl flex items-start gap-2 leading-relaxed">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                        <span>{successMsg}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="clinician@hospital.org"
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 disabled:opacity-50 mt-2"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isSignUp ? (
                            "Register Account"
                        ) : (
                            "Sign In to Portal"
                        )}
                    </button>
                </form>

                {/* Instant Guest / Demo Mode Button */}
                <div className="mt-6 pt-5 border-t border-slate-800/80">
                    <div className="text-center mb-3">
                        <span className="text-[11px] text-slate-500 uppercase font-semibold tracking-wider">
                            Or test right away without account
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => signInAsGuest()}
                        className="w-full py-2.5 px-4 rounded-xl bg-slate-800/70 hover:bg-indigo-600/20 border border-slate-700/70 hover:border-indigo-500/40 text-slate-200 hover:text-indigo-300 text-xs font-semibold transition flex items-center justify-center gap-2 group"
                    >
                        <Sparkles className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                        <span>Instant Demo Mode (Guest Access)</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>

                {/* Security Footer */}
                <div className="mt-6 pt-4 border-t border-slate-800/40 flex items-center justify-center gap-2 text-[11px] text-slate-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>HIPAA Compliant In-Memory Vector & RLS Protection</span>
                </div>
            </div>
        </div>
    );
};