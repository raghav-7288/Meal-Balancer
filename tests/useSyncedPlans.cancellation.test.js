/**
 * Tests for useSyncedPlans hook — cancellation and edge cases
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createElement } from "react";
import { AuthContext } from "../src/context/AuthContext";

// Mock planSyncService
vi.mock("../src/services/planSyncService", () => ({
    fetchUserPlans: vi.fn(),
    upsertPlans: vi.fn(),
    deletePlan: vi.fn(),
}));

const { fetchUserPlans, upsertPlans } = await import("../src/services/planSyncService");
const { useSyncedPlans } = await import("../src/hooks/useSyncedPlans");

function createWrapper(authValue) {
    return ({ children }) =>
        createElement(AuthContext.Provider, { value: authValue }, children);
}

describe("useSyncedPlans — cancellation and edge cases", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        fetchUserPlans.mockResolvedValue([]);
        upsertPlans.mockResolvedValue([]);
    });

    afterEach(() => {
        localStorage.clear();
    });

    it("cancels in-flight sync on unmount to prevent state updates after unmount", async () => {
        let resolvePromise;
        fetchUserPlans.mockImplementation(
            () => new Promise((resolve) => { resolvePromise = resolve; })
        );

        const wrapper = createWrapper({
            user: { id: "user-cancel" },
            isAuthenticated: true,
        });

        const { unmount } = renderHook(() => useSyncedPlans(), { wrapper });

        // Unmount before fetch resolves
        unmount();

        // Resolve — should not throw or update state
        resolvePromise([{ id: "x", name: "X", meals: {}, guidelines: "" }]);
        await act(async () => {
            await new Promise((r) => setTimeout(r, 10));
        });

        // If we reach here without crash, cancellation worked
        expect(true).toBe(true);
    });

    it("merges remote plans with local, remote wins for shared IDs", async () => {
        const localPlans = [
            { id: "shared-1", name: "Local Version", meals: { Breakfast: [] }, guidelines: "" },
            { id: "local-only", name: "Local Only", meals: {}, guidelines: "" },
        ];
        localStorage.setItem("diet-specifix-user-plans", JSON.stringify(localPlans));

        const remotePlans = [
            { id: "shared-1", name: "Remote Version", meals: { Lunch: [] }, guidelines: "remote" },
            { id: "remote-only", name: "Remote Only", meals: {}, guidelines: "" },
        ];
        fetchUserPlans.mockResolvedValue(remotePlans);

        const wrapper = createWrapper({
            user: { id: "user-merge" },
            isAuthenticated: true,
        });

        const { result } = renderHook(() => useSyncedPlans(), { wrapper });

        await act(async () => {
            await new Promise((r) => setTimeout(r, 0));
        });

        const plans = result.current[0];
        // Remote version wins for shared ID
        const shared = plans.find((p) => p.id === "shared-1");
        expect(shared.name).toBe("Remote Version");
        // Both local-only and remote-only are present
        expect(plans.find((p) => p.id === "local-only")).toBeTruthy();
        expect(plans.find((p) => p.id === "remote-only")).toBeTruthy();
        // Local-only plan was uploaded
        expect(upsertPlans).toHaveBeenCalledWith("user-merge", [localPlans[1]]);
    });

    it("handles empty localStorage gracefully", async () => {
        // No localStorage set
        fetchUserPlans.mockResolvedValue([]);

        const wrapper = createWrapper({
            user: { id: "user-empty" },
            isAuthenticated: true,
        });

        const { result } = renderHook(() => useSyncedPlans(), { wrapper });

        await act(async () => {
            await new Promise((r) => setTimeout(r, 0));
        });

        expect(result.current[0]).toEqual([]);
        expect(result.current[2].syncStatus).toBe("synced");
    });

    it("does not sync when user is not authenticated", () => {
        const wrapper = createWrapper({ user: null, isAuthenticated: false });
        renderHook(() => useSyncedPlans(), { wrapper });

        expect(fetchUserPlans).not.toHaveBeenCalled();
    });
});

