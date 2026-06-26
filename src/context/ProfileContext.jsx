import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabaseClient";

// eslint-disable-next-line react-refresh/only-export-components
export const ProfileContext = createContext(null);

const DEFAULT_PROFILE = {
    activity: "moderate",
    goal: "maintenance",
    dietType: "vegetarian",
    sex: "female",
    bmiTarget: "22",
    height: "",
    weight: "",
};

// Map between client-side camelCase keys and DB snake_case columns
const DB_FIELD_MAP = {
    activity: "activity",
    goal: "goal",
    dietType: "diet_type",
    sex: "sex",
    bmiTarget: "bmi_target",
};

function dbProfileToLocal(dbProfile) {
    if (!dbProfile) return null;
    return {
        activity: dbProfile.activity || DEFAULT_PROFILE.activity,
        goal: dbProfile.goal || DEFAULT_PROFILE.goal,
        dietType: dbProfile.diet_type || DEFAULT_PROFILE.dietType,
        sex: dbProfile.sex || DEFAULT_PROFILE.sex,
        bmiTarget: dbProfile.bmi_target || DEFAULT_PROFILE.bmiTarget,
        height: dbProfile.height_cm ? String(dbProfile.height_cm) : "",
        weight: dbProfile.weight_kg ? String(dbProfile.weight_kg) : "",
    };
}

export function ProfileProvider({ children }) {
    const [profile, setProfileInternal] = useState(() => {
        try {
            const stored = localStorage.getItem("meal-balancer-profile");
            return stored ? JSON.parse(stored) : DEFAULT_PROFILE;
        } catch (err) {
            console.error("Failed to parse stored profile:", err);
            return DEFAULT_PROFILE;
        }
    });

    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem("meal-balancer-dark-mode") === "true";
    });

    const [profileSyncStatus, setProfileSyncStatus] = useState("idle"); // idle | syncing | synced | error
    const isMounted = useRef(true);
    const syncTimeoutRef = useRef(null);

    const { user, isAuthenticated, refreshProfile } = useAuth();

    useEffect(() => {
        return () => { isMounted.current = false; };
    }, []);

    // Persist to localStorage whenever profile changes
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

    // Load profile preferences from Supabase on login
    useEffect(() => {
        if (!isAuthenticated || !user?.id) return;

        async function loadFromDb() {
            try {
                setProfileSyncStatus("syncing");
                const { data, error } = await supabase
                    .from("user_profiles")
                    .select("activity, goal, diet_type, sex, bmi_target, height_cm, weight_kg")
                    .eq("user_id", user.id)
                    .single();

                if (error && error.code !== "PGRST116") {
                    console.error("Failed to load profile from Supabase:", error);
                    if (isMounted.current) setProfileSyncStatus("error");
                    return;
                }

                if (data && isMounted.current) {
                    const dbProfile = dbProfileToLocal(data);
                    if (dbProfile) {
                        setProfileInternal((prev) => ({
                            ...prev,
                            ...dbProfile,
                            // Keep local height/weight if DB is empty
                            height: dbProfile.height || prev.height,
                            weight: dbProfile.weight || prev.weight,
                        }));
                    }
                    setProfileSyncStatus("synced");
                }
            } catch (err) {
                console.error("Failed to load profile from Supabase:", err);
                if (isMounted.current) setProfileSyncStatus("error");
            }
        }

        loadFromDb();
    }, [isAuthenticated, user?.id]);

    // Save profile to Supabase (debounced) — uses upsert to handle missing rows
    const lastSavedProfile = useRef(null);
    const saveToDbRef = useRef(null);

    function saveToDb(newProfile) {
        if (!isAuthenticated || !user?.id) return;

        // Skip if nothing changed since last save
        const dbFields = {};
        for (const [localKey, dbKey] of Object.entries(DB_FIELD_MAP)) {
            if (newProfile[localKey] !== undefined) {
                dbFields[dbKey] = newProfile[localKey];
            }
        }

        const serialized = JSON.stringify(dbFields);
        if (lastSavedProfile.current === serialized) return;

        setProfileSyncStatus("syncing");

        supabase
            .from("user_profiles")
            .upsert({ user_id: user.id, ...dbFields }, { onConflict: "user_id" })
            .then(({ error }) => {
                if (!isMounted.current) return;
                if (error) {
                    console.error("Failed to sync profile to Supabase:", error);
                    setProfileSyncStatus("error");
                } else {
                    lastSavedProfile.current = serialized;
                    setProfileSyncStatus("synced");
                    // Keep AuthContext profile in sync
                    refreshProfile?.();
                }
            })
            .catch((err) => {
                console.error("Failed to sync profile to Supabase:", err);
                if (isMounted.current) setProfileSyncStatus("error");
            });
    }

    // Retry a failed sync with current profile state
    useEffect(() => {
        saveToDbRef.current = saveToDb;
    });
    const retrySync = useCallback(() => {
        if (profileSyncStatus !== "error") return;
        lastSavedProfile.current = null; // force re-save
        saveToDbRef.current?.(profile);
    }, [profileSyncStatus, profile]);

    // Wrapper that also triggers DB save (debounced)
    function setProfile(updater) {
        setProfileInternal((prev) => {
            const next = typeof updater === "function" ? updater(prev) : updater;

            // Debounce DB sync by 1 second
            if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
            syncTimeoutRef.current = setTimeout(() => {
                saveToDb(next);
            }, 1000);

            return next;
        });
    }

    const value = {
        profile,
        setProfile,
        darkMode,
        setDarkMode,
        profileSyncStatus,
        retrySync,
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

