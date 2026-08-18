import { useEffect, useId, useRef, useState } from "react";
import { CopyPlus } from "lucide-react";
import { DAYS } from "../../data/presetPlans";
import "./CopyToDaysMenu.css";

/**
 * Per-item "Copy to days" control: an icon button that opens a small popover to
 * pick target days (with an "All other days" shortcut), then emits the selected
 * day names via `onCopy`.
 *
 * The source day is shown disabled (you can't copy an item onto its own day).
 * Closes on outside-click, Escape, Cancel, or after a successful Copy.
 *
 * @param {object} props
 * @param {string} props.sourceDay - the day the item currently belongs to
 * @param {(days: string[]) => void} props.onCopy - called with chosen target days
 * @param {string} [props.itemLabel] - item name, used in the dialog title/aria
 * @param {string[]} [props.days] - day list (defaults to DAYS)
 * @param {boolean} [props.disabled]
 */
function CopyToDaysMenu({ sourceDay, onCopy, itemLabel = "", days = DAYS, disabled = false }) {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState([]);
    const containerRef = useRef(null);
    const dialogId = useId();

    const otherDays = days.filter((d) => d !== sourceDay);
    const allSelected = otherDays.length > 0 && selected.length === otherDays.length;

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

    const toggleOpen = () => {
        setOpen((prev) => {
            const next = !prev;
            if (next) setSelected([]); // reset each time it opens
            return next;
        });
    };

    const toggleDay = (day) => {
        setSelected((prev) =>
            prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
        );
    };

    const toggleAll = () => {
        setSelected(allSelected ? [] : [...otherDays]);
    };

    const handleCopy = () => {
        if (selected.length === 0) return;
        onCopy?.(selected);
        setOpen(false);
        setSelected([]);
    };

    const title = itemLabel ? `Copy “${itemLabel}” to…` : "Copy to days…";

    return (
        <span
            className="copy-days"
            ref={containerRef}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
        >
            <button
                type="button"
                className="icon-btn"
                onClick={toggleOpen}
                disabled={disabled}
                aria-haspopup="dialog"
                aria-expanded={open}
                aria-controls={open ? dialogId : undefined}
                aria-label={itemLabel ? `Copy ${itemLabel} to other days` : "Copy to other days"}
                title="Copy to other days"
            >
                <CopyPlus size={14} />
            </button>

            {open && (
                <div className="copy-days__popover" id={dialogId} role="dialog" aria-label={title}>
                    <p className="copy-days__title">{title}</p>

                    <label className="copy-days__row copy-days__row--all">
                        <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={toggleAll}
                            aria-label="All other days"
                        />
                        <span>All other days</span>
                    </label>

                    <div className="copy-days__divider" aria-hidden="true" />

                    <div className="copy-days__list">
                        {days.map((day) => {
                            const isSource = day === sourceDay;
                            return (
                                <label
                                    key={day}
                                    className={`copy-days__row ${isSource ? "copy-days__row--source" : ""}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSource ? false : selected.includes(day)}
                                        onChange={() => toggleDay(day)}
                                        disabled={isSource}
                                        aria-label={isSource ? `${day} (current day)` : day}
                                    />
                                    <span>
                                        {day}
                                        {isSource && (
                                            <span className="copy-days__hint"> (this day)</span>
                                        )}
                                    </span>
                                </label>
                            );
                        })}
                    </div>

                    <div className="copy-days__actions">
                        <button
                            type="button"
                            className="btn--sm copy-days__cancel"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="btn--sm btn--primary"
                            onClick={handleCopy}
                            disabled={selected.length === 0}
                            aria-label="Copy to selected days"
                        >
                            Copy{selected.length > 0 ? ` (${selected.length})` : ""}
                        </button>
                    </div>
                </div>
            )}
        </span>
    );
}

export default CopyToDaysMenu;

