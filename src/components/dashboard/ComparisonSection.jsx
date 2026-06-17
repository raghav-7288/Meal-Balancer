import { Sparkles } from "lucide-react";
import Section from "../ui/Section";

function ComparisonSection({ summaries, bestSummary }) {
    return (
        <>
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

