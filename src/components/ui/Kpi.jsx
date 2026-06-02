function Kpi({ label, value, hint, tone = "neutral" }) {
    return (
        <div className={`kpi ${tone}`}>
            <div className="kpi-label">{label}</div>
            <div className="kpi-value">{value}</div>
            <div className="kpi-hint">{hint}</div>
        </div>
    );
}

export default Kpi;

