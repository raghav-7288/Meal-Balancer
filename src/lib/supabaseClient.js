import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error(
        "Missing Supabase environment variables. " +
            "Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your .env file."
    );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        // Required so the Google OAuth redirect back to the app is exchanged
        // for a session automatically (no dedicated /auth/callback route needed).
        detectSessionInUrl: true,
        storageKey: "diet-specifix-auth",
    },
});
