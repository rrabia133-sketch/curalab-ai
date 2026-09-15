import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { logger } from "../lib/logger.js";

// Extend Express Request type to include correlationId and startTime
export interface LoggedRequest extends Request {
    correlationId: string;
    startTime: number;
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
    // 1. Grab existing correlation ID or generate a new unique UUID
    const correlationId = (req.headers["x-correlation-id"] as string) || crypto.randomUUID();
    (req as LoggedRequest).correlationId = correlationId;
    (req as LoggedRequest).startTime = Date.now();

    // 2. Attach X-Correlation-ID to the outgoing response headers
    res.setHeader("X-Correlation-ID", correlationId);

    // 3. Log incoming request
    logger.info({
        correlationId,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        msg: `Incoming HTTP ${req.method} ${req.originalUrl}`,
    });

    // 4. Log request completion when response finishes
    res.on("finish", () => {
        const durationMs = Date.now() - (req as LoggedRequest).startTime;
        const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";

        logger[level]({
            correlationId,
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            durationMs,
            msg: `Completed HTTP ${req.method} ${req.originalUrl} [${res.statusCode}] in ${durationMs}ms`,
        });
    });

    next();
}
