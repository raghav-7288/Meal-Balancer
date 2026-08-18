import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { APP_CONFIG } from "../data/config";
import { MEALS, DAYS } from "../data/presetPlans";
import { aggregateMeal, combineDay, foodById } from "../engines/nutrientEngine";
import { scoreMeal, scoreDay } from "../engines/scoringEngine";
import { getHealthGoals, getUserHealthGoals, getMajorGroups } from "../services/databaseService";
import { fetchFoodNutrients } from "../services/foodSearchService";
import { useAuth } from "./useAuth";
import { useProfile } from "../context/ProfileContext";
import { useLocalStorageState } from "./useLocalStorage";
import { useSyncedPlans } from "./useSyncedPlans";
import { usePresetPlans } from "./usePresetPlans";
import { useNutrientResolver } from "./useNutrientResolver";
import { useMealHistory } from "./useMealHistory";
import useHotkeys from "./useHotkeys";
import useFocusTrap from "./useFocusTrap";
import { buildDayCopies } from "../utils/copyMealItem";

/** Get today's weekday name (Monday–Sunday). */
function getTodayName() {
    const idx = new Date().getDay(); // 0=Sun … 6=Sat
    return DAYS[idx === 0 ? 6 : idx - 1];
}

function createPlan(name, meals, guidelines = "", mealTimes = {}) {
    return { id: crypto.randomUUID(), name, meals, guidelines, mealTimes };
}

export function useDashboardState() {
    const { user, isAuthenticated } = useAuth();
    const { profile } = useProfile();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const { presetPlans, isLoading: presetLoading } = usePresetPlans();
    const [userPlans, setUserPlans, { syncStatus, syncError, retrySync }] = useSyncedPlans();
    const [planView, setPlanView] = useState("preset");
    const plans = useMemo(() => [...presetPlans, ...userPlans], [presetPlans, userPlans]);
    const [activePlanId, setActivePlanId] = useState(() => presetPlans[0]?.id || "");
    const [viewDay, setViewDay] = useState(getTodayName);

    // Ref to avoid re-triggering effect when userPlans changes
    const userPlansRef = useRef(userPlans);
    useEffect(() => {
        userPlansRef.current = userPlans;
    }, [userPlans]);

    // Update activePlanId when preset plans load from DB (IDs may change)
    useEffect(() => {
        if (presetPlans.length > 0) {
            setActivePlanId((prev) => {
                const allIds = [...presetPlans, ...userPlansRef.current].map((p) => p.id);
                return allIds.includes(prev) ? prev : presetPlans[0].id;
            });
        }
    }, [presetPlans]);

    // Open specific plan from URL query param (e.g., ?plan=<id>)
    useEffect(() => {
        const planId = searchParams.get("plan");
        if (planId) {
            const isUserPlan = userPlans.some((p) => p.id === planId);
            if (isUserPlan) {
                setActivePlanId(planId); // eslint-disable-line react-hooks/set-state-in-effect
                setPlanView("user");
            }
        }
    }, [searchParams, userPlans]);

    const [nutrientLimits, setNutrientLimits] = useLocalStorageState(
        "diet-specifix-nutrient-limits",
        {
            carbs: 300,
            protein: 60,
            fat: 65,
            sugar: APP_CONFIG.addedSugarLimitG,
            fibre: 30,
        }
    );
    const [isAddingFood, setIsAddingFood] = useState(false);
    const [majorGroups, setMajorGroups] = useState([]);
    const [deleteToast, setDeleteToast] = useState(null);
    const [itemDeleteToast, setItemDeleteToast] = useState(null);
    const [newPlanName, setNewPlanName] = useState("");
    const [userGoalNames, setUserGoalNames] = useState([]);
    const [copyModal, setCopyModal] = useState(null);
    const [copyPlanName, setCopyPlanName] = useState("");
    const [guidelines, setGuidelines] = useState("");
    const { logDay } = useMealHistory();

    // Focus trap for copy modal (#35)
    const copyModalRef = useFocusTrap(!!copyModal);

    // Load major groups on mount for food group classification
    useEffect(() => {
        getMajorGroups()
            .then((groups) => setMajorGroups(groups || []))
            .catch((err) => console.error("Failed to load major groups:", err));
    }, []);

    useEffect(() => {
        if (deleteToast) {
            const timer = setTimeout(() => setDeleteToast(null), 10000);
            return () => clearTimeout(timer);
        }
    }, [deleteToast]);

    useEffect(() => {
        if (itemDeleteToast) {
            const timer = setTimeout(() => setItemDeleteToast(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [itemDeleteToast]);

    useEffect(() => {
        async function loadUserGoals() {
            if (!user?.id) return;
            try {
                const [allGoals, userGoals] = await Promise.all([
                    getHealthGoals(),
                    getUserHealthGoals(user.id),
                ]);
                const selectedIds = userGoals.map((ug) => ug.health_goal_id);
                const names = allGoals
                    .filter((g) => selectedIds.includes(g.health_goal_id))
                    .map((g) => g.goal_name);
                setUserGoalNames(names);
            } catch (err) {
                console.error("Failed to load user goals:", err);
            }
        }
        loadUserGoals();
    }, [user?.id]);

    // Sync guidelines field only when active plan switches
    // Use refs for plans to avoid re-running when plan content changes
    const presetPlansRef = useRef(presetPlans);
    useEffect(() => {
        presetPlansRef.current = presetPlans;
    }, [presetPlans]);
    useEffect(() => {
        const plan = [...presetPlansRef.current, ...userPlansRef.current].find(
            (p) => p.id === activePlanId
        );
        setGuidelines(plan?.guidelines || "");
    }, [activePlanId]);

    const guidelinesRef = useRef(guidelines);
    useEffect(() => {
        guidelinesRef.current = guidelines;
    }, [guidelines]);

    const saveGuidelines = useCallback(() => {
        const planId = activePlanIdRef.current;
        // Only save if the active plan is actually a user plan
        const isUserPlan = userPlansRef.current.some((p) => p.id === planId);
        if (!isUserPlan) return;

        setUserPlans((prev) =>
            prev.map((plan) =>
                plan.id === planId
                    ? { ...plan, guidelines: guidelinesRef.current }
                    : plan
            )
        );
        toast.success("Guidelines saved!");
    }, [setUserPlans]);

    const activePlan = plans.find((p) => p.id === activePlanId) || plans[0];

    // Hydrate nutrients for DB foods that don't store them inline (e.g. preset
    // plans built via the admin UI) so scores/KPIs aren't stuck at zero.
    const resolveNutrients = useNutrientResolver(plans);

    // ── Helper to compute a single plan's summary for the current day ──
    const computePlanSummary = (plan) => {
        const mealTotals = {};
        const mealScores = {};
        const meals = plan.meals || {};

        for (const mealName of MEALS) {
            const allItems = meals[mealName] || [];
            const dayItems = allItems.filter((i) => i.day === viewDay || !i.day);
            const totals = aggregateMeal(dayItems, resolveNutrients);
            mealTotals[mealName] = totals;
            mealScores[mealName] = scoreMeal(totals);
        }

        const dayTotals = combineDay(mealTotals);
        const dayScore = scoreDay(dayTotals);

        return { plan, mealTotals, mealScores, dayTotals, dayScore };
    };

    // ── Active plan summary (computed eagerly) ──
    const activeSummary = useMemo(() => {
        if (!activePlan) return null;
        return computePlanSummary(activePlan);
    }, [activePlan, viewDay, resolveNutrients]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── All plan summaries (computed lazily for comparison section) ──
    const summaries = useMemo(() => {
        return plans.map(computePlanSummary);
    }, [plans, viewDay, resolveNutrients]); // eslint-disable-line react-hooks/exhaustive-deps

    const bestSummary = useMemo(() => {
        return [...summaries].sort((a, b) => b.dayScore.score - a.dayScore.score)[0];
    }, [summaries]);

    const visibleFatLimit =
        APP_CONFIG.visibleFat?.[profile?.sex]?.[profile?.activity] ||
        APP_CONFIG.visibleFat?.female?.moderate ||
        25;

    const isPresetActive = presetPlans.some((p) => p.id === activePlanId);

    const updateMealItem = useCallback(
        (mealName, itemId, updates) => {
            setUserPlans((prev) =>
                prev.map((plan) =>
                    plan.id === activePlanId
                        ? {
                              ...plan,
                              meals: {
                                  ...(plan.meals || {}),
                                  [mealName]: (plan.meals?.[mealName] || []).map((item) =>
                                      item.id === itemId ? { ...item, ...updates } : item
                                  ),
                              },
                          }
                        : plan
                )
            );
        },
        [activePlanId, setUserPlans]
    );

    const updateMealTime = useCallback(
        (mealName, time) => {
            setUserPlans((prev) =>
                prev.map((plan) =>
                    plan.id === activePlanId
                        ? {
                              ...plan,
                              mealTimes: { ...(plan.mealTimes || {}), [mealName]: time },
                          }
                        : plan
                )
            );
        },
        [activePlanId, setUserPlans]
    );

    const removeMealItem = useCallback(
        (mealName, itemId) => {
            // Find the item being removed for undo
            const currentPlans = userPlansRef.current;
            const currentPlan = currentPlans.find((p) => p.id === activePlanId);
            const removedItem = currentPlan?.meals?.[mealName]?.find((item) => item.id === itemId);

            setUserPlans((prev) =>
                prev.map((plan) =>
                    plan.id === activePlanId
                        ? {
                              ...plan,
                              meals: {
                                  ...(plan.meals || {}),
                                  [mealName]: (plan.meals?.[mealName] || []).filter(
                                      (item) => item.id !== itemId
                                  ),
                              },
                          }
                        : plan
                )
            );

            // Show undo toast notification
            if (removedItem) {
                const foodLabel = removedItem.foodName || removedItem.foodId || "Item";
                setItemDeleteToast({
                    foodLabel,
                    undoAction: () => {
                        setUserPlans((prev) =>
                            prev.map((plan) =>
                                plan.id === activePlanId
                                    ? {
                                          ...plan,
                                          meals: {
                                              ...(plan.meals || {}),
                                              [mealName]: [
                                                  ...(plan.meals?.[mealName] || []),
                                                  removedItem,
                                              ],
                                          },
                                      }
                                    : plan
                            )
                        );
                        setItemDeleteToast(null);
                        toast.success(`"${foodLabel}" restored`);
                    },
                });
            }
        },
        [activePlanId, setUserPlans]
    );

    // Keep refs for addFood closure to avoid re-creating callback on every plan/day change
    const viewDayRef = useRef(viewDay);
    const activePlanIdRef = useRef(activePlanId);
    const majorGroupsRef = useRef(majorGroups);
    useEffect(() => {
        viewDayRef.current = viewDay;
    }, [viewDay]);
    useEffect(() => {
        activePlanIdRef.current = activePlanId; // eslint-disable-line react-hooks/immutability
    }, [activePlanId]);
    useEffect(() => {
        majorGroupsRef.current = majorGroups;
    }, [majorGroups]);

    const addFood = useCallback(
        async (selectedMeal, menuVal, instructionsVal, ingredients) => {
            if (!selectedMeal || !ingredients || ingredients.length === 0) return;
            setIsAddingFood(true);

            try {
                // Resolve nutrients for each ingredient
                const resolvedIngredients = [];
                for (const ing of ingredients) {
                    const food = foodById(ing.foodId);
                    let nutrients = null;
                    let foodGroup = "";

                    if (!food) {
                        const result = await fetchFoodNutrients(ing.foodId);
                        // Use fetched nutrients or fallback to zeros so the item
                        // still participates in food group tracking (vegetablesG, visibleFat, etc.)
                        nutrients = result?.nutrients || {
                            kcal: 0,
                            carbs: 0,
                            protein: 0,
                            fat: 0,
                            fibre: 0,
                            vitamins: 0,
                            minerals: 0,
                        };
                        if (ing.foodGroupId && majorGroupsRef.current.length > 0) {
                            const group = majorGroupsRef.current.find(
                                (g) => g.major_group_id === ing.foodGroupId
                            );
                            foodGroup = group?.group_name?.toLowerCase() || "";
                        }
                    } else {
                        foodGroup = food.group || "";
                    }

                    resolvedIngredients.push({
                        foodId: ing.foodId,
                        foodName: ing.foodName,
                        grams: Number(ing.grams),
                        foodGroupId: ing.foodGroupId || null,
                        foodGroup,
                        ...(nutrients && { nutrients }),
                        ...(ing.isCustom && {
                            isCustom: true,
                            equivalentFoodName: ing.equivalentFoodName || "",
                        }),
                    });
                }

                const totalGrams = resolvedIngredients.reduce((sum, ing) => sum + ing.grams, 0);

                // For single ingredient, store as flat item (backward compatible)
                const isSingle = resolvedIngredients.length === 1;
                const singleIng = resolvedIngredients[0];

                const mealItem = isSingle
                    ? {
                          id: crypto.randomUUID(),
                          foodId: singleIng.foodId,
                          foodName: singleIng.foodName,
                          grams: singleIng.grams,
                          day: viewDayRef.current,
                          menu: menuVal || "",
                          instructions: instructionsVal || "",
                          ...(singleIng.nutrients && { nutrients: singleIng.nutrients }),
                          ...(singleIng.foodGroup && { foodGroup: singleIng.foodGroup }),
                          ...(singleIng.isCustom && {
                              isCustom: true,
                              equivalentFoodName: singleIng.equivalentFoodName || "",
                          }),
                      }
                    : {
                          id: crypto.randomUUID(),
                          foodId: "composite",
                          foodName: menuVal || resolvedIngredients.map((i) => i.foodName).join(" + "),
                          grams: totalGrams,
                          day: viewDayRef.current,
                          menu: menuVal || "",
                          instructions: instructionsVal || "",
                          ingredients: resolvedIngredients,
                      };

                setUserPlans((prev) =>
                    prev.map((plan) =>
                        plan.id === activePlanIdRef.current
                            ? {
                                  ...plan,
                                  meals: {
                                      ...(plan.meals || {}),
                                      [selectedMeal]: [
                                          ...(plan.meals?.[selectedMeal] || []),
                                          mealItem,
                                      ],
                                  },
                              }
                            : plan
                    )
                );
                const label = isSingle ? `"${singleIng.foodName}"` : `"${mealItem.foodName}"`;
                toast.success(`${label} added to ${selectedMeal} (${viewDayRef.current})`);
            } catch (err) {
                console.error("Error adding food:", err);
                toast.error("Failed to add food. Please try again.");
            } finally {
                setIsAddingFood(false);
            }
        },
        [setUserPlans]
    );

    /**
     * Copy a meal item to one or more other days within the active plan.
     * Clones with fresh ids, skips the source day, and de-dupes days that
     * already have an identical item so re-running "copy to all" is idempotent.
     */
    const copyMealItemToDays = useCallback(
        (mealName, itemId, targetDays) => {
            if (!mealName || !itemId || !targetDays || targetDays.length === 0) return;
            const planId = activePlanIdRef.current;
            const plan = userPlansRef.current.find((p) => p.id === planId);
            const slotItems = plan?.meals?.[mealName] || [];
            const source = slotItems.find((it) => it.id === itemId);
            if (!source) return;

            const additions = buildDayCopies(source, slotItems, targetDays);
            if (additions.length === 0) {
                toast("Already added to the selected day(s)", { icon: "ℹ️" });
                return;
            }

            setUserPlans((prev) =>
                prev.map((p) =>
                    p.id === planId
                        ? {
                              ...p,
                              meals: {
                                  ...(p.meals || {}),
                                  [mealName]: [...(p.meals?.[mealName] || []), ...additions],
                              },
                          }
                        : p
                )
            );

            const label = source.foodName || source.menu || "Item";
            toast.success(
                `Copied "${label}" to ${additions.length} day${additions.length > 1 ? "s" : ""}`
            );
        },
        [setUserPlans]
    );

    const saveNewPlan = useCallback(() => {
        const name = newPlanName.trim() || `My Plan ${userPlansRef.current.length + 1}`;
        const emptyMeals = {};
        for (const slot of MEALS) {
            emptyMeals[slot] = [];
        }
        const nextPlan = createPlan(name, emptyMeals);
        setUserPlans((prev) => [...prev, nextPlan]);
        setActivePlanId(nextPlan.id);
        setPlanView("user");
        setNewPlanName("");
    }, [newPlanName, setUserPlans]);

    function deleteUserPlan(planId) {
        const deletedPlan = userPlans.find((p) => p.id === planId);
        if (!deletedPlan) return;

        setUserPlans((prev) => prev.filter((p) => p.id !== planId));
        if (activePlanId === planId) {
            const remaining = userPlans.filter((p) => p.id !== planId);
            if (remaining.length > 0) {
                setActivePlanId(remaining[0].id);
            } else {
                setActivePlanId(presetPlans[0].id);
                setPlanView("preset");
            }
        }

        setDeleteToast({
            planName: deletedPlan.name,
            undoAction: () => {
                setUserPlans((prev) => [...prev, deletedPlan]);
                setActivePlanId(deletedPlan.id);
                setPlanView("user");
                setDeleteToast(null);
            },
        });
    }

    const duplicatePresetAsUserPlan = useCallback((presetPlan) => {
        setCopyPlanName(`${presetPlan.name} (copy)`);
        setCopyModal(presetPlan);
    }, []);

    const confirmCopyPlan = useCallback(() => {
        if (!copyModal) return;
        const name = copyPlanName.trim() || `${copyModal.name} (copy)`;
        const copyMeals = copyModal.meals || {};
        const newMeals = {};
        for (const slot of MEALS) {
            newMeals[slot] = (copyMeals[slot] || []).map((i) => ({
                ...i,
                id: crypto.randomUUID(),
            }));
        }
        const newPlan = createPlan(name, newMeals, copyModal.guidelines || "", {
            ...(copyModal.mealTimes || {}),
        });
        setUserPlans((prev) => [...prev, newPlan]);
        setActivePlanId(newPlan.id);
        setPlanView("user");
        toast.success(`Copied "${copyModal.name}" as "${name}"`);
        setCopyModal(null);
        setCopyPlanName("");
    }, [copyModal, copyPlanName, setUserPlans]);

    const resetActivePlan = useCallback(() => {
        const emptyMeals = {};
        for (const slot of MEALS) {
            emptyMeals[slot] = [];
        }
        setUserPlans((prev) =>
            prev.map((plan) =>
                plan.id === activePlanIdRef.current ? { ...plan, meals: emptyMeals } : plan
            )
        );
    }, [setUserPlans]);

    const logToday = useCallback(() => {
        if (!activeSummary) return;
        const dt = activeSummary.dayTotals;
        const ds = activeSummary.dayScore;
        logDay({
            planName: activePlan?.name || "Unknown",
            score: ds?.score ?? 0,
            band: ds?.band || "",
            kcal: dt?.kcal ?? 0,
            protein: dt?.protein ?? 0,
            carbs: dt?.carbs ?? 0,
            fat: dt?.fat ?? 0,
            fibre: dt?.fibre ?? 0,
            vegetablesG: dt?.vegetablesG ?? 0,
            visibleFat: dt?.visibleFat ?? 0,
        });
        toast.success("Today's score logged to Progress! ");
    }, [activeSummary, activePlan?.name, logDay]);

    const dayScore = activeSummary?.dayScore?.score || 0;
    const scoreTone =
        dayScore >= 85 ? "good" : dayScore >= 70 ? "neutral" : dayScore >= 50 ? "warn" : "bad";

    // Announce score changes to screen readers (#35)
    useEffect(() => {
        const el = document.getElementById("score-announcer");
        if (el && dayScore > 0) {
            el.textContent = `${viewDay} score: ${dayScore} out of 100`;
        }
    }, [dayScore, viewDay]);

    // Keyboard shortcuts (#34) — memoized to avoid listener re-registration
    const isPresetActiveRef = useRef(isPresetActive);
    const copyModalRef2 = useRef(copyModal);
    const saveNewPlanRef = useRef(saveNewPlan);
    const saveGuidelinesRef = useRef(saveGuidelines);
    useEffect(() => {
        isPresetActiveRef.current = isPresetActive;
        copyModalRef2.current = copyModal;
        saveNewPlanRef.current = saveNewPlan;
        saveGuidelinesRef.current = saveGuidelines;
    }, [isPresetActive, copyModal, saveNewPlan, saveGuidelines]);

    const shortcuts = useMemo(
        () => ({
            "ctrl+s": () => {
                if (!isPresetActiveRef.current) saveGuidelinesRef.current();
            },
            "ctrl+n": () => saveNewPlanRef.current(),
            "ctrl+p": () => navigate("/weekly-planner"),
            escape: () => {
                if (copyModalRef2.current) setCopyModal(null);
            },
        }),
        [navigate]
    );
    useHotkeys(shortcuts);

    return {
        // Auth & profile
        isAuthenticated,
        profile,
        // Plans
        presetPlans,
        userPlans,
        plans,
        planView,
        setPlanView,
        activePlanId,
        setActivePlanId,
        activePlan,
        isPresetActive,
        presetLoading,
        // Sync
        syncStatus,
        syncError,
        retrySync,
        // Day
        viewDay,
        setViewDay,
        // Summaries
        summaries,
        activeSummary,
        bestSummary,
        dayScore,
        scoreTone,
        // Nutrient limits
        nutrientLimits,
        setNutrientLimits,
        // Food
        isAddingFood,
        addFood,
        updateMealItem,
        updateMealTime,
        removeMealItem,
        copyMealItemToDays,
        // Plan management
        newPlanName,
        setNewPlanName,
        saveNewPlan,
        deleteUserPlan,
        resetActivePlan,
        duplicatePresetAsUserPlan,
        // Copy modal
        copyModal,
        setCopyModal,
        copyPlanName,
        setCopyPlanName,
        confirmCopyPlan,
        copyModalRef,
        // Guidelines
        guidelines,
        setGuidelines,
        saveGuidelines,
        // Delete toast
        deleteToast,
        setDeleteToast,
        // Item delete undo
        itemDeleteToast,
        setItemDeleteToast,
        // Other
        visibleFatLimit,
        userGoalNames,
        logToday,
    };
}
