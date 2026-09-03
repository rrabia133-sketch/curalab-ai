
import { supabaseAdmin } from "./lib/supabase.js";
import { requireAuth, AuthenticatedRequest } from "./middleware/auth.js";


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
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

// Setup Multer to store uploaded files in memory
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
});


//use middleware
app.use(helmet());
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
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
        },
        clientUrl: CLIENT_ORIGIN,
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
        },
    });
});



app.listen(PORT, () => {
    console.log(`🚀 CuraLab Server listening on http://localhost:${PORT}`);
});