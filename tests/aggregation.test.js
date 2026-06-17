import { describe, it, expect } from "vitest";
import { aggregateMeal, combineDay, foodById } from "../src/engines/nutrientEngine";

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
});

