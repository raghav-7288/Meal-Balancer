import { useEffect, useRef } from "react";

/**
 * Focus trap for modals / dialogs.
 * Traps Tab/Shift+Tab inside the referenced container.
 * Returns focus to the element that was focused before the trap was activated.
 */
function useFocusTrap(isActive) {
    const containerRef = useRef(null);
    const previousFocusRef = useRef(null);

    useEffect(() => {
        if (!isActive) return;

        // Store current focus to restore later
        previousFocusRef.current = document.activeElement;

        const container = containerRef.current;
        if (!container) return;

        // Focus the first focusable element inside the trap
        const focusableSelector =
            'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

        const focusFirst = () => {
            const first = container.querySelector(focusableSelector);
            if (first) first.focus();
        };

        // Small delay to let the DOM render
        const timer = setTimeout(focusFirst, 50);

        function handleKeyDown(e) {
            if (e.key !== "Tab") return;

            const focusable = container.querySelectorAll(focusableSelector);
            if (focusable.length === 0) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        }

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            clearTimeout(timer);
            document.removeEventListener("keydown", handleKeyDown);
            // Restore focus
            if (previousFocusRef.current && typeof previousFocusRef.current.focus === "function") {
                previousFocusRef.current.focus();
            }
        };
    }, [isActive]);

    return containerRef;
}

export default useFocusTrap;

