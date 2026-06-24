import { useState, useMemo } from "react";
import { Flame, Info } from "lucide-react";
import { useProfile } from "../../context/ProfileContext";
import { useAuth } from "../../hooks/useAuth";

const ACTIVITY_MULTIPLIERS = {
    sedentary: { label: "Sedentary", desc: "Little or no exercise", factor: 1.2 },
    light: { label: "Lightly Active", desc: "Light exercise 1-3 days/week", factor: 1.375 },
    moderate: { label: "Moderately Active", desc: "Exercise 3-5 days/week", factor: 1.55 },
    heavy: { label: "Very Active", desc: "Hard exercise 6-7 days/week", factor: 1.725 },
    athlete: { label: "Athlete", desc: "Very hard exercise, physical job", factor: 1.9 },
};

const GOAL_ADJUSTMENTS = {
    "weight loss": { label: "Weight Loss", offset: -500, carb: 0.40, protein: 0.30, fat: 0.30 },
    maintenance: { label: "Maintenance", offset: 0, carb: 0.50, protein: 0.25, fat: 0.25 },
    "weight gain": { label: "Weight Gain", offset: 300, carb: 0.45, protein: 0.30, fat: 0.25 },
    "metabolic improvement": { label: "Metabolic Improvement", offset: -200, carb: 0.40, protein: 0.30, fat: 0.30 },
};

/**
 * Mifflin-St Jeor equation for BMR
 * Male:   10 × weight(kg) + 6.25 × height(cm) − 5 × age − 161 + 166  →  + 5
 * Female: 10 × weight(kg) + 6.25 × height(cm) − 5 × age − 161
 */
function calcBMR(weightKg, heightCm, age, sex) {
    const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
    return sex === "male" ? base + 5 : base - 161;
}

function CalorieCalculatorPage() {
    const { profile } = useProfile();
    const { profile: dbProfile } = useAuth();

    // Pre-fill from profile context / DB
    const [weight, setWeight] = useState(
        dbProfile?.weight_kg ? String(dbProfile.weight_kg) : profile.weight || ""
    );
    const [height, setHeight] = useState(
        dbProfile?.height_cm ? String(dbProfile.height_cm) : profile.height || ""
    );
    const [age, setAge] = useState(
        dbProfile?.age ? String(dbProfile.age) : ""
    );
    const [sex, setSex] = useState(profile.sex || "female");
    const [activity, setActivity] = useState(profile.activity || "moderate");
    const [goal, setGoal] = useState(profile.goal || "maintenance");

    const results = useMemo(() => {
        const w = parseFloat(weight);
        const h = parseFloat(height);
        const a = parseInt(age, 10);
        if (!w || !h || !a || w <= 0 || h <= 0 || a <= 0) return null;

        const bmr = calcBMR(w, h, a, sex);
        const activityData = ACTIVITY_MULTIPLIERS[activity] || ACTIVITY_MULTIPLIERS.moderate;
        const tdee = bmr * activityData.factor;
        const goalData = GOAL_ADJUSTMENTS[goal] || GOAL_ADJUSTMENTS.maintenance;
        const targetCals = Math.round(tdee + goalData.offset);

        const carbGrams = Math.round((targetCals * goalData.carb) / 4);
        const proteinGrams = Math.round((targetCals * goalData.protein) / 4);
        const fatGrams = Math.round((targetCals * goalData.fat) / 9);

        return {
            bmr: Math.round(bmr),
            tdee: Math.round(tdee),
            targetCals,
            macros: {
                carbs: { grams: carbGrams, percent: Math.round(goalData.carb * 100) },
                protein: { grams: proteinGrams, percent: Math.round(goalData.protein * 100) },
                fat: { grams: fatGrams, percent: Math.round(goalData.fat * 100) },
            },
            goalLabel: goalData.label,
            offset: goalData.offset,
        };
    }, [weight, height, age, sex, activity, goal]);

    return (
        <div className="calorie-calc-tool">
            <div className="calorie-calc-header">
                <div className="calorie-calc-icon-wrap">
                    <Flame size={32} />
                </div>
                <h2>Calorie Target Calculator</h2>
                <p className="calorie-calc-subtitle">
                    Calculate your daily calorie needs and recommended macro split based on your body and goals.
                </p>
            </div>

            <div className="calorie-calc-form">
                <div className="calorie-calc-inputs-grid">
                    <div className="calorie-input-group">
                        <label htmlFor="cal-age">Age (years)</label>
                        <input
                            id="cal-age"
                            type="number"
                            placeholder="e.g. 25"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            min="10"
                            max="120"
                        />
                    </div>
                    <div className="calorie-input-group">
                        <label htmlFor="cal-sex">Sex</label>
                        <select id="cal-sex" value={sex} onChange={(e) => setSex(e.target.value)}>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                    </div>
                    <div className="calorie-input-group">
                        <label htmlFor="cal-height">Height (cm)</label>
                        <input
                            id="cal-height"
                            type="number"
                            placeholder="e.g. 165"
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
                            min="50"
                            max="300"
                        />
                    </div>
                    <div className="calorie-input-group">
                        <label htmlFor="cal-weight">Weight (kg)</label>
                        <input
                            id="cal-weight"
                            type="number"
                            placeholder="e.g. 60"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            min="10"
                            max="500"
                        />
                    </div>
                </div>

                {/* Activity level selector */}
                <div className="calorie-selector-group">
                    <label>Activity Level</label>
                    <div className="calorie-option-grid">
                        {Object.entries(ACTIVITY_MULTIPLIERS).map(([key, val]) => (
                            <button
                                key={key}
                                className={`calorie-option-btn ${activity === key ? "active" : ""}`}
                                onClick={() => setActivity(key)}
                            >
                                <strong>{val.label}</strong>
                                <span>{val.desc}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Goal selector */}
                <div className="calorie-selector-group">
                    <label>Your Goal</label>
                    <div className="calorie-option-grid calorie-option-grid--goals">
                        {Object.entries(GOAL_ADJUSTMENTS).map(([key, val]) => (
                            <button
                                key={key}
                                className={`calorie-option-btn ${goal === key ? "active" : ""}`}
                                onClick={() => setGoal(key)}
                            >
                                <strong>{val.label}</strong>
                                <span>{val.offset > 0 ? `+${val.offset}` : val.offset} kcal/day</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Results */}
            {results && (
                <div className="calorie-results">
                    <div className="calorie-results-header">
                        <h3>Your Daily Targets</h3>
                        <span className="calorie-goal-badge">{results.goalLabel}</span>
                    </div>

                    <div className="calorie-kpi-row">
                        <div className="calorie-kpi">
                            <span className="calorie-kpi-value">{results.bmr}</span>
                            <span className="calorie-kpi-label">BMR (kcal)</span>
                            <span className="calorie-kpi-hint">Base metabolic rate</span>
                        </div>
                        <div className="calorie-kpi">
                            <span className="calorie-kpi-value">{results.tdee}</span>
                            <span className="calorie-kpi-label">TDEE (kcal)</span>
                            <span className="calorie-kpi-hint">Total daily expenditure</span>
                        </div>
                        <div className="calorie-kpi highlight">
                            <span className="calorie-kpi-value">{results.targetCals}</span>
                            <span className="calorie-kpi-label">Target (kcal)</span>
                            <span className="calorie-kpi-hint">
                                {results.offset !== 0
                                    ? `TDEE ${results.offset > 0 ? "+" : ""}${results.offset}`
                                    : "= TDEE"}
                            </span>
                        </div>
                    </div>

                    <div className="calorie-macros-section">
                        <h4>Recommended Macro Split</h4>
                        <div className="calorie-macro-bar">
                            <div
                                className="calorie-macro-segment carbs"
                                style={{ width: `${results.macros.carbs.percent}%` }}
                            >
                                {results.macros.carbs.percent}%
                            </div>
                            <div
                                className="calorie-macro-segment protein"
                                style={{ width: `${results.macros.protein.percent}%` }}
                            >
                                {results.macros.protein.percent}%
                            </div>
                            <div
                                className="calorie-macro-segment fat"
                                style={{ width: `${results.macros.fat.percent}%` }}
                            >
                                {results.macros.fat.percent}%
                            </div>
                        </div>
                        <div className="calorie-macro-cards">
                            <div className="calorie-macro-card carbs">
                                <span className="macro-dot carbs" />
                                <div>
                                    <strong>Carbs</strong>
                                    <span>{results.macros.carbs.grams}g</span>
                                    <span className="macro-percent">{results.macros.carbs.percent}%</span>
                                </div>
                            </div>
                            <div className="calorie-macro-card protein">
                                <span className="macro-dot protein" />
                                <div>
                                    <strong>Protein</strong>
                                    <span>{results.macros.protein.grams}g</span>
                                    <span className="macro-percent">{results.macros.protein.percent}%</span>
                                </div>
                            </div>
                            <div className="calorie-macro-card fat">
                                <span className="macro-dot fat" />
                                <div>
                                    <strong>Fat</strong>
                                    <span>{results.macros.fat.grams}g</span>
                                    <span className="macro-percent">{results.macros.fat.percent}%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="calorie-info-box">
                        <Info size={16} />
                        <p>
                            These values are estimates based on the <strong>Mifflin-St Jeor equation</strong>.
                            Individual needs may vary. Consult a registered dietitian for personalized advice.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CalorieCalculatorPage;


