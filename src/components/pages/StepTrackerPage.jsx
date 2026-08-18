import { useState, useEffect, useRef } from "react";
import { Footprints, Plus, RotateCcw, Target, TrendingUp } from "lucide-react";
import { useLocalStorageState } from "../../hooks/useLocalStorage";
import { useOptionalAuth } from "../../hooks/useAuth";
import {
    fetchDailyHealthData,
    upsertDailyHealth,
    dbRowsToStepData,
} from "../../services/dailyHealthService";
import { getLocalDateKey } from "../../utils/dateKey";

const DEFAULT_TARGET = 10000;
const QUICK_ADD_OPTIONS = [500, 1000, 2000, 5000];

function getTodayKey() {
    return getLocalDateKey();
}

function StepTrackerPage() {
    const [stepData, setStepData] = useLocalStorageState("diet-specifix-steps", {});
    const [target, setTarget] = useLocalStorageState("diet-specifix-steps-target", DEFAULT_TARGET);
    const [editingTarget, setEditingTarget] = useState(false);
    const [targetInput, setTargetInput] = useState(String(target));
    const [customInput, setCustomInput] = useState("");
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

    // Load step data from Supabase on login
    useEffect(() => {
        if (!isAuthenticated || !user?.id) return;

        async function loadFromDb() {
            try {
                setSyncStatus("syncing");
                const remoteRows = await fetchDailyHealthData(user.id);
                const remoteData = dbRowsToStepData(remoteRows);

                if (isMounted.current) {
                    setStepData((prev) => {
                        const merged = { ...prev, ...remoteData };
                        // Upload local-only entries
                        for (const [date, steps] of Object.entries(prev)) {
                            if (!(date in remoteData) && steps > 0) {
                                upsertDailyHealth(user.id, date, {
                                    steps,
                                    steps_target: targetRef.current,
                                }).catch((err) =>
                                    console.error("Failed to upload local step entry:", err)
                                );
                            }
                        }
                        return merged;
                    });

                    // Load target from the most recent entry
                    if (remoteRows.length > 0 && remoteRows[0].steps_target) {
                        setTarget(remoteRows[0].steps_target);
                    }

                    setSyncStatus("synced");
                }
            } catch (err) {
                console.error("Failed to load step data from Supabase:", err);
                if (isMounted.current) setSyncStatus("error");
            }
        }

        loadFromDb();
    }, [isAuthenticated, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const todayKey = getTodayKey();
    const steps = stepData[todayKey] || 0;

    // Debounced sync to Supabase
    function syncToDb(date, stepCount, dailyTarget) {
        const { isAuthenticated: authed, userId } = authRef.current;
        if (!authed || !userId) return;

        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = setTimeout(() => {
            upsertDailyHealth(userId, date, { steps: stepCount, steps_target: dailyTarget }).catch(
                (err) => {
                    console.error("Failed to sync steps:", err);
                    if (isMounted.current) setSyncStatus("error");
                }
            );
        }, 500);
    }

    function setSteps(count) {
        const newCount = Math.max(0, count);
        setStepData((prev) => ({
            ...prev,
            [todayKey]: newCount,
        }));
        syncToDb(todayKey, newCount, target);
    }

    const percentage = Math.min((steps / target) * 100, 100);
    const isComplete = steps >= target;

    // Calculate distance (avg stride ~0.75m)
    const distanceKm = ((steps * 0.75) / 1000).toFixed(2);

    // Estimate calories burned (avg ~0.04 cal per step)
    const caloriesBurned = Math.round(steps * 0.04);

    // Get streak (consecutive days meeting target)
    const getStreak = () => {
        let streak = 0;
        const today = new Date();
        for (let i = isComplete ? 0 : 1; i < 365; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const key = getLocalDateKey(d);
            if ((stepData[key] || 0) >= target) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    };

    // Get weekly average
    const getWeeklyAverage = () => {
        const today = new Date();
        let total = 0;
        let days = 0;
        for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const key = getLocalDateKey(d);
            if (stepData[key] !== undefined) {
                total += stepData[key];
                days++;
            }
        }
        return days > 0 ? Math.round(total / days) : 0;
    };

    const streak = getStreak();
    const weeklyAvg = getWeeklyAverage();

    function handleSaveTarget() {
        const val = parseInt(targetInput, 10);
        if (val >= 1000 && val <= 50000) {
            setTarget(val);
            syncToDb(todayKey, steps, val);
        }
        setEditingTarget(false);
    }

    function handleAddCustom() {
        const val = parseInt(customInput, 10);
        if (val > 0 && val <= 100000) {
            setSteps(steps + val);
            setCustomInput("");
        }
    }

    return (
        <div className="step-tracker-tool">
            <div className="step-tracker-header">
                <div className="step-tracker-icon-wrap">
                    <Footprints size={32} />
                </div>
                <h2>Step Tracker</h2>
                <p className="step-tracker-subtitle">
                    Keep moving! Track your daily steps and stay active.
                    {syncStatus === "error" && (
                        <span
                            style={{
                                color: "var(--color-error, #ef4444)",
                                fontSize: "12px",
                                marginLeft: "8px",
                            }}
                        >
                            ⚠ Sync failed
                        </span>
                    )}
                </p>
            </div>

            {/* Progress ring */}
            <div className="step-progress-section">
                <div className={`step-progress-ring ${isComplete ? "complete" : ""}`}>
                    <svg viewBox="0 0 120 120" className="step-ring-svg">
                        <circle
                            cx="60"
                            cy="60"
                            r="52"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            className="step-ring-bg"
                        />
                        <circle
                            cx="60"
                            cy="60"
                            r="52"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            className="step-ring-fill"
                            strokeDasharray={`${2 * Math.PI * 52}`}
                            strokeDashoffset={`${2 * Math.PI * 52 * (1 - percentage / 100)}`}
                            strokeLinecap="round"
                            transform="rotate(-90 60 60)"
                        />
                    </svg>
                    <div className="step-ring-content">
                        <span className="step-ring-count">{steps.toLocaleString()}</span>
                        <span className="step-ring-label">of {target.toLocaleString()}</span>
                    </div>
                </div>

                <div className="step-stats-row">
                    <div className="step-stat">
                        <span className="step-stat-value">{distanceKm} km</span>
                        <span className="step-stat-label">Distance</span>
                    </div>
                    <div className="step-stat">
                        <span className="step-stat-value">{caloriesBurned}</span>
                        <span className="step-stat-label">Calories</span>
                    </div>
                    <div className="step-stat">
                        <span className="step-stat-value">{streak} 🔥</span>
                        <span className="step-stat-label">Day Streak</span>
                    </div>
                    <div className="step-stat">
                        <span className="step-stat-value">{weeklyAvg.toLocaleString()}</span>
                        <span className="step-stat-label">7-Day Avg</span>
                    </div>
                </div>
            </div>

            {/* Quick add buttons */}
            <div className="step-quick-add">
                <span className="step-quick-add-label">Quick Add:</span>
                <div className="step-quick-add-buttons">
                    {QUICK_ADD_OPTIONS.map((amount) => (
                        <button
                            key={amount}
                            className="step-quick-btn"
                            onClick={() => setSteps(steps + amount)}
                        >
                            <Plus size={14} />
                            {amount.toLocaleString()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Custom input */}
            <div className="step-custom-input">
                <input
                    type="number"
                    min="1"
                    max="100000"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddCustom()}
                    placeholder="Enter steps..."
                />
                <button className="step-add-btn" onClick={handleAddCustom} disabled={!customInput}>
                    <Plus size={16} />
                    Add Steps
                </button>
                <button
                    className="step-reset-btn"
                    onClick={() => setSteps(0)}
                    disabled={steps <= 0}
                    aria-label="Reset"
                >
                    <RotateCcw size={16} />
                </button>
            </div>

            {/* Progress bar */}
            <div className="step-progress-bar-section">
                <div className="step-progress-bar-track">
                    <div className="step-progress-bar-fill" style={{ width: `${percentage}%` }} />
                </div>
                <span className="step-progress-bar-text">
                    {Math.round(percentage)}% of daily goal
                </span>
            </div>

            {/* Target setting */}
            <div className="step-target-section">
                <Target size={16} />
                {editingTarget ? (
                    <div className="step-target-edit">
                        <input
                            type="number"
                            min="1000"
                            max="50000"
                            step="500"
                            value={targetInput}
                            onChange={(e) => setTargetInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSaveTarget()}
                            autoFocus
                        />
                        <button onClick={handleSaveTarget}>Save</button>
                        <button className="secondary" onClick={() => setEditingTarget(false)}>
                            Cancel
                        </button>
                    </div>
                ) : (
                    <span>
                        Daily target: <strong>{target.toLocaleString()} steps</strong>
                        <button
                            className="step-edit-target-btn"
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

            {/* Weekly overview */}
            <div className="step-weekly-overview">
                <div className="step-weekly-header">
                    <TrendingUp size={16} />
                    <span>Last 7 Days</span>
                </div>
                <div className="step-weekly-bars">
                    {Array.from({ length: 7 }).map((_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() - (6 - i));
                        const key = getLocalDateKey(d);
                        const daySteps = stepData[key] || 0;
                        const dayPercent = Math.min((daySteps / target) * 100, 100);
                        const dayLabel = d.toLocaleDateString("en", { weekday: "short" });
                        const isToday = key === todayKey;
                        return (
                            <div
                                key={key}
                                className={`step-weekly-bar-col ${isToday ? "today" : ""}`}
                            >
                                <div className="step-weekly-bar-track">
                                    <div
                                        className={`step-weekly-bar-fill ${daySteps >= target ? "met" : ""}`}
                                        style={{ height: `${dayPercent}%` }}
                                    />
                                </div>
                                <span className="step-weekly-bar-label">{dayLabel}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {isComplete && (
                <div className="step-complete-banner">
                    🎉 Awesome! You've reached your daily step goal!
                </div>
            )}
        </div>
    );
}

export default StepTrackerPage;
