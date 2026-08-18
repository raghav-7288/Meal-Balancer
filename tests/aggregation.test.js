import { describe, it, expect } from "vitest";
import { aggregateMeal, combineDay, foodById } from "../src/engines/nutrientEngine";
import { scoreDay } from "../src/engines/scoringEngine";

describe("foodById", () => {
    it("returns a known food by id", () => {
        const rice = foodById("rice");
        expect(rice).toBeDefined();
        expect(rice.name).toBe("Cooked Rice");
        expect(rice.group).toBe("cereals");
    });

    it("returns undefined for unknown id", () => {
        expect(foodById("unknown")).toBeUndefined();
    });
});

describe("aggregateMeal", () => {
    it("returns zero totals for empty items", () => {
        const result = aggregateMeal([]);
        expect(result.kcal).toBe(0);
        expect(result.carbs).toBe(0);
        expect(result.protein).toBe(0);
        expect(result.vegetablesG).toBe(0);
        expect(result.cerealEnergyPct).toBe(0);
    });

    it("calculates correct totals for rice", () => {
        const result = aggregateMeal([{ foodId: "rice", grams: 100 }]);
        // rice: 100g = 1 exchange, kcal=130, carbs=28, protein=2.5
        expect(result.kcal).toBe(130);
        expect(result.carbs).toBe(28);
        expect(result.protein).toBe(2.5);
        expect(result.cerealEnergyPct).toBe(100); // only cereal
    });

    it("tracks vegetable grams correctly", () => {
        const result = aggregateMeal([{ foodId: "mixedveg", grams: 150 }]);
        expect(result.vegetablesG).toBe(150);
    });

    it("handles multiple items correctly", () => {
        const result = aggregateMeal([
            { foodId: "rice", grams: 200 },
            { foodId: "dal", grams: 75 },
        ]);
        // rice: 200/100=2 exchanges, dal: 75/75=1 exchange
        expect(result.kcal).toBe(130 * 2 + 110);
        expect(result.protein).toBe(2.5 * 2 + 7);
    });

    it("skips unknown food ids gracefully", () => {
        const result = aggregateMeal([
            { foodId: "unknown", grams: 100 },
            { foodId: "rice", grams: 100 },
        ]);
        expect(result.kcal).toBe(130);
    });

    it("calculates exchange totals by group", () => {
        const result = aggregateMeal([
            { foodId: "rice", grams: 200 },
            { foodId: "roti", grams: 60 },
        ]);
        expect(result.exchangeTotals.cereals).toBe(4); // 200/100 + 60/30
    });

    it("calculates correctly using DB nutrients (per 100g)", () => {
        const result = aggregateMeal([
            {
                foodId: "999",
                foodName: "DB Food",
                grams: 200,
                nutrients: { kcal: 150, carbs: 30, protein: 5, fat: 2, fibre: 3, vitamins: 1, minerals: 1 },
                foodGroup: "cereals",
            },
        ]);
        // 200g / 100 = factor 2
        expect(result.kcal).toBe(300);
        expect(result.carbs).toBe(60);
        expect(result.protein).toBe(10);
        expect(result.fat).toBe(4);
        expect(result.fibre).toBe(6);
        expect(result.cerealEnergy).toBe(300);
        expect(result.cerealEnergyPct).toBe(100);
    });

    it("tracks vegetablesG for DB items with vegetable group", () => {
        const result = aggregateMeal([
            {
                foodId: "1000",
                foodName: "DB Veggie",
                grams: 150,
                nutrients: { kcal: 25, carbs: 5, protein: 1, fat: 0, fibre: 3, vitamins: 4, minerals: 3 },
                foodGroup: "vegetables",
            },
        ]);
        expect(result.vegetablesG).toBe(150);
    });

    it("tracks addedSugar grams for DB items in the sugar group (by name)", () => {
        const result = aggregateMeal([
            {
                foodId: "2000",
                foodName: "Sugar",
                grams: 30,
                nutrients: { kcal: 120, carbs: 30, protein: 0, fat: 0, fibre: 0, vitamins: 0, minerals: 0 },
                foodGroup: "sugar",
            },
        ]);
        expect(result.addedSugar).toBe(30);
    });

    it("tracks addedSugar grams for DB items in the sugar group (by group id 9)", () => {
        const result = aggregateMeal([
            {
                foodId: "2001",
                foodName: "Jaggery",
                grams: 20,
                nutrients: { kcal: 76, carbs: 19, protein: 0, fat: 0, fibre: 0, vitamins: 0, minerals: 1 },
                foodGroupId: 9,
            },
        ]);
        expect(result.addedSugar).toBe(20);
    });

    it("does not count non-sugar foods toward addedSugar", () => {
        const result = aggregateMeal([
            { foodId: "rice", grams: 100 },
            {
                foodId: "1000",
                foodName: "DB Veggie",
                grams: 150,
                nutrients: { kcal: 25, carbs: 5, protein: 1, fat: 0, fibre: 3, vitamins: 4, minerals: 3 },
                foodGroup: "vegetables",
            },
        ]);
        expect(result.addedSugar).toBe(0);
    });

    it("accumulates addedSugar from composite item ingredients", () => {
        const result = aggregateMeal([
            {
                foodId: "composite",
                foodName: "Sweet Tea",
                grams: 40,
                ingredients: [
                    {
                        foodId: "2002",
                        foodName: "Sugar",
                        grams: 15,
                        nutrients: { kcal: 60, carbs: 15, protein: 0, fat: 0, fibre: 0, vitamins: 0, minerals: 0 },
                        foodGroup: "sugar",
                    },
                    {
                        foodId: "2003",
                        foodName: "Milk",
                        grams: 25,
                        nutrients: { kcal: 15, carbs: 1, protein: 1, fat: 1, fibre: 0, vitamins: 0, minerals: 0 },
                        foodGroup: "dairy",
                    },
                ],
            },
        ]);
        expect(result.addedSugar).toBe(15);
    });

    it("mixes DB items and local items correctly", () => {
        const result = aggregateMeal([
            { foodId: "rice", grams: 100 }, // local: kcal=130
            {
                foodId: "1001",
                foodName: "DB Protein",
                grams: 100,
                nutrients: { kcal: 100, carbs: 0, protein: 20, fat: 3, fibre: 0, vitamins: 0, minerals: 0 },
                foodGroup: "pulses",
            },
        ]);
        expect(result.kcal).toBe(230); // 130 + 100
        expect(result.protein).toBe(22.5); // 2.5 + 20
    });
});

describe("combineDay", () => {
    it("combines multiple meal totals", () => {
        const breakfast = aggregateMeal([{ foodId: "banana", grams: 100 }]);
        const lunch = aggregateMeal([{ foodId: "dal", grams: 150 }]);
        const dinner = aggregateMeal([{ foodId: "rice", grams: 100 }]);

        const day = combineDay({ Breakfast: breakfast, Lunch: lunch, Dinner: dinner });

        expect(day.kcal).toBe(breakfast.kcal + lunch.kcal + dinner.kcal);
        expect(day.protein).toBe(breakfast.protein + lunch.protein + dinner.protein);
    });

    it("calculates cereal energy pct at day level", () => {
        const meals = {
            Breakfast: aggregateMeal([{ foodId: "rice", grams: 100 }]),
            Lunch: aggregateMeal([{ foodId: "dal", grams: 75 }]),
        };

        const day = combineDay(meals);
        const expectedPct = (130 / (130 + 110)) * 100;
        expect(day.cerealEnergyPct).toBeCloseTo(expectedPct, 1);
    });

    it("combines exchange totals across meals", () => {
        const meals = {
            Breakfast: aggregateMeal([{ foodId: "rice", grams: 100 }]),
            Lunch: aggregateMeal([{ foodId: "roti", grams: 60 }]),
        };

        const day = combineDay(meals);
        expect(day.exchangeTotals.cereals).toBe(3); // 1 + 2
    });

    it("sums addedSugar across meals for the day total", () => {
        const sugarItem = (grams) => ({
            foodId: "2000",
            foodName: "Sugar",
            grams,
            nutrients: { kcal: grams * 4, carbs: grams, protein: 0, fat: 0, fibre: 0, vitamins: 0, minerals: 0 },
            foodGroup: "sugar",
        });
        const meals = {
            Breakfast: aggregateMeal([sugarItem(10)]),
            Lunch: aggregateMeal([sugarItem(20)]),
        };

        const day = combineDay(meals);
        expect(day.addedSugar).toBe(30);
    });
});

describe("addedSugar → scoreDay integration", () => {
    // A balanced day (enough veg/protein/fibre, no cereal/fat penalties) so the
    // ONLY differentiator is the added-sugar rule. Proves the tracked value flows
    // through aggregateMeal → combineDay → scoreDay (the dashboard score KPI).
    const balancedVeg = {
        foodId: "3000",
        foodName: "Rich Veg",
        grams: 400,
        nutrients: { kcal: 40, carbs: 5, protein: 8, fat: 0, fibre: 6, vitamins: 4, minerals: 3 },
        foodGroup: "vegetables",
    };
    const sugar = {
        foodId: "3001",
        foodName: "Sugar",
        grams: 30,
        nutrients: { kcal: 400, carbs: 100, protein: 0, fat: 0, fibre: 0, vitamins: 0, minerals: 0 },
        foodGroup: "sugar",
    };

    it("applies the added-sugar penalty when sugar exceeds the daily limit", () => {
        const day = combineDay({ Meal: aggregateMeal([balancedVeg, sugar]) });
        expect(day.addedSugar).toBe(30); // > APP_CONFIG.addedSugarLimitG (25)

        const result = scoreDay(day);
        expect(result.reasons).toContain("Added sugar exceeds the limit.");
    });

    it("scores an otherwise-identical day higher without the sugar", () => {
        const withSugar = scoreDay(combineDay({ Meal: aggregateMeal([balancedVeg, sugar]) }));
        const withoutSugar = scoreDay(combineDay({ Meal: aggregateMeal([balancedVeg]) }));

        expect(withoutSugar.reasons).not.toContain("Added sugar exceeds the limit.");
        expect(withSugar.score).toBeLessThan(withoutSugar.score);
    });
});

