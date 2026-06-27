function StatCard({ label, value, tone = "neutral" }) {
    return (
        <div className={`stat-card ${tone}`}>
            <div className="kpi-label">{label}</div>
            <div className="kpi-value">{value}</div>
        </div>
    );
}

function EditableStatCard({ label, value, unit, onChange }) {
    return (
        <div className="stat-card editable">
            <div className="kpi-label">{label}</div>
            <div className="kpi-value editable-value">
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="stat-input"
                />
                <span className="stat-unit">{unit}</span>
            </div>
        </div>
    );
}

export { StatCard, EditableStatCard };
