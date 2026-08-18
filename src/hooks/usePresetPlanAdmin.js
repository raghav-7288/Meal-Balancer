import { useState, useEffect, useCallback, useRef } from "react";
import { MEALS } from "../data/presetPlans";
import {
    fetchAllPresetPlans,
    upsertPresetPlan,
    deletePresetPlan,
} from "../services/presetPlanService";
import toast from "react-hot-toast";
import { buildDayCopies } from "../utils/copyMealItem";

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
    const [itemDeleteToast, setItemDeleteToast] = useState(null);

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

    // ─── Auto-dismiss delete toast after undo window ─────────────────────
    useEffect(() => {
        if (deleteToast) {
            deleteTimerRef.current = setTimeout(() => {
                setDeleteToast(null);
            }, 10000);
            return () => {
                if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
            };
        }
    }, [deleteToast]);

    /**
     * Dismiss the delete toast immediately (e.g. ✕ button).
     */
    const confirmDelete = useCallback(() => {
        if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
        setDeleteToast(null);
    }, []);

    // ─── Auto-dismiss item delete toast ──────────────────────────────────
    useEffect(() => {
        if (itemDeleteToast) {
            const timer = setTimeout(() => setItemDeleteToast(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [itemDeleteToast]);

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
                    mealTimes: {},
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
        async (id) => {
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

            // Delete from database IMMEDIATELY
            try {
                await deletePresetPlan(id);
            } catch (err) {
                console.error("Failed to delete plan:", err.message);
                toast.error("Failed to delete plan from database");
                // Restore the plan in local state since DB delete failed
                setPlans((prev) => [...prev, deletedPlan]);
                setActivePlanId(deletedPlan.id);
                return;
            }

            // Show undo toast — undo will re-insert the plan into the DB
            setDeleteToast({
                planId: id,
                planName: deletedPlan.name,
                undoAction: async () => {
                    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
                    setDeleteToast(null);
                    try {
                        await upsertPresetPlan(deletedPlan);
                        setPlans((prev) => [...prev, deletedPlan]);
                        setActivePlanId(deletedPlan.id);
                        toast.success(`"${deletedPlan.name}" restored`);
                    } catch (err) {
                        console.error("Failed to restore plan:", err.message);
                        toast.error("Failed to restore plan");
                    }
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

    // ─── Add a food item to a meal slot (supports multi-ingredient) ──
    const addFood = useCallback(
        (meal, menuVal, instructions, ingredients) => {
            if (!activePlanId || !ingredients || ingredients.length === 0) return;

            const totalGrams = ingredients.reduce((sum, ing) => sum + Number(ing.grams), 0);
            const isSingle = ingredients.length === 1;
            const singleIng = ingredients[0];

            const newItem = isSingle
                ? {
                      id: crypto.randomUUID(),
                      foodId: String(singleIng.foodId),
                      foodName: singleIng.foodName,
                      grams: Number(singleIng.grams),
                      menu: menuVal || "",
                      instructions: instructions || "",
                      foodGroupId: singleIng.foodGroupId || null,
                      foodGroup: singleIng.foodGroup || "",
                      day: viewDay,
                      // Custom foods store the database "equivalent" as foodId (above);
                      // these flags carry the custom label + equivalent for display.
                      ...(singleIng.isCustom && {
                          isCustom: true,
                          equivalentFoodName: singleIng.equivalentFoodName || "",
                      }),
                  }
                : {
                      id: crypto.randomUUID(),
                      foodId: "composite",
                      foodName: menuVal || ingredients.map((i) => i.foodName).join(" + "),
                      grams: totalGrams,
                      menu: menuVal || "",
                      instructions: instructions || "",
                      day: viewDay,
                      ingredients: ingredients.map((ing) => ({
                          foodId: String(ing.foodId),
                          foodName: ing.foodName,
                          grams: Number(ing.grams),
                          foodGroupId: ing.foodGroupId || null,
                          foodGroup: ing.foodGroup || "",
                          ...(ing.isCustom && {
                              isCustom: true,
                              equivalentFoodName: ing.equivalentFoodName || "",
                          }),
                      })),
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
            const label = isSingle ? `"${singleIng.foodName}"` : `"${newItem.foodName}"`;
            toast.success(`${label} added to ${meal} (${viewDay})`);
        },
        [activePlanId, viewDay, markDirty]
    );

    // ─── Update the clock time for a meal slot ────────────────────────
    const updateMealTime = useCallback(
        (meal, time) => {
            if (!activePlanId) return;
            setPlans((prev) =>
                prev.map((p) =>
                    p.id === activePlanId
                        ? { ...p, mealTimes: { ...(p.mealTimes || {}), [meal]: time } }
                        : p
                )
            );
            markDirty();
        },
        [activePlanId, markDirty]
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

    // ─── Copy a meal item to one or more other days ───────────────────
    const copyMealItemToDays = useCallback(
        (meal, itemId, targetDays) => {
            if (!activePlanId || !itemId || !targetDays || targetDays.length === 0) return;
            const plan = plans.find((p) => p.id === activePlanId);
            const slotItems = plan?.meals?.[meal] || [];
            const source = slotItems.find((it) => it.id === itemId);
            if (!source) return;

            const additions = buildDayCopies(source, slotItems, targetDays);
            if (additions.length === 0) {
                toast("Already added to the selected day(s)", { icon: "ℹ️" });
                return;
            }

            setPlans((prev) =>
                prev.map((p) => {
                    if (p.id !== activePlanId) return p;
                    const meals = { ...p.meals };
                    meals[meal] = [...(meals[meal] || []), ...additions];
                    return { ...p, meals };
                })
            );
            markDirty();
            const label = source.foodName || source.menu || "Item";
            toast.success(
                `Copied "${label}" to ${additions.length} day${additions.length > 1 ? "s" : ""}`
            );
        },
        [activePlanId, plans, markDirty]
    );

    // ─── Remove a meal item (with undo) ────────────────────────────────
    const removeMealItem = useCallback(
        (meal, itemId) => {
            if (!activePlanId) return;

            // Find the item being removed for undo
            const currentPlan = plans.find((p) => p.id === activePlanId);
            const removedItem = currentPlan?.meals?.[meal]?.find((item) => item.id === itemId);

            setPlans((prev) =>
                prev.map((p) => {
                    if (p.id !== activePlanId) return p;
                    const meals = { ...p.meals };
                    meals[meal] = (meals[meal] || []).filter((item) => item.id !== itemId);
                    return { ...p, meals };
                })
            );
            markDirty();

            // Show undo toast
            if (removedItem) {
                const foodLabel = removedItem.foodName || removedItem.foodId || "Item";
                setItemDeleteToast({
                    foodLabel,
                    undoAction: () => {
                        setPlans((prev) =>
                            prev.map((p) => {
                                if (p.id !== activePlanId) return p;
                                const meals = { ...p.meals };
                                meals[meal] = [...(meals[meal] || []), removedItem];
                                return { ...p, meals };
                            })
                        );
                        markDirty();
                        setItemDeleteToast(null);
                        toast.success(`"${foodLabel}" restored`);
                    },
                });
            }
        },
        [activePlanId, plans, markDirty]
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
        itemDeleteToast,
        setItemDeleteToast,
        viewDay,
        setViewDay,
        createPlan,
        savePlan,
        removePlan,
        confirmDelete,
        toggleActive,
        updatePlanField,
        addFood,
        updateMealItem,
        updateMealTime,
        removeMealItem,
        copyMealItemToDays,
        reload,
    };
}
