import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

let supabase: SupabaseClient | undefined;

if (!supabaseUrl || !supabaseKey) {
  if (typeof window !== "undefined") {
    console.error("Supabase environment variables are missing. Check .env.local");
  }
} else {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export { supabase };

