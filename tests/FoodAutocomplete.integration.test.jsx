/**
 * Integration test for FoodAutocomplete — verifies:
 * - Stable ARIA listbox ID across renders (useId fix)
 * - Search debounce and result rendering
 * - Keyboard navigation
 * - Selection callback
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import FoodAutocomplete from "../src/components/dashboard/FoodAutocomplete";

// Mock the food search service
vi.mock("../src/services/foodSearchService", () => ({
    searchFoodItems: vi.fn(),
}));

// Mock useDebounce to return value immediately for testing
vi.mock("../src/hooks/useDebounce", () => ({
    useDebounce: (value) => value,
}));

// Mock @tanstack/react-virtual — JSDOM has no layout engine
vi.mock("@tanstack/react-virtual", () => ({
    useVirtualizer: ({ count }) => ({
        getTotalSize: () => count * 40,
        getVirtualItems: () =>
            Array.from({ length: count }, (_, i) => ({
                index: i,
                start: i * 40,
                size: 40,
                key: i,
            })),
    }),
}));

import { searchFoodItems } from "../src/services/foodSearchService";

describe("FoodAutocomplete", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        searchFoodItems.mockResolvedValue([]);
    });

    it("renders input with combobox role", () => {
        render(
            <FoodAutocomplete
                value=""
                onChange={vi.fn()}
                onSelect={vi.fn()}
            />
        );
        const input = screen.getByRole("combobox");
        expect(input).toBeInTheDocument();
    });

    it("has a stable aria-controls ID across re-renders", () => {
        const { rerender } = render(
            <FoodAutocomplete
                value=""
                onChange={vi.fn()}
                onSelect={vi.fn()}
            />
        );

        const input = screen.getByRole("combobox");
        const firstId = input.getAttribute("aria-controls");

        // Re-render with different props
        rerender(
            <FoodAutocomplete
                value="rice"
                onChange={vi.fn()}
                onSelect={vi.fn()}
            />
        );

        const secondId = screen.getByRole("combobox").getAttribute("aria-controls");
        expect(firstId).toBe(secondId);
    });

    it("calls onChange when user types", () => {
        const onChange = vi.fn();
        render(
            <FoodAutocomplete
                value=""
                onChange={onChange}
                onSelect={vi.fn()}
            />
        );

        const input = screen.getByRole("combobox");
        fireEvent.change(input, { target: { value: "ri" } });
        expect(onChange).toHaveBeenCalledWith("ri");
    });

    it("shows dropdown when results arrive", async () => {
        searchFoodItems.mockResolvedValue([
            { food_id: 1, food_name: "Rice", food_code: "A001", major_group_id: 1 },
            { food_id: 2, food_name: "Rice Flakes", food_code: "A002", major_group_id: 1 },
        ]);

        render(
            <FoodAutocomplete
                value=""
                onChange={vi.fn()}
                onSelect={vi.fn()}
            />
        );

        const input = screen.getByRole("combobox");
        await act(async () => {
            fireEvent.change(input, { target: { value: "rice" } });
        });

        // Wait for the search to resolve
        await waitFor(() => {
            expect(screen.getByRole("listbox")).toBeInTheDocument();
        });
    });

    it("calls onSelect when an item is clicked", async () => {
        const onSelect = vi.fn();
        searchFoodItems.mockResolvedValue([
            { food_id: 1, food_name: "Rice", food_code: "A001", major_group_id: 1 },
        ]);

        render(
            <FoodAutocomplete
                value=""
                onChange={vi.fn()}
                onSelect={onSelect}
            />
        );

        const input = screen.getByRole("combobox");
        await act(async () => {
            fireEvent.change(input, { target: { value: "rice" } });
        });

        await waitFor(() => {
            expect(screen.getByRole("listbox")).toBeInTheDocument();
        });

        const option = screen.getByRole("option");
        fireEvent.click(option);

        expect(onSelect).toHaveBeenCalledWith(
            expect.objectContaining({ food_id: 1, food_name: "Rice" })
        );
    });

    it("navigates with keyboard arrow keys", async () => {
        searchFoodItems.mockResolvedValue([
            { food_id: 1, food_name: "Rice", food_code: "A001", major_group_id: 1 },
            { food_id: 2, food_name: "Roti", food_code: "A002", major_group_id: 1 },
        ]);

        render(
            <FoodAutocomplete
                value=""
                onChange={vi.fn()}
                onSelect={vi.fn()}
            />
        );

        const input = screen.getByRole("combobox");
        await act(async () => {
            fireEvent.change(input, { target: { value: "ri" } });
        });

        await waitFor(() => {
            expect(screen.getByRole("listbox")).toBeInTheDocument();
        });

        // Press ArrowDown
        fireEvent.keyDown(input, { key: "ArrowDown" });
        const options = screen.getAllByRole("option");
        expect(options[0].getAttribute("aria-selected")).toBe("true");

        // Press ArrowDown again
        fireEvent.keyDown(input, { key: "ArrowDown" });
        expect(options[1].getAttribute("aria-selected")).toBe("true");

        // Press ArrowUp
        fireEvent.keyDown(input, { key: "ArrowUp" });
        expect(options[0].getAttribute("aria-selected")).toBe("true");
    });

    it("closes dropdown on Escape", async () => {
        searchFoodItems.mockResolvedValue([
            { food_id: 1, food_name: "Rice", food_code: "A001", major_group_id: 1 },
        ]);

        render(
            <FoodAutocomplete
                value=""
                onChange={vi.fn()}
                onSelect={vi.fn()}
            />
        );

        const input = screen.getByRole("combobox");
        await act(async () => {
            fireEvent.change(input, { target: { value: "rice" } });
        });

        await waitFor(() => {
            expect(screen.getByRole("listbox")).toBeInTheDocument();
        });

        fireEvent.keyDown(input, { key: "Escape" });
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("does not search for queries shorter than 2 characters", async () => {
        render(
            <FoodAutocomplete
                value=""
                onChange={vi.fn()}
                onSelect={vi.fn()}
            />
        );

        const input = screen.getByRole("combobox");
        await act(async () => {
            fireEvent.change(input, { target: { value: "r" } });
        });

        expect(searchFoodItems).not.toHaveBeenCalled();
    });
});



