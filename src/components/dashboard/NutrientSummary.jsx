import { BarChart3, Leaf } from "lucide-react";
import { foodById } from "../../engines/nutrientEngine";
import Section from "../ui/Section";

function NutrientSummary({ activeSummary, activePlan, selectedMeal }) {
    return (
        <div className="two-col">
            <Section title="Daily nutrient-category summary" icon={<BarChart3 size={16} />}>
                <div className="nutrient-list" role="list" aria-label="Daily nutrient totals">
                    {[
                        ["Carbohydrates", activeSummary?.dayTotals?.carbs || 0],
                        ["Proteins", activeSummary?.dayTotals?.protein || 0],
                        ["Fats", activeSummary?.dayTotals?.fat || 0],
                        ["Fibre", activeSummary?.dayTotals?.fibre || 0],
                        ["Vitamins", activeSummary?.dayTotals?.vitamins || 0],
                        ["Minerals", activeSummary?.dayTotals?.minerals || 0],
                    ].map(([label, value]) => (
                        <div key={label} className="nutrient-row" role="listitem">
                            <div className="nutrient-top">
                                <span>{label}</span>
                                <strong>{Number(value).toFixed(1)}</strong>
                            </div>
                            <div className="bar" role="progressbar" aria-valuenow={Number(value).toFixed(1)} aria-label={`${label}: ${Number(value).toFixed(1)}`}>
                                <div className="bar-fill" style={{ width: `${Math.min(100, Number(value) * 4)}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
            </Section>

            <Section title="Exchange conversion table" icon={<Leaf size={16} />}>
                <div className="table-wrap">
                    <table aria-label="Exchange conversion for selected meal">
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
    );
}

export default NutrientSummary;

