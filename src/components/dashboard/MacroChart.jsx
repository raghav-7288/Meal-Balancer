import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#6366f1", "#f59e0b", "#ef4444", "#10b981"];

function MacroChart({ dayTotals }) {
    if (!dayTotals || dayTotals.kcal === 0) {
        return (
            <div className="macro-chart-empty">
                <p className="small-copy">Add food items to see macronutrient distribution</p>
            </div>
        );
    }

    const data = [
        { name: "Carbs", value: Math.round(dayTotals.carbs * 4) }, // kcal from carbs
        { name: "Protein", value: Math.round(dayTotals.protein * 4) }, // kcal from protein
        { name: "Fat", value: Math.round(dayTotals.fat * 9) }, // kcal from fat
        { name: "Fibre", value: Math.round(dayTotals.fibre * 2) }, // approx kcal from fibre
    ].filter((d) => d.value > 0);

    const total = data.reduce((sum, d) => sum + d.value, 0);
    const legendData = data.map((d) => ({
        ...d,
        pct: total > 0 ? Math.round((d.value / total) * 100) : 0,
    }));

    return (
        <div className="macro-chart" role="img" aria-label="Macronutrient distribution pie chart">
            <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={60}
                        paddingAngle={3}
                        dataKey="value"
                        label={false}
                        labelLine={false}
                    >
                        {data.map((entry, index) => (
                            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} kcal`} />
                    <Legend
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        formatter={(value) => {
                            const item = legendData.find((d) => d.name === value);
                            return `${value} ${item ? item.pct : 0}%`;
                        }}
                        wrapperStyle={{ fontSize: "11px", paddingTop: "4px" }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

export default MacroChart;

