/**
 * planStore (Zustand) tests
 */
import { describe, it, expect, beforeEach } from "vitest";
import { usePlanStore } from "../src/stores/planStore";

describe("planStore", () => {
    beforeEach(() => {
        // Reset store to initial state
        usePlanStore.setState({
            activePlanId: "",
            viewDay: "",
            planView: "preset",
            nutrientLimits: { carbs: 300, protein: 60, fat: 65, sugar: 25, fibre: 30 },
            isAddingFood: false,
            copyModal: null,
            copyPlanName: "",
            newPlanName: "",
            deleteToast: null,
            guidelines: "",
        });
    });

    it("has correct initial state", () => {
        const state = usePlanStore.getState();
        expect(state.activePlanId).toBe("");
        expect(state.viewDay).toBe("");
        expect(state.planView).toBe("preset");
        expect(state.isAddingFood).toBe(false);
        expect(state.copyModal).toBeNull();
        expect(state.deleteToast).toBeNull();
        expect(state.guidelines).toBe("");
        expect(state.nutrientLimits).toEqual({
            carbs: 300, protein: 60, fat: 65, sugar: 25, fibre: 30,
        });
    });

    it("setActivePlanId updates activePlanId", () => {
        usePlanStore.getState().setActivePlanId("plan-123");
        expect(usePlanStore.getState().activePlanId).toBe("plan-123");
    });

    it("setViewDay updates viewDay", () => {
        usePlanStore.getState().setViewDay("Tuesday");
        expect(usePlanStore.getState().viewDay).toBe("Tuesday");
    });

    it("setPlanView updates planView", () => {
        usePlanStore.getState().setPlanView("user");
        expect(usePlanStore.getState().planView).toBe("user");
    });

    it("setNutrientLimits with object replaces limits", () => {
        const newLimits = { carbs: 200, protein: 80, fat: 50, sugar: 20, fibre: 25 };
        usePlanStore.getState().setNutrientLimits(newLimits);
        expect(usePlanStore.getState().nutrientLimits).toEqual(newLimits);
    });

    it("setNutrientLimits with function updates limits", () => {
        usePlanStore.getState().setNutrientLimits((prev) => ({ ...prev, carbs: 250 }));
        expect(usePlanStore.getState().nutrientLimits.carbs).toBe(250);
        expect(usePlanStore.getState().nutrientLimits.protein).toBe(60);
    });

    it("setIsAddingFood updates flag", () => {
        usePlanStore.getState().setIsAddingFood(true);
        expect(usePlanStore.getState().isAddingFood).toBe(true);
    });

    it("setCopyModal sets modal data", () => {
        const plan = { id: "p1", name: "Plan A" };
        usePlanStore.getState().setCopyModal(plan);
        expect(usePlanStore.getState().copyModal).toEqual(plan);
    });

    it("setCopyPlanName updates name", () => {
        usePlanStore.getState().setCopyPlanName("My Copy");
        expect(usePlanStore.getState().copyPlanName).toBe("My Copy");
    });

    it("setNewPlanName updates name", () => {
        usePlanStore.getState().setNewPlanName("New Plan");
        expect(usePlanStore.getState().newPlanName).toBe("New Plan");
    });

    it("setDeleteToast sets toast data", () => {
        const toast = { planName: "Deleted Plan", undoAction: () => {} };
        usePlanStore.getState().setDeleteToast(toast);
        expect(usePlanStore.getState().deleteToast).toEqual(toast);
    });

    it("setGuidelines updates guidelines", () => {
        usePlanStore.getState().setGuidelines("Eat healthy foods");
        expect(usePlanStore.getState().guidelines).toBe("Eat healthy foods");
    });

    it("batchUpdate updates multiple fields at once", () => {
        usePlanStore.getState().batchUpdate({
            activePlanId: "batch-plan",
            viewDay: "Friday",
            planView: "user",
            guidelines: "Batch guidelines",
        });

        const state = usePlanStore.getState();
        expect(state.activePlanId).toBe("batch-plan");
        expect(state.viewDay).toBe("Friday");
        expect(state.planView).toBe("user");
        expect(state.guidelines).toBe("Batch guidelines");
    });
});

