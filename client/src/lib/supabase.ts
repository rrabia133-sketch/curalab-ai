// client/src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

let rawUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

if (!rawUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables in client/.env");
}

// Normalize URL: remove any trailing slashes or subpaths (e.g. /rest/v1)
try {
    const parsed = new URL(rawUrl);
    rawUrl = parsed.origin;
} catch {
    // Keep as is if parsing fails
}

export const supabase = createClient(rawUrl, supabaseAnonKey);

