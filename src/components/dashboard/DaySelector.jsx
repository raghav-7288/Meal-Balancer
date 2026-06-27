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
    return (
        <div className="day-selector-row">
            <div className="day-chips" role="tablist" aria-label="Select day to view">
                {DAYS.map((d) => (
                    <button
                        key={d}
                        className={`day-chip ${viewDay === d ? "active" : ""}`}
                        onClick={() => setViewDay(d)}
                        role="tab"
                        aria-selected={viewDay === d}
                    >
                        {d.slice(0, 3)}
                    </button>
                ))}
            </div>
            <div className="planner-nav-actions">
                {isAuthenticated && (
                    <span className={`sync-badge sync-badge--${syncStatus}`} title={
                        syncStatus === "syncing" ? "Syncing plans…" :
                        syncStatus === "synced" ? "Plans synced to cloud" :
                        syncStatus === "error" ? `Sync failed — ${syncError ?? "using local data"}` :
                        "Plans stored locally"
                    }>
                        {syncStatus === "syncing" && <><Loader size={12} className="spin" /> Syncing</>}
                        {syncStatus === "synced" && <><Cloud size={12} /> Synced</>}
                        {syncStatus === "error" && (
                            <button className="sync-retry-btn" onClick={retrySync} style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px", color: "inherit", fontSize: "inherit", padding: 0 }}>
                                <CloudOff size={12} /> Retry
                            </button>
                        )}
                    </span>
                )}
                {isAuthenticated && (
                    <Link to="/preset-admin" className="planner-nav-link" title="Manage preset plans">
                        <Settings size={14} /> Manage Presets
                    </Link>
                )}
                <button className="log-today-btn" onClick={logToday}>
                    📊 Log today
                </button>
                <Link to="/weekly-planner" className="planner-nav-link">
                    <Calendar size={14} /> Weekly view
                </Link>
            </div>
        </div>
    );
}

export default DaySelector;

