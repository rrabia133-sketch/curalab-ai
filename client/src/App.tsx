// client/src/App.tsx
import { useEffect, useState, useMemo } from "react";
import { useAuthStore } from "./stores/authStore";
import { AuthPage } from "./pages/AuthPage";
import { Dropzone } from "./components/Dropzone";
import { supabase } from "./lib/supabase";
import {
  Activity,
  LogOut,
  FileText,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Search,
  Zap,
  ShieldCheck,
  Cpu,
  Layers,
} from "lucide-react";
import axios from "axios";

interface ExtractedData {
  fileName: string;
  fileSize: number;
  totalPages: number;
  extractedText: string;
  characterCount: number;
}

function App() {
  const { user, loading, initialize, signOut } = useAuthStore();
  const [isUploading, setIsUploading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Function to upload and extract PDF data
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setServerError(null);
    setExtractedData(null);
    setSearchQuery("");

    try {
      // 1. Get Supabase session token
      let { data: sessionData } = await supabase.auth.getSession();
      let token = sessionData.session?.access_token;

      // Refresh if expired
      if (!token) {
        const { data: refreshData } = await supabase.auth.refreshSession();
        token = refreshData.session?.access_token;
      }

      if (!token) {
        throw new Error("Your session has expired. Please sign out and log in again.");
      }

      // 2. Prepare FormData payload
      const formData = new FormData();
      formData.append("file", file);

      // 3. Post to Express backend
      const response = await axios.post("http://localhost:5000/api/reports/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      // 4. Save extracted response
      setExtractedData(response.data.data);
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to process PDF report.";
      setServerError(message);
    } finally {
      setIsUploading(false);
    }
  };

  // Copy extracted text to clipboard
  const handleCopy = () => {
    if (extractedData?.extractedText) {
      navigator.clipboard.writeText(extractedData.extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Reset upload
  const handleReset = () => {
    setExtractedData(null);
    setServerError(null);
    setSearchQuery("");
  };

  // Calculate approximate word count
  const wordCount = useMemo(() => {
    if (!extractedData?.extractedText) return 0;
    return extractedData.extractedText.trim().split(/\s+/).length;
  }, [extractedData]);

  // Split lines for code viewer
  const textLines = useMemo(() => {
    if (!extractedData?.extractedText) return [];
    return extractedData.extractedText.split("\n");
  }, [extractedData]);

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center animate-pulse">
              <Activity className="w-8 h-8 text-indigo-400 animate-spin" />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-400">Initializing CuraLab AI...</p>
        </div>
      </div>
    );
  }

  // If not logged in, show Auth Page
  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Ambient Glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed top-20 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Navigation */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-xl text-white shadow-lg shadow-indigo-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-blue-300 to-indigo-200">
                CuraLab AI
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                <Zap className="w-3 h-3 text-indigo-400" /> Sprint 3 Engine
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-300 bg-slate-800/80 border border-slate-700/60 px-3.5 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-slate-300">{user.email}</span>
          </div>

          <button
            onClick={() => signOut()}
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-300 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8 space-y-8 relative z-10">
        {/* Hero Section */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Zero-Disk In-Memory Parsing</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Clinical Lab Report Ingestion
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
            Upload your medical blood tests, pathology panels, or urinalysis PDF reports. The engine automatically inspects the <code className="text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded text-xs">%PDF-</code> magic bytes and extracts clean raw text with <code className="text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded text-xs">unpdf</code>.
          </p>
        </div>

        {/* Feature Cards Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Magic-Byte MIME</h4>
              <p className="text-xs text-slate-400 mt-0.5">Validates true binary headers before memory allocation.</p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">unpdf Core</h4>
              <p className="text-xs text-slate-400 mt-0.5">High-speed Uint8Array proxy parsing across all pages.</p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Sprint 4 Ready</h4>
              <p className="text-xs text-slate-400 mt-0.5">Formatted text buffer prepared for AI biomarker extraction.</p>
            </div>
          </div>
        </div>

        {/* Upload Zone */}
        {!extractedData && (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-3 shadow-2xl">
            <Dropzone onFileSelect={handleFileUpload} isLoading={isUploading} />
          </div>
        )}

        {/* Error Alert */}
        {serverError && (
          <div className="p-4 bg-rose-950/40 border border-rose-800/60 rounded-2xl flex items-start gap-3.5 text-rose-200 shadow-lg">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-rose-300">Processing Error</p>
              <p className="text-xs text-rose-400/90">{serverError}</p>
            </div>
          </div>
        )}

        {/* Extracted Data View */}
        {extractedData && (
          <div className="space-y-6">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">File Name</span>
                <p className="text-sm font-bold text-white truncate" title={extractedData.fileName}>
                  {extractedData.fileName}
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pages Parsed</span>
                <p className="text-sm font-bold text-indigo-400">
                  {extractedData.totalPages} {extractedData.totalPages === 1 ? "Page" : "Pages"}
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Character Count</span>
                <p className="text-sm font-bold text-emerald-400">
                  {extractedData.characterCount.toLocaleString()} chars
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Words</span>
                <p className="text-sm font-bold text-blue-400">
                  ~{wordCount.toLocaleString()} words
                </p>
              </div>
            </div>

            {/* Content Preview Container */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              {/* Header & Controls */}
              <div className="p-4 sm:p-5 bg-slate-900 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Extracted Raw Text</h3>
                    <p className="text-[11px] text-slate-400">Clean normalized text extracted by unpdf</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Search / Filter Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Find keyword..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-slate-950/80 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>

                  {/* Copy Button */}
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300 hover:text-indigo-200 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-3 py-1.5 rounded-xl transition cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>

                  {/* Upload Another Button */}
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-xl transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Upload Another</span>
                  </button>
                </div>
              </div>

              {/* Code Viewer / Monospace Area */}
              <div className="bg-slate-950 p-4 sm:p-6 max-h-[500px] overflow-y-auto font-mono text-xs leading-relaxed">
                <div className="space-y-1">
                  {textLines.map((line, idx) => {
                    const isMatched =
                      searchQuery.trim() !== "" &&
                      line.toLowerCase().includes(searchQuery.toLowerCase());

                    return (
                      <div
                        key={idx}
                        className={`flex items-start gap-4 px-2 py-0.5 rounded transition ${
                          isMatched
                            ? "bg-amber-500/20 text-amber-200 font-semibold"
                            : "hover:bg-slate-900/60 text-slate-300"
                        }`}
                      >
                        <span className="w-8 text-right text-slate-600 select-none text-[11px] shrink-0">
                          {idx + 1}
                        </span>
                        <span className="flex-1 whitespace-pre-wrap break-words">{line || "\u00A0"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer status */}
              <div className="p-4 bg-slate-900/60 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Sprint 3 Complete • Ready for Sprint 4 (Structured Biomarker Extraction)</span>
                </div>
                <span className="text-[11px] text-slate-500">
                  {textLines.length} lines parsed
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
