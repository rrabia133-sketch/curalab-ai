// backend/src/services/ragService.ts
import { getUserSupabaseClient, supabaseAdmin } from "../lib/supabase.js";
import { chunkReportText, generateEmbedding } from "./embeddingService.js";

// In-memory vector / chunk store fallback for sessions
export interface StoredSession {
    sessionId: string;
    userId: string;
    reportTitle: string;
    reportText: string;
    analysisResult: any;
    chunks: string[];
    createdAt: Date;
}

export const memorySessionStore = new Map<string, StoredSession>();

/**
 * Chunks, embeds, and stores a report in Supabase pgvector and in-memory store.
 */
export async function indexReportForRag(
    sessionId: string,
    reportText: string,
    userToken?: string
): Promise<number> {
    const chunks = chunkReportText(reportText);
    if (chunks.length === 0) return 0;

    console.log(`📦 Indexing ${chunks.length} chunks for session: ${sessionId}...`);

    // Store in memory cache
    const existing = memorySessionStore.get(sessionId);
    if (existing) {
        existing.chunks = chunks.map((c) => c.text);
    }

    const client = getUserSupabaseClient(userToken);

    for (const chunk of chunks) {
        try {
            const embedding = await generateEmbedding(chunk.text);

            const { error } = await client.from("report_embeddings").insert({
                session_id: sessionId,
                chunk_text: chunk.text,
                chunk_index: chunk.index,
                embedding,
            });

            if (error) {
                // If table doesn't exist or RLS triggers, log warning and continue
                console.warn(`⚠️ Warning inserting chunk ${chunk.index} into Supabase:`, error.message);
            }
        } catch (err: any) {
            console.warn(`⚠️ Chunk indexing error for chunk ${chunk.index}:`, err.message);
        }
    }

    console.log(`✅ Vector indexing completed for session: ${sessionId}`);
    return chunks.length;
}

/**
 * Searches the report embeddings using cosine similarity RPC or in-memory fallback.
 */
export async function retrieveRelevantChunks(
    sessionId: string,
    userQuery: string,
    matchCount = 3,
    userToken?: string
): Promise<string[]> {
    // 1. Try Supabase pgvector RPC
    try {
        const client = getUserSupabaseClient(userToken);
        const queryVector = await generateEmbedding(userQuery);

        const { data, error } = await client.rpc("match_report_chunks", {
            query_embedding: queryVector,
            match_session_id: sessionId,
            match_count: matchCount,
        });

        if (!error && Array.isArray(data) && data.length > 0) {
            return data.map((row: { chunk_text: string }) => row.chunk_text);
        }
    } catch (err) {
        console.warn("⚠️ Supabase vector search RPC warning:", err);
    }

    // 2. Fallback: Search in-memory session chunks
    const session = memorySessionStore.get(sessionId);
    if (session && session.chunks.length > 0) {
        const lowerQuery = userQuery.toLowerCase();
        const queryTerms = lowerQuery.split(/\s+/).filter((t) => t.length > 3);

        const scored = session.chunks.map((chunk) => {
            const lowerChunk = chunk.toLowerCase();
            let score = 0;
            for (const term of queryTerms) {
                if (lowerChunk.includes(term)) score += 1;
            }
            return { chunk, score };
        });

        scored.sort((a, b) => b.score - a.score);
        const topChunks = scored.slice(0, matchCount).map((s) => s.chunk);
        if (topChunks.length > 0) return topChunks;
    }

    // 3. Last fallback: return raw report text excerpt if available
    if (session?.reportText) {
        return [session.reportText.slice(0, 1500)];
    }

    return [];
}
