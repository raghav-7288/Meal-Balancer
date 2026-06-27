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
import { useMealHistory } from "./useMealHistory";
import useHotkeys from "./useHotkeys";
import useFocusTrap from "./useFocusTrap";

/** Get today's weekday name (Monday–Sunday). */
function getTodayName() {
    const idx = new Date().getDay(); // 0=Sun … 6=Sat
    return DAYS[idx === 0 ? 6 : idx - 1];
}

function createPlan(name, meals, guidelines = "") {
    return { id: crypto.randomUUID(), name, meals, guidelines };
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
            salt: APP_CONFIG.saltLimitG,
            fibre: 30,
        }
    );
    const [isAddingFood, setIsAddingFood] = useState(false);
    const [majorGroups, setMajorGroups] = useState([]);
    const [deleteToast, setDeleteToast] = useState(null);
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
        setUserPlans((prev) =>
            prev.map((plan) =>
                plan.id === activePlanIdRef.current
                    ? { ...plan, guidelines: guidelinesRef.current }
                    : plan
            )
        );
        toast.success("Guidelines saved!");
    }, [setUserPlans]);

    const activePlan = plans.find((p) => p.id === activePlanId) || plans[0];

    // ── Helper to compute a single plan's summary for the current day ──
    const computePlanSummary = (plan) => {
        const mealTotals = {};
        const mealScores = {};
        const meals = plan.meals || {};

        for (const mealName of MEALS) {
            const allItems = meals[mealName] || [];
            const dayItems = allItems.filter((i) => i.day === viewDay || !i.day);
            const totals = aggregateMeal(dayItems);
            mealTotals[mealName] = totals;
            mealScores[mealName] = scoreMeal({
                cerealEnergyPct: totals.cerealEnergyPct,
                vegetablesG: totals.vegetablesG,
                protein: totals.protein,
                fibre: totals.fibre,
                addedSugar: totals.addedSugar,
                visibleFat: totals.visibleFat,
            });
        }

        const dayTotals = combineDay(mealTotals);
        const dayScore = scoreDay({
            cerealEnergyPct: dayTotals.cerealEnergyPct,
            vegetablesG: dayTotals.vegetablesG,
            protein: dayTotals.protein,
            fibre: dayTotals.fibre,
            addedSugar: dayTotals.addedSugar,
            visibleFat: dayTotals.visibleFat,
        });

        return { plan, mealTotals, mealScores, dayTotals, dayScore };
    };

    // ── Active plan summary (computed eagerly) ──
    const activeSummary = useMemo(() => {
        if (!activePlan) return null;
        return computePlanSummary(activePlan);
    }, [activePlan, viewDay]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── All plan summaries (computed lazily for comparison section) ──
    const summaries = useMemo(() => {
        return plans.map(computePlanSummary);
    }, [plans, viewDay]); // eslint-disable-line react-hooks/exhaustive-deps

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

    const removeMealItem = useCallback(
        (mealName, itemId) => {
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
    // eslint-disable-next-line react-hooks/immutability
    useEffect(() => {
        activePlanIdRef.current = activePlanId;
    }, [activePlanId]);
    useEffect(() => {
        majorGroupsRef.current = majorGroups;
    }, [majorGroups]);

    const addFood = useCallback(
        async (
            selectedMeal,
            selectedFoodId,
            selectedFoodName,
            gramsVal,
            instructionsVal,
            selectedFoodGroupId
        ) => {
            if (!selectedMeal || !selectedFoodId || !gramsVal) return;
            setIsAddingFood(true);

            try {
                const food = foodById(selectedFoodId);
                const foodName = food?.name || selectedFoodName || "Unknown food";

                let nutrients = null;
                let foodGroup = "";

                if (!food) {
                    const result = await fetchFoodNutrients(selectedFoodId);
                    if (result) {
                        nutrients = result.nutrients;
                    }
                    if (selectedFoodGroupId && majorGroupsRef.current.length > 0) {
                        const group = majorGroupsRef.current.find(
                            (g) => g.major_group_id === selectedFoodGroupId
                        );
                        foodGroup = group?.group_name?.toLowerCase() || "";
                    }
                }

                const mealItem = {
                    id: crypto.randomUUID(),
                    foodId: selectedFoodId,
                    foodName: selectedFoodName || foodName,
                    grams: Number(gramsVal),
                    day: viewDayRef.current,
                    instructions: instructionsVal || "",
                    ...(nutrients && { nutrients }),
                    ...(foodGroup && { foodGroup }),
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
                toast.success(`"${foodName}" added to ${selectedMeal} (${viewDayRef.current})`);
            } catch (err) {
                console.error("Error adding food:", err);
                toast.error("Failed to add food. Please try again.");
            } finally {
                setIsAddingFood(false);
            }
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
        const newPlan = createPlan(name, newMeals, copyModal.guidelines || "");
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
        toast.success("Today's score logged to Progress! 📊");
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
    useEffect(() => {
        isPresetActiveRef.current = isPresetActive;
        copyModalRef2.current = copyModal;
    }, [isPresetActive, copyModal]);

    const shortcuts = useMemo(
        () => ({
            "ctrl+s": () => {
                if (!isPresetActiveRef.current) saveGuidelines();
            },
            "ctrl+n": () => saveNewPlan(),
            "ctrl+p": () => navigate("/weekly-planner"),
            escape: () => {
                if (copyModalRef2.current) setCopyModal(null);
            },
        }),
        []
    ); // eslint-disable-line react-hooks/exhaustive-deps
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
        removeMealItem,
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
        // Other
        visibleFatLimit,
        userGoalNames,
        logToday,
    };
}
