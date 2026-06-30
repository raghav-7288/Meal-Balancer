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
 * - onAdd: (meal, instructions, ingredients[]) => void — called on submit
 * - disabled: boolean — external disable (e.g., while saving)
 */
export default function IngredientAddForm({ meal, onAdd, disabled = false }) {
    const [instructions, setInstructions] = useState("");
    const [ingredients, setIngredients] = useState([]);
    // Current ingredient being entered
    const [currentFood, setCurrentFood] = useState({
        foodId: "",
        foodName: "",
        foodGroupId: null,
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

    const removeIngredient = (index) => {
        setIngredients((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        if (ingredients.length === 0) return;
        onAdd(meal, instructions, ingredients);
        setInstructions("");
        setIngredients([]);
        setCurrentFood({ foodId: "", foodName: "", foodGroupId: null, grams: "" });
    };

    const canAddIngredient =
        currentFood.foodName && currentFood.foodId && currentFood.grams && Number(currentFood.grams) > 0;

    return (
        <tr className="inline-add-row">
            <td colSpan={4}>
                <div className="ingredient-add-form">
                    {/* Instructions / composite name */}
                    <div className="ingredient-add-form__header">
                        <input
                            type="text"
                            value={instructions}
                            placeholder="Menu/Instructions (e.g., Banana Shake)"
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

                    {/* Input row for next ingredient */}
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

