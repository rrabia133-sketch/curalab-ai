// backend/src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

let supabaseUrl = (process.env.SUPABASE_URL || "").trim();
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase credentials in backend/.env");
}

try {
    const parsed = new URL(supabaseUrl);
    supabaseUrl = parsed.origin;
} catch {
    // Keep as is if parsing fails
}

// Service Role client bypasses RLS for background server tasks (like embedding ingestion)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

