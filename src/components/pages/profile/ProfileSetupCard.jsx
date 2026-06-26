import {
    Activity,
    Cloud,
    CloudOff,
    Loader,
    RefreshCw,
} from "lucide-react";

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

/** Allow free typing but strip negatives. Clamp only on blur via validateOnBlur. */
function sanitizeNumeric(value) {
    if (value === "") return "";
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

function ProfileSetupCard({ profile, setProfile, profileSyncStatus, retrySync }) {
    return (
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
    );
}

export default ProfileSetupCard;

