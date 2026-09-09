import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

// Ordered list of Groq models to try (from smartest to fastest)
const GROQ_MODELS = [
    "openai/gpt-oss-120b",
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "openai/gpt-oss-20b",
    "groq/compound",
    "groq/compound-mini",
    "qwen/qwen3.6-27b",
    "qwen/qwen3.8-27b"
];

// Ordered list of Groq Vision models for analyzing lab slips and CBC images
const GROQ_VISION_MODELS = [
    "llama-3.2-11b-vision-preview",
    "llama-3.2-90b-vision-preview",
];

export class ModelManager {
    private groq: Groq | null = null;
    private ollamaBaseUrl: string = "http://localhost:11434";
    private ollamaModel: string = "llama3.1:8b";
    private enableOllama: boolean = false;

    constructor() {
        this.initSettings();
    }

    private initSettings() {
        this.ollamaBaseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
        this.ollamaModel = process.env.OLLAMA_MODEL || "llama3.1:8b";
        this.enableOllama = process.env.ENABLE_OLLAMA_FALLBACK === "true";
    }

    private getGroq(): Groq | null {
        const rawApiKey = (process.env.GROQ_API_KEY || "").trim().replace(/^["']|["']$/g, "");
        if (rawApiKey && !rawApiKey.includes("your_groq_api_key")) {
            if (!this.groq) {
                this.groq = new Groq({ apiKey: rawApiKey });
            }
            return this.groq;
        }
        return null;
    }

    /**
     * Sends a prompt through the cascading AI tiers until one succeeds.
     */
    async generateChatCompletion(
        messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
        temperature: number = 0.1,
        jsonMode: boolean = false
    ): Promise<string> {
        this.initSettings();
        const groqClient = this.getGroq();
        const errorLogs: string[] = [];

        // Tier 1: Try Groq Cloud models in order
        if (groqClient) {
            for (const model of GROQ_MODELS) {
                try {
                    console.log(`🤖 Trying Groq model: ${model}...`);
                    const response = await groqClient.chat.completions.create({
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
                    const msg = `${model} error: ${err.message || err.status || "failed"}`;
                    console.warn(`⚠️ Groq model ${msg}. Cascading...`);
                    errorLogs.push(msg);
                }
            }
        } else {
            console.warn("⚠️ No GROQ_API_KEY found. Skipping Groq cloud models.");
            errorLogs.push("GROQ_API_KEY is missing or empty in environment");
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
                errorLogs.push(`Ollama: ${ollamaErr.message}`);
            }
        }

        // If all models failed
        throw new Error(`AI Extraction Failure: ${errorLogs.join(" | ")}`);
    }

    /**
     * Sends an image (e.g. CBC test slip, lab scan) to Groq Vision AI models.
     */
    async generateVisionCompletion(
        base64Image: string,
        mimeType: string,
        prompt: string
    ): Promise<string> {
        if (!this.groq) {
            throw new Error("GROQ_API_KEY is required in backend/.env to analyze lab images with Vision AI.");
        }

        for (const model of GROQ_VISION_MODELS) {
            try {
                console.log(`👁️ Analyzing lab image with Groq Vision (${model})...`);
                const response = await this.groq.chat.completions.create({
                    model,
                    messages: [
                        {
                            role: "user",
                            content: [
                                { type: "text", text: prompt },
                                {
                                    type: "image_url",
                                    image_url: {
                                        url: `data:${mimeType};base64,${base64Image}`,
                                    },
                                },
                            ],
                        },
                    ],
                    temperature: 0.1,
                    response_format: { type: "json_object" },
                });

                let content = response.choices[0]?.message?.content;
                if (content) {
                    content = content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
                    console.log(`✅ Success with Groq Vision model: ${model}`);
                    return content;
                }
            } catch (err: any) {
                console.warn(`⚠️ Vision model ${model} failed (${err.status || err.name}): ${err.message}. Trying next model...`);
            }
        }

        throw new Error("All Groq vision models failed to process the image. Please verify image clarity and API key.");
    }
}

// Export a single shared instance to use across our app
export const modelManager = new ModelManager();

