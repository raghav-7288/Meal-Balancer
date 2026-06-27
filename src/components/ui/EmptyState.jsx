import { memo } from "react";
import { Link } from "react-router-dom";

/**
 * Illustrated empty state component.
 * Shows when a page or section has no data yet.
 */
function EmptyState({ icon, title, description, actionLabel, actionTo, onAction }) {
    return (
        <div className="empty-state" role="status" aria-label={title}>
            {icon && (
                <div className="empty-state-icon" aria-hidden="true">
                    {icon}
                </div>
            )}
            <h2 className="empty-state-title">{title}</h2>
            {description && <p className="empty-state-desc">{description}</p>}
            {actionLabel && actionTo && (
                <Link to={actionTo} className="empty-state-cta">
                    {actionLabel}
                </Link>
            )}
            {actionLabel && onAction && !actionTo && (
                <button type="button" className="empty-state-cta" onClick={onAction}>
                    {actionLabel}
                </button>
            )}
        </div>
    );
}

export default memo(EmptyState);
