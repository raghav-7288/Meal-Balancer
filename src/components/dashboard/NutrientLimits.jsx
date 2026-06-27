import { memo, useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";

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
    const warnings = useMemo(() => {
        const result = [];
        if (dayTotals) {
            for (const field of LIMIT_FIELDS) {
                const limitVal = limits[field.key];
                if (!limitVal || limitVal <= 0) continue;

                const actual = getActualValue(dayTotals, field.key);

                if (actual > limitVal) {
                    result.push({
                        label: field.label,
                        actual: Math.round(actual * 10) / 10,
                        limit: limitVal,
                        unit: field.unit,
                    });
                }
            }
        }
        return result;
    }, [limits, dayTotals]);

    return (
        <div className="nutrient-limits-strip">
            <div
                className="nutrient-limits-header"
                onClick={() => setExpanded(!expanded)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setExpanded(!expanded);
                    }
                }}
                role="button"
                tabIndex={0}
                aria-expanded={expanded}
                aria-controls="nutrient-limits-body"
            >
                <div className="nutrient-limits-title">
                    <AlertTriangle size={14} aria-hidden="true" />
                    <span>Daily Nutrient Limits</span>
                    {warnings.length > 0 && (
                        <span className="nutrient-limits-badge warn" role="status">
                            {warnings.length} exceeded
                        </span>
                    )}
                    {warnings.length === 0 && dayTotals && (
                        <span className="nutrient-limits-badge ok" role="status">
                            ✓ All OK
                        </span>
                    )}
                </div>
                <span className="nutrient-limits-toggle" aria-hidden="true">
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
            </div>

            {expanded && (
                <div
                    className="nutrient-limits-body"
                    id="nutrient-limits-body"
                    role="region"
                    aria-label="Nutrient limit settings"
                >
                    <div className="nutrient-limits-grid">
                        {LIMIT_FIELDS.map((field) => {
                            const actual = getActualValue(dayTotals, field.key);
                            const limitVal = limits[field.key] || 0;
                            const exceeded = limitVal > 0 && actual > limitVal;

                            return (
                                <div
                                    key={field.key}
                                    className={`nutrient-limit-item ${exceeded ? "exceeded" : ""}`}
                                >
                                    <div className="nutrient-limit-top">
                                        <span
                                            className="nutrient-limit-label"
                                            id={`limit-label-${field.key}`}
                                        >
                                            {field.label}
                                        </span>
                                        {dayTotals && limitVal > 0 && (
                                            <span
                                                className={`nutrient-limit-actual ${exceeded ? "over" : "ok"}`}
                                            >
                                                {Math.round(actual)}/{limitVal}
                                                {field.unit}
                                                <span className="sr-only">
                                                    {exceeded
                                                        ? " — limit exceeded"
                                                        : " — within limit"}
                                                </span>
                                            </span>
                                        )}
                                    </div>
                                    <div className="nutrient-limit-input-wrap">
                                        <input
                                            type="number"
                                            min="0"
                                            value={
                                                limits[field.key] != null && limits[field.key] !== 0
                                                    ? limits[field.key]
                                                    : ""
                                            }
                                            placeholder="—"
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                onChangeLimit(
                                                    field.key,
                                                    val === "" ? 0 : Number(val)
                                                );
                                            }}
                                            className="nutrient-limit-input"
                                            aria-label={`${field.label} daily limit in ${field.unit}`}
                                            aria-describedby={`limit-label-${field.key}`}
                                        />
                                        <span className="nutrient-limit-unit" aria-hidden="true">
                                            {field.unit}
                                        </span>
                                    </div>
                                    {limitVal > 0 && (
                                        <div
                                            className="nutrient-limit-bar"
                                            role="progressbar"
                                            aria-label={`${field.label} usage`}
                                            aria-valuenow={Math.round(actual)}
                                            aria-valuemin={0}
                                            aria-valuemax={limitVal}
                                        >
                                            <div
                                                className={`nutrient-limit-bar-fill ${exceeded ? "over" : "ok"}`}
                                                style={{
                                                    width: `${Math.min((actual / limitVal) * 100, 100)}%`,
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {warnings.length > 0 && (
                        <div className="nutrient-warnings-inline" role="alert" aria-live="polite">
                            {warnings.map((w) => (
                                <span key={w.label} className="nutrient-warn-pill">
                                    ⚠ {w.label}: {w.actual}
                                    {w.unit} / {w.limit}
                                    {w.unit}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default memo(NutrientLimits);
