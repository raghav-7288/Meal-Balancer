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

import { fetchAllPresetPlans, upsertPresetPlan, deletePresetPlan } from "../src/services/presetPlanService";
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
        expect(upsertPresetPlan).toHaveBeenCalledWith(expect.objectContaining({ mealTimes: {} }));
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
        deletePresetPlan.mockResolvedValue();
        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => { await result.current.removePlan("p2"); });

        expect(result.current.plans).toHaveLength(1);
        expect(result.current.plans[0].id).toBe("p1");
        expect(result.current.deleteToast).not.toBeNull();
        expect(result.current.deleteToast.planName).toBe("Plan B");
        expect(deletePresetPlan).toHaveBeenCalledWith("p2");
    });

    it("removePlan switches active plan when deleting active plan", async () => {
        deletePresetPlan.mockResolvedValue();
        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.activePlanId).toBe("p1");

        await act(async () => { await result.current.removePlan("p1"); });

        expect(result.current.plans).toHaveLength(1);
        expect(result.current.activePlanId).toBe("p2");
    });

    it("removePlan undo restores plan by re-inserting into DB", async () => {
        deletePresetPlan.mockResolvedValue();
        upsertPresetPlan.mockImplementation(async (plan) => plan);
        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => { await result.current.removePlan("p2"); });

        expect(result.current.plans).toHaveLength(1);
        expect(result.current.deleteToast).not.toBeNull();

        // Undo the delete — should re-insert into DB
        await act(async () => { await result.current.deleteToast.undoAction(); });

        expect(result.current.plans).toHaveLength(2);
        expect(result.current.deleteToast).toBeNull();
        expect(upsertPresetPlan).toHaveBeenCalled();
    });

    it("removePlan restores plan to local state when DB delete fails", async () => {
        deletePresetPlan.mockRejectedValue(new Error("DB error"));
        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => { await result.current.removePlan("p2"); });

        // Plan should be restored since DB delete failed
        expect(result.current.plans).toHaveLength(2);
        expect(toast.error).toHaveBeenCalledWith("Failed to delete plan from database");
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
            result.current.addFood("Lunch", "Lunch Special", "Steamed", [
                { foodId: "123", foodName: "Rice", grams: 200, foodGroupId: 2, foodGroup: "" }
            ]);
        });

        const lunchItems = result.current.activePlan.meals.Lunch;
        expect(lunchItems).toHaveLength(1);
        expect(lunchItems[0].foodId).toBe("123");
        expect(lunchItems[0].foodName).toBe("Rice");
        expect(lunchItems[0].grams).toBe(200);
        expect(lunchItems[0].menu).toBe("Lunch Special");
        expect(lunchItems[0].instructions).toBe("Steamed");
        expect(lunchItems[0].day).toBe("Monday"); // default viewDay
    });

    it("addFood uses current viewDay", async () => {
        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => { result.current.setViewDay("Friday"); });
        act(() => {
            result.current.addFood("Dinner", "", "", [
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
            result.current.addFood("Lunch", "", "", [
                { foodId: "123", foodName: "Rice", grams: 200, foodGroupId: null, foodGroup: "" }
            ]);
        });
        expect(result.current.activePlan).toBeNull();
    });

    // ─── addFood: custom foods (database equivalent) ─────────────────
    it("addFood propagates isCustom/equivalentFoodName onto a single custom item", async () => {
        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => {
            result.current.addFood("Lunch", "Homemade", "", [
                {
                    // foodId points at the database "equivalent" so nutrition reuses the pipeline
                    foodId: "999",
                    foodName: "Grandma's dal",
                    grams: 150,
                    foodGroupId: 5,
                    foodGroup: "pulses",
                    isCustom: true,
                    equivalentFoodName: "Dal, cooked",
                },
            ]);
        });

        const item = result.current.activePlan.meals.Lunch[0];
        expect(item.foodId).toBe("999");
        expect(item.foodName).toBe("Grandma's dal");
        expect(item.menu).toBe("Homemade");
        expect(item.isCustom).toBe(true);
        expect(item.equivalentFoodName).toBe("Dal, cooked");
    });

    it("addFood does not add isCustom to regular (non-custom) items", async () => {
        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => {
            result.current.addFood("Lunch", "", "", [
                { foodId: "123", foodName: "Rice", grams: 200, foodGroupId: 2, foodGroup: "cereals" },
            ]);
        });

        const item = result.current.activePlan.meals.Lunch[0];
        expect(item).not.toHaveProperty("isCustom");
        expect(item).not.toHaveProperty("equivalentFoodName");
    });

    it("addFood preserves per-ingredient isCustom flags in a composite item", async () => {
        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => {
            result.current.addFood("Dinner", "Mixed bowl", "", [
                { foodId: "123", foodName: "Rice", grams: 100, foodGroupId: 2, foodGroup: "cereals" },
                {
                    foodId: "999",
                    foodName: "Grandma's dal",
                    grams: 80,
                    foodGroupId: 5,
                    foodGroup: "pulses",
                    isCustom: true,
                    equivalentFoodName: "Dal, cooked",
                },
            ]);
        });

        const item = result.current.activePlan.meals.Dinner[0];
        expect(item.foodId).toBe("composite");
        expect(item.menu).toBe("Mixed bowl");
        expect(item.ingredients).toHaveLength(2);
        // Regular ingredient — no custom flags
        expect(item.ingredients[0]).not.toHaveProperty("isCustom");
        // Custom ingredient — flags preserved
        expect(item.ingredients[1].isCustom).toBe(true);
        expect(item.ingredients[1].equivalentFoodName).toBe("Dal, cooked");
    });

    it("addFood stores menu and instructions as separate fields", async () => {
        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => {
            result.current.addFood("Lunch", "Veg Thali", "Serve hot", [
                { foodId: "123", foodName: "Rice", grams: 200, foodGroupId: 2, foodGroup: "cereals" },
            ]);
        });

        const item = result.current.activePlan.meals.Lunch[0];
        expect(item.menu).toBe("Veg Thali");
        expect(item.instructions).toBe("Serve hot");
        // Food name stays the food (not the menu) for single items
        expect(item.foodName).toBe("Rice");
    });

    // ─── updateMealTime ──────────────────────────────────────────────
    it("updateMealTime sets the clock-time range for a meal slot and marks dirty", async () => {
        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => {
            result.current.updateMealTime("Breakfast", { start: "08:00", end: "10:00" });
        });

        expect(result.current.activePlan.mealTimes.Breakfast).toEqual({
            start: "08:00",
            end: "10:00",
        });
        expect(result.current.isDirty).toBe(true);
    });

    it("updateMealTime preserves other slot times", async () => {
        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => {
            result.current.updateMealTime("Breakfast", { start: "08:00", end: "10:00" });
        });
        act(() => {
            result.current.updateMealTime("Lunch", { start: "13:00", end: "14:00" });
        });

        expect(result.current.activePlan.mealTimes).toEqual({
            Breakfast: { start: "08:00", end: "10:00" },
            Lunch: { start: "13:00", end: "14:00" },
        });
    });

    it("updateMealTime does nothing when no active plan", async () => {
        fetchAllPresetPlans.mockResolvedValue([]);
        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => { result.current.updateMealTime("Breakfast", "08:00"); });
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

    // ─── copyMealItemToDays ──────────────────────────────────────────
    it("copyMealItemToDays clones an item to selected days with fresh ids and marks dirty", async () => {
        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => {
            result.current.copyMealItemToDays("Breakfast", "item-1", ["Tuesday", "Wednesday"]);
        });

        const items = result.current.activePlan.meals.Breakfast;
        expect(items).toHaveLength(3); // original + 2 copies
        const copies = items.filter((i) => i.id !== "item-1");
        expect(copies.map((c) => c.day).sort()).toEqual(["Tuesday", "Wednesday"]);
        expect(copies.every((c) => c.id && c.id !== "item-1")).toBe(true);
        expect(copies.every((c) => c.foodId === "banana" && c.grams === 100)).toBe(true);
        expect(result.current.isDirty).toBe(true);
    });

    it("copyMealItemToDays skips the source day", async () => {
        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => {
            result.current.copyMealItemToDays("Breakfast", "item-1", ["Monday", "Thursday"]);
        });

        const items = result.current.activePlan.meals.Breakfast;
        expect(items).toHaveLength(2); // only Thursday added
        expect(items.filter((i) => i.day === "Monday")).toHaveLength(1);
        expect(items.filter((i) => i.day === "Thursday")).toHaveLength(1);
    });

    it("copyMealItemToDays de-dupes days that already have an identical item", async () => {
        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => {
            result.current.copyMealItemToDays("Breakfast", "item-1", ["Tuesday"]);
        });
        expect(result.current.activePlan.meals.Breakfast).toHaveLength(2);

        // Re-run for Tuesday + Wednesday → Tuesday skipped, Wednesday added
        act(() => {
            result.current.copyMealItemToDays("Breakfast", "item-1", ["Tuesday", "Wednesday"]);
        });
        const items = result.current.activePlan.meals.Breakfast;
        expect(items).toHaveLength(3);
        expect(items.filter((i) => i.day === "Tuesday")).toHaveLength(1);
        expect(items.filter((i) => i.day === "Wednesday")).toHaveLength(1);
    });

    it("copyMealItemToDays clones composite ingredients into a new array", async () => {
        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        // Build a composite item on Monday (default viewDay)
        act(() => {
            result.current.addFood("Lunch", "Mixed bowl", "", [
                { foodId: "1", foodName: "Rice", grams: 100, foodGroupId: 2, foodGroup: "cereals" },
                { foodId: "2", foodName: "Dal", grams: 80, foodGroupId: 5, foodGroup: "pulses" },
            ]);
        });
        const source = result.current.activePlan.meals.Lunch[0];

        act(() => {
            result.current.copyMealItemToDays("Lunch", source.id, ["Sunday"]);
        });

        const copy = result.current.activePlan.meals.Lunch.find((i) => i.day === "Sunday");
        expect(copy).toBeTruthy();
        expect(copy.id).not.toBe(source.id);
        expect(copy.ingredients).toHaveLength(2);
        expect(copy.ingredients).not.toBe(source.ingredients); // new array reference
        expect(copy.ingredients[0]).not.toBe(source.ingredients[0]); // new object reference
    });

    it("copyMealItemToDays does nothing when there is no active plan", async () => {
        fetchAllPresetPlans.mockResolvedValue([]);
        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => { result.current.copyMealItemToDays("Breakfast", "item-1", ["Tuesday"]); });
        expect(result.current.activePlan).toBeNull();
    });

    it("copyMealItemToDays does nothing for empty target days or unknown item", async () => {
        const { result } = renderHook(() => usePresetPlanAdmin());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => { result.current.copyMealItemToDays("Breakfast", "item-1", []); });
        expect(result.current.activePlan.meals.Breakfast).toHaveLength(1);

        act(() => { result.current.copyMealItemToDays("Breakfast", "missing-id", ["Tuesday"]); });
        expect(result.current.activePlan.meals.Breakfast).toHaveLength(1);
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

