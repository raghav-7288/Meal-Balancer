import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";

// Mock FoodAutocomplete: an input for typing + a button that fires onSelect
// with a canned database food item (Rice, id 101, group 3).
vi.mock("../src/components/dashboard/FoodAutocomplete", () => ({
    default: ({ value, onChange, onSelect, placeholder }) => (
        <span>
            <input
                data-testid="food-autocomplete"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                aria-label="Search food item"
            />
            <button
                type="button"
                data-testid="food-autocomplete-select"
                onClick={() => onSelect({ food_id: 101, food_name: "Rice", major_group_id: 3 })}
            >
                select Rice
            </button>
        </span>
    ),
}));

vi.mock("../src/components/dashboard/FoodAutocomplete.css", () => ({}));
vi.mock("../src/components/dashboard/IngredientAddForm.css", () => ({}));

import IngredientAddForm from "../src/components/dashboard/IngredientAddForm";

function renderForm(props = {}) {
    const onAdd = vi.fn();
    const utils = render(
        <table>
            <tbody>
                <IngredientAddForm meal="Breakfast" onAdd={onAdd} {...props} />
            </tbody>
        </table>
    );
    return { onAdd, ...utils };
}

describe("IngredientAddForm", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("does not show the custom-food toggle by default", () => {
        renderForm();
        expect(screen.queryByRole("button", { name: "Custom food" })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Search database" })).not.toBeInTheDocument();
    });

    it("adds a database food and submits it as a single item", () => {
        const { onAdd } = renderForm();

        // Select a DB food, set grams, add to the list
        fireEvent.click(screen.getByTestId("food-autocomplete-select"));
        fireEvent.change(screen.getByLabelText("Grams for ingredient in Breakfast"), {
            target: { value: "100" },
        });
        fireEvent.click(screen.getByLabelText("Add ingredient to list"));

        // Submit
        fireEvent.click(screen.getByLabelText("Add food to Breakfast"));

        expect(onAdd).toHaveBeenCalledWith("Breakfast", "", "", [
            { foodId: "101", foodName: "Rice", foodGroupId: 3, grams: 100 },
        ]);
    });

    it("shows the mode toggle when allowCustom is set", () => {
        renderForm({ allowCustom: true });
        expect(screen.getByRole("button", { name: "Search database" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Custom food" })).toBeInTheDocument();
    });

    it("keeps the custom add button disabled until name, equivalent, and grams are provided", () => {
        renderForm({ allowCustom: true });
        fireEvent.click(screen.getByRole("button", { name: "Custom food" }));

        const addBtn = screen.getByLabelText("Add custom food to list");
        expect(addBtn).toBeDisabled();

        // Name only — still disabled
        fireEvent.change(screen.getByLabelText("Custom food name for Breakfast"), {
            target: { value: "Homemade Poha" },
        });
        expect(addBtn).toBeDisabled();

        // + equivalent — still disabled (no grams)
        fireEvent.click(screen.getByTestId("food-autocomplete-select"));
        expect(addBtn).toBeDisabled();

        // + grams — now enabled
        fireEvent.change(screen.getByLabelText("Grams for custom food in Breakfast"), {
            target: { value: "80" },
        });
        expect(addBtn).toBeEnabled();
    });

    it("adds a custom food carrying its database equivalent and submits it", () => {
        const { onAdd } = renderForm({ allowCustom: true });
        fireEvent.click(screen.getByRole("button", { name: "Custom food" }));

        fireEvent.change(screen.getByLabelText("Custom food name for Breakfast"), {
            target: { value: "Homemade Poha" },
        });
        fireEvent.click(screen.getByTestId("food-autocomplete-select"));
        fireEvent.change(screen.getByLabelText("Grams for custom food in Breakfast"), {
            target: { value: "80" },
        });
        fireEvent.click(screen.getByLabelText("Add custom food to list"));

        // Chip should reflect the custom name and its equivalent
        const list = screen.getByRole("list", { name: "Added ingredients" });
        expect(within(list).getByText(/Homemade Poha/)).toBeInTheDocument();
        expect(within(list).getByText(/≈ Rice/)).toBeInTheDocument();

        // Submit
        fireEvent.click(screen.getByLabelText("Add food to Breakfast"));

        expect(onAdd).toHaveBeenCalledWith("Breakfast", "", "", [
            {
                foodId: "101",
                foodName: "Homemade Poha",
                foodGroupId: 3,
                grams: 80,
                isCustom: true,
                equivalentFoodName: "Rice",
            },
        ]);
    });

    it("trims whitespace from the custom food name", () => {
        const { onAdd } = renderForm({ allowCustom: true });
        fireEvent.click(screen.getByRole("button", { name: "Custom food" }));

        fireEvent.change(screen.getByLabelText("Custom food name for Breakfast"), {
            target: { value: "  Ragi Dosa  " },
        });
        fireEvent.click(screen.getByTestId("food-autocomplete-select"));
        fireEvent.change(screen.getByLabelText("Grams for custom food in Breakfast"), {
            target: { value: "50" },
        });
        fireEvent.click(screen.getByLabelText("Add custom food to list"));
        fireEvent.click(screen.getByLabelText("Add food to Breakfast"));

        expect(onAdd).toHaveBeenCalledWith("Breakfast", "", "", [
            expect.objectContaining({ foodName: "Ragi Dosa", isCustom: true }),
        ]);
    });

    it("sends the menu and instructions as separate arguments", () => {
        const { onAdd } = renderForm();

        // Fill the separate Menu and Instructions fields
        fireEvent.change(screen.getByLabelText("Menu name for new food in Breakfast"), {
            target: { value: "Banana Shake" },
        });
        fireEvent.change(screen.getByLabelText("Instructions for new food in Breakfast"), {
            target: { value: "Blend with milk" },
        });

        // Add an ingredient and submit
        fireEvent.click(screen.getByTestId("food-autocomplete-select"));
        fireEvent.change(screen.getByLabelText("Grams for ingredient in Breakfast"), {
            target: { value: "100" },
        });
        fireEvent.click(screen.getByLabelText("Add ingredient to list"));
        fireEvent.click(screen.getByLabelText("Add food to Breakfast"));

        expect(onAdd).toHaveBeenCalledWith("Breakfast", "Banana Shake", "Blend with milk", [
            { foodId: "101", foodName: "Rice", foodGroupId: 3, grams: 100 },
        ]);
    });

    it("combines a database food and a custom food into one composite entry", () => {
        const { onAdd } = renderForm({ allowCustom: true });

        // DB ingredient
        fireEvent.click(screen.getByTestId("food-autocomplete-select"));
        fireEvent.change(screen.getByLabelText("Grams for ingredient in Breakfast"), {
            target: { value: "100" },
        });
        fireEvent.click(screen.getByLabelText("Add ingredient to list"));

        // Switch to custom and add another ingredient
        fireEvent.click(screen.getByRole("button", { name: "Custom food" }));
        fireEvent.change(screen.getByLabelText("Custom food name for Breakfast"), {
            target: { value: "Homemade Poha" },
        });
        fireEvent.click(screen.getByTestId("food-autocomplete-select"));
        fireEvent.change(screen.getByLabelText("Grams for custom food in Breakfast"), {
            target: { value: "80" },
        });
        fireEvent.click(screen.getByLabelText("Add custom food to list"));

        // Submit — both ingredients retained across mode switch
        fireEvent.click(screen.getByLabelText("Add food to Breakfast"));

        expect(onAdd).toHaveBeenCalledWith("Breakfast", "", "", [
            { foodId: "101", foodName: "Rice", foodGroupId: 3, grams: 100 },
            expect.objectContaining({
                foodId: "101",
                foodName: "Homemade Poha",
                isCustom: true,
                equivalentFoodName: "Rice",
                grams: 80,
            }),
        ]);
    });
});

