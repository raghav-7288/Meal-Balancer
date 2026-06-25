import { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { APP_CONFIG } from "../../data/config";
import { MEALS, DAYS } from "../../data/presetPlans";
import { aggregateMeal, combineDay, foodById } from "../../engines/nutrientEngine";
import { scoreMeal, scoreDay } from "../../engines/scoringEngine";
import { getHealthGoals, getUserHealthGoals, getMajorGroups } from "../../services/databaseService";
import { fetchFoodNutrients } from "../../services/foodSearchService";
import { useAuth } from "../../hooks/useAuth";
import { useProfile } from "../../context/ProfileContext";
import { useLocalStorageState } from "../../hooks/useLocalStorage";
import { useSyncedPlans } from "../../hooks/useSyncedPlans";
import { usePresetPlans } from "../../hooks/usePresetPlans";
import { useMealHistory } from "../../hooks/useMealHistory";
import Kpi from "../ui/Kpi";
import PlanSidebar from "../dashboard/PlanSidebar";
import MealBuilder from "../dashboard/MealBuilder";
import NutrientSummary from "../dashboard/NutrientSummary";
import NutrientLimits from "../dashboard/NutrientLimits";
import "../../components/dashboard/NutrientLimits.css";
import ComparisonSection from "../dashboard/ComparisonSection";
import { Calendar, Cloud, CloudOff, Loader } from "lucide-react";

/** Get today's weekday name (Monday–Sunday). */
function getTodayName() {
    const idx = new Date().getDay(); // 0=Sun … 6=Sat
    return DAYS[idx === 0 ? 6 : idx - 1];
}

function createPlan(name, meals, guidelines = "") {
    return { id: crypto.randomUUID(), name, meals, guidelines };
}

function DashboardPage() {
    const { user, isAuthenticated } = useAuth();
    const { profile } = useProfile();
    const [searchParams] = useSearchParams();

    const { presetPlans } = usePresetPlans();
    const [userPlans, setUserPlans, { syncStatus }] = useSyncedPlans();
    const [planView, setPlanView] = useState("preset");
    const plans = useMemo(() => [...presetPlans, ...userPlans], [presetPlans, userPlans]);
    const [activePlanId, setActivePlanId] = useState(() => presetPlans[0]?.id || "");
    const [viewDay, setViewDay] = useState(getTodayName);

    // Update activePlanId when preset plans load from DB (IDs may change)
    useEffect(() => {
        if (presetPlans.length > 0) {
            setActivePlanId((prev) => {
                const allIds = [...presetPlans, ...userPlans].map((p) => p.id);
                return allIds.includes(prev) ? prev : presetPlans[0].id;
            });
        }
    }, [presetPlans]); // eslint-disable-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect

    // Open specific plan from URL query param (e.g., ?plan=<id>)
    useEffect(() => {
        const planId = searchParams.get("plan");
        if (planId) {
            const isUserPlan = userPlans.some(p => p.id === planId);
            if (isUserPlan) {
                setActivePlanId(planId);
                setPlanView("user");
            }
        }
    }, [searchParams, userPlans]);
    const [nutrientLimits, setNutrientLimits] = useLocalStorageState("meal-balancer-nutrient-limits", {
        carbs: 300,
        protein: 60,
        fat: 65,
        sugar: APP_CONFIG.addedSugarLimitG,
        salt: APP_CONFIG.saltLimitG,
        fibre: 30,
    });
    const [isAddingFood, setIsAddingFood] = useState(false);
    const [majorGroups, setMajorGroups] = useState([]);
    const [toast, setToast] = useState(null);
    const [deleteToast, setDeleteToast] = useState(null);
    const [newPlanName, setNewPlanName] = useState("");
    const [userGoalNames, setUserGoalNames] = useState([]);
    const [copyModal, setCopyModal] = useState(null);
    const [copyPlanName, setCopyPlanName] = useState("");
    const [guidelines, setGuidelines] = useState("");
    const { logDay } = useMealHistory();

    // Load major groups on mount for food group classification
    useEffect(() => {
        getMajorGroups()
            .then((groups) => setMajorGroups(groups || []))
            .catch((err) => console.error("Failed to load major groups:", err));
    }, []);

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

    // Sync guidelines field only when active plan switches
    useEffect(() => {
        const plan = [...presetPlans, ...userPlans].find((p) => p.id === activePlanId);
        setGuidelines(plan?.guidelines || "");
    }, [activePlanId]); // eslint-disable-line react-hooks/exhaustive-deps

    function saveGuidelines() {
        setUserPlans((prev) =>
            prev.map((plan) =>
                plan.id === activePlanId
                    ? { ...plan, guidelines }
                    : plan
            )
        );
        setToast("Guidelines saved! ✅");
    }

    const activePlan = plans.find((p) => p.id === activePlanId) || plans[0];

    // ── Day-filtered summaries ──
    const summaries = useMemo(() => {
        return plans.map((plan) => {
            const mealTotals = {};
            const mealScores = {};

            for (const mealName of MEALS) {
                const allItems = plan.meals[mealName] || [];
                // Filter items to the selected day (items without a day show on every day)
                const dayItems = allItems.filter(i => i.day === viewDay || !i.day);
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
        });
    }, [plans, viewDay]);

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

    async function addFood(selectedMeal, selectedFoodId, selectedFoodName, gramsVal, instructionsVal, selectedFoodGroupId) {
        if (!selectedMeal || !selectedFoodId || !gramsVal) return;
        setIsAddingFood(true);

        try {
            const food = foodById(selectedFoodId);
            const foodName = food?.name || selectedFoodName || "Unknown food";

            // Fetch nutrients from database for the selected food
            let nutrients = null;
            let foodGroup = "";

            if (!food) {
                // Food is from database, fetch its nutrients
                const result = await fetchFoodNutrients(selectedFoodId);
                if (result) {
                    nutrients = result.nutrients;
                }
                // Determine food group name from major_group_id
                if (selectedFoodGroupId && majorGroups.length > 0) {
                    const group = majorGroups.find(g => g.major_group_id === selectedFoodGroupId);
                    foodGroup = group?.group_name?.toLowerCase() || "";
                }
            }

            const mealItem = {
                id: crypto.randomUUID(),
                foodId: selectedFoodId,
                foodName: selectedFoodName || foodName,
                grams: Number(gramsVal),
                day: viewDay,
                instructions: instructionsVal || "",
                ...(nutrients && { nutrients }),
                ...(foodGroup && { foodGroup }),
            };

            setUserPlans((prev) =>
                prev.map((plan) =>
                    plan.id === activePlanId
                        ? {
                            ...plan,
                            meals: {
                                ...plan.meals,
                                [selectedMeal]: [
                                    ...(plan.meals[selectedMeal] || []),
                                    mealItem,
                                ],
                            },
                        }
                        : plan
                )
            );
            setToast(`"${foodName}" added to ${selectedMeal} (${viewDay})`);
        } catch (err) {
            console.error("Error adding food:", err);
            setToast("Failed to add food. Please try again.");
        } finally {
            setIsAddingFood(false);
        }
    }

    function saveNewPlan() {
        const name = newPlanName.trim() || `My Plan ${userPlans.length + 1}`;
        const emptyMeals = {};
        for (const slot of MEALS) {
            emptyMeals[slot] = [];
        }
        const nextPlan = createPlan(name, emptyMeals);
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

    function duplicatePresetAsUserPlan(presetPlan) {
        setCopyPlanName(`${presetPlan.name} (copy)`);
        setCopyModal(presetPlan);
    }

    function confirmCopyPlan() {
        if (!copyModal) return;
        const name = copyPlanName.trim() || `${copyModal.name} (copy)`;
        const newMeals = {};
        for (const slot of MEALS) {
            newMeals[slot] = (copyModal.meals[slot] || []).map(i => ({ ...i, id: crypto.randomUUID() }));
        }
        const newPlan = createPlan(name, newMeals, copyModal.guidelines || "");
        setUserPlans((prev) => [...prev, newPlan]);
        setActivePlanId(newPlan.id);
        setPlanView("user");
        setToast(`Copied "${copyModal.name}" as "${name}"`);
        setCopyModal(null);
        setCopyPlanName("");
    }

    function resetActivePlan() {
        const emptyMeals = {};
        for (const slot of MEALS) {
            emptyMeals[slot] = [];
        }
        setUserPlans((prev) =>
            prev.map((plan) =>
                plan.id === activePlanId
                    ? { ...plan, meals: emptyMeals }
                    : plan
            )
        );
    }

    function logToday() {
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
        setToast("Today's score logged to Progress! 📊");
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

            {/* Day selector */}
            <div className="day-selector-row">
                <div className="day-chips" role="tablist" aria-label="Select day to view">
                    {DAYS.map((d) => (
                        <button
                            key={d}
                            className={`day-chip ${viewDay === d ? "active" : ""}`}
                            onClick={() => setViewDay(d)}
                            role="tab"
                            aria-selected={viewDay === d}
                        >
                            {d.slice(0, 3)}
                        </button>
                    ))}
                </div>
                <div className="planner-nav-actions">
                    {isAuthenticated && (
                        <span className={`sync-badge sync-badge--${syncStatus}`} title={
                            syncStatus === "syncing" ? "Syncing plans…" :
                            syncStatus === "synced" ? "Plans synced to cloud" :
                            syncStatus === "error" ? "Sync failed — using local data" :
                            "Plans stored locally"
                        }>
                            {syncStatus === "syncing" && <><Loader size={12} className="spin" /> Syncing</>}
                            {syncStatus === "synced" && <><Cloud size={12} /> Synced</>}
                            {syncStatus === "error" && <><CloudOff size={12} /> Offline</>}
                        </span>
                    )}
                    <button className="log-today-btn" onClick={logToday}>
                        📊 Log today
                    </button>
                    <Link to="/weekly-planner" className="planner-nav-link">
                        <Calendar size={14} /> Weekly view
                    </Link>
                </div>
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
                    onDuplicatePreset={duplicatePresetAsUserPlan}
                    visibleFatLimit={visibleFatLimit}
                    profile={profile}
                    userGoalNames={userGoalNames}
                    dayTotals={activeSummary?.dayTotals}
                />

                <main className="content">
                    <div className="kpi-grid">
                        <Kpi label={`${viewDay} score`} value={dayScore} tone={scoreTone} hint={activeSummary?.dayScore?.band || "No band"} />
                        <Kpi label="Energy" value={Math.round(activeSummary?.dayTotals?.kcal || 0)} hint="kcal/day" />
                        <Kpi label="Vegetables" value={Math.round(activeSummary?.dayTotals?.vegetablesG || 0)} hint="g/day" />
                        <Kpi label="Visible fat" value={Math.round(activeSummary?.dayTotals?.visibleFat || 0)} hint="g/day" />
                    </div>

                    <MealBuilder
                        activePlan={activePlan}
                        activeSummary={activeSummary}
                        isPresetActive={isPresetActive}
                        viewDay={viewDay}
                        onAddFood={addFood}
                        isAddingFood={isAddingFood}
                        onUpdateMealItem={updateMealItem}
                        onRemoveMealItem={removeMealItem}
                        onDuplicateMealItem={duplicateMealItem}
                    />

                    {/* Plan Guidelines */}
                    <div className="plan-guidelines-section">
                        <h3 className="plan-guidelines-title">📋 Plan Guidelines</h3>
                        <p className="plan-guidelines-hint">
                            Add overall guidelines or notes for this plan. These will be visible on the Weekly Planner.
                        </p>
                        <textarea
                            className="plan-guidelines-input"
                            value={guidelines}
                            onChange={(e) => setGuidelines(e.target.value)}
                            placeholder="e.g. Drink 8 glasses of water daily, avoid fried foods, eat dinner before 8 PM..."
                            disabled={isPresetActive}
                            rows={4}
                        />
                        <div className="plan-guidelines-actions">
                            {!isPresetActive && (
                                <button className="plan-guidelines-save-btn" onClick={saveGuidelines}>
                                    💾 Save Guidelines
                                </button>
                            )}
                            {isPresetActive && (
                                <p className="plan-guidelines-readonly-note">Copy this plan to edit guidelines.</p>
                            )}
                        </div>
                    </div>

                    <NutrientLimits
                        limits={nutrientLimits}
                        onChangeLimit={(key, value) => setNutrientLimits((prev) => ({ ...prev, [key]: value }))}
                        dayTotals={activeSummary?.dayTotals}
                    />

                    <NutrientSummary
                        activeSummary={activeSummary}
                        activePlan={activePlan}
                    />


                    <ComparisonSection summaries={summaries} bestSummary={bestSummary} />
                </main>
            </div>
        </div>
    );
}

export default DashboardPage;
