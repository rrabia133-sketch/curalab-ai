import React, { useState } from "react";
import { MessageSquarePlus, Stethoscope, Copy, Check, Sparkles } from "lucide-react";

export const DoctorQuestionsCard: React.FC<{ questions: string[] }> = ({ questions }) => {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const copyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    if (!questions || questions.length === 0) return null;

    return (
        <div className="bg-gradient-to-br from-indigo-950/80 via-slate-900/90 to-slate-900/80 rounded-2xl p-6 border border-indigo-500/20 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-400">
                        <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-base sm:text-lg text-white">Doctor Discussion Guide</h3>
                        <p className="text-xs text-slate-400">Tailored talking points for your upcoming consultation</p>
                    </div>
                </div>

                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    {questions.length} Questions
                </span>
            </div>

            <div className="space-y-3">
                {questions.map((q, idx) => (
                    <div
                        key={idx}
                        className="flex items-start justify-between gap-3 p-3.5 bg-slate-800/50 hover:bg-slate-800/80 rounded-xl border border-slate-700/50 transition duration-150 group"
                    >
                        <div className="flex items-start gap-3">
                            <MessageSquarePlus className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{q}</p>
                        </div>
                        <button
                            onClick={() => copyToClipboard(q, idx)}
                            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700/60 transition shrink-0"
                            title="Copy Question"
                        >
                            {copiedIndex === idx ? (
                                <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                                <Copy className="w-4 h-4 group-hover:text-indigo-300" />
                            )}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
