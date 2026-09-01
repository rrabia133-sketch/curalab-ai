import { Request, Response, NextFunction } from "express";
import { User } from "@supabase/supabase-js";
import { supabaseAdmin } from "../lib/supabase.js";

// Custom Request interface extending Express Request with authenticated user info
export interface AuthenticatedRequest extends Request {
    user?: User;
    token?: string;
}

/**
 * Middleware to validate Supabase JWT Bearer tokens from the Authorization header.
 * Verifies the token with Supabase and attaches `req.user` for downstream routes.
 */
export const requireAuth = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({
                error: "Unauthorized",
                message: "Missing or malformed Authorization header. Format must be 'Bearer <token>'.",
            });
            return;
        }

        const token = authHeader.split(" ")[1]?.trim();

        if (!token) {
            res.status(401).json({
                error: "Unauthorized",
                message: "Bearer token is empty.",
            });
            return;
        }

        // Validate the JWT token against Supabase Auth
        const {
            data: { user },
            error,
        } = await supabaseAdmin.auth.getUser(token);

        if (error || !user) {
            res.status(401).json({
                error: "Unauthorized",
                message: error?.message || "Invalid or expired token.",
            });
            return;
        }

        // Attach verified user and token to request
        req.user = user;
        req.token = token;

        next();
    } catch (err: any) {
        res.status(500).json({
            error: "Internal Server Error",
            message: "Authentication verification failed.",
            details: err?.message,
        });
    }
};

/**
 * Optional authentication middleware.
 * If a valid Bearer token is provided, attaches `req.user`.
 * If no token is provided, request continues without error.
 */
export const optionalAuth = async (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1]?.trim();
        if (token) {
            const {
                data: { user },
            } = await supabaseAdmin.auth.getUser(token);
            if (user) {
                req.user = user;
                req.token = token;
            }
        }
    }

    next();
};
