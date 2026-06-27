import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calculator, ArrowRight, Info } from "lucide-react";
import { useProfile } from "../../context/ProfileContext";
import { useAuth } from "../../hooks/useAuth";

const BMI_CATEGORIES = [
    { label: "Underweight", range: "< 18.5", color: "#3b82f6", min: 0, max: 18.5 },
    { label: "Normal", range: "18.5 – 24.9", color: "#10b981", min: 18.5, max: 25 },
    { label: "Overweight", range: "25 – 29.9", color: "#f59e0b", min: 25, max: 30 },
    { label: "Obese", range: "≥ 30", color: "#ef4444", min: 30, max: Infinity },
];

function getBmiCategory(bmi) {
    if (bmi < 18.5) return BMI_CATEGORIES[0];
    if (bmi < 25) return BMI_CATEGORIES[1];
    if (bmi < 30) return BMI_CATEGORIES[2];
    return BMI_CATEGORIES[3];
}

// Conversion helpers
const CM_PER_INCH = 2.54;
const LBS_PER_KG = 2.20462;

function cmToFtIn(cm) {
    const totalInches = cm / CM_PER_INCH;
    const ft = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return { ft, inches };
}

function ftInToCm(ft, inches) {
    return ((parseFloat(ft) || 0) * 12 + (parseFloat(inches) || 0)) * CM_PER_INCH;
}

function kgToLbs(kg) {
    return (kg * LBS_PER_KG).toFixed(1);
}

function lbsToKg(lbs) {
    return parseFloat(lbs) / LBS_PER_KG;
}

function BmiCalculatorPage() {
    const navigate = useNavigate();
    const { profile, setProfile } = useProfile();
    const { profile: dbProfile, updateProfile: updateDbProfile } = useAuth();
    const [saving, setSaving] = useState(false);
    const [unit, setUnit] = useState("metric"); // "metric" | "us"

    // Internal state always stored in metric (cm / kg)
    const [heightCm, setHeightCm] = useState(
        dbProfile?.height_cm ? String(dbProfile.height_cm) : profile.height || ""
    );
    const [weightKg, setWeightKgState] = useState(
        dbProfile?.weight_kg ? String(dbProfile.weight_kg) : profile.weight || ""
    );

    // US-unit local display state
    const initFtIn = heightCm ? cmToFtIn(parseFloat(heightCm)) : { ft: "", inches: "" };
    const [ft, setFt] = useState(initFtIn.ft || "");
    const [inches, setInches] = useState(initFtIn.inches || "");
    const [lbs, setLbs] = useState(weightKg ? kgToLbs(parseFloat(weightKg)) : "");

    // Derived metric values for BMI calculation
    const heightM = heightCm ? parseFloat(heightCm) / 100 : 0;
    const weightKgNum = weightKg ? parseFloat(weightKg) : 0;
    const bmi =
        heightM > 0 && weightKgNum > 0 ? (weightKgNum / (heightM * heightM)).toFixed(1) : null;
    const category = bmi ? getBmiCategory(parseFloat(bmi)) : null;

    // Ideal weight range for normal BMI (18.5–24.9)
    const idealWeightMin = heightM > 0 ? (18.5 * heightM * heightM).toFixed(1) : null;
    const idealWeightMax = heightM > 0 ? (24.9 * heightM * heightM).toFixed(1) : null;

    // --- Handlers for metric inputs ---
    function handleHeightCmChange(e) {
        const val = e.target.value;
        setHeightCm(val);
        // Sync US fields
        if (val) {
            const { ft: f, inches: i } = cmToFtIn(parseFloat(val));
            setFt(f);
            setInches(i);
        } else {
            setFt("");
            setInches("");
        }
    }

    function handleWeightKgChange(e) {
        const val = e.target.value;
        setWeightKgState(val);
        setLbs(val ? kgToLbs(parseFloat(val)) : "");
    }

    // --- Handlers for US inputs ---
    function handleFtChange(e) {
        const val = e.target.value;
        setFt(val);
        setHeightCm(String(ftInToCm(val, inches).toFixed(1)));
    }

    function handleInchesChange(e) {
        const val = e.target.value;
        setInches(val);
        setHeightCm(String(ftInToCm(ft, val).toFixed(1)));
    }

    function handleLbsChange(e) {
        const val = e.target.value;
        setLbs(val);
        setWeightKgState(val ? lbsToKg(val).toFixed(1) : "");
    }

    // Toggle handler – just switches the view; data stays synced
    function handleToggle(newUnit) {
        setUnit(newUnit);
    }

    async function handleSaveAndContinue() {
        try {
            setSaving(true);
            setProfile({ ...profile, height: heightCm, weight: weightKg });
            await updateDbProfile({
                height_cm: parseFloat(heightCm) || null,
                weight_kg: parseFloat(weightKg) || null,
                current_bmi: bmi ? parseFloat(bmi) : null,
            });
        } catch (err) {
            console.error("Failed to save BMI data:", err);
        } finally {
            setSaving(false);
            navigate("/dashboard");
        }
    }

    // Display strings for info box
    const heightDisplay = unit === "metric" ? `${heightCm} cm` : `${ft}′${inches}″`;
    const weightRangeDisplay =
        unit === "metric"
            ? `${idealWeightMin} – ${idealWeightMax} kg`
            : `${kgToLbs(parseFloat(idealWeightMin))} – ${kgToLbs(parseFloat(idealWeightMax))} lbs`;

    return (
        <div className="bmi-calculator-embedded">
            <div className="bmi-calculator-card">
                <div className="bmi-calc-header">
                    <div className="bmi-calc-icon">
                        <Calculator size={36} />
                    </div>
                    <h1>BMI Calculator</h1>
                    <p className="bmi-calc-subtitle">
                        Calculate your Body Mass Index and understand your health status
                    </p>
                </div>

                {/* ── Unit Toggle ── */}
                <div className="bmi-unit-toggle">
                    <button
                        className={`bmi-unit-btn ${unit === "metric" ? "active" : ""}`}
                        onClick={() => handleToggle("metric")}
                    >
                        Metric
                    </button>
                    <button
                        className={`bmi-unit-btn ${unit === "us" ? "active" : ""}`}
                        onClick={() => handleToggle("us")}
                    >
                        US Units
                    </button>
                </div>

                {unit === "metric" ? (
                    <div className="bmi-calc-inputs">
                        <div className="bmi-input-group">
                            <label htmlFor="bmi-height">Height (cm)</label>
                            <input
                                id="bmi-height"
                                type="number"
                                placeholder="e.g. 165"
                                value={heightCm}
                                onChange={handleHeightCmChange}
                                min="50"
                                max="300"
                            />
                        </div>
                        <div className="bmi-input-group">
                            <label htmlFor="bmi-weight">Weight (kg)</label>
                            <input
                                id="bmi-weight"
                                type="number"
                                placeholder="e.g. 60"
                                value={weightKg}
                                onChange={handleWeightKgChange}
                                min="10"
                                max="500"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="bmi-calc-inputs bmi-calc-inputs--us">
                        <div className="bmi-input-group">
                            <label htmlFor="bmi-ft">Height (ft)</label>
                            <input
                                id="bmi-ft"
                                type="number"
                                placeholder="e.g. 5"
                                value={ft}
                                onChange={handleFtChange}
                                min="1"
                                max="8"
                            />
                        </div>
                        <div className="bmi-input-group">
                            <label htmlFor="bmi-in">Height (in)</label>
                            <input
                                id="bmi-in"
                                type="number"
                                placeholder="e.g. 5"
                                value={inches}
                                onChange={handleInchesChange}
                                min="0"
                                max="11"
                            />
                        </div>
                        <div className="bmi-input-group bmi-input-weight-us">
                            <label htmlFor="bmi-lbs">Weight (lbs)</label>
                            <input
                                id="bmi-lbs"
                                type="number"
                                placeholder="e.g. 132"
                                value={lbs}
                                onChange={handleLbsChange}
                                min="20"
                                max="1100"
                            />
                        </div>
                    </div>
                )}

                {bmi && (
                    <div className="bmi-result-section">
                        <div className="bmi-result-card" style={{ borderColor: category.color }}>
                            <div className="bmi-result-number" style={{ color: category.color }}>
                                {bmi}
                            </div>
                            <div className="bmi-result-label" style={{ color: category.color }}>
                                {category.label}
                            </div>
                        </div>

                        <div className="bmi-scale">
                            {BMI_CATEGORIES.map((cat) => (
                                <div
                                    key={cat.label}
                                    className={`bmi-scale-segment ${category.label === cat.label ? "active" : ""}`}
                                    style={{ backgroundColor: cat.color }}
                                >
                                    <span className="bmi-scale-label">{cat.label}</span>
                                    <span className="bmi-scale-range">{cat.range}</span>
                                </div>
                            ))}
                        </div>

                        {idealWeightMin && idealWeightMax && (
                            <div className="bmi-info-box">
                                <Info size={16} />
                                <p>
                                    For your height ({heightDisplay}), a healthy weight range is{" "}
                                    <strong>{weightRangeDisplay}</strong>.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <button
                    className="bmi-continue-btn"
                    onClick={handleSaveAndContinue}
                    disabled={!bmi || saving}
                >
                    {saving ? "Saving…" : "Save & Go to Dashboard"} <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
}

export default BmiCalculatorPage;
