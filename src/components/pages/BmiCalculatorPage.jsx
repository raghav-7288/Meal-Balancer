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

function BmiCalculatorPage() {
    const navigate = useNavigate();
    const { profile, setProfile } = useProfile();
    const { profile: dbProfile, updateProfile: updateDbProfile } = useAuth();
    const [saving, setSaving] = useState(false);

    const [height, setHeight] = useState(
        dbProfile?.height_cm ? String(dbProfile.height_cm) : (profile.height || "")
    );
    const [weight, setWeight] = useState(
        dbProfile?.weight_kg ? String(dbProfile.weight_kg) : (profile.weight || "")
    );

    const heightM = height ? parseFloat(height) / 100 : 0;
    const weightKg = weight ? parseFloat(weight) : 0;
    const bmi = heightM > 0 && weightKg > 0
        ? (weightKg / (heightM * heightM)).toFixed(1)
        : null;
    const category = bmi ? getBmiCategory(parseFloat(bmi)) : null;

    // Ideal weight range for normal BMI (18.5–24.9)
    const idealWeightMin = heightM > 0 ? (18.5 * heightM * heightM).toFixed(1) : null;
    const idealWeightMax = heightM > 0 ? (24.9 * heightM * heightM).toFixed(1) : null;

    async function handleSaveAndContinue() {
        try {
            setSaving(true);
            // Save to local profile context
            setProfile({ ...profile, height, weight });
            // Save to Supabase DB
            await updateDbProfile({
                height_cm: parseFloat(height) || null,
                weight_kg: parseFloat(weight) || null,
                current_bmi: bmi ? parseFloat(bmi) : null,
            });
        } catch (err) {
            console.error("Failed to save BMI data:", err);
        } finally {
            setSaving(false);
            navigate("/dashboard");
        }
    }

    return (
        <div className="bmi-calculator-page">
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

                <div className="bmi-calc-inputs">
                    <div className="bmi-input-group">
                        <label htmlFor="bmi-height">Height (cm)</label>
                        <input
                            id="bmi-height"
                            type="number"
                            placeholder="e.g. 165"
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
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
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            min="10"
                            max="500"
                        />
                    </div>
                </div>

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
                                    For your height ({height} cm), a healthy weight range is{" "}
                                    <strong>{idealWeightMin} – {idealWeightMax} kg</strong>.
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

