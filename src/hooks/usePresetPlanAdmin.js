import { useState, useEffect, useCallback, useRef } from "react";
import { MEALS } from "../data/presetPlans";
import {
    fetchAllPresetPlans,
    upsertPresetPlan,
    deletePresetPlan,
} from "../services/presetPlanService";
import toast from "react-hot-toast";

/**
 * Hook for managing preset plans in the admin page.
 * Provides CRUD operations, active plan state, and meal editing.
 * Auto-saves changes after a short debounce period.
 */
export function usePresetPlanAdmin() {
    const [plans, setPlans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activePlanId, setActivePlanId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [viewDay, setViewDay] = useState("Monday");
    const [isDirty, setIsDirty] = useState(false);
    const [deleteToast, setDeleteToast] = useState(null);

    // Track the last saved snapshot to detect meaningful changes
    const lastSavedRef = useRef(null);
    const autoSaveTimerRef = useRef(null);
    const deleteTimerRef = useRef(null);

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
        return () => {
            cancelled = true;
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const activePlan = plans.find((p) => p.id === activePlanId) || null;

    // Mark the plan as dirty (has unsaved changes)
    const markDirty = useCallback(() => setIsDirty(true), []);

    // ─── Auto-save: debounce 2s after any local mutation ─────────────────
    useEffect(() => {
        if (!isDirty || !activePlan) return;

        // Clear any existing timer
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }

        autoSaveTimerRef.current = setTimeout(async () => {
            try {
                setSaving(true);
                const updated = await upsertPresetPlan(activePlan);
                setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                lastSavedRef.current = JSON.stringify(updated);
                setIsDirty(false);
            } catch (err) {
                console.error("Auto-save failed:", err.message);
                toast.error("Auto-save failed — please save manually");
            } finally {
                setSaving(false);
            }
        }, 2000);

        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
        };
    }, [isDirty, activePlan]);

    // ─── Warn on page unload if unsaved changes exist ────────────────────
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = "";
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isDirty]);

    // Store snapshot after initial load to track changes
    useEffect(() => {
        if (activePlan && !lastSavedRef.current) {
            lastSavedRef.current = JSON.stringify(activePlan);
        }
    }, [activePlan]);

    // ─── Auto-dismiss delete toast and perform actual deletion ────────────
    useEffect(() => {
        if (deleteToast) {
            deleteTimerRef.current = setTimeout(async () => {
                try {
                    await deletePresetPlan(deleteToast.planId);
                } catch (err) {
                    console.error("Failed to delete plan:", err.message);
                    toast.error("Failed to delete plan from database");
                }
                setDeleteToast(null);
            }, 10000);
            return () => {
                if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
            };
        }
    }, [deleteToast]);

    // ─── Create a new preset plan ─────────────────────────────────────
    const createPlan = useCallback(
        async (name) => {
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
        },
        [plans.length]
    );

    // ─── Save / update the active plan ────────────────────────────────
    const savePlan = useCallback(async (planData) => {
        // Cancel any pending auto-save since we're saving manually
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }
        setSaving(true);
        try {
            const updated = await upsertPresetPlan(planData);
            setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
            lastSavedRef.current = JSON.stringify(updated);
            setIsDirty(false);
            toast.success(`Saved "${updated.name}"`);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    }, []);

    // ─── Delete a preset plan (with undo) ──────────────────────────────
    const removePlan = useCallback(
        (id) => {
            const deletedPlan = plans.find((p) => p.id === id);
            if (!deletedPlan) return;

            // Remove from local state immediately
            setPlans((prev) => prev.filter((p) => p.id !== id));
            if (activePlanId === id) {
                const remaining = plans.filter((p) => p.id !== id);
                setActivePlanId(remaining.length > 0 ? remaining[0].id : null);
            }

            // Cancel any pending delete timer from a previous toast
            if (deleteTimerRef.current) {
                clearTimeout(deleteTimerRef.current);
            }

            // Show undo toast — actual Supabase deletion happens on auto-dismiss
            setDeleteToast({
                planId: id,
                planName: deletedPlan.name,
                undoAction: () => {
                    setPlans((prev) => [...prev, deletedPlan]);
                    setActivePlanId(deletedPlan.id);
                    setDeleteToast(null);
                    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
                },
            });
        },
        [activePlanId, plans]
    );

    // ─── Toggle active status ─────────────────────────────────────────
    const toggleActive = useCallback(
        async (id) => {
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
        },
        [plans]
    );

    // ─── Update plan metadata (name, guidelines, displayOrder) ────────
    const updatePlanField = useCallback(
        (field, value) => {
            if (!activePlanId) return;
            setPlans((prev) =>
                prev.map((p) => (p.id === activePlanId ? { ...p, [field]: value } : p))
            );
            markDirty();
        },
        [activePlanId, markDirty]
    );

    // ─── Add a food item to a meal slot ───────────────────────────────
    const addFood = useCallback(
        (meal, foodId, foodName, grams, instructions, foodGroupId, foodGroup) => {
            if (!activePlanId) return;
            const newItem = {
                id: crypto.randomUUID(),
                foodId: String(foodId),
                foodName,
                grams: Number(grams),
                instructions: instructions || "",
                foodGroupId: foodGroupId || null,
                foodGroup: foodGroup || "",
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
            markDirty();
            toast.success(`"${foodName}" added to ${meal} (${viewDay})`);
        },
        [activePlanId, viewDay, markDirty]
    );

    // ─── Update a meal item's grams or instructions ───────────────────
    const updateMealItem = useCallback(
        (meal, itemId, patch) => {
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
            markDirty();
        },
        [activePlanId, markDirty]
    );

    // ─── Remove a meal item ───────────────────────────────────────────
    const removeMealItem = useCallback(
        (meal, itemId) => {
            if (!activePlanId) return;
            setPlans((prev) =>
                prev.map((p) => {
                    if (p.id !== activePlanId) return p;
                    const meals = { ...p.meals };
                    meals[meal] = (meals[meal] || []).filter((item) => item.id !== itemId);
                    return { ...p, meals };
                })
            );
            markDirty();
        },
        [activePlanId, markDirty]
    );

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
        isDirty,
        deleteToast,
        setDeleteToast,
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
