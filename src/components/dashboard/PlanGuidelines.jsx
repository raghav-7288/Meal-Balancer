function PlanGuidelines({ guidelines, setGuidelines, saveGuidelines, isPresetActive }) {
    return (
        <div className="plan-guidelines-section">
            <h3 className="plan-guidelines-title">📋 Plan Guidelines</h3>
            <p className="plan-guidelines-hint">
                Add overall guidelines or notes for this plan. These will be visible on the Weekly Planner.
            </p>
            <textarea
                className="plan-guidelines-input"
                value={guidelines}
                onChange={(e) => setGuidelines(e.target.value)}
                placeholder="e.g. Drink 8 glasses of water daily, avoid fried foods, eat dinner before 8 PM..."
                disabled={isPresetActive}
                rows={4}
            />
            <div className="plan-guidelines-actions">
                {!isPresetActive && (
                    <button className="plan-guidelines-save-btn" onClick={saveGuidelines}>
                        💾 Save Guidelines
                    </button>
                )}
                {isPresetActive && (
                    <p className="plan-guidelines-readonly-note">Copy this plan to edit guidelines.</p>
                )}
            </div>
        </div>
    );
}

export default PlanGuidelines;

