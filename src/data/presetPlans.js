export const MEALS = [
    "Early morning",
    "Breakfast",
    "Post breakfast snack",
    "Lunch",
    "Post lunch snack",
    "Dinner",
    "Bed time",
];
export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** Get today's weekday name (Monday–Sunday) from DAYS array. */
export function getTodayName() {
    const idx = new Date().getDay(); // 0=Sun … 6=Sat
    return DAYS[idx === 0 ? 6 : idx - 1];
}

function createWeeklyPlan(name, dayTemplate) {
    const meals = {};
    for (const slot of MEALS) {
        meals[slot] = [];
        for (const day of DAYS) {
            for (const item of dayTemplate[slot] || []) {
                meals[slot].push({
                    id: crypto.randomUUID(),
                    foodId: item.foodId,
                    grams: item.grams,
                    day,
                });
            }
        }
    }
    return { id: crypto.randomUUID(), name, meals };
}

export const PRESET_PLANS = [
    createWeeklyPlan("Balanced office day", {
        "Early morning": [{ foodId: "banana", grams: 100 }],
        Breakfast: [
            { foodId: "curd", grams: 150 },
            { foodId: "roti", grams: 60 },
        ],
        "Post breakfast snack": [],
        Lunch: [
            { foodId: "dal", grams: 150 },
            { foodId: "mixedveg", grams: 150 },
            { foodId: "roti", grams: 60 },
        ],
        "Post lunch snack": [{ foodId: "banana", grams: 100 }],
        Dinner: [
            { foodId: "rice", grams: 150 },
            { foodId: "egg", grams: 50 },
            { foodId: "mixedveg", grams: 100 },
        ],
        "Bed time": [],
    }),
    createWeeklyPlan("Cereal-heavy pattern", {
        "Early morning": [],
        Breakfast: [{ foodId: "rice", grams: 250 }],
        "Post breakfast snack": [],
        Lunch: [
            { foodId: "rice", grams: 300 },
            { foodId: "roti", grams: 60 },
        ],
        "Post lunch snack": [{ foodId: "banana", grams: 100 }],
        Dinner: [
            { foodId: "rice", grams: 200 },
            { foodId: "roti", grams: 60 },
        ],
        "Bed time": [],
    }),
    createWeeklyPlan("High-protein day", {
        "Early morning": [{ foodId: "banana", grams: 100 }],
        Breakfast: [
            { foodId: "egg", grams: 100 },
            { foodId: "curd", grams: 200 },
        ],
        "Post breakfast snack": [],
        Lunch: [
            { foodId: "dal", grams: 200 },
            { foodId: "roti", grams: 60 },
            { foodId: "mixedveg", grams: 100 },
        ],
        "Post lunch snack": [{ foodId: "curd", grams: 150 }],
        Dinner: [
            { foodId: "egg", grams: 100 },
            { foodId: "dal", grams: 150 },
            { foodId: "rice", grams: 100 },
        ],
        "Bed time": [],
    }),
    createWeeklyPlan("Light veggie day", {
        "Early morning": [],
        Breakfast: [
            { foodId: "banana", grams: 100 },
            { foodId: "curd", grams: 100 },
        ],
        "Post breakfast snack": [],
        Lunch: [
            { foodId: "mixedveg", grams: 200 },
            { foodId: "roti", grams: 30 },
            { foodId: "dal", grams: 100 },
        ],
        "Post lunch snack": [{ foodId: "banana", grams: 100 }],
        Dinner: [
            { foodId: "mixedveg", grams: 200 },
            { foodId: "roti", grams: 30 },
        ],
        "Bed time": [],
    }),
    createWeeklyPlan("Dal & roti comfort", {
        "Early morning": [],
        Breakfast: [
            { foodId: "roti", grams: 90 },
            { foodId: "curd", grams: 150 },
        ],
        "Post breakfast snack": [],
        Lunch: [
            { foodId: "dal", grams: 200 },
            { foodId: "roti", grams: 90 },
            { foodId: "mixedveg", grams: 100 },
        ],
        "Post lunch snack": [],
        Dinner: [
            { foodId: "dal", grams: 150 },
            { foodId: "roti", grams: 60 },
            { foodId: "mixedveg", grams: 100 },
        ],
        "Bed time": [
            { foodId: "banana", grams: 100 },
            { foodId: "curd", grams: 100 },
        ],
    }),
];
