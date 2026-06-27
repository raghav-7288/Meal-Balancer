import { Sparkles } from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, Legend,
} from "recharts";
import Section from "../ui/Section";

const PLAN_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function buildComparisonData(summaries) {
    const metrics = [
        { metric: "Score", getValue: (s) => s.dayScore.score },
        { metric: "Energy", getValue: (s) => Math.round(s.dayTotals.kcal || 0) },
        { metric: "Protein (g)", getValue: (s) => Math.round(s.dayTotals.protein || 0) },
        { metric: "Fibre (g)", getValue: (s) => Math.round(s.dayTotals.fibre || 0) },
        { metric: "Vegetables (g)", getValue: (s) => Math.round(s.dayTotals.vegetablesG || 0) },
    ];

    return metrics.map((m) => {
        const point = { metric: m.metric };
        summaries.forEach((s) => {
            const name = s.plan.name.length > 14 ? s.plan.name.slice(0, 14) + "…" : s.plan.name;
            point[name] = m.getValue(s);
        });
        return point;
    });
}

function ComparisonSection({ summaries, bestSummary }) {
    const chartData = buildComparisonData(summaries);
    const planNames = summaries.map((s) =>
        s.plan.name.length > 14 ? s.plan.name.slice(0, 14) + "…" : s.plan.name
    );

    return (
        <>
            <Section title="Plan comparison" icon={<Sparkles size={16} />}>
                <div className="comparison-radar-wrap" role="img" aria-label="Bar chart comparing plans">
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart
                            data={chartData}
                            layout="vertical"
                            margin={{ top: 4, right: 30, left: 10, bottom: 4 }}
                        >
                            <XAxis type="number" tick={{ fontSize: 11 }} />
                            <YAxis
                                type="category"
                                dataKey="metric"
                                tick={{ fontSize: 12, fontWeight: 600 }}
                                width={90}
                            />
                            {planNames.map((name, idx) => (
                                <Bar
                                    key={name}
                                    dataKey={name}
                                    fill={PLAN_COLORS[idx % PLAN_COLORS.length]}
                                    radius={[0, 4, 4, 0]}
                                    barSize={12}
                                />
                            ))}
                            <Legend
                                wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: "12px",
                                    border: "1px solid #e5e7eb",
                                    fontSize: "12px",
                                }}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Section>

            <Section title="Combination comparison" icon={<Sparkles size={16} />}>
                <div className="comparison-grid" role="list" aria-label="Plan comparison">
                    {summaries.map((summary) => (
                        <div
                            key={summary.plan.id}
                            className={`compare-card ${summary.plan.id === bestSummary?.plan?.id ? "best" : ""}`}
                            role="listitem"
                            aria-label={`${summary.plan.name}: ${summary.dayScore.score} out of 100`}
                        >
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
                <div className="recommendation" role="region" aria-label="Best plan recommendation">
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
        </>
    );
}

export default ComparisonSection;

