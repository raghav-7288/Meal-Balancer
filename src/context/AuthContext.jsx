import { createContext, useState, useEffect } from "react";
import {
    getSession,
    fetchUserProfile,
    signIn as authSignIn,
    signUp as authSignUp,
    signOut as authSignOut,
    createUserProfile,
    onAuthStateChange,
} from "../services/authService";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    // Restore session on mount
    useEffect(() => {
        async function init() {
            try {
                const currentSession = await getSession();
                setSession(currentSession);

                if (currentSession?.user) {
                    setUser(currentSession.user);
                    const userProfile = await fetchUserProfile(currentSession.user.id);
                    setProfile(userProfile);
                }
            } catch (err) {
                console.error("Auth init error:", err);
            } finally {
                setLoading(false);
            }
        }

        init();

        const subscription = onAuthStateChange(async (event, newSession) => {
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
            subscription.unsubscribe();
        };
    }, []);

    async function signUp(email, password, username, fullName) {
        const data = await authSignUp(email, password);

        if (data.user) {
            setUser(data.user);
            setSession(data.session);
            const newProfile = await createUserProfile(data.user.id, username, fullName);
            setProfile(newProfile);
        }

        return data;
    }

    async function signIn(email, password) {
        const data = await authSignIn(email, password);

        if (data.user) {
            setUser(data.user);
            setSession(data.session);
            const userProfile = await fetchUserProfile(data.user.id);
            setProfile(userProfile);
        }

        return data;
    }

    async function signOut() {
        await authSignOut();
        setUser(null);
        setSession(null);
        setProfile(null);
    }

    const value = {
        user,
        profile,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

