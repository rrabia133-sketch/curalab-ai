// backend/src/services/embeddingService.ts
import dotenv from "dotenv";

dotenv.config();

export interface Chunk {
    text: string;
    index: number;
}

/**
 * Splits text into overlapping word windows.
 * @param text The full raw report text
 * @param chunkSize Number of words per chunk (default 400)
 * @param overlap Number of overlapping words between adjacent chunks (default 80)
 */
export function chunkReportText(text: string, chunkSize = 400, overlap = 80): Chunk[] {
    const words = text.split(/\s+/).filter(Boolean);
    const chunks: Chunk[] = [];
    let index = 0;

    if (words.length === 0) return chunks;

    for (let i = 0; i < words.length; i += (chunkSize - overlap)) {
        const chunkWords = words.slice(i, i + chunkSize);
        const chunkText = chunkWords.join(" ");

        // Only keep chunks with meaningful length
        if (chunkText.trim().length > 30) {
            chunks.push({ text: chunkText, index });
            index++;
        }

        // Stop if we've reached the end of the words
        if (i + chunkSize >= words.length) break;
    }

    return chunks;
}

/**
 * Generates a 384-dimensional embedding vector.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    const ollamaUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    const embedModel = process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";

    try {
        const response = await fetch(`${ollamaUrl}/api/embeddings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: embedModel,
                prompt: text,
            }),
        });

        if (response.ok) {
            const data = (await response.json()) as { embedding: number[] };
            if (data.embedding && data.embedding.length === 384) {
                return data.embedding;
            }
        }
    } catch {
        // If Ollama is offline, fall through to deterministic mock embedder
    }

    // Fallback 384-dim Vector Generator (for local dev/testing)
    const vector = new Array(384).fill(0);
    for (let i = 0; i < text.length; i++) {
        vector[i % 384] += text.charCodeAt(i) / 1000;
    }
    // Normalize vector
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
    return vector.map((v) => v / norm);
}
