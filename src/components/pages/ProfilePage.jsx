import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Activity,
    CheckCircle,
    ChevronRight,
    Heart,
    Leaf,
    Mail,
    Phone,
    Ruler,
    Save,
    Scale,
    Shield,
    Target,
    User,
    Calendar,
    LogOut,
    Sparkles,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useProfile } from "../../context/ProfileContext";
import { getHealthGoals, getUserHealthGoals, saveUserHealthGoals } from "../../services/databaseService";
import { APP_CONFIG } from "../../data/config";

const ACTIVITY_OPTIONS = [
    { value: "sedentary", label: "Sedentary", desc: "Little or no exercise" },
    { value: "moderate", label: "Moderate", desc: "Exercise 3-5 days/week" },
    { value: "heavy", label: "Heavy", desc: "Intense exercise 6-7 days/week" },
];

const GOAL_OPTIONS = [
    { value: "maintenance", label: "Maintenance", icon: "⚖️" },
    { value: "weight loss", label: "Weight Loss", icon: "📉" },
    { value: "weight gain", label: "Weight Gain", icon: "📈" },
    { value: "metabolic improvement", label: "Metabolic Improvement", icon: "🔥" },
];

const DIET_OPTIONS = [
    { value: "vegetarian", label: "Vegetarian", icon: "🥬" },
    { value: "eggetarian", label: "Eggetarian", icon: "🥚" },
    { value: "non-vegetarian", label: "Non-Vegetarian", icon: "🍗" },
    { value: "Jain-compatible", label: "Jain-Compatible", icon: "🌱" },
];

function ProfilePage() {
    const { user, profile: dbProfile, updateProfile: updateDbProfile, signOut } = useAuth();
    const navigate = useNavigate();
    const { profile, setProfile } = useProfile();
    const [healthGoals, setHealthGoals] = useState([]);
    const [selectedGoalIds, setSelectedGoalIds] = useState([]);
    const [goalsLoading, setGoalsLoading] = useState(true);
    const [goalsSaving, setGoalsSaving] = useState(false);
    const [goalsError, setGoalsError] = useState(null);
    const [toast, setToast] = useState(null);
    const [profileSaving, setProfileSaving] = useState(false);

    // Body measurement local state (initialized from DB)
    const [height, setHeight] = useState("");
    const [weight, setWeight] = useState("");
    const [age, setAge] = useState("");
    const [contactNumber, setContactNumber] = useState("");

    // Sync from DB profile on load
    useEffect(() => {
        if (dbProfile) {
            setHeight(dbProfile.height_cm ? String(dbProfile.height_cm) : "");
            setWeight(dbProfile.weight_kg ? String(dbProfile.weight_kg) : "");
            setAge(dbProfile.age ? String(dbProfile.age) : "");
            setContactNumber(dbProfile.contact_number || "");
        }
    }, [dbProfile]);

    // Calculate current BMI
    const heightM = height ? parseFloat(height) / 100 : 0;
    const weightKg = weight ? parseFloat(weight) : 0;
    const currentBmi =
        heightM > 0 && weightKg > 0 ? (weightKg / (heightM * heightM)).toFixed(1) : null;

    // Profile completeness
    const completedFields = [
        profile.activity,
        profile.goal,
        profile.dietType,
        profile.sex,
        height,
        weight,
        age,
    ].filter(Boolean).length;
    const totalFields = 7;
    const completionPercent = Math.round((completedFields / totalFields) * 100);
    const isProfileComplete = completedFields === totalFields;

    const visibleFatLimit =
        APP_CONFIG.visibleFat?.[profile.sex]?.[profile.activity] ||
        APP_CONFIG.visibleFat?.female?.moderate ||
        25;

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    useEffect(() => {
        async function loadGoals() {
            try {
                setGoalsLoading(true);
                setGoalsError(null);
                const [goals, userGoals] = await Promise.all([
                    getHealthGoals(),
                    user?.id ? getUserHealthGoals(user.id) : Promise.resolve([]),
                ]);
                setHealthGoals(goals);
                setSelectedGoalIds(userGoals.map((ug) => ug.health_goal_id));
            } catch (err) {
                setGoalsError(err.message);
            } finally {
                setGoalsLoading(false);
            }
        }
        loadGoals();
    }, [user?.id]);

    function toggleGoal(goalId) {
        setSelectedGoalIds((prev) =>
            prev.includes(goalId) ? prev.filter((id) => id !== goalId) : [...prev, goalId]
        );
    }

    async function handleSaveGoals() {
        if (!user?.id) return;
        try {
            setGoalsSaving(true);
            setGoalsError(null);
            await saveUserHealthGoals(user.id, selectedGoalIds);
            setToast("Health goals saved successfully!");
        } catch (err) {
            setGoalsError(err.message);
        } finally {
            setGoalsSaving(false);
        }
    }

    async function handleSaveProfile() {
        if (!isProfileComplete) {
            setToast("Please fill in all fields to complete your profile.");
            return;
        }
        try {
            setProfileSaving(true);
            await updateDbProfile({
                height_cm: parseFloat(height) || null,
                weight_kg: parseFloat(weight) || null,
                current_bmi: currentBmi ? parseFloat(currentBmi) : null,
                age: parseInt(age) || null,
                contact_number: contactNumber || null,
            });
            setProfile({ ...profile, height, weight });
            setToast("Profile saved successfully! ✓");
            navigate("/bmi-calculator");
        } catch (err) {
            setToast(`Error: ${err.message}`);
        } finally {
            setProfileSaving(false);
        }
    }

    function getBmiCategory(bmi) {
        if (bmi < 18.5) return { label: "Underweight", color: "#3b82f6", bg: "#dbeafe" };
        if (bmi < 25) return { label: "Normal", color: "#059669", bg: "#d1fae5" };
        if (bmi < 30) return { label: "Overweight", color: "#d97706", bg: "#fef3c7" };
        return { label: "Obese", color: "#dc2626", bg: "#fee2e2" };
    }

    const memberSince = dbProfile?.created_at
        ? new Date(dbProfile.created_at).toLocaleDateString("en-IN", {
              month: "short",
              year: "numeric",
          })
        : "—";

    return (
        <div className="pro-profile-page">
            {toast && <div className="pro-toast">{toast}</div>}

            {/* ─── Profile Header Card ─── */}
            <div className="pro-profile-header-card">
                <div className="pro-profile-header-bg" />
                <div className="pro-profile-header-content">
                    <div className="pro-avatar-section">
                        <div className="pro-avatar">
                            <User size={28} />
                        </div>
                        <div className="pro-avatar-info">
                            <h1>{dbProfile?.full_name || dbProfile?.username || "User"}</h1>
                            <p className="pro-avatar-email">
                                <Mail size={13} />
                                {user?.email}
                            </p>
                            <div className="pro-avatar-meta">
                                <span className="pro-meta-chip">
                                    <Calendar size={12} /> Joined {memberSince}
                                </span>
                                <span className="pro-meta-chip">
                                    <Shield size={12} /> Active
                                </span>
                            </div>
                        </div>
                    </div>
                    <button className="pro-signout-btn" onClick={signOut}>
                        <LogOut size={15} /> Sign Out
                    </button>
                </div>
            </div>

            {/* ─── Stats Row ─── */}
            <div className="pro-stats-row">
                <div className="pro-stat-card">
                    <div className="pro-stat-icon" style={{ background: "#ede9fe", color: "#7c3aed" }}>
                        <Ruler size={18} />
                    </div>
                    <div className="pro-stat-info">
                        <span className="pro-stat-value">{height || "—"}</span>
                        <span className="pro-stat-label">Height (cm)</span>
                    </div>
                </div>
                <div className="pro-stat-card">
                    <div className="pro-stat-icon" style={{ background: "#fce7f3", color: "#db2777" }}>
                        <Scale size={18} />
                    </div>
                    <div className="pro-stat-info">
                        <span className="pro-stat-value">{weight || "—"}</span>
                        <span className="pro-stat-label">Weight (kg)</span>
                    </div>
                </div>
                <div className="pro-stat-card">
                    <div className="pro-stat-icon" style={{ background: "#d1fae5", color: "#059669" }}>
                        <Target size={18} />
                    </div>
                    <div className="pro-stat-info">
                        <span className="pro-stat-value">
                            {currentBmi || "—"}
                            {currentBmi && (
                                <small
                                    className="pro-bmi-badge"
                                    style={{
                                        background: getBmiCategory(parseFloat(currentBmi)).bg,
                                        color: getBmiCategory(parseFloat(currentBmi)).color,
                                    }}
                                >
                                    {getBmiCategory(parseFloat(currentBmi)).label}
                                </small>
                            )}
                        </span>
                        <span className="pro-stat-label">BMI</span>
                    </div>
                </div>
                <div className="pro-stat-card">
                    <div className="pro-stat-icon" style={{ background: "#fff7ed", color: "#ea580c" }}>
                        <Activity size={18} />
                    </div>
                    <div className="pro-stat-info">
                        <span className="pro-stat-value">{age || "—"}</span>
                        <span className="pro-stat-label">Age (years)</span>
                    </div>
                </div>
            </div>

            {/* ─── Completion Progress ─── */}
            <div className="pro-completion-bar-card">
                <div className="pro-completion-header">
                    <div className="pro-completion-title">
                        <Sparkles size={16} />
                        <span>Profile Completion</span>
                    </div>
                    <span className="pro-completion-percent">{completionPercent}%</span>
                </div>
                <div className="pro-progress-track">
                    <div
                        className="pro-progress-fill"
                        style={{ width: `${completionPercent}%` }}
                    />
                </div>
                <p className="pro-completion-hint">
                    {isProfileComplete
                        ? "Your profile is complete! You're all set."
                        : `Complete ${totalFields - completedFields} more field${totalFields - completedFields > 1 ? "s" : ""} to unlock full features.`}
                </p>
            </div>

            {/* ─── Main Content Grid ─── */}
            <div className="pro-profile-grid">
                {/* Left Column */}
                <div className="pro-profile-col">
                    {/* Profile Setup */}
                    <div className="pro-card">
                        <div className="pro-card-header">
                            <div className="pro-card-icon" style={{ background: "#ede9fe", color: "#7c3aed" }}>
                                <Activity size={16} />
                            </div>
                            <h2>Profile Setup</h2>
                        </div>
                        <div className="pro-card-body">
                            <div className="pro-field-group">
                                <label className="pro-field-label">Activity Level</label>
                                <div className="pro-radio-group">
                                    {ACTIVITY_OPTIONS.map((opt) => (
                                        <label
                                            key={opt.value}
                                            className={`pro-radio-card ${profile.activity === opt.value ? "selected" : ""}`}
                                        >
                                            <input
                                                type="radio"
                                                name="activity"
                                                value={opt.value}
                                                checked={profile.activity === opt.value}
                                                onChange={(e) =>
                                                    setProfile({ ...profile, activity: e.target.value })
                                                }
                                            />
                                            <strong>{opt.label}</strong>
                                            <small>{opt.desc}</small>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="pro-field-group">
                                <label className="pro-field-label">Weight Goal</label>
                                <div className="pro-option-grid">
                                    {GOAL_OPTIONS.map((opt) => (
                                        <label
                                            key={opt.value}
                                            className={`pro-option-chip ${profile.goal === opt.value ? "selected" : ""}`}
                                        >
                                            <input
                                                type="radio"
                                                name="goal"
                                                value={opt.value}
                                                checked={profile.goal === opt.value}
                                                onChange={(e) =>
                                                    setProfile({ ...profile, goal: e.target.value })
                                                }
                                            />
                                            <span className="pro-option-emoji">{opt.icon}</span>
                                            <span>{opt.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="pro-field-group">
                                <label className="pro-field-label">Diet Preference</label>
                                <div className="pro-option-grid">
                                    {DIET_OPTIONS.map((opt) => (
                                        <label
                                            key={opt.value}
                                            className={`pro-option-chip ${profile.dietType === opt.value ? "selected" : ""}`}
                                        >
                                            <input
                                                type="radio"
                                                name="dietType"
                                                value={opt.value}
                                                checked={profile.dietType === opt.value}
                                                onChange={(e) =>
                                                    setProfile({ ...profile, dietType: e.target.value })
                                                }
                                            />
                                            <span className="pro-option-emoji">{opt.icon}</span>
                                            <span>{opt.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="pro-inline-fields">
                                <div className="pro-field-group">
                                    <label className="pro-field-label">Sex</label>
                                    <select
                                        className="pro-select"
                                        value={profile.sex}
                                        onChange={(e) =>
                                            setProfile({ ...profile, sex: e.target.value })
                                        }
                                    >
                                        <option value="female">Female</option>
                                        <option value="male">Male</option>
                                    </select>
                                </div>
                                <div className="pro-field-group">
                                    <label className="pro-field-label">BMI Target</label>
                                    <input
                                        className="pro-input"
                                        type="number"
                                        step="0.1"
                                        value={profile.bmiTarget}
                                        onChange={(e) =>
                                            setProfile({ ...profile, bmiTarget: e.target.value })
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Health Goals */}
                    <div className="pro-card">
                        <div className="pro-card-header">
                            <div className="pro-card-icon" style={{ background: "#fce7f3", color: "#db2777" }}>
                                <Heart size={16} />
                            </div>
                            <h2>Health Goals & Conditions</h2>
                        </div>
                        <div className="pro-card-body">
                            {goalsLoading ? (
                                <p className="pro-muted">Loading health goals…</p>
                            ) : goalsError ? (
                                <p className="pro-error">{goalsError}</p>
                            ) : (
                                <>
                                    <p className="pro-muted" style={{ marginBottom: 14 }}>
                                        Select all conditions that apply to you.
                                    </p>
                                    <div className="pro-goals-grid">
                                        {healthGoals.map((goal) => (
                                            <label
                                                key={goal.health_goal_id}
                                                className={`pro-goal-chip ${selectedGoalIds.includes(goal.health_goal_id) ? "selected" : ""}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedGoalIds.includes(goal.health_goal_id)}
                                                    onChange={() => toggleGoal(goal.health_goal_id)}
                                                />
                                                <CheckCircle size={14} className="pro-goal-check" />
                                                <span>{goal.goal_name}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <button
                                        className="pro-btn pro-btn-secondary"
                                        onClick={handleSaveGoals}
                                        disabled={goalsSaving}
                                        style={{ marginTop: 16 }}
                                    >
                                        <Save size={14} />
                                        {goalsSaving ? "Saving…" : "Save Goals"}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="pro-profile-col">
                    {/* Body Measurements */}
                    <div className="pro-card">
                        <div className="pro-card-header">
                            <div className="pro-card-icon" style={{ background: "#d1fae5", color: "#059669" }}>
                                <Ruler size={16} />
                            </div>
                            <h2>Body Measurements</h2>
                        </div>
                        <div className="pro-card-body">
                            <div className="pro-measurements-grid">
                                <div className="pro-measure-field">
                                    <label className="pro-field-label">
                                        <Ruler size={13} /> Height
                                    </label>
                                    <div className="pro-input-with-unit">
                                        <input
                                            className="pro-input"
                                            type="number"
                                            placeholder="165"
                                            value={height}
                                            onChange={(e) => setHeight(e.target.value)}
                                        />
                                        <span className="pro-unit">cm</span>
                                    </div>
                                </div>
                                <div className="pro-measure-field">
                                    <label className="pro-field-label">
                                        <Scale size={13} /> Weight
                                    </label>
                                    <div className="pro-input-with-unit">
                                        <input
                                            className="pro-input"
                                            type="number"
                                            placeholder="60"
                                            value={weight}
                                            onChange={(e) => setWeight(e.target.value)}
                                        />
                                        <span className="pro-unit">kg</span>
                                    </div>
                                </div>
                                <div className="pro-measure-field">
                                    <label className="pro-field-label">
                                        <Calendar size={13} /> Age
                                    </label>
                                    <div className="pro-input-with-unit">
                                        <input
                                            className="pro-input"
                                            type="number"
                                            placeholder="25"
                                            value={age}
                                            onChange={(e) => setAge(e.target.value)}
                                        />
                                        <span className="pro-unit">yrs</span>
                                    </div>
                                </div>
                                <div className="pro-measure-field">
                                    <label className="pro-field-label">
                                        <Phone size={13} /> Contact
                                    </label>
                                    <input
                                        className="pro-input"
                                        type="tel"
                                        placeholder="+91 9876543210"
                                        value={contactNumber}
                                        onChange={(e) => setContactNumber(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Visible Fat Reference */}
                    <div className="pro-card">
                        <div className="pro-card-header">
                            <div className="pro-card-icon" style={{ background: "#fff7ed", color: "#ea580c" }}>
                                <Leaf size={16} />
                            </div>
                            <h2>Daily Fat Benchmark</h2>
                        </div>
                        <div className="pro-card-body">
                            <div className="pro-fat-display">
                                <div className="pro-fat-value">
                                    <strong>{visibleFatLimit}</strong>
                                    <span>g / day</span>
                                </div>
                                <div className="pro-fat-meta">
                                    <span className="pro-fat-tag">{profile.sex}</span>
                                    <span className="pro-fat-tag">{profile.activity}</span>
                                </div>
                            </div>
                            <p className="pro-muted" style={{ marginTop: 12 }}>
                                Visible fat intake benchmark based on your sex and activity level.
                            </p>
                        </div>
                    </div>

                    {/* Save Button */}
                    <button
                        className={`pro-save-btn ${isProfileComplete ? "ready" : "disabled"}`}
                        onClick={handleSaveProfile}
                        disabled={profileSaving}
                    >
                        {profileSaving ? (
                            <>Saving…</>
                        ) : isProfileComplete ? (
                            <>
                                <CheckCircle size={18} />
                                Save & Continue
                                <ChevronRight size={16} />
                            </>
                        ) : (
                            <>
                                <Shield size={18} />
                                Complete Profile to Continue
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;
