import { useEffect, useCallback } from "react";

/**
 * Keyboard shortcuts hook.
 * @param {Object} shortcuts - Map of shortcut key combos to handler functions.
 *   Keys are strings like "ctrl+s", "ctrl+n", "escape", "ctrl+p".
 * @param {boolean} enabled - Whether shortcuts are active (default true).
 */
function useHotkeys(shortcuts, enabled = true) {
    const handler = useCallback(
        (e) => {
            if (!enabled) return;

            // Don't fire shortcuts when user is typing in an input/textarea/select
            const tag = e.target.tagName;
            const isEditable =
                tag === "INPUT" ||
                tag === "TEXTAREA" ||
                tag === "SELECT" ||
                e.target.isContentEditable;

            for (const [combo, fn] of Object.entries(shortcuts)) {
                const parts = combo.toLowerCase().split("+");
                const needsCtrl = parts.includes("ctrl") || parts.includes("meta");
                const needsShift = parts.includes("shift");
                const needsAlt = parts.includes("alt");
                const key = parts.filter((p) => !["ctrl", "meta", "shift", "alt"].includes(p))[0];

                const ctrlMatch = needsCtrl ? e.ctrlKey || e.metaKey : true;
                const shiftMatch = needsShift ? e.shiftKey : true;
                const altMatch = needsAlt ? e.altKey : true;
                const keyMatch = e.key.toLowerCase() === key || e.code.toLowerCase() === key;

                if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
                    // Escape should always work; other combos with ctrl should work even in inputs
                    if (key === "escape" || (needsCtrl && !isEditable) || needsCtrl) {
                        e.preventDefault();
                        fn(e);
                        return;
                    }
                    // Non-ctrl non-escape shortcuts only work outside inputs
                    if (!isEditable) {
                        e.preventDefault();
                        fn(e);
                        return;
                    }
                }
            }
        },
        [shortcuts, enabled]
    );

    useEffect(() => {
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [handler]);
}

export default useHotkeys;
