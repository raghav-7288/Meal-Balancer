import { memo, useMemo, useRef, useState, useEffect } from "react";
import { BarChart3, Leaf } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { foodById } from "../../engines/nutrientEngine";
import Section from "../ui/Section";

const NUTRIENT_COLORS = {
    Carbs: "#6366f1",
    Protein: "#10b981",
    Fats: "#ef4444",
    Fibre: "#f59e0b",
    Vitamins: "#8b5cf6",
    Minerals: "#06b6d4",
};

function NutrientSummary({ activeSummary, activePlan, viewDay }) {
    // Measure container width directly (bypasses ResponsiveContainer issues)
    const chartContainerRef = useRef(null);
    const [chartWidth, setChartWidth] = useState(400);
    useEffect(() => {
        const el = chartContainerRef.current;
        if (!el) return;
        const ro = new ResizeObserver((entries) => {
            const w = entries[0]?.contentRect?.width;
            if (w && w > 0) setChartWidth(Math.round(w));
        });
        const rect = el.getBoundingClientRect();
        if (rect.width > 0) setChartWidth(Math.round(rect.width));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const nutrients = useMemo(
        () =>
            [
                { name: "Carbs", value: Number(activeSummary?.dayTotals?.carbs || 0) },
                { name: "Protein", value: Number(activeSummary?.dayTotals?.protein || 0) },
                { name: "Fats", value: Number(activeSummary?.dayTotals?.fat || 0) },
                { name: "Fibre", value: Number(activeSummary?.dayTotals?.fibre || 0) },
                { name: "Vitamins", value: Number(activeSummary?.dayTotals?.vitamins || 0) },
                { name: "Minerals", value: Number(activeSummary?.dayTotals?.minerals || 0) },
            ].map((n) => ({ ...n, value: Math.round(n.value * 10) / 10 })),
        [activeSummary?.dayTotals]
    );

    const exchangeItems = useMemo(() => {
        const allItems = Object.values(activePlan?.meals || {})
            .flat()
            .filter((i) => i.day === viewDay || !i.day);
        // Flatten composite items so each ingredient gets its own exchange row
        const flatItems = [];
        for (const item of allItems) {
            if (item.ingredients && item.ingredients.length > 0) {
                for (const ing of item.ingredients) {
                    flatItems.push({ ...ing, id: `${item.id}-${ing.foodId}` });
                }
            } else {
                flatItems.push(item);
            }
        }
        return flatItems.map((item) => {
            const food = foodById(item.foodId);
            const exchange = food ? item.grams / food.gramsPerExchange : 0;
            return { item, food, exchange };
        });
    }, [activePlan?.meals, viewDay]);

    const hasData = nutrients.some((n) => n.value > 0);

    return (
        <div className="two-col">
            <Section title="Daily nutrient-category summary" icon={<BarChart3 size={16} />}>
                {hasData ? (
                    <div
                        ref={chartContainerRef}
                        className="nutrient-chart-wrap"
                        role="img"
                        aria-label="Daily nutrient bar chart"
                    >
                        <BarChart
                            width={chartWidth}
                            height={240}
                            data={nutrients}
                            layout="vertical"
                            margin={{ top: 4, right: 30, left: 10, bottom: 4 }}
                        >
                            <XAxis type="number" tick={{ fontSize: 11 }} />
                            <YAxis
                                type="category"
                                dataKey="name"
                                tick={{ fontSize: 12, fontWeight: 600 }}
                                width={70}
                            />
                            <Tooltip
                                formatter={(value) => [`${value} g`, "Amount"]}
                                contentStyle={{
                                    borderRadius: "12px",
                                    border: "1px solid #e5e7eb",
                                    fontSize: "13px",
                                }}
                            />
                            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
                                {nutrients.map((entry) => (
                                    <Cell key={entry.name} fill={NUTRIENT_COLORS[entry.name]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </div>
                ) : (
                    <p className="small-copy" style={{ textAlign: "center", padding: "2rem 0" }}>
                        Add food items to see nutrient breakdown chart.
                    </p>
                )}
            </Section>

            <Section title="Exchange conversion table" icon={<Leaf size={16} />}>
                <div className="table-wrap">
                    <table aria-label="Exchange conversion for all meals">
                        <thead>
                            <tr>
                                <th scope="col">Food</th>
                                <th scope="col">g</th>
                                <th scope="col">Group</th>
                                <th scope="col">Exchange</th>
                            </tr>
                        </thead>
                        <tbody>
                            {exchangeItems.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="empty-cell">
                                        Add foods to see exchange conversion.
                                    </td>
                                </tr>
                            ) : (
                                exchangeItems.map(({ item, food, exchange }) => (
                                    <tr key={item.id}>
                                        <td>{food?.name || item.foodName || "-"}</td>
                                        <td>{item.grams}</td>
                                        <td>{food?.group || item.foodGroup || "-"}</td>
                                        <td>{exchange.toFixed(2)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Section>
        </div>
    );
}

export default memo(NutrientSummary);
