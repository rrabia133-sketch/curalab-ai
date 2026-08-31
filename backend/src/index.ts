import express, { Request, Response } from "express";   //import express
import cors from "cors";                                   //import cors for connecting frontend and backend
import helmet from "helmet";                              //import helmet for security
import dotenv from "dotenv";                              //import dotenv for environment variables

dotenv.config();                                    //configure dotenv

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

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

// 404 Handler for undefined routes
app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: "Not Found",
        message: `Cannot ${req.method} ${req.originalUrl}`,
        availableEndpoints: {
            root: "/",
            health: "/health",
        },
    });
});

app.listen(PORT, () => {
    console.log(`🚀 CuraLab Server listening on http://localhost:${PORT}`);
});