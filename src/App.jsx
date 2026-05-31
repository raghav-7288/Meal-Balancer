import React, { useMemo, useState, useEffect } from "react";
import "./App.css";
import {
    Activity,
    BarChart3,
    Copy,
    Database,
    Leaf,
    Plus,
    Sparkles,
    Trash2,
    User,
} from "lucide-react";
import { FOODS } from "./data/foods";
import { APP_CONFIG } from "./data/config";
import { scoreMeal, scoreDay } from "./engines/scoringEngine";
import SupabaseTest from "./components/SupabaseTest";
import AuthPage from "./components/AuthPage";
import UserProfile from "./components/UserProfile";
import { useAuth } from "./hooks/useAuth";

const MEALS = ["Breakfast", "Lunch", "Dinner", "Snacks"];
const ACTIVITY_OPTIONS = ["sedentary", "moderate", "heavy"];
const GOAL_OPTIONS = ["maintenance", "weight loss", "weight gain", "metabolic improvement"];
const DIET_OPTIONS = ["vegetarian", "eggetarian", "non-vegetarian", "Jain-compatible"];
const CONDITION_OPTIONS = [
    "diabetes risk",
    "obesity",
    "hypertension",
    "dyslipidemia",
    "PCOS",
    "fatty liver",
    "general wellness",
];

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
];

function foodById(id) {
    return FOODS.find((f) => f.id === id);
}

function aggregateMeal(items) {
    const totals = {
        kcal: 0,
        carbs: 0,
        protein: 0,
        fat: 0,
        fibre: 0,
        vitamins: 0,
        minerals: 0,
        addedSugar: 0,
        visibleFat: 0,
        vegetablesG: 0,
        cerealEnergy: 0,
        exchangeTotals: {},
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
        totals.addedSugar += food.id === "banana" ? 0 : 0;
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
        kcal: 0,
        carbs: 0,
        protein: 0,
        fat: 0,
        fibre: 0,
        vitamins: 0,
        minerals: 0,
        addedSugar: 0,
        visibleFat: 0,
        vegetablesG: 0,
        cerealEnergy: 0,
        exchangeTotals: {},
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

function App() {
    const { isAuthenticated, loading: authLoading } = useAuth();

    if (authLoading) {
        return (
            <div className="auth-loading-screen">
                <div className="auth-loading-spinner" />
                <p>Loading…</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <AuthPage />;
    }

    return <Dashboard />;
}

function Dashboard() {
    const [profile, setProfile] = useState({
        activity: "moderate",
        goal: "maintenance",
        dietType: "vegetarian",
        sex: "female",
        conditions: ["general wellness"],
        bmiTarget: "22",
    });

    const [plans, setPlans] = useState(starterPlans);
    const [activePlanId, setActivePlanId] = useState(starterPlans[0].id);
    const [selectedMeal, setSelectedMeal] = useState("");
    const [selectedFoodId, setSelectedFoodId] = useState("");
    const [grams, setGrams] = useState("");
    const [toast, setToast] = useState(null);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 2000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

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

            return {
                plan,
                mealTotals,
                mealScores,
                dayTotals,
                dayScore,
            };
        });
    }, [plans]);

    const activeSummary = summaries.find((s) => s.plan.id === activePlanId) || summaries[0];
    const bestSummary = [...summaries].sort((a, b) => b.dayScore.score - a.dayScore.score)[0];

    function updateMealItem(mealName, itemId, newGrams) {
        setPlans((prev) =>
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
        setPlans((prev) =>
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
        setPlans((prev) =>
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

        setPlans((prev) =>
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
                                },
                            ],
                        },
                    }
                    : plan
            )
        );

        setToast(`"${food.name}" added to ${selectedMeal}`);
        setSelectedMeal("");
        setSelectedFoodId("");
        setGrams("");
    }

    function saveNewPlan() {
        const nextPlan = createPlan(`Plan ${plans.length + 1}`, {
            Breakfast: [],
            Lunch: [],
            Dinner: [],
            Snacks: [],
        });
        setPlans((prev) => [...prev, nextPlan]);
        setActivePlanId(nextPlan.id);
    }

    function resetActivePlan() {
        setPlans((prev) =>
            prev.map((plan) =>
                plan.id === activePlanId
                    ? {
                        ...plan,
                        name: "New plan",
                        meals: {
                            Breakfast: [],
                            Lunch: [],
                            Dinner: [],
                            Snacks: [],
                        },
                    }
                    : plan
            )
        );
    }

    const dayScore = activeSummary?.dayScore?.score || 0;
    const scoreTone =
        dayScore >= 85 ? "good" : dayScore >= 70 ? "neutral" : dayScore >= 50 ? "warn" : "bad";

    const visibleFatLimit =
        APP_CONFIG.visibleFat?.[profile.sex]?.[profile.activity] ||
        APP_CONFIG.visibleFat?.female?.moderate ||
        25;

    return (
        <div className="app-shell">
            {toast && <div className="toast-popup">{toast}</div>}
            <header className="hero">
                <div>
                    <div className="eyebrow">
                        <Activity size={14} />
                        Indian diet planning dashboard
                    </div>
                    <h1>Meal Balancer</h1>
                    <p>
                        Build meals in grams, convert them into exchange-style categories, and score
                        the pattern with transparent reasons.
                    </p>
                </div>

                <div className="hero-stats">
                    <StatCard label="Daily score" value={dayScore} tone={scoreTone} />
                    <StatCard label="Vegetable target" value={`${APP_CONFIG.vegetableBenchmarkG}g`} />
                    <StatCard label="Sugar limit" value={`${APP_CONFIG.addedSugarLimitG}g`} />
                    <StatCard label="Best plan" value={bestSummary?.plan?.name || "-"} />
                </div>
            </header>

            <div className="dashboard">
                <aside className="sidebar">
                    <Section title="My account" icon={<User size={16} />}>
                        <UserProfile />
                    </Section>

                    <Section title="Profile setup" icon={<Activity size={16} />}>
                        <Field label="Activity level">
                            <select
                                value={profile.activity}
                                onChange={(e) => setProfile({ ...profile, activity: e.target.value })}
                            >
                                {ACTIVITY_OPTIONS.map((x) => (
                                    <option key={x} value={x}>
                                        {x}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="BMI / weight goal">
                            <select
                                value={profile.goal}
                                onChange={(e) => setProfile({ ...profile, goal: e.target.value })}
                            >
                                {GOAL_OPTIONS.map((x) => (
                                    <option key={x} value={x}>
                                        {x}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Diet type">
                            <select
                                value={profile.dietType}
                                onChange={(e) => setProfile({ ...profile, dietType: e.target.value })}
                            >
                                {DIET_OPTIONS.map((x) => (
                                    <option key={x} value={x}>
                                        {x}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Sex / reference profile">
                            <select
                                value={profile.sex}
                                onChange={(e) => setProfile({ ...profile, sex: e.target.value })}
                            >
                                <option value="female">female</option>
                                <option value="male">male</option>
                            </select>
                        </Field>

                        <Field label="BMI target">
                            <input
                                value={profile.bmiTarget}
                                onChange={(e) => setProfile({ ...profile, bmiTarget: e.target.value })}
                            />
                        </Field>

                        <div className="tag-grid">
                            {CONDITION_OPTIONS.map((tag) => (
                                <label key={tag} className="check-chip">
                                    <input
                                        type="checkbox"
                                        checked={profile.conditions.includes(tag)}
                                        onChange={(e) => {
                                            setProfile((p) => ({
                                                ...p,
                                                conditions: e.target.checked
                                                    ? Array.from(new Set([...p.conditions.filter((x) => x !== "general wellness"), tag]))
                                                    : p.conditions.filter((x) => x !== tag),
                                            }));
                                        }}
                                    />
                                    <span>{tag}</span>
                                </label>
                            ))}
                        </div>
                    </Section>

                    <Section title="Plan controls" icon={<Sparkles size={16} />}>
                        <div className="button-row">
                            <button onClick={saveNewPlan}>
                                <Plus size={14} /> Save plan
                            </button>
                            <button className="secondary" onClick={resetActivePlan}>
                                Reset
                            </button>
                        </div>

                        <div className="saved-plans">
                            {plans.map((plan) => {
                                const summary = summaries.find((s) => s.plan.id === plan.id);
                                const active = plan.id === activePlanId;
                                return (
                                    <button
                                        key={plan.id}
                                        className={`plan-row ${active ? "active" : ""}`}
                                        onClick={() => setActivePlanId(plan.id)}
                                    >
                                        <span>{plan.name}</span>
                                        <strong>{summary?.dayScore?.score || 0}</strong>
                                    </button>
                                );
                            })}
                        </div>
                    </Section>

                    <Section title="Visible fat reference" icon={<Leaf size={16} />}>
                        <p className="small-copy">
                            Current editable benchmark for this profile:
                        </p>
                        <div className="fat-box">
                            <strong>{visibleFatLimit} g/day</strong>
                            <span>
                {profile.sex} · {profile.activity}
              </span>
                        </div>
                    </Section>
                </aside>

                <main className="content">
                    <div className="kpi-grid">
                        <Kpi
                            label="Day score"
                            value={dayScore}
                            tone={scoreTone}
                            hint={activeSummary?.dayScore?.band || "No band"}
                        />
                        <Kpi
                            label="Energy"
                            value={Math.round(activeSummary?.dayTotals?.kcal || 0)}
                            hint="kcal/day"
                        />
                        <Kpi
                            label="Vegetables"
                            value={Math.round(activeSummary?.dayTotals?.vegetablesG || 0)}
                            hint="g/day"
                        />
                        <Kpi
                            label="Visible fat"
                            value={Math.round(activeSummary?.dayTotals?.visibleFat || 0)}
                            hint="g/day"
                        />
                    </div>

                    <Section title="Meal builder" icon={<Plus size={16} />}>
                        <div className="builder-row">
                            <Field label="Meal slot">
                                <select value={selectedMeal} onChange={(e) => setSelectedMeal(e.target.value)}>
                                    <option value="" disabled>Select slot</option>
                                    {MEALS.map((m) => (
                                        <option key={m} value={m}>
                                            {m}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="Food item">
                                <select
                                    value={selectedFoodId}
                                    onChange={(e) => setSelectedFoodId(e.target.value)}
                                >
                                    <option value="" disabled>Select item</option>
                                    {FOODS.map((food) => (
                                        <option key={food.id} value={food.id}>
                                            {food.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="Grams">
                                <input
                                    type="number"
                                    value={grams}
                                    placeholder="Select grams"
                                    onChange={(e) => setGrams(e.target.value)}
                                />
                            </Field>

                            <button onClick={addFood}>Add food</button>
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
                                                    <th>Food</th>
                                                    <th>g</th>
                                                    <th>Group</th>
                                                    <th>Exchange</th>
                                                    <th>Actions</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {mealItems.length ? (
                                                    mealItems.map((item) => {
                                                        const food = foodById(item.foodId);
                                                        const exchange = food ? item.grams / food.gramsPerExchange : 0;

                                                        return (
                                                            <tr key={item.id}>
                                                                <td>{food?.name || "-"}</td>
                                                                <td>
                                                                    <input
                                                                        type="number"
                                                                        value={item.grams}
                                                                        onChange={(e) => updateMealItem(meal, item.id, e.target.value)}
                                                                    />
                                                                </td>
                                                                <td>{food?.group || "-"}</td>
                                                                <td>{exchange.toFixed(2)}</td>
                                                                <td>
                                                                    <div className="icon-row">
                                                                        <button
                                                                            className="icon-btn"
                                                                            onClick={() => duplicateMealItem(meal, item)}
                                                                        >
                                                                            <Copy size={14} />
                                                                        </button>
                                                                        <button
                                                                            className="icon-btn danger"
                                                                            onClick={() => removeMealItem(meal, item.id)}
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                ) : (
                                                    <tr>
                                                        <td colSpan={5} className="empty-cell">
                                                            No items yet.
                                                        </td>
                                                    </tr>
                                                )}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="reason-box">
                                            <strong>Reasons for imbalance</strong>
                                            <ul>
                                                {mealReasons.map((reason) => (
                                                    <li key={reason}>{reason}</li>
                                                ))}
                                            </ul>
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
                                            <div
                                                className="bar-fill"
                                                style={{ width: `${Math.min(100, Number(value) * 4)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Section>

                        <Section title="Exchange conversion table" icon={<Leaf size={16} />}>
                            <div className="table-wrap">
                                <table>
                                    <thead>
                                    <tr>
                                        <th>Food</th>
                                        <th>g</th>
                                        <th>Group</th>
                                        <th>Exchange</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {(
                                        activePlan.meals[selectedMeal] || []
                                    ).map((item) => {
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
                                        <tr>
                                            <td colSpan={4} className="empty-cell">
                                                Select a meal and add foods to see exchange conversion.
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </Section>
                    </div>

                    <Section title="Combination comparison" icon={<Sparkles size={16} />}>
                        <div className="comparison-grid">
                            {summaries.map((summary) => (
                                <div
                                    key={summary.plan.id}
                                    className={`compare-card ${summary.plan.id === bestSummary?.plan?.id ? "best" : ""}`}
                                >
                                    <div className="compare-head">
                                        <strong>{summary.plan.name}</strong>
                                        <span>{summary.dayScore.score} / 100</span>
                                    </div>
                                    <p>{summary.dayScore.band}</p>
                                    <p className="small-copy">
                                        Energy: {Math.round(summary.dayTotals.kcal)} kcal
                                    </p>
                                    <p className="small-copy">
                                        Vegetables: {Math.round(summary.dayTotals.vegetablesG)} g
                                    </p>
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

function Section({ title, icon, children }) {
    return (
        <section className="section">
            <div className="section-head">
                <div className="section-title">
                    {icon}
                    <h2>{title}</h2>
                </div>
            </div>
            {children}
        </section>
    );
}

function Field({ label, children }) {
    return (
        <label className="field">
            <span>{label}</span>
            {children}
        </label>
    );
}

function Kpi({ label, value, hint, tone = "neutral" }) {
    return (
        <div className={`kpi ${tone}`}>
            <div className="kpi-label">{label}</div>
            <div className="kpi-value">{value}</div>
            <div className="kpi-hint">{hint}</div>
        </div>
    );
}

function StatCard({ label, value, tone = "neutral" }) {
    return (
        <div className={`stat-card ${tone}`}>
            <div className="kpi-label">{label}</div>
            <div className="kpi-value">{value}</div>
        </div>
    );
}

export default App;