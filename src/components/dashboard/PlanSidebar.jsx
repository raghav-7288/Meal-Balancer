import { Activity, Copy, Leaf, Plus, Sparkles, Trash2 } from "lucide-react";
import Section from "../ui/Section";

function PlanSidebar({
    presetPlans,
    userPlans,
    planView,
    setPlanView,
    activePlanId,
    setActivePlanId,
    summaries,
    newPlanName,
    setNewPlanName,
    onCreatePlan,
    onResetPlan,
    onDeletePlan,
    onDuplicatePreset,
    visibleFatLimit,
    profile,
    userGoalNames,
}) {
    return (
        <aside className="sidebar" role="complementary" aria-label="Plan controls sidebar">
            <Section title="Plan controls" icon={<Sparkles size={16} />}>
                <input
                    type="text"
                    placeholder={`My Plan ${userPlans.length + 1}`}
                    value={newPlanName}
                    onChange={(e) => setNewPlanName(e.target.value)}
                    className="plan-name-input"
                    aria-label="New plan name"
                />
                <div className="button-row">
                    <button onClick={onCreatePlan} aria-label="Create new plan">
                        <Plus size={14} /> Create
                    </button>
                    <button
                        className="secondary"
                        onClick={onResetPlan}
                        disabled={presetPlans.some(p => p.id === activePlanId)}
                        aria-label="Reset all meals in active plan"
                    >
                        Reset meals
                    </button>
                </div>

                <div className="plan-toggle" role="tablist" aria-label="Plan type selector">
                    <button
                        className={`toggle-btn ${planView === "preset" ? "active" : ""}`}
                        onClick={() => setPlanView("preset")}
                        role="tab"
                        aria-selected={planView === "preset"}
                    >
                        ⭐ Pre-saved
                    </button>
                    <button
                        className={`toggle-btn ${planView === "user" ? "active" : ""}`}
                        onClick={() => setPlanView("user")}
                        role="tab"
                        aria-selected={planView === "user"}
                    >
                        👤 My Plans
                    </button>
                </div>

                {planView === "preset" && (
                    <>
                        <p className="small-copy" style={{ marginBottom: "0.5rem", fontStyle: "italic", opacity: 0.8 }}>
                            Ready-made templates — click to preview, use &quot;Copy&quot; to make your own
                        </p>
                        <div className="saved-plans" role="list" aria-label="Preset plans">
                            {presetPlans.map((plan) => {
                                const summary = summaries.find((s) => s.plan.id === plan.id);
                                const active = plan.id === activePlanId;
                                return (
                                    <div key={plan.id} className={`plan-row-wrapper ${active ? "active" : ""}`} role="listitem">
                                        <button
                                            className={`plan-row ${active ? "active" : ""}`}
                                            onClick={() => setActivePlanId(plan.id)}
                                            aria-label={`Select plan: ${plan.name}, score ${summary?.dayScore?.score || 0}`}
                                        >
                                            <span>{plan.name}</span>
                                            <strong>{summary?.dayScore?.score || 0}</strong>
                                        </button>
                                        <button
                                            className="copy-btn"
                                            title="Copy as my plan"
                                            onClick={() => onDuplicatePreset(plan)}
                                            aria-label={`Copy ${plan.name} as your plan`}
                                        >
                                            <Copy size={12} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {planView === "user" && (
                    <>
                        <p className="small-copy" style={{ marginBottom: "0.5rem", opacity: 0.8 }}>
                            Your custom plans — fully editable
                        </p>
                        <div className="saved-plans" role="list" aria-label="User plans">
                            {userPlans.length === 0 && (
                                <p className="small-copy" style={{ textAlign: "center", padding: "1rem 0" }}>
                                    No plans yet. Click &quot;Create&quot; or copy a pre-saved template.
                                </p>
                            )}
                            {userPlans.map((plan) => {
                                const summary = summaries.find((s) => s.plan.id === plan.id);
                                const active = plan.id === activePlanId;
                                return (
                                    <div key={plan.id} className={`plan-row-wrapper ${active ? "active" : ""}`} role="listitem">
                                        <button
                                            className={`plan-row ${active ? "active" : ""}`}
                                            onClick={() => setActivePlanId(plan.id)}
                                            aria-label={`Select plan: ${plan.name}, score ${summary?.dayScore?.score || 0}`}
                                        >
                                            <span>{plan.name}</span>
                                            <strong>{summary?.dayScore?.score || 0}</strong>
                                        </button>
                                        <button
                                            className="delete-btn"
                                            title="Delete plan"
                                            onClick={() => onDeletePlan(plan.id)}
                                            aria-label={`Delete plan: ${plan.name}`}
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                );
                            })}
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

            <Section title="My health goals" icon={<Activity size={16} />}>
                {userGoalNames.length > 0 ? (
                    <div className="goals-tags" role="list" aria-label="Health goals">
                        {userGoalNames.map((name) => (
                            <span key={name} className="goal-tag" role="listitem">{name}</span>
                        ))}
                    </div>
                ) : (
                    <p className="small-copy">
                        No goals selected. Go to Profile to set your health goals.
                    </p>
                )}
            </Section>
        </aside>
    );
}

export default PlanSidebar;

