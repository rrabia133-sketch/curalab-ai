import React from "react";
import { CheckCircle2, AlertTriangle, AlertOctagon } from "lucide-react";

export interface Biomarker {
    name: string;
    value: number | null;
    unit: string;
    referenceRange: string;
    status: "NORMAL" | "LOW" | "HIGH" | "CRITICAL" | "BORDERLINE";
    clinicalSignificance: string;
    category?: string;
}

const statusConfig = {
    NORMAL: {
        bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
        badge: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
        icon: CheckCircle2,
    },
    LOW: {
        bg: "bg-amber-500/10 border-amber-500/20 text-amber-400",
        badge: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
        icon: AlertTriangle,
    },
    HIGH: {
        bg: "bg-rose-500/10 border-rose-500/20 text-rose-400",
        badge: "bg-rose-500/20 text-rose-300 border border-rose-500/30",
        icon: AlertOctagon,
    },
    BORDERLINE: {
        bg: "bg-orange-500/10 border-orange-500/20 text-orange-400",
        badge: "bg-orange-500/20 text-orange-300 border border-orange-500/30",
        icon: AlertTriangle,
    },
    CRITICAL: {
        bg: "bg-red-600/20 border-red-500/40 text-red-300",
        badge: "bg-red-500/30 text-red-200 border border-red-500/50",
        icon: AlertOctagon,
    },
};

export const BiomarkerCard: React.FC<{ biomarker: Biomarker }> = ({ biomarker }) => {
    const config = statusConfig[biomarker.status] || statusConfig.NORMAL;
    const Icon = config.icon;

    return (
        <div className={`p-4 rounded-2xl border ${config.bg} backdrop-blur-sm transition-all duration-200 hover:scale-[1.01] hover:shadow-lg flex flex-col justify-between`}>
            <div>
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <h4 className="font-semibold text-slate-100 text-sm sm:text-base leading-tight">
                            {biomarker.name}
                        </h4>
                        {biomarker.category && (
                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                                {biomarker.category}
                            </span>
                        )}
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 shrink-0 ${config.badge}`}>
                        <Icon className="w-3 h-3" />
                        {biomarker.status}
                    </span>
                </div>

                <div className="flex items-baseline gap-1.5 mt-3">
                    <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                        {biomarker.value !== null ? biomarker.value : "N/A"}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{biomarker.unit}</span>
                </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-700/50 text-xs space-y-1.5">
                <p className="text-slate-400 flex items-center gap-1">
                    <span className="font-semibold text-slate-300">Reference:</span> {biomarker.referenceRange || "Standard"}
                </p>
                <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-2">
                    {biomarker.clinicalSignificance}
                </p>
            </div>
        </div>
    );
};
