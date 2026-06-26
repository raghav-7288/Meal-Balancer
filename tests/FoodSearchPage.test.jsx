import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock supabase client before importing component
vi.mock("../src/lib/supabaseClient", () => ({
    supabase: {
        from: () => ({
            select: () => ({
                ilike: () => ({
                    limit: () => Promise.resolve({ data: [], error: null }),
                }),
                eq: () => ({
                    not: () => ({
                        gt: () => ({
                            order: () => ({
                                limit: () => Promise.resolve({ data: [], error: null }),
                            }),
                        }),
                    }),
                }),
            }),
        }),
        rpc: () => Promise.resolve({ data: [], error: null }),
    },
}));

// Import after mock
import FoodSearchPage from "../src/components/FoodSearchPage";

describe("FoodSearchPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders the search input", () => {
        render(<FoodSearchPage />);

        const input = screen.getByPlaceholderText("Search foods, nutrients, groups...");
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute("role", "combobox");
    });

    it("shows empty state when no query", () => {
        render(<FoodSearchPage />);

        expect(screen.getByText("Search the food database")).toBeInTheDocument();
    });

    it("renders filter chips", () => {
        render(<FoodSearchPage />);

        expect(screen.getByText("All")).toBeInTheDocument();
        expect(screen.getByText("Foods")).toBeInTheDocument();
        expect(screen.getByText("Groups")).toBeInTheDocument();
    });

    it("shows detail panel empty state", () => {
        render(<FoodSearchPage />);

        expect(screen.getByText("Select a food to view nutrient details")).toBeInTheDocument();
    });
});

