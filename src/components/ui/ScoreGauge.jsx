/**
 * Animated circular score gauge component.
 * Shows a semicircle meter with color-coded score band.
 */
function ScoreGauge({ score = 0, size = 120, label = "Score" }) {
    const clampedScore = Math.max(0, Math.min(100, score));
    const radius = (size - 12) / 2;
    const circumference = Math.PI * radius; // semicircle
    const offset = circumference - (clampedScore / 100) * circumference;

    // Color by band
    let color;
    if (clampedScore >= 85) color = "#059669";
    else if (clampedScore >= 70) color = "#0d9488";
    else if (clampedScore >= 50) color = "#d97706";
    else color = "#dc2626";

    let band;
    if (clampedScore >= 85) band = "Excellent";
    else if (clampedScore >= 70) band = "Good";
    else if (clampedScore >= 50) band = "Fair";
    else band = "Needs Work";

    return (
        <div
            className="score-gauge"
            style={{ width: size, height: size * 0.65 }}
            aria-label={`${label}: ${clampedScore} out of 100 — ${band}`}
        >
            <svg viewBox={`0 0 ${size} ${size * 0.6}`} className="score-gauge-svg">
                {/* Background arc */}
                <path
                    d={describeArc(size / 2, size * 0.55, radius, 180, 360)}
                    fill="none"
                    stroke="var(--gauge-track, #e5e7eb)"
                    strokeWidth="10"
                    strokeLinecap="round"
                />
                {/* Foreground arc */}
                <path
                    d={describeArc(size / 2, size * 0.55, radius, 180, 360)}
                    fill="none"
                    stroke={color}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="score-gauge-fill"
                />
            </svg>
            <div className="score-gauge-center">
                <span className="score-gauge-value" style={{ color }}>
                    {clampedScore}
                </span>
                <span className="score-gauge-band" style={{ color }}>
                    {band}
                </span>
            </div>
        </div>
    );
}

/** Helper: SVG arc path for a semicircle (180° to 360°) */
function describeArc(cx, cy, r, startAngle, endAngle) {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

function polarToCartesian(cx, cy, r, angleDeg) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export default ScoreGauge;
