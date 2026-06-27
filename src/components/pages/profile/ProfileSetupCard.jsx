import { Activity, Cloud, CloudOff, Loader, RefreshCw } from "lucide-react";
import { sanitizeNumeric, clampOnBlur } from "../../../utils/inputSanitize";

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

function ProfileSetupCard({ profile, setProfile, profileSyncStatus, retrySync }) {
    return (
        <div className="pro-card">
            <div className="pro-card-header">
                <div
                    className="pro-card-icon"
                    style={{ background: "#ede9fe", color: "#7c3aed" }}
                    aria-hidden="true"
                >
                    <Activity size={16} />
                </div>
                <h2>Profile Setup</h2>
                {/* Sync status indicator */}
                <div
                    className="pro-sync-status"
                    style={{ marginLeft: "auto" }}
                    role="status"
                    aria-live="polite"
                >
                    {profileSyncStatus === "syncing" && (
                        <span
                            className="pro-sync-badge pro-sync-syncing"
                            aria-label="Syncing preferences"
                        >
                            <Loader size={13} className="pro-spin" aria-hidden="true" /> Saving…
                        </span>
                    )}
                    {profileSyncStatus === "synced" && (
                        <span
                            className="pro-sync-badge pro-sync-synced"
                            aria-label="Preferences saved to cloud"
                        >
                            <Cloud size={13} aria-hidden="true" /> Synced
                        </span>
                    )}
                    {profileSyncStatus === "error" && (
                        <button
                            type="button"
                            className="pro-sync-badge pro-sync-error"
                            aria-label="Sync failed, click to retry"
                            onClick={retrySync}
                        >
                            <CloudOff size={13} aria-hidden="true" /> Failed —{" "}
                            <RefreshCw size={11} aria-hidden="true" /> Retry
                        </button>
                    )}
                </div>
            </div>
            <div className="pro-card-body">
                <fieldset className="pro-field-group">
                    <legend className="pro-field-label">Activity Level</legend>
                    <div className="pro-radio-group" role="radiogroup" aria-label="Activity level">
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
                </fieldset>

                <fieldset className="pro-field-group">
                    <legend className="pro-field-label">Weight Goal</legend>
                    <div className="pro-option-grid" role="radiogroup" aria-label="Weight goal">
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
                </fieldset>

                <fieldset className="pro-field-group">
                    <legend className="pro-field-label">Diet Preference</legend>
                    <div className="pro-option-grid" role="radiogroup" aria-label="Diet preference">
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
                </fieldset>

                <div className="pro-field-group">
                    <label className="pro-field-label" htmlFor="bmi-target-input">
                        BMI Target
                    </label>
                    <input
                        id="bmi-target-input"
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
                            setProfile({
                                ...profile,
                                bmiTarget: clampOnBlur(e.target.value, 10, 50),
                            })
                        }
                        onKeyDown={(e) => {
                            if (e.key === "-" || e.key === "e") e.preventDefault();
                        }}
                        aria-label="BMI target value"
                    />
                </div>
            </div>
        </div>
    );
}

export default ProfileSetupCard;
