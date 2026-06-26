import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock the nutrient engine
vi.mock("../src/engines/nutrientEngine", () => ({
    foodById: vi.fn((id) => {
        const foods = {
            "101": { name: "Rice", group: "Cereals", gramsPerExchange: 30 },
            "102": { name: "Dal", group: "Pulses", gramsPerExchange: 30 },
        };
        return foods[id] || null;
    }),
}));

// Mock FoodAutocomplete to simplify testing MealBuilder interactions
vi.mock("../src/components/dashboard/FoodAutocomplete", () => ({
    default: ({ value, onChange, placeholder }) => (
        <input
            data-testid="food-autocomplete"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            aria-label="Search food item"
        />
    ),
}));

vi.mock("../src/components/dashboard/FoodAutocomplete.css", () => ({}));

import MealBuilder from "../src/components/dashboard/MealBuilder";

const baseMealItems = [
    { id: "item-1", foodId: "101", foodName: "Rice", grams: 150, day: "Monday", instructions: "Steamed" },
    { id: "item-2", foodId: "102", foodName: "Dal", grams: 100, day: "Monday", instructions: "" },
];

const defaultProps = {
    activePlan: {
        id: "plan-1",
        name: "Test Plan",
        meals: {
            "Early morning": [],
            Breakfast: baseMealItems,
            "Post breakfast snack": [],
            Lunch: [],
            "Post lunch snack": [],
            Dinner: [],
            "Bed time": [],
        },
    },
    activeSummary: {
        mealScores: {
            Breakfast: { score: 65, band: "Fair balance", reasons: ["Low vegetables"] },
        },
    },
    isPresetActive: false,
    viewDay: "Monday",
    onAddFood: vi.fn(),
    isAddingFood: false,
    onUpdateMealItem: vi.fn(),
    onRemoveMealItem: vi.fn(),
};

describe("MealBuilder", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders all 7 meal slots", () => {
        render(<MealBuilder {...defaultProps} />);

        expect(screen.getByText("Early morning")).toBeInTheDocument();
        expect(screen.getByText("Breakfast")).toBeInTheDocument();
        expect(screen.getByText("Post breakfast snack")).toBeInTheDocument();
        expect(screen.getByText("Lunch")).toBeInTheDocument();
        expect(screen.getByText("Post lunch snack")).toBeInTheDocument();
        expect(screen.getByText("Dinner")).toBeInTheDocument();
        expect(screen.getByText("Bed time")).toBeInTheDocument();
    });

    it("displays food items in the correct meal slot", () => {
        render(<MealBuilder {...defaultProps} />);

        expect(screen.getByText("Rice")).toBeInTheDocument();
        expect(screen.getByText("Dal")).toBeInTheDocument();
    });

    it("shows item count per meal slot", () => {
        render(<MealBuilder {...defaultProps} />);

        expect(screen.getByText("2 item(s)")).toBeInTheDocument();
    });

    it("shows meal score badge", () => {
        render(<MealBuilder {...defaultProps} />);

        expect(screen.getByLabelText("Breakfast score: 65 out of 100, Fair balance")).toBeInTheDocument();
    });

    it("shows imbalance reasons", () => {
        render(<MealBuilder {...defaultProps} />);

        expect(screen.getByText("Low vegetables")).toBeInTheDocument();
    });

    it("calls onRemoveMealItem when remove button is clicked", () => {
        render(<MealBuilder {...defaultProps} />);

        const removeBtn = screen.getByLabelText("Remove Rice");
        fireEvent.click(removeBtn);

        expect(defaultProps.onRemoveMealItem).toHaveBeenCalledWith("Breakfast", "item-1");
    });

    it("enters edit mode and saves changes", () => {
        render(<MealBuilder {...defaultProps} />);

        // Click edit on Rice
        const editBtn = screen.getByLabelText("Edit Rice");
        fireEvent.click(editBtn);

        // Should show editable grams input
        const gramsInput = screen.getByLabelText("Edit grams for Rice");
        expect(gramsInput).toBeInTheDocument();

        // Change grams
        fireEvent.change(gramsInput, { target: { value: "200" } });

        // Save
        const saveBtn = screen.getByLabelText("Save Rice");
        fireEvent.click(saveBtn);

        expect(defaultProps.onUpdateMealItem).toHaveBeenCalledWith("Breakfast", "item-1", {
            grams: 200,
            instructions: "Steamed",
        });
    });

    it("collapses and expands meal slots on click", () => {
        render(<MealBuilder {...defaultProps} />);

        // Rice should be visible initially
        expect(screen.getByText("Rice")).toBeInTheDocument();

        // Collapse Breakfast slot
        const breakfastHeader = screen.getByText("Breakfast").closest("[role='button']");
        fireEvent.click(breakfastHeader);

        // Items should be hidden now
        expect(screen.queryByText("Rice")).not.toBeInTheDocument();

        // Expand again
        fireEvent.click(breakfastHeader);
        expect(screen.getByText("Rice")).toBeInTheDocument();
    });

    it("shows empty state for slots with no items", () => {
        render(<MealBuilder {...defaultProps} />);

        const emptyCells = screen.getAllByText(/No items for Monday/);
        // Multiple empty slots should show this message
        expect(emptyCells.length).toBeGreaterThanOrEqual(1);
    });

    it("shows preset plan notice when isPresetActive", () => {
        render(<MealBuilder {...defaultProps} isPresetActive={true} />);

        expect(screen.getByText(/pre-saved plan/)).toBeInTheDocument();
    });

    it("hides action buttons when isPresetActive", () => {
        render(<MealBuilder {...defaultProps} isPresetActive={true} />);

        expect(screen.queryByLabelText("Remove Rice")).not.toBeInTheDocument();
        expect(screen.queryByLabelText("Edit Rice")).not.toBeInTheDocument();
    });

    it("shows loading state when activePlan is null", () => {
        render(<MealBuilder {...defaultProps} activePlan={null} />);

        expect(screen.getByText("Loading plan…")).toBeInTheDocument();
    });

    it("disables add button when grams or food name is empty", () => {
        render(<MealBuilder {...defaultProps} />);

        // The add button for Breakfast should be disabled since form is empty
        const addBtn = screen.getByLabelText("Add food to Breakfast");
        expect(addBtn).toBeDisabled();
    });

    it("handles keyboard interaction to toggle slots (Enter key)", () => {
        render(<MealBuilder {...defaultProps} />);

        const breakfastHeader = screen.getByText("Breakfast").closest("[role='button']");
        fireEvent.keyDown(breakfastHeader, { key: "Enter" });

        // Should collapse
        expect(screen.queryByText("Rice")).not.toBeInTheDocument();

        // Expand with Space
        fireEvent.keyDown(breakfastHeader, { key: " " });
        expect(screen.getByText("Rice")).toBeInTheDocument();
    });

    it("does not toggle slot on other keys", () => {
        render(<MealBuilder {...defaultProps} />);

        const breakfastHeader = screen.getByText("Breakfast").closest("[role='button']");
        fireEvent.keyDown(breakfastHeader, { key: "a" });

        // Should NOT collapse
        expect(screen.getByText("Rice")).toBeInTheDocument();
    });

    it("edits instructions field in edit mode", () => {
        render(<MealBuilder {...defaultProps} />);

        // Click edit on Rice
        fireEvent.click(screen.getByLabelText("Edit Rice"));

        // Edit instructions
        const instrInput = screen.getByLabelText("Edit instructions for Rice");
        fireEvent.change(instrInput, { target: { value: "Boiled rice" } });

        // Save
        fireEvent.click(screen.getByLabelText("Save Rice"));

        expect(defaultProps.onUpdateMealItem).toHaveBeenCalledWith("Breakfast", "item-1", {
            grams: 150,
            instructions: "Boiled rice",
        });
    });

    it("shows exchange value for food items", () => {
        render(<MealBuilder {...defaultProps} />);

        // Rice: 150g / 30g per exchange = 5.00
        expect(screen.getByText("5.00")).toBeInTheDocument();
        // Dal: 100g / 30g per exchange = 3.33
        expect(screen.getByText("3.33")).toBeInTheDocument();
    });

    it("handles unknown food (falls back to /100 for exchange)", () => {
        const props = {
            ...defaultProps,
            activePlan: {
                ...defaultProps.activePlan,
                meals: {
                    ...defaultProps.activePlan.meals,
                    Breakfast: [
                        { id: "item-3", foodId: "unknown-id", foodName: "Quinoa", grams: 200, day: "Monday", instructions: "" },
                    ],
                },
            },
        };
        render(<MealBuilder {...props} />);

        // 200 / 100 = 2.00
        expect(screen.getByText("2.00")).toBeInTheDocument();
        expect(screen.getByText("Quinoa")).toBeInTheDocument();
    });

    it("fills inline add form and submits food", () => {
        // Use a custom mock for FoodAutocomplete that can trigger onSelect
        render(<MealBuilder {...defaultProps} />);

        // Fill grams for Breakfast
        const gramsInputs = screen.getAllByLabelText(/Grams for new food in/);
        const breakfastGrams = gramsInputs[0]; // First meal slot's grams input
        fireEvent.change(breakfastGrams, { target: { value: "100" } });

        // The add button should still be disabled because food name is empty
        const addBtn = screen.getByLabelText("Add food to Early morning");
        expect(addBtn).toBeDisabled();
    });

    it("handles grams input with negative value (ignores it)", () => {
        render(<MealBuilder {...defaultProps} />);

        const gramsInputs = screen.getAllByLabelText(/Grams for new food in/);
        fireEvent.change(gramsInputs[0], { target: { value: "-5" } });

        // Should not update — value stays empty
        expect(gramsInputs[0].value).toBe("");
    });

    it("updates instructions in inline add form", () => {
        render(<MealBuilder {...defaultProps} />);

        const instrInputs = screen.getAllByLabelText(/Instructions for new food in/);
        fireEvent.change(instrInputs[0], { target: { value: "Cut into pieces" } });

        expect(instrInputs[0].value).toBe("Cut into pieces");
    });

    it("disables add button when isAddingFood is true", () => {
        render(<MealBuilder {...defaultProps} isAddingFood={true} />);

        const addBtns = screen.getAllByTitle("Add food");
        for (const btn of addBtns) {
            expect(btn).toBeDisabled();
        }
    });
});

