import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
    useNavigate: () => vi.fn(),
}));

// Mock the useDashboardState hook to control all props
const mockDashboardState = {
    isAuthenticated: true,
    profile: { username: "testuser" },
    presetPlans: [{ id: "p1", name: "Plan A", meals: {} }],
    userPlans: [],
    planView: "preset",
    setPlanView: vi.fn(),
    activePlanId: "p1",
    setActivePlanId: vi.fn(),
    activePlan: { id: "p1", name: "Plan A", meals: {} },
    isPresetActive: true,
    presetLoading: false,
    plans: [{ id: "p1", name: "Plan A", meals: {} }],
    syncStatus: "idle",
    syncError: null,
    retrySync: vi.fn(),
    viewDay: "Monday",
    setViewDay: vi.fn(),
    summaries: {},
    activeSummary: {
        dayTotals: { kcal: 1850, vegetablesG: 245, visibleFat: 18 },
        dayScore: { score: 72, band: "Good balance" },
        mealScores: {},
    },
    bestSummary: null,
    dayScore: 72,
    scoreTone: "good",
    nutrientLimits: {},
    setNutrientLimits: vi.fn(),
    isAddingFood: false,
    addFood: vi.fn(),
    updateMealItem: vi.fn(),
    removeMealItem: vi.fn(),
    newPlanName: "",
    setNewPlanName: vi.fn(),
    saveNewPlan: vi.fn(),
    deleteUserPlan: vi.fn(),
    resetActivePlan: vi.fn(),
    duplicatePresetAsUserPlan: vi.fn(),
    copyModal: false,
    setCopyModal: vi.fn(),
    copyPlanName: "",
    setCopyPlanName: vi.fn(),
    confirmCopyPlan: vi.fn(),
    copyModalRef: { current: null },
    guidelines: "",
    setGuidelines: vi.fn(),
    saveGuidelines: vi.fn(),
    deleteToast: null,
    setDeleteToast: vi.fn(),
    visibleFatLimit: 30,
    userGoalNames: [],
    logToday: vi.fn(),
};

vi.mock("../src/hooks/useDashboardState", () => ({
    useDashboardState: () => mockDashboardState,
}));

// Mock child components to isolate DashboardPage rendering
vi.mock("../src/components/dashboard/PlanSidebar", () => ({
    default: () => <div data-testid="plan-sidebar">PlanSidebar</div>,
}));
vi.mock("../src/components/dashboard/MealBuilder", () => ({
    default: () => <div data-testid="meal-builder">MealBuilder</div>,
}));
vi.mock("../src/components/dashboard/NutrientSummary", () => ({
    default: () => <div data-testid="nutrient-summary">NutrientSummary</div>,
}));
vi.mock("../src/components/dashboard/NutrientLimits", () => ({
    default: () => <div data-testid="nutrient-limits">NutrientLimits</div>,
}));
vi.mock("../src/components/dashboard/ComparisonSection", () => ({
    default: () => <div data-testid="comparison-section">ComparisonSection</div>,
}));
vi.mock("../src/components/dashboard/DaySelector", () => ({
    default: () => <div data-testid="day-selector">DaySelector</div>,
}));
vi.mock("../src/components/dashboard/CopyPlanModal", () => ({
    default: () => <div data-testid="copy-plan-modal">CopyPlanModal</div>,
}));
vi.mock("../src/components/dashboard/PlanGuidelines", () => ({
    default: () => <div data-testid="plan-guidelines">PlanGuidelines</div>,
}));
vi.mock("../src/components/dashboard/NutrientLimits.css", () => ({}));

import DashboardPage from "../src/components/pages/DashboardPage";

describe("DashboardPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders KPI grid with score, energy, vegetables, and visible fat", () => {
        render(<DashboardPage />);

        // Score KPI
        expect(screen.getByText("Monday score")).toBeInTheDocument();
        expect(screen.getByText("72")).toBeInTheDocument();
        expect(screen.getByText("Good balance")).toBeInTheDocument();

        // Energy KPI
        expect(screen.getByText("Energy")).toBeInTheDocument();
        expect(screen.getByText("1850")).toBeInTheDocument();
        expect(screen.getByText("kcal/day")).toBeInTheDocument();

        // Vegetables KPI
        expect(screen.getByText("Vegetables")).toBeInTheDocument();
        expect(screen.getByText("245")).toBeInTheDocument();

        // Visible fat KPI
        expect(screen.getByText("Visible fat")).toBeInTheDocument();
        expect(screen.getByText("18")).toBeInTheDocument();
        // "g/day" appears for both Vegetables and Visible fat
        const gdayHints = screen.getAllByText("g/day");
        expect(gdayHints).toHaveLength(2);
    });

    it("renders all dashboard sections", () => {
        render(<DashboardPage />);

        expect(screen.getByTestId("plan-sidebar")).toBeInTheDocument();
        expect(screen.getByTestId("meal-builder")).toBeInTheDocument();
        expect(screen.getByTestId("nutrient-summary")).toBeInTheDocument();
        expect(screen.getByTestId("nutrient-limits")).toBeInTheDocument();
        expect(screen.getByTestId("comparison-section")).toBeInTheDocument();
        expect(screen.getByTestId("day-selector")).toBeInTheDocument();
        expect(screen.getByTestId("copy-plan-modal")).toBeInTheDocument();
        expect(screen.getByTestId("plan-guidelines")).toBeInTheDocument();
    });

    it("shows skeleton loading state when presetLoading and no plans", () => {
        mockDashboardState.presetLoading = true;
        mockDashboardState.plans = [];

        render(<DashboardPage />);

        // Should NOT render KPIs when loading
        expect(screen.queryByText("Monday score")).not.toBeInTheDocument();

        // Restore
        mockDashboardState.presetLoading = false;
        mockDashboardState.plans = [{ id: "p1", name: "Plan A", meals: {} }];
    });

    it("shows delete toast when deleteToast is set", () => {
        mockDashboardState.deleteToast = {
            planName: "My Custom Plan",
            undoAction: vi.fn(),
        };

        render(<DashboardPage />);

        expect(screen.getByRole("alert")).toBeInTheDocument();
        expect(screen.getByText(/My Custom Plan/)).toBeInTheDocument();
        expect(screen.getByText("Undo")).toBeInTheDocument();

        // Restore
        mockDashboardState.deleteToast = null;
    });

    it("renders KPI values of zero correctly when no summary data", () => {
        mockDashboardState.activeSummary = {
            dayTotals: { kcal: 0, vegetablesG: 0, visibleFat: 0 },
            dayScore: { score: 0, band: "No band" },
            mealScores: {},
        };
        mockDashboardState.dayScore = 0;
        mockDashboardState.scoreTone = "neutral";

        render(<DashboardPage />);

        // All values should render as 0
        const zeros = screen.getAllByText("0");
        expect(zeros.length).toBeGreaterThanOrEqual(4);

        // Restore
        mockDashboardState.activeSummary = {
            dayTotals: { kcal: 1850, vegetablesG: 245, visibleFat: 18 },
            dayScore: { score: 72, band: "Good balance" },
            mealScores: {},
        };
        mockDashboardState.dayScore = 72;
        mockDashboardState.scoreTone = "good";
    });
});


