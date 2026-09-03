import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { Activity, ShieldCheck, Mail, Lock, Loader2 } from "lucide-react";

export const AuthPage: React.FC = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                alert("Account created! Check your email for confirmation or log in.");
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            }
        } catch (err: any) {
            const rawMsg = err.message || "Authentication error occurred";
            if (rawMsg.includes("Failed to fetch") || import.meta.env.VITE_SUPABASE_URL?.includes("your-project-id")) {
                setErrorMsg("Cannot connect to Supabase. You need to put your actual Supabase Project URL and Anon Key inside client/.env (currently set to placeholder 'https://your-project-id.supabase.co').");
            } else {
                setErrorMsg(rawMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black-950 flex items-center justify-center p-4 relative overflow-hidden" >
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="max-w-md w-full bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30 p-8">
                <div className="flex items-center justify-center gap-2 mb-6">
                    <div className="p-3 bg-indigo-600 rounded-xl text-white">
                        <Activity className="w-7 h-7" />
                    </div>
                    <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600">
                        CuraLab AI
                    </span>
                </div>

                <h2 className="text-xl font-bold text-slate-800 text-center mb-2">
                    {isSignUp ? "Create your health portal" : "Welcome back"}
                </h2>
                <div className="flex justify-center mb-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200/60 rounded-full text-green-700 text-xs font-medium">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Clinical AI Engine Ready
                    </div>
                </div>

                {errorMsg && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-green-600 uppercase mb-1">Email</label>
                        <div className="relative">
                            <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="doctor@hospital.org"
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-black-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-green-600 uppercase mb-1">Password</label>
                        <div className="relative">
                            <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-black-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-green-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition flex items-center justify-center gap-2 shadow-md shadow-indigo-100 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignUp ? "Sign Up" : "Sign In")}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        type="button"
                        onClick={() => setIsSignUp(true)}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${isSignUp
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-white-500 hover:text-slate-900"
                            }`}
                    >
                        Create Account
                    </button>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-white400">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Encrypted with PostgreSQL Row-Level Security</span>
                </div>
            </div>
        </div >
    );
};