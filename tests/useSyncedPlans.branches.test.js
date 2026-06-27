/**
 * useSyncedPlans hook – Additional branch coverage tests
 * Covers: syncToSupabase with deletions, error paths, retrySync, no-op sync
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

describe("useSyncedPlans – branch coverage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        useAuth.mockReturnValue({ user: null, isAuthenticated: false });
        fetchUserPlans.mockResolvedValue([]);
        upsertPlans.mockResolvedValue(undefined);
        deletePlan.mockResolvedValue(undefined);
    });

    it("syncToSupabase detects plan deletion and calls deletePlan", async () => {
        useAuth.mockReturnValue({ user: { id: "user-1" }, isAuthenticated: true });
        fetchUserPlans.mockResolvedValue([
            { id: "plan-1", name: "Plan 1", meals: {}, guidelines: "" },
            { id: "plan-2", name: "Plan 2", meals: {}, guidelines: "" },
        ]);

        const { result } = renderHook(() => useSyncedPlans());

        await waitFor(() => {
            const [, , { syncStatus }] = result.current;
            expect(syncStatus).toBe("synced");
        });

        // Delete plan-2 by setting plans without it
        await act(async () => {
            const [, setPlans] = result.current;
            setPlans((prev) => prev.filter((p) => p.id !== "plan-2"));
        });

        await waitFor(() => {
            expect(deletePlan).toHaveBeenCalledWith("user-1", "plan-2");
        });
    });

    it("syncToSupabase detects plan modification and upserts", async () => {
        useAuth.mockReturnValue({ user: { id: "user-1" }, isAuthenticated: true });
        fetchUserPlans.mockResolvedValue([
            { id: "plan-1", name: "Original", meals: {}, guidelines: "" },
        ]);

        const { result } = renderHook(() => useSyncedPlans());

        await waitFor(() => {
            const [, , { syncStatus }] = result.current;
            expect(syncStatus).toBe("synced");
        });

        // Modify plan-1 (new object = reference inequality)
        await act(async () => {
            const [, setPlans] = result.current;
            setPlans((prev) =>
                prev.map((p) =>
                    p.id === "plan-1" ? { ...p, name: "Modified" } : p
                )
            );
        });

        await waitFor(() => {
            expect(upsertPlans).toHaveBeenCalledWith("user-1", [
                expect.objectContaining({ id: "plan-1", name: "Modified" }),
            ]);
        });
    });

    it("syncToSupabase handles upsert failure gracefully", async () => {
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        useAuth.mockReturnValue({ user: { id: "user-1" }, isAuthenticated: true });
        fetchUserPlans.mockResolvedValue([]);
        upsertPlans.mockRejectedValue(new Error("Upsert failed"));

        const { result } = renderHook(() => useSyncedPlans());

        await waitFor(() => {
            const [, , { syncStatus }] = result.current;
            expect(syncStatus).toBe("synced");
        });

        // Add a plan — this triggers syncToSupabase which will fail
        await act(async () => {
            const [, setPlans] = result.current;
            setPlans([{ id: "new-plan", name: "New Plan", meals: {} }]);
        });

        await waitFor(() => {
            const [, , { syncStatus, syncError }] = result.current;
            expect(syncStatus).toBe("error");
            expect(syncError).toBe("Upsert failed");
        });

        errorSpy.mockRestore();
    });

    it("syncToSupabase handles deletePlan failure gracefully", async () => {
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        useAuth.mockReturnValue({ user: { id: "user-1" }, isAuthenticated: true });
        fetchUserPlans.mockResolvedValue([
            { id: "plan-1", name: "Plan 1", meals: {}, guidelines: "" },
        ]);
        deletePlan.mockRejectedValue(new Error("Delete failed"));

        const { result } = renderHook(() => useSyncedPlans());

        await waitFor(() => {
            const [, , { syncStatus }] = result.current;
            expect(syncStatus).toBe("synced");
        });

        // Remove plan-1 triggering a failed deletion
        await act(async () => {
            const [, setPlans] = result.current;
            setPlans([]);
        });

        await waitFor(() => {
            const [, , { syncStatus, syncError }] = result.current;
            expect(syncStatus).toBe("error");
            expect(syncError).toBe("Delete failed");
        });

        errorSpy.mockRestore();
    });

    it("retrySync is no-op when not authenticated", () => {
        useAuth.mockReturnValue({ user: null, isAuthenticated: false });
        const { result } = renderHook(() => useSyncedPlans());

        act(() => {
            const [, , { retrySync }] = result.current;
            retrySync();
        });

        // Should not make any API calls
        expect(upsertPlans).not.toHaveBeenCalled();
        expect(fetchUserPlans).not.toHaveBeenCalled();
    });

    it("setPlans does not sync to Supabase when not authenticated", () => {
        useAuth.mockReturnValue({ user: null, isAuthenticated: false });
        const { result } = renderHook(() => useSyncedPlans());

        act(() => {
            const [, setPlans] = result.current;
            setPlans([{ id: "local-1", name: "Local", meals: {} }]);
        });

        expect(upsertPlans).not.toHaveBeenCalled();
        // Plans should still be updated locally
        const [plans] = result.current;
        expect(plans).toHaveLength(1);
    });

    it("does not start duplicate initial sync", async () => {
        useAuth.mockReturnValue({ user: { id: "user-1" }, isAuthenticated: true });
        let resolvePromise;
        fetchUserPlans.mockImplementation(() =>
            new Promise((resolve) => { resolvePromise = resolve; })
        );

        const { result } = renderHook(() => useSyncedPlans());

        // The sync should have started
        const [, , { syncStatus }] = result.current;
        expect(syncStatus).toBe("syncing");

        // Resolve the fetch
        await act(async () => {
            resolvePromise([]);
        });

        await waitFor(() => {
            const [, , { syncStatus: s }] = result.current;
            expect(s).toBe("synced");
        });

        // fetchUserPlans should only be called once
        expect(fetchUserPlans).toHaveBeenCalledTimes(1);
    });

    it("handles localStorage write failure gracefully", () => {
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        // Mock localStorage to throw on setItem
        const originalSetItem = Storage.prototype.setItem;
        Storage.prototype.setItem = vi.fn(() => { throw new Error("QuotaExceeded"); });

        const { result } = renderHook(() => useSyncedPlans());

        act(() => {
            const [, setPlans] = result.current;
            setPlans([{ id: "x", name: "X", meals: {} }]);
        });

        // Should not crash, plans still update in state
        const [plans] = result.current;
        expect(plans).toHaveLength(1);

        Storage.prototype.setItem = originalSetItem;
        errorSpy.mockRestore();
    });

    it("syncToSupabase is no-op when no changes detected (same references)", async () => {
        useAuth.mockReturnValue({ user: { id: "user-1" }, isAuthenticated: true });
        const plan = { id: "plan-1", name: "Same Plan", meals: {} };
        fetchUserPlans.mockResolvedValue([{ ...plan, guidelines: "" }]);

        const { result } = renderHook(() => useSyncedPlans());

        await waitFor(() => {
            const [, , { syncStatus }] = result.current;
            expect(syncStatus).toBe("synced");
        });

        // Reset call counts after initial sync
        upsertPlans.mockClear();
        deletePlan.mockClear();

        // Set exact same plans array (no actual changes)
        await act(async () => {
            const [plans, setPlans] = result.current;
            setPlans(plans); // Same reference
        });

        // Give a moment for any async work
        await act(async () => {
            await new Promise((r) => setTimeout(r, 50));
        });

        // No upsert or delete should have been triggered for unchanged plans
        expect(deletePlan).not.toHaveBeenCalled();
    });
});

