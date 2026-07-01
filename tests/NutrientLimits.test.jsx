/**
 * Tests for NutrientLimits component after salt removal
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import NutrientLimits from "../src/components/dashboard/NutrientLimits";

describe("NutrientLimits", () => {
    const defaultLimits = { carbs: 300, protein: 60, fat: 65, sugar: 25, fibre: 30 };
    const mockOnChange = vi.fn();

    it("renders without crashing", () => {
        render(
            <NutrientLimits
                limits={defaultLimits}
                onChangeLimit={mockOnChange}
                dayTotals={null}
            />
        );
        expect(screen.getByText("Daily Nutrient Limits")).toBeInTheDocument();
    });

    it("does not render salt field (removed)", () => {
        render(
            <NutrientLimits
                limits={{ ...defaultLimits, salt: 5 }}
                onChangeLimit={mockOnChange}
                dayTotals={null}
            />
        );
        // Expand the section
        fireEvent.click(screen.getByText("Daily Nutrient Limits"));
        expect(screen.queryByText("Salt")).not.toBeInTheDocument();
    });

    it("shows all 5 nutrient fields when expanded", () => {
        render(
            <NutrientLimits
                limits={defaultLimits}
                onChangeLimit={mockOnChange}
                dayTotals={{ carbs: 100, protein: 30, fat: 20, addedSugar: 10, fibre: 15 }}
            />
        );
        fireEvent.click(screen.getByText("Daily Nutrient Limits"));
        expect(screen.getByText("Carbs")).toBeInTheDocument();
        expect(screen.getByText("Protein")).toBeInTheDocument();
        expect(screen.getByText("Fat")).toBeInTheDocument();
        expect(screen.getByText("Sugar")).toBeInTheDocument();
        expect(screen.getByText("Fibre")).toBeInTheDocument();
    });

    it("shows 'All OK' badge when no limits exceeded", () => {
        render(
            <NutrientLimits
                limits={defaultLimits}
                onChangeLimit={mockOnChange}
                dayTotals={{ carbs: 100, protein: 30, fat: 20, addedSugar: 10, fibre: 15 }}
            />
        );
        expect(screen.getByText("✓ All OK")).toBeInTheDocument();
    });

    it("shows exceeded badge when limits are exceeded", () => {
        render(
            <NutrientLimits
                limits={defaultLimits}
                onChangeLimit={mockOnChange}
                dayTotals={{ carbs: 400, protein: 80, fat: 20, addedSugar: 10, fibre: 15 }}
            />
        );
        expect(screen.getByText(/exceeded/i)).toBeInTheDocument();
    });

    it("calls onChangeLimit when input value changes", () => {
        render(
            <NutrientLimits
                limits={defaultLimits}
                onChangeLimit={mockOnChange}
                dayTotals={{ carbs: 100, protein: 30, fat: 20, addedSugar: 10, fibre: 15 }}
            />
        );
        // Expand
        fireEvent.click(screen.getByText("Daily Nutrient Limits"));
        // Find carbs input
        const carbsInput = screen.getByLabelText(/Carbs daily limit/i);
        fireEvent.change(carbsInput, { target: { value: "250" } });
        expect(mockOnChange).toHaveBeenCalledWith("carbs", 250);
    });

    it("handles empty input (sets to 0)", () => {
        render(
            <NutrientLimits
                limits={defaultLimits}
                onChangeLimit={mockOnChange}
                dayTotals={{ carbs: 100, protein: 30, fat: 20, addedSugar: 10, fibre: 15 }}
            />
        );
        fireEvent.click(screen.getByText("Daily Nutrient Limits"));
        const proteinInput = screen.getByLabelText(/Protein daily limit/i);
        fireEvent.change(proteinInput, { target: { value: "" } });
        expect(mockOnChange).toHaveBeenCalledWith("protein", 0);
    });

    it("handles null dayTotals without crashing", () => {
        render(
            <NutrientLimits
                limits={defaultLimits}
                onChangeLimit={mockOnChange}
                dayTotals={null}
            />
        );
        // Should not show exceeded badge with null totals
        expect(screen.queryByText(/exceeded/)).not.toBeInTheDocument();
    });

    it("toggles expanded state on click", () => {
        render(
            <NutrientLimits
                limits={defaultLimits}
                onChangeLimit={mockOnChange}
                dayTotals={null}
            />
        );
        const header = screen.getByText("Daily Nutrient Limits");
        // First click — expand
        fireEvent.click(header);
        expect(screen.getByRole("region", { name: /Nutrient limit settings/ })).toBeInTheDocument();
        // Second click — collapse
        fireEvent.click(header);
        expect(screen.queryByRole("region", { name: /Nutrient limit settings/ })).not.toBeInTheDocument();
    });

    it("supports keyboard Enter to toggle", () => {
        render(
            <NutrientLimits
                limits={defaultLimits}
                onChangeLimit={mockOnChange}
                dayTotals={null}
            />
        );
        const header = screen.getByRole("button", { name: /Daily Nutrient Limits/i });
        fireEvent.keyDown(header, { key: "Enter" });
        expect(screen.getByRole("region", { name: /Nutrient limit settings/ })).toBeInTheDocument();
    });
});

