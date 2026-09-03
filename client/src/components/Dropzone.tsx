// client/src/components/Dropzone.tsx
import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onFileSelect, isLoading = false }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate the file before passing to parent
  const validateAndPass = (file: File) => {
    setError(null);

    // 1. Check if the file is a PDF
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please select a genuine PDF report (.pdf format only).");
      return;
    }

    // 2. Client-side size boundary (20MB)
    if (file.size > 20 * 1024 * 1024) {
      setError("File exceeds the 20MB maximum size limit.");
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);
  };

  // Handle Drag Over & Enter
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  // Handle Drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndPass(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`group relative overflow-hidden rounded-3xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-300 ${
          isDragActive
            ? "border-indigo-500 bg-indigo-50/80 scale-[1.01] shadow-xl shadow-indigo-500/10"
            : "border-slate-200 hover:border-indigo-400 bg-white hover:bg-slate-50/60 shadow-sm hover:shadow-md"
        } ${isLoading ? "pointer-events-none opacity-80" : ""}`}
      >
        {/* Subtle background glow effect */}
        <div className="absolute -right-20 -top-20 w-56 h-56 bg-indigo-100 rounded-full blur-3xl opacity-40 pointer-events-none group-hover:opacity-70 transition-opacity" />
        <div className="absolute -left-20 -bottom-20 w-56 h-56 bg-blue-100 rounded-full blur-3xl opacity-40 pointer-events-none group-hover:opacity-70 transition-opacity" />

        {/* Hidden Native File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          disabled={isLoading}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              validateAndPass(e.target.files[0]);
            }
          }}
        />

        <div className="relative z-10 flex flex-col items-center justify-center gap-4">
          {/* Animated Icon Avatar */}
          <div
            className={`p-5 rounded-2xl transition-all duration-300 shadow-xs ${
              isLoading
                ? "bg-indigo-600 text-white animate-pulse"
                : selectedFile
                ? "bg-emerald-500 text-white scale-105 shadow-emerald-500/20 shadow-lg"
                : isDragActive
                ? "bg-indigo-600 text-white scale-110 shadow-indigo-500/20 shadow-lg"
                : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 group-hover:scale-105"
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : selectedFile ? (
              <FileText className="w-8 h-8" />
            ) : (
              <UploadCloud className="w-8 h-8 transition-transform group-hover:-translate-y-0.5" />
            )}
          </div>

          {/* Heading and helper text */}
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">
              {isLoading
                ? "Extracting Medical Content..."
                : selectedFile
                ? selectedFile.name
                : "Drop your Lab Report PDF here"}
            </h3>
            <p className="text-sm text-slate-500">
              {isLoading
                ? "Checking magic-byte headers and parsing with unpdf..."
                : "Drag and drop your clinical file here, or click to browse files from your computer"}
            </p>
          </div>

          {/* Action Button & Badges */}
          {!isLoading && !selectedFile && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                <Sparkles className="w-3.5 h-3.5" /> PDF up to 20MB
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> In-Memory Magic-Bytes Validation
              </span>
            </div>
          )}

          {/* File Selected Badge */}
          {selectedFile && !error && !isLoading && (
            <div className="inline-flex items-center gap-2 text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-4 py-1.5 rounded-full shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Ready for Analysis</span>
              <span className="text-emerald-400">•</span>
              <span className="font-mono">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
            </div>
          )}

          {/* Error Badge */}
          {error && (
            <div className="inline-flex items-center gap-2 text-xs text-rose-700 font-semibold bg-rose-50 border border-rose-200 px-4 py-1.5 rounded-full">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
