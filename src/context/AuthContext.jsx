import { createContext, useState, useEffect, useMemo, useCallback } from "react";
import {
    getSession,
    fetchUserProfile,
    updateUserProfile as authUpdateProfile,
    signIn as authSignIn,
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
        const data = await authSignUp(email, password);

        if (data.user) {
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
                const userProfile = await fetchUserProfile(data.user.id);
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

    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    const updateProfile = useCallback(
        async (fields) => {
            if (!user?.id) throw new Error("No authenticated user");
            const updated = await authUpdateProfile(user.id, fields);
            setProfile(updated);
            return updated;
        },
        [user?.id]
    );

    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    const refreshProfile = useCallback(async () => {
        if (!user?.id) return;
        const userProfile = await fetchUserProfile(user.id);
        setProfile(userProfile);
        return userProfile;
    }, [user?.id]);

    const isAuthenticated = !!user;

    const value = useMemo(
        () => ({
            user,
            profile,
            session,
            loading,
            signUp,
            signIn,
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
            signOut,
            updateProfile,
            refreshProfile,
            isAuthenticated,
        ]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
