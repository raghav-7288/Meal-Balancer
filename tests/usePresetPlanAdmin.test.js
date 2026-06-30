/**
 * usePresetPlanAdmin hook tests
 * Tests CRUD operations, meal editing, and state management
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

vi.mock("../src/services/presetPlanService", () => ({
    fetchAllPresetPlans: vi.fn(),
    upsertPresetPlan: vi.fn(),
    deletePresetPlan: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
    default: { success: vi.fn(), error: vi.fn() },
}));

import { fetchAllPresetPlans, upsertPresetPlan } from "../src/services/presetPlanService";
import toast from "react-hot-toast";
import { usePresetPlanAdmin } from "../src/hooks/usePresetPlanAdmin";

const MOCK_PLANS = [
    { id: "p1", name: "Plan A", meals: { Breakfast: [{ id: "item-1", foodId: "banana", foodName: "Banana", grams: 100, instructions: "Ripe", day: "Monday" }], Lunch: [] }, guidelines: "Stay healthy", displayOrder: 1, isActive: true },
    { id: "p2", name: "Plan B", meals: { Lunch: [] }, guidelines: "", displayOrder: 2, isActive: false },
];

describe("usePresetPlanAdmin", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        fetchAllPresetPlans.mockResolvedValue([...MOCK_PLANS.map(p => ({ ...p, meals: { ...p.meals } }))]);
    });

    // ─── Loading ─────────────────────────────────────────────────────
    it("starts in loading state", () => {
        fetchAllPresetPlans.mockImplementation(() => new Promise(() => {}));
        const { result } = renderHook(() => usePresetPlanAdmin());
        expect(result.current.isLoading).toBe(true);
        expect(result.current.plans).toEqual([]);
    });

    it("loads plans and sets first plan as active", async () => {
        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.plans).toHaveLength(2);
        expect(result.current.activePlanId).toBe("p1");
        expect(result.current.activePlan.name).toBe("Plan A");
    });

    it("handles load error", async () => {
        fetchAllPresetPlans.mockRejectedValue(new Error("DB down"));
        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.error).toBe("DB down");
        expect(result.current.plans).toEqual([]);
    });

    // ─── createPlan ──────────────────────────────────────────────────
    it("createPlan adds a new plan and sets it active", async () => {
        const newPlan = { id: "p3", name: "Plan C", meals: {}, guidelines: "", displayOrder: 3, isActive: true };
        upsertPresetPlan.mockResolvedValue(newPlan);

        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => { await result.current.createPlan("Plan C"); });

        expect(result.current.plans).toHaveLength(3);
        expect(result.current.activePlanId).toBe("p3");
        expect(toast.success).toHaveBeenCalledWith('Created "Plan C"');
    });

    it("createPlan shows error toast on empty name", async () => {
        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => { await result.current.createPlan(""); });

        expect(upsertPresetPlan).not.toHaveBeenCalled();
        expect(toast.error).toHaveBeenCalledWith("Plan name is required");
    });

    it("createPlan shows error toast on failure", async () => {
        upsertPresetPlan.mockRejectedValue(new Error("Insert failed"));

        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => { await result.current.createPlan("Bad Plan"); });

        expect(toast.error).toHaveBeenCalledWith("Insert failed");
    });

    // ─── savePlan ────────────────────────────────────────────────────
    it("savePlan updates the plan in state", async () => {
        const updated = { ...MOCK_PLANS[0], name: "Plan A Updated" };
        upsertPresetPlan.mockResolvedValue(updated);

        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => { await result.current.savePlan(updated); });

        expect(result.current.plans[0].name).toBe("Plan A Updated");
        expect(toast.success).toHaveBeenCalledWith('Saved "Plan A Updated"');
    });

    it("savePlan shows error toast on failure", async () => {
        upsertPresetPlan.mockRejectedValue(new Error("Save failed"));

        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => { await result.current.savePlan(MOCK_PLANS[0]); });

        expect(toast.error).toHaveBeenCalledWith("Save failed");
    });

    // ─── removePlan ──────────────────────────────────────────────────
    it("removePlan removes a plan from state and shows undo toast", async () => {
        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => { result.current.removePlan("p2"); });

        expect(result.current.plans).toHaveLength(1);
        expect(result.current.plans[0].id).toBe("p1");
        expect(result.current.deleteToast).not.toBeNull();
        expect(result.current.deleteToast.planName).toBe("Plan B");
    });

    it("removePlan switches active plan when deleting active plan", async () => {
        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.activePlanId).toBe("p1");

        act(() => { result.current.removePlan("p1"); });

        expect(result.current.plans).toHaveLength(1);
        expect(result.current.activePlanId).toBe("p2");
    });

    it("removePlan undo restores plan", async () => {
        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => { result.current.removePlan("p2"); });

        expect(result.current.plans).toHaveLength(1);
        expect(result.current.deleteToast).not.toBeNull();

        // Undo the delete
        act(() => { result.current.deleteToast.undoAction(); });

        expect(result.current.plans).toHaveLength(2);
        expect(result.current.deleteToast).toBeNull();
    });

    // ─── toggleActive ────────────────────────────────────────────────
    it("toggleActive flips isActive and saves", async () => {
        const toggled = { ...MOCK_PLANS[0], isActive: false };
        upsertPresetPlan.mockResolvedValue(toggled);

        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => { await result.current.toggleActive("p1"); });

        expect(result.current.plans[0].isActive).toBe(false);
        expect(toast.success).toHaveBeenCalledWith("Plan deactivated");
    });

    it("toggleActive activates an inactive plan", async () => {
        const toggled = { ...MOCK_PLANS[1], isActive: true };
        upsertPresetPlan.mockResolvedValue(toggled);

        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => { await result.current.toggleActive("p2"); });

        expect(result.current.plans[1].isActive).toBe(true);
        expect(toast.success).toHaveBeenCalledWith("Plan activated");
    });

    // ─── updatePlanField ─────────────────────────────────────────────
    it("updatePlanField updates name for active plan", async () => {
        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => { result.current.updatePlanField("name", "Renamed"); });

        expect(result.current.activePlan.name).toBe("Renamed");
    });

    it("updatePlanField updates guidelines for active plan", async () => {
        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => { result.current.updatePlanField("guidelines", "New guidelines"); });

        expect(result.current.activePlan.guidelines).toBe("New guidelines");
    });

    it("updatePlanField does nothing when no active plan", async () => {
        fetchAllPresetPlans.mockResolvedValue([]);
        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => { result.current.updatePlanField("name", "X"); });
        expect(result.current.activePlan).toBeNull();
    });

    // ─── addFood ─────────────────────────────────────────────────────
    it("addFood appends a new item to the active plan meal slot", async () => {
        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => {
            result.current.addFood("Lunch", "Steamed", [
                { foodId: "123", foodName: "Rice", grams: 200, foodGroupId: 2, foodGroup: "" }
            ]);
        });

        const lunchItems = result.current.activePlan.meals.Lunch;
        expect(lunchItems).toHaveLength(1);
        expect(lunchItems[0].foodId).toBe("123");
        expect(lunchItems[0].foodName).toBe("Rice");
        expect(lunchItems[0].grams).toBe(200);
        expect(lunchItems[0].instructions).toBe("Steamed");
        expect(lunchItems[0].day).toBe("Monday"); // default viewDay
    });

    it("addFood uses current viewDay", async () => {
        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => { result.current.setViewDay("Friday"); });
        act(() => {
            result.current.addFood("Dinner", "", [
                { foodId: "456", foodName: "Dal", grams: 150, foodGroupId: null, foodGroup: "" }
            ]);
        });

        const dinnerItems = result.current.activePlan.meals.Dinner;
        expect(dinnerItems[0].day).toBe("Friday");
    });

    it("addFood does nothing when no active plan", async () => {
        fetchAllPresetPlans.mockResolvedValue([]);
        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => {
            result.current.addFood("Lunch", "", [
                { foodId: "123", foodName: "Rice", grams: 200, foodGroupId: null, foodGroup: "" }
            ]);
        });
        expect(result.current.activePlan).toBeNull();
    });

    // ─── updateMealItem ──────────────────────────────────────────────
    it("updateMealItem patches grams and instructions", async () => {
        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => {
            result.current.updateMealItem("Breakfast", "item-1", { grams: 150, instructions: "Very ripe" });
        });

        const item = result.current.activePlan.meals.Breakfast[0];
        expect(item.grams).toBe(150);
        expect(item.instructions).toBe("Very ripe");
        expect(item.foodId).toBe("banana"); // unchanged
    });

    it("updateMealItem does nothing when no active plan", async () => {
        fetchAllPresetPlans.mockResolvedValue([]);
        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => { result.current.updateMealItem("Breakfast", "item-1", { grams: 50 }); });
        expect(result.current.activePlan).toBeNull();
    });

    // ─── removeMealItem ──────────────────────────────────────────────
    it("removeMealItem removes the item from the slot", async () => {
        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.activePlan.meals.Breakfast).toHaveLength(1);

        act(() => {
            result.current.removeMealItem("Breakfast", "item-1");
        });

        expect(result.current.activePlan.meals.Breakfast).toHaveLength(0);
    });

    it("removeMealItem does nothing when no active plan", async () => {
        fetchAllPresetPlans.mockResolvedValue([]);
        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => { result.current.removeMealItem("Breakfast", "item-1"); });
        expect(result.current.activePlan).toBeNull();
    });

    // ─── setActivePlanId ─────────────────────────────────────────────
    it("setActivePlanId switches the active plan", async () => {
        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => { result.current.setActivePlanId("p2"); });

        expect(result.current.activePlanId).toBe("p2");
        expect(result.current.activePlan.name).toBe("Plan B");
    });

    // ─── viewDay ─────────────────────────────────────────────────────
    it("defaults viewDay to Monday", async () => {
        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.viewDay).toBe("Monday");
    });

    it("setViewDay updates viewDay", async () => {
        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => { result.current.setViewDay("Wednesday"); });
        expect(result.current.viewDay).toBe("Wednesday");
    });

    // ─── reload ──────────────────────────────────────────────────────
    it("reload re-fetches plans from DB", async () => {
        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const freshPlans = [{ id: "p99", name: "Fresh", meals: {}, guidelines: "", displayOrder: 1, isActive: true }];
        fetchAllPresetPlans.mockResolvedValue(freshPlans);

        await act(async () => { await result.current.reload(); });

        expect(result.current.plans).toHaveLength(1);
        expect(result.current.plans[0].id).toBe("p99");
    });

    it("reload handles errors", async () => {
        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        fetchAllPresetPlans.mockRejectedValue(new Error("Reload failed"));

        await act(async () => { await result.current.reload(); });

        expect(result.current.error).toBe("Reload failed");
    });
});

