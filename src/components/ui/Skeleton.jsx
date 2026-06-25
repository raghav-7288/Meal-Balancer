/**
 * Shimmer loading skeleton placeholders.
 * Use these instead of spinners for perceived performance.
 */

function SkeletonBlock({ width = "100%", height = "1rem", borderRadius = "8px", style = {} }) {
    return (
        <div
            className="skeleton-shimmer"
            style={{ width, height, borderRadius, ...style }}
            aria-hidden="true"
        />
    );
}

/** KPI card skeleton — matches the real Kpi component layout */
function SkeletonKpi() {
    return (
        <div className="kpi skeleton-card" aria-hidden="true">
            <SkeletonBlock width="60%" height="12px" />
            <SkeletonBlock width="40%" height="34px" style={{ marginTop: 10 }} />
            <SkeletonBlock width="50%" height="12px" style={{ marginTop: 6 }} />
        </div>
    );
}

/** Meal card skeleton */
function SkeletonMealCard() {
    return (
        <div className="meal-card skeleton-card" aria-hidden="true">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <SkeletonBlock width="120px" height="18px" />
                <SkeletonBlock width="60px" height="28px" borderRadius="999px" />
            </div>
            <SkeletonBlock width="100%" height="38px" style={{ marginBottom: 8 }} />
            <SkeletonBlock width="100%" height="38px" style={{ marginBottom: 8 }} />
            <SkeletonBlock width="70%" height="38px" />
        </div>
    );
}

/** Profile stat card skeleton */
function SkeletonStatCard() {
    return (
        <div className="pro-stat-card skeleton-card" aria-hidden="true">
            <SkeletonBlock width="36px" height="36px" borderRadius="10px" />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <SkeletonBlock width="50%" height="20px" />
                <SkeletonBlock width="70%" height="12px" />
            </div>
        </div>
    );
}

/** Food search result skeleton */
function SkeletonFoodResult() {
    return (
        <div className="food-result-card skeleton-card" aria-hidden="true" style={{ padding: "14px 16px" }}>
            <SkeletonBlock width="80%" height="14px" style={{ marginBottom: 8 }} />
            <div style={{ display: "flex", gap: 8 }}>
                <SkeletonBlock width="60px" height="12px" />
                <SkeletonBlock width="100px" height="12px" />
            </div>
        </div>
    );
}

/** Dashboard page full skeleton */
function DashboardSkeleton() {
    return (
        <div className="dashboard-page" aria-label="Loading dashboard" role="status">
            {/* Day selector skeleton */}
            <div className="day-selector-row">
                <div className="day-chips">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <SkeletonBlock key={i} width="44px" height="32px" borderRadius="10px" />
                    ))}
                </div>
            </div>

            {/* KPI grid skeleton */}
            <div className="kpi-grid" style={{ marginBottom: 18 }}>
                <SkeletonKpi />
                <SkeletonKpi />
                <SkeletonKpi />
                <SkeletonKpi />
            </div>

            {/* Meal cards skeleton */}
            <div className="meal-panels">
                <SkeletonMealCard />
                <SkeletonMealCard />
            </div>
        </div>
    );
}

/** Profile page full skeleton */
function ProfileSkeleton() {
    return (
        <div className="pro-profile-page" aria-label="Loading profile" role="status">
            {/* Header skeleton */}
            <div className="pro-profile-header-card skeleton-card" style={{ height: 120 }}>
                <SkeletonBlock width="100%" height="100%" borderRadius="20px" />
            </div>

            {/* Stats row skeleton */}
            <div className="pro-stats-row">
                <SkeletonStatCard />
                <SkeletonStatCard />
                <SkeletonStatCard />
                <SkeletonStatCard />
            </div>
        </div>
    );
}

export {
    SkeletonBlock,
    SkeletonKpi,
    SkeletonMealCard,
    SkeletonStatCard,
    SkeletonFoodResult,
    DashboardSkeleton,
    ProfileSkeleton,
};

