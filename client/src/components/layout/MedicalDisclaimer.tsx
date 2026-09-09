import React from "react";
import { ShieldAlert } from "lucide-react";

export const MedicalDisclaimer: React.FC<{ className?: string }> = ({ className = "" }) => {
    return (
        <div
            className={`p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200/90 shadow-lg backdrop-blur-sm ${className}`}
        >
            <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="font-semibold text-sm text-amber-300 mb-0.5">
                        Important Clinical & Educational Disclaimer
                    </h4>
                    <p className="text-xs leading-relaxed text-amber-200/80">
                        CuraLab AI provides automated biomarker parsing and educational explanations only. It is <strong>not a medical device</strong> and does <strong>not provide clinical diagnosis, medical treatment, or prescriptions</strong>. Always consult your certified healthcare provider or physician before making any clinical decisions.
                    </p>
                </div>
            </div>
        </div>
    );
};
