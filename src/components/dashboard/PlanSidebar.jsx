import { memo, useState } from "react";
import { Activity, Copy, Database, Leaf, Plus, Sparkles, Trash2 } from "lucide-react";
import Section from "../ui/Section";
import MacroChart from "./MacroChart";

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
    dayTotals,
}) {
    const [showCreateModal, setShowCreateModal] = useState(false);

    const handleCreatePlan = () => {
        onCreatePlan();
        setShowCreateModal(false);
    };

    return (
        <aside className="sidebar" role="complementary" aria-label="Plan controls sidebar">
            <Section title="Plan controls" icon={<Sparkles size={16} />}>
                <div className="button-row">
                    <button
                        type="button"
                        onClick={() => {
                            setNewPlanName(`My Plan ${userPlans.length + 1}`);
                            setShowCreateModal(true);
                        }}
                        aria-label="Create new plan"
                    >
                        <Plus size={14} aria-hidden="true" /> Create New
                    </button>
                    <button
                        type="button"
                        className="secondary"
                        onClick={onResetPlan}
                        disabled={presetPlans.some((p) => p.id === activePlanId)}
                        aria-label="Reset all meals in active plan"
                    >
                        Reset meals
                    </button>
                </div>

                {showCreateModal && (
                    <div
                        className="modal-overlay"
                        onClick={() => setShowCreateModal(false)}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Create new plan"
                    >
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h3>Create new plan:</h3>
                            <input
                                type="text"
                                className="modal-input"
                                value={newPlanName}
                                onChange={(e) => setNewPlanName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleCreatePlan()}
                                autoFocus
                                placeholder="Enter plan name"
                            />
                            <div className="modal-actions">
                                <button onClick={handleCreatePlan} disabled={!newPlanName.trim()}>
                                    Create
                                </button>
                                <button
                                    className="secondary"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setNewPlanName("");
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="plan-toggle" role="tablist" aria-label="Plan type selector">
                    <button
                        type="button"
                        className={`toggle-btn ${planView === "preset" ? "active" : ""}`}
                        onClick={() => setPlanView("preset")}
                        role="tab"
                        aria-selected={planView === "preset"}
                        tabIndex={planView === "preset" ? 0 : -1}
                    >
                        ⭐ Pre-saved
                    </button>
                    <button
                        type="button"
                        className={`toggle-btn ${planView === "user" ? "active" : ""}`}
                        onClick={() => setPlanView("user")}
                        role="tab"
                        aria-selected={planView === "user"}
                        tabIndex={planView === "user" ? 0 : -1}
                    >
                        👤 My Plans
                    </button>
                </div>

                {planView === "preset" && (
                    <>
                        <p
                            className="small-copy"
                            style={{ marginBottom: "0.5rem", fontStyle: "italic", opacity: 0.8 }}
                        >
                            Ready-made templates — click to preview, use &quot;Copy&quot; to make
                            your own
                        </p>
                        <div className="saved-plans" role="list" aria-label="Preset plans">
                            {presetPlans.map((plan) => {
                                const summary = summaries.find((s) => s.plan.id === plan.id);
                                const active = plan.id === activePlanId;
                                return (
                                    <div
                                        key={plan.id}
                                        className={`plan-row-wrapper ${active ? "active" : ""}`}
                                        role="listitem"
                                    >
                                        <button
                                            type="button"
                                            className={`plan-row ${active ? "active" : ""}`}
                                            onClick={() => setActivePlanId(plan.id)}
                                            aria-label={`Select plan: ${plan.name}, score ${summary?.dayScore?.score ?? 0}`}
                                            aria-current={active ? "true" : undefined}
                                        >
                                            <span>{plan.name}</span>
                                            <strong>{summary?.dayScore?.score ?? 0}</strong>
                                        </button>
                                        <button
                                            type="button"
                                            className="copy-btn"
                                            title="Copy as my plan"
                                            onClick={() => onDuplicatePreset(plan)}
                                            aria-label={`Copy ${plan.name} as your plan`}
                                        >
                                            <Copy size={12} aria-hidden="true" />
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
                                <p
                                    className="small-copy"
                                    style={{ textAlign: "center", padding: "1rem 0" }}
                                >
                                    No plans yet. Click &quot;Create&quot; or copy a pre-saved
                                    template.
                                </p>
                            )}
                            {userPlans.map((plan) => {
                                const summary = summaries.find((s) => s.plan.id === plan.id);
                                const active = plan.id === activePlanId;
                                return (
                                    <div
                                        key={plan.id}
                                        className={`plan-row-wrapper ${active ? "active" : ""}`}
                                        role="listitem"
                                    >
                                        <button
                                            type="button"
                                            className={`plan-row ${active ? "active" : ""}`}
                                            onClick={() => setActivePlanId(plan.id)}
                                            aria-label={`Select plan: ${plan.name}, score ${summary?.dayScore?.score ?? 0}`}
                                            aria-current={active ? "true" : undefined}
                                        >
                                            <span>{plan.name}</span>
                                            <strong>{summary?.dayScore?.score ?? 0}</strong>
                                        </button>
                                        <div className="plan-action-btns">
                                            <button
                                                type="button"
                                                className="delete-btn tooltip-btn"
                                                data-tooltip="Delete Plan"
                                                onClick={() => onDeletePlan(plan.id)}
                                                aria-label={`Delete plan: ${plan.name}`}
                                            >
                                                <Trash2 size={18} aria-hidden="true" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </Section>

            <Section title="Macronutrient distribution" icon={<Database size={16} />}>
                <MacroChart dayTotals={dayTotals} />
            </Section>

            <Section title="Visible fat reference" icon={<Leaf size={16} />}>
                <p className="small-copy">Current editable benchmark for this profile:</p>
                <div className="fat-box">
                    <strong>{visibleFatLimit} g/day</strong>
                    <span>
                        {profile.sex} · {profile.activity}
                    </span>
                </div>
            </Section>

            <Section title="My health goals" icon={<Activity size={16} />}>
                {userGoalNames.length > 0 ? (
                    <div className="goals-tags" role="list" aria-label="Health goals">
                        {userGoalNames.map((name) => (
                            <span key={name} className="goal-tag" role="listitem">
                                {name}
                            </span>
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

export default memo(PlanSidebar);
