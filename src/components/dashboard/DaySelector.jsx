import { memo, useCallback } from "react";
import { DAYS } from "../../data/presetPlans";
import { Link } from "react-router-dom";
import { Calendar, Cloud, CloudOff, Loader, Settings } from "lucide-react";

function DaySelector({
    viewDay,
    setViewDay,
    isAuthenticated,
    syncStatus,
    syncError,
    retrySync,
    logToday,
}) {
    const handleTabKeyDown = useCallback(
        (e, dayIndex) => {
            let newIndex;
            if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault();
                newIndex = (dayIndex + 1) % DAYS.length;
            } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault();
                newIndex = (dayIndex - 1 + DAYS.length) % DAYS.length;
            } else if (e.key === "Home") {
                e.preventDefault();
                newIndex = 0;
            } else if (e.key === "End") {
                e.preventDefault();
                newIndex = DAYS.length - 1;
            }
            if (newIndex !== undefined) {
                setViewDay(DAYS[newIndex]);
                // Focus the new tab
                const tabs = e.currentTarget.parentElement?.querySelectorAll('[role="tab"]');
                tabs?.[newIndex]?.focus();
            }
        },
        [setViewDay]
    );

    return (
        <div className="day-selector-row">
            <div className="day-chips" role="tablist" aria-label="Select day to view">
                {DAYS.map((d, i) => (
                    <button
                        key={d}
                        type="button"
                        className={`day-chip ${viewDay === d ? "active" : ""}`}
                        onClick={() => setViewDay(d)}
                        onKeyDown={(e) => handleTabKeyDown(e, i)}
                        role="tab"
                        aria-selected={viewDay === d}
                        tabIndex={viewDay === d ? 0 : -1}
                        id={`day-tab-${d}`}
                    >
                        {d.slice(0, 3)}
                    </button>
                ))}
            </div>
            <div className="planner-nav-actions">
                {isAuthenticated && (
                    <span
                        className={`sync-badge sync-badge--${syncStatus}`}
                        role="status"
                        aria-live="polite"
                        aria-label={
                            syncStatus === "syncing"
                                ? "Syncing plans"
                                : syncStatus === "synced"
                                  ? "Plans synced to cloud"
                                  : syncStatus === "error"
                                    ? `Sync failed — ${syncError ?? "using local data"}`
                                    : "Plans stored locally"
                        }
                    >
                        {syncStatus === "syncing" && (
                            <>
                                <Loader size={12} className="spin" aria-hidden="true" /> Syncing
                            </>
                        )}
                        {syncStatus === "synced" && (
                            <>
                                <Cloud size={12} aria-hidden="true" /> Synced
                            </>
                        )}
                        {syncStatus === "error" && (
                            <button
                                type="button"
                                className="sync-retry-btn"
                                onClick={retrySync}
                                aria-label="Retry syncing plans"
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    color: "inherit",
                                    fontSize: "inherit",
                                    padding: 0,
                                }}
                            >
                                <CloudOff size={12} aria-hidden="true" /> Retry
                            </button>
                        )}
                    </span>
                )}
                {isAuthenticated && (
                    <Link
                        to="/preset-admin"
                        className="planner-nav-link"
                        aria-label="Manage preset plans"
                    >
                        <Settings size={14} aria-hidden="true" /> Manage Presets
                    </Link>
                )}
                <button
                    type="button"
                    className="log-today-btn"
                    onClick={logToday}
                    aria-label="Log today's meals to progress"
                >
                    📊 Log today
                </button>
                <Link
                    to="/weekly-planner"
                    className="planner-nav-link"
                    aria-label="View weekly planner"
                >
                    <Calendar size={14} aria-hidden="true" /> Weekly view
                </Link>
            </div>
        </div>
    );
}

export default memo(DaySelector);
