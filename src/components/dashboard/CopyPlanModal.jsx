import { useEffect, useCallback } from "react";
import useFocusTrap from "../../hooks/useFocusTrap";

function CopyPlanModal({
    copyModal,
    setCopyModal,
    copyPlanName,
    setCopyPlanName,
    confirmCopyPlan,
    copyModalRef,
}) {
    const focusTrapRef = useFocusTrap(!!copyModal);

    // Close on Escape key
    const handleKeyDown = useCallback(
        (e) => {
            if (e.key === "Escape") {
                setCopyModal(null);
            }
        },
        [setCopyModal]
    );

    useEffect(() => {
        if (!copyModal) return;
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [copyModal, handleKeyDown]);

    if (!copyModal) return null;

    return (
        <div
            className="modal-overlay"
            onClick={() => setCopyModal(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="copy-plan-title"
        >
            <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
                ref={(node) => {
                    // Merge refs
                    if (copyModalRef) copyModalRef.current = node;
                    if (focusTrapRef) focusTrapRef.current = node;
                }}
            >
                <h3 id="copy-plan-title">Save plan as:</h3>
                <input
                    type="text"
                    className="modal-input"
                    value={copyPlanName}
                    onChange={(e) => setCopyPlanName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && copyPlanName.trim() && confirmCopyPlan()}
                    autoFocus
                    placeholder="Enter plan name"
                    aria-label="Plan name"
                    aria-required="true"
                />
                <div className="modal-actions">
                    <button type="button" onClick={confirmCopyPlan} disabled={!copyPlanName.trim()}>
                        Save
                    </button>
                    <button type="button" className="secondary" onClick={() => setCopyModal(null)}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CopyPlanModal;
