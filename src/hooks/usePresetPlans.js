import { useState, useEffect } from "react";
import { fetchPresetPlans } from "../services/presetPlanService";

/**
 * Hook to load preset plans from the database.
 * Plans are fetched exclusively from the preset_plans table in Supabase.
 *
 * @returns {{ presetPlans: Array, isLoading: boolean, error: string|null }}
 */
export function usePresetPlans() {
    const [presetPlans, setPresetPlans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const plans = await fetchPresetPlans();
                if (!cancelled) {
                    setPresetPlans(plans || []);
                }
            } catch (err) {
                console.error("Failed to load preset plans from DB:", err.message);
                if (!cancelled) {
                    setError(err.message);
                }
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

