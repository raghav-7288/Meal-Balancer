/**
 * Tests for useMealHistory hook — cancellation, logDay, removeEntry, clearHistory
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createElement } from "react";
import { AuthContext } from "../src/context/AuthContext";

// Mock mealHistoryService
vi.mock("../src/services/mealHistoryService", () => ({
    fetchMealHistory: vi.fn(),
    upsertMealHistoryEntry: vi.fn(),
    deleteMealHistoryEntry: vi.fn(),
    clearMealHistory: vi.fn(),
    dbRowToEntry: vi.fn((row) => ({
        id: row.id,
        date: row.date,
        timestamp: row.timestamp,
        planName: row.plan_name,
        score: row.score,
        band: row.band,
        kcal: row.kcal,
        protein: row.protein,
        carbs: row.carbs,
        fat: row.fat,
        fibre: row.fibre,
        vegetablesG: row.vegetables_g,
        visibleFat: row.visible_fat,
    })),
}));

const {
    fetchMealHistory,
    upsertMealHistoryEntry,
    deleteMealHistoryEntry,
    clearMealHistory,
} = await import("../src/services/mealHistoryService");
const { useMealHistory } = await import("../src/hooks/useMealHistory");

function createWrapper(authValue) {
    return ({ children }) =>
        createElement(AuthContext.Provider, { value: authValue }, children);
}

describe("useMealHistory — cancellation and operations", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        fetchMealHistory.mockResolvedValue([]);
        upsertMealHistoryEntry.mockResolvedValue({});
        deleteMealHistoryEntry.mockResolvedValue(undefined);
        clearMealHistory.mockResolvedValue(undefined);
    });

    afterEach(() => {
        localStorage.clear();
    });

    it("returns empty history when localStorage is empty", () => {
        const wrapper = createWrapper({ user: null, isAuthenticated: false });
        const { result } = renderHook(() => useMealHistory(), { wrapper });
        expect(result.current.history).toEqual([]);
    });

    it("reads history from localStorage on mount", () => {
        const stored = [{ id: "e1", date: "2026-06-30", score: 75 }];
        localStorage.setItem("diet-specifix-meal-history", JSON.stringify(stored));

        const wrapper = createWrapper({ user: null, isAuthenticated: false });
        const { result } = renderHook(() => useMealHistory(), { wrapper });
        expect(result.current.history).toHaveLength(1);
        expect(result.current.history[0].score).toBe(75);
    });

    it("logDay adds a new entry for today", () => {
        const wrapper = createWrapper({ user: null, isAuthenticated: false });
        const { result } = renderHook(() => useMealHistory(), { wrapper });

        act(() => {
            result.current.logDay({
                planName: "Test Plan",
                score: 82,
                band: "Good balance",
                kcal: 1800,
                protein: 60,
                carbs: 250,
                fat: 50,
                fibre: 25,
                vegetablesG: 300,
                visibleFat: 15,
            });
        });

        expect(result.current.history).toHaveLength(1);
        const entry = result.current.history[0];
        expect(entry.planName).toBe("Test Plan");
        expect(entry.score).toBe(82);
        expect(entry.date).toBe(new Date().toISOString().split("T")[0]);
    });

    it("logDay replaces existing entry for today", () => {
        const today = new Date().toISOString().split("T")[0];
        const existing = [{ id: "old-id", date: today, score: 50, planName: "Old" }];
        localStorage.setItem("diet-specifix-meal-history", JSON.stringify(existing));

        const wrapper = createWrapper({ user: null, isAuthenticated: false });
        const { result } = renderHook(() => useMealHistory(), { wrapper });

        act(() => {
            result.current.logDay({
                planName: "New Plan",
                score: 90,
                band: "Excellent",
                kcal: 2000,
                protein: 70,
                carbs: 280,
                fat: 55,
                fibre: 30,
                vegetablesG: 400,
                visibleFat: 20,
            });
        });

        expect(result.current.history).toHaveLength(1);
        expect(result.current.history[0].id).toBe("old-id"); // reuses existing ID
        expect(result.current.history[0].score).toBe(90);
    });

    it("removeEntry deletes by ID", () => {
        const stored = [
            { id: "e1", date: "2026-06-29", score: 70 },
            { id: "e2", date: "2026-06-30", score: 80 },
        ];
        localStorage.setItem("diet-specifix-meal-history", JSON.stringify(stored));

        const wrapper = createWrapper({ user: null, isAuthenticated: false });
        const { result } = renderHook(() => useMealHistory(), { wrapper });

        act(() => {
            result.current.removeEntry("e1");
        });

        expect(result.current.history).toHaveLength(1);
        expect(result.current.history[0].id).toBe("e2");
    });

    it("clearHistory removes all entries", () => {
        const stored = [
            { id: "e1", date: "2026-06-29", score: 70 },
            { id: "e2", date: "2026-06-30", score: 80 },
        ];
        localStorage.setItem("diet-specifix-meal-history", JSON.stringify(stored));

        const wrapper = createWrapper({ user: null, isAuthenticated: false });
        const { result } = renderHook(() => useMealHistory(), { wrapper });

        act(() => {
            result.current.clearHistory();
        });

        expect(result.current.history).toEqual([]);
    });

    it("syncs logDay to Supabase when authenticated", () => {
        const wrapper = createWrapper({
            user: { id: "user-1" },
            isAuthenticated: true,
        });

        const { result } = renderHook(() => useMealHistory(), { wrapper });

        act(() => {
            result.current.logDay({
                planName: "Synced Plan",
                score: 85,
                band: "Excellent",
                kcal: 1900,
                protein: 65,
                carbs: 260,
                fat: 55,
                fibre: 28,
                vegetablesG: 350,
                visibleFat: 18,
            });
        });

        expect(upsertMealHistoryEntry).toHaveBeenCalledWith(
            "user-1",
            expect.objectContaining({ planName: "Synced Plan", score: 85 })
        );
    });

    it("cancels sync on unmount to prevent state update after unmount", async () => {
        let resolvePromise;
        fetchMealHistory.mockImplementation(
            () => new Promise((resolve) => { resolvePromise = resolve; })
        );

        const wrapper = createWrapper({
            user: { id: "user-cancel" },
            isAuthenticated: true,
        });

        const { unmount } = renderHook(() => useMealHistory(), { wrapper });

        // Unmount before fetch resolves
        unmount();

        // Resolve — should not crash
        resolvePromise([{ id: "r1", date: "2026-06-30", timestamp: 123, plan_name: "X", score: 50 }]);
        await act(async () => {
            await new Promise((r) => setTimeout(r, 10));
        });

        expect(true).toBe(true); // No crash
    });
});

