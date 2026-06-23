import { useMemo, useState, useEffect } from "react";
import { APP_CONFIG } from "../../data/config";
import { PRESET_PLANS, MEALS } from "../../data/presetPlans";
import { aggregateMeal, combineDay, foodById } from "../../engines/nutrientEngine";
import { scoreMeal, scoreDay } from "../../engines/scoringEngine";
import { getHealthGoals, getUserHealthGoals } from "../../services/databaseService";
import { useAuth } from "../../hooks/useAuth";
import { useProfile } from "../../context/ProfileContext";
import { useLocalStorageState } from "../../hooks/useLocalStorage";
import { downloadPlanAsPdf } from "../../utils/generatePlanPdf";
import Section from "../ui/Section";
import Kpi from "../ui/Kpi";
import { StatCard, EditableStatCard } from "../ui/StatCard";
import PlanSidebar from "../dashboard/PlanSidebar";
import MealBuilder from "../dashboard/MealBuilder";
import NutrientSummary from "../dashboard/NutrientSummary";
import ComparisonSection from "../dashboard/ComparisonSection";

function createPlan(name, meals) {
    return { id: crypto.randomUUID(), name, meals };
}

function DashboardPage() {
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
    const [deleteToast, setDeleteToast] = useState(null);
    const [newPlanName, setNewPlanName] = useState("");
    const [userGoalNames, setUserGoalNames] = useState([]);
    const [copyModal, setCopyModal] = useState(null);
    const [copyPlanName, setCopyPlanName] = useState("");

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 2000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

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

    function downloadUserPlanPdf(planId) {
        const plan = userPlans.find((p) => p.id === planId);
        const summary = summaries.find((s) => s.plan.id === planId);
        if (plan && summary) {
            downloadPlanAsPdf(plan, summary);
        }
    }

    function duplicatePresetAsUserPlan(presetPlan) {
        setCopyPlanName(`${presetPlan.name} (copy)`);
        setCopyModal(presetPlan);
    }

    function confirmCopyPlan() {
        if (!copyModal) return;
        const name = copyPlanName.trim() || `${copyModal.name} (copy)`;
        const newPlan = createPlan(name, {
            Breakfast: copyModal.meals.Breakfast.map(i => ({ ...i, id: crypto.randomUUID() })),
            Lunch: copyModal.meals.Lunch.map(i => ({ ...i, id: crypto.randomUUID() })),
            Dinner: copyModal.meals.Dinner.map(i => ({ ...i, id: crypto.randomUUID() })),
            Snacks: copyModal.meals.Snacks.map(i => ({ ...i, id: crypto.randomUUID() })),
        });
        setUserPlans((prev) => [...prev, newPlan]);
        setActivePlanId(newPlan.id);
        setPlanView("user");
        setToast(`Copied "${copyModal.name}" as "${name}"`);
        setCopyModal(null);
        setCopyPlanName("");
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

    const dayScore = activeSummary?.dayScore?.score || 0;
    const scoreTone =
        dayScore >= 85 ? "good" : dayScore >= 70 ? "neutral" : dayScore >= 50 ? "warn" : "bad";

    return (
        <div className="dashboard-page">
            {toast && <div className="toast-popup" role="alert" aria-live="polite">{toast}</div>}

            {deleteToast && (
                <div className="delete-toast-popup" role="alert" aria-live="assertive">
                    <span>Plan &ldquo;{deleteToast.planName}&rdquo; deleted</span>
                    <div className="delete-toast-actions">
                        <button className="undo-btn" onClick={deleteToast.undoAction}>Undo</button>
                        <button className="close-btn" onClick={() => setDeleteToast(null)}>✕</button>
                    </div>
                </div>
            )}

            {copyModal && (
                <div className="modal-overlay" onClick={() => setCopyModal(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Save plan as:</h3>
                        <input
                            type="text"
                            className="modal-input"
                            value={copyPlanName}
                            onChange={(e) => setCopyPlanName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && confirmCopyPlan()}
                            autoFocus
                            placeholder="Enter plan name"
                        />
                        <div className="modal-actions">
                            <button onClick={confirmCopyPlan}>Save</button>
                            <button className="secondary" onClick={() => setCopyModal(null)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="hero-stats">
                <StatCard label="Daily score" value={dayScore} tone={scoreTone} />
                <EditableStatCard
                    label="Vegetable target"
                    value={vegetableTarget}
                    unit="g"
                    onChange={(v) => setVegetableTarget(Number(v))}
                />
                <EditableStatCard
                    label="Sugar limit"
                    value={sugarLimit}
                    unit="g"
                    onChange={(v) => setSugarLimit(Number(v))}
                />
            </div>

            <div className="dashboard">
                <PlanSidebar
                    presetPlans={presetPlans}
                    userPlans={userPlans}
                    planView={planView}
                    setPlanView={setPlanView}
                    activePlanId={activePlanId}
                    setActivePlanId={setActivePlanId}
                    summaries={summaries}
                    newPlanName={newPlanName}
                    setNewPlanName={setNewPlanName}
                    onCreatePlan={saveNewPlan}
                    onResetPlan={resetActivePlan}
                    onDeletePlan={deleteUserPlan}
                    onDownloadPlan={downloadUserPlanPdf}
                    onDuplicatePreset={duplicatePresetAsUserPlan}
                    visibleFatLimit={visibleFatLimit}
                    profile={profile}
                    userGoalNames={userGoalNames}
                    dayTotals={activeSummary?.dayTotals}
                />

                <main className="content">
                    <div className="kpi-grid">
                        <Kpi label="Day score" value={dayScore} tone={scoreTone} hint={activeSummary?.dayScore?.band || "No band"} />
                        <Kpi label="Energy" value={Math.round(activeSummary?.dayTotals?.kcal || 0)} hint="kcal/day" />
                        <Kpi label="Vegetables" value={Math.round(activeSummary?.dayTotals?.vegetablesG || 0)} hint="g/day" />
                        <Kpi label="Visible fat" value={Math.round(activeSummary?.dayTotals?.visibleFat || 0)} hint="g/day" />
                    </div>

                    <MealBuilder
                        activePlan={activePlan}
                        activeSummary={activeSummary}
                        isPresetActive={isPresetActive}
                        selectedMeal={selectedMeal}
                        setSelectedMeal={setSelectedMeal}
                        selectedFoodId={selectedFoodId}
                        setSelectedFoodId={setSelectedFoodId}
                        grams={grams}
                        setGrams={setGrams}
                        selectedDay={selectedDay}
                        setSelectedDay={setSelectedDay}
                        instructions={instructions}
                        setInstructions={setInstructions}
                        onAddFood={addFood}
                        onUpdateMealItem={updateMealItem}
                        onRemoveMealItem={removeMealItem}
                        onDuplicateMealItem={duplicateMealItem}
                    />

                    <NutrientSummary
                        activeSummary={activeSummary}
                        activePlan={activePlan}
                        selectedMeal={selectedMeal}
                    />


                    <ComparisonSection summaries={summaries} bestSummary={bestSummary} />
                </main>
            </div>
        </div>
    );
}

export default DashboardPage;
