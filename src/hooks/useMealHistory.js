import { useLocalStorageState } from "./useLocalStorage";

/**
 * Hook for persisting meal history / daily score logs.
 * Stores entries in localStorage under "meal-balancer-meal-history".
 *
 * Each entry: { id, date, timestamp, planName, score, band, kcal, protein, carbs, fat, fibre, vegetablesG, visibleFat }
 */
export function useMealHistory() {
    const [history, setHistory] = useLocalStorageState("meal-balancer-meal-history", []);

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

            if (existingIdx >= 0) {
                return prev.map((e, i) => (i === existingIdx ? entry : e));
            }
            return [...prev, entry];
        });
    }

    /** Remove a single history entry by id. */
    function removeEntry(id) {
        setHistory((prev) => prev.filter((e) => e.id !== id));
    }

    /** Clear all history. */
    function clearHistory() {
        setHistory([]);
    }

    return { history, logDay, removeEntry, clearHistory };
}

