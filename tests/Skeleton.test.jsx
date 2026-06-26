/**
 * Skeleton component tests - covers all skeleton variants
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
    SkeletonBlock,
    SkeletonKpi,
    SkeletonMealCard,
    SkeletonStatCard,
    SkeletonFoodResult,
    DashboardSkeleton,
    ProfileSkeleton,
} from "../src/components/ui/Skeleton";

describe("Skeleton Components", () => {
    describe("SkeletonBlock", () => {
        it("renders with default props", () => {
            const { container } = render(<SkeletonBlock />);
            const el = container.querySelector(".skeleton-shimmer");
            expect(el).toBeInTheDocument();
            expect(el).toHaveAttribute("aria-hidden", "true");
            expect(el.style.width).toBe("100%");
            expect(el.style.height).toBe("1rem");
            expect(el.style.borderRadius).toBe("8px");
        });

        it("renders with custom props", () => {
            const { container } = render(
                <SkeletonBlock width="200px" height="24px" borderRadius="4px" style={{ marginTop: 10 }} />
            );
            const el = container.querySelector(".skeleton-shimmer");
            expect(el.style.width).toBe("200px");
            expect(el.style.height).toBe("24px");
            expect(el.style.borderRadius).toBe("4px");
            expect(el.style.marginTop).toBe("10px");
        });
    });

    describe("SkeletonKpi", () => {
        it("renders KPI skeleton with shimmer elements", () => {
            const { container } = render(<SkeletonKpi />);
            expect(container.querySelector(".kpi.skeleton-card")).toBeInTheDocument();
            const shimmers = container.querySelectorAll(".skeleton-shimmer");
            expect(shimmers.length).toBe(3);
        });
    });

    describe("SkeletonMealCard", () => {
        it("renders meal card skeleton", () => {
            const { container } = render(<SkeletonMealCard />);
            expect(container.querySelector(".meal-card.skeleton-card")).toBeInTheDocument();
            const shimmers = container.querySelectorAll(".skeleton-shimmer");
            expect(shimmers.length).toBeGreaterThanOrEqual(4);
        });
    });

    describe("SkeletonStatCard", () => {
        it("renders profile stat card skeleton", () => {
            const { container } = render(<SkeletonStatCard />);
            expect(container.querySelector(".pro-stat-card.skeleton-card")).toBeInTheDocument();
            const shimmers = container.querySelectorAll(".skeleton-shimmer");
            expect(shimmers.length).toBe(3); // icon + value + label
        });
    });

    describe("SkeletonFoodResult", () => {
        it("renders food result skeleton", () => {
            const { container } = render(<SkeletonFoodResult />);
            expect(container.querySelector(".food-result-card.skeleton-card")).toBeInTheDocument();
            const shimmers = container.querySelectorAll(".skeleton-shimmer");
            expect(shimmers.length).toBe(3); // title + 2 detail chips
        });
    });

    describe("DashboardSkeleton", () => {
        it("renders full dashboard skeleton with role=status", () => {
            render(<DashboardSkeleton />);
            const status = screen.getByRole("status");
            expect(status).toBeInTheDocument();
            expect(status).toHaveAttribute("aria-label", "Loading dashboard");
        });

        it("renders 7 day chips, 4 KPI skeletons, and 2 meal card skeletons", () => {
            const { container } = render(<DashboardSkeleton />);
            // 7 day chips
            const dayChips = container.querySelector(".day-chips");
            expect(dayChips.children.length).toBe(7);
            // 4 KPI cards
            const kpis = container.querySelectorAll(".kpi.skeleton-card");
            expect(kpis.length).toBe(4);
            // 2 meal cards
            const mealCards = container.querySelectorAll(".meal-card.skeleton-card");
            expect(mealCards.length).toBe(2);
        });
    });

    describe("ProfileSkeleton", () => {
        it("renders full profile skeleton with role=status", () => {
            render(<ProfileSkeleton />);
            const status = screen.getByRole("status");
            expect(status).toBeInTheDocument();
            expect(status).toHaveAttribute("aria-label", "Loading profile");
        });

        it("renders header card and 4 stat cards", () => {
            const { container } = render(<ProfileSkeleton />);
            const header = container.querySelector(".pro-profile-header-card.skeleton-card");
            expect(header).toBeInTheDocument();
            const statCards = container.querySelectorAll(".pro-stat-card.skeleton-card");
            expect(statCards.length).toBe(4);
        });
    });
});

