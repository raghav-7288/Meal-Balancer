import { useMemo, useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    Calendar,
    BarChart3,
    AlertCircle,
    Info,
    BookOpen,
    Download,
    Edit3,
} from "lucide-react";
import { MEALS, DAYS } from "../../data/presetPlans";
import { aggregateMeal, combineDay, foodById } from "../../engines/nutrientEngine";
import { scoreDay } from "../../engines/scoringEngine";
import { useSyncedPlans } from "../../hooks/useSyncedPlans";
import { usePresetPlans } from "../../hooks/usePresetPlans";
import { useAuth } from "../../hooks/useAuth";
import { useProfile } from "../../context/ProfileContext";
import { downloadPlanAsPdf } from "../../utils/generatePlanPdf";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import Section from "../ui/Section";

function WeeklyPlannerPage() {
    const { user, profile: dbProfile } = useAuth();
    const { profile } = useProfile();
    const { presetPlans } = usePresetPlans();
    const [userPlans] = useSyncedPlans();
    const allPlans = useMemo(() => [...presetPlans, ...userPlans], [presetPlans, userPlans]);
    const [activePlanId, setActivePlanId] = useState(
        userPlans[0]?.id || presetPlans[0]?.id || ""
    );

    // Update activePlanId when preset plans load from DB
    useEffect(() => {
        if (presetPlans.length > 0) {
            setActivePlanId((prev) => {
                const allIds = [...presetPlans, ...userPlans].map((p) => p.id);
                return allIds.includes(prev) ? prev : (userPlans[0]?.id || presetPlans[0].id);
            });
        }
    }, [presetPlans]); // eslint-disable-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect

    const activePlan = allPlans.find((p) => p.id === activePlanId) || allPlans[0];
    const isPresetPlan = presetPlans.some((p) => p.id === activePlanId);

    // Get items for a specific day and meal slot
    const getItems = useCallback(
        (day, meal) => {
            if (!activePlan) return [];
            return (activePlan.meals[meal] || []).filter(
                (item) => item.day === day || !item.day
            );
        },
        [activePlan],
    );

    // Per-day summaries
    const daySummaries = useMemo(() => {
        if (!activePlan) return {};
        const summaries = {};
        for (const day of DAYS) {
            const mealTotals = {};
            for (const meal of MEALS) {
                const items = (activePlan.meals[meal] || []).filter(
                    (i) => i.day === day || !i.day
                );
                mealTotals[meal] = aggregateMeal(items);
            }
            const dayTotals = combineDay(mealTotals);
            const dayScoreResult = scoreDay({
                cerealEnergyPct: dayTotals.cerealEnergyPct,
                vegetablesG: dayTotals.vegetablesG,
                protein: dayTotals.protein,
                fibre: dayTotals.fibre,
                addedSugar: dayTotals.addedSugar,
                visibleFat: dayTotals.visibleFat,
            });
            summaries[day] = { dayTotals, dayScore: dayScoreResult };
        }
        return summaries;
    }, [activePlan]);

    // Weekly averages
    const weeklyAvg = useMemo(() => {
        const daysWithFood = DAYS.filter((d) => {
            const dt = daySummaries[d]?.dayTotals;
            return dt && (dt.protein || 0) + (dt.carbs || 0) + (dt.fat || 0) > 0;
        });
        if (daysWithFood.length === 0)
            return { avgScore: 0, avgKcal: 0, avgProtein: 0, avgFibre: 0, daysPlanned: 0 };

        const sum = (fn) => daysWithFood.reduce((s, d) => s + fn(d), 0);
        return {
            avgScore: Math.round(sum((d) => daySummaries[d]?.dayScore?.score || 0) / daysWithFood.length),
            avgKcal: Math.round(sum((d) => daySummaries[d]?.dayTotals?.kcal || 0) / daysWithFood.length),
            avgProtein: Math.round(sum((d) => daySummaries[d]?.dayTotals?.protein || 0) / daysWithFood.length),
            avgFibre: Math.round(sum((d) => daySummaries[d]?.dayTotals?.fibre || 0) / daysWithFood.length),
            daysPlanned: daysWithFood.length,
        };
    }, [daySummaries]);

    // Download handler
    function handleDownloadPdf() {
        if (!activePlan) return;
        // Build a combined summary for the plan using today's day
        const todayIdx = new Date().getDay();
        const todayName = DAYS[todayIdx === 0 ? 6 : todayIdx - 1];
        const summary = daySummaries[todayName] || Object.values(daySummaries)[0];

        const userInfo = {
            fullName: dbProfile?.full_name || dbProfile?.username || "",
            email: user?.email || "",
            age: dbProfile?.age || "",
            heightCm: dbProfile?.height_cm || "",
            weightKg: dbProfile?.weight_kg || "",
            bmi: dbProfile?.current_bmi ? String(dbProfile.current_bmi) : "",
            contactNumber: dbProfile?.contact_number || "",
        };

        downloadPlanAsPdf(activePlan, summary, userInfo, profile, daySummaries);
    }

    // Bar chart data
    const chartData = DAYS.map((day) => ({
        day: day.slice(0, 3),
        score: daySummaries[day]?.dayScore?.score || 0,
    }));

    const scoreColor = (score) => {
        if (score >= 85) return "#059669";
        if (score >= 70) return "#0d9488";
        if (score >= 50) return "#d97706";
        return score > 0 ? "#dc2626" : "#cbd5e1";
    };

    return (
        <div className="weekly-planner-page">
            {/* Header */}
            <div className="weekly-header">
                <div className="weekly-header-left">
                    <Calendar size={24} />
                    <h1>Weekly Planner</h1>
                    <span className="weekly-readonly-badge">Read-only</span>
                </div>
                <div className="weekly-header-right">
                    <select
                        className="weekly-plan-select"
                        value={activePlanId}
                        onChange={(e) => setActivePlanId(e.target.value)}
                        aria-label="Select plan"
                    >
                        <optgroup label="⭐ Pre-saved Plans">
                            {presetPlans.map((plan) => (
                                <option key={plan.id} value={plan.id}>
                                    {plan.name}
                                </option>
                            ))}
                        </optgroup>
                        {userPlans.length > 0 && (
                            <optgroup label="👤 My Plans">
                                {userPlans.map((plan) => (
                                    <option key={plan.id} value={plan.id}>
                                        {plan.name}
                                    </option>
                                ))}
                            </optgroup>
                        )}
                    </select>
                    <button
                        className="planner-nav-link planner-download-btn"
                        onClick={handleDownloadPdf}
                        aria-label="Download plan as PDF"
                    >
                        <Download size={14} /> Download PDF
                    </button>
                    {!isPresetPlan && (
                        <Link
                            to={`/dashboard?plan=${activePlanId}`}
                            className="planner-nav-link planner-edit-btn"
                        >
                            <Edit3 size={14} /> Edit Plan
                        </Link>
                    )}
                </div>
            </div>

            {/* Read-only notice */}
            <div className="weekly-unassigned-notice" style={{ background: "#eff6ff", borderColor: "#bfdbfe", color: "#1e40af" }}>
                <AlertCircle size={16} />
                <span>
                    This is a <strong>read-only view</strong>.{" "}
                    {!isPresetPlan && (
                        <>To edit meals or plan details, go to the{" "}
                        <Link to="/dashboard"><strong>Dashboard</strong></Link>.{" "}</>
                    )}
                    Hover over a meal item to see its preparation instructions.
                </span>
            </div>


            {/* Weekly Summary Bar */}
            <div className="weekly-summary-bar">
                <div className="weekly-summary-stat">
                    <span className="weekly-stat-value">{weeklyAvg.avgScore}</span>
                    <span className="weekly-stat-label">Avg Score</span>
                </div>
                <div className="weekly-summary-stat">
                    <span className="weekly-stat-value">{weeklyAvg.avgKcal}</span>
                    <span className="weekly-stat-label">Avg kcal</span>
                </div>
                <div className="weekly-summary-stat">
                    <span className="weekly-stat-value">{weeklyAvg.avgProtein}g</span>
                    <span className="weekly-stat-label">Avg Protein</span>
                </div>
                <div className="weekly-summary-stat">
                    <span className="weekly-stat-value">{weeklyAvg.avgFibre}g</span>
                    <span className="weekly-stat-label">Avg Fibre</span>
                </div>
                <div className="weekly-summary-stat highlight">
                    <span className="weekly-stat-value">
                        {weeklyAvg.daysPlanned}
                        <span className="weekly-stat-sub">/7</span>
                    </span>
                    <span className="weekly-stat-label">Days Planned</span>
                </div>
            </div>

            {/* 7-Day Grid */}
            <div className="weekly-grid-scroll">
                <div className="weekly-grid">
                    {DAYS.map((day) => {
                        const summary = daySummaries[day];
                        const score = summary?.dayScore?.score || 0;
                        const dt = summary?.dayTotals;
                        const hasFood = dt && (dt.protein || 0) + (dt.carbs || 0) + (dt.fat || 0) > 0;

                        return (
                            <div
                                key={day}
                                className={`weekly-day-col ${hasFood ? "has-food" : ""}`}
                            >
                                {/* Day Header */}
                                <div className="weekly-day-header">
                                    <h3>{day.slice(0, 3)}</h3>
                                    {hasFood && (
                                        <span
                                            className="weekly-score-badge"
                                            style={{ background: scoreColor(score), color: "#fff" }}
                                        >
                                            {score}
                                        </span>
                                    )}
                                </div>

                                {/* Meal slots */}
                                {MEALS.map((meal) => {
                                    const items = getItems(day, meal);
                                    return (
                                        <div key={meal} className="weekly-meal-slot">
                                            <div className="weekly-meal-label">
                                                <span>{meal}</span>
                                            </div>
                                            {items.length > 0 ? (
                                                <div className="weekly-items">
                                                    {items.map((item) => {
                                                        const food = foodById(item.foodId);
                                                        const hasInstructions = item.instructions && item.instructions.trim();
                                                        return (
                                                            <div
                                                                key={item.id}
                                                                className={`weekly-item ${hasInstructions ? "has-instructions" : ""}`}
                                                                title={hasInstructions ? `📝 ${item.instructions}` : ""}
                                                            >
                                                                <span className="weekly-item-name">
                                                                    {food?.name || item.foodName || "?"}
                                                                </span>
                                                                <span className="weekly-item-g">
                                                                    {item.grams}g
                                                                </span>
                                                                {hasInstructions && (
                                                                    <span className="weekly-item-info-icon">
                                                                        <Info size={12} />
                                                                        <span className="weekly-item-tooltip">
                                                                            {item.instructions}
                                                                        </span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="weekly-empty-slot">—</div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Day summary */}
                                {hasFood && (
                                    <div className="weekly-day-summary">
                                        <span>{Math.round(dt.kcal)} kcal</span>
                                        <span>{Math.round(dt.protein)}g prot</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Plan Guidelines Section */}
            {activePlan?.guidelines && (
                <div className="weekly-guidelines-section">
                    <div className="weekly-guidelines-header">
                        <BookOpen size={16} />
                        <h3>Plan Guidelines</h3>
                    </div>
                    <p className="weekly-guidelines-text">{activePlan.guidelines}</p>
                </div>
            )}

            {/* Weekly Score Chart */}
            <Section title="Daily scores across the week" icon={<BarChart3 size={16} />}>
                <div style={{ width: "100%", height: 220 }}>
                    <ResponsiveContainer>
                        <BarChart data={chartData} barCategoryGap="20%">
                            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                            <Tooltip
                                formatter={(value) => [`${value}`, "Score"]}
                                contentStyle={{
                                    borderRadius: 10,
                                    fontSize: 13,
                                    border: "1px solid #e5e7eb",
                                }}
                            />
                            <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                                {chartData.map((entry, i) => (
                                    <Cell key={i} fill={scoreColor(entry.score)} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Section>
        </div>
    );
}

export default WeeklyPlannerPage;
