// client/src/App.tsx
import { useEffect, useState, useMemo } from "react";
import { useAuthStore } from "./stores/authStore";
import { AuthPage } from "./pages/AuthPage";
import { Dropzone } from "./components/Dropzone";
import { supabase } from "./lib/supabase";
import { BiomarkerCard, type Biomarker } from "./components/analysis/BiomarkerCard";
import { DoctorQuestionsCard } from "./components/analysis/DoctorQuestionsCard";
import { ChatDrawer } from "./components/chat/ChatDrawer";
import {
  Activity,
  LogOut,
  FileText,
  AlertCircle,
  AlertOctagon,
  RefreshCw,
  Search,
  Sparkles,
  HeartPulse,
  Printer,
  ShieldAlert,
  Calendar,
  User as UserIcon,
} from "lucide-react";
import axios from "axios";

interface AnalysisResponse {
  sessionId: string;
  reportTitle: string;
  totalPages: number;
  analysis: {
    reportSummary: string;
    patientContext?: {
      patientName?: string;
      age?: number;
      gender?: string;
      collectionDate?: string;
    };
    biomarkers: Biomarker[];
    criticalAlerts?: string[];
    doctorDiscussionQuestions: string[];
    lifestyleRecommendations?: string[];
  };
}

function App() {
  const { user, isGuest, loading, initialize, signOut } = useAuthStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisResponse | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "FLAGGED" | "NORMAL">("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Function to upload and analyze PDF data
  const handleFileUpload = async (file: File) => {
    setIsAnalyzing(true);
    setServerError(null);
    setAnalysisData(null);
    setSearchQuery("");
    setSelectedCategory("ALL");

    try {
      // 1. Get authentication token (Supabase session or Guest token)
      let token = "demo-guest-token";
      if (!isGuest) {
        let { data: sessionData } = await supabase.auth.getSession();
        let userToken = sessionData.session?.access_token;

        if (!userToken) {
          const { data: refreshData } = await supabase.auth.refreshSession();
          userToken = refreshData.session?.access_token;
        }

        if (userToken) {
          token = userToken;
        }
      }

      // 2. Prepare FormData payload
      const formData = new FormData();
      formData.append("file", file);

      // 3. Post to Express backend analyze endpoint
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await axios.post(`${API_BASE_URL}/api/reports/analyze`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // 4. Save analysis response
      setAnalysisData(response.data.data);
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to analyze PDF report.";
      setServerError(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setAnalysisData(null);
    setServerError(null);
    setSearchQuery("");
    setSelectedCategory("ALL");
  };

  // Extract distinct categories
  const categories = useMemo(() => {
    if (!analysisData?.analysis?.biomarkers) return [];
    const set = new Set<string>();
    analysisData.analysis.biomarkers.forEach((b) => {
      if (b.category) set.add(b.category);
    });
    return Array.from(set);
  }, [analysisData]);

  // Filter biomarkers by search, category & status tab
  const filteredBiomarkers = useMemo(() => {
    if (!analysisData?.analysis?.biomarkers) return [];
    return analysisData.analysis.biomarkers.filter((b) => {
      // Category filter
      if (selectedCategory !== "ALL" && b.category !== selectedCategory) {
        return false;
      }

      // Search filter
      const matchesSearch =
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.category && b.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (b.clinicalSignificance && b.clinicalSignificance.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // Status filter
      if (statusFilter === "FLAGGED") {
        return b.status === "HIGH" || b.status === "LOW" || b.status === "CRITICAL" || b.status === "BORDERLINE";
      }
      if (statusFilter === "NORMAL") {
        return b.status === "NORMAL";
      }
      return true;
    });
  }, [analysisData, searchQuery, statusFilter, selectedCategory]);

  // Metric counts and Health Balance Score
  const stats = useMemo(() => {
    const list = analysisData?.analysis?.biomarkers || [];
    const flagged = list.filter((b) => b.status !== "NORMAL").length;
    const critical = list.filter((b) => b.status === "CRITICAL").length;
    const normal = list.filter((b) => b.status === "NORMAL").length;
    const healthScore = list.length > 0 ? Math.round((normal / list.length) * 100) : 100;
    return { total: list.length, flagged, critical, normal, healthScore };
  }, [analysisData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center animate-pulse">
            <Activity className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
          <p className="text-sm font-medium text-slate-400">Initializing CuraLab AI...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Background Ambient Glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed top-20 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Navigation */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-xl text-white shadow-lg shadow-indigo-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-blue-300 to-indigo-200">
              CuraLab AI
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              <Sparkles className="w-3 h-3 text-indigo-400" /> RAG Clinical Intelligence
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isGuest ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Demo Guest Mode
            </span>
          ) : (
            <span className="hidden md:inline-block text-xs text-slate-400 font-medium">
              {user.email}
            </span>
          )}

          <button
            onClick={() => signOut()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-300 border border-slate-700/60 hover:border-rose-500/30 text-slate-300 transition duration-150"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isGuest ? "Exit Demo" : "Sign Out"}</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Upload State */}
        {!analysisData ? (
          <div className="max-w-3xl mx-auto space-y-6 pt-4 sm:pt-8">
            <div className="text-center space-y-2">
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                Clinical Lab Report AI Analysis
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
                Upload your digital laboratory PDF to extract structured biomarkers, detect critical values, and interactively consult the grounded Clinical RAG Assistant.
              </p>
            </div>

            <Dropzone onFileSelect={handleFileUpload} isLoading={isAnalyzing} />

            {serverError && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-3">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
                <div className="space-y-1">
                  <p className="font-semibold text-rose-200">Analysis Notice</p>
                  <p className="text-rose-300/90">{serverError}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Analysis Dashboard State */
          <div className="space-y-6">
            {/* Top Toolbar & Patient Context */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 bg-slate-900/70 border border-slate-800/80 rounded-3xl backdrop-blur-md">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-bold text-base sm:text-xl text-white">
                    {analysisData.reportTitle || "Clinical Report Analysis"}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                    <span>{analysisData.totalPages} Page(s)</span>
                    <span>•</span>
                    <span className="text-indigo-300 font-semibold">{stats.total} Biomarkers Extracted</span>
                    {analysisData.analysis.patientContext?.patientName && (
                      <>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 text-slate-300">
                          <UserIcon className="w-3 h-3 text-slate-400" /> {analysisData.analysis.patientContext.patientName}
                          {analysisData.analysis.patientContext.age ? ` (${analysisData.analysis.patientContext.age}y)` : ""}
                        </span>
                      </>
                    )}
                    {analysisData.analysis.patientContext?.collectionDate && (
                      <>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 text-slate-400">
                          <Calendar className="w-3 h-3" /> {analysisData.analysis.patientContext.collectionDate}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                  title="Print Report"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print Report</span>
                </button>

                <button
                  onClick={handleReset}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Analyze Another PDF</span>
                </button>
              </div>
            </div>

            {/* Critical Alerts Banner (if any) */}
            {analysisData.analysis.criticalAlerts && analysisData.analysis.criticalAlerts.length > 0 && (
              <div className="p-4 sm:p-5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200">
                <div className="flex items-center gap-2 font-bold text-sm sm:text-base text-rose-400 mb-2">
                  <AlertOctagon className="w-5 h-5 shrink-0" />
                  <span>Urgent Critical Value Alerts</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-rose-300">
                  {analysisData.analysis.criticalAlerts.map((alert, i) => (
                    <li key={i}>{alert}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Summary & Stats Ribbon */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 mb-2 tracking-wider">
                  <HeartPulse className="w-4 h-4" />
                  <span>EXECUTIVE CLINICAL SUMMARY</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {analysisData.analysis.reportSummary}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Wellness Balance</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${stats.healthScore >= 80 ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
                    {stats.healthScore}% In Range
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${stats.healthScore >= 80 ? "bg-emerald-500" : "bg-amber-500"}`}
                    style={{ width: `${stats.healthScore}%` }}
                  />
                </div>
                <span className="text-[11px] text-slate-500 mt-2">
                  {stats.normal} of {stats.total} biomarkers within normal reference range
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
                <span className="text-xs font-semibold text-slate-400">Flagged Findings</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-extrabold text-amber-400">{stats.flagged}</span>
                  <span className="text-xs text-slate-400">Flagged ({stats.critical} Critical)</span>
                </div>
                <span className="text-[11px] text-amber-400/80 mt-1 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> Require clinical physician discussion
                </span>
              </div>
            </div>

            {/* 2-Column Layout: Left (Biomarkers & Questions) | Right (Streaming Chat Drawer) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column (7/12 cols) */}
              <div className="lg:col-span-7 space-y-6">
                {/* Search & Status Filter Bar */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search biomarker (e.g., Glucose, Cholesterol, Hemoglobin)..."
                        className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 border border-slate-800 rounded-xl self-start">
                      <button
                        onClick={() => setStatusFilter("ALL")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${statusFilter === "ALL"
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400 hover:text-slate-200"
                          }`}
                      >
                        All ({stats.total})
                      </button>
                      <button
                        onClick={() => setStatusFilter("FLAGGED")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${statusFilter === "FLAGGED"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "text-slate-400 hover:text-slate-200"
                          }`}
                      >
                        Flagged ({stats.flagged})
                      </button>
                      <button
                        onClick={() => setStatusFilter("NORMAL")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${statusFilter === "NORMAL"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "text-slate-400 hover:text-slate-200"
                          }`}
                      >
                        Normal ({stats.normal})
                      </button>
                    </div>
                  </div>

                  {/* Category Pills (if multiple categories exist) */}
                  {categories.length > 1 && (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[11px] text-slate-500 uppercase font-semibold mr-1">Panel:</span>
                      <button
                        onClick={() => setSelectedCategory("ALL")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${selectedCategory === "ALL"
                          ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
                          : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200"
                          }`}
                      >
                        All Panels
                      </button>
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${selectedCategory === cat
                            ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
                            : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200"
                            }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Biomarker Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredBiomarkers.map((biomarker, idx) => (
                    <BiomarkerCard key={idx} biomarker={biomarker} />
                  ))}
                </div>

                {filteredBiomarkers.length === 0 && (
                  <div className="p-8 text-center bg-slate-900/40 border border-slate-800/60 rounded-2xl text-slate-400 text-xs">
                    No biomarkers found matching your search or category filter.
                  </div>
                )}

                {/* Doctor Questions Card */}
                {analysisData.analysis.doctorDiscussionQuestions && (
                  <DoctorQuestionsCard
                    questions={analysisData.analysis.doctorDiscussionQuestions}
                  />
                )}
              </div>

              {/* Right Column (5/12 cols) - Live Streaming Chat Drawer */}
              <div className="lg:col-span-5 sticky top-20">
                <ChatDrawer
                  sessionId={analysisData.sessionId}
                  reportTitle={analysisData.reportTitle}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
