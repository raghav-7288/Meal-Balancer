import { useMemo, useState, useEffect } from "react";
import {
    Activity,
    BarChart3,
    Copy,
    Database,
    Leaf,
    Plus,
    Sparkles,
    Trash2,
} from "lucide-react";
import { FOODS } from "../../data/foods";
import { APP_CONFIG } from "../../data/config";
import { scoreMeal, scoreDay } from "../../engines/scoringEngine";
import { getHealthGoals, getUserHealthGoals } from "../../services/databaseService";
import { useAuth } from "../../hooks/useAuth";
import SupabaseTest from "../SupabaseTest";
import Section from "../ui/Section";
import Field from "../ui/Field";
import Kpi from "../ui/Kpi";
import { StatCard, EditableStatCard } from "../ui/StatCard";
import { useLocalStorageState } from "../../hooks/useLocalStorage";

const MEALS = ["Breakfast", "Lunch", "Dinner", "Snacks"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function createPlan(name, meals) {
    return {
        id: crypto.randomUUID(),
        name,
        meals,
    };
}

const starterPlans = [
    createPlan("Balanced office day", {
        Breakfast: [
            { id: crypto.randomUUID(), foodId: "banana", grams: 100 },
            { id: crypto.randomUUID(), foodId: "curd", grams: 150 },
            { id: crypto.randomUUID(), foodId: "roti", grams: 60 },
        ],
        Lunch: [
            { id: crypto.randomUUID(), foodId: "dal", grams: 150 },
            { id: crypto.randomUUID(), foodId: "mixedveg", grams: 150 },
            { id: crypto.randomUUID(), foodId: "roti", grams: 60 },
        ],
        Dinner: [
            { id: crypto.randomUUID(), foodId: "rice", grams: 150 },
            { id: crypto.randomUUID(), foodId: "egg", grams: 50 },
            { id: crypto.randomUUID(), foodId: "mixedveg", grams: 100 },
        ],
        Snacks: [{ id: crypto.randomUUID(), foodId: "banana", grams: 100 }],
    }),
    createPlan("Cereal-heavy pattern", {
        Breakfast: [{ id: crypto.randomUUID(), foodId: "rice", grams: 250 }],
        Lunch: [
            { id: crypto.randomUUID(), foodId: "rice", grams: 300 },
            { id: crypto.randomUUID(), foodId: "roti", grams: 60 },
        ],
        Dinner: [
            { id: crypto.randomUUID(), foodId: "rice", grams: 200 },
            { id: crypto.randomUUID(), foodId: "roti", grams: 60 },
        ],
        Snacks: [{ id: crypto.randomUUID(), foodId: "banana", grams: 100 }],
    }),
    createPlan("High-protein day", {
        Breakfast: [
            { id: crypto.randomUUID(), foodId: "egg", grams: 100 },
            { id: crypto.randomUUID(), foodId: "curd", grams: 200 },
            { id: crypto.randomUUID(), foodId: "banana", grams: 100 },
        ],
        Lunch: [
            { id: crypto.randomUUID(), foodId: "dal", grams: 200 },
            { id: crypto.randomUUID(), foodId: "roti", grams: 60 },
            { id: crypto.randomUUID(), foodId: "mixedveg", grams: 100 },
        ],
        Dinner: [
            { id: crypto.randomUUID(), foodId: "egg", grams: 100 },
            { id: crypto.randomUUID(), foodId: "dal", grams: 150 },
            { id: crypto.randomUUID(), foodId: "rice", grams: 100 },
        ],
        Snacks: [{ id: crypto.randomUUID(), foodId: "curd", grams: 150 }],
    }),
    createPlan("Light veggie day", {
        Breakfast: [
            { id: crypto.randomUUID(), foodId: "banana", grams: 100 },
            { id: crypto.randomUUID(), foodId: "curd", grams: 100 },
        ],
        Lunch: [
            { id: crypto.randomUUID(), foodId: "mixedveg", grams: 200 },
            { id: crypto.randomUUID(), foodId: "roti", grams: 30 },
            { id: crypto.randomUUID(), foodId: "dal", grams: 100 },
        ],
        Dinner: [
            { id: crypto.randomUUID(), foodId: "mixedveg", grams: 200 },
            { id: crypto.randomUUID(), foodId: "roti", grams: 30 },
        ],
        Snacks: [{ id: crypto.randomUUID(), foodId: "banana", grams: 100 }],
    }),
    createPlan("Dal & roti comfort", {
        Breakfast: [
            { id: crypto.randomUUID(), foodId: "roti", grams: 90 },
            { id: crypto.randomUUID(), foodId: "curd", grams: 150 },
        ],
        Lunch: [
            { id: crypto.randomUUID(), foodId: "dal", grams: 200 },
            { id: crypto.randomUUID(), foodId: "roti", grams: 90 },
            { id: crypto.randomUUID(), foodId: "mixedveg", grams: 100 },
        ],
        Dinner: [
            { id: crypto.randomUUID(), foodId: "dal", grams: 150 },
            { id: crypto.randomUUID(), foodId: "roti", grams: 60 },
            { id: crypto.randomUUID(), foodId: "mixedveg", grams: 100 },
        ],
        Snacks: [
            { id: crypto.randomUUID(), foodId: "banana", grams: 100 },
            { id: crypto.randomUUID(), foodId: "curd", grams: 100 },
        ],
    }),
];

function foodById(id) {
    return FOODS.find((f) => f.id === id);
}

function aggregateMeal(items) {
    const totals = {
        kcal: 0, carbs: 0, protein: 0, fat: 0, fibre: 0,
        vitamins: 0, minerals: 0, addedSugar: 0, visibleFat: 0,
        vegetablesG: 0, cerealEnergy: 0, exchangeTotals: {},
    };

    for (const item of items) {
        const food = foodById(item.foodId);
        if (!food) continue;
        const factor = item.grams / food.gramsPerExchange;
        const kcal = food.kcal * factor;

        totals.kcal += kcal;
        totals.carbs += food.carbs * factor;
        totals.protein += food.protein * factor;
        totals.fat += food.fat * factor;
        totals.fibre += food.fibre * factor;
        totals.vitamins += food.vitamins * factor;
        totals.minerals += food.minerals * factor;
        totals.visibleFat += food.group === "fats" ? item.grams : 0;
        totals.vegetablesG += food.group === "vegetables" ? item.grams : 0;
        totals.cerealEnergy += food.group === "cereals" ? kcal : 0;
        totals.exchangeTotals[food.group] = (totals.exchangeTotals[food.group] || 0) + factor;
    }

    totals.cerealEnergyPct = totals.kcal > 0 ? (totals.cerealEnergy / totals.kcal) * 100 : 0;
    return totals;
}

function combineDay(mealTotals) {
    const day = {
        kcal: 0, carbs: 0, protein: 0, fat: 0, fibre: 0,
        vitamins: 0, minerals: 0, addedSugar: 0, visibleFat: 0,
        vegetablesG: 0, cerealEnergy: 0, exchangeTotals: {},
    };

    for (const meal of Object.values(mealTotals)) {
        day.kcal += meal.kcal;
        day.carbs += meal.carbs;
        day.protein += meal.protein;
        day.fat += meal.fat;
        day.fibre += meal.fibre;
        day.vitamins += meal.vitamins;
        day.minerals += meal.minerals;
        day.addedSugar += meal.addedSugar;
        day.visibleFat += meal.visibleFat;
        day.vegetablesG += meal.vegetablesG;
        day.cerealEnergy += meal.cerealEnergy;

        for (const [k, v] of Object.entries(meal.exchangeTotals)) {
            day.exchangeTotals[k] = (day.exchangeTotals[k] || 0) + v;
        }
    }

    day.cerealEnergyPct = day.kcal > 0 ? (day.cerealEnergy / day.kcal) * 100 : 0;
    return day;
}

function DashboardPage({ profile }) {
    const { user } = useAuth();

    const [presetPlans] = useState(() => starterPlans.map(p => ({ ...p, isPreset: true })));
    const [userPlans, setUserPlans] = useLocalStorageState("meal-balancer-user-plans", []);
    const [planView, setPlanView] = useState("preset");
    const plans = useMemo(() => [...presetPlans, ...userPlans], [presetPlans, userPlans]);
    const [activePlanId, setActivePlanId] = useState(starterPlans[0].id);
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

        const isPresetActive = presetPlans.some(p => p.id === activePlanId);
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

    const dayScore = activeSummary?.dayScore?.score || 0;
    const scoreTone =
        dayScore >= 85 ? "good" : dayScore >= 70 ? "neutral" : dayScore >= 50 ? "warn" : "bad";

    return (
        <div className="dashboard-page">
            {toast && <div className="toast-popup">{toast}</div>}

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
                <aside className="sidebar">
                    <Section title="Plan controls" icon={<Sparkles size={16} />}>
                        <input
                            type="text"
                            placeholder={`My Plan ${userPlans.length + 1}`}
                            value={newPlanName}
                            onChange={(e) => setNewPlanName(e.target.value)}
                            className="plan-name-input"
                        />
                        <div className="button-row">
                            <button onClick={saveNewPlan}>
                                <Plus size={14} /> Create
                            </button>
                            <button className="secondary" onClick={resetActivePlan} disabled={presetPlans.some(p => p.id === activePlanId)}>
                                Reset meals
                            </button>
                        </div>

                        <div className="plan-toggle">
                            <button
                                className={`toggle-btn ${planView === "preset" ? "active" : ""}`}
                                onClick={() => setPlanView("preset")}
                            >
                                ⭐ Pre-saved
                            </button>
                            <button
                                className={`toggle-btn ${planView === "user" ? "active" : ""}`}
                                onClick={() => setPlanView("user")}
                            >
                                👤 My Plans
                            </button>
                        </div>

                        {planView === "preset" && (
                            <>
                                <p className="small-copy" style={{ marginBottom: "0.5rem", fontStyle: "italic", opacity: 0.8 }}>
                                    Ready-made templates — click to preview, use "Copy" to make your own
                                </p>
                                <div className="saved-plans">
                                    {presetPlans.map((plan) => {
                                        const summary = summaries.find((s) => s.plan.id === plan.id);
                                        const active = plan.id === activePlanId;
                                        return (
                                            <div key={plan.id} className={`plan-row-wrapper ${active ? "active" : ""}`}>
                                                <button
                                                    className={`plan-row ${active ? "active" : ""}`}
                                                    onClick={() => setActivePlanId(plan.id)}
                                                >
                                                    <span>{plan.name}</span>
                                                    <strong>{summary?.dayScore?.score || 0}</strong>
                                                </button>
                                                <button
                                                    className="copy-btn"
                                                    title="Copy as my plan"
                                                    onClick={() => duplicatePresetAsUserPlan(plan)}
                                                >
                                                    <Copy size={12} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        {planView === "user" && (
                            <>
                                <p className="small-copy" style={{ marginBottom: "0.5rem", opacity: 0.8 }}>
                                    Your custom plans — fully editable
                                </p>
                                <div className="saved-plans">
                                    {userPlans.length === 0 && (
                                        <p className="small-copy" style={{ textAlign: "center", padding: "1rem 0" }}>
                                            No plans yet. Click "Create" or copy a pre-saved template.
                                        </p>
                                    )}
                                    {userPlans.map((plan) => {
                                        const summary = summaries.find((s) => s.plan.id === plan.id);
                                        const active = plan.id === activePlanId;
                                        return (
                                            <div key={plan.id} className={`plan-row-wrapper ${active ? "active" : ""}`}>
                                                <button
                                                    className={`plan-row ${active ? "active" : ""}`}
                                                    onClick={() => setActivePlanId(plan.id)}
                                                >
                                                    <span>{plan.name}</span>
                                                    <strong>{summary?.dayScore?.score || 0}</strong>
                                                </button>
                                                <button
                                                    className="delete-btn"
                                                    title="Delete plan"
                                                    onClick={() => deleteUserPlan(plan.id)}
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </Section>

                    <Section title="Visible fat reference" icon={<Leaf size={16} />}>
                        <p className="small-copy">
                            Current editable benchmark for this profile:
                        </p>
                        <div className="fat-box">
                            <strong>{visibleFatLimit} g/day</strong>
                            <span>{profile.sex} · {profile.activity}</span>
                        </div>
                    </Section>

                    <Section title="My health goals" icon={<Activity size={16} />}>
                        {userGoalNames.length > 0 ? (
                            <div className="goals-tags">
                                {userGoalNames.map((name) => (
                                    <span key={name} className="goal-tag">{name}</span>
                                ))}
                            </div>
                        ) : (
                            <p className="small-copy">
                                No goals selected. Go to Profile to set your health goals.
                            </p>
                        )}
                    </Section>
                </aside>

                <main className="content">
                    <div className="kpi-grid">
                        <Kpi label="Day score" value={dayScore} tone={scoreTone} hint={activeSummary?.dayScore?.band || "No band"} />
                        <Kpi label="Energy" value={Math.round(activeSummary?.dayTotals?.kcal || 0)} hint="kcal/day" />
                        <Kpi label="Vegetables" value={Math.round(activeSummary?.dayTotals?.vegetablesG || 0)} hint="g/day" />
                        <Kpi label="Visible fat" value={Math.round(activeSummary?.dayTotals?.visibleFat || 0)} hint="g/day" />
                    </div>

                    <Section title="Meal builder" icon={<Plus size={16} />}>
                        <div className="builder-row">
                            <Field label="Day">
                                <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)}>
                                    <option value="" disabled>Select day</option>
                                    {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </Field>
                            <Field label="Meal slot">
                                <select value={selectedMeal} onChange={(e) => setSelectedMeal(e.target.value)}>
                                    <option value="" disabled>Select slot</option>
                                    {MEALS.map((m) => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </Field>
                            <Field label="Food item">
                                <select value={selectedFoodId} onChange={(e) => setSelectedFoodId(e.target.value)}>
                                    <option value="" disabled>Select item</option>
                                    {FOODS.map((food) => <option key={food.id} value={food.id}>{food.name}</option>)}
                                </select>
                            </Field>
                            <Field label="Grams">
                                <input type="number" value={grams} placeholder="Select grams" onChange={(e) => setGrams(e.target.value)} />
                            </Field>
                            <button onClick={addFood}>Add food</button>
                        </div>

                        <div className="builder-instructions-row">
                            <Field label="Instructions (optional)">
                                <input type="text" value={instructions} placeholder="e.g. lightly roasted, no oil, with salt..." onChange={(e) => setInstructions(e.target.value)} />
                            </Field>
                        </div>

                        <div className="meal-panels">
                            {MEALS.map((meal) => {
                                const mealItems = activePlan.meals[meal] || [];
                                const mealScore = activeSummary?.mealScores?.[meal]?.score || 0;
                                const mealBand = activeSummary?.mealScores?.[meal]?.band || "Poor balance";
                                const mealReasons = activeSummary?.mealScores?.[meal]?.reasons || [];

                                return (
                                    <div key={meal} className="meal-card">
                                        <div className="meal-head">
                                            <div>
                                                <h3>{meal}</h3>
                                                <p>{mealItems.length} item(s)</p>
                                            </div>
                                            <div className={`score-pill ${mealScore >= 70 ? "good" : mealScore >= 50 ? "warn" : "bad"}`}>
                                                {mealScore} / 100 · {mealBand}
                                            </div>
                                        </div>
                                        <div className="table-wrap">
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>Food</th><th>g</th><th>Day</th><th>Group</th><th>Exchange</th><th>Instructions</th><th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {mealItems.length ? mealItems.map((item) => {
                                                        const food = foodById(item.foodId);
                                                        const exchange = food ? item.grams / food.gramsPerExchange : 0;
                                                        return (
                                                            <tr key={item.id}>
                                                                <td>{food?.name || "-"}</td>
                                                                <td><input type="number" value={item.grams} onChange={(e) => updateMealItem(meal, item.id, e.target.value)} /></td>
                                                                <td>{item.day || "-"}</td>
                                                                <td>{food?.group || "-"}</td>
                                                                <td>{exchange.toFixed(2)}</td>
                                                                <td className="instructions-cell">{item.instructions || "-"}</td>
                                                                <td>
                                                                    <div className="icon-row">
                                                                        <button className="icon-btn" onClick={() => duplicateMealItem(meal, item)}><Copy size={14} /></button>
                                                                        <button className="icon-btn danger" onClick={() => removeMealItem(meal, item.id)}><Trash2 size={14} /></button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    }) : (
                                                        <tr><td colSpan={7} className="empty-cell">No items yet.</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="reason-box">
                                            <strong>Reasons for imbalance</strong>
                                            <ul>{mealReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Section>

                    <div className="two-col">
                        <Section title="Daily nutrient-category summary" icon={<BarChart3 size={16} />}>
                            <div className="nutrient-list">
                                {[
                                    ["Carbohydrates", activeSummary?.dayTotals?.carbs || 0],
                                    ["Proteins", activeSummary?.dayTotals?.protein || 0],
                                    ["Fats", activeSummary?.dayTotals?.fat || 0],
                                    ["Fibre", activeSummary?.dayTotals?.fibre || 0],
                                    ["Vitamins", activeSummary?.dayTotals?.vitamins || 0],
                                    ["Minerals", activeSummary?.dayTotals?.minerals || 0],
                                ].map(([label, value]) => (
                                    <div key={label} className="nutrient-row">
                                        <div className="nutrient-top">
                                            <span>{label}</span>
                                            <strong>{Number(value).toFixed(1)}</strong>
                                        </div>
                                        <div className="bar">
                                            <div className="bar-fill" style={{ width: `${Math.min(100, Number(value) * 4)}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Section>

                        <Section title="Exchange conversion table" icon={<Leaf size={16} />}>
                            <div className="table-wrap">
                                <table>
                                    <thead><tr><th>Food</th><th>g</th><th>Group</th><th>Exchange</th></tr></thead>
                                    <tbody>
                                        {(activePlan.meals[selectedMeal] || []).map((item) => {
                                            const food = foodById(item.foodId);
                                            const exchange = food ? item.grams / food.gramsPerExchange : 0;
                                            return (
                                                <tr key={item.id}>
                                                    <td>{food?.name || "-"}</td>
                                                    <td>{item.grams}</td>
                                                    <td>{food?.group || "-"}</td>
                                                    <td>{exchange.toFixed(2)}</td>
                                                </tr>
                                            );
                                        })}
                                        {!activePlan.meals[selectedMeal]?.length && (
                                            <tr><td colSpan={4} className="empty-cell">Select a meal and add foods to see exchange conversion.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Section>
                    </div>

                    <Section title="Combination comparison" icon={<Sparkles size={16} />}>
                        <div className="comparison-grid">
                            {summaries.map((summary) => (
                                <div key={summary.plan.id} className={`compare-card ${summary.plan.id === bestSummary?.plan?.id ? "best" : ""}`}>
                                    <div className="compare-head">
                                        <strong>{summary.plan.name}</strong>
                                        <span>{summary.dayScore.score} / 100</span>
                                    </div>
                                    <p>{summary.dayScore.band}</p>
                                    <p className="small-copy">Energy: {Math.round(summary.dayTotals.kcal)} kcal</p>
                                    <p className="small-copy">Vegetables: {Math.round(summary.dayTotals.vegetablesG)} g</p>
                                </div>
                            ))}
                        </div>
                    </Section>

                    <Section title="Best combination recommendation" icon={<Sparkles size={16} />}>
                        <div className="recommendation">
                            <div className="recommendation-score">
                                <strong>{bestSummary?.plan?.name || "-"}</strong>
                                <span>{bestSummary?.dayScore?.score || 0} / 100</span>
                            </div>
                            <p>
                                This is currently the best-balanced plan for the selected profile because it
                                stays closer to the cereal-energy target, includes more vegetables and
                                protein, and avoids obvious excess in visible fat.
                            </p>
                            <ul>
                                <li>Reduce refined cereal volume if the score drops from balance.</li>
                                <li>Add dal, curd, egg, or paneer for better protein support.</li>
                                <li>Increase vegetables at lunch and dinner.</li>
                                <li>Keep added sugar and oil editable and profile-specific.</li>
                            </ul>
                        </div>
                    </Section>

                    <Section title="Database connection" icon={<Database size={16} />}>
                        <SupabaseTest />
                    </Section>
                </main>
            </div>
        </div>
    );
}

export default DashboardPage;

