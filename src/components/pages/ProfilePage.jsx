import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import {
    Activity,
    Calendar,
    LogOut,
    Mail,
    Ruler,
    Scale,
    Shield,
    Sparkles,
    Target,
    User,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useProfile } from "../../context/ProfileContext";
import {
    getHealthGoals,
    getUserHealthGoals,
    saveUserHealthGoals,
} from "../../services/databaseService";
import { APP_CONFIG } from "../../data/config";
import { parseContactNumber } from "../../data/countryCodes";
import ProfileSetupCard from "./profile/ProfileSetupCard";
import HealthGoalsCard from "./profile/HealthGoalsCard";
import BodyMeasurementsCard from "./profile/BodyMeasurementsCard";
import FatBenchmarkCard from "./profile/FatBenchmarkCard";

function getBmiCategory(bmi) {
    if (bmi < 18.5) return { label: "Underweight", color: "#3b82f6", bg: "#dbeafe" };
    if (bmi < 25) return { label: "Normal", color: "#059669", bg: "#d1fae5" };
    if (bmi < 30) return { label: "Overweight", color: "#d97706", bg: "#fef3c7" };
    return { label: "Obese", color: "#dc2626", bg: "#fee2e2" };
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
    const hasInitializedFromDb = useRef(false);
    useEffect(() => {
        if (dbProfile && !hasInitializedFromDb.current) {
            hasInitializedFromDb.current = true;
            setHeight(dbProfile.height_cm ? String(dbProfile.height_cm) : "");
            setWeight(dbProfile.weight_kg ? String(dbProfile.weight_kg) : "");
            setAge(dbProfile.age ? String(dbProfile.age) : "");
            const parsed = parseContactNumber(dbProfile.contact_number);
            setCountryCode(parsed.code);
            setContactNumber(parsed.local);
            setEditSex(dbProfile.sex || profile.sex || "female");
        }
    }, [dbProfile, profile.sex]);

    // Derived values
    const heightM = height ? parseFloat(height) / 100 : 0;
    const weightKg = weight ? parseFloat(weight) : 0;
    const currentBmi =
        heightM > 0 && weightKg > 0 ? (weightKg / (heightM * heightM)).toFixed(1) : null;

    const savedCompletedFields = [
        profile.activity,
        profile.goal,
        profile.dietType,
        profile.sex,
        dbProfile?.height_cm,
        dbProfile?.weight_kg,
        dbProfile?.age,
    ].filter(Boolean).length;
    const totalFields = 7;
    const completionPercent = Math.round((savedCompletedFields / totalFields) * 100);
    const isProfileComplete = savedCompletedFields === totalFields;

    const visibleFatLimit =
        APP_CONFIG.visibleFat?.[profile.sex]?.[profile.activity] ||
        APP_CONFIG.visibleFat?.female?.moderate ||
        25;

    const memberSince = dbProfile?.created_at
        ? new Date(dbProfile.created_at).toLocaleDateString("en-IN", {
              month: "short",
              year: "numeric",
          })
        : "—";

    // ── Health goals loading ──
    useEffect(() => {
        let cancelled = false;
        async function loadGoals() {
            try {
                setGoalsLoading(true);
                setGoalsError(null);
                const [goals, userGoals] = await Promise.all([
                    getHealthGoals(),
                    user?.id ? getUserHealthGoals(user.id) : Promise.resolve([]),
                ]);
                if (!cancelled) {
                    setHealthGoals(goals || []);
                    setSelectedGoalIds((userGoals || []).map((ug) => ug.health_goal_id));
                }
            } catch (err) {
                if (!cancelled) {
                    setGoalsError(err?.message || "Failed to load health goals");
                }
            } finally {
                if (!cancelled) setGoalsLoading(false);
            }
        }
        loadGoals();
        return () => {
            cancelled = true;
        };
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

    return (
        <div className="pro-profile-page">
            {/* ─── Profile Header Card ─── */}
            <div className="pro-profile-header-card">
                <div className="pro-profile-header-bg" />
                <div className="pro-profile-header-content">
                    <div className="pro-avatar-section">
                        <div className="pro-avatar" aria-hidden="true">
                            <User size={28} />
                        </div>
                        <div className="pro-avatar-info">
                            <h1>{dbProfile?.full_name || dbProfile?.username || "User"}</h1>
                            <p className="pro-avatar-email">
                                <Mail size={13} aria-hidden="true" />
                                {user?.email}
                            </p>
                            <div className="pro-avatar-meta">
                                <span className="pro-meta-chip">
                                    <Calendar size={12} aria-hidden="true" /> Joined {memberSince}
                                </span>
                                <span className="pro-meta-chip">
                                    <Shield size={12} aria-hidden="true" /> Active
                                </span>
                            </div>
                        </div>
                    </div>
                    <button type="button" className="pro-signout-btn" onClick={signOut}>
                        <LogOut size={15} aria-hidden="true" /> Sign Out
                    </button>
                </div>
            </div>

            {/* ─── Stats Row ─── */}
            <div className="pro-stats-row" role="group" aria-label="Body statistics">
                <div className="pro-stat-card">
                    <div
                        className="pro-stat-icon"
                        style={{ background: "#ede9fe", color: "#7c3aed" }}
                        aria-hidden="true"
                    >
                        <Ruler size={18} />
                    </div>
                    <div className="pro-stat-info">
                        <span className="pro-stat-value">{height || "—"}</span>
                        <span className="pro-stat-label">Height (cm)</span>
                    </div>
                </div>
                <div className="pro-stat-card">
                    <div
                        className="pro-stat-icon"
                        style={{ background: "#fce7f3", color: "#db2777" }}
                        aria-hidden="true"
                    >
                        <Scale size={18} />
                    </div>
                    <div className="pro-stat-info">
                        <span className="pro-stat-value">{weight || "—"}</span>
                        <span className="pro-stat-label">Weight (kg)</span>
                    </div>
                </div>
                <div className="pro-stat-card">
                    <div
                        className="pro-stat-icon"
                        style={{ background: "#d1fae5", color: "#059669" }}
                        aria-hidden="true"
                    >
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
                    <div
                        className="pro-stat-icon"
                        style={{ background: "#fff7ed", color: "#ea580c" }}
                        aria-hidden="true"
                    >
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
                        <Sparkles size={16} aria-hidden="true" />
                        <span>Profile Completion</span>
                    </div>
                    <span className="pro-completion-percent" aria-hidden="true">
                        {completionPercent}%
                    </span>
                </div>
                <div
                    className="pro-progress-track"
                    role="progressbar"
                    aria-valuenow={completionPercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Profile completion: ${completionPercent}%`}
                >
                    <div className="pro-progress-fill" style={{ width: `${completionPercent}%` }} />
                </div>
                <p className="pro-completion-hint">
                    {isProfileComplete
                        ? "Your profile is complete! You're all set."
                        : `Complete ${totalFields - savedCompletedFields} more field${totalFields - savedCompletedFields > 1 ? "s" : ""} to unlock full features.`}
                </p>
            </div>

            {/* ─── Main Content Grid ─── */}
            <div className="pro-profile-grid">
                <div className="pro-profile-col">
                    <ProfileSetupCard
                        profile={profile}
                        setProfile={setProfile}
                        profileSyncStatus={profileSyncStatus}
                        retrySync={retrySync}
                    />
                    <HealthGoalsCard
                        healthGoals={healthGoals}
                        selectedGoalIds={selectedGoalIds}
                        toggleGoal={toggleGoal}
                        goalsLoading={goalsLoading}
                        goalsError={goalsError}
                        goalsSaving={goalsSaving}
                        onSaveGoals={handleSaveGoals}
                    />
                </div>
                <div className="pro-profile-col">
                    <BodyMeasurementsCard
                        isEditing={isEditing}
                        setIsEditing={setIsEditing}
                        height={height}
                        setHeight={setHeight}
                        weight={weight}
                        setWeight={setWeight}
                        age={age}
                        setAge={setAge}
                        editSex={editSex}
                        setEditSex={setEditSex}
                        contactNumber={contactNumber}
                        setContactNumber={setContactNumber}
                        countryCode={countryCode}
                        setCountryCode={setCountryCode}
                        detailsSaving={detailsSaving}
                        onSaveDetails={handleSaveDetails}
                        onCancelEdit={handleCancelEdit}
                    />
                    <FatBenchmarkCard visibleFatLimit={visibleFatLimit} profile={profile} />
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;
