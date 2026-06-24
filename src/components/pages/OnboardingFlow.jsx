import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowRight,
    ArrowLeft,
    User,
    UtensilsCrossed,
    Trophy,
    CheckCircle,
    Sparkles,
} from "lucide-react";
import { useProfile } from "../../context/ProfileContext";
import { useAuth } from "../../hooks/useAuth";
import { PRESET_PLANS, MEALS } from "../../data/presetPlans";
import { aggregateMeal, combineDay } from "../../engines/nutrientEngine";
import { scoreDay } from "../../engines/scoringEngine";

const ACTIVITY_OPTIONS = [
    { value: "sedentary", label: "Sedentary", desc: "Little or no exercise", emoji: "🪑" },
    { value: "moderate", label: "Moderate", desc: "Exercise 3-5 days/week", emoji: "🚶" },
    { value: "heavy", label: "Heavy", desc: "Intense exercise 6-7 days", emoji: "🏋️" },
];

const GOAL_OPTIONS = [
    { value: "maintenance", label: "Maintenance", emoji: "⚖️" },
    { value: "weight loss", label: "Weight Loss", emoji: "📉" },
    { value: "weight gain", label: "Weight Gain", emoji: "📈" },
    { value: "metabolic improvement", label: "Metabolic Health", emoji: "🔥" },
];

const DIET_OPTIONS = [
    { value: "vegetarian", label: "Vegetarian", emoji: "🥬" },
    { value: "eggetarian", label: "Eggetarian", emoji: "🥚" },
    { value: "non-vegetarian", label: "Non-Vegetarian", emoji: "🍗" },
    { value: "Jain-compatible", label: "Jain-Compatible", emoji: "🌱" },
];

const SEX_OPTIONS = [
    { value: "female", label: "Female", emoji: "♀️" },
    { value: "male", label: "Male", emoji: "♂️" },
];

function getScoreColor(score) {
    if (score >= 85) return "#059669";
    if (score >= 70) return "#16a34a";
    if (score >= 50) return "#d97706";
    return "#dc2626";
}

function OnboardingFlow({ onComplete }) {
    const navigate = useNavigate();
    const { profile, setProfile } = useProfile();
    const { user } = useAuth();

    const [step, setStep] = useState(1);

    // Step 1: Profile setup
    const [activity, setActivity] = useState(profile.activity || "moderate");
    const [goal, setGoal] = useState(profile.goal || "maintenance");
    const [dietType, setDietType] = useState(profile.dietType || "vegetarian");
    const [sex, setSex] = useState(profile.sex || "female");

    // Step 2: Plan selection
    const [selectedPlanIdx, setSelectedPlanIdx] = useState(0);

    // Computed score for selected plan (Step 3)
    const selectedPlan = PRESET_PLANS[selectedPlanIdx];
    const planScore = useMemo(() => {
        if (!selectedPlan) return null;
        const mealTotals = {};
        for (const meal of MEALS) {
            const items = selectedPlan.meals[meal] || [];
            mealTotals[meal] = aggregateMeal(items);
        }
        const dayTotals = combineDay(mealTotals);
        return scoreDay(dayTotals);
    }, [selectedPlan]);

    function handleStep1Next() {
        // Save profile
        setProfile({
            ...profile,
            activity,
            goal,
            dietType,
            sex,
        });
        setStep(2);
    }

    function handleStep2Next() {
        setStep(3);
    }

    function handleFinish() {
        // Mark onboarding as complete
        localStorage.setItem("meal-balancer-onboarding-done", "true");
        if (onComplete) onComplete();
        navigate("/dashboard");
    }

    return (
        <div className="onboarding-overlay">
            <div className="onboarding-card">
                {/* Progress indicator */}
                <div className="onboarding-progress">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className={`onboarding-step-dot ${step >= s ? "active" : ""} ${step === s ? "current" : ""}`}>
                            {step > s ? <CheckCircle size={16} /> : s}
                        </div>
                    ))}
                    <div className="onboarding-progress-line">
                        <div className="onboarding-progress-fill" style={{ width: `${((step - 1) / 2) * 100}%` }} />
                    </div>
                </div>

                {/* Step 1: Profile */}
                {step === 1 && (
                    <div className="onboarding-step">
                        <div className="onboarding-step-header">
                            <div className="onboarding-step-icon">
                                <User size={28} />
                            </div>
                            <h2>Set Up Your Profile</h2>
                            <p>Tell us about yourself so we can personalize your nutrition recommendations.</p>
                        </div>

                        <div className="onboarding-form">
                            <div className="onboarding-field">
                                <label>Sex</label>
                                <div className="onboarding-option-row">
                                    {SEX_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            className={`onboarding-chip ${sex === opt.value ? "active" : ""}`}
                                            onClick={() => setSex(opt.value)}
                                        >
                                            <span className="chip-emoji">{opt.emoji}</span>
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="onboarding-field">
                                <label>Activity Level</label>
                                <div className="onboarding-option-row">
                                    {ACTIVITY_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            className={`onboarding-chip ${activity === opt.value ? "active" : ""}`}
                                            onClick={() => setActivity(opt.value)}
                                        >
                                            <span className="chip-emoji">{opt.emoji}</span>
                                            <div>
                                                <strong>{opt.label}</strong>
                                                <span className="chip-desc">{opt.desc}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="onboarding-field">
                                <label>Your Goal</label>
                                <div className="onboarding-option-grid">
                                    {GOAL_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            className={`onboarding-chip ${goal === opt.value ? "active" : ""}`}
                                            onClick={() => setGoal(opt.value)}
                                        >
                                            <span className="chip-emoji">{opt.emoji}</span>
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="onboarding-field">
                                <label>Diet Preference</label>
                                <div className="onboarding-option-grid">
                                    {DIET_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            className={`onboarding-chip ${dietType === opt.value ? "active" : ""}`}
                                            onClick={() => setDietType(opt.value)}
                                        >
                                            <span className="chip-emoji">{opt.emoji}</span>
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="onboarding-actions">
                            <div />
                            <button className="onboarding-next-btn" onClick={handleStep1Next}>
                                Continue <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Pick a Plan */}
                {step === 2 && (
                    <div className="onboarding-step">
                        <div className="onboarding-step-header">
                            <div className="onboarding-step-icon plan">
                                <UtensilsCrossed size={28} />
                            </div>
                            <h2>Pick a Starter Plan</h2>
                            <p>Choose a preset meal plan to get started. You can customize it later on the dashboard.</p>
                        </div>

                        <div className="onboarding-plans">
                            {PRESET_PLANS.map((plan, idx) => (
                                <button
                                    key={plan.id}
                                    className={`onboarding-plan-card ${selectedPlanIdx === idx ? "active" : ""}`}
                                    onClick={() => setSelectedPlanIdx(idx)}
                                >
                                    <div className="onboarding-plan-name">{plan.name}</div>
                                    <div className="onboarding-plan-meta">
                                        {MEALS.map((meal) => (
                                            <span key={meal}>
                                                {meal}: {(plan.meals[meal] || []).length} items
                                            </span>
                                        ))}
                                    </div>
                                    {selectedPlanIdx === idx && (
                                        <div className="onboarding-plan-check">
                                            <CheckCircle size={20} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="onboarding-actions">
                            <button className="onboarding-back-btn" onClick={() => setStep(1)}>
                                <ArrowLeft size={16} /> Back
                            </button>
                            <button className="onboarding-next-btn" onClick={handleStep2Next}>
                                See My Score <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: View Score */}
                {step === 3 && (
                    <div className="onboarding-step">
                        <div className="onboarding-step-header">
                            <div className="onboarding-step-icon score">
                                <Trophy size={28} />
                            </div>
                            <h2>Your Plan Score</h2>
                            <p>Here's how <strong>"{selectedPlan.name}"</strong> scores based on your profile.</p>
                        </div>

                        {planScore && (
                            <div className="onboarding-score-section">
                                <div className="onboarding-score-ring">
                                    <svg viewBox="0 0 120 120" className="onboarding-ring-svg">
                                        <circle
                                            cx="60" cy="60" r="50"
                                            fill="none" stroke="currentColor" strokeWidth="10"
                                            className="onboarding-ring-bg"
                                        />
                                        <circle
                                            cx="60" cy="60" r="50"
                                            fill="none" stroke={getScoreColor(planScore.score)} strokeWidth="10"
                                            className="onboarding-ring-fill"
                                            strokeDasharray={`${2 * Math.PI * 50}`}
                                            strokeDashoffset={`${2 * Math.PI * 50 * (1 - planScore.score / 100)}`}
                                            strokeLinecap="round"
                                            transform="rotate(-90 60 60)"
                                        />
                                    </svg>
                                    <div className="onboarding-ring-content">
                                        <span className="onboarding-score-value" style={{ color: getScoreColor(planScore.score) }}>
                                            {planScore.score}
                                        </span>
                                        <span className="onboarding-score-label">/100</span>
                                    </div>
                                </div>

                                <div className="onboarding-score-band" style={{ color: getScoreColor(planScore.score) }}>
                                    {planScore.band}
                                </div>

                                {planScore.reasons.length > 0 && (
                                    <div className="onboarding-score-reasons">
                                        <strong>Areas to improve:</strong>
                                        <ul>
                                            {planScore.reasons.map((r, i) => (
                                                <li key={i}>{r}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {planScore.reasons.length === 0 && (
                                    <div className="onboarding-score-perfect">
                                        <Sparkles size={16} />
                                        <span>This plan has excellent nutritional balance!</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="onboarding-finish-hint">
                            <p>
                                🎉 You're all set! Head to the <strong>Dashboard</strong> to customize your plan,
                                add foods, and track your progress.
                            </p>
                        </div>

                        <div className="onboarding-actions">
                            <button className="onboarding-back-btn" onClick={() => setStep(2)}>
                                <ArrowLeft size={16} /> Back
                            </button>
                            <button className="onboarding-finish-btn" onClick={handleFinish}>
                                Go to Dashboard <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default OnboardingFlow;

