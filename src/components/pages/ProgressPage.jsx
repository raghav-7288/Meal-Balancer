import { useMemo, useState } from "react";
import {
    TrendingUp,
    Trash2,
    Award,
    Target,
    Flame,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    AlertTriangle,
} from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    Area,
    AreaChart,
} from "recharts";
import { useMealHistory } from "../../hooks/useMealHistory";
import Section from "../ui/Section";

/** Format YYYY-MM-DD to short display: "Jun 24" */
function fmtDate(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Format YYYY-MM to "June 2026" */
function fmtMonth(ym) {
    const [y, m] = ym.split("-");
    const d = new Date(Number(y), Number(m) - 1, 1);
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function ProgressPage() {
    const { history, removeEntry, clearHistory } = useMealHistory();
    const [confirmClear, setConfirmClear] = useState(false);

    // Sort history by date (oldest first for charts)
    const sorted = useMemo(
        () => [...history].sort((a, b) => a.date.localeCompare(b.date)),
        [history],
    );

    // ── Stats ──
    const stats = useMemo(() => {
        if (sorted.length === 0)
            return {
                best: 0,
                worst: 0,
                avg: 0,
                total: 0,
                streak: 0,
                trend: "flat",
                trendDelta: 0,
            };

        const scores = sorted.map((e) => e.score);
        const best = Math.max(...scores);
        const worst = Math.min(...scores);
        const avg = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);

        // Current streak — consecutive days ending today/yesterday
        let streak = 0;
        const today = new Date();
        for (let i = sorted.length - 1; i >= 0; i--) {
            const entryDate = new Date(sorted[i].date + "T00:00:00");
            const expectedDate = new Date(today);
            expectedDate.setDate(today.getDate() - (sorted.length - 1 - i));
            expectedDate.setHours(0, 0, 0, 0);
            // Check if within 1 day tolerance
            const diffDays = Math.round(
                (today.getTime() - entryDate.getTime()) / (86400000),
            );
            if (diffDays === sorted.length - 1 - i || diffDays === sorted.length - i) {
                streak++;
            } else {
                break;
            }
        }
        // Simpler streak: count consecutive dates backwards from most recent
        streak = 1;
        for (let i = sorted.length - 1; i > 0; i--) {
            const curr = new Date(sorted[i].date + "T00:00:00");
            const prev = new Date(sorted[i - 1].date + "T00:00:00");
            const diff = (curr.getTime() - prev.getTime()) / 86400000;
            if (diff === 1) streak++;
            else break;
        }

        // Trend: compare last 7 entries avg vs previous 7
        let trend = "flat";
        let trendDelta = 0;
        if (sorted.length >= 4) {
            const mid = Math.floor(sorted.length / 2);
            const firstHalf = sorted.slice(0, mid);
            const secondHalf = sorted.slice(mid);
            const avgFirst =
                firstHalf.reduce((s, e) => s + e.score, 0) / firstHalf.length;
            const avgSecond =
                secondHalf.reduce((s, e) => s + e.score, 0) / secondHalf.length;
            trendDelta = Math.round(avgSecond - avgFirst);
            if (trendDelta > 2) trend = "up";
            else if (trendDelta < -2) trend = "down";
        }

        return { best, worst, avg, total: sorted.length, streak, trend, trendDelta };
    }, [sorted]);

    // ── Monthly averages ──
    const monthlyData = useMemo(() => {
        const months = {};
        for (const e of sorted) {
            const ym = e.date.slice(0, 7);
            if (!months[ym]) months[ym] = { scores: [], kcals: [] };
            months[ym].scores.push(e.score);
            months[ym].kcals.push(e.kcal);
        }
        return Object.entries(months)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([ym, data]) => ({
                month: ym,
                label: fmtMonth(ym),
                avgScore: Math.round(
                    data.scores.reduce((s, v) => s + v, 0) / data.scores.length,
                ),
                avgKcal: Math.round(
                    data.kcals.reduce((s, v) => s + v, 0) / data.kcals.length,
                ),
                entries: data.scores.length,
            }));
    }, [sorted]);

    // ── Chart data ──
    const chartData = sorted.map((e) => ({
        date: fmtDate(e.date),
        score: e.score,
        kcal: e.kcal,
    }));

    const scoreColor = (score) => {
        if (score >= 85) return "#059669";
        if (score >= 70) return "#0d9488";
        if (score >= 50) return "#d97706";
        return "#dc2626";
    };

    const TrendIcon =
        stats.trend === "up"
            ? ArrowUpRight
            : stats.trend === "down"
              ? ArrowDownRight
              : Minus;

    // ── Empty state ──
    if (sorted.length === 0) {
        return (
            <div className="progress-page">
                <div className="progress-empty-state">
                    <TrendingUp size={48} strokeWidth={1.5} />
                    <h2>No history yet</h2>
                    <p>
                        Go to the <strong>Dashboard</strong> and click{" "}
                        <strong>&ldquo;Log today&rdquo;</strong> to start tracking your meal
                        scores over time.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="progress-page">
            {/* Header */}
            <div className="progress-header">
                <div className="progress-header-left">
                    <TrendingUp size={24} />
                    <h1>Progress & History</h1>
                </div>
                {!confirmClear ? (
                    <button
                        className="secondary progress-clear-btn"
                        onClick={() => setConfirmClear(true)}
                    >
                        <Trash2 size={14} /> Clear all
                    </button>
                ) : (
                    <div className="progress-clear-confirm">
                        <span>Are you sure?</span>
                        <button
                            className="progress-clear-btn danger-btn"
                            onClick={() => {
                                clearHistory();
                                setConfirmClear(false);
                            }}
                        >
                            Yes, clear
                        </button>
                        <button
                            className="secondary"
                            onClick={() => setConfirmClear(false)}
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>

            {/* Stats Row */}
            <div className="progress-stats-row">
                <div className="progress-stat-card">
                    <Award size={20} className="progress-stat-icon" style={{ color: "#f59e0b" }} />
                    <span className="progress-stat-value">{stats.best}</span>
                    <span className="progress-stat-label">Best Score</span>
                </div>
                <div className="progress-stat-card">
                    <Target size={20} className="progress-stat-icon" style={{ color: "#3b82f6" }} />
                    <span className="progress-stat-value">{stats.avg}</span>
                    <span className="progress-stat-label">Average</span>
                </div>
                <div className="progress-stat-card">
                    <Flame size={20} className="progress-stat-icon" style={{ color: "#ef4444" }} />
                    <span className="progress-stat-value">{stats.streak}</span>
                    <span className="progress-stat-label">Day Streak</span>
                </div>
                <div className="progress-stat-card">
                    <Calendar size={20} className="progress-stat-icon" style={{ color: "#8b5cf6" }} />
                    <span className="progress-stat-value">{stats.total}</span>
                    <span className="progress-stat-label">Days Logged</span>
                </div>
                <div className="progress-stat-card">
                    <TrendIcon
                        size={20}
                        className="progress-stat-icon"
                        style={{
                            color:
                                stats.trend === "up"
                                    ? "#059669"
                                    : stats.trend === "down"
                                      ? "#dc2626"
                                      : "#6b7280",
                        }}
                    />
                    <span className="progress-stat-value">
                        {stats.trendDelta > 0 ? "+" : ""}
                        {stats.trendDelta}
                    </span>
                    <span className="progress-stat-label">Trend</span>
                </div>
            </div>

            {/* Trend Message */}
            {stats.total >= 4 && (
                <div
                    className={`progress-trend-banner ${stats.trend === "up" ? "positive" : stats.trend === "down" ? "negative" : "neutral"}`}
                >
                    <TrendIcon size={16} />
                    {stats.trend === "up" && (
                        <span>
                            Your average score improved by <strong>{stats.trendDelta} points</strong>{" "}
                            recently. Keep it up! 🎉
                        </span>
                    )}
                    {stats.trend === "down" && (
                        <span>
                            Your average score dropped by{" "}
                            <strong>{Math.abs(stats.trendDelta)} points</strong> recently.
                            Let&rsquo;s get back on track!
                        </span>
                    )}
                    {stats.trend === "flat" && (
                        <span>Your scores are holding steady. Consistency is key! 💪</span>
                    )}
                </div>
            )}

            {/* Score Progress Chart */}
            <Section title="Score over time" icon={<TrendingUp size={16} />}>
                <div style={{ width: "100%", height: 260 }}>
                    <ResponsiveContainer>
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: 10,
                                    fontSize: 13,
                                    border: "1px solid #e5e7eb",
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="score"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                fill="url(#scoreGrad)"
                                dot={{ r: 4, fill: "#3b82f6" }}
                                activeDot={{ r: 6 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Section>

            {/* Monthly Averages */}
            {monthlyData.length > 0 && (
                <Section title="Monthly averages" icon={<Calendar size={16} />}>
                    <div className="progress-monthly-grid">
                        {monthlyData.map((m, i) => {
                            const prevAvg = i > 0 ? monthlyData[i - 1].avgScore : null;
                            const delta = prevAvg !== null ? m.avgScore - prevAvg : null;
                            return (
                                <div key={m.month} className="progress-month-card">
                                    <div className="progress-month-header">
                                        <strong>{m.label}</strong>
                                        <span className="progress-month-entries">
                                            {m.entries} day{m.entries !== 1 ? "s" : ""}
                                        </span>
                                    </div>
                                    <div className="progress-month-stats">
                                        <div>
                                            <span
                                                className="progress-month-score"
                                                style={{ color: scoreColor(m.avgScore) }}
                                            >
                                                {m.avgScore}
                                            </span>
                                            <span className="progress-month-label">avg score</span>
                                        </div>
                                        <div>
                                            <span className="progress-month-kcal">{m.avgKcal}</span>
                                            <span className="progress-month-label">avg kcal</span>
                                        </div>
                                        {delta !== null && (
                                            <div
                                                className={`progress-month-delta ${delta > 0 ? "positive" : delta < 0 ? "negative" : ""}`}
                                            >
                                                {delta > 0 ? "+" : ""}
                                                {delta}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Section>
            )}

            {/* History Table */}
            <Section title="Daily log" icon={<Calendar size={16} />}>
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Plan</th>
                                <th>Score</th>
                                <th>Band</th>
                                <th>kcal</th>
                                <th>Protein</th>
                                <th>Fibre</th>
                                <th>Veg</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...sorted].reverse().map((entry) => (
                                <tr key={entry.id}>
                                    <td>{fmtDate(entry.date)}</td>
                                    <td>{entry.planName}</td>
                                    <td>
                                        <span
                                            className="progress-score-cell"
                                            style={{ color: scoreColor(entry.score) }}
                                        >
                                            {entry.score}
                                        </span>
                                    </td>
                                    <td>{entry.band}</td>
                                    <td>{entry.kcal}</td>
                                    <td>{entry.protein}g</td>
                                    <td>{entry.fibre}g</td>
                                    <td>{entry.vegetablesG}g</td>
                                    <td>
                                        <button
                                            className="icon-btn danger"
                                            onClick={() => removeEntry(entry.id)}
                                            aria-label={`Remove entry for ${entry.date}`}
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Section>
        </div>
    );
}

export default ProgressPage;

