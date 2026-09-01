

import { useEffect } from "react";
import { useAuthStore } from "./stores/authStore";
import { AuthPage } from "./pages/AuthPage";
import { Activity, LogOut, ShieldCheck, User } from "lucide-react";

function App() {
  const { user, loading, initialize, signOut } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Activity className="w-8 h-8 text-indigo-600 animate-pulse" />
          <p className="text-sm font-medium text-slate-500">Initializing CuraLab AI...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-600 rounded-lg text-white">
            <Activity className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600">
            CuraLab AI
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
            <User className="w-4 h-4 text-slate-500" />
            <span className="font-medium">{user.email}</span>
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-lg transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-8">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-sm font-semibold">Sprint 2 Complete: Authenticated via Supabase</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            Welcome to CuraLab Clinical Portal
          </h1>
          <p className="text-slate-500 text-sm mb-6">
            Your session is securely authenticated with PostgreSQL Row-Level Security. Ready for Sprint 3 (PDF Upload & Medical Extraction Engine).
          </p>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 space-y-1">
            <div><strong>User ID:</strong> {user.id}</div>
            <div><strong>Email:</strong> {user.email}</div>
            <div><strong>Created:</strong> {user.created_at}</div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

