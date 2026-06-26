/**
 * FoodSearchPage Tests
 *
 * Verifies:
 * - Static render states (empty input, filter chips, detail panel)
 * - Nutrient search flow: queries `nutrient_definitions`, then `search_nutrient_foods` RPC
 * - Food name search flow: queries `nutrient_definitions` (no match), then `search_foods_all_fields` RPC
 * - Food detail panel: calls `get_food_details` RPC
 * - Error handling when database queries fail
 * - Correct table/RPC names are used (NOT food_search_view)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

// ─── Controllable mock state ─────────────────────────────────────────────
let fromResults = {};  // keyed by table name
let rpcResults = {};   // keyed by RPC name
let fromCallLog = [];
let rpcCallLog = [];

function createChainableBuilder(tableName) {
    fromCallLog.push(tableName);

    const resolve = () => {
        const result = fromResults[tableName] ?? { data: [], error: null };
        return Promise.resolve(result);
    };

    const builder = {
        select: () => builder,
        eq: () => builder,
        neq: () => builder,
        ilike: () => builder,
        not: () => builder,
        gt: () => builder,
        order: () => builder,
        limit: () => resolve(),
        single: () => resolve(),
        then: (onFulfilled, onRejected) => resolve().then(onFulfilled, onRejected),
    };
    return builder;
}

vi.mock("../src/lib/supabaseClient", () => ({
    supabase: {
        from: vi.fn((table) => createChainableBuilder(table)),
        rpc: vi.fn((name, params) => {
            rpcCallLog.push({ name, params });
            const result = rpcResults[name] ?? { data: [], error: null };
            return Promise.resolve(result);
        }),
    },
}));

// Make debounce return value immediately for deterministic tests
vi.mock("../src/hooks/useDebounce", () => ({
    useDebounce: (value) => value,
}));

// Mock @tanstack/react-virtual — jsdom has no layout engine
vi.mock("@tanstack/react-virtual", () => ({
    useVirtualizer: ({ count }) => ({
        getTotalSize: () => count * 64,
        getVirtualItems: () =>
            Array.from({ length: count }, (_, i) => ({
                index: i,
                key: i,
                start: i * 64,
                size: 64,
            })),
        measureElement: () => {},
    }),
}));

import FoodSearchPage from "../src/components/FoodSearchPage";

// ─── Test data ───────────────────────────────────────────────────────────
const mockNutrientDef = [
    { nutrient_name: "Protein", nutrient_id: 5, unit: "g" },
];

const mockNutrientFoods = [
    { food_id: 1, food_code: "A001", food_name: "Soybean", food_group: "Legumes", nutrient_name: "Protein", nutrient_value: 36.5, unit: "g" },
    { food_id: 2, food_code: "A002", food_name: "Chicken breast", food_group: "Poultry", nutrient_name: "Protein", nutrient_value: 31.0, unit: "g" },
];

const mockFoodResults = [
    { food_id: 10, food_code: "C001", food_name: "Rice, raw", food_group: "Cereals" },
    { food_id: 11, food_code: "C002", food_name: "Rice, cooked", food_group: "Cereals" },
];

const mockFoodDetails = [
    { food_id: 10, food_code: "C001", food_name: "Rice, raw", food_group: "Cereals", nutrient_id: 1, nutrient_name: "Energy", nutrient_code: "ENER", nutrient_group: "Proximates", unit: "kcal", value: 345 },
    { food_id: 10, food_code: "C001", food_name: "Rice, raw", food_group: "Cereals", nutrient_id: 2, nutrient_name: "Carbohydrate", nutrient_code: "CARB", nutrient_group: "Proximates", unit: "g", value: 78.2 },
    { food_id: 10, food_code: "C001", food_name: "Rice, raw", food_group: "Cereals", nutrient_id: 5, nutrient_name: "Protein", nutrient_code: "PROT", nutrient_group: "Proximates", unit: "g", value: 6.8 },
];

// ─── Tests ───────────────────────────────────────────────────────────────
describe("FoodSearchPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        fromResults = {};
        rpcResults = {};
        fromCallLog = [];
        rpcCallLog = [];
    });

    // ─── Static render ───────────────────────────────────────────────
    it("renders the search input", async () => {
        await act(async () => {
            render(<FoodSearchPage />);
        });

        const input = screen.getByPlaceholderText("Search foods, nutrients, groups...");
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute("role", "combobox");
    });

    it("shows empty state when no query", async () => {
        await act(async () => {
            render(<FoodSearchPage />);
        });

        expect(screen.getByText("Search the food database")).toBeInTheDocument();
    });

    it("renders source note", async () => {
        await act(async () => {
            render(<FoodSearchPage />);
        });

        expect(screen.getByText(/IFCT 2017 data/)).toBeInTheDocument();
    });

    it("shows detail panel empty state", async () => {
        await act(async () => {
            render(<FoodSearchPage />);
        });

        expect(screen.getByText("Select a food to view nutrient details")).toBeInTheDocument();
    });

    // ─── Queries correct tables (NOT food_search_view) ───────────────
    it("queries nutrient_definitions table, not food_search_view", async () => {
        fromResults["nutrient_definitions"] = { data: [], error: null };

        await act(async () => {
            render(<FoodSearchPage />);
        });

        const input = screen.getByPlaceholderText("Search foods, nutrients, groups...");

        await act(async () => {
            fireEvent.change(input, { target: { value: "rice" } });
        });

        await waitFor(() => {
            expect(fromCallLog).toContain("nutrient_definitions");
            expect(fromCallLog).not.toContain("food_search_view");
        });
    });

    // ─── Nutrient search flow ────────────────────────────────────────
    it("uses search_nutrient_foods RPC when query matches a nutrient", async () => {
        fromResults["nutrient_definitions"] = { data: mockNutrientDef, error: null };
        rpcResults["search_nutrient_foods"] = { data: mockNutrientFoods, error: null };

        await act(async () => {
            render(<FoodSearchPage />);
        });

        const input = screen.getByPlaceholderText("Search foods, nutrients, groups...");

        await act(async () => {
            fireEvent.change(input, { target: { value: "protein" } });
        });

        await waitFor(() => {
            // Should call the RPC, not query food_search_view
            const rpcNames = rpcCallLog.map((r) => r.name);
            expect(rpcNames).toContain("search_nutrient_foods");
            expect(fromCallLog).not.toContain("food_search_view");
        });

        // Should display nutrient search badge
        await waitFor(() => {
            expect(screen.getByText(/Sorted by/)).toBeInTheDocument();
            expect(screen.getByText("Protein")).toBeInTheDocument();
        });

        // Should show ranked food results
        expect(screen.getByText("Soybean")).toBeInTheDocument();
        expect(screen.getByText("Chicken breast")).toBeInTheDocument();
    });

    // ─── Food name search flow ───────────────────────────────────────
    it("uses search_foods_all_fields RPC when query does not match a nutrient", async () => {
        fromResults["nutrient_definitions"] = { data: [], error: null };
        rpcResults["search_foods_all_fields"] = { data: mockFoodResults, error: null };

        await act(async () => {
            render(<FoodSearchPage />);
        });

        const input = screen.getByPlaceholderText("Search foods, nutrients, groups...");

        await act(async () => {
            fireEvent.change(input, { target: { value: "rice" } });
        });

        await waitFor(() => {
            const rpcNames = rpcCallLog.map((r) => r.name);
            expect(rpcNames).toContain("search_foods_all_fields");
            expect(fromCallLog).not.toContain("food_search_view");
        });

        // Should show food results (use food codes — HighlightMatch splits food_name across elements)
        await waitFor(() => {
            expect(screen.getByText("C001")).toBeInTheDocument();
            expect(screen.getByText("C002")).toBeInTheDocument();
        });
    });

    // ─── Food detail panel ───────────────────────────────────────────
    it("uses get_food_details RPC for nutrient detail panel", async () => {
        fromResults["nutrient_definitions"] = { data: [], error: null };
        rpcResults["search_foods_all_fields"] = { data: mockFoodResults, error: null };
        rpcResults["get_food_details"] = { data: mockFoodDetails, error: null };

        await act(async () => {
            render(<FoodSearchPage />);
        });

        const input = screen.getByPlaceholderText("Search foods, nutrients, groups...");

        await act(async () => {
            fireEvent.change(input, { target: { value: "rice" } });
        });

        // Wait for results (food_name is split by HighlightMatch, so use food_code)
        await waitFor(() => {
            expect(screen.getByText("C001")).toBeInTheDocument();
        });

        // Click the first food result card
        await act(async () => {
            fireEvent.click(screen.getByText("C001").closest(".food-result-card"));
        });

        await waitFor(() => {
            const rpcNames = rpcCallLog.map((r) => r.name);
            expect(rpcNames).toContain("get_food_details");
            expect(fromCallLog).not.toContain("food_search_view");
        });

        // Detail panel should show nutrient groups
        await waitFor(() => {
            expect(screen.getByText("Proximates")).toBeInTheDocument();
            expect(screen.getByText("Energy")).toBeInTheDocument();
        });
    });

    // ─── Error handling ──────────────────────────────────────────────
    it("shows error message when nutrient_definitions query fails", async () => {
        fromResults["nutrient_definitions"] = {
            data: null,
            error: { message: "permission denied for table nutrient_definitions" },
        };

        await act(async () => {
            render(<FoodSearchPage />);
        });

        const input = screen.getByPlaceholderText("Search foods, nutrients, groups...");

        await act(async () => {
            fireEvent.change(input, { target: { value: "rice" } });
        });

        await waitFor(() => {
            expect(
                screen.getByText("permission denied for table nutrient_definitions")
            ).toBeInTheDocument();
        });
    });

    it("shows error message when search_foods_all_fields RPC fails", async () => {
        fromResults["nutrient_definitions"] = { data: [], error: null };
        rpcResults["search_foods_all_fields"] = {
            data: null,
            error: { message: "function not found" },
        };

        await act(async () => {
            render(<FoodSearchPage />);
        });

        const input = screen.getByPlaceholderText("Search foods, nutrients, groups...");

        await act(async () => {
            fireEvent.change(input, { target: { value: "rice" } });
        });

        await waitFor(() => {
            expect(
                screen.getByText("function not found")
            ).toBeInTheDocument();
        });
    });
});
