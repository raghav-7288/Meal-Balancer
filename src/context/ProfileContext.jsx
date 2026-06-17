import { createContext, useContext, useState, useEffect } from "react";

// eslint-disable-next-line react-refresh/only-export-components
export const ProfileContext = createContext(null);

const DEFAULT_PROFILE = {
    activity: "moderate",
    goal: "maintenance",
    dietType: "vegetarian",
    sex: "female",
    bmiTarget: "22",
};

export function ProfileProvider({ children }) {
    const [profile, setProfile] = useState(() => {
        try {
            const stored = localStorage.getItem("meal-balancer-profile");
            return stored ? JSON.parse(stored) : DEFAULT_PROFILE;
        } catch {
            return DEFAULT_PROFILE;
        }
    });

    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem("meal-balancer-dark-mode") === "true";
    });

    useEffect(() => {
        try {
            localStorage.setItem("meal-balancer-profile", JSON.stringify(profile));
        } catch (err) {
            console.error("Failed to save profile:", err);
        }
    }, [profile]);

    useEffect(() => {
        document.body.classList.toggle("dark-mode", darkMode);
        localStorage.setItem("meal-balancer-dark-mode", String(darkMode));
    }, [darkMode]);

    const value = {
        profile,
        setProfile,
        darkMode,
        setDarkMode,
    };

    return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProfile() {
    const context = useContext(ProfileContext);
    if (!context) {
        throw new Error("useProfile must be used within a ProfileProvider");
    }
    return context;
}

