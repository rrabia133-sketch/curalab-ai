import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth.js";
import { supabaseAdmin } from "../lib/supabase.js";

/**
 * Quota Guard Middleware:
 * Enforces a daily analysis limit (default: 15 reports/day) per user.
 * Skips/allows demo guest users so demo testing is never blocked.
 */
export async function quotaGuard(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ error: "Unauthorized: User not found." });
        return;
    }

    // Allow Demo Guest mode to test freely
    if (userId === "00000000-0000-0000-0000-000000000000") {
        next();
        return;
    }

    const limit = parseInt(process.env.DAILY_ANALYSIS_LIMIT || "15", 10);

    // Calculate beginning of today (00:00:00 UTC)
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    try {
        const { count, error } = await supabaseAdmin
            .from("chat_sessions")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .gte("created_at", startOfDay.toISOString());

        if (error) {
            console.warn("⚠️ Quota check warning (allowing request):", error.message);
            next();
            return;
        }

        if ((count || 0) >= limit) {
            res.status(429).json({
                success: false,
                error: `Daily report quota exceeded (${limit} analyses/day). Your quota will reset tomorrow at midnight UTC.`,
                currentCount: count,
                limit,
            });
            return;
        }

        next();
    } catch (err: any) {
        console.error("Quota guard exception:", err);
        next(); // Fail-open to prevent breaking user workflow on DB glitch
    }
}
