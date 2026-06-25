import { useState, useEffect } from "react";
import { fetchPresetPlans } from "../services/presetPlanService";
import { PRESET_PLANS } from "../data/presetPlans";

/**
 * Hook to load preset plans from the database.
 * Falls back to hardcoded PRESET_PLANS if the fetch fails.
 *
 * @returns {{ presetPlans: Array, isLoading: boolean, error: string|null }}
 */
export function usePresetPlans() {
    const [presetPlans, setPresetPlans] = useState(() =>
        PRESET_PLANS.map((p) => ({ ...p, isPreset: true }))
    );
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const plans = await fetchPresetPlans();
                if (!cancelled && plans && plans.length > 0) {
                    setPresetPlans(plans);
                }
            } catch (err) {
                console.warn("Failed to load preset plans from DB, using fallback:", err.message);
                if (!cancelled) {
                    setError(err.message);
                }
                // Fallback already set in initial state
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }

        load();
        return () => { cancelled = true; };
    }, []);

    return { presetPlans, isLoading, error };
}

