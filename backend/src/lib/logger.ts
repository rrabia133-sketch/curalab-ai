import pino from "pino";

export const logger = pino({
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
            "SUPABASE_KEY"
        ],
        censor: "[REDACTED]"
    },
    formatters: {
        level: (label) => ({ level: label.toUpperCase() }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    base: {
        service: "curalab-backend",
        env: process.env.NODE_ENV || "development",
    },
});
