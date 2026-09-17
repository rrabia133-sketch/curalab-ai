import { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger.js";

// List of regular expressions detecting prompt injection / jailbreak attempts
const INJECTION_PATTERNS = [
    /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
    /system\s+prompt\s+override/i,
    /you\s+are\s+now\s+(in\s+)?developer\s+mode/i,
    /reveal\s+(your\s+)?(system\s+prompt|api\s+key|credentials)/i,
    /disregard\s+all\s+safety\s+guidelines/i,
    /execute\s+arbitrary\s+code/i,
];

export function validatePromptSafety(req: Request, res: Response, next: NextFunction): void {
    const message = req.body?.message || "";

    if (typeof message === "string" && message.length > 0) {
        // 1. Length constraint (prevent DOS / prompt flooding)
        if (message.length > 1000) {
            res.status(400).json({
                success: false,
                error: "Message exceeds maximum allowed length (1,000 characters).",
            });
            return;
        }

        // 2. Adversarial pattern check (OWASP LLM-01)
        for (const pattern of INJECTION_PATTERNS) {
            if (pattern.test(message)) {
                logger.warn({
                    msg: "🚨 Security Alert: Prompt injection attempt blocked.",
                    user: (req as any).user?.id,
                    pattern: pattern.toString(),
                });

                res.status(403).json({
                    success: false,
                    error: "Security Alert: Prompt rejected due to policy violation (adversarial pattern detected).",
                });
                return;
            }
        }
    }

    // Input is safe, pass to next handler
    next();
}
