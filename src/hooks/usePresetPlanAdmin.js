import { useState, useEffect, useCallback } from "react";
import { MEALS, DAYS } from "../data/presetPlans";
import { fetchAllPresetPlans, upsertPresetPlan, deletePresetPlan } from "../services/presetPlanService";
import toast from "react-hot-toast";

/**
 * Hook for managing preset plans in the admin page.
 * Provides CRUD operations, active plan state, and meal editing.
 */
export function usePresetPlanAdmin() {
    const [plans, setPlans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activePlanId, setActivePlanId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [viewDay, setViewDay] = useState("Monday");

    // Load all preset plans (including inactive)
    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                const data = await fetchAllPresetPlans();
                if (!cancelled) {
                    setPlans(data);
                    if (data.length > 0 && !activePlanId) {
                        setActivePlanId(data[0].id);
                    }
                }
            } catch (err) {
                console.error("Failed to load preset plans:", err.message);
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const activePlan = plans.find((p) => p.id === activePlanId) || null;

    // ─── Create a new preset plan ─────────────────────────────────────
    const createPlan = useCallback(async (name) => {
        if (!name || !name.trim()) {
            toast.error("Plan name is required");
            return;
        }
        setSaving(true);
        try {
            const emptyMeals = {};
            for (const slot of MEALS) {
                emptyMeals[slot] = [];
            }
            const newPlan = await upsertPresetPlan({
                name: name.trim(),
                meals: emptyMeals,
                guidelines: "",
                displayOrder: plans.length + 1,
                isActive: true,
            });
            setPlans((prev) => [...prev, newPlan]);
            setActivePlanId(newPlan.id);
            toast.success(`Created "${newPlan.name}"`);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    }, [plans.length]);

    // ─── Save / update the active plan ────────────────────────────────
    const savePlan = useCallback(async (planData) => {
        setSaving(true);
        try {
            const updated = await upsertPresetPlan(planData);
            setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
            toast.success(`Saved "${updated.name}"`);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    }, []);

    // ─── Delete a preset plan ─────────────────────────────────────────
    const removePlan = useCallback(async (id) => {
        setSaving(true);
        try {
            await deletePresetPlan(id);
            setPlans((prev) => prev.filter((p) => p.id !== id));
            if (activePlanId === id) {
                setActivePlanId((prev) => {
                    const remaining = plans.filter((p) => p.id !== id);
                    return remaining.length > 0 ? remaining[0].id : null;
                });
            }
            toast.success("Plan deleted");
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    }, [activePlanId, plans]);

    // ─── Toggle active status ─────────────────────────────────────────
    const toggleActive = useCallback(async (id) => {
        const plan = plans.find((p) => p.id === id);
        if (!plan) return;
        const updated = { ...plan, isActive: !plan.isActive };
        setSaving(true);
        try {
            const result = await upsertPresetPlan(updated);
            setPlans((prev) => prev.map((p) => (p.id === result.id ? result : p)));
            toast.success(result.isActive ? "Plan activated" : "Plan deactivated");
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    }, [plans]);

    // ─── Update plan metadata (name, guidelines, displayOrder) ────────
    const updatePlanField = useCallback((field, value) => {
        if (!activePlanId) return;
        setPlans((prev) =>
            prev.map((p) => (p.id === activePlanId ? { ...p, [field]: value } : p))
        );
    }, [activePlanId]);

    // ─── Add a food item to a meal slot ───────────────────────────────
    const addFood = useCallback((meal, foodId, foodName, grams, instructions, foodGroupId) => {
        if (!activePlanId) return;
        const newItem = {
            id: crypto.randomUUID(),
            foodId: String(foodId),
            foodName,
            grams: Number(grams),
            instructions: instructions || "",
            foodGroupId: foodGroupId || null,
            day: viewDay,
        };
        setPlans((prev) =>
            prev.map((p) => {
                if (p.id !== activePlanId) return p;
                const meals = { ...p.meals };
                meals[meal] = [...(meals[meal] || []), newItem];
                return { ...p, meals };
            })
        );
    }, [activePlanId, viewDay]);

    // ─── Update a meal item's grams or instructions ───────────────────
    const updateMealItem = useCallback((meal, itemId, patch) => {
        if (!activePlanId) return;
        setPlans((prev) =>
            prev.map((p) => {
                if (p.id !== activePlanId) return p;
                const meals = { ...p.meals };
                meals[meal] = (meals[meal] || []).map((item) =>
                    item.id === itemId ? { ...item, ...patch } : item
                );
                return { ...p, meals };
            })
        );
    }, [activePlanId]);

    // ─── Remove a meal item ───────────────────────────────────────────
    const removeMealItem = useCallback((meal, itemId) => {
        if (!activePlanId) return;
        setPlans((prev) =>
            prev.map((p) => {
                if (p.id !== activePlanId) return p;
                const meals = { ...p.meals };
                meals[meal] = (meals[meal] || []).filter((item) => item.id !== itemId);
                return { ...p, meals };
            })
        );
    }, [activePlanId]);

    // ─── Reload plans from DB ─────────────────────────────────────────
    const reload = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await fetchAllPresetPlans();
            setPlans(data);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        plans,
        isLoading,
        error,
        activePlanId,
        setActivePlanId,
        activePlan,
        saving,
        viewDay,
        setViewDay,
        createPlan,
        savePlan,
        removePlan,
        toggleActive,
        updatePlanField,
        addFood,
        updateMealItem,
        removeMealItem,
        reload,
    };
}

