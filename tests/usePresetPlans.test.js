/**
 * usePresetPlans hook tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

vi.mock("../src/services/presetPlanService", () => ({
    fetchPresetPlans: vi.fn(),
}));

import { fetchPresetPlans } from "../src/services/presetPlanService";
import { usePresetPlans } from "../src/hooks/usePresetPlans";

describe("usePresetPlans", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("starts in loading state", () => {
        fetchPresetPlans.mockImplementation(() => new Promise(() => {}));
        const { result } = renderHook(() => usePresetPlans());
        expect(result.current.isLoading).toBe(true);
        expect(result.current.presetPlans).toEqual([]);
        expect(result.current.error).toBeNull();
    });

    it("loads preset plans successfully", async () => {
        const plans = [
            { id: "p1", name: "Weight Loss", meals: {} },
            { id: "p2", name: "Muscle Gain", meals: {} },
        ];
        fetchPresetPlans.mockResolvedValue(plans);

        const { result } = renderHook(() => usePresetPlans());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.presetPlans).toEqual(plans);
        expect(result.current.error).toBeNull();
    });

    it("handles null response from fetch", async () => {
        fetchPresetPlans.mockResolvedValue(null);

        const { result } = renderHook(() => usePresetPlans());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.presetPlans).toEqual([]);
    });

    it("handles fetch error", async () => {
        fetchPresetPlans.mockRejectedValue(new Error("Network error"));

        const { result } = renderHook(() => usePresetPlans());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.error).toBe("Network error");
        expect(result.current.presetPlans).toEqual([]);
    });

    it("does not update state after unmount (cancelled)", async () => {
        let resolvePromise;
        fetchPresetPlans.mockImplementation(() => new Promise((r) => { resolvePromise = r; }));

        const { result, unmount } = renderHook(() => usePresetPlans());
        
        unmount();
        resolvePromise([{ id: "p1", name: "Late Plan", meals: {} }]);

        // Should not throw or update after unmount
        expect(result.current.presetPlans).toEqual([]);
    });
});

