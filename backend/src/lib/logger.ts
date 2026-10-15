import pino from "pino";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import pretty from "pino-pretty";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Stored in backend/logs/
const logsDirectory = path.resolve(__dirname, "../../logs");

if (!fs.existsSync(logsDirectory)) {
    fs.mkdirSync(logsDirectory, { recursive: true });
}

// 1. General application log stream (all info, warn, error)
const appLogStream = fs.createWriteStream(path.join(logsDirectory, "app.log"), { flags: "a" });

// 2. Dedicated error log stream
const errorLogStream = fs.createWriteStream(path.join(logsDirectory, "error.log"), { flags: "a" });

// 3. Pretty formatted terminal console stream
const consoleStream = pretty({
    colorize: true,
    translateTime: "SYS:standard",
    ignore: "pid,hostname,service,env",
});

const streams = [
    { stream: consoleStream, level: (process.env.LOG_LEVEL || "info") as pino.Level },
    { stream: appLogStream, level: (process.env.LOG_LEVEL || "info") as pino.Level },
    { stream: errorLogStream, level: "error" as pino.Level },
];

export const logger = pino(
    {
        level: process.env.LOG_LEVEL || "info",
        // Automatically mask sensitive keys if they ever get passed into logger
        redact: {
            paths: [
                "req.headers.authorization",
                "req.headers.cookie",
                "body.password",
                "body.file",
                "user.email",
                "patientName",
                "*.patientName",
                "GROQ_API_KEY",
                "SUPABASE_SERVICE_ROLE_KEY",
                "SUPABASE_KEY",
            ],
            censor: "[REDACTED]",
        },
        formatters: {
            level: (label) => ({ level: label.toUpperCase() }),
        },
        timestamp: pino.stdTimeFunctions.isoTime,
        base: {
            service: "curalab-backend",
            env: process.env.NODE_ENV || "development",
        },
    },
    pino.multistream(streams)
);


