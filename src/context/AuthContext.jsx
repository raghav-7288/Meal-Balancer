import { createContext, useState, useEffect, useMemo, useCallback } from "react";
import {
    getSession,
    fetchUserProfile,
    updateUserProfile as authUpdateProfile,
    signIn as authSignIn,
    signInWithGoogle as authSignInWithGoogle,
    signUp as authSignUp,
    signOut as authSignOut,
    createUserProfile,
    onAuthStateChange,
} from "../services/authService";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    // Restore session on mount
    useEffect(() => {
        let timeout;
        let initComplete = false;

        async function init() {
            try {
                const currentSession = await getSession();
                setSession(currentSession);

                if (currentSession?.user) {
                    setUser(currentSession.user);
                    try {
                        const userProfile = await fetchUserProfile(currentSession.user.id);
                        setProfile(userProfile);
                    } catch (profileErr) {
                        // Auth succeeded but profile fetch failed — user can still use the app
                        console.error("Profile fetch error during init:", profileErr);
                    }
                }
            } catch (err) {
                console.error("Auth init error:", err);
            } finally {
                initComplete = true;
                clearTimeout(timeout);
                setLoading(false);
            }
        }

        // Safety timeout: if auth takes more than 5s, stop loading and show login
        timeout = setTimeout(() => {
            setLoading(false);
        }, 5000);

        init();

        const subscription = onAuthStateChange(async (event, newSession) => {
            // Skip auth state changes while init() is still running to avoid
            // duplicate profile fetches and race conditions
            if (!initComplete) return;

            setSession(newSession);

            if (newSession?.user) {
                setUser(newSession.user);
                try {
                    const userProfile = await fetchUserProfile(newSession.user.id);
                    setProfile(userProfile);
                } catch (err) {
                    console.error("Profile fetch error:", err);
                }
            } else {
                setUser(null);
                setProfile(null);
            }
        });

        return () => {
            clearTimeout(timeout);
            subscription?.unsubscribe?.();
        };
    }, []);

    const signUp = useCallback(async (email, password, username, fullName, contactNumber) => {
        // Persist the typed details as auth metadata so the profile can still be
        // created after email confirmation (see the backfill in signIn), when no
        // session exists yet to insert the user_profiles row directly.
        const data = await authSignUp(email, password, {
            username,
            full_name: fullName,
            contact_number: contactNumber,
        });

        // When email confirmation is enabled, Supabase returns a user object but
        // NO session — the account is not active yet. Do NOT authenticate in that
        // case: there is no access token, so every RLS query would fail and the
        // "check your email" screen would be skipped entirely. Only sign the user
        // in when a real session is present.
        if (data.user && data.session) {
            // Clear onboarding flag so new users always see the onboarding flow
            localStorage.removeItem("diet-specifix-onboarding-done");
            // Reset browser URL to "/" so BrowserRouter mounts at home (onboarding)
            window.history.replaceState(null, "", "/");
            setUser(data.user);
            setSession(data.session);
            try {
                const newProfile = await createUserProfile(
                    data.user.id,
                    username,
                    fullName,
                    contactNumber
                );
                setProfile(newProfile);
            } catch (profileErr) {
                // Auth succeeded but profile creation failed — user is still authenticated
                // Profile will be retried on next login or page load
                console.error("Profile creation failed:", profileErr);
            }
        }

        return data;
    }, []);

    const signIn = useCallback(async (email, password) => {
        const data = await authSignIn(email, password);

        if (data.user) {
            setUser(data.user);
            setSession(data.session);
            try {
                let userProfile = await fetchUserProfile(data.user.id);
                // Backfill: an email-confirmation sign-up has no profile row yet
                // (it couldn't be created at sign-up without a session). Now that a
                // session exists, recreate it from the metadata captured at sign-up.
                if (!userProfile) {
                    const meta = data.user.user_metadata || {};
                    if (meta.username) {
                        userProfile = await createUserProfile(
                            data.user.id,
                            meta.username,
                            meta.full_name,
                            meta.contact_number
                        );
                    }
                }
                setProfile(userProfile);
            } catch (profileErr) {
                // Auth succeeded but profile fetch failed — user can still use the app
                console.error("Profile fetch failed during sign in:", profileErr);
            }
        }

        return data;
    }, []);

    const signOut = useCallback(async () => {
        await authSignOut();
        setUser(null);
        setSession(null);
        setProfile(null);
    }, []);

    // Kick off the Google OAuth redirect. On success the browser navigates away
    // to Google, so state is picked up later via onAuthStateChange after the
    // redirect back. Returns { error } so callers can surface failures inline.
    const signInWithGoogle = useCallback(async () => {
        try {
            await authSignInWithGoogle();
            return { error: null };
        } catch (err) {
            return { error: err instanceof Error ? err : new Error(String(err)) };
        }
    }, []);

    const updateProfile = useCallback(
        async (fields) => {
            if (!user?.id) throw new Error("No authenticated user");
            const updated = await authUpdateProfile(user.id, fields);
            setProfile(updated);
            return updated;
        },
        [user]
    );

    const refreshProfile = useCallback(async () => {
        if (!user?.id) return;
        const userProfile = await fetchUserProfile(user.id);
        setProfile(userProfile);
        return userProfile;
    }, [user]);

    const isAuthenticated = !!user;

    const value = useMemo(
        () => ({
            user,
            profile,
            session,
            loading,
            signUp,
            signIn,
            signInWithGoogle,
            signOut,
            updateProfile,
            refreshProfile,
            isAuthenticated,
        }),
        [
            user,
            profile,
            session,
            loading,
            signUp,
            signIn,
            signInWithGoogle,
            signOut,
            updateProfile,
            refreshProfile,
            isAuthenticated,
        ]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
