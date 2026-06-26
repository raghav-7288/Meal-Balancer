import { useRef, useState, useEffect } from "react";

/**
 * LazyChart (#78) — uses IntersectionObserver to defer chart rendering
 * until the container scrolls into view. Saves ~200ms on initial page paint.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - The chart content to render lazily.
 * @param {string} [props.height="300px"] - Placeholder height before chart renders.
 * @param {string} [props.className] - CSS class for the wrapper.
 * @param {number} [props.rootMargin=100] - Pixels before viewport to trigger load.
 */
function LazyChart({ children, height = "300px", className = "", rootMargin = 100 }) {
    const containerRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            {
                rootMargin: `${rootMargin}px`,
                threshold: 0,
            },
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [rootMargin]);

    return (
        <div ref={containerRef} className={className} style={{ minHeight: height }}>
            {isVisible ? (
                children
            ) : (
                <div
                    style={{
                        height,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#94a3b8",
                        fontSize: "0.875rem",
                    }}
                    aria-hidden="true"
                >
                    Loading chart…
                </div>
            )}
        </div>
    );
}

export default LazyChart;

