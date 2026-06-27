/**
 * useMealHistory hook – Additional branch coverage tests
 * Covers: sync error recovery, logDay defaults, background upload failures
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

describe("useMealHistory – branch coverage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        useAuth.mockReturnValue({ user: null, isAuthenticated: false });
        fetchMealHistory.mockResolvedValue([]);
        upsertMealHistoryEntry.mockResolvedValue(undefined);
        deleteMealHistoryEntry.mockResolvedValue(undefined);
        clearMealHistory.mockResolvedValue(undefined);
    });

    it("logDay handles missing/null entryData fields with defaults", () => {
        const { result } = renderHook(() => useMealHistory());

        act(() => {
            // Intentionally pass minimal/missing data
            result.current.logDay({
                planName: "Minimal",
            });
        });

        const entry = result.current.history[0];
        expect(entry.score).toBe(0);
        expect(entry.band).toBe("");
        expect(entry.kcal).toBe(0);
        expect(entry.protein).toBe(0);
        expect(entry.carbs).toBe(0);
        expect(entry.fat).toBe(0);
        expect(entry.fibre).toBe(0);
        expect(entry.vegetablesG).toBe(0);
        expect(entry.visibleFat).toBe(0);
    });

    it("logDay sets syncStatus to error when upsert fails", async () => {
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        useAuth.mockReturnValue({ user: { id: "user-1" }, isAuthenticated: true });
        fetchMealHistory.mockResolvedValue([]);
        upsertMealHistoryEntry.mockRejectedValue(new Error("Sync failed"));

        const { result } = renderHook(() => useMealHistory());

        // Wait for initial load
        await waitFor(() => {
            expect(result.current.syncStatus).toBe("synced");
        });

        act(() => {
            result.current.logDay({
                planName: "Fail Plan",
                score: 70,
                band: "Good",
                kcal: 1800,
                protein: 60,
                carbs: 200,
                fat: 50,
                fibre: 25,
                vegetablesG: 250,
                visibleFat: 10,
            });
        });

        await waitFor(() => {
            expect(result.current.syncStatus).toBe("error");
        });

        errorSpy.mockRestore();
    });

    it("removeEntry sets syncStatus to error when deleteMealHistoryEntry fails", async () => {
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        useAuth.mockReturnValue({ user: { id: "user-1" }, isAuthenticated: true });
        fetchMealHistory.mockResolvedValue([]);
        deleteMealHistoryEntry.mockRejectedValue(new Error("Delete failed"));

        const stored = [{ id: "h1", date: "2024-01-01", score: 85 }];
        localStorage.setItem("diet-specifix-meal-history", JSON.stringify(stored));

        const { result } = renderHook(() => useMealHistory());

        await waitFor(() => {
            expect(result.current.syncStatus).toBe("synced");
        });

        act(() => {
            result.current.removeEntry("h1");
        });

        await waitFor(() => {
            expect(result.current.syncStatus).toBe("error");
        });

        errorSpy.mockRestore();
    });

    it("clearHistory sets syncStatus to error when clearMealHistory fails", async () => {
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        useAuth.mockReturnValue({ user: { id: "user-1" }, isAuthenticated: true });
        fetchMealHistory.mockResolvedValue([]);
        clearMealHistory.mockRejectedValue(new Error("Clear failed"));

        const { result } = renderHook(() => useMealHistory());

        await waitFor(() => {
            expect(result.current.syncStatus).toBe("synced");
        });

        act(() => {
            result.current.clearHistory();
        });

        await waitFor(() => {
            expect(result.current.syncStatus).toBe("error");
        });

        errorSpy.mockRestore();
    });

    it("does not sync removeEntry when not authenticated", () => {
        useAuth.mockReturnValue({ user: null, isAuthenticated: false });
        const stored = [{ id: "h1", date: "2024-01-01", score: 85 }];
        localStorage.setItem("diet-specifix-meal-history", JSON.stringify(stored));

        const { result } = renderHook(() => useMealHistory());

        act(() => {
            result.current.removeEntry("h1");
        });

        expect(deleteMealHistoryEntry).not.toHaveBeenCalled();
        expect(result.current.history).toHaveLength(0);
    });

    it("does not sync clearHistory when not authenticated", () => {
        useAuth.mockReturnValue({ user: null, isAuthenticated: false });
        const stored = [{ id: "h1", date: "2024-01-01", score: 85 }];
        localStorage.setItem("diet-specifix-meal-history", JSON.stringify(stored));

        const { result } = renderHook(() => useMealHistory());

        act(() => {
            result.current.clearHistory();
        });

        expect(clearMealHistory).not.toHaveBeenCalled();
        expect(result.current.history).toHaveLength(0);
    });

    it("background upload failure during merge logs error", async () => {
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        const localEntries = [{ id: "local-1", date: "2024-01-05", score: 70, planName: "Local" }];
        localStorage.setItem("diet-specifix-meal-history", JSON.stringify(localEntries));

        fetchMealHistory.mockResolvedValue([
            { id: "remote-1", log_date: "2024-01-03", plan_name: "Remote", score: 80, band: "Good", kcal: 2000, protein: 80, carbs: 250, fat: 60, fibre: 30, vegetables_g: 300, visible_fat: 15 },
        ]);
        upsertMealHistoryEntry.mockRejectedValue(new Error("Upload failed"));
        useAuth.mockReturnValue({ user: { id: "user-1" }, isAuthenticated: true });

        const { result } = renderHook(() => useMealHistory());

        await waitFor(() => {
            expect(result.current.syncStatus).toBe("synced");
        });

        // The merge should succeed even if background upload fails
        expect(result.current.history.length).toBe(2);

        // Give time for the background promise to settle
        await act(async () => {
            await new Promise((r) => setTimeout(r, 50));
        });

        expect(errorSpy).toHaveBeenCalledWith(
            "Failed to upload local meal history entry:",
            expect.any(Error)
        );
        errorSpy.mockRestore();
    });

    it("handles localStorage write failure in writeLocal gracefully", () => {
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        const originalSetItem = Storage.prototype.setItem;
        Storage.prototype.setItem = vi.fn(() => { throw new Error("QuotaExceeded"); });

        const { result } = renderHook(() => useMealHistory());

        act(() => {
            result.current.logDay({
                planName: "Quota Plan",
                score: 50,
                band: "Moderate",
                kcal: 1500,
                protein: 50,
                carbs: 180,
                fat: 40,
                fibre: 20,
                vegetablesG: 200,
                visibleFat: 10,
            });
        });

        // State should still update even if localStorage fails
        expect(result.current.history).toHaveLength(1);

        Storage.prototype.setItem = originalSetItem;
        errorSpy.mockRestore();
    });

    it("does not fetch from Supabase when user has no id", () => {
        useAuth.mockReturnValue({ user: {}, isAuthenticated: true });
        renderHook(() => useMealHistory());
        expect(fetchMealHistory).not.toHaveBeenCalled();
    });

    it("merge does not duplicate remote entries that also exist locally with same date", async () => {
        const sharedDate = "2024-01-03";
        const localEntries = [{ id: "local-1", date: sharedDate, score: 70, planName: "Local" }];
        localStorage.setItem("diet-specifix-meal-history", JSON.stringify(localEntries));

        fetchMealHistory.mockResolvedValue([
            { id: "remote-1", log_date: sharedDate, plan_name: "Remote", score: 80, band: "Good", kcal: 2000, protein: 80, carbs: 250, fat: 60, fibre: 30, vegetables_g: 300, visible_fat: 15 },
        ]);
        useAuth.mockReturnValue({ user: { id: "user-1" }, isAuthenticated: true });

        const { result } = renderHook(() => useMealHistory());

        await waitFor(() => {
            expect(result.current.syncStatus).toBe("synced");
        });

        // Should not duplicate — remote wins for same date
        expect(result.current.history.length).toBe(1);
        // The remote entry is the source of truth
        expect(result.current.history[0].planName).toBe("Remote");
    });
});

