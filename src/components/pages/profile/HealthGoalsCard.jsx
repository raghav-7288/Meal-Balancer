import { Heart, CheckCircle, Save } from "lucide-react";

function HealthGoalsCard({
    healthGoals,
    selectedGoalIds,
    toggleGoal,
    goalsLoading,
    goalsError,
    goalsSaving,
    onSaveGoals,
}) {
    return (
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
                            onClick={onSaveGoals}
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
    );
}

export default HealthGoalsCard;

