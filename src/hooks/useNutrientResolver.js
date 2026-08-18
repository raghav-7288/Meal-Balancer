import { useState, useEffect, useRef, useCallback } from "react";
import { fetchFoodNutrients } from "../services/foodSearchService";
import { foodById, normalizeFoodGroup } from "../engines/nutrientEngine";

/**
 * useNutrientResolver
 * -------------------
 * Meal items reference foods either by a local id (resolved via `foodById`) or a
 * database numeric `foodId`. Items built through the DB path store per-100g
 * `nutrients` inline, but older/admin-built data (notably preset plans) only
 * stores the `foodId`. Without nutrients those items are skipped by
 * `aggregateMeal`, so scores/KPIs read as zero.
 *
 * This hook scans the given plans, batch-fetches (cached) nutrients for every
 * DB `foodId` that lacks embedded nutrients, and returns a stable resolver
 * `(foodId) => nutrients | undefined` that `aggregateMeal` can use to hydrate
 * those items on the fly — without mutating the synced plan data.
 *
 * @param {Array} plans - Plans to scan (each `{ meals: { slot: item[] } }`)
 * @returns {(foodId: string) => object | undefined} nutrient resolver
 */
export function useNutrientResolver(plans) {
    const [map, setMap] = useState({});
    const mapRef = useRef(map);
    useEffect(() => {
        mapRef.current = map;
    }, [map]);

    useEffect(() => {
        const ids = collectDbFoodIds(plans).filter((id) => !(id in mapRef.current));
        if (ids.length === 0) return;

        let cancelled = false;
        (async () => {
            const results = await Promise.all(
                ids.map(async (id) => {
                    try {
                        const result = await fetchFoodNutrients(id);
                        return [id, result?.nutrients || null];
                    } catch {
                        return [id, null];
                    }
                })
            );
            if (cancelled) return;
            setMap((prev) => {
                const next = { ...prev };
                // Cache null results too, so we don't refetch known-missing foods.
                for (const [id, nutrients] of results) next[id] = nutrients;
                return next;
            });
        })();

        return () => {
            cancelled = true;
        };
    }, [plans]);

    return useCallback((foodId) => map[foodId] || undefined, [map]);
}

/**
 * Await nutrient resolution for every DB food referenced by the given plans,
 * returning a synchronous resolver `(foodId) => nutrients | undefined`.
 *
 * Unlike {@link useNutrientResolver} (which populates state in the background),
 * this resolves eagerly and is safe to use in one-shot flows — notably PDF
 * export — where the data MUST be present at call time. Fetches are cached, so
 * ids already loaded by the hook resolve without a new network round-trip.
 *
 * @param {Array} plans - Plans to scan (each `{ meals: { slot: item[] } }`)
 * @returns {Promise<(foodId: string) => object | undefined>} resolver
 */
export async function resolvePlanNutrients(plans) {
    const ids = collectDbFoodIds(plans);
    if (ids.length === 0) return () => undefined;

    const entries = await Promise.all(
        ids.map(async (id) => {
            try {
                const result = await fetchFoodNutrients(id);
                return [id, result?.nutrients || undefined];
            } catch {
                return [id, undefined];
            }
        })
    );

    const map = {};
    for (const [id, nutrients] of entries) {
        if (nutrients) map[id] = nutrients;
    }
    return (foodId) => map[foodId] || undefined;
}

/**
 * Collect distinct DB (numeric) food ids referenced by the plans that need
 * nutrient hydration — i.e. no embedded `nutrients` and not a local food.
 * @param {Array} plans
 * @returns {string[]}
 */
export function collectDbFoodIds(plans) {
    const ids = new Set();

    const consider = (foodId, hasNutrients) => {
        if (!foodId || foodId === "composite" || hasNutrients) return;
        const id = String(foodId);
        if (foodById(id)) return; // local food — resolves without a fetch
        if (!/^\d+$/.test(id)) return; // only numeric DB ids
        ids.add(id);
    };

    for (const plan of plans || []) {
        const meals = plan?.meals || {};
        for (const slot of Object.keys(meals)) {
            for (const item of meals[slot] || []) {
                if (item?.ingredients?.length) {
                    for (const ing of item.ingredients) consider(ing.foodId, !!ing.nutrients);
                } else if (item) {
                    consider(item.foodId, !!item.nutrients);
                }
            }
        }
    }

    return [...ids];
}

/**
 * Return a copy of a plan with per-item / per-ingredient `nutrients` and
 * normalised `foodGroup` embedded, using the provided resolver. Items that
 * already carry nutrients (or resolve to a local food) are left untouched.
 *
 * Used for exports (PDF) where consumers read raw item nutrients rather than
 * the aggregated summary. Never mutates the input plan.
 *
 * @param {object} plan - `{ meals: { slot: item[] }, ... }`
 * @param {(foodId: string) => object | undefined} resolveNutrients
 * @returns {object} hydrated plan copy
 */
export function hydratePlanNutrients(plan, resolveNutrients) {
    if (!plan || !plan.meals) return plan;

    const hydrateEntry = (entry) => {
        if (!entry) return entry;
        const next = { ...entry };
        if (next.foodGroup || next.foodGroupId != null) {
            next.foodGroup = normalizeFoodGroup(next.foodGroup, next.foodGroupId);
        }
        if (!next.nutrients && next.foodId && next.foodId !== "composite" && !foodById(next.foodId)) {
            const nutrients = resolveNutrients?.(next.foodId);
            if (nutrients) next.nutrients = nutrients;
        }
        return next;
    };

    const meals = {};
    for (const slot of Object.keys(plan.meals)) {
        meals[slot] = (plan.meals[slot] || []).map((item) => {
            if (item?.ingredients?.length) {
                return { ...item, ingredients: item.ingredients.map(hydrateEntry) };
            }
            return hydrateEntry(item);
        });
    }

    return { ...plan, meals };
}

