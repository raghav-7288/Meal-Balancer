import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Calendar, BarChart3, AlertCircle, Info, BookOpen, Download, Edit3 } from "lucide-react";
import toast from "react-hot-toast";
import { MEALS, DAYS, getTodayName } from "../../data/presetPlans";
import { foodById } from "../../engines/nutrientEngine";
import { formatMealTimeRange, getMealTimeRange } from "../../utils/mealTime";
import { computeDaySummaries } from "../../utils/planSummary";
import { useSyncedPlans } from "../../hooks/useSyncedPlans";
import { usePresetPlans } from "../../hooks/usePresetPlans";
import {
    useNutrientResolver,
    hydratePlanNutrients,
    resolvePlanNutrients,
} from "../../hooks/useNutrientResolver";
import { useAuth } from "../../hooks/useAuth";
import { useProfile } from "../../context/ProfileContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import Section from "../ui/Section";

function WeeklyPlannerPage() {
    const { user, profile: dbProfile } = useAuth();
    const { profile } = useProfile();
    const { presetPlans, isLoading: presetLoading } = usePresetPlans();
    const [userPlans] = useSyncedPlans();
    const allPlans = useMemo(() => [...presetPlans, ...userPlans], [presetPlans, userPlans]);
    const [activePlanId, setActivePlanId] = useState(userPlans[0]?.id || presetPlans[0]?.id || "");

    // Ref to avoid re-triggering effect when userPlans changes
    const userPlansRef = useRef(userPlans);
    useEffect(() => {
        userPlansRef.current = userPlans;
    }, [userPlans]);

    // Update activePlanId when preset plans load from DB
    useEffect(() => {
        if (presetPlans.length > 0) {
            setActivePlanId((prev) => {
                const allIds = [...presetPlans, ...userPlansRef.current].map((p) => p.id);
                return allIds.includes(prev)
                    ? prev
                    : userPlansRef.current[0]?.id || presetPlans[0].id;
            });
        }
    }, [presetPlans]);

    const activePlan = allPlans.find((p) => p.id === activePlanId) || allPlans[0];
    const isPresetPlan = presetPlans.some((p) => p.id === activePlanId);

    // Hydrate nutrients for DB foods that don't store them inline (e.g. preset
    // plans built via the admin UI) so day scores/averages aren't stuck at zero.
    const resolveNutrients = useNutrientResolver(allPlans);

    // Get items for a specific day and meal slot
    const getItems = useCallback(
        (day, meal) => {
            if (!activePlan) return [];
            const meals = activePlan.meals || {};
            return (meals[meal] || []).filter((item) => item.day === day || !item.day);
        },
        [activePlan]
    );

    // Per-day summaries (shared with the PDF export so numbers match exactly)
    const daySummaries = useMemo(
        () => computeDaySummaries(activePlan, resolveNutrients),
        [activePlan, resolveNutrients]
    );

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
            avgScore: Math.round(
                sum((d) => daySummaries[d]?.dayScore?.score || 0) / daysWithFood.length
            ),
            avgKcal: Math.round(
                sum((d) => daySummaries[d]?.dayTotals?.kcal || 0) / daysWithFood.length
            ),
            avgProtein: Math.round(
                sum((d) => daySummaries[d]?.dayTotals?.protein || 0) / daysWithFood.length
            ),
            avgFibre: Math.round(
                sum((d) => daySummaries[d]?.dayTotals?.fibre || 0) / daysWithFood.length
            ),
            daysPlanned: daysWithFood.length,
        };
    }, [daySummaries]);

    // Download handler
    const [isDownloading, setIsDownloading] = useState(false);
    async function handleDownloadPdf() {
        if (!activePlan || isDownloading) return;
        setIsDownloading(true);
        try {
            // Resolve nutrients for DB foods that don't embed them (e.g. admin-built
            // preset plans) BEFORE generating — otherwise those items aggregate to
            // zero and every day fails the "has food" gate, yielding an empty PDF.
            // Fetches are cached, so already-loaded ids resolve without a round-trip.
            const resolver = await resolvePlanNutrients([activePlan]);

            // Embed resolved nutrients so the PDF's per-item rows match the totals,
            // then compute day summaries from the hydrated plan so both are consistent.
            const exportPlan = hydratePlanNutrients(activePlan, resolver);
            const exportDaySummaries = computeDaySummaries(exportPlan, resolver);

            // Single-day summary fallback (today, else first planned day)
            const todayName = getTodayName();
            const summary =
                exportDaySummaries[todayName] || Object.values(exportDaySummaries)[0];

            const userInfo = {
                fullName: dbProfile?.full_name || dbProfile?.username || "",
                email: user?.email || "",
                age: dbProfile?.age || "",
                heightCm: dbProfile?.height_cm || "",
                weightKg: dbProfile?.weight_kg || "",
                bmi: dbProfile?.current_bmi ? String(dbProfile.current_bmi) : "",
                contactNumber: dbProfile?.contact_number || "",
            };

            // Lazy-load PDF module to keep initial bundle small
            const { downloadPlanAsPdf } = await import("../../utils/generatePlanPdf");
            downloadPlanAsPdf(exportPlan, summary, userInfo, profile, exportDaySummaries);
        } catch (err) {
            if (import.meta.env.DEV) console.error("PDF download failed:", err);
            toast.error("Could not generate the PDF. Please try again.");
        } finally {
            setIsDownloading(false);
        }
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

    // Show loading state until plans are available
    if (presetLoading && allPlans.length === 0) {
        return (
            <div
                className="weekly-planner-page"
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "60vh",
                }}
            >
                <div style={{ textAlign: "center" }}>
                    <Calendar
                        size={32}
                        className="spin"
                        style={{ color: "#3b82f6", marginBottom: "1rem" }}
                    />
                    <p style={{ fontSize: "14px", color: "#64748b" }}>Loading meal plans…</p>
                </div>
            </div>
        );
    }

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
                            <optgroup label=" My Plans">
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
                        disabled={isDownloading}
                        aria-label="Download plan as PDF"
                    >
                        <Download size={14} /> {isDownloading ? "Preparing…" : "Download PDF"}
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
            <div
                className="weekly-unassigned-notice"
                style={{ background: "#eff6ff", borderColor: "#bfdbfe", color: "#1e40af" }}
            >
                <AlertCircle size={16} />
                <span>
                    This is a <strong>read-only view</strong>.{" "}
                    {!isPresetPlan && (
                        <>
                            To edit meals or plan details, go to the{" "}
                            <Link to="/dashboard">
                                <strong>Dashboard</strong>
                            </Link>
                            .{" "}
                        </>
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
                        const hasFood =
                            dt && (dt.protein || 0) + (dt.carbs || 0) + (dt.fat || 0) > 0;

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
                                    const mealTimeLabel = formatMealTimeRange(
                                        getMealTimeRange(activePlan?.mealTimes, meal)
                                    );
                                    return (
                                        <div key={meal} className="weekly-meal-slot">
                                            <div className="weekly-meal-label">
                                                <span>{meal}</span>
                                                {mealTimeLabel && (
                                                    <span className="weekly-meal-time">
                                                        {mealTimeLabel}
                                                    </span>
                                                )}
                                            </div>
                                            {items.length > 0 ? (
                                                <div className="weekly-items">
                                                    {items.map((item) => {
                                                        const food = foodById(item.foodId);
                                                        const hasInstructions =
                                                            item.instructions &&
                                                            item.instructions.trim();
                                                        return (
                                                            <div
                                                                key={item.id}
                                                                className={`weekly-item ${hasInstructions ? "has-instructions" : ""}`}
                                                                title={
                                                                    hasInstructions
                                                                        ? ` ${item.instructions}`
                                                                        : ""
                                                                }
                                                            >
                                                                <span className="weekly-item-name">
                                                                    {food?.name ||
                                                                        item.foodName ||
                                                                        "?"}
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
                <div
                    style={{ width: "100%", height: 220 }}
                    role="img"
                    aria-label={`Weekly score bar chart. ${chartData.map((d) => `${d.day}: ${d.score}`).join(", ")}.`}
                >
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
                {/* Screen-reader accessible data alternative */}
                <table className="sr-only" aria-label="Daily scores across the week">
                    <thead>
                        <tr><th>Day</th><th>Score</th></tr>
                    </thead>
                    <tbody>
                        {chartData.map((d, i) => (
                            <tr key={i}><td>{d.day}</td><td>{d.score}</td></tr>
                        ))}
                    </tbody>
                </table>
            </Section>
        </div>
    );
}

export default WeeklyPlannerPage;
