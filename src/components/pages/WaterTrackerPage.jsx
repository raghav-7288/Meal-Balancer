import { useState, useCallback } from "react";
import { Droplets, Plus, Minus, RotateCcw, Target } from "lucide-react";
import { useLocalStorageState } from "../../hooks/useLocalStorage";

const DEFAULT_TARGET = 8;

function getTodayKey() {
    return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function WaterTrackerPage() {
    const [waterData, setWaterData] = useLocalStorageState("meal-balancer-water", {});
    const [target, setTarget] = useLocalStorageState("meal-balancer-water-target", DEFAULT_TARGET);
    const [editingTarget, setEditingTarget] = useState(false);
    const [targetInput, setTargetInput] = useState(String(target));

    const todayKey = getTodayKey();
    const glasses = waterData[todayKey] || 0;

    const setGlasses = useCallback(
        (count) => {
            setWaterData((prev) => ({
                ...prev,
                [todayKey]: Math.max(0, count),
            }));
        },
        [todayKey, setWaterData]
    );

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
            const key = d.toISOString().slice(0, 10);
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
        }
        setEditingTarget(false);
    }

    // Generate glass icons
    const glassIcons = [];
    for (let i = 0; i < Math.max(target, glasses); i++) {
        glassIcons.push(
            <button
                key={i}
                className={`water-glass-icon ${i < glasses ? "filled" : ""}`}
                onClick={() => setGlasses(i < glasses ? i : i + 1)}
                aria-label={`Glass ${i + 1}`}
                title={i < glasses ? `Remove glass ${i + 1}` : `Add glass ${i + 1}`}
            >
                <Droplets size={24} />
            </button>
        );
    }

    return (
        <div className="water-tracker-tool">
            <div className="water-tracker-header">
                <div className="water-tracker-icon-wrap">
                    <Droplets size={32} />
                </div>
                <h2>Water Intake Tracker</h2>
                <p className="water-tracker-subtitle">
                    Stay hydrated! Track your daily water intake.
                </p>
            </div>

            {/* Progress ring */}
            <div className="water-progress-section">
                <div className={`water-progress-ring ${isComplete ? "complete" : ""}`}>
                    <svg viewBox="0 0 120 120" className="water-ring-svg">
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
                    <div className="water-ring-content">
                        <span className="water-ring-count">{glasses}</span>
                        <span className="water-ring-label">of {target}</span>
                    </div>
                </div>

                <div className="water-stats-row">
                    <div className="water-stat">
                        <span className="water-stat-value">{(glasses * 250)} ml</span>
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
                    className="water-ctrl-btn minus"
                    onClick={() => setGlasses(glasses - 1)}
                    disabled={glasses <= 0}
                    aria-label="Remove a glass"
                >
                    <Minus size={20} />
                </button>
                <button
                    className="water-ctrl-btn add"
                    onClick={() => setGlasses(glasses + 1)}
                    aria-label="Add a glass"
                >
                    <Plus size={20} />
                    <span>Add Glass</span>
                </button>
                <button
                    className="water-ctrl-btn reset"
                    onClick={() => setGlasses(0)}
                    disabled={glasses <= 0}
                    aria-label="Reset"
                >
                    <RotateCcw size={20} />
                </button>
            </div>

            {/* Glass grid */}
            <div className="water-glass-grid">{glassIcons}</div>

            {/* Target setting */}
            <div className="water-target-section">
                <Target size={16} />
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
                        />
                        <button onClick={handleSaveTarget}>Save</button>
                        <button className="secondary" onClick={() => setEditingTarget(false)}>Cancel</button>
                    </div>
                ) : (
                    <span>
                        Daily target: <strong>{target} glasses</strong> ({target * 250} ml)
                        <button className="water-edit-target-btn" onClick={() => { setTargetInput(String(target)); setEditingTarget(true); }}>
                            Edit
                        </button>
                    </span>
                )}
            </div>

            {isComplete && (
                <div className="water-complete-banner">
                    🎉 Great job! You've reached your daily water intake goal!
                </div>
            )}
        </div>
    );
}

export default WaterTrackerPage;


