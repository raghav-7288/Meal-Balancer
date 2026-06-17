function createPlan(name, meals) {
    return {
        id: crypto.randomUUID(),
        name,
        meals,
    };
}

export const PRESET_PLANS = [
    createPlan("Balanced office day", {
        Breakfast: [
            { id: crypto.randomUUID(), foodId: "banana", grams: 100 },
            { id: crypto.randomUUID(), foodId: "curd", grams: 150 },
            { id: crypto.randomUUID(), foodId: "roti", grams: 60 },
        ],
        Lunch: [
            { id: crypto.randomUUID(), foodId: "dal", grams: 150 },
            { id: crypto.randomUUID(), foodId: "mixedveg", grams: 150 },
            { id: crypto.randomUUID(), foodId: "roti", grams: 60 },
        ],
        Dinner: [
            { id: crypto.randomUUID(), foodId: "rice", grams: 150 },
            { id: crypto.randomUUID(), foodId: "egg", grams: 50 },
            { id: crypto.randomUUID(), foodId: "mixedveg", grams: 100 },
        ],
        Snacks: [{ id: crypto.randomUUID(), foodId: "banana", grams: 100 }],
    }),
    createPlan("Cereal-heavy pattern", {
        Breakfast: [{ id: crypto.randomUUID(), foodId: "rice", grams: 250 }],
        Lunch: [
            { id: crypto.randomUUID(), foodId: "rice", grams: 300 },
            { id: crypto.randomUUID(), foodId: "roti", grams: 60 },
        ],
        Dinner: [
            { id: crypto.randomUUID(), foodId: "rice", grams: 200 },
            { id: crypto.randomUUID(), foodId: "roti", grams: 60 },
        ],
        Snacks: [{ id: crypto.randomUUID(), foodId: "banana", grams: 100 }],
    }),
    createPlan("High-protein day", {
        Breakfast: [
            { id: crypto.randomUUID(), foodId: "egg", grams: 100 },
            { id: crypto.randomUUID(), foodId: "curd", grams: 200 },
            { id: crypto.randomUUID(), foodId: "banana", grams: 100 },
        ],
        Lunch: [
            { id: crypto.randomUUID(), foodId: "dal", grams: 200 },
            { id: crypto.randomUUID(), foodId: "roti", grams: 60 },
            { id: crypto.randomUUID(), foodId: "mixedveg", grams: 100 },
        ],
        Dinner: [
            { id: crypto.randomUUID(), foodId: "egg", grams: 100 },
            { id: crypto.randomUUID(), foodId: "dal", grams: 150 },
            { id: crypto.randomUUID(), foodId: "rice", grams: 100 },
        ],
        Snacks: [{ id: crypto.randomUUID(), foodId: "curd", grams: 150 }],
    }),
    createPlan("Light veggie day", {
        Breakfast: [
            { id: crypto.randomUUID(), foodId: "banana", grams: 100 },
            { id: crypto.randomUUID(), foodId: "curd", grams: 100 },
        ],
        Lunch: [
            { id: crypto.randomUUID(), foodId: "mixedveg", grams: 200 },
            { id: crypto.randomUUID(), foodId: "roti", grams: 30 },
            { id: crypto.randomUUID(), foodId: "dal", grams: 100 },
        ],
        Dinner: [
            { id: crypto.randomUUID(), foodId: "mixedveg", grams: 200 },
            { id: crypto.randomUUID(), foodId: "roti", grams: 30 },
        ],
        Snacks: [{ id: crypto.randomUUID(), foodId: "banana", grams: 100 }],
    }),
    createPlan("Dal & roti comfort", {
        Breakfast: [
            { id: crypto.randomUUID(), foodId: "roti", grams: 90 },
            { id: crypto.randomUUID(), foodId: "curd", grams: 150 },
        ],
        Lunch: [
            { id: crypto.randomUUID(), foodId: "dal", grams: 200 },
            { id: crypto.randomUUID(), foodId: "roti", grams: 90 },
            { id: crypto.randomUUID(), foodId: "mixedveg", grams: 100 },
        ],
        Dinner: [
            { id: crypto.randomUUID(), foodId: "dal", grams: 150 },
            { id: crypto.randomUUID(), foodId: "roti", grams: 60 },
            { id: crypto.randomUUID(), foodId: "mixedveg", grams: 100 },
        ],
        Snacks: [
            { id: crypto.randomUUID(), foodId: "banana", grams: 100 },
            { id: crypto.randomUUID(), foodId: "curd", grams: 100 },
        ],
    }),
];

export const MEALS = ["Breakfast", "Lunch", "Dinner", "Snacks"];
export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

