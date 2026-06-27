import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const LIMIT_FIELDS = [
    { key: "carbs", label: "Carbs", unit: "g" },
    { key: "protein", label: "Protein", unit: "g" },
    { key: "fat", label: "Fat", unit: "g" },
    { key: "sugar", label: "Sugar", unit: "g" },
    { key: "salt", label: "Salt", unit: "g" },
    { key: "fibre", label: "Fibre", unit: "g" },
];

/** Map limit field keys to their corresponding dayTotals property */
const TOTALS_KEY_MAP = {
    carbs: "carbs",
    protein: "protein",
    fat: "fat",
    sugar: "addedSugar",
    salt: "salt",
    fibre: "fibre",
};

function getActualValue(dayTotals, fieldKey) {
    if (!dayTotals) return 0;
    return dayTotals[TOTALS_KEY_MAP[fieldKey]] || 0;
}

/**
 * Compact inline nutrient limits strip that blends with hero-stats.
 */
function NutrientLimits({ limits, onChangeLimit, dayTotals }) {
    const [expanded, setExpanded] = useState(false);

    // Check which limits are exceeded
    const warnings = [];
    if (dayTotals) {
        for (const field of LIMIT_FIELDS) {
            const limitVal = limits[field.key];
            if (!limitVal || limitVal <= 0) continue;

            const actual = getActualValue(dayTotals, field.key);

            if (actual > limitVal) {
                warnings.push({
                    label: field.label,
                    actual: Math.round(actual * 10) / 10,
                    limit: limitVal,
                    unit: field.unit,
                });
            }
        }
    }

    return (
        <div className="nutrient-limits-strip">
            <div className="nutrient-limits-header" onClick={() => setExpanded(!expanded)}>
                <div className="nutrient-limits-title">
                    <AlertTriangle size={14} />
                    <span>Daily Nutrient Limits</span>
                    {warnings.length > 0 && (
                        <span className="nutrient-limits-badge warn">{warnings.length} exceeded</span>
                    )}
                    {warnings.length === 0 && dayTotals && (
                        <span className="nutrient-limits-badge ok">✓ All OK</span>
                    )}
                </div>
                <button className="nutrient-limits-toggle" aria-label={expanded ? "Collapse" : "Expand"}>
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
            </div>

            {expanded && (
                <div className="nutrient-limits-body">
                    <div className="nutrient-limits-grid">
                        {LIMIT_FIELDS.map((field) => {
                            const actual = getActualValue(dayTotals, field.key);
                            const limitVal = limits[field.key] || 0;
                            const exceeded = limitVal > 0 && actual > limitVal;

                            return (
                                <div key={field.key} className={`nutrient-limit-item ${exceeded ? "exceeded" : ""}`}>
                                    <div className="nutrient-limit-top">
                                        <span className="nutrient-limit-label">{field.label}</span>
                                        {dayTotals && limitVal > 0 && (
                                            <span className={`nutrient-limit-actual ${exceeded ? "over" : "ok"}`}>
                                                {Math.round(actual)}/{limitVal}{field.unit}
                                            </span>
                                        )}
                                    </div>
                                    <div className="nutrient-limit-input-wrap">
                                        <input
                                            type="number"
                                            min="0"
                                            value={limits[field.key] != null && limits[field.key] !== 0 ? limits[field.key] : ""}
                                            placeholder="—"
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                onChangeLimit(field.key, val === "" ? 0 : Number(val));
                                            }}
                                            className="nutrient-limit-input"
                                            aria-label={`${field.label} daily limit`}
                                        />
                                        <span className="nutrient-limit-unit">{field.unit}</span>
                                    </div>
                                    {limitVal > 0 && (
                                        <div className="nutrient-limit-bar">
                                            <div
                                                className={`nutrient-limit-bar-fill ${exceeded ? "over" : "ok"}`}
                                                style={{ width: `${Math.min((actual / limitVal) * 100, 100)}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {warnings.length > 0 && (
                        <div className="nutrient-warnings-inline">
                            {warnings.map((w) => (
                                <span key={w.label} className="nutrient-warn-pill">
                                    ⚠ {w.label}: {w.actual}{w.unit} / {w.limit}{w.unit}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default NutrientLimits;

