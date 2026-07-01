import { create } from "zustand";

/**
 * Zustand store for plan state management (#73).
 * Centralizes plan state that was previously prop-drilled through 4+ levels.
 * Components can import `usePlanStore` directly instead of receiving props.
 */
export const usePlanStore = create((set, get) => ({
    // ── State ──
    activePlanId: "",
    viewDay: "",
    planView: "preset", // "preset" | "user"
    nutrientLimits: {
        carbs: 300,
        protein: 60,
        fat: 65,
        sugar: 25,
        fibre: 30,
    },
    isAddingFood: false,
    copyModal: null,
    copyPlanName: "",
    newPlanName: "",
    deleteToast: null,
    guidelines: "",

    // ── Actions ──
    setActivePlanId: (id) => set({ activePlanId: id }),
    setViewDay: (day) => set({ viewDay: day }),
    setPlanView: (view) => set({ planView: view }),
    setNutrientLimits: (limits) =>
        set({
            nutrientLimits: typeof limits === "function" ? limits(get().nutrientLimits) : limits,
        }),
    setIsAddingFood: (val) => set({ isAddingFood: val }),
    setCopyModal: (modal) => set({ copyModal: modal }),
    setCopyPlanName: (name) => set({ copyPlanName: name }),
    setNewPlanName: (name) => set({ newPlanName: name }),
    setDeleteToast: (toast) => set({ deleteToast: toast }),
    setGuidelines: (g) => set({ guidelines: g }),

    // ── Batch update (e.g., when switching plans) ──
    batchUpdate: (partial) => set(partial),
}));
