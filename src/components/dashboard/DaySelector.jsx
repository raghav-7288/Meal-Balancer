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
                {isAuthenticated && syncStatus === "syncing" && (
                    <span
                        className="sync-badge sync-badge--syncing"
                        role="status"
                        aria-live="polite"
                        aria-label="Syncing plans"
                    >
                        <Loader size={12} className="spin" aria-hidden="true" /> Syncing
                    </span>
                )}
                {isAuthenticated && syncStatus !== "syncing" && (
                    <button
                        type="button"
                        className={`sync-badge sync-badge--${syncStatus}`}
                        role="status"
                        aria-live="polite"
                        aria-label={
                            syncStatus === "synced"
                                ? "Plans synced to cloud — click to re-sync"
                                : syncStatus === "error"
                                  ? `Sync failed — ${syncError ?? "using local data"}. Click to retry`
                                  : "Plans stored locally — click to sync"
                        }
                        onClick={retrySync}
                        style={{
                            cursor: "pointer",
                            border: "1px solid",
                            borderColor: "inherit",
                        }}
                    >
                        {syncStatus === "synced" && (
                            <>
                                <Cloud size={12} aria-hidden="true" /> Synced
                            </>
                        )}
                        {syncStatus === "error" && (
                            <>
                                <CloudOff size={12} aria-hidden="true" /> Retry
                            </>
                        )}
                        {syncStatus !== "synced" && syncStatus !== "error" && (
                            <>
                                <Cloud size={12} aria-hidden="true" /> Sync
                            </>
                        )}
                    </button>
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
