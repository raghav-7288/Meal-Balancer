import { useEffect, useId, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { getMealTimeRange, formatMealTimeRange } from "../../utils/mealTime";
import "./MealTimeRange.css";

/**
 * Editable meal-time *range* control (start–end) presented as a compact chip
 * that opens a small popover for editing — mirroring the copy-to-days popover.
 *
 * The chip shows the friendly range label (e.g. "8–10 AM"); the popover holds
 * labeled `Start` / `End` native time fields plus a `Done` button. Falls back
 * to a sensible per-slot default when unset. In `readOnly` mode it renders the
 * friendly range label only.
 *
 * Emits the full `{ start, end }` range via `onChange` on every edit.
 */
function MealTimeRange({ slot, mealTimes, onChange, readOnly = false, ariaLabel }) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);
    const dialogId = useId();

    const range = getMealTimeRange(mealTimes, slot) || { start: "", end: "" };
    const label = ariaLabel || `Meal time for ${slot}`;
    const displayText = formatMealTimeRange(range);

    // Close on outside-click / Escape while open
    useEffect(() => {
        if (!open) return;
        const onPointerDown = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        const onKeyDown = (e) => {
            if (e.key === "Escape") {
                e.stopPropagation();
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [open]);

    if (readOnly) {
        return displayText ? <span className="meal-time-display">{displayText}</span> : null;
    }

    const emit = (patch) =>
        onChange?.({ start: range.start || "", end: range.end || "", ...patch });

    return (
        <span
            className="meal-time"
            ref={containerRef}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
        >
            <button
                type="button"
                className="meal-time-trigger"
                onClick={() => setOpen((prev) => !prev)}
                aria-haspopup="dialog"
                aria-expanded={open}
                aria-controls={open ? dialogId : undefined}
                aria-label={label}
                title="Edit meal time"
            >
                <Clock size={13} aria-hidden="true" />
                <span
                    className={`meal-time-trigger__label ${displayText ? "" : "meal-time-trigger__label--empty"}`}
                >
                    {displayText || "Set time"}
                </span>
            </button>

            {open && (
                <div
                    className="meal-time-popover"
                    id={dialogId}
                    role="dialog"
                    aria-label={label}
                >
                    <p className="meal-time-popover__title">{slot} time</p>

                    <label className="meal-time-field">
                        <span className="meal-time-field__label">Start</span>
                        <input
                            type="time"
                            className="meal-time-input"
                            value={range.start || ""}
                            onChange={(e) => emit({ start: e.target.value })}
                            aria-label={`${label} start`}
                        />
                    </label>

                    <label className="meal-time-field">
                        <span className="meal-time-field__label">End</span>
                        <input
                            type="time"
                            className="meal-time-input"
                            value={range.end || ""}
                            onChange={(e) => emit({ end: e.target.value })}
                            aria-label={`${label} end`}
                        />
                    </label>

                    <div className="meal-time-popover__actions">
                        <button
                            type="button"
                            className="btn--sm btn--primary"
                            onClick={() => setOpen(false)}
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </span>
    );
}

export default MealTimeRange;

