import React, { useState, useRef, useEffect } from "react";
import {
    Send,
    Bot,
    User,
    Loader2,
    Sparkles,
    AlertCircle,
    Copy,
    Check,
    ShieldAlert,
    Stethoscope,
    Apple,
    HelpCircle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { FormattedMessage } from "./FormattedMessage";

interface Message {
    role: "user" | "assistant";
    content: string;
    timestamp?: string;
}

interface PromptCategory {
    label: string;
    icon: React.ReactNode;
    prompt: string;
}

const PROMPT_SUGGESTIONS: PromptCategory[] = [
    {
        label: "Explain Flagged Biomarkers",
        icon: <Stethoscope className="w-3.5 h-3.5 text-rose-400" />,
        prompt: "Can you explain my out-of-range or flagged biomarkers in simple terms?",
    },
    {
        label: "Questions for Doctor",
        icon: <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />,
        prompt: "What are the top 3 priority questions I should ask my doctor based on this report?",
    },
    {
        label: "Diet & Lifestyle Insights",
        icon: <Apple className="w-3.5 h-3.5 text-emerald-400" />,
        prompt: "What lifestyle or dietary factors commonly relate to these specific lab findings?",
    },
];

const getCurrentTime = () => {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export const ChatDrawer: React.FC<{ sessionId: string; reportTitle?: string }> = ({
    sessionId,
    reportTitle,
}) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content:
                "Hello! I am your CuraLab clinical AI assistant. I have reviewed your lab report.\n\nAsk me any question about your biomarkers, reference ranges, or recommendations.",
            timestamp: getCurrentTime(),
        },
    ]);
    const [input, setInput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamError, setStreamError] = useState<string | null>(null);
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Copy message text to clipboard
    const copyToClipboard = (text: string, idx: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 2000);
    };

    // Auto-scroll to bottom whenever messages update
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isStreaming]);

    const handleSend = async (messageText?: string) => {
        const textToSend = (messageText || input).trim();
        if (!textToSend || isStreaming) return;

        const sentTime = getCurrentTime();
        setInput("");
        setStreamError(null);

        // 1. Append user message and placeholder for assistant
        setMessages((prev) => [
            ...prev,
            { role: "user", content: textToSend, timestamp: sentTime },
            { role: "assistant", content: "", timestamp: sentTime },
        ]);
        setIsStreaming(true);

        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

        try {
            // 2. Fetch authenticated user session token or fallback to demo guest token
            const {
                data: { session },
            } = await supabase.auth.getSession();
            const authToken = session?.access_token || "demo-guest-token";

            const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    sessionId,
                    message: textToSend,
                }),
            });

            if (!response.ok) {
                throw new Error(`Server returned HTTP ${response.status}`);
            }

            // 3. Read SSE Stream
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) throw new Error("Stream reader not available");

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split("\n\n");

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const dataStr = line.replace("data: ", "").trim();

                        if (dataStr === "[DONE]") {
                            break;
                        }

                        try {
                            const parsed = JSON.parse(dataStr);
                            if (parsed.error) {
                                throw new Error(parsed.error);
                            }
                            if (parsed.token) {
                                setMessages((prev) => {
                                    const updated = [...prev];
                                    const lastIdx = updated.length - 1;
                                    updated[lastIdx] = {
                                        ...updated[lastIdx],
                                        content: updated[lastIdx].content + parsed.token,
                                    };
                                    return updated;
                                });
                            }
                        } catch (err: any) {
                            if (err.message && !dataStr.startsWith("{")) {
                                // Ignore raw SSE control strings
                            }
                        }
                    }
                }
            }
        } catch (err: any) {
            console.error("Chat Stream Error:", err);
            setStreamError(err.message || "Failed to get response from clinical assistant.");
            setMessages((prev) => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (updated[lastIdx].role === "assistant" && !updated[lastIdx].content) {
                    updated[lastIdx].content =
                        "I encountered an error retrieving this answer. Please check your connection and try again.";
                }
                return updated;
            });
        } finally {
            setIsStreaming(false);
        }
    };

    return (
        <div className="flex flex-col h-[640px] bg-slate-900/95 border border-slate-800/90 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-slate-800/80 bg-slate-900/70 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="p-2 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-400">
                            <Bot className="w-5 h-5" />
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                            Clinical RAG Assistant
                            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-indigo-400" /> Grounded
                            </span>
                        </h3>
                        <p className="text-xs text-slate-400 truncate max-w-[220px] sm:max-w-xs">
                            {reportTitle || "Active Lab Session"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Medical Disclaimer Bar */}
            <div className="px-4 py-2 bg-indigo-950/40 border-b border-indigo-900/30 text-[11px] text-indigo-300/80 flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>For educational reference only. Consult your physician for medical decisions.</span>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m, idx) => (
                    <div
                        key={idx}
                        className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        {m.role === "assistant" && (
                            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                                <Bot className="w-4 h-4" />
                            </div>
                        )}

                        <div
                            className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[85%] shadow-lg ${
                                m.role === "user"
                                    ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-none shadow-indigo-600/20"
                                    : "bg-slate-800/80 border border-slate-700/60 text-slate-200 rounded-tl-none shadow-slate-950/40"
                            }`}
                        >
                            {/* Message Content */}
                            {m.content ? (
                                m.role === "assistant" ? (
                                    <FormattedMessage content={m.content} />
                                ) : (
                                    <div className="whitespace-pre-wrap break-words">{m.content}</div>
                                )
                            ) : (
                                <div className="flex items-center gap-2 text-indigo-300 py-1">
                                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                                    <span className="text-xs font-medium">Analyzing lab context & formulating response...</span>
                                </div>
                            )}

                            {/* Message Footer: Timestamp & Copy Action */}
                            <div className="flex items-center justify-between gap-4 mt-2.5 pt-2 border-t border-slate-700/40 text-[10px] text-slate-400">
                                <span>{m.timestamp || getCurrentTime()}</span>

                                {m.role === "assistant" && m.content && (
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(m.content, idx)}
                                        className="flex items-center gap-1 text-slate-400 hover:text-indigo-300 transition-colors"
                                        title="Copy response to clipboard"
                                    >
                                        {copiedIdx === idx ? (
                                            <>
                                                <Check className="w-3 h-3 text-emerald-400" />
                                                <span className="text-emerald-400 font-medium">Copied</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-3 h-3" />
                                                <span>Copy</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        {m.role === "user" && (
                            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                                <User className="w-4 h-4" />
                            </div>
                        )}
                    </div>
                ))}

                {streamError && (
                    <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{streamError}</span>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Suggested Prompt Chips */}
            {messages.length <= 2 && !isStreaming && (
                <div className="px-4 py-2.5 border-t border-slate-800/80 flex flex-wrap gap-2 bg-slate-950/50">
                    {PROMPT_SUGGESTIONS.map((item, i) => (
                        <button
                            key={i}
                            onClick={() => handleSend(item.prompt)}
                            className="text-[11px] px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-indigo-600/20 hover:border-indigo-500/40 hover:text-indigo-200 border border-slate-700/60 text-slate-300 transition flex items-center gap-1.5 group"
                        >
                            <span className="group-hover:scale-110 transition-transform">{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Input Form */}
            <div className="p-3.5 border-t border-slate-800/90 bg-slate-900/90">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSend();
                    }}
                    className="flex items-center gap-2"
                >
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask a question about your biomarkers..."
                        disabled={isStreaming}
                        className="flex-1 bg-slate-950/70 border border-slate-700/70 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={isStreaming || !input.trim()}
                        className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl transition duration-150 shadow-md shadow-indigo-600/20 shrink-0"
                        title="Send Question"
                    >
                        {isStreaming ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

