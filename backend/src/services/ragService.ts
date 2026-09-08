// backend/src/services/ragService.ts
import { supabaseAdmin } from "../lib/supabase.js";
import { chunkReportText, generateEmbedding } from "./embeddingService.js";

/**
 * Chunks, embeds, and stores a report in Supabase pgvector.
 */
export async function indexReportForRag(sessionId: string, reportText: string): Promise<number> {
    const chunks = chunkReportText(reportText);
    if (chunks.length === 0) return 0;

    console.log(`📦 Indexing ${chunks.length} chunks for session: ${sessionId}...`);

    for (const chunk of chunks) {
        const embedding = await generateEmbedding(chunk.text);

        const { error } = await supabaseAdmin.from("report_embeddings").insert({
            session_id: sessionId,
            chunk_text: chunk.text,
            chunk_index: chunk.index,
            embedding,
        });

        if (error) {
            console.error(`❌ Error inserting chunk ${chunk.index}:`, error);
        }
    }

    console.log(`✅ Vector indexing completed for session: ${sessionId}`);
    return chunks.length;
}

/**
 * Searches the report embeddings using cosine similarity RPC.
 */
export async function retrieveRelevantChunks(
    sessionId: string,
    userQuery: string,
    matchCount = 3
): Promise<string[]> {
    try {
        const queryVector = await generateEmbedding(userQuery);

        const { data, error } = await supabaseAdmin.rpc("match_report_chunks", {
            query_embedding: queryVector,
            match_session_id: sessionId,
            match_count: matchCount,
        });

        if (error) {
            console.error("❌ Vector Search RPC Error:", error);
            return [];
        }

        return (data || []).map((row: { chunk_text: string }) => row.chunk_text);
    } catch (err) {
        console.error("❌ Failed to retrieve chunks:", err);
        return [];
    }
}
