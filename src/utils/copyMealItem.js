/**
 * Helpers for copying a meal item to other days.
 *
 * A meal item lives in a flat per-slot array (`plan.meals[slot]`) and carries a
 * `day` field. Copying to other days means cloning the item with a fresh `id`
 * and a different `day`, then appending the clones to the same slot array.
 *
 * These helpers are pure so both `useDashboardState` and `usePresetPlanAdmin`
 * share identical clone/de-dupe behavior.
 */

/**
 * Build a stable signature for a meal item so we can detect duplicates on a day.
 * Two items are considered identical when their food, menu, grams (and, for
 * composite items, their ingredient food/grams) match.
 * @param {object} item
 * @returns {string}
 */
export function mealItemSignature(item) {
    if (!item) return "";
    const base = `${item.foodId}|${item.menu || ""}|${item.foodName || ""}|${item.grams}`;
    if (Array.isArray(item.ingredients) && item.ingredients.length > 0) {
        const ings = item.ingredients.map((i) => `${i.foodId}:${i.grams}`).join(",");
        return `${base}|[${ings}]`;
    }
    return base;
}

/**
 * Whether two meal items are functionally identical (same signature).
 * @param {object} a
 * @param {object} b
 * @returns {boolean}
 */
export function isSameMealItem(a, b) {
    return mealItemSignature(a) === mealItemSignature(b);
}

/**
 * Build clones of `source` for each target day.
 *
 * - Skips the source's own day (nothing to copy to itself).
 * - Skips any day that already contains an identical item (idempotent de-dupe).
 * - Assigns each clone a fresh `id`; shallow-clones `ingredients` for composite
 *   items so edits to a copy don't mutate the original.
 *
 * @param {object} source - the item being copied
 * @param {object[]} slotItems - all items currently in the same meal slot (all days)
 * @param {string[]} targetDays - day names to copy into
 * @param {() => string} [makeId] - id factory (injectable for tests)
 * @returns {object[]} new item objects to append to the slot (may be empty)
 */
export function buildDayCopies(
    source,
    slotItems,
    targetDays,
    makeId = () => crypto.randomUUID()
) {
    if (!source || !Array.isArray(targetDays) || targetDays.length === 0) return [];
    const existing = Array.isArray(slotItems) ? slotItems : [];
    const additions = [];
    const seen = new Set();

    for (const day of targetDays) {
        if (!day || day === source.day || seen.has(day)) continue;
        seen.add(day);
        const alreadyThere = existing.some(
            (it) => it.day === day && isSameMealItem(it, source)
        );
        if (alreadyThere) continue;
        additions.push({
            ...source,
            id: makeId(),
            day,
            ...(Array.isArray(source.ingredients) && {
                ingredients: source.ingredients.map((ing) => ({ ...ing })),
            }),
        });
    }

    return additions;
}
