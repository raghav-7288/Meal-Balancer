/**
 * useMealHistory hook tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

vi.mock("../src/hooks/useAuth", () => ({
    useAuth: vi.fn(),
}));

vi.mock("../src/services/mealHistoryService", () => ({
    fetchMealHistory: vi.fn(),
    upsertMealHistoryEntry: vi.fn(),
    deleteMealHistoryEntry: vi.fn(),
    clearMealHistory: vi.fn(),
    dbRowToEntry: vi.fn((row) => ({
        id: row.id,
        date: row.log_date,
        timestamp: Date.now(),
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

import { useAuth } from "../src/hooks/useAuth";
import {
    fetchMealHistory,
    upsertMealHistoryEntry,
    deleteMealHistoryEntry,
    clearMealHistory,
} from "../src/services/mealHistoryService";
import { useMealHistory } from "../src/hooks/useMealHistory";

describe("useMealHistory", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        useAuth.mockReturnValue({ user: null, isAuthenticated: false });
        fetchMealHistory.mockResolvedValue([]);
        upsertMealHistoryEntry.mockResolvedValue(undefined);
        deleteMealHistoryEntry.mockResolvedValue(undefined);
        clearMealHistory.mockResolvedValue(undefined);
    });

    it("initializes with empty history from localStorage", () => {
        const { result } = renderHook(() => useMealHistory());
        expect(result.current.history).toEqual([]);
        expect(result.current.syncStatus).toBe("idle");
    });

    it("reads history from localStorage on init", () => {
        const stored = [
            { id: "h1", date: "2024-01-01", score: 85, planName: "Test Plan" },
        ];
        localStorage.setItem("diet-specifix-meal-history", JSON.stringify(stored));

        const { result } = renderHook(() => useMealHistory());
        expect(result.current.history).toEqual(stored);
    });

    it("handles invalid localStorage gracefully", () => {
        localStorage.setItem("diet-specifix-meal-history", "invalid-json");
        const { result } = renderHook(() => useMealHistory());
        expect(result.current.history).toEqual([]);
    });

    it("logDay adds a new entry for today", () => {
        const { result } = renderHook(() => useMealHistory());

        act(() => {
            result.current.logDay({
                planName: "My Plan",
                score: 78,
                band: "Good",
                kcal: 2000,
                protein: 80,
                carbs: 250,
                fat: 60,
                fibre: 30,
                vegetablesG: 300,
                visibleFat: 15,
            });
        });

        expect(result.current.history).toHaveLength(1);
        const entry = result.current.history[0];
        expect(entry.planName).toBe("My Plan");
        expect(entry.score).toBe(78);
        expect(entry.date).toBe(new Date().toISOString().split("T")[0]);
    });

    it("logDay replaces existing entry for today", () => {
        const today = new Date().toISOString().split("T")[0];
        const existing = [
            { id: "old-entry", date: today, score: 50, planName: "Old Plan" },
        ];
        localStorage.setItem("diet-specifix-meal-history", JSON.stringify(existing));

        const { result } = renderHook(() => useMealHistory());

        act(() => {
            result.current.logDay({
                planName: "New Plan",
                score: 90,
                band: "Excellent",
                kcal: 2200,
                protein: 90,
                carbs: 270,
                fat: 65,
                fibre: 35,
                vegetablesG: 350,
                visibleFat: 12,
            });
        });

        expect(result.current.history).toHaveLength(1);
        expect(result.current.history[0].score).toBe(90);
        expect(result.current.history[0].planName).toBe("New Plan");
        // Should keep the same ID
        expect(result.current.history[0].id).toBe("old-entry");
    });

    it("logDay syncs to Supabase when authenticated", () => {
        useAuth.mockReturnValue({ user: { id: "user-1" }, isAuthenticated: true });
        fetchMealHistory.mockResolvedValue([]);

        const { result } = renderHook(() => useMealHistory());

        act(() => {
            result.current.logDay({
                planName: "Synced Plan",
                score: 85,
                band: "Good",
                kcal: 2100,
                protein: 85,
                carbs: 260,
                fat: 62,
                fibre: 32,
                vegetablesG: 320,
                visibleFat: 14,
            });
        });

        expect(upsertMealHistoryEntry).toHaveBeenCalledWith("user-1", expect.objectContaining({
            planName: "Synced Plan",
            score: 85,
        }));
    });

    it("removeEntry removes entry by id", () => {
        const stored = [
            { id: "h1", date: "2024-01-01", score: 85 },
            { id: "h2", date: "2024-01-02", score: 90 },
        ];
        localStorage.setItem("diet-specifix-meal-history", JSON.stringify(stored));

        const { result } = renderHook(() => useMealHistory());

        act(() => {
            result.current.removeEntry("h1");
        });

        expect(result.current.history).toHaveLength(1);
        expect(result.current.history[0].id).toBe("h2");
    });

    it("removeEntry syncs deletion to Supabase when authenticated", () => {
        useAuth.mockReturnValue({ user: { id: "user-1" }, isAuthenticated: true });
        fetchMealHistory.mockResolvedValue([]);
        const stored = [{ id: "h1", date: "2024-01-01", score: 85 }];
        localStorage.setItem("diet-specifix-meal-history", JSON.stringify(stored));

        const { result } = renderHook(() => useMealHistory());

        act(() => {
            result.current.removeEntry("h1");
        });

        expect(deleteMealHistoryEntry).toHaveBeenCalledWith("user-1", "h1");
    });

    it("clearHistory removes all entries", () => {
        const stored = [
            { id: "h1", date: "2024-01-01", score: 85 },
            { id: "h2", date: "2024-01-02", score: 90 },
        ];
        localStorage.setItem("diet-specifix-meal-history", JSON.stringify(stored));

        const { result } = renderHook(() => useMealHistory());

        act(() => {
            result.current.clearHistory();
        });

        expect(result.current.history).toEqual([]);
    });

    it("clearHistory syncs to Supabase when authenticated", () => {
        useAuth.mockReturnValue({ user: { id: "user-1" }, isAuthenticated: true });
        fetchMealHistory.mockResolvedValue([]);

        const { result } = renderHook(() => useMealHistory());

        act(() => {
            result.current.clearHistory();
        });

        expect(clearMealHistory).toHaveBeenCalledWith("user-1");
    });

    it("loads from Supabase on login and merges with local", async () => {
        const localEntries = [{ id: "local-1", date: "2024-01-05", score: 70, planName: "Local" }];
        localStorage.setItem("diet-specifix-meal-history", JSON.stringify(localEntries));

        const remoteRows = [
            { id: "remote-1", log_date: "2024-01-03", plan_name: "Remote", score: 80, band: "Good", kcal: 2000, protein: 80, carbs: 250, fat: 60, fibre: 30, vegetables_g: 300, visible_fat: 15 },
        ];
        fetchMealHistory.mockResolvedValue(remoteRows);
        useAuth.mockReturnValue({ user: { id: "user-1" }, isAuthenticated: true });

        const { result } = renderHook(() => useMealHistory());

        await waitFor(() => {
            expect(result.current.syncStatus).toBe("synced");
        }, { timeout: 3000 });

        // Should have both remote and local entries
        expect(result.current.history.length).toBe(2);
        // Should upload local-only entry
        expect(upsertMealHistoryEntry).toHaveBeenCalledWith("user-1", localEntries[0]);
    });

    it("handles Supabase load error", async () => {
        fetchMealHistory.mockRejectedValue(new Error("DB error"));
        useAuth.mockReturnValue({ user: { id: "user-1" }, isAuthenticated: true });

        const { result } = renderHook(() => useMealHistory());

        await waitFor(() => {
            expect(result.current.syncStatus).toBe("error");
        }, { timeout: 3000 });
    });

    it("persists history to localStorage on change", () => {
        const { result } = renderHook(() => useMealHistory());

        act(() => {
            result.current.logDay({
                planName: "Persist Plan",
                score: 60,
                band: "Fair",
                kcal: 1500,
                protein: 55,
                carbs: 180,
                fat: 45,
                fibre: 20,
                vegetablesG: 200,
                visibleFat: 18,
            });
        });

        const stored = JSON.parse(localStorage.getItem("diet-specifix-meal-history"));
        expect(stored).toHaveLength(1);
        expect(stored[0].planName).toBe("Persist Plan");
    });
});



