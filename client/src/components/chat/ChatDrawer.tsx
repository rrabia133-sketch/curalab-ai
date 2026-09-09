import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";

interface Message {
    role: "user" | "assistant";
    content: string;
}

const SUGGESTED_PROMPTS = [
    "Explain my flagged biomarkers in simple terms.",
    "What dietary changes might help my results?",
    "What should I prioritize asking my doctor?",
];

export const ChatDrawer: React.FC<{ sessionId: string; reportTitle?: string }> = ({
    sessionId,
    reportTitle,
}) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content:
                "Hello! I am your CuraLab clinical AI assistant. I have reviewed your lab report. What questions do you have about your results?",
        },
    ]);
    const [input, setInput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamError, setStreamError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom whenever messages update
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isStreaming]);

    const handleSend = async (messageText?: string) => {
        const textToSend = (messageText || input).trim();
        if (!textToSend || isStreaming) return;

        setInput("");
        setStreamError(null);

        // 1. Append user message and placeholder for assistant
        setMessages((prev) => [
            ...prev,
            { role: "user", content: textToSend },
            { role: "assistant", content: "" },
        ]);
        setIsStreaming(true);

        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

        try {
            // 2. Fetch authenticated user session token
            const {
                data: { session },
            } = await supabase.auth.getSession();

            const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.access_token || ""}`,
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
        <div className="flex flex-col h-[600px] bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-400">
                        <Bot className="w-5 h-5" />
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

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m, idx) => (
                    <div
                        key={idx}
                        className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        {m.role === "assistant" && (
                            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                                <Bot className="w-4 h-4" />
                            </div>
                        )}

                        <div
                            className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[85%] ${m.role === "user"
                                    ? "bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/20"
                                    : "bg-slate-800/70 border border-slate-700/50 text-slate-200 rounded-tl-none"
                                }`}
                        >
                            {m.content ? (
                                <div className="whitespace-pre-wrap break-words">{m.content}</div>
                            ) : (
                                <div className="flex items-center gap-1.5 text-indigo-300 py-1">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-xs">Analyzing lab context...</span>
                                </div>
                            )}
                        </div>

                        {m.role === "user" && (
                            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
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

            {/* Suggested Chips (shown when few messages) */}
            {messages.length <= 2 && !isStreaming && (
                <div className="px-4 py-2 border-t border-slate-800/60 flex flex-wrap gap-1.5 bg-slate-950/40">
                    {SUGGESTED_PROMPTS.map((prompt, i) => (
                        <button
                            key={i}
                            onClick={() => handleSend(prompt)}
                            className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/70 hover:bg-indigo-600/20 hover:text-indigo-300 border border-slate-700/60 text-slate-300 transition"
                        >
                            {prompt}
                        </button>
                    ))}
                </div>
            )}

            {/* Input Form */}
            <div className="p-3 border-t border-slate-800 bg-slate-900/80">
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
                        className="flex-1 bg-slate-950/60 border border-slate-700/70 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition disabled:opacity-50"
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
