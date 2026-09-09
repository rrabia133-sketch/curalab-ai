import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

// Ordered list of Groq models to try (from smartest to fastest)

const GROQ_MODELS = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "groq/compound",
    "groq/compound-mini",
    "qwen/qwen3.6-27b",
    "qwen/qwen3.8-27b"
];

export class ModelManager {
    private groq: Groq | null = null;
    private ollamaBaseUrl: string;
    private ollamaModel: string;
    private enableOllama: boolean;

    constructor() {
        // 1. Initialize Groq SDK if a valid API key exists in .env
        const rawApiKey = (process.env.GROQ_API_KEY || "").trim().replace(/^["']|["']$/g, "");
        if (rawApiKey && !rawApiKey.includes("your_groq_api_key")) {
            this.groq = new Groq({ apiKey: rawApiKey });
        }

        // 2. Configure local Ollama settings from .env
        this.ollamaBaseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
        this.ollamaModel = process.env.OLLAMA_MODEL || "llama3.1:8b";
        this.enableOllama = process.env.ENABLE_OLLAMA_FALLBACK === "true";
    }

    /**
     * Sends a prompt through the cascading AI tiers until one succeeds.
     */
    async generateChatCompletion(
        messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
        temperature: number = 0.1,
        jsonMode: boolean = false
    ): Promise<string> {

        // Tier 1: Try Groq Cloud models in order
        if (this.groq) {
            for (const model of GROQ_MODELS) {
                try {
                    console.log(`🤖 Trying Groq model: ${model}...`);
                    const response = await this.groq.chat.completions.create({
                        model,
                        messages,
                        temperature,
                        response_format: jsonMode ? { type: "json_object" } : undefined,
                    });

                    let content = response.choices[0]?.message?.content;
                    if (content) {
                        content = content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
                        console.log(`✅ Success with Groq model: ${model}`);
                        return content;
                    }
                } catch (err: any) {
                    console.warn(`⚠️ Groq model ${model} failed (${err.status || err.name}): ${err.message}. Cascading to next model...`);
                }
            }
        } else {
            console.warn("⚠️ No GROQ_API_KEY found in backend/.env. Skipping Groq cloud models.");
        }

        // Tier 2: Fallback to local Ollama if enabled
        if (this.enableOllama) {
            try {
                console.log(`🔄 Attempting Local Ollama fallback (${this.ollamaModel})...`);

                const response = await fetch(`${this.ollamaBaseUrl}/api/chat`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        model: this.ollamaModel,
                        messages,
                        stream: false,
                        format: jsonMode ? "json" : undefined,
                        options: { temperature },
                    }),
                });

                if (!response.ok) {
                    throw new Error(`Ollama responded with HTTP ${response.status}`);
                }

                const data = (await response.json()) as { message?: { content?: string } };
                const content = data?.message?.content;

                if (content) {
                    console.log(`✅ Success with Local Ollama fallback!`);
                    return content;
                }
            } catch (ollamaErr: any) {
                console.error("❌ Ollama fallback failed:", ollamaErr.message);
            }
        }

        // If both Groq and Ollama failed
        throw new Error("All AI models in cascade exhausted. Please verify your GROQ_API_KEY or Ollama setup.");
    }
}

// Export a single shared instance to use across our app
export const modelManager = new ModelManager();
