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
  FlaskConical,
  HeartPulse,
  Activity,
} from "lucide-react";

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

// Sample clinical lab report texts for instant 1-click testing
const SAMPLE_REPORTS = [
  {
    title: "Comprehensive Metabolic & Lipid Panel",
    filename: "Metabolic_Lipid_Panel_Report.pdf",
    icon: HeartPulse,
    badge: "Metabolic / Cardiac",
    text: `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >> endobj
4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
5 0 obj << /Length 750 >> stream
BT
/F1 12 Tf
50 720 Td
(METROPOLITAN CLINICAL LABORATORY - DIAGNOSTIC REPORT) Tj
0 -20 Td
(Patient Name: Alexander Wright | Age: 52 | Gender: Male | Collection Date: 2026-03-02) Tj
0 -25 Td
(COMPREHENSIVE METABOLIC PANEL (CMP):) Tj
0 -15 Td
(Fasting Blood Glucose: 138 mg/dL [Reference: 70 - 99] - Status: HIGH) Tj
0 -15 Td
(Hemoglobin A1c: 6.8 % [Reference: 4.0 - 5.6] - Status: HIGH) Tj
0 -15 Td
(Serum Creatinine: 1.05 mg/dL [Reference: 0.70 - 1.30] - Status: NORMAL) Tj
0 -15 Td
(eGFR: 88 mL/min/1.73m2 [Reference: > 60] - Status: NORMAL) Tj
0 -15 Td
(Blood Urea Nitrogen (BUN): 18 mg/dL [Reference: 7 - 20] - Status: NORMAL) Tj
0 -15 Td
(Sodium: 140 mEq/L [Reference: 136 - 145] - Status: NORMAL) Tj
0 -15 Td
(Potassium: 4.4 mEq/L [Reference: 3.5 - 5.1] - Status: NORMAL) Tj
0 -25 Td
(LIPID PROFILE PANEL:) Tj
0 -15 Td
(Total Cholesterol: 242 mg/dL [Reference: < 200] - Status: HIGH) Tj
0 -15 Td
(Triglycerides: 215 mg/dL [Reference: < 150] - Status: HIGH) Tj
0 -15 Td
(HDL Cholesterol: 38 mg/dL [Reference: > 40] - Status: LOW) Tj
0 -15 Td
(LDL Cholesterol (Calculated): 161 mg/dL [Reference: < 100] - Status: HIGH) Tj
0 -15 Td
(Non-HDL Cholesterol: 204 mg/dL [Reference: < 130] - Status: HIGH) Tj
0 -25 Td
(LIVER FUNCTION TESTS:) Tj
0 -15 Td
(ALT (Alanine Aminotransferase): 42 U/L [Reference: 10 - 40] - Status: BORDERLINE) Tj
0 -15 Td
(AST (Aspartate Aminotransferase): 29 U/L [Reference: 10 - 35] - Status: NORMAL) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000240 00000 n 
0000000318 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
1120
%%EOF`,
  },
  {
    title: "Complete Blood Count (CBC) with Anemia Panel",
    filename: "CBC_Anemia_Panel_Report.pdf",
    icon: FlaskConical,
    badge: "Hematology",
    text: `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >> endobj
4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
5 0 obj << /Length 750 >> stream
BT
/F1 12 Tf
50 720 Td
(ST. JUDE HEALTH SYSTEM - HEMATOLOGY LAB REPORT) Tj
0 -20 Td
(Patient Name: Clara Evans | Age: 36 | Gender: Female | Date: 2026-03-05) Tj
0 -25 Td
(COMPLETE BLOOD COUNT (CBC):) Tj
0 -15 Td
(Hemoglobin (Hgb): 10.1 g/dL [Reference: 12.0 - 16.0] - Status: LOW) Tj
0 -15 Td
(Hematocrit (Hct): 31.2 % [Reference: 36.0 - 48.0] - Status: LOW) Tj
0 -15 Td
(Red Blood Cell (RBC) Count: 3.45 M/uL [Reference: 4.0 - 5.2] - Status: LOW) Tj
0 -15 Td
(MCV (Mean Corpuscular Volume): 72.4 fL [Reference: 80 - 100] - Status: LOW) Tj
0 -15 Td
(MCH: 23.1 pg [Reference: 27 - 33] - Status: LOW) Tj
0 -15 Td
(MCHC: 30.5 g/dL [Reference: 32 - 36] - Status: LOW) Tj
0 -15 Td
(RDW (Red Cell Distribution Width): 16.8 % [Reference: 11.5 - 14.5] - Status: HIGH) Tj
0 -15 Td
(White Blood Cell (WBC) Count: 6.4 10^3/uL [Reference: 4.5 - 11.0] - Status: NORMAL) Tj
0 -15 Td
(Platelet Count: 310 10^3/uL [Reference: 150 - 450] - Status: NORMAL) Tj
0 -25 Td
(IRON AND FERRITIN STUDIES:) Tj
0 -15 Td
(Serum Ferritin: 8.5 ng/mL [Reference: 15 - 150] - Status: CRITICAL) Tj
0 -15 Td
(Serum Iron: 32 ug/dL [Reference: 50 - 170] - Status: LOW) Tj
0 -15 Td
(Total Iron Binding Capacity (TIBC): 445 ug/dL [Reference: 250 - 400] - Status: HIGH) Tj
0 -15 Td
(Transferrin Saturation: 7.2 % [Reference: 20 - 50] - Status: LOW) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000240 00000 n 
0000000318 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
1120
%%EOF`,
  },
  {
    title: "Thyroid & Endocrine Function Profile",
    filename: "Thyroid_Endocrine_Profile.pdf",
    icon: Activity,
    badge: "Endocrinology",
    text: `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >> endobj
4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
5 0 obj << /Length 750 >> stream
BT
/F1 12 Tf
50 720 Td
(ADVANCED ENDOCRINE LABS - CLINICAL REPORT) Tj
0 -20 Td
(Patient Name: David Miller | Age: 44 | Gender: Male | Date: 2026-03-07) Tj
0 -25 Td
(THYROID PROFILE:) Tj
0 -15 Td
(TSH (Thyroid Stimulating Hormone): 6.85 uIU/mL [Reference: 0.45 - 4.50] - Status: HIGH) Tj
0 -15 Td
(Free T4 (Thyroxine): 0.72 ng/dL [Reference: 0.82 - 1.77] - Status: LOW) Tj
0 -15 Td
(Free T3 (Triiodothyronine): 2.4 pg/mL [Reference: 2.0 - 4.4] - Status: NORMAL) Tj
0 -15 Td
(Thyroid Peroxidase Antibodies (TPOAb): 128 IU/mL [Reference: < 35] - Status: HIGH) Tj
0 -25 Td
(VITAMINS AND HORMONES:) Tj
0 -15 Td
(Vitamin D (25-Hydroxy): 19.4 ng/mL [Reference: 30 - 100] - Status: LOW) Tj
0 -15 Td
(Vitamin B12: 460 pg/mL [Reference: 200 - 900] - Status: NORMAL) Tj
0 -15 Td
(hs-CRP (High Sensitivity C-Reactive Protein): 3.8 mg/L [Reference: < 1.0] - Status: HIGH) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000240 00000 n 
0000000318 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
1120
%%EOF`,
  },
];

export const Dropzone: React.FC<DropzoneProps> = ({ onFileSelect, isLoading = false }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate the file before passing to parent
  const validateAndPass = (file: File) => {
    setError(null);

    const allowedMimes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
    ];
    const isAllowedExt = /\.(pdf|png|jpe?g|webp)$/i.test(file.name);

    if (!allowedMimes.includes(file.type) && !isAllowedExt) {
      setError("Please select a genuine PDF report or Lab Image (PNG, JPG, WEBP).");
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

  // Load a built-in realistic PDF report for instant demonstration
  const handleLoadSample = (sample: typeof SAMPLE_REPORTS[0]) => {
    if (isLoading) return;
    const blob = new Blob([sample.text], { type: "application/pdf" });
    const file = new File([blob], sample.filename, { type: "application/pdf" });
    validateAndPass(file);
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
    <div className="w-full space-y-6">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`group relative overflow-hidden rounded-3xl border-2 border-dashed p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 ${isDragActive
            ? "border-indigo-500 bg-indigo-950/40 scale-[1.01] shadow-2xl shadow-indigo-500/20"
            : "border-slate-800 hover:border-indigo-500/60 bg-slate-900/60 hover:bg-slate-900/90 shadow-xl backdrop-blur-md"
          } ${isLoading ? "pointer-events-none opacity-85" : ""}`}
      >
        {/* Subtle background glow effect */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none group-hover:opacity-100 transition-opacity" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none group-hover:opacity-100 transition-opacity" />

        {/* Hidden Native File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf,image/png,image/jpeg,image/jpg,image/webp"
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
            className={`p-5 rounded-2xl transition-all duration-300 shadow-md ${isLoading
                ? "bg-indigo-600 text-white animate-pulse"

                : selectedFile

                  ? "bg-emerald-600 text-white scale-105 shadow-emerald-600/30"
                  : isDragActive
                    ? "bg-indigo-600 text-white scale-110 shadow-indigo-600/30"
                    : "bg-slate-800/80 text-indigo-400 border border-slate-700/60 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-105"
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
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {isLoading
                ? "Analyzing Lab Report with AI..."
                : selectedFile
                  ? selectedFile.name
                  : "Drag & Drop your Lab Report PDF or CBC Image"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              {isLoading
                ? "Extracting clinical panels, checking reference ranges, and generating AI insights..."
                : "Browse from your computer or drag your digital PDF or CBC scan/photo here"}
            </p>
          </div>

          {/* Action Button & Badges */}
          {!isLoading && !selectedFile && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                <Sparkles className="w-3 h-3 text-indigo-400" /> PDF, PNG, JPG up to 20MB
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Vision AI & Magic-Byte Verification
              </span>
            </div>
          )}

          {/* File Selected Badge */}
          {selectedFile && !error && !isLoading && (
            <div className="inline-flex items-center gap-2 text-xs text-emerald-300 font-semibold bg-emerald-500/15 border border-emerald-500/30 px-4 py-1.5 rounded-full shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Ready for Analysis</span>
              <span className="text-emerald-400/50">•</span>
              <span className="font-mono">{(selectedFile.size / 1024).toFixed(1)} KB</span>
            </div>
          )}

          {/* Error Badge */}
          {error && (
            <div className="inline-flex items-center gap-2 text-xs text-rose-300 font-semibold bg-rose-500/15 border border-rose-500/30 px-4 py-1.5 rounded-full">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Instant 1-Click Sample Reports Section */}
      {!isLoading && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Don't have a PDF? Try a 1-Click Sample Lab Report:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SAMPLE_REPORTS.map((sample, idx) => {
              const Icon = sample.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleLoadSample(sample)}
                  className="p-3.5 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/50 text-left transition duration-200 group flex flex-col justify-between backdrop-blur-sm"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 group-hover:border-indigo-500/30">
                      {sample.badge}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-slate-200 group-hover:text-white transition-colors leading-tight">
                      {sample.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 group-hover:text-indigo-300">
                      Click to analyze now →
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
