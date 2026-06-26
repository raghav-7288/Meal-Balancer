import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }

    return context;
}

/**
 * Safe version of useAuth that returns null when used outside AuthProvider.
 * Use this in components that should work in both authenticated and localStorage-only modes.
 */
export function useOptionalAuth() {
    const context = useContext(AuthContext);
    return context || { user: null, isAuthenticated: false };
}

