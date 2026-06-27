import { useState, useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
import {
    fetchMealHistory,
    upsertMealHistoryEntry,
    deleteMealHistoryEntry,
    clearMealHistory as clearMealHistoryDb,
    dbRowToEntry,
} from "../services/mealHistoryService";

const LOCAL_STORAGE_KEY = "diet-specifix-meal-history";

function readLocal() {
    try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function writeLocal(history) {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(history));
    } catch (err) {
        console.error("Failed to save meal history to localStorage:", err);
    }
}

/**
 * Hook for persisting meal history / daily score logs.
 * Syncs with Supabase when user is authenticated, falls back to localStorage.
 *
 * Each entry: { id, date, timestamp, planName, score, band, kcal, protein, carbs, fat, fibre, vegetablesG, visibleFat }
 */
export function useMealHistory() {
    const { user, isAuthenticated } = useAuth();
    const [history, setHistory] = useState(readLocal);
    const [syncStatus, setSyncStatus] = useState("idle"); // idle | syncing | synced | error
    const isMounted = useRef(true);
    const authRef = useRef({ isAuthenticated, userId: user?.id });

    useEffect(() => {
        authRef.current = { isAuthenticated, userId: user?.id };
    }, [isAuthenticated, user?.id]);

    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    // Persist to localStorage whenever history changes
    useEffect(() => {
        writeLocal(history);
    }, [history]);

    // Load from Supabase on login
    useEffect(() => {
        if (!isAuthenticated || !user?.id) return;

        async function loadFromDb() {
            try {
                setSyncStatus("syncing");
                const remoteRows = await fetchMealHistory(user.id);
                const remoteEntries = remoteRows.map(dbRowToEntry);

                if (isMounted.current) {
                    // Merge: remote is source of truth, add any local-only entries
                    const localHistory = readLocal();
                    const remoteMap = new Map(remoteEntries.map((e) => [e.date, e]));
                    const merged = [...remoteEntries];

                    // Upload local-only entries to Supabase
                    const toUpload = [];
                    for (const localEntry of localHistory) {
                        if (!remoteMap.has(localEntry.date)) {
                            merged.push(localEntry);
                            toUpload.push(localEntry);
                        }
                    }

                    setHistory(merged);
                    setSyncStatus("synced");

                    // Background upload of local-only entries
                    if (toUpload.length > 0) {
                        for (const entry of toUpload) {
                            upsertMealHistoryEntry(user.id, entry).catch((err) =>
                                console.error("Failed to upload local meal history entry:", err)
                            );
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to load meal history from Supabase:", err);
                if (isMounted.current) setSyncStatus("error");
            }
        }

        loadFromDb();
    }, [isAuthenticated, user?.id]);

    /**
     * Log (or update) today's meal score.
     * If an entry for today already exists, it is replaced.
     */
    function logDay(entryData) {
        const today = new Date().toISOString().split("T")[0];

        setHistory((prev) => {
            const existingIdx = prev.findIndex((e) => e.date === today);
            const entry = {
                id: existingIdx >= 0 ? prev[existingIdx].id : crypto.randomUUID(),
                date: today,
                timestamp: Date.now(),
                planName: entryData.planName,
                score: Math.round(entryData.score ?? 0),
                band: entryData.band || "",
                kcal: Math.round(entryData.kcal ?? 0),
                protein: Math.round(entryData.protein ?? 0),
                carbs: Math.round(entryData.carbs ?? 0),
                fat: Math.round(entryData.fat ?? 0),
                fibre: Math.round(entryData.fibre ?? 0),
                vegetablesG: Math.round(entryData.vegetablesG ?? 0),
                visibleFat: Math.round(entryData.visibleFat ?? 0),
            };

            // Sync to Supabase in background
            const { isAuthenticated: authed, userId } = authRef.current;
            if (authed && userId) {
                upsertMealHistoryEntry(userId, entry).catch((err) => {
                    console.error("Failed to sync meal history entry:", err);
                    if (isMounted.current) setSyncStatus("error");
                });
            }

            if (existingIdx >= 0) {
                return prev.map((e, i) => (i === existingIdx ? entry : e));
            }
            return [...prev, entry];
        });
    }

    /** Remove a single history entry by id. */
    function removeEntry(id) {
        setHistory((prev) => prev.filter((e) => e.id !== id));

        // Sync deletion to Supabase
        const { isAuthenticated: authed, userId } = authRef.current;
        if (authed && userId) {
            deleteMealHistoryEntry(userId, id).catch((err) => {
                console.error("Failed to delete meal history entry from Supabase:", err);
                if (isMounted.current) setSyncStatus("error");
            });
        }
    }

    /** Clear all history. */
    function clearHistory() {
        setHistory([]);

        // Clear from Supabase
        const { isAuthenticated: authed, userId } = authRef.current;
        if (authed && userId) {
            clearMealHistoryDb(userId).catch((err) => {
                console.error("Failed to clear meal history in Supabase:", err);
                if (isMounted.current) setSyncStatus("error");
            });
        }
    }

    return { history, logDay, removeEntry, clearHistory, syncStatus };
}
