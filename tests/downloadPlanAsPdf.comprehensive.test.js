/**
 * downloadPlanAsPdf comprehensive tests
 * Tests the full PDF generation flow with mocked jsPDF/autoTable
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { downloadPlanAsPdf } from "../src/utils/generatePlanPdf";

// Mock jspdf
const mockDoc = {
    internal: {
        pageSize: { getWidth: () => 210, getHeight: () => 297 },
        getNumberOfPages: () => 2,
    },
    setFillColor: vi.fn(),
    setDrawColor: vi.fn(),
    setTextColor: vi.fn(),
    setLineWidth: vi.fn(),
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    circle: vi.fn(),
    line: vi.fn(),
    roundedRect: vi.fn(),
    text: vi.fn(),
    getTextWidth: vi.fn(() => 30),
    splitTextToSize: vi.fn((text) => [text]),
    addPage: vi.fn(),
    setPage: vi.fn(),
    save: vi.fn(),
    lastAutoTable: { finalY: 100 },
};

vi.mock("jspdf", () => {
    return {
        default: class MockJsPDF {
            constructor() {
                Object.assign(this, mockDoc);
            }
        },
    };
});

vi.mock("jspdf-autotable", () => ({
    default: vi.fn(),
}));

vi.mock("../src/engines/nutrientEngine", () => ({
    foodById: vi.fn((id) => {
        if (id === "rice") return { name: "Rice", gramsPerExchange: 100, kcal: 130, protein: 2.7, carbs: 28, fat: 0.3, fibre: 0.4 };
        if (id === "dal") return { name: "Dal", gramsPerExchange: 100, kcal: 350, protein: 25, carbs: 60, fat: 1.2, fibre: 15 };
        return null;
    }),
}));

vi.mock("../src/data/presetPlans", () => ({
    MEALS: ["Breakfast", "Lunch", "Dinner"],
    DAYS: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
}));

describe("downloadPlanAsPdf — full PDF generation", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockDoc.lastAutoTable = { finalY: 100 };
    });

    describe("single-day format (no daySummaries)", () => {
        it("generates PDF and calls save with plan name", () => {
            const plan = {
                id: "p1",
                name: "My Test Plan",
                meals: {
                    Breakfast: [{ foodId: "rice", grams: 200, instructions: "Steamed" }],
                    Lunch: [{ foodId: "dal", grams: 150, instructions: "Boiled" }],
                    Dinner: [],
                },
            };
            const summary = {
                dayTotals: { kcal: 2000, protein: 80, carbs: 250, fat: 60, fibre: 30, visibleFat: 15, vegetablesG: 300 },
                mealTotals: {
                    Breakfast: { kcal: 260, protein: 5.4, carbs: 56, fat: 0.6, fibre: 0.8 },
                    Lunch: { kcal: 525, protein: 37.5, carbs: 90, fat: 1.8, fibre: 22.5 },
                },
            };

            downloadPlanAsPdf(plan, summary);

            expect(mockDoc.save).toHaveBeenCalledWith("My Test Plan.pdf");
        });

        it("renders client info when userInfo has fullName", () => {
            const plan = { id: "p2", name: "Plan B", meals: { Breakfast: [], Lunch: [], Dinner: [] } };
            const summary = { dayTotals: null };
            const userInfo = { fullName: "John Doe", email: "john@example.com", age: 30, heightCm: 175, weightKg: 70, bmi: "22.9" };
            const profile = { activity: "moderate", goal: "maintenance", dietType: "vegetarian", sex: "male" };

            downloadPlanAsPdf(plan, summary, userInfo, profile);

            expect(mockDoc.text).toHaveBeenCalledWith("Client Information", expect.any(Number), expect.any(Number));
            expect(mockDoc.save).toHaveBeenCalled();
        });

        it("renders contact number when provided", () => {
            const plan = { id: "p3", name: "Plan C", meals: { Breakfast: [], Lunch: [], Dinner: [] } };
            const summary = { dayTotals: null };
            const userInfo = { fullName: "Jane", email: "jane@test.com", contactNumber: "9876543210" };
            const profile = { sex: "female" };

            downloadPlanAsPdf(plan, summary, userInfo, profile);

            expect(mockDoc.save).toHaveBeenCalled();
        });

        it("handles plan with guidelines", () => {
            const plan = {
                id: "p4",
                name: "Guided Plan",
                guidelines: "Drink 3L water daily. Avoid sugar after 6pm.",
                meals: { Breakfast: [], Lunch: [], Dinner: [] },
            };
            const summary = { dayTotals: null };

            downloadPlanAsPdf(plan, summary);

            expect(mockDoc.text).toHaveBeenCalledWith("Plan Guidelines", expect.any(Number), expect.any(Number));
            expect(mockDoc.save).toHaveBeenCalled();
        });

        it("adds daily nutrition summary table when dayTotals exists", () => {
            const plan = { id: "p5", name: "Nutrient Plan", meals: { Breakfast: [], Lunch: [], Dinner: [] } };
            const summary = {
                dayTotals: { kcal: 1800, protein: 70, carbs: 220, fat: 55, fibre: 28, visibleFat: 12, vegetablesG: 280 },
            };

            downloadPlanAsPdf(plan, summary);

            expect(mockDoc.text).toHaveBeenCalledWith("Daily Nutrition Summary", expect.any(Number), expect.any(Number));
        });

        it("handles page overflow during meal rendering", () => {
            // Force high yPos by having many items
            mockDoc.lastAutoTable = { finalY: 250 };
            const plan = {
                id: "p6",
                name: "Overflow Plan",
                meals: {
                    Breakfast: [
                        { foodId: "rice", grams: 100, instructions: "" },
                        { foodId: "dal", grams: 100, instructions: "" },
                    ],
                    Lunch: [{ foodId: "rice", grams: 200, instructions: "" }],
                    Dinner: [{ foodId: "dal", grams: 200, instructions: "" }],
                },
            };
            const summary = {
                dayTotals: { kcal: 2000, protein: 80, carbs: 260, fat: 50, fibre: 25, visibleFat: 10, vegetablesG: 200 },
                mealTotals: {},
            };

            downloadPlanAsPdf(plan, summary);

            expect(mockDoc.addPage).toHaveBeenCalled();
            expect(mockDoc.save).toHaveBeenCalled();
        });

        it("sanitizes plan name for filename", () => {
            const plan = { id: "p7", name: "Plan #1: Special! @chars", meals: { Breakfast: [], Lunch: [], Dinner: [] } };
            const summary = { dayTotals: null };

            downloadPlanAsPdf(plan, summary);

            expect(mockDoc.save).toHaveBeenCalledWith("Plan 1 Special chars.pdf");
        });

        it("uses default filename when plan has no name", () => {
            const plan = { id: "p8", name: "", meals: { Breakfast: [], Lunch: [], Dinner: [] } };
            const summary = { dayTotals: null };

            downloadPlanAsPdf(plan, summary);

            expect(mockDoc.save).toHaveBeenCalledWith("Meal Plan.pdf");
        });
    });

    describe("weekly format (with daySummaries)", () => {
        it("generates weekly PDF with day headers", () => {
            const plan = {
                id: "wp1",
                name: "Weekly Plan",
                meals: {
                    Breakfast: [
                        { foodId: "rice", grams: 150, day: "Monday", instructions: "" },
                    ],
                    Lunch: [
                        { foodId: "dal", grams: 100, day: "Monday", instructions: "" },
                    ],
                    Dinner: [],
                },
            };
            const summary = { dayTotals: null };
            const daySummaries = {
                Monday: { dayTotals: { kcal: 1800, protein: 70, carbs: 220, fat: 50, fibre: 25 } },
                Tuesday: { dayTotals: { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 } },
                Wednesday: { dayTotals: null },
            };

            downloadPlanAsPdf(plan, summary, {}, {}, daySummaries);

            // Should render "Weekly Overview" section
            expect(mockDoc.text).toHaveBeenCalledWith("Weekly Overview", expect.any(Number), expect.any(Number));
            expect(mockDoc.save).toHaveBeenCalledWith("Weekly Plan.pdf");
        });

        it("skips days with no food data", () => {
            const plan = {
                id: "wp2",
                name: "Sparse Week",
                meals: { Breakfast: [], Lunch: [], Dinner: [] },
            };
            const summary = { dayTotals: null };
            const daySummaries = {
                Monday: { dayTotals: { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 } },
                Tuesday: { dayTotals: { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 } },
            };

            downloadPlanAsPdf(plan, summary, {}, {}, daySummaries);

            // addPage should still be called for the weekly overview stats section
            expect(mockDoc.save).toHaveBeenCalled();
        });

        it("renders day total summary cards for each day with food", () => {
            const plan = {
                id: "wp3",
                name: "Full Week",
                meals: {
                    Breakfast: [
                        { foodId: "rice", grams: 200, day: "Monday", instructions: "cooked" },
                        { foodId: "rice", grams: 200, day: "Tuesday", instructions: "" },
                    ],
                    Lunch: [],
                    Dinner: [],
                },
            };
            const summary = { dayTotals: null };
            const daySummaries = {
                Monday: { dayTotals: { kcal: 2000, protein: 80, carbs: 250, fat: 60, fibre: 30 } },
                Tuesday: { dayTotals: { kcal: 1900, protein: 75, carbs: 240, fat: 55, fibre: 28 } },
            };

            downloadPlanAsPdf(plan, summary, {}, {}, daySummaries);

            expect(mockDoc.save).toHaveBeenCalled();
            // Multiple pages added for each day
            expect(mockDoc.addPage).toHaveBeenCalled();
        });

        it("renders menu, custom foods, meal times and day score in the weekly PDF", () => {
            const plan = {
                id: "wp6",
                name: "Rich Week",
                mealTimes: { Breakfast: { start: "08:00", end: "10:00" } },
                meals: {
                    Breakfast: [
                        {
                            foodId: "rice",
                            menu: "Veg Pulao",
                            grams: 200,
                            day: "Monday",
                            instructions: "Cook well",
                        },
                        {
                            foodId: "custom-1",
                            foodName: "Grandma Poha",
                            grams: 120,
                            day: "Monday",
                            isCustom: true,
                            equivalentFoodName: "Poha",
                            nutrients: { kcal: 130, protein: 3, carbs: 27, fat: 1, fibre: 1 },
                        },
                        {
                            foodId: "composite",
                            foodName: "Thali",
                            grams: 200,
                            day: "Monday",
                            ingredients: [
                                { foodName: "Dal", grams: 100, nutrients: { kcal: 120, protein: 8, carbs: 18, fat: 1, fibre: 5 } },
                                { foodName: "Roti", grams: 100, isCustom: true, nutrients: { kcal: 250, protein: 8, carbs: 50, fat: 3, fibre: 5 } },
                            ],
                        },
                    ],
                    Lunch: [],
                    Dinner: [],
                },
            };
            const summary = { dayTotals: null };
            const daySummaries = {
                Monday: {
                    dayTotals: { kcal: 1800, protein: 70, carbs: 220, fat: 50, fibre: 25 },
                    dayScore: { score: 82 },
                },
            };

            downloadPlanAsPdf(plan, summary, {}, {}, daySummaries);

            const textCalls = mockDoc.text.mock.calls.map((c) => c[0]);
            // Day balance score rendered in the day header
            expect(textCalls).toContain("Balance Score: 82 / 100");
            // Meal subheader includes the meal-time range next to the slot name
            expect(
                textCalls.some(
                    (t) => typeof t === "string" && t.includes("Breakfast") && t.includes("8")
                )
            ).toBe(true);
            expect(mockDoc.save).toHaveBeenCalledWith("Rich Week.pdf");
        });

        it("handles page overflow within a day (yPos > 240)", () => {
            mockDoc.lastAutoTable = { finalY: 245 };
            const plan = {
                id: "wp4",
                name: "Overflowing Day",
                meals: {
                    Breakfast: [{ foodId: "rice", grams: 100, day: "Monday", instructions: "" }],
                    Lunch: [{ foodId: "dal", grams: 100, day: "Monday", instructions: "" }],
                    Dinner: [{ foodId: "rice", grams: 100, day: "Monday", instructions: "" }],
                },
            };
            const summary = { dayTotals: null };
            const daySummaries = {
                Monday: { dayTotals: { kcal: 1500, protein: 60, carbs: 200, fat: 40, fibre: 20 } },
            };

            downloadPlanAsPdf(plan, summary, {}, {}, daySummaries);

            expect(mockDoc.addPage).toHaveBeenCalled();
        });

        it("does not render daily nutrition summary for weekly format", () => {
            const plan = {
                id: "wp5",
                name: "No Summary",
                meals: { Breakfast: [], Lunch: [], Dinner: [] },
            };
            const summary = {
                dayTotals: { kcal: 2000, protein: 80, carbs: 250, fat: 60, fibre: 30, visibleFat: 15, vegetablesG: 300 },
            };
            const daySummaries = {
                Monday: { dayTotals: { kcal: 2000, protein: 80, carbs: 250, fat: 60, fibre: 30 } },
            };

            downloadPlanAsPdf(plan, summary, {}, {}, daySummaries);

            // Should NOT call "Daily Nutrition Summary" because it's a weekly plan
            const textCalls = mockDoc.text.mock.calls.map(c => c[0]);
            expect(textCalls).not.toContain("Daily Nutrition Summary");
        });
    });

    describe("footer rendering", () => {
        it("draws footers on all pages", () => {
            const plan = { id: "f1", name: "Footer Test", meals: { Breakfast: [], Lunch: [], Dinner: [] } };
            const summary = { dayTotals: null };

            downloadPlanAsPdf(plan, summary);

            // setPage should be called for each page to draw footer
            expect(mockDoc.setPage).toHaveBeenCalledWith(1);
            expect(mockDoc.setPage).toHaveBeenCalledWith(2);
        });
    });

    describe("edge cases", () => {
        it("handles undefined plan.meals gracefully in single-day mode", () => {
            const plan = { id: "e1", name: "No Meals", meals: {} };
            const summary = { dayTotals: null };

            expect(() => downloadPlanAsPdf(plan, summary)).not.toThrow();
            expect(mockDoc.save).toHaveBeenCalled();
        });

        it("handles null summary gracefully", () => {
            const plan = { id: "e2", name: "Null Summary", meals: { Breakfast: [{ foodId: "rice", grams: 100 }], Lunch: [], Dinner: [] } };

            expect(() => downloadPlanAsPdf(plan, null)).not.toThrow();
            expect(mockDoc.save).toHaveBeenCalled();
        });

        it("uses items without day property in weekly mode (treats as belonging to all days)", () => {
            const plan = {
                id: "e3",
                name: "No Day Items",
                meals: {
                    Breakfast: [{ foodId: "rice", grams: 100, instructions: "" }], // no .day
                    Lunch: [],
                    Dinner: [],
                },
            };
            const summary = { dayTotals: null };
            const daySummaries = {
                Monday: { dayTotals: { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3, fibre: 0.4 } },
            };

            expect(() => downloadPlanAsPdf(plan, summary, {}, {}, daySummaries)).not.toThrow();
        });

        it("handles items with DB nutrients (not in local food data)", () => {
            const plan = {
                id: "e4",
                name: "DB Foods",
                meals: {
                    Breakfast: [{
                        foodId: "db-food-123",
                        foodName: "Quinoa",
                        grams: 150,
                        instructions: "",
                        nutrients: { kcal: 120, protein: 4.4, carbs: 21.3, fat: 1.9, fibre: 2.8 },
                    }],
                    Lunch: [],
                    Dinner: [],
                },
            };
            const summary = {
                dayTotals: null,
                mealTotals: { Breakfast: { kcal: 180, protein: 6.6, carbs: 32, fat: 2.85, fibre: 4.2 } },
            };

            expect(() => downloadPlanAsPdf(plan, summary)).not.toThrow();
        });
    });
});


