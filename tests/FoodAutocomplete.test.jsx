import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

// Mock the foodSearchService
const mockSearchFoodItems = vi.fn();
vi.mock("../src/services/foodSearchService", () => ({
    searchFoodItems: (...args) => mockSearchFoodItems(...args),
}));

// Mock useDebounce to return value immediately for test predictability
vi.mock("../src/hooks/useDebounce", () => ({
    useDebounce: (value) => value,
}));

import FoodAutocomplete from "../src/components/dashboard/FoodAutocomplete";

const mockFoodResults = [
    { food_id: 1, food_code: "A001", food_name: "Apple, raw", major_group_id: 3 },
    { food_id: 2, food_code: "A002", food_name: "Apricot, dried", major_group_id: 3 },
    { food_id: 3, food_code: "A003", food_name: "Avocado", major_group_id: 3 },
];

describe("FoodAutocomplete", () => {
    let onChangeMock;
    let onSelectMock;

    beforeEach(() => {
        vi.clearAllMocks();
        onChangeMock = vi.fn();
        onSelectMock = vi.fn();
        mockSearchFoodItems.mockResolvedValue([]);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("renders with placeholder text", () => {
        render(
            <FoodAutocomplete
                value=""
                onChange={onChangeMock}
                onSelect={onSelectMock}
                placeholder="Search food…"
            />
        );

        expect(screen.getByPlaceholderText("Search food…")).toBeInTheDocument();
    });

    it("renders with aria-label for accessibility", () => {
        render(
            <FoodAutocomplete value="" onChange={onChangeMock} onSelect={onSelectMock} />
        );

        expect(screen.getByLabelText("Search food item")).toBeInTheDocument();
    });

    it("calls onChange when user types", () => {
        render(
            <FoodAutocomplete value="" onChange={onChangeMock} onSelect={onSelectMock} />
        );

        const input = screen.getByLabelText("Search food item");
        fireEvent.change(input, { target: { value: "app" } });

        expect(onChangeMock).toHaveBeenCalledWith("app");
    });

    it("shows suggestions dropdown when results are returned", async () => {
        mockSearchFoodItems.mockResolvedValue(mockFoodResults);

        render(
            <FoodAutocomplete value="" onChange={onChangeMock} onSelect={onSelectMock} />
        );

        const input = screen.getByLabelText("Search food item");

        await act(async () => {
            fireEvent.change(input, { target: { value: "apple" } });
        });

        await waitFor(() => {
            expect(screen.getByRole("listbox")).toBeInTheDocument();
            expect(screen.getByText("Apple, raw")).toBeInTheDocument();
            expect(screen.getByText("Apricot, dried")).toBeInTheDocument();
            expect(screen.getByText("Avocado")).toBeInTheDocument();
        });
    });

    it("shows food codes in suggestions", async () => {
        mockSearchFoodItems.mockResolvedValue(mockFoodResults);

        render(
            <FoodAutocomplete value="" onChange={onChangeMock} onSelect={onSelectMock} />
        );

        const input = screen.getByLabelText("Search food item");

        await act(async () => {
            fireEvent.change(input, { target: { value: "apple" } });
        });

        await waitFor(() => {
            expect(screen.getByText("A001")).toBeInTheDocument();
        });
    });

    it("calls onSelect when a suggestion is clicked", async () => {
        mockSearchFoodItems.mockResolvedValue(mockFoodResults);

        render(
            <FoodAutocomplete value="" onChange={onChangeMock} onSelect={onSelectMock} />
        );

        const input = screen.getByLabelText("Search food item");

        await act(async () => {
            fireEvent.change(input, { target: { value: "apple" } });
        });

        await waitFor(() => {
            expect(screen.getByText("Apple, raw")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("Apple, raw"));

        expect(onSelectMock).toHaveBeenCalledWith(mockFoodResults[0]);
    });

    it("navigates suggestions with ArrowDown and ArrowUp", async () => {
        mockSearchFoodItems.mockResolvedValue(mockFoodResults);

        render(
            <FoodAutocomplete value="" onChange={onChangeMock} onSelect={onSelectMock} />
        );

        const input = screen.getByLabelText("Search food item");

        await act(async () => {
            fireEvent.change(input, { target: { value: "apple" } });
        });

        await waitFor(() => {
            expect(screen.getByRole("listbox")).toBeInTheDocument();
        });

        // Arrow down to first item
        fireEvent.keyDown(input, { key: "ArrowDown" });
        const options = screen.getAllByRole("option");
        expect(options[0]).toHaveAttribute("aria-selected", "true");

        // Arrow down to second item
        fireEvent.keyDown(input, { key: "ArrowDown" });
        expect(options[1]).toHaveAttribute("aria-selected", "true");
        expect(options[0]).toHaveAttribute("aria-selected", "false");

        // Arrow up back to first
        fireEvent.keyDown(input, { key: "ArrowUp" });
        expect(options[0]).toHaveAttribute("aria-selected", "true");
    });

    it("selects highlighted item on Enter key", async () => {
        mockSearchFoodItems.mockResolvedValue(mockFoodResults);

        render(
            <FoodAutocomplete value="" onChange={onChangeMock} onSelect={onSelectMock} />
        );

        const input = screen.getByLabelText("Search food item");

        await act(async () => {
            fireEvent.change(input, { target: { value: "apple" } });
        });

        await waitFor(() => {
            expect(screen.getByRole("listbox")).toBeInTheDocument();
        });

        // Navigate to first item and select with Enter
        fireEvent.keyDown(input, { key: "ArrowDown" });
        fireEvent.keyDown(input, { key: "Enter" });

        expect(onSelectMock).toHaveBeenCalledWith(mockFoodResults[0]);
    });

    it("closes dropdown on Escape key", async () => {
        mockSearchFoodItems.mockResolvedValue(mockFoodResults);

        render(
            <FoodAutocomplete value="" onChange={onChangeMock} onSelect={onSelectMock} />
        );

        const input = screen.getByLabelText("Search food item");

        await act(async () => {
            fireEvent.change(input, { target: { value: "apple" } });
        });

        await waitFor(() => {
            expect(screen.getByRole("listbox")).toBeInTheDocument();
        });

        fireEvent.keyDown(input, { key: "Escape" });

        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("does not search when query is less than 2 characters", async () => {
        render(
            <FoodAutocomplete value="" onChange={onChangeMock} onSelect={onSelectMock} />
        );

        const input = screen.getByLabelText("Search food item");

        await act(async () => {
            fireEvent.change(input, { target: { value: "a" } });
        });

        // searchFoodItems should not be called for short queries
        expect(mockSearchFoodItems).not.toHaveBeenCalled();
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("shows loading indicator while searching", async () => {
        // Make search return slowly
        mockSearchFoodItems.mockImplementation(
            () => new Promise((resolve) => setTimeout(() => resolve(mockFoodResults), 100))
        );

        render(
            <FoodAutocomplete value="" onChange={onChangeMock} onSelect={onSelectMock} />
        );

        const input = screen.getByLabelText("Search food item");

        await act(async () => {
            fireEvent.change(input, { target: { value: "apple" } });
        });

        // Should show loading indicator
        expect(screen.getByText("Searching...")).toBeInTheDocument();

        // Wait for results
        await waitFor(() => {
            expect(screen.queryByText("Searching...")).not.toBeInTheDocument();
        });
    });

    it("updates input value when external value prop changes", () => {
        const { rerender } = render(
            <FoodAutocomplete value="initial" onChange={onChangeMock} onSelect={onSelectMock} />
        );

        const input = screen.getByLabelText("Search food item");
        expect(input).toHaveValue("initial");

        rerender(
            <FoodAutocomplete value="updated" onChange={onChangeMock} onSelect={onSelectMock} />
        );

        expect(input).toHaveValue("updated");
    });
});

