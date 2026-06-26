
function CopyPlanModal({ copyModal, setCopyModal, copyPlanName, setCopyPlanName, confirmCopyPlan, copyModalRef }) {
    if (!copyModal) return null;

    return (
        <div className="modal-overlay" onClick={() => setCopyModal(null)} role="dialog" aria-modal="true" aria-label="Copy plan">
            <div className="modal-content" onClick={(e) => e.stopPropagation()} ref={copyModalRef}>
                <h3>Save plan as:</h3>
                <input
                    type="text"
                    className="modal-input"
                    value={copyPlanName}
                    onChange={(e) => setCopyPlanName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && confirmCopyPlan()}
                    autoFocus
                    placeholder="Enter plan name"
                />
                <div className="modal-actions">
                    <button onClick={confirmCopyPlan}>Save</button>
                    <button className="secondary" onClick={() => setCopyModal(null)}>Cancel</button>
                </div>
            </div>
        </div>
    );
}

export default CopyPlanModal;

