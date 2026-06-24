import { Sparkles } from "lucide-react";
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ResponsiveContainer, Legend, Tooltip,
} from "recharts";
import Section from "../ui/Section";

const RADAR_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function buildRadarData(summaries) {
    // Normalize each metric to 0–100 scale for radar comparison
    const maxKcal = Math.max(...summaries.map((s) => s.dayTotals.kcal || 1));
    const maxProtein = Math.max(...summaries.map((s) => s.dayTotals.protein || 1));
    const maxFibre = Math.max(...summaries.map((s) => s.dayTotals.fibre || 1));
    const maxVeg = Math.max(...summaries.map((s) => s.dayTotals.vegetablesG || 1));

    const metrics = [
        { metric: "Score", key: "score" },
        { metric: "Energy", key: "energy" },
        { metric: "Protein", key: "protein" },
        { metric: "Fibre", key: "fibre" },
        { metric: "Vegetables", key: "veg" },
    ];

    return metrics.map((m) => {
        const point = { metric: m.metric };
        summaries.forEach((s) => {
            const name = s.plan.name.length > 12 ? s.plan.name.slice(0, 12) + "…" : s.plan.name;
            if (m.key === "score") point[name] = s.dayScore.score;
            else if (m.key === "energy") point[name] = Math.round((s.dayTotals.kcal / maxKcal) * 100);
            else if (m.key === "protein") point[name] = Math.round((s.dayTotals.protein / maxProtein) * 100);
            else if (m.key === "fibre") point[name] = Math.round((s.dayTotals.fibre / maxFibre) * 100);
            else if (m.key === "veg") point[name] = Math.round((s.dayTotals.vegetablesG / maxVeg) * 100);
        });
        return point;
    });
}

function ComparisonSection({ summaries, bestSummary }) {
    const radarData = buildRadarData(summaries);
    const planNames = summaries.map((s) =>
        s.plan.name.length > 12 ? s.plan.name.slice(0, 12) + "…" : s.plan.name
    );

    return (
        <>
            <Section title="Plan comparison radar" icon={<Sparkles size={16} />}>
                <div className="comparison-radar-wrap" role="img" aria-label="Radar chart comparing plans">
                    <ResponsiveContainer width="100%" height={280}>
                        <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                            <PolarGrid stroke="#e5e7eb" />
                            <PolarAngleAxis
                                dataKey="metric"
                                tick={{ fontSize: 12, fontWeight: 600 }}
                            />
                            <PolarRadiusAxis
                                angle={90}
                                domain={[0, 100]}
                                tick={{ fontSize: 10 }}
                            />
                            {planNames.map((name, idx) => (
                                <Radar
                                    key={name}
                                    name={name}
                                    dataKey={name}
                                    stroke={RADAR_COLORS[idx % RADAR_COLORS.length]}
                                    fill={RADAR_COLORS[idx % RADAR_COLORS.length]}
                                    fillOpacity={0.15}
                                    strokeWidth={2}
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
                        </RadarChart>
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

