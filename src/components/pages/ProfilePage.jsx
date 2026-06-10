import { useState, useEffect } from "react";
import { Activity, Leaf, Moon, User } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { getHealthGoals, getUserHealthGoals, saveUserHealthGoals } from "../../services/databaseService";
import Section from "../ui/Section";
import Field from "../ui/Field";
import UserProfile from "../UserProfile";
import { APP_CONFIG } from "../../data/config";

const ACTIVITY_OPTIONS = ["sedentary", "moderate", "heavy"];
const GOAL_OPTIONS = ["maintenance", "weight loss", "weight gain", "metabolic improvement"];
const DIET_OPTIONS = ["vegetarian", "eggetarian", "non-vegetarian", "Jain-compatible"];

function ProfilePage({ profile, setProfile, darkMode, setDarkMode }) {
    const { user } = useAuth();
    const [healthGoals, setHealthGoals] = useState([]);
    const [selectedGoalIds, setSelectedGoalIds] = useState([]);
    const [goalsLoading, setGoalsLoading] = useState(true);
    const [goalsSaving, setGoalsSaving] = useState(false);
    const [goalsError, setGoalsError] = useState(null);
    const [goalsToast, setGoalsToast] = useState(null);

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

