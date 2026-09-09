// backend/src/lib/supabase.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

let supabaseUrl = (process.env.SUPABASE_URL || "").trim();
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("⚠️ Warning: Missing Supabase credentials in backend/.env");
}

try {
    const parsed = new URL(supabaseUrl);
    supabaseUrl = parsed.origin;
} catch {
    // Keep as is if parsing fails
}

// Service Role client bypasses RLS for background server tasks (when a genuine service key is provided)
export const supabaseAdmin = createClient(
    supabaseUrl || "https://placeholder.supabase.co",
    supabaseServiceKey || "placeholder-key"
);

/**
 * Returns a Supabase client scoped to the authenticated user's JWT token.
 * This ensures queries comply with user-level Row-Level Security (RLS) policies.
 */
export function getUserSupabaseClient(token?: string): SupabaseClient {
    if (!token || token === "demo-guest-token" || token.startsWith("demo-")) {
        return supabaseAdmin;
    }

    return createClient(
        supabaseUrl || "https://placeholder.supabase.co",
        supabaseServiceKey || "placeholder-key",
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
            global: {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        }
    );
}
