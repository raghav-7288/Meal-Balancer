import { createContext, useContext, useMemo, useState, useEffect } from "react";
import { APP_CONFIG } from "../data/config";
import { PRESET_PLANS, MEALS } from "../data/presetPlans";
import { aggregateMeal, combineDay, foodById } from "../engines/nutrientEngine";
import { scoreMeal, scoreDay } from "../engines/scoringEngine";
import { getHealthGoals, getUserHealthGoals } from "../services/databaseService";
import { useAuth } from "../hooks/useAuth";
import { useProfile } from "./ProfileContext";
import { useLocalStorageState } from "../hooks/useLocalStorage";

const PlanContext = createContext(null);

function createPlan(name, meals) {
    return { id: crypto.randomUUID(), name, meals };
}

export function PlanProvider({ children }) {
    const { user } = useAuth();
    const { profile } = useProfile();

    const [presetPlans] = useState(() => PRESET_PLANS.map(p => ({ ...p, isPreset: true })));
    const [userPlans, setUserPlans] = useLocalStorageState("meal-balancer-user-plans", []);
    const [planView, setPlanView] = useState("preset");
    const plans = useMemo(() => [...presetPlans, ...userPlans], [presetPlans, userPlans]);
    const [activePlanId, setActivePlanId] = useState(PRESET_PLANS[0].id);
    const [vegetableTarget, setVegetableTarget] = useState(APP_CONFIG.vegetableBenchmarkG);
    const [sugarLimit, setSugarLimit] = useState(APP_CONFIG.addedSugarLimitG);
    const [selectedMeal, setSelectedMeal] = useState("");
    const [selectedFoodId, setSelectedFoodId] = useState("");
    const [grams, setGrams] = useState("");
    const [selectedDay, setSelectedDay] = useState("");
    const [instructions, setInstructions] = useState("");
    const [toast, setToast] = useState(null);
    const [newPlanName, setNewPlanName] = useState("");
    const [userGoalNames, setUserGoalNames] = useState([]);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 2000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

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

    const activePlan = plans.find((p) => p.id === activePlanId) || plans[0];

    const summaries = useMemo(() => {
        return plans.map((plan) => {
            const mealTotals = {};
            const mealScores = {};

            for (const mealName of MEALS) {
                const totals = aggregateMeal(plan.meals[mealName] || []);
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
        });
    }, [plans]);

    const activeSummary = summaries.find((s) => s.plan.id === activePlanId) || summaries[0];
    const bestSummary = [...summaries].sort((a, b) => b.dayScore.score - a.dayScore.score)[0];

    const visibleFatLimit =
        APP_CONFIG.visibleFat?.[profile.sex]?.[profile.activity] ||
        APP_CONFIG.visibleFat?.female?.moderate ||
        25;

    const isPresetActive = presetPlans.some(p => p.id === activePlanId);

    function updateMealItem(mealName, itemId, newGrams) {
        setUserPlans((prev) =>
            prev.map((plan) =>
                plan.id === activePlanId
                    ? {
                        ...plan,
                        meals: {
                            ...plan.meals,
                            [mealName]: plan.meals[mealName].map((item) =>
                                item.id === itemId ? { ...item, grams: Number(newGrams) } : item
                            ),
                        },
                    }
                    : plan
            )
        );
    }

    function removeMealItem(mealName, itemId) {
        setUserPlans((prev) =>
            prev.map((plan) =>
                plan.id === activePlanId
                    ? {
                        ...plan,
                        meals: {
                            ...plan.meals,
                            [mealName]: plan.meals[mealName].filter((item) => item.id !== itemId),
                        },
                    }
                    : plan
            )
        );
    }

    function duplicateMealItem(mealName, item) {
        setUserPlans((prev) =>
            prev.map((plan) =>
                plan.id === activePlanId
                    ? {
                        ...plan,
                        meals: {
                            ...plan.meals,
                            [mealName]: [
                                ...plan.meals[mealName],
                                { ...item, id: crypto.randomUUID() },
                            ],
                        },
                    }
                    : plan
            )
        );
    }

    function addFood() {
        if (!selectedMeal || !selectedFoodId || !grams) return;
        const food = foodById(selectedFoodId);
        if (!food) return;

        if (isPresetActive) {
            const presetPlan = presetPlans.find(p => p.id === activePlanId);
            const newPlan = createPlan(`${presetPlan.name} (copy)`, {
                Breakfast: presetPlan.meals.Breakfast.map(i => ({ ...i, id: crypto.randomUUID() })),
                Lunch: presetPlan.meals.Lunch.map(i => ({ ...i, id: crypto.randomUUID() })),
                Dinner: presetPlan.meals.Dinner.map(i => ({ ...i, id: crypto.randomUUID() })),
                Snacks: presetPlan.meals.Snacks.map(i => ({ ...i, id: crypto.randomUUID() })),
            });
            newPlan.meals[selectedMeal].push({
                id: crypto.randomUUID(),
                foodId: selectedFoodId,
                grams: Number(grams),
                day: selectedDay || "",
                instructions: instructions || "",
            });
            setUserPlans((prev) => [...prev, newPlan]);
            setActivePlanId(newPlan.id);
            setPlanView("user");
            setToast(`Copied preset & added "${food.name}" to ${selectedMeal}`);
        } else {
            setUserPlans((prev) =>
                prev.map((plan) =>
                    plan.id === activePlanId
                        ? {
                            ...plan,
                            meals: {
                                ...plan.meals,
                                [selectedMeal]: [
                                    ...plan.meals[selectedMeal],
                                    {
                                        id: crypto.randomUUID(),
                                        foodId: selectedFoodId,
                                        grams: Number(grams),
                                        day: selectedDay || "",
                                        instructions: instructions || "",
                                    },
                                ],
                            },
                        }
                        : plan
                )
            );
            setToast(`"${food.name}" added to ${selectedMeal}`);
        }
        setSelectedMeal("");
        setSelectedFoodId("");
        setGrams("");
        setSelectedDay("");
        setInstructions("");
    }

    function saveNewPlan() {
        const name = newPlanName.trim() || `My Plan ${userPlans.length + 1}`;
        const nextPlan = createPlan(name, {
            Breakfast: [], Lunch: [], Dinner: [], Snacks: [],
        });
        setUserPlans((prev) => [...prev, nextPlan]);
        setActivePlanId(nextPlan.id);
        setPlanView("user");
        setNewPlanName("");
    }

    function deleteUserPlan(planId) {
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
    }

    function duplicatePresetAsUserPlan(presetPlan) {
        const newPlan = createPlan(`${presetPlan.name} (copy)`, {
            Breakfast: presetPlan.meals.Breakfast.map(i => ({ ...i, id: crypto.randomUUID() })),
            Lunch: presetPlan.meals.Lunch.map(i => ({ ...i, id: crypto.randomUUID() })),
            Dinner: presetPlan.meals.Dinner.map(i => ({ ...i, id: crypto.randomUUID() })),
            Snacks: presetPlan.meals.Snacks.map(i => ({ ...i, id: crypto.randomUUID() })),
        });
        setUserPlans((prev) => [...prev, newPlan]);
        setActivePlanId(newPlan.id);
        setPlanView("user");
        setToast(`Copied "${presetPlan.name}" as your own plan`);
    }

    function resetActivePlan() {
        setUserPlans((prev) =>
            prev.map((plan) =>
                plan.id === activePlanId
                    ? { ...plan, meals: { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] } }
                    : plan
            )
        );
    }

    const value = {
        presetPlans,
        userPlans,
        plans,
        planView,
        setPlanView,
        activePlanId,
        setActivePlanId,
        activePlan,
        vegetableTarget,
        setVegetableTarget,
        sugarLimit,
        setSugarLimit,
        selectedMeal,
        setSelectedMeal,
        selectedFoodId,
        setSelectedFoodId,
        grams,
        setGrams,
        selectedDay,
        setSelectedDay,
        instructions,
        setInstructions,
        toast,
        setToast,
        newPlanName,
        setNewPlanName,
        userGoalNames,
        summaries,
        activeSummary,
        bestSummary,
        visibleFatLimit,
        isPresetActive,
        profile,
        updateMealItem,
        removeMealItem,
        duplicateMealItem,
        addFood,
        saveNewPlan,
        deleteUserPlan,
        duplicatePresetAsUserPlan,
        resetActivePlan,
    };

    return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePlan() {
    const ctx = useContext(PlanContext);
    if (!ctx) throw new Error("usePlan must be used within a PlanProvider");
    return ctx;
}

