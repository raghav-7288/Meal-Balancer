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
                <div className="pro-card-icon" style={{ background: "#fce7f3", color: "#db2777" }} aria-hidden="true">
                    <Heart size={16} />
                </div>
                <h2>Health Goals & Conditions</h2>
            </div>
            <div className="pro-card-body">
                {goalsLoading ? (
                    <p className="pro-muted" role="status" aria-live="polite">Loading health goals…</p>
                ) : goalsError ? (
                    <p className="pro-error" role="alert">{goalsError}</p>
                ) : (
                    <>
                        <p className="pro-muted" style={{ marginBottom: 14 }}>
                            Select all conditions that apply to you.
                        </p>
                        <div className="pro-goals-grid" role="group" aria-label="Health goals selection">
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
                                    <CheckCircle size={14} className="pro-goal-check" aria-hidden="true" />
                                    <span>{goal.goal_name}</span>
                                </label>
                            ))}
                        </div>
                        <button
                            type="button"
                            className="pro-btn pro-btn-secondary"
                            onClick={onSaveGoals}
                            disabled={goalsSaving}
                            style={{ marginTop: 16 }}
                            aria-busy={goalsSaving}
                        >
                            <Save size={14} aria-hidden="true" />
                            {goalsSaving ? "Saving…" : "Save Goals"}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default HealthGoalsCard;

