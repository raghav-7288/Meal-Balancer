import { useState } from "react";
import { Plus, Check, X } from "lucide-react";
import FoodAutocomplete from "./FoodAutocomplete";

/**
 * Multi-ingredient add form for meal builder.
 * Allows users to accumulate multiple food items (ingredients) before
 * submitting them as a single composite entry (e.g., "Banana Shake").
 *
 * Props:
 * - meal: string — the meal slot name (e.g., "Breakfast")
 * - onAdd: (meal, menu, instructions, ingredients[]) => void — called on submit
 * - disabled: boolean — external disable (e.g., while saving)
 * - allowCustom: boolean — when true, exposes a "custom food" mode that lets
 *   users add an item not in the database by choosing a database "nutrition
 *   equivalent". Off by default so existing consumers are unchanged.
 * - colSpan: number — how many table columns the form row should span.
 */
export default function IngredientAddForm({
    meal,
    onAdd,
    disabled = false,
    allowCustom = false,
    colSpan = 5,
}) {
    // "Menu" is the dish/entry name (e.g. "Banana Shake"); "Instructions" are
    // separate preparation notes. They were previously a single combined field.
    const [menu, setMenu] = useState("");
    const [instructions, setInstructions] = useState("");
    const [ingredients, setIngredients] = useState([]);
    // Entry mode: "search" = pick a DB food, "custom" = name it + pick an equivalent
    const [mode, setMode] = useState("search");
    // Current ingredient being entered (DB search mode)
    const [currentFood, setCurrentFood] = useState({
        foodId: "",
        foodName: "",
        foodGroupId: null,
        grams: "",
    });
    // Current custom ingredient being entered (custom mode)
    const [customFood, setCustomFood] = useState({
        customName: "",
        equivalentFoodId: "",
        equivalentFoodName: "",
        equivalentFoodGroupId: null,
        grams: "",
    });

    const addIngredient = () => {
        if (!currentFood.foodName || !currentFood.foodId || !currentFood.grams || Number(currentFood.grams) <= 0) return;
        setIngredients((prev) => [
            ...prev,
            {
                foodId: currentFood.foodId,
                foodName: currentFood.foodName,
                foodGroupId: currentFood.foodGroupId,
                grams: Number(currentFood.grams),
            },
        ]);
        setCurrentFood({ foodId: "", foodName: "", foodGroupId: null, grams: "" });
    };

    const addCustomIngredient = () => {
        const name = customFood.customName.trim();
        if (!name || !customFood.equivalentFoodId || !customFood.grams || Number(customFood.grams) <= 0) return;
        setIngredients((prev) => [
            ...prev,
            {
                // foodId points at the database "equivalent" so nutrient hydration
                // and scoring reuse the existing pipeline unchanged.
                foodId: customFood.equivalentFoodId,
                foodName: name,
                foodGroupId: customFood.equivalentFoodGroupId,
                grams: Number(customFood.grams),
                isCustom: true,
                equivalentFoodName: customFood.equivalentFoodName,
            },
        ]);
        setCustomFood({
            customName: "",
            equivalentFoodId: "",
            equivalentFoodName: "",
            equivalentFoodGroupId: null,
            grams: "",
        });
    };

    const removeIngredient = (index) => {
        setIngredients((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        if (ingredients.length === 0) return;
        onAdd(meal, menu, instructions, ingredients);
        setMenu("");
        setInstructions("");
        setIngredients([]);
        setCurrentFood({ foodId: "", foodName: "", foodGroupId: null, grams: "" });
        setCustomFood({
            customName: "",
            equivalentFoodId: "",
            equivalentFoodName: "",
            equivalentFoodGroupId: null,
            grams: "",
        });
    };

    const canAddIngredient =
        currentFood.foodName && currentFood.foodId && currentFood.grams && Number(currentFood.grams) > 0;

    const canAddCustom =
        customFood.customName.trim() &&
        customFood.equivalentFoodId &&
        customFood.grams &&
        Number(customFood.grams) > 0;

    return (
        <tr className="inline-add-row">
            <td colSpan={colSpan}>
                <div className="ingredient-add-form">
                    {/* Menu (dish name) + preparation instructions — separate fields */}
                    <div className="ingredient-add-form__header">
                        <input
                            type="text"
                            value={menu}
                            placeholder="Menu (e.g., Banana Shake)"
                            onChange={(e) => setMenu(e.target.value)}
                            aria-label={`Menu name for new food in ${meal}`}
                            className="ingredient-add-form__menu"
                        />
                        <input
                            type="text"
                            value={instructions}
                            placeholder="Instructions (e.g., how to prepare)"
                            onChange={(e) => setInstructions(e.target.value)}
                            aria-label={`Instructions for new food in ${meal}`}
                            className="ingredient-add-form__instructions"
                        />
                    </div>

                    {/* Ingredients already added */}
                    {ingredients.length > 0 && (
                        <div className="ingredient-add-form__list" role="list" aria-label="Added ingredients">
                            {ingredients.map((ing, idx) => (
                                <span key={idx} className="ingredient-chip" role="listitem">
                                    <span className="ingredient-chip__text">
                                        {ing.foodName} · {ing.grams}g
                                        {ing.isCustom && (
                                            <span className="ingredient-chip__custom">
                                                {" "}
                                                · ≈ {ing.equivalentFoodName}
                                            </span>
                                        )}
                                    </span>
                                    <button
                                        type="button"
                                        className="ingredient-chip__remove"
                                        onClick={() => removeIngredient(idx)}
                                        aria-label={`Remove ${ing.foodName}`}
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Mode toggle — only when custom foods are allowed */}
                    {allowCustom && (
                        <div
                            className="ingredient-add-form__mode"
                            role="group"
                            aria-label="Food entry mode"
                        >
                            <button
                                type="button"
                                className={`mode-toggle ${mode === "search" ? "mode-toggle--active" : ""}`}
                                onClick={() => setMode("search")}
                                aria-pressed={mode === "search"}
                            >
                                Search database
                            </button>
                            <button
                                type="button"
                                className={`mode-toggle ${mode === "custom" ? "mode-toggle--active" : ""}`}
                                onClick={() => setMode("custom")}
                                aria-pressed={mode === "custom"}
                            >
                                Custom food
                            </button>
                        </div>
                    )}

                    {/* Input row for next ingredient */}
                    {allowCustom && mode === "custom" ? (
                        <div className="ingredient-add-form__input-row ingredient-add-form__input-row--custom">
                            <input
                                type="text"
                                value={customFood.customName}
                                placeholder="Custom food name"
                                onChange={(e) =>
                                    setCustomFood((prev) => ({ ...prev, customName: e.target.value }))
                                }
                                aria-label={`Custom food name for ${meal}`}
                                className="ingredient-add-form__custom-name"
                            />
                            <FoodAutocomplete
                                value={customFood.equivalentFoodName}
                                onChange={(val) => {
                                    setCustomFood((prev) => ({
                                        ...prev,
                                        equivalentFoodName: val,
                                        ...(val ? {} : { equivalentFoodId: "", equivalentFoodGroupId: null }),
                                    }));
                                }}
                                onSelect={(item) => {
                                    setCustomFood((prev) => ({
                                        ...prev,
                                        equivalentFoodId: String(item.food_id),
                                        equivalentFoodName: item.food_name,
                                        equivalentFoodGroupId: item.major_group_id,
                                    }));
                                }}
                                placeholder="Nutrition equivalent…"
                            />
                            <input
                                type="number"
                                min="0"
                                value={customFood.grams}
                                placeholder="g"
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "" || Number(val) >= 0)
                                        setCustomFood((prev) => ({ ...prev, grams: val }));
                                }}
                                aria-label={`Grams for custom food in ${meal}`}
                                className="ingredient-add-form__grams"
                            />
                            <button
                                type="button"
                                className="icon-btn add-ingredient-btn"
                                onClick={addCustomIngredient}
                                disabled={!canAddCustom}
                                aria-label="Add custom food to list"
                                title="Add custom food"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    ) : (
                        <div className="ingredient-add-form__input-row">
                            <FoodAutocomplete
                                value={currentFood.foodName}
                                onChange={(val) => {
                                    setCurrentFood((prev) => ({
                                        ...prev,
                                        foodName: val,
                                        ...(val ? {} : { foodId: "", foodGroupId: null }),
                                    }));
                                }}
                                onSelect={(item) => {
                                    setCurrentFood((prev) => ({
                                        ...prev,
                                        foodId: String(item.food_id),
                                        foodName: item.food_name,
                                        foodGroupId: item.major_group_id,
                                    }));
                                }}
                                placeholder="Search food…"
                            />
                            <input
                                type="number"
                                min="0"
                                value={currentFood.grams}
                                placeholder="g"
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "" || Number(val) >= 0)
                                        setCurrentFood((prev) => ({ ...prev, grams: val }));
                                }}
                                aria-label={`Grams for ingredient in ${meal}`}
                                className="ingredient-add-form__grams"
                            />
                            <button
                                type="button"
                                className="icon-btn add-ingredient-btn"
                                onClick={addIngredient}
                                disabled={!canAddIngredient}
                                aria-label={`Add ingredient to list`}
                                title="Add ingredient"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    )}

                    {/* Submit all ingredients as one meal entry */}
                    <div className="ingredient-add-form__actions">
                        <button
                            type="button"
                            className="btn btn--sm btn--primary"
                            onClick={handleSubmit}
                            disabled={disabled || ingredients.length === 0}
                            aria-label={`Add food to ${meal}`}
                            title="Add to meal"
                        >
                            <Check size={14} />
                            <span>Add to meal ({ingredients.length} item{ingredients.length !== 1 ? "s" : ""})</span>
                        </button>
                    </div>
                </div>
            </td>
        </tr>
    );
}

