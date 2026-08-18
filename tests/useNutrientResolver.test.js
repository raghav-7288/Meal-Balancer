/**
 * Tests for the pure helpers behind useNutrientResolver:
 * - collectDbFoodIds: which foodIds need a nutrient fetch
 * - hydratePlanNutrients: embed resolved nutrients + normalise groups for export
 */
import { describe, it, expect } from "vitest";
import { collectDbFoodIds, hydratePlanNutrients } from "../src/hooks/useNutrientResolver";

describe("collectDbFoodIds", () => {
    it("collects distinct numeric DB foodIds lacking inline nutrients", () => {
        const plans = [
            {
                meals: {
                    Breakfast: [
                        { foodId: "10", grams: 100 },
                        { foodId: "10", grams: 50 }, // duplicate
                        { foodId: "37", grams: 100 },
                    ],
                },
            },
        ];
        expect(collectDbFoodIds(plans).sort()).toEqual(["10", "37"]);
    });

    it("skips composite markers, embedded-nutrient items, and local foods", () => {
        const plans = [
            {
                meals: {
                    Lunch: [
                        { foodId: "composite", grams: 200, ingredients: [] },
                        { foodId: "42", grams: 100, nutrients: { kcal: 10 } }, // already hydrated
                        { foodId: "rice", grams: 100 }, // local food
                        { foodId: "99", grams: 100 }, // needs fetch
                    ],
                },
            },
        ];
        expect(collectDbFoodIds(plans)).toEqual(["99"]);
    });

    it("descends into composite ingredients", () => {
        const plans = [
            {
                meals: {
                    Dinner: [
                        {
                            foodId: "composite",
                            grams: 200,
                            ingredients: [
                                { foodId: "10", grams: 100 },
                                { foodId: "20", grams: 100, nutrients: { kcal: 5 } },
                            ],
                        },
                    ],
                },
            },
        ];
        expect(collectDbFoodIds(plans)).toEqual(["10"]);
    });

    it("handles empty / missing input safely", () => {
        expect(collectDbFoodIds()).toEqual([]);
        expect(collectDbFoodIds([])).toEqual([]);
        expect(collectDbFoodIds([{}])).toEqual([]);
    });
});

describe("hydratePlanNutrients", () => {
    const resolver = (id) =>
        id === "10" ? { kcal: 40, carbs: 5, protein: 3, fat: 1, fibre: 6 } : undefined;

    it("embeds resolved nutrients and normalises the group without mutating input", () => {
        const plan = {
            name: "P",
            meals: {
                Breakfast: [
                    { foodId: "10", grams: 100, foodGroup: "Green Leafy Vegetables", foodGroupId: 3 },
                ],
            },
        };
        const out = hydratePlanNutrients(plan, resolver);
        const item = out.meals.Breakfast[0];
        expect(item.nutrients).toEqual({ kcal: 40, carbs: 5, protein: 3, fat: 1, fibre: 6 });
        expect(item.foodGroup).toBe("vegetables");
        // original untouched
        expect(plan.meals.Breakfast[0].nutrients).toBeUndefined();
        expect(plan.meals.Breakfast[0].foodGroup).toBe("Green Leafy Vegetables");
    });

    it("hydrates composite ingredients", () => {
        const plan = {
            meals: {
                Lunch: [
                    {
                        foodId: "composite",
                        grams: 100,
                        ingredients: [{ foodId: "10", grams: 100, foodGroupId: 3 }],
                    },
                ],
            },
        };
        const out = hydratePlanNutrients(plan, resolver);
        expect(out.meals.Lunch[0].ingredients[0].nutrients.kcal).toBe(40);
        expect(out.meals.Lunch[0].ingredients[0].foodGroup).toBe("vegetables");
    });

    it("leaves items with existing nutrients' values intact", () => {
        const plan = {
            meals: { Dinner: [{ foodId: "10", grams: 100, nutrients: { kcal: 5 }, foodGroupId: 3 }] },
        };
        const out = hydratePlanNutrients(plan, resolver);
        expect(out.meals.Dinner[0].nutrients).toEqual({ kcal: 5 });
    });

    it("returns the plan unchanged when it has no meals", () => {
        const plan = { name: "empty" };
        expect(hydratePlanNutrients(plan, resolver)).toBe(plan);
    });
});

