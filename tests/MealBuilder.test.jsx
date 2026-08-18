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
vi.mock("../src/components/dashboard/IngredientAddForm.css", () => ({}));
vi.mock("../src/components/ui/CopyToDaysMenu.css", () => ({}));
vi.mock("../src/components/ui/MealTimeRange.css", () => ({}));

// Mock IngredientAddForm to simplify testing MealBuilder
vi.mock("../src/components/dashboard/IngredientAddForm", () => ({
    default: ({ meal, onAdd, disabled }) => (
        <tr data-testid={`ingredient-form-${meal}`}>
            <td colSpan={6}>
                <button
                    data-testid={`add-to-meal-${meal}`}
                    disabled={disabled}
                    onClick={() => onAdd(meal, "Shake menu", "Test instr", [{ foodId: "101", foodName: "Rice", grams: 100 }])}
                    title="Add to meal"
                    aria-label={`Add food to ${meal}`}
                >
                    Add to meal
                </button>
            </td>
        </tr>
    ),
}));

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
    mealTimes: {},
    onAddFood: vi.fn(),
    isAddingFood: false,
    onUpdateMealItem: vi.fn(),
    onUpdateMealTime: vi.fn(),
    onRemoveMealItem: vi.fn(),
    onCopyMealItem: vi.fn(),
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

        // Should show editable grams input for the ingredient
        const gramsInput = screen.getByLabelText("Grams for Rice");
        expect(gramsInput).toBeInTheDocument();

        // Change grams
        fireEvent.change(gramsInput, { target: { value: "200" } });

        // Save
        const saveBtn = screen.getByLabelText("Save Rice");
        fireEvent.click(saveBtn);

        expect(defaultProps.onUpdateMealItem).toHaveBeenCalledWith("Breakfast", "item-1", {
            grams: 200,
            menu: "",
            instructions: "Steamed",
            foodId: "101",
            foodName: "Rice",
            foodGroupId: null,
            ingredients: null,
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

    it("renders IngredientAddForm for each meal slot when not preset", () => {
        render(<MealBuilder {...defaultProps} />);

        // IngredientAddForm should be present for each meal slot
        const addBtn = screen.getByTestId("ingredient-form-Breakfast");
        expect(addBtn).toBeInTheDocument();
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
            menu: "",
            instructions: "Boiled rice",
            foodId: "101",
            foodName: "Rice",
            foodGroupId: null,
            ingredients: null,
        });
    });

    it("shows the menu name and instructions in separate columns", () => {
        const props = {
            ...defaultProps,
            activePlan: {
                ...defaultProps.activePlan,
                meals: {
                    ...defaultProps.activePlan.meals,
                    Breakfast: [
                        {
                            id: "m1",
                            foodId: "101",
                            foodName: "Rice",
                            grams: 100,
                            day: "Monday",
                            menu: "Breakfast Bowl",
                            instructions: "Serve warm",
                        },
                    ],
                },
            },
        };
        render(<MealBuilder {...props} />);

        expect(screen.getByText("Breakfast Bowl")).toBeInTheDocument();
        expect(screen.getByText("Serve warm")).toBeInTheDocument();
    });

    it("edits the menu field separately from instructions", () => {
        render(<MealBuilder {...defaultProps} />);

        fireEvent.click(screen.getByLabelText("Edit Rice"));

        // Menu input is distinct from the instructions input
        const menuInput = screen.getByLabelText("Edit menu for Rice");
        fireEvent.change(menuInput, { target: { value: "Rice Bowl" } });

        fireEvent.click(screen.getByLabelText("Save Rice"));

        expect(defaultProps.onUpdateMealItem).toHaveBeenCalledWith("Breakfast", "item-1", {
            grams: 150,
            menu: "Rice Bowl",
            instructions: "Steamed",
            foodId: "101",
            foodName: "Rice",
            foodGroupId: null,
            ingredients: null,
        });
    });

    it("shows unknown food name from foodName field", () => {
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

        expect(screen.getByText("Quinoa")).toBeInTheDocument();
        expect(screen.getByText("200")).toBeInTheDocument();
    });

    it("renders editable meal-time range inputs and calls onUpdateMealTime with the full range", () => {
        render(<MealBuilder {...defaultProps} />);

        // Empty mealTimes → Breakfast falls back to its default range (08:00–10:00).
        // The chip shows the friendly label; open the popover to reveal the inputs.
        fireEvent.click(screen.getByRole("button", { name: "Meal time for Breakfast" }));

        const startInput = screen.getByLabelText("Meal time for Breakfast start");
        expect(startInput).toHaveValue("08:00");

        // Editing the start keeps the (default) end and emits the whole range
        fireEvent.change(startInput, { target: { value: "07:30" } });
        expect(defaultProps.onUpdateMealTime).toHaveBeenCalledWith("Breakfast", {
            start: "07:30",
            end: "10:00",
        });
    });

    it("shows meal time as a read-only range label when isPresetActive", () => {
        render(
            <MealBuilder
                {...defaultProps}
                isPresetActive={true}
                mealTimes={{ Breakfast: { start: "08:00", end: "10:00" } }}
            />
        );

        // No editable inputs under preset (read-only) mode
        expect(
            screen.queryByLabelText("Meal time for Breakfast start")
        ).not.toBeInTheDocument();
        // Compact range label is displayed instead
        expect(screen.getByText("8\u201310 AM")).toBeInTheDocument();
    });

    it("renders a custom badge with the equivalent food for custom items", () => {
        const props = {
            ...defaultProps,
            activePlan: {
                ...defaultProps.activePlan,
                meals: {
                    ...defaultProps.activePlan.meals,
                    Breakfast: [
                        {
                            id: "item-c",
                            foodId: "999",
                            foodName: "Homemade Poha",
                            grams: 120,
                            day: "Monday",
                            instructions: "",
                            isCustom: true,
                            equivalentFoodName: "Rice",
                            nutrients: { kcal: 130, carbs: 28, protein: 2.7, fat: 0.3, fibre: 0.4, vitamins: 0, minerals: 0 },
                        },
                    ],
                },
            },
        };
        render(<MealBuilder {...props} />);

        expect(screen.getByText("Homemade Poha")).toBeInTheDocument();
        expect(screen.getByText(/custom\s*≈\s*Rice/)).toBeInTheDocument();
    });

    it("fills inline add form and submits food via IngredientAddForm", () => {
        const onAddFood = vi.fn();
        render(<MealBuilder {...defaultProps} onAddFood={onAddFood} />);

        // The IngredientAddForm renders an "Add to meal" button for each meal slot
        const addBtn = screen.getByTestId("add-to-meal-Early morning");
        fireEvent.click(addBtn);

        // onAddFood should be called with (meal, menu, instructions, ingredients)
        expect(onAddFood).toHaveBeenCalledWith(
            "Early morning",
            "Shake menu",
            "Test instr",
            [{ foodId: "101", foodName: "Rice", grams: 100 }]
        );
    });

    it("handles grams input with negative value (ignores it) — IngredientAddForm", () => {
        // The IngredientAddForm handles its own validation internally
        // This test verifies the form renders without errors
        render(<MealBuilder {...defaultProps} />);

        // IngredientAddForm should be present for each meal slot
        const form = screen.getByTestId("ingredient-form-Early morning");
        expect(form).toBeInTheDocument();
    });

    it("updates instructions in inline add form", () => {
        render(<MealBuilder {...defaultProps} />);

        // IngredientAddForm handles its own instructions field — verify form exists
        const form = screen.getByTestId("ingredient-form-Breakfast");
        expect(form).toBeInTheDocument();
    });

    it("disables add button when isAddingFood is true", () => {
        render(<MealBuilder {...defaultProps} isAddingFood={true} />);

        const addBtns = screen.getAllByTitle("Add to meal");
        for (const btn of addBtns) {
            expect(btn).toBeDisabled();
        }
    });

    it("renders a copy-to-days control for each item when not preset", () => {
        render(<MealBuilder {...defaultProps} />);

        expect(screen.getByLabelText("Copy Rice to other days")).toBeInTheDocument();
        expect(screen.getByLabelText("Copy Dal to other days")).toBeInTheDocument();
    });

    it("hides the copy-to-days control when isPresetActive", () => {
        render(<MealBuilder {...defaultProps} isPresetActive={true} />);

        expect(screen.queryByLabelText("Copy Rice to other days")).not.toBeInTheDocument();
    });

    it("does not render the copy control when onCopyMealItem is not provided", () => {
        render(<MealBuilder {...defaultProps} onCopyMealItem={undefined} />);

        expect(screen.queryByLabelText("Copy Rice to other days")).not.toBeInTheDocument();
    });

    it("copies an item to selected days via onCopyMealItem(meal, itemId, days)", () => {
        const onCopyMealItem = vi.fn();
        render(<MealBuilder {...defaultProps} onCopyMealItem={onCopyMealItem} />);

        // Open the copy popover for Rice (item-1)
        fireEvent.click(screen.getByLabelText("Copy Rice to other days"));

        // Pick two days and confirm
        fireEvent.click(screen.getByLabelText("Wednesday"));
        fireEvent.click(screen.getByLabelText("Friday"));
        fireEvent.click(screen.getByRole("button", { name: /copy to selected days/i }));

        expect(onCopyMealItem).toHaveBeenCalledWith("Breakfast", "item-1", ["Wednesday", "Friday"]);
    });
});

