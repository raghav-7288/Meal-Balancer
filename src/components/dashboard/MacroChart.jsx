import { memo, useRef, useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";

const COLORS = ["#6366f1", "#10b981", "#ef4444", "#f59e0b"];

function MacroChart({ dayTotals }) {
    // Measure container width directly (ResponsiveContainer is unreliable in sidebar)
    const containerRef = useRef(null);
    const [chartWidth, setChartWidth] = useState(220);
    useEffect(() => {
        const el = containerRef.current;
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

    if (!dayTotals || dayTotals.kcal === 0) {
        return (
            <div className="macro-chart-empty">
                <p className="small-copy">Add food items to see macronutrient distribution</p>
            </div>
        );
    }

    const data = [
        { name: "Carbs", value: Math.round(dayTotals.carbs * 4) },
        { name: "Protein", value: Math.round(dayTotals.protein * 4) },
        { name: "Fat", value: Math.round(dayTotals.fat * 9) },
        { name: "Fibre", value: Math.round(dayTotals.fibre * 2) },
    ].filter((d) => d.value > 0);

    const total = data.reduce((sum, d) => sum + d.value, 0);
    const legendData = data.map((d) => ({
        ...d,
        pct: total > 0 ? Math.round((d.value / total) * 100) : 0,
    }));

    return (
        <div className="macro-chart" role="img" aria-label="Macronutrient distribution pie chart">
            <div className="macro-chart-ring-area" ref={containerRef}>
                <PieChart width={chartWidth} height={160}>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={38}
                        outerRadius={62}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                        label={false}
                        labelLine={false}
                    >
                        {data.map((entry, index) => (
                            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value, name) => {
                            const item = legendData.find((d) => d.name === name);
                            return [`${value} kcal (${item?.pct || 0}%)`, name];
                        }}
                        wrapperStyle={{ zIndex: 10 }}
                        contentStyle={{
                            borderRadius: "10px",
                            border: "1px solid #e5e7eb",
                            fontSize: "12px",
                        }}
                    />
                </PieChart>
                <div className="macro-chart-center-label">
                    <span className="macro-center-value">{Math.round(dayTotals.kcal)}</span>
                    <span className="macro-center-unit">kcal</span>
                </div>
            </div>
            <div className="macro-chart-legend">
                {legendData.map((item, idx) => (
                    <div key={item.name} className="macro-legend-item">
                        <span className="macro-legend-dot" style={{ background: COLORS[idx] }} />
                        <span className="macro-legend-name">{item.name}</span>
                        <span className="macro-legend-pct">{item.pct}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default memo(MacroChart);
