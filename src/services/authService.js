import { supabase } from "../lib/supabaseClient";

/**
 * Sign up a new user with email and password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{user: object, session: object}>}
 */
export async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Sign in an existing user with email and password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{user: object, session: object}>}
 */
export async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Start the Google OAuth sign-in flow (redirect-based).
 * The browser is redirected to Google, then back to `redirectTo`, where the
 * supabase client (detectSessionInUrl) exchanges the code for a session.
 * @param {string} [redirectTo] - URL to return to after auth. Defaults to `${origin}/dashboard`.
 * @returns {Promise<object>} signInWithOAuth data (provider + redirect url).
 */
export async function signInWithGoogle(redirectTo) {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: redirectTo || `${window.location.origin}/dashboard`,
            queryParams: {
                access_type: "offline",
                prompt: "consent",
            },
        },
    });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Sign out the current user.
 */
export async function signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
        throw new Error(error.message);
    }
}

/**
 * Get the current authenticated user (from local session).
 * @returns {Promise<object|null>}
 */
export async function getCurrentUser() {
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error) {
        return null;
    }

    return user;
}

/**
 * Get the current session.
 * @returns {Promise<object|null>}
 */
export async function getSession() {
    const {
        data: { session },
        error,
    } = await supabase.auth.getSession();

    if (error) {
        return null;
    }

    return session;
}

/**
 * Fetch user profile from user_profiles table.
 * @param {string} userId - The auth user UUID.
 * @returns {Promise<object|null>}
 */
export async function fetchUserProfile(userId) {
    const { data, error } = await supabase
        .from("user_profiles")
        .select(
            "user_id, username, full_name, created_at, height_cm, weight_kg, current_bmi, age, contact_number, activity, goal, diet_type, sex, bmi_target, avatar_url"
        )
        .eq("user_id", userId)
        .single();

    if (error) {
        if (error.code === "PGRST116") {
            // No row found
            return null;
        }
        throw new Error(`Failed to fetch user profile: ${error.message}`);
    }

    return data;
}

/**
 * Update user profile fields in user_profiles table.
 * @param {string} userId - The auth user UUID.
 * @param {object} fields - Fields to update (height_cm, weight_kg, current_bmi, age, contact_number, full_name).
 * @returns {Promise<object>}
 */
export async function updateUserProfile(userId, fields) {
    const { data, error } = await supabase
        .from("user_profiles")
        .update(fields)
        .eq("user_id", userId)
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to update user profile: ${error.message}`);
    }

    return data;
}

/**
 * Create a user profile row if one does not already exist.
 * @param {string} userId - The auth user UUID.
 * @param {string} username
 * @param {string} fullName
 * @param {string} [contactNumber] - Optional mobile number.
 * @returns {Promise<object>}
 */
export async function createUserProfile(userId, username, fullName, contactNumber) {
    const existing = await fetchUserProfile(userId);

    if (existing) {
        return existing;
    }

    const profileData = {
        user_id: userId,
        username,
        full_name: fullName,
    };

    if (contactNumber) {
        profileData.contact_number = contactNumber;
    }

    const { data, error } = await supabase
        .from("user_profiles")
        .insert(profileData)
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to create user profile: ${error.message}`);
    }

    return data;
}

/**
 * Subscribe to auth state changes.
 * @param {function} callback - Receives (event, session).
 * @returns {object} subscription with unsubscribe method.
 */
export function onAuthStateChange(callback) {
    const {
        data: { subscription },
    } = supabase.auth.onAuthStateChange(callback);
    return subscription;
}
