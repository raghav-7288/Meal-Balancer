/**
 * copyMealItem util tests — pure clone/de-dupe logic shared by both plan hooks.
 */
import { describe, it, expect } from "vitest";
import {
    isSameMealItem,
    mealItemSignature,
    buildDayCopies,
} from "../src/utils/copyMealItem";

// Deterministic id factory for assertions
const seq = () => {
    let n = 0;
    return () => `copy-${++n}`;
};

const rice = { id: "a", foodId: "101", foodName: "Rice", grams: 150, day: "Monday" };

describe("mealItemSignature / isSameMealItem", () => {
    it("treats items with same food/menu/grams as identical", () => {
        const a = { foodId: "1", foodName: "Rice", grams: 100, menu: "" };
        const b = { id: "x", foodId: "1", foodName: "Rice", grams: 100, menu: "", day: "Tue" };
        expect(isSameMealItem(a, b)).toBe(true);
    });

    it("distinguishes by grams", () => {
        const a = { foodId: "1", foodName: "Rice", grams: 100 };
        const b = { foodId: "1", foodName: "Rice", grams: 120 };
        expect(isSameMealItem(a, b)).toBe(false);
    });

    it("distinguishes by menu", () => {
        const a = { foodId: "1", foodName: "Rice", grams: 100, menu: "Bowl A" };
        const b = { foodId: "1", foodName: "Rice", grams: 100, menu: "Bowl B" };
        expect(isSameMealItem(a, b)).toBe(false);
    });

    it("includes composite ingredients in the signature", () => {
        const a = {
            foodId: "composite",
            grams: 180,
            ingredients: [{ foodId: "1", grams: 100 }, { foodId: "2", grams: 80 }],
        };
        const b = {
            foodId: "composite",
            grams: 180,
            ingredients: [{ foodId: "1", grams: 100 }, { foodId: "2", grams: 90 }],
        };
        expect(mealItemSignature(a)).not.toBe(mealItemSignature(b));
        expect(isSameMealItem(a, b)).toBe(false);
    });

    it("returns empty signature for nullish item", () => {
        expect(mealItemSignature(null)).toBe("");
    });
});

describe("buildDayCopies", () => {
    it("clones the item to each target day with fresh ids", () => {
        const copies = buildDayCopies(rice, [rice], ["Tuesday", "Wednesday"], seq());
        expect(copies).toHaveLength(2);
        expect(copies.map((c) => c.day)).toEqual(["Tuesday", "Wednesday"]);
        expect(copies.map((c) => c.id)).toEqual(["copy-1", "copy-2"]);
        // Same food carried over
        expect(copies[0].foodId).toBe("101");
        expect(copies[0].foodName).toBe("Rice");
        expect(copies[0].grams).toBe(150);
    });

    it("skips the source's own day", () => {
        const copies = buildDayCopies(rice, [rice], ["Monday", "Tuesday"], seq());
        expect(copies).toHaveLength(1);
        expect(copies[0].day).toBe("Tuesday");
    });

    it("de-dupes days that already contain an identical item", () => {
        const slot = [
            rice,
            { ...rice, id: "b", day: "Tuesday" }, // identical item already on Tuesday
        ];
        const copies = buildDayCopies(rice, slot, ["Tuesday", "Wednesday"], seq());
        expect(copies.map((c) => c.day)).toEqual(["Wednesday"]);
    });

    it("still copies to a day that has a *different* item in the slot", () => {
        const slot = [rice, { id: "c", foodId: "202", foodName: "Dal", grams: 90, day: "Tuesday" }];
        const copies = buildDayCopies(rice, slot, ["Tuesday"], seq());
        expect(copies).toHaveLength(1);
        expect(copies[0].day).toBe("Tuesday");
    });

    it("deep-clones ingredients for composite items (new array + new top-level id)", () => {
        const composite = {
            id: "src",
            foodId: "composite",
            foodName: "Bowl",
            grams: 180,
            day: "Monday",
            ingredients: [{ foodId: "1", foodName: "Rice", grams: 100 }],
        };
        const copies = buildDayCopies(composite, [composite], ["Sunday"], seq());
        expect(copies[0].id).toBe("copy-1");
        expect(copies[0].ingredients).not.toBe(composite.ingredients); // new array
        expect(copies[0].ingredients[0]).not.toBe(composite.ingredients[0]); // new object
        expect(copies[0].ingredients[0]).toEqual({ foodId: "1", foodName: "Rice", grams: 100 });
    });

    it("ignores duplicate target days in the input", () => {
        const copies = buildDayCopies(rice, [rice], ["Tuesday", "Tuesday"], seq());
        expect(copies).toHaveLength(1);
    });

    it("returns [] for empty/invalid input", () => {
        expect(buildDayCopies(null, [], ["Tue"])).toEqual([]);
        expect(buildDayCopies(rice, [rice], [])).toEqual([]);
        expect(buildDayCopies(rice, [rice], null)).toEqual([]);
    });
});
