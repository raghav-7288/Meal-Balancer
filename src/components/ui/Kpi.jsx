import { memo } from "react";

function Kpi({ label, value, hint, tone = "neutral" }) {
    return (
        <div className={`kpi ${tone}`} role="group" aria-label={`${label}: ${value} ${hint || ""}`}>
            <div className="kpi-label">{label}</div>
            <div className="kpi-value" aria-hidden="true">
                {value}
            </div>
            <div className="kpi-hint" aria-hidden="true">
                {hint}
            </div>
        </div>
    );
}

export default memo(Kpi);
