import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, CheckCircle, Leaf, Moon, Phone, Ruler, User } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useProfile } from "../../context/ProfileContext";
import { getHealthGoals, getUserHealthGoals, saveUserHealthGoals } from "../../services/databaseService";
import Section from "../ui/Section";
import Field from "../ui/Field";
import UserProfile from "../UserProfile";
import { APP_CONFIG } from "../../data/config";

const ACTIVITY_OPTIONS = ["sedentary", "moderate", "heavy"];
const GOAL_OPTIONS = ["maintenance", "weight loss", "weight gain", "metabolic improvement"];
const DIET_OPTIONS = ["vegetarian", "eggetarian", "non-vegetarian", "Jain-compatible"];

function ProfilePage() {
    const { user, profile: dbProfile, updateProfile: updateDbProfile } = useAuth();
    const navigate = useNavigate();
    const { profile, setProfile, darkMode, setDarkMode } = useProfile();
    const [healthGoals, setHealthGoals] = useState([]);
    const [selectedGoalIds, setSelectedGoalIds] = useState([]);
    const [goalsLoading, setGoalsLoading] = useState(true);
    const [goalsSaving, setGoalsSaving] = useState(false);
    const [goalsError, setGoalsError] = useState(null);
    const [goalsToast, setGoalsToast] = useState(null);
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
    const currentBmi = heightM > 0 && weightKg > 0
        ? (weightKg / (heightM * heightM)).toFixed(1)
        : null;

    // Profile completeness check
    const isProfileComplete = !!(
        profile.activity &&
        profile.goal &&
        profile.dietType &&
        profile.sex &&
        height &&
        weight &&
        age
    );

    const visibleFatLimit =
        APP_CONFIG.visibleFat?.[profile.sex]?.[profile.activity] ||
        APP_CONFIG.visibleFat?.female?.moderate ||
        25;

    useEffect(() => {
        if (goalsToast) {
            const timer = setTimeout(() => setGoalsToast(null), 2000);
            return () => clearTimeout(timer);
        }
    }, [goalsToast]);

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
            prev.includes(goalId)
                ? prev.filter((id) => id !== goalId)
                : [...prev, goalId]
        );
    }

    async function handleSaveGoals() {
        if (!user?.id) return;
        try {
            setGoalsSaving(true);
            setGoalsError(null);
            await saveUserHealthGoals(user.id, selectedGoalIds);
            setGoalsToast("Health goals saved successfully!");
        } catch (err) {
            setGoalsError(err.message);
        } finally {
            setGoalsSaving(false);
        }
    }

    return (
        <div className="profile-page">
            {goalsToast && <div className="toast-popup">{goalsToast}</div>}
            <div className="profile-page-grid">
                <Section title="My account" icon={<User size={16} />}>
                    <UserProfile />
                </Section>

                <Section title="Appearance" icon={<Moon size={16} />}>
                    <div className="dark-mode-toggle">
                        <span>Dark mode</span>
                        <button
                            className={`toggle-switch ${darkMode ? "active" : ""}`}
                            onClick={() => setDarkMode(!darkMode)}
                            aria-label="Toggle dark mode"
                        />
                    </div>
                </Section>

                <Section title="Profile setup" icon={<Activity size={16} />}>
                    <Field label="Activity level">
                        <select
                            value={profile.activity}
                            onChange={(e) => setProfile({ ...profile, activity: e.target.value })}
                        >
                            {ACTIVITY_OPTIONS.map((x) => (
                                <option key={x} value={x}>{x}</option>
                            ))}
                        </select>
                    </Field>

                    <Field label="BMI / weight goal">
                        <select
                            value={profile.goal}
                            onChange={(e) => setProfile({ ...profile, goal: e.target.value })}
                        >
                            {GOAL_OPTIONS.map((x) => (
                                <option key={x} value={x}>{x}</option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Diet type">
                        <select
                            value={profile.dietType}
                            onChange={(e) => setProfile({ ...profile, dietType: e.target.value })}
                        >
                            {DIET_OPTIONS.map((x) => (
                                <option key={x} value={x}>{x}</option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Sex / reference profile">
                        <select
                            value={profile.sex}
                            onChange={(e) => setProfile({ ...profile, sex: e.target.value })}
                        >
                            <option value="female">female</option>
                            <option value="male">male</option>
                        </select>
                    </Field>

                    <Field label="BMI target">
                        <input
                            value={profile.bmiTarget}
                            onChange={(e) => setProfile({ ...profile, bmiTarget: e.target.value })}
                        />
                    </Field>
                </Section>

                <Section title="Body measurements" icon={<Ruler size={16} />}>
                    <Field label="Height (cm)">
                        <input
                            type="number"
                            placeholder="e.g. 165"
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
                        />
                    </Field>

                    <Field label="Weight (kg)">
                        <input
                            type="number"
                            placeholder="e.g. 60"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                        />
                    </Field>

                    <Field label="Age">
                        <input
                            type="number"
                            placeholder="e.g. 25"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                        />
                    </Field>

                    <Field label="Contact number">
                        <input
                            type="tel"
                            placeholder="e.g. +91 9876543210"
                            value={contactNumber}
                            onChange={(e) => setContactNumber(e.target.value)}
                        />
                    </Field>

                    <Field label="Current BMI">
                        <div className="bmi-display">
                            {currentBmi ? (
                                <>
                                    <strong className="bmi-value">{currentBmi}</strong>
                                    <span className={`bmi-badge ${
                                        currentBmi < 18.5 ? "underweight" :
                                        currentBmi < 25 ? "normal" :
                                        currentBmi < 30 ? "overweight" : "obese"
                                    }`}>
                                        {currentBmi < 18.5 ? "Underweight" :
                                         currentBmi < 25 ? "Normal" :
                                         currentBmi < 30 ? "Overweight" : "Obese"}
                                    </span>
                                </>
                            ) : (
                                <span className="bmi-placeholder">Enter height & weight above</span>
                            )}
                        </div>
                    </Field>
                </Section>

                <div className="profile-complete-section">
                    <button
                        className={`profile-complete-btn ${isProfileComplete ? "complete" : "incomplete"}`}
                        disabled={profileSaving}
                        onClick={async () => {
                            if (!isProfileComplete) {
                                setGoalsToast("Please fill in all fields to complete your profile.");
                                return;
                            }
                            try {
                                setProfileSaving(true);
                                // Save to Supabase DB
                                await updateDbProfile({
                                    height_cm: parseFloat(height) || null,
                                    weight_kg: parseFloat(weight) || null,
                                    current_bmi: currentBmi ? parseFloat(currentBmi) : null,
                                    age: parseInt(age) || null,
                                    contact_number: contactNumber || null,
                                });
                                // Also sync to local profile context
                                setProfile({ ...profile, height, weight });
                                setGoalsToast("Profile saved successfully! ✓");
                                navigate("/bmi-calculator");
                            } catch (err) {
                                setGoalsToast(`Error saving profile: ${err.message}`);
                            } finally {
                                setProfileSaving(false);
                            }
                        }}
                    >
                        <CheckCircle size={18} />
                        {profileSaving ? "Saving…" : isProfileComplete ? "Profile Complete — Save & Continue" : "Complete Your Profile"}
                    </button>
                </div>

                <Section title="Health goals & conditions" icon={<Activity size={16} />}>
                    {goalsLoading ? (
                        <p className="small-copy">Loading health goals…</p>
                    ) : goalsError ? (
                        <p className="error-text">{goalsError}</p>
                    ) : (
                        <>
                            <p className="small-copy" style={{ marginBottom: 12 }}>
                                Select all conditions and goals that apply to you.
                            </p>
                            <div className="tag-grid">
                                {healthGoals.map((goal) => (
                                    <label key={goal.health_goal_id} className="check-chip">
                                        <input
                                            type="checkbox"
                                            checked={selectedGoalIds.includes(goal.health_goal_id)}
                                            onChange={() => toggleGoal(goal.health_goal_id)}
                                        />
                                        <span>{goal.goal_name}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="button-row" style={{ marginTop: 14 }}>
                                <button onClick={handleSaveGoals} disabled={goalsSaving}>
                                    {goalsSaving ? "Saving…" : "Save goals"}
                                </button>
                            </div>
                        </>
                    )}
                </Section>

                <Section title="Visible fat reference" icon={<Leaf size={16} />}>
                    <p className="small-copy">
                        Current editable benchmark for this profile:
                    </p>
                    <div className="fat-box">
                        <strong>{visibleFatLimit} g/day</strong>
                        <span>{profile.sex} · {profile.activity}</span>
                    </div>
                </Section>
            </div>
        </div>
    );
}

export default ProfilePage;
