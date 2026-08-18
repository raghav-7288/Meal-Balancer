import { useState, useEffect, useRef } from "react";
import { Droplets, Plus, Minus, RotateCcw, Target } from "lucide-react";
import { useLocalStorageState } from "../../hooks/useLocalStorage";
import { useOptionalAuth } from "../../hooks/useAuth";
import {
    fetchDailyHealthData,
    upsertDailyHealth,
    dbRowsToWaterData,
} from "../../services/dailyHealthService";
import { getLocalDateKey } from "../../utils/dateKey";

const DEFAULT_TARGET = 8;

function getTodayKey() {
    return getLocalDateKey(); // local "YYYY-MM-DD"
}

function WaterTrackerPage() {
    const [waterData, setWaterData] = useLocalStorageState("diet-specifix-water", {});
    const [target, setTarget] = useLocalStorageState("diet-specifix-water-target", DEFAULT_TARGET);
    const [editingTarget, setEditingTarget] = useState(false);
    const [targetInput, setTargetInput] = useState(String(target));
    const [syncStatus, setSyncStatus] = useState("idle");
    const isMounted = useRef(true);
    const syncTimeoutRef = useRef(null);

    const { user, isAuthenticated } = useOptionalAuth();

    const authRef = useRef({ isAuthenticated, userId: user?.id });
    useEffect(() => {
        authRef.current = { isAuthenticated, userId: user?.id };
    }, [isAuthenticated, user?.id]);

    useEffect(() => {
        return () => {
            isMounted.current = false;
            if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        };
    }, []);

    // Keep target in a ref so the load effect doesn't re-trigger on target change
    const targetRef = useRef(target);
    useEffect(() => {
        targetRef.current = target;
    }, [target]);

    // Load water data from Supabase on login
    useEffect(() => {
        if (!isAuthenticated || !user?.id) return;

        async function loadFromDb() {
            try {
                setSyncStatus("syncing");
                const remoteRows = await fetchDailyHealthData(user.id);
                const remoteData = dbRowsToWaterData(remoteRows);

                if (isMounted.current) {
                    // Merge: remote is source of truth, add local-only dates
                    setWaterData((prev) => {
                        const merged = { ...prev, ...remoteData };
                        // Upload any local-only entries
                        for (const [date, glasses] of Object.entries(prev)) {
                            if (!(date in remoteData) && glasses > 0) {
                                upsertDailyHealth(user.id, date, {
                                    water_glasses: glasses,
                                    water_target: targetRef.current,
                                }).catch((err) =>
                                    console.error("Failed to upload local water entry:", err)
                                );
                            }
                        }
                        return merged;
                    });

                    // Load target from the most recent remote entry (if available)
                    if (remoteRows.length > 0 && remoteRows[0].water_target) {
                        setTarget(remoteRows[0].water_target);
                    }

                    setSyncStatus("synced");
                }
            } catch (err) {
                console.error("Failed to load water data from Supabase:", err);
                if (isMounted.current) setSyncStatus("error");
            }
        }

        loadFromDb();
    }, [isAuthenticated, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const todayKey = getTodayKey();
    const glasses = waterData[todayKey] || 0;

    // Debounced sync to Supabase
    function syncToDb(date, glassCount, dailyTarget) {
        const { isAuthenticated: authed, userId } = authRef.current;
        if (!authed || !userId) return;

        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = setTimeout(() => {
            upsertDailyHealth(userId, date, {
                water_glasses: glassCount,
                water_target: dailyTarget,
            }).catch((err) => {
                console.error("Failed to sync water intake:", err);
                if (isMounted.current) setSyncStatus("error");
            });
        }, 500);
    }

    function setGlasses(count) {
        const newCount = Math.max(0, count);
        setWaterData((prev) => ({
            ...prev,
            [todayKey]: newCount,
        }));
        syncToDb(todayKey, newCount, target);
    }

    const percentage = Math.min((glasses / target) * 100, 100);
    const isComplete = glasses >= target;

    // Get streak (consecutive days meeting target)
    const getStreak = () => {
        let streak = 0;
        const today = new Date();
        // Start from yesterday (today might not be done yet)
        for (let i = isComplete ? 0 : 1; i < 365; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const key = getLocalDateKey(d);
            if ((waterData[key] || 0) >= target) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    };

    const streak = getStreak();

    function handleSaveTarget() {
        const val = parseInt(targetInput, 10);
        if (val >= 1 && val <= 20) {
            setTarget(val);
            // Sync target change to Supabase
            syncToDb(todayKey, glasses, val);
        }
        setEditingTarget(false);
    }

    // Generate glass icons
    const glassIcons = [];
    for (let i = 0; i < Math.max(target, glasses); i++) {
        glassIcons.push(
            <button
                key={i}
                type="button"
                className={`water-glass-icon ${i < glasses ? "filled" : ""}`}
                onClick={() => setGlasses(i < glasses ? i : i + 1)}
                aria-label={
                    i < glasses ? `Remove glass ${i + 1} (filled)` : `Add glass ${i + 1} (empty)`
                }
                aria-pressed={i < glasses}
            >
                <Droplets size={24} aria-hidden="true" />
            </button>
        );
    }

    return (
        <div className="water-tracker-tool">
            <div className="water-tracker-header">
                <div className="water-tracker-icon-wrap" aria-hidden="true">
                    <Droplets size={32} />
                </div>
                <h2>Water Intake Tracker</h2>
                <p className="water-tracker-subtitle">
                    Stay hydrated! Track your daily water intake.
                    {syncStatus === "error" && (
                        <span
                            style={{
                                color: "var(--color-error, #ef4444)",
                                fontSize: "12px",
                                marginLeft: "8px",
                            }}
                            role="alert"
                        >
                            ⚠ Sync failed
                        </span>
                    )}
                </p>
            </div>

            {/* Progress ring */}
            <div className="water-progress-section" aria-live="polite">
                <div className={`water-progress-ring ${isComplete ? "complete" : ""}`}>
                    <svg
                        viewBox="0 0 120 120"
                        className="water-ring-svg"
                        role="img"
                        aria-label={`Water intake: ${glasses} of ${target} glasses, ${Math.round(percentage)}% complete`}
                    >
                        <circle
                            cx="60"
                            cy="60"
                            r="52"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            className="water-ring-bg"
                        />
                        <circle
                            cx="60"
                            cy="60"
                            r="52"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            className="water-ring-fill"
                            strokeDasharray={`${2 * Math.PI * 52}`}
                            strokeDashoffset={`${2 * Math.PI * 52 * (1 - percentage / 100)}`}
                            strokeLinecap="round"
                            transform="rotate(-90 60 60)"
                        />
                    </svg>
                    <div className="water-ring-content" aria-hidden="true">
                        <span className="water-ring-count">{glasses}</span>
                        <span className="water-ring-label">of {target}</span>
                    </div>
                </div>

                <div className="water-stats-row">
                    <div className="water-stat">
                        <span className="water-stat-value">{glasses * 250} ml</span>
                        <span className="water-stat-label">Consumed</span>
                    </div>
                    <div className="water-stat">
                        <span className="water-stat-value">{Math.round(percentage)}%</span>
                        <span className="water-stat-label">Complete</span>
                    </div>
                    <div className="water-stat">
                        <span className="water-stat-value">{streak} 🔥</span>
                        <span className="water-stat-label">Day Streak</span>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="water-controls">
                <button
                    type="button"
                    className="water-ctrl-btn minus"
                    onClick={() => setGlasses(glasses - 1)}
                    disabled={glasses <= 0}
                    aria-label="Remove a glass"
                >
                    <Minus size={20} aria-hidden="true" />
                </button>
                <button
                    type="button"
                    className="water-ctrl-btn add"
                    onClick={() => setGlasses(glasses + 1)}
                    aria-label="Add a glass of water"
                >
                    <Plus size={20} aria-hidden="true" />
                    <span>Add Glass</span>
                </button>
                <button
                    type="button"
                    className="water-ctrl-btn reset"
                    onClick={() => setGlasses(0)}
                    disabled={glasses <= 0}
                    aria-label="Reset water intake to zero"
                >
                    <RotateCcw size={20} aria-hidden="true" />
                </button>
            </div>

            {/* Glass grid */}
            <div className="water-glass-grid">{glassIcons}</div>

            {/* Target setting */}
            <div className="water-target-section">
                <Target size={16} aria-hidden="true" />
                {editingTarget ? (
                    <div className="water-target-edit">
                        <input
                            type="number"
                            min="1"
                            max="20"
                            value={targetInput}
                            onChange={(e) => setTargetInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSaveTarget()}
                            autoFocus
                            aria-label="Daily water target in glasses"
                        />
                        <button type="button" onClick={handleSaveTarget}>
                            Save
                        </button>
                        <button
                            type="button"
                            className="secondary"
                            onClick={() => setEditingTarget(false)}
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <span>
                        Daily target: <strong>{target} glasses</strong> ({target * 250} ml)
                        <button
                            type="button"
                            className="water-edit-target-btn"
                            onClick={() => {
                                setTargetInput(String(target));
                                setEditingTarget(true);
                            }}
                        >
                            Edit
                        </button>
                    </span>
                )}
            </div>

            {isComplete && (
                <div className="water-complete-banner" role="status" aria-live="polite">
                    🎉 Great job! You've reached your daily water intake goal!
                </div>
            )}
        </div>
    );
}

export default WaterTrackerPage;
