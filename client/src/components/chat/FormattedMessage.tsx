import React from "react";

interface FormattedMessageProps {
    content: string;
}

export const FormattedMessage: React.FC<FormattedMessageProps> = ({ content }) => {
    // Split content by line breaks
    const lines = content.split("\n");

    return (
        <div className="space-y-2 text-xs sm:text-sm leading-relaxed text-slate-200">
            {lines.map((line, idx) => {
                const trimmed = line.trim();

                // 1. Dividers (--- or ***)
                if (trimmed === "---" || trimmed === "***") {
                    return <hr key={idx} className="border-slate-700/60 my-2" />;
                }

                // 2. Headings (#, ##, ###)
                if (trimmed.startsWith("# ")) {
                    return (
                        <h3 key={idx} className="text-base font-bold text-white mt-3 mb-1">
                            {trimmed.replace("# ", "")}
                        </h3>
                    );
                }
                if (trimmed.startsWith("## ")) {
                    return (
                        <h4 key={idx} className="text-sm font-bold text-indigo-200 mt-2.5 mb-1">
                            {trimmed.replace("## ", "")}
                        </h4>
                    );
                }
                if (trimmed.startsWith("### ")) {
                    return (
                        <h5 key={idx} className="text-xs font-semibold uppercase tracking-wider text-indigo-300 mt-2 mb-0.5">
                            {trimmed.replace("### ", "")}
                        </h5>
                    );
                }

                // 3. Bullet points (- or *)
                if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                    const itemText = trimmed.replace(/^[-*]\s+/, "");
                    return (
                        <div key={idx} className="flex items-start gap-2 pl-1.5 py-0.5">
                            <span className="text-indigo-400 mt-1 shrink-0">•</span>
                            <span className="text-slate-200">{renderInlineFormatting(itemText)}</span>
                        </div>
                    );
                }

                // 4. Numbered lists (1. Item)
                if (/^\d+\.\s+/.test(trimmed)) {
                    const match = trimmed.match(/^(\d+\.)\s+(.*)/);
                    return (
                        <div key={idx} className="flex items-start gap-2 pl-1.5 py-0.5">
                            <span className="text-indigo-400 font-semibold shrink-0">{match?.[1]}</span>
                            <span className="text-slate-200">{renderInlineFormatting(match?.[2] || "")}</span>
                        </div>
                    );
                }

                // 5. Empty lines
                if (!trimmed) {
                    return <div key={idx} className="h-1" />;
                }

                // 6. Standard paragraph
                return (
                    <p key={idx} className="text-slate-200 leading-relaxed">
                        {renderInlineFormatting(line)}
                    </p>
                );
            })}
        </div>
    );
};

// Helper for bold, code, and highlighted clinical keywords
function renderInlineFormatting(text: string): React.ReactNode {
    // Regex matches bold (**bold**), code (`code`), or highlight
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

    return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            return (
                <strong key={i} className="font-semibold text-white">
                    {part.slice(2, -2)}
                </strong>
            );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
            return (
                <code
                    key={i}
                    className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-mono font-medium"
                >
                    {part.slice(1, -1)}
                </code>
            );
        }
        return part;
    });
}

