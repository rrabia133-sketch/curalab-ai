
import { supabaseAdmin } from "./lib/supabase.js";
import { requireAuth, AuthenticatedRequest } from "./middleware/auth.js";
import { extractBiomarkersFromText } from "./ai/AnalysisAgent.js";

import { indexReportForRag, retrieveRelevantChunks } from "./services/ragService.js";
import { modelManager } from "./ai/ModelManager.js";
import express, { Request, Response } from "express";   //import express
import cors from "cors";                                   //import cors for connecting frontend and backend
import helmet from "helmet";                              //import helmet for security
import dotenv from "dotenv";                              //import dotenv for environment variables
import multer from "multer";
import { validatePdfFile } from "./middleware/fileValidator.js";
import { parsePdfBuffer } from "./services/pdfService.js";



dotenv.config();                                    //configure dotenv

const app = express();
const PORT = process.env.PORT || 5000;

// Clean and parse CLIENT_ORIGIN (remove trailing slashes / whitespace)
const rawOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const clientOrigins = rawOrigin.split(",").map((o) => o.trim().replace(/\/$/, ""));

// Setup Multer to store uploaded files in memory
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
});

// Enable CORS with full preflight and origin reflection support
const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, server-to-server) or any origin (Vercel, localhost, previews)
        callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));



// Helmet security headers (configured not to block cross-origin API requests)
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json({ limit: "10mb" }));

// Root endpoint
app.get("/", (_req: Request, res: Response) => {
    res.json({
        message: "Welcome to CuraLab AI API Server",
        status: "online",
        endpoints: {
            health: "/health",
            dbCheck: "/api/db-check",
            me: "/api/me (Protected - requires Bearer token)",
            upload: "/api/reports/upload (Protected - POST multipart/form-data with 'file')",
            analyze: "/api/reports/analyze (Protected - POST multipart/form-data with 'file')",
            chatStream: "/api/chat/stream (Protected - POST SSE with sessionId & message)",
        },
        allowedOrigins: clientOrigins,
    });
});

// Health Check
app.get("/health", (_req: Request, res: Response) => {
    res.json({
        status: "healthy",
        service: "CuraLab AI API Server",
        timestamp: new Date().toISOString(),
    });
});

// Database check
app.get("/api/db-check", async (_req: Request, res: Response) => {
    try {
        const { data, error } = await supabaseAdmin
            .from("chat_sessions")
            .select("count", { count: "exact", head: true });
        if (error) throw error;
        res.json({ status: "connected", message: "Database connection successful!" });
    } catch (err: any) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

// Protected endpoint: Get current authenticated user profile
app.get("/api/me", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    // req.user is guaranteed to be present because requireAuth verified the Bearer token
    res.json({
        message: "Authenticated successfully",
        user: {
            id: req.user?.id,
            email: req.user?.email,
            role: req.user?.role,
            metadata: req.user?.user_metadata,
        },
    });
});

// PDF Upload & Extraction Endpoint
app.post(
    "/api/reports/upload",
    requireAuth,                  // Requires logged-in user
    upload.single("file"),        // Expects form field name 'file'
    validatePdfFile,              // Validates magic bytes & size
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            const file = req.file!;

            // Extract text from the verified PDF buffer
            const result = await parsePdfBuffer(file.buffer);
            res.status(200).json({
                success: true,
                message: "PDF text extracted successfully.",
                data: {
                    fileName: file.originalname,
                    fileSize: file.size,
                    totalPages: result.totalPages,
                    extractedText: result.text,
                    characterCount: result.text.length,
                },
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message || "Failed to process PDF report.",
            });
        }
    }
);

// Complete Analysis Pipeline Endpoint (Upload -> Extract Text -> AI Biomarker Analysis -> Save to Supabase)
app.post(
    "/api/reports/analyze",
    requireAuth,                  // 1. Must be logged in
    upload.single("file"),        // 2. Expects form field 'file'
    validatePdfFile,              // 3. Validates authentic PDF & size
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            const file = req.file!;
            const userId = req.user!.id;
            console.log(`📄 Starting analysis for file: ${file.originalname} (User: ${userId})`);
            // Step A: Extract raw text from PDF
            const { text, totalPages } = await parsePdfBuffer(file.buffer);
            // Step B: Run Cascading AI Model to extract structured biomarkers
            console.log(`🧠 Running AI biomarker extraction on ${text.length} characters...`);
            const analysisResult = await extractBiomarkersFromText(text);
            // Step C: Save record in Supabase database
            const reportTitle = file.originalname.replace(/\.pdf$/i, "");
            const { data: session, error: dbError } = await supabaseAdmin
                .from("chat_sessions")
                .insert({
                    user_id: userId,
                    report_title: reportTitle,
                    report_text: text,
                    analysis_result: analysisResult,
                    status: "completed",
                })
                .select()
                .single();
            if (dbError) {
                console.error("❌ Database save error:", dbError);
                throw dbError;
            }
            console.log(`✅ Analysis complete! Saved session ID: ${session.id}`);

            // Step C.1: Index text chunks into Supabase pgvector for semantic search (RAG)
            try {
                console.log(`📦 Generating pgvector embeddings for session ${session.id}...`);
                await indexReportForRag(session.id, text);
            } catch (indexErr) {
                console.warn("⚠️ Vector indexing warning:", indexErr);
            }

            // Step D: Send back structured result
            res.status(200).json({
                success: true,
                message: "Report analyzed successfully",
                data: {
                    sessionId: session.id,
                    reportTitle,
                    totalPages,
                    analysis: analysisResult,
                },
            });
        } catch (error: any) {
            console.error("❌ Analysis Endpoint Error:", error);
            res.status(500).json({
                success: false,
                error: error.message || "Failed to analyze lab report",
            });
        }
    }
);
// RAG Conversational Streaming Endpoint (SSE)
app.post(
    "/api/chat/stream",
    requireAuth,
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        const { sessionId, message } = req.body;
        const userId = req.user!.id;
        if (!sessionId || !message) {
            res.status(400).json({ error: "sessionId and message are required" });
            return;
        }
        // 1. Retrieve Relevant Document Chunks via Cosine Similarity
        const chunks = await retrieveRelevantChunks(sessionId, message, 3);
        const contextText = chunks.length > 0
            ? chunks.join("\n---\n")
            : "No specific text chunks found. Answer based on general laboratory knowledge.";
        // 2. Setup Server-Sent Events (SSE) Headers
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders?.();
        const systemPrompt = `You are CuraLab AI, an empathetic and highly accurate clinical laboratory AI assistant.
Answer the patient's questions based strictly on the provided lab report context.
CONTEXT FROM LAB REPORT:
${contextText}
CLINICAL GUIDELINES:
- Always cite specific biomarker values, units, and reference ranges when mentioned in the context.
- Explain medical terms in simple, empowering, and understandable language.
- Provide practical questions they can ask their doctor.
- Always include an educational disclaimer that this does not substitute professional medical advice.`;
        try {
            // 3. Generate response using Groq / Ollama cascade
            const fullAnswer = await modelManager.generateChatCompletion([
                { role: "system", content: systemPrompt },
                { role: "user", content: message },
            ]);
            // 4. Stream response word-by-word over SSE
            const words = fullAnswer.split(" ");
            for (let i = 0; i < words.length; i++) {
                const token = i === words.length - 1 ? words[i] : words[i] + " ";
                res.write(`data: ${JSON.stringify({ token })}\n\n`);
                await new Promise((resolve) => setTimeout(resolve, 20));
            }
            // 5. Save message history to Supabase
            await supabaseAdmin.from("chat_messages").insert([
                { session_id: sessionId, role: "user", content: message },
                {
                    session_id: sessionId,
                    role: "assistant",
                    content: fullAnswer,
                    metadata: { citations: chunks }
                },
            ]);
            // 6. Signal completion
            res.write("data: [DONE]\n\n");
            res.end();
        } catch (err: any) {
            console.error("❌ Chat Stream Error:", err);
            res.write(`data: ${JSON.stringify({ error: err.message || "Failed to generate response" })}\n\n`);
            res.end();
        }
    }
);
// 404 Handler for undefined routes (must be placed after all routes)
app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: "Not Found",
        message: `Cannot ${req.method} ${req.originalUrl}`,
        availableEndpoints: {
            root: "/",
            health: "/health",
            dbCheck: "/api/db-check",
            me: "/api/me (Protected)",
            upload: "/api/reports/upload (Protected - POST)",
            analyze: "/api/reports/analyze (Protected - POST)",
            chatStream: "/api/chat/stream (Protected - POST SSE)",
        },
    });
});



app.listen(PORT, () => {
    console.log(`🚀 CuraLab Server listening on http://localhost:${PORT}`);
});