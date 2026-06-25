import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
    Activity,
    CheckCircle,
    Edit2,
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
    Cloud,
    CloudOff,
    RefreshCw,
    Loader,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useProfile } from "../../context/ProfileContext";
import { getHealthGoals, getUserHealthGoals, saveUserHealthGoals } from "../../services/databaseService";
import { APP_CONFIG } from "../../data/config";

const COUNTRY_CODES = [
    { code: "+91", country: "IN", label: "🇮🇳 +91" },
    { code: "+1", country: "US", label: "🇺🇸 +1" },
    { code: "+44", country: "GB", label: "🇬🇧 +44" },
    { code: "+61", country: "AU", label: "🇦🇺 +61" },
    { code: "+86", country: "CN", label: "🇨🇳 +86" },
    { code: "+81", country: "JP", label: "🇯🇵 +81" },
    { code: "+49", country: "DE", label: "🇩🇪 +49" },
    { code: "+33", country: "FR", label: "🇫🇷 +33" },
    { code: "+971", country: "AE", label: "🇦🇪 +971" },
    { code: "+65", country: "SG", label: "🇸🇬 +65" },
    { code: "+966", country: "SA", label: "🇸🇦 +966" },
    { code: "+82", country: "KR", label: "🇰🇷 +82" },
    { code: "+55", country: "BR", label: "🇧🇷 +55" },
    { code: "+7", country: "RU", label: "🇷🇺 +7" },
    { code: "+27", country: "ZA", label: "🇿🇦 +27" },
    { code: "+234", country: "NG", label: "🇳🇬 +234" },
    { code: "+62", country: "ID", label: "🇮🇩 +62" },
    { code: "+60", country: "MY", label: "🇲🇾 +60" },
    { code: "+64", country: "NZ", label: "🇳🇿 +64" },
    { code: "+39", country: "IT", label: "🇮🇹 +39" },
    { code: "+34", country: "ES", label: "🇪🇸 +34" },
    { code: "+52", country: "MX", label: "🇲🇽 +52" },
    { code: "+977", country: "NP", label: "🇳🇵 +977" },
    { code: "+94", country: "LK", label: "🇱🇰 +94" },
    { code: "+880", country: "BD", label: "🇧🇩 +880" },
    { code: "+92", country: "PK", label: "🇵🇰 +92" },
];

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

/** Extract country code and local number from a stored contact string like "+91 9876543210" */
function parseContactNumber(stored) {
    if (!stored) return { code: "+91", local: "" };
    const trimmed = stored.trim();
    // Try matching a known country code at the start
    const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
    for (const cc of sorted) {
        if (trimmed.startsWith(cc.code)) {
            return { code: cc.code, local: trimmed.slice(cc.code.length).trim() };
        }
    }
    return { code: "+91", local: trimmed };
}

/** Allow free typing but strip negatives. Clamp only on blur via validateOnBlur. */
function sanitizeNumeric(value) {
    if (value === "") return "";
    // Strip leading minus / non-numeric chars except dot
    const cleaned = value.replace(/^-/, "").replace(/[^0-9.]/g, "");
    if (cleaned === "" || cleaned === ".") return "";
    return cleaned;
}

/** Clamp value to [min, max] — call on blur only so user can type freely */
function clampOnBlur(value, min = 0, max = Infinity) {
    if (value === "") return "";
    const num = parseFloat(value);
    if (isNaN(num)) return "";
    return String(Math.min(Math.max(num, min), max));
}

function ProfilePage() {
    const { user, profile: dbProfile, updateProfile: updateDbProfile, signOut } = useAuth();
    const { profile, setProfile, profileSyncStatus, retrySync } = useProfile();
    const [healthGoals, setHealthGoals] = useState([]);
    const [selectedGoalIds, setSelectedGoalIds] = useState([]);
    const [goalsLoading, setGoalsLoading] = useState(true);
    const [goalsSaving, setGoalsSaving] = useState(false);
    const [goalsError, setGoalsError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [detailsSaving, setDetailsSaving] = useState(false);

    // Body measurement local state (initialized from DB)
    const [height, setHeight] = useState("");
    const [weight, setWeight] = useState("");
    const [age, setAge] = useState("");
    const [contactNumber, setContactNumber] = useState("");
    const [countryCode, setCountryCode] = useState("+91");
    const [editSex, setEditSex] = useState("");

    // Sync from DB profile on load
    useEffect(() => {
        if (dbProfile) {
            setHeight(dbProfile.height_cm ? String(dbProfile.height_cm) : ""); // eslint-disable-line react-hooks/set-state-in-effect
            setWeight(dbProfile.weight_kg ? String(dbProfile.weight_kg) : "");
            setAge(dbProfile.age ? String(dbProfile.age) : "");
            const parsed = parseContactNumber(dbProfile.contact_number);
            setCountryCode(parsed.code);
            setContactNumber(parsed.local);
            setEditSex(dbProfile.sex || profile.sex || "female");
        }
    }, [dbProfile]); // eslint-disable-line react-hooks/exhaustive-deps

    // Calculate current BMI
    const heightM = height ? parseFloat(height) / 100 : 0;
    const weightKg = weight ? parseFloat(weight) : 0;
    const currentBmi =
        heightM > 0 && weightKg > 0 ? (weightKg / (heightM * heightM)).toFixed(1) : null;

    // Profile completeness — based on SAVED (DB) values, not live edits
    const savedHeight = dbProfile?.height_cm;
    const savedWeight = dbProfile?.weight_kg;
    const savedAge = dbProfile?.age;
    const savedCompletedFields = [
        profile.activity,
        profile.goal,
        profile.dietType,
        profile.sex,
        savedHeight,
        savedWeight,
        savedAge,
    ].filter(Boolean).length;
    const totalFields = 7;
    const completionPercent = Math.round((savedCompletedFields / totalFields) * 100);
    const isProfileComplete = savedCompletedFields === totalFields;

    const visibleFatLimit =
        APP_CONFIG.visibleFat?.[profile.sex]?.[profile.activity] ||
        APP_CONFIG.visibleFat?.female?.moderate ||
        25;


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
            toast.success("Health goals saved successfully!");
        } catch (err) {
            setGoalsError(err.message);
        } finally {
            setGoalsSaving(false);
        }
    }

    async function handleSaveDetails() {
        try {
            setDetailsSaving(true);
            const fullContact = contactNumber ? `${countryCode} ${contactNumber}` : null;
            await updateDbProfile({
                weight_kg: parseFloat(weight) || null,
                age: parseInt(age) || null,
                sex: editSex || null,
                contact_number: fullContact,
                height_cm: parseFloat(height) || null,
                current_bmi: currentBmi ? parseFloat(currentBmi) : null,
            });
            setProfile({ ...profile, sex: editSex, height, weight });
            setIsEditing(false);
            toast.success("Details saved successfully!");
        } catch (err) {
            toast.error(`Error: ${err.message}`);
        } finally {
            setDetailsSaving(false);
        }
    }

    function handleCancelEdit() {
        // Reset to DB values
        if (dbProfile) {
            setWeight(dbProfile.weight_kg ? String(dbProfile.weight_kg) : "");
            setAge(dbProfile.age ? String(dbProfile.age) : "");
            const parsed = parseContactNumber(dbProfile.contact_number);
            setCountryCode(parsed.code);
            setContactNumber(parsed.local);
            setEditSex(dbProfile.sex || profile.sex || "female");
            setHeight(dbProfile.height_cm ? String(dbProfile.height_cm) : "");
        }
        setIsEditing(false);
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
                        : `Complete ${totalFields - savedCompletedFields} more field${totalFields - savedCompletedFields > 1 ? "s" : ""} to unlock full features.`}
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
                            {/* Sync status indicator */}
                            <div className="pro-sync-status" style={{ marginLeft: "auto" }}>
                                {profileSyncStatus === "syncing" && (
                                    <span className="pro-sync-badge pro-sync-syncing" title="Syncing preferences…">
                                        <Loader size={13} className="pro-spin" /> Saving…
                                    </span>
                                )}
                                {profileSyncStatus === "synced" && (
                                    <span className="pro-sync-badge pro-sync-synced" title="Preferences saved to cloud">
                                        <Cloud size={13} /> Synced
                                    </span>
                                )}
                                {profileSyncStatus === "error" && (
                                    <button
                                        className="pro-sync-badge pro-sync-error"
                                        title="Sync failed — click to retry"
                                        onClick={retrySync}
                                    >
                                        <CloudOff size={13} /> Failed — <RefreshCw size={11} /> Retry
                                    </button>
                                )}
                            </div>
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

                            <div className="pro-field-group">
                                    <label className="pro-field-label">BMI Target</label>
                                    <input
                                        className="pro-input"
                                        type="number"
                                        step="0.1"
                                        min="10"
                                        max="50"
                                        value={profile.bmiTarget}
                                        onChange={(e) =>
                                            setProfile({ ...profile, bmiTarget: sanitizeNumeric(e.target.value) })
                                        }
                                        onBlur={(e) =>
                                            setProfile({ ...profile, bmiTarget: clampOnBlur(e.target.value, 10, 50) })
                                        }
                                        onKeyDown={(e) => { if (e.key === "-" || e.key === "e") e.preventDefault(); }}
                                    />
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
                    {/* Body Measurements & Details */}
                    <div className="pro-card">
                        <div className="pro-card-header">
                            <div className="pro-card-icon" style={{ background: "#d1fae5", color: "#059669" }}>
                                <Ruler size={16} />
                            </div>
                            <h2>Body Details</h2>
                            {!isEditing && (
                                <button
                                    className="pro-btn pro-btn-edit"
                                    onClick={() => setIsEditing(true)}
                                    style={{ marginLeft: "auto" }}
                                >
                                    <Edit2 size={14} />
                                    Edit
                                </button>
                            )}
                        </div>
                        <div className="pro-card-body">
                            {isEditing ? (
                                /* ── Edit Mode ── */
                                <>
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
                                                    min="30"
                                                    max="300"
                                                    value={height}
                                                    onChange={(e) => setHeight(sanitizeNumeric(e.target.value))}
                                                    onBlur={(e) => setHeight(clampOnBlur(e.target.value, 30, 300))}
                                                    onKeyDown={(e) => { if (e.key === "-" || e.key === "e") e.preventDefault(); }}
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
                                                    min="1"
                                                    max="500"
                                                    value={weight}
                                                    onChange={(e) => setWeight(sanitizeNumeric(e.target.value))}
                                                    onBlur={(e) => setWeight(clampOnBlur(e.target.value, 1, 500))}
                                                    onKeyDown={(e) => { if (e.key === "-" || e.key === "e") e.preventDefault(); }}
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
                                                    min="1"
                                                    max="150"
                                                    value={age}
                                                    onChange={(e) => setAge(sanitizeNumeric(e.target.value))}
                                                    onBlur={(e) => setAge(clampOnBlur(e.target.value, 1, 150))}
                                                    onKeyDown={(e) => { if (e.key === "-" || e.key === "e") e.preventDefault(); }}
                                                />
                                                <span className="pro-unit">yrs</span>
                                            </div>
                                        </div>
                                        <div className="pro-measure-field">
                                            <label className="pro-field-label">
                                                <User size={13} /> Sex
                                            </label>
                                            <select
                                                className="pro-input pro-select"
                                                value={editSex}
                                                onChange={(e) => setEditSex(e.target.value)}
                                            >
                                                <option value="female">Female</option>
                                                <option value="male">Male</option>
                                            </select>
                                        </div>
                                        <div className="pro-measure-field pro-measure-full">
                                            <label className="pro-field-label">
                                                <Phone size={13} /> Contact
                                            </label>
                                            <div className="pro-phone-field">
                                                <select
                                                    className="pro-select pro-country-code-select"
                                                    value={countryCode}
                                                    onChange={(e) => setCountryCode(e.target.value)}
                                                >
                                                    {COUNTRY_CODES.map((cc) => (
                                                        <option key={cc.code} value={cc.code}>
                                                            {cc.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                <input
                                                    className="pro-input pro-phone-input"
                                                    type="tel"
                                                    placeholder="9876543210"
                                                    maxLength={15}
                                                    value={contactNumber}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/[^0-9\s]/g, "");
                                                        setContactNumber(val);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pro-details-actions">
                                        <button
                                            className="pro-btn pro-btn-primary"
                                            onClick={handleSaveDetails}
                                            disabled={detailsSaving}
                                        >
                                            <Save size={14} />
                                            {detailsSaving ? "Saving…" : "Save Details"}
                                        </button>
                                        <button
                                            className="pro-btn pro-btn-secondary"
                                            onClick={handleCancelEdit}
                                            disabled={detailsSaving}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </>
                            ) : (
                                /* ── View Mode ── */
                                <div className="pro-details-view">
                                    <div className="pro-detail-row">
                                        <span className="pro-detail-label"><Ruler size={13} /> Height</span>
                                        <span className="pro-detail-value">{height ? `${height} cm` : "—"}</span>
                                    </div>
                                    <div className="pro-detail-row">
                                        <span className="pro-detail-label"><Scale size={13} /> Weight</span>
                                        <span className="pro-detail-value">{weight ? `${weight} kg` : "—"}</span>
                                    </div>
                                    <div className="pro-detail-row">
                                        <span className="pro-detail-label"><Calendar size={13} /> Age</span>
                                        <span className="pro-detail-value">{age ? `${age} yrs` : "—"}</span>
                                    </div>
                                    <div className="pro-detail-row">
                                        <span className="pro-detail-label"><User size={13} /> Sex</span>
                                        <span className="pro-detail-value">{editSex ? editSex.charAt(0).toUpperCase() + editSex.slice(1) : "—"}</span>
                                    </div>
                                    <div className="pro-detail-row">
                                        <span className="pro-detail-label"><Phone size={13} /> Contact</span>
                                        <span className="pro-detail-value">{contactNumber ? `${countryCode} ${contactNumber}` : "—"}</span>
                                    </div>
                                </div>
                            )}
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
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;
