import { supabase } from "../lib/supabaseClient";

/**
 * Resend email confirmation link to the user.
 * Uses Supabase's built-in email confirmation flow.
 * @param {string} email - The user's email address.
 * @returns {Promise<void>}
 */
export async function resendEmailVerification(email) {
    const { error } = await supabase.auth.resend({
        type: "signup",
        email,
    });

    if (error) {
        throw new Error(error.message);
    }
}

/**
 * Check if user's email is verified (from Supabase auth metadata).
 * @param {object} user - The Supabase auth user object.
 * @returns {boolean}
 */
export function isEmailVerified(user) {
    return !!user?.email_confirmed_at;
}


