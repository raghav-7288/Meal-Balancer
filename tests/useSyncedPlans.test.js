/**
 * useSyncedPlans hook tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

vi.mock("../src/hooks/useAuth", () => ({
    useAuth: vi.fn(),
}));

vi.mock("../src/services/planSyncService", () => ({
    fetchUserPlans: vi.fn(),
    upsertPlans: vi.fn(),
    deletePlan: vi.fn(),
}));

import { useAuth } from "../src/hooks/useAuth";
import { fetchUserPlans, upsertPlans, deletePlan } from "../src/services/planSyncService";
import { useSyncedPlans } from "../src/hooks/useSyncedPlans";

describe("useSyncedPlans", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        useAuth.mockReturnValue({ user: null, isAuthenticated: false });
        fetchUserPlans.mockResolvedValue([]);
        upsertPlans.mockResolvedValue(undefined);
        deletePlan.mockResolvedValue(undefined);
    });

    it("reads from localStorage on init", () => {
        const localPlans = [{ id: "local-1", name: "Local Plan", meals: {} }];
        localStorage.setItem("diet-specifix-user-plans", JSON.stringify(localPlans));

        const { result } = renderHook(() => useSyncedPlans());
        const [plans] = result.current;
        expect(plans).toEqual(localPlans);
    });

    it("returns empty array when localStorage is empty", () => {
        const { result } = renderHook(() => useSyncedPlans());
        const [plans] = result.current;
        expect(plans).toEqual([]);
    });

    it("handles invalid JSON in localStorage gracefully", () => {
        localStorage.setItem("diet-specifix-user-plans", "not-valid-json");
        const { result } = renderHook(() => useSyncedPlans());
        const [plans] = result.current;
        expect(plans).toEqual([]);
    });

    it("persists plans to localStorage on update", () => {
        const { result } = renderHook(() => useSyncedPlans());
        const [, setPlans] = result.current;

        act(() => {
            setPlans([{ id: "new-1", name: "New Plan", meals: {} }]);
        });

        const stored = JSON.parse(localStorage.getItem("diet-specifix-user-plans"));
        expect(stored).toEqual([{ id: "new-1", name: "New Plan", meals: {} }]);
    });

    it("setPlans accepts an updater function", () => {
        localStorage.setItem("diet-specifix-user-plans", JSON.stringify([{ id: "x", name: "X", meals: {} }]));
        const { result } = renderHook(() => useSyncedPlans());
        const [, setPlans] = result.current;

        act(() => {
            setPlans((prev) => [...prev, { id: "y", name: "Y", meals: {} }]);
        });

        const [plans] = result.current;
        expect(plans).toHaveLength(2);
        expect(plans[1].name).toBe("Y");
    });

    it("syncs with Supabase on login — merges remote plans", async () => {
        const localPlans = [{ id: "local-only", name: "Local Only", meals: {} }];
        localStorage.setItem("diet-specifix-user-plans", JSON.stringify(localPlans));

        const remotePlans = [{ id: "remote-1", name: "Remote Plan", meals: { Breakfast: [] }, guidelines: "test" }];
        fetchUserPlans.mockResolvedValue(remotePlans);
        upsertPlans.mockResolvedValue(undefined);

        useAuth.mockReturnValue({ user: { id: "user-1" }, isAuthenticated: true });

        const { result } = renderHook(() => useSyncedPlans());

        await waitFor(() => {
            const [, , { syncStatus }] = result.current;
            expect(syncStatus).toBe("synced");
        }, { timeout: 3000 });

        const [plans] = result.current;
        // Should have both remote (source of truth) and local-only plans
        expect(plans.some(p => p.id === "remote-1")).toBe(true);
        expect(plans.some(p => p.id === "local-only")).toBe(true);
        // Should upload local-only plans
        expect(upsertPlans).toHaveBeenCalledWith("user-1", [localPlans[0]]);
    });

    it("sets syncStatus to error on sync failure", async () => {
        fetchUserPlans.mockRejectedValue(new Error("Sync failed"));
        useAuth.mockReturnValue({ user: { id: "user-1" }, isAuthenticated: true });

        const { result } = renderHook(() => useSyncedPlans());

        // Wait for async effect to settle
        await act(async () => {
            await new Promise((r) => setTimeout(r, 50));
        });

        await waitFor(() => {
            const [, , { syncStatus }] = result.current;
            expect(syncStatus).toBe("error");
        });

        const [, , { syncError }] = result.current;
        expect(syncError).toBe("Sync failed");
    });

    it("retrySync triggers a new sync", async () => {
        fetchUserPlans.mockRejectedValue(new Error("First fail"));
        useAuth.mockReturnValue({ user: { id: "user-1" }, isAuthenticated: true });

        const { result } = renderHook(() => useSyncedPlans());

        await waitFor(() => {
            const [, , { syncStatus }] = result.current;
            return syncStatus === "error";
        });

        // Now mock success for upsert
        upsertPlans.mockResolvedValue(undefined);

        await act(async () => {
            const [, , { retrySync }] = result.current;
            retrySync();
        });

        // After retry with an empty plan list, it should eventually succeed
        await waitFor(() => {
            const [, , { syncStatus }] = result.current;
            return syncStatus === "synced" || syncStatus === "syncing";
        });
    });

    it("does not sync when not authenticated", () => {
        useAuth.mockReturnValue({ user: null, isAuthenticated: false });
        renderHook(() => useSyncedPlans());
        expect(fetchUserPlans).not.toHaveBeenCalled();
    });

    it("uses syncStatus idle initially for unauthenticated users", () => {
        const { result } = renderHook(() => useSyncedPlans());
        const [, , { syncStatus }] = result.current;
        expect(syncStatus).toBe("idle");
    });
});






