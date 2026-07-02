import { memo, useState } from "react";
import { Plus, Pencil, Check, Trash2, ChevronDown, X } from "lucide-react";
import toast from "react-hot-toast";
import { MEALS } from "../../data/presetPlans";
import { foodById } from "../../engines/nutrientEngine";
import Section from "../ui/Section";
import IngredientAddForm from "./IngredientAddForm";
import FoodAutocomplete from "./FoodAutocomplete";
import "./FoodAutocomplete.css";
import "./IngredientAddForm.css";

function MealBuilder({
    activePlan,
    activeSummary,
    isPresetActive,
    viewDay,
    onAddFood,
    isAddingFood,
    onUpdateMealItem,
    onRemoveMealItem,
}) {
    const [collapsedSlots, setCollapsedSlots] = useState({});
    const [editingItemId, setEditingItemId] = useState(null);
    const [editValues, setEditValues] = useState({
        grams: "",
        instructions: "",
        ingredients: [],
        foodId: "",
        foodName: "",
        foodGroupId: null,
    });
    const [editNewIngredient, setEditNewIngredient] = useState({
        foodId: "",
        foodName: "",
        foodGroupId: null,
        grams: "",
    });

    const toggleSlot = (meal) => {
        setCollapsedSlots((prev) => ({ ...prev, [meal]: !prev[meal] }));
    };

    /** Handler for IngredientAddForm submit */
    const handleAddIngredients = (meal, instructions, ingredients) => {
        if (!ingredients || ingredients.length === 0) return;
        onAddFood(meal, instructions, ingredients);
    };

    return (
        <Section title={`Meal builder — ${viewDay}`} icon={<Plus size={16} />}>
            {!activePlan ? (
                <p className="small-copy" style={{ textAlign: "center", padding: "2rem 0" }}>
                    Loading plan…
                </p>
            ) : (
                <>
                    {isPresetActive && (
                        <p
                            className="small-copy"
                            style={{ marginBottom: "1rem", fontStyle: "italic", opacity: 0.8 }}
                        >
                            This is a pre-saved plan. Copy it to &quot;My Plans&quot; to add or edit
                            food items.
                        </p>
                    )}

                    <div className="meal-panels">
                        {MEALS.map((meal) => {
                            const mealItems = ((activePlan.meals || {})[meal] || []).filter(
                                (i) => i.day === viewDay || !i.day
                            );
                            const mealScore = activeSummary?.mealScores?.[meal]?.score || 0;
                            const mealBand =
                                activeSummary?.mealScores?.[meal]?.band || "Poor balance";
                            const mealReasons = activeSummary?.mealScores?.[meal]?.reasons || [];

                            return (
                                <div
                                    key={meal}
                                    className={`meal-card ${collapsedSlots[meal] ? "meal-card--collapsed" : ""}`}
                                >
                                    <div
                                        className="meal-head"
                                        onClick={() => toggleSlot(meal)}
                                        style={{ cursor: "pointer" }}
                                        role="button"
                                        tabIndex={0}
                                        aria-expanded={!collapsedSlots[meal]}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                toggleSlot(meal);
                                            }
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <ChevronDown
                                                size={18}
                                                className={`meal-collapse-arrow ${collapsedSlots[meal] ? "meal-collapse-arrow--collapsed" : ""}`}
                                            />
                                            <div>
                                                <h3>{meal}</h3>
                                                <p>{mealItems.length} item(s)</p>
                                            </div>
                                        </div>
                                        <div
                                            className={`score-pill ${mealScore >= 70 ? "good" : mealScore >= 50 ? "warn" : "bad"}`}
                                            aria-label={`${meal} score: ${mealScore} out of 100, ${mealBand}`}
                                        >
                                            {mealScore} / 100 · {mealBand}
                                        </div>
                                    </div>
                                    {!collapsedSlots[meal] && (
                                        <>
                                            <div className="table-wrap">
                                                <table>
                                                    <thead>
                                                        <tr>
                                                            <th scope="col">Menu/Instructions</th>
                                                            <th scope="col">Food</th>
                                                            <th scope="col">g</th>
                                                            {!isPresetActive && (
                                                                <th scope="col">Actions</th>
                                                            )}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {mealItems.length ? (
                                                            mealItems.map((item) => {
                                                                const isComposite =
                                                                    item.ingredients &&
                                                                    item.ingredients.length > 0;
                                                                const food = !isComposite
                                                                    ? foodById(item.foodId)
                                                                    : null;
                                                                const foodName = isComposite
                                                                    ? item.ingredients
                                                                          .map((ing) => ing.foodName)
                                                                          .join(", ")
                                                                    : food?.name || item.foodName || "-";
                                                                const isEditing = editingItemId === item.id;

                                                                const startEditing = () => {
                                                                    setEditingItemId(item.id);
                                                                    // Always populate ingredients — for non-composite, convert single food to first ingredient
                                                                    const initialIngredients = isComposite
                                                                        ? [...item.ingredients]
                                                                        : [{
                                                                            foodId: item.foodId || "",
                                                                            foodName: food?.name || item.foodName || "",
                                                                            foodGroupId: item.foodGroupId || null,
                                                                            grams: item.grams || 0,
                                                                        }];
                                                                    setEditValues({
                                                                        grams: item.grams,
                                                                        instructions: item.instructions || "",
                                                                        ingredients: initialIngredients,
                                                                        foodId: item.foodId || "",
                                                                        foodName: food?.name || item.foodName || "",
                                                                        foodGroupId: item.foodGroupId || null,
                                                                    });
                                                                    setEditNewIngredient({ foodId: "", foodName: "", foodGroupId: null, grams: "" });
                                                                };

                                                                const saveEditing = () => {
                                                                    const updates = { instructions: editValues.instructions };
                                                                    if (editValues.ingredients.length > 1) {
                                                                        // Multiple ingredients — save as composite
                                                                        updates.ingredients = editValues.ingredients;
                                                                        updates.grams = editValues.ingredients.reduce(
                                                                            (sum, ing) => sum + Number(ing.grams), 0
                                                                        );
                                                                    } else if (editValues.ingredients.length === 1) {
                                                                        // Single ingredient — save as non-composite
                                                                        const single = editValues.ingredients[0];
                                                                        updates.grams = Number(single.grams);
                                                                        updates.foodId = single.foodId;
                                                                        updates.foodName = single.foodName;
                                                                        updates.foodGroupId = single.foodGroupId;
                                                                        updates.ingredients = null;
                                                                    } else {
                                                                        updates.grams = 0;
                                                                    }
                                                                    onUpdateMealItem(meal, item.id, updates);
                                                                    setEditingItemId(null);
                                                                    toast.success("Changes saved");
                                                                };

                                                                const cancelEditing = () => {
                                                                    setEditingItemId(null);
                                                                    toast("Edit cancelled", { icon: "✕" });
                                                                };

                                                                const updateIngredientGrams = (idx, newGrams) => {
                                                                    setEditValues((v) => ({
                                                                        ...v,
                                                                        ingredients: v.ingredients.map((ing, i) =>
                                                                            i === idx ? { ...ing, grams: newGrams } : ing
                                                                        ),
                                                                    }));
                                                                };

                                                                const removeIngredient = (idx) => {
                                                                    const removed = editValues.ingredients[idx];
                                                                    setEditValues((v) => ({
                                                                        ...v,
                                                                        ingredients: v.ingredients.filter((_, i) => i !== idx),
                                                                    }));
                                                                    if (removed) {
                                                                        toast((t) => (
                                                                            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                                                🗑️ Removed "{removed.foodName}"
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setEditValues((v) => ({
                                                                                            ...v,
                                                                                            ingredients: [
                                                                                                ...v.ingredients.slice(0, idx),
                                                                                                removed,
                                                                                                ...v.ingredients.slice(idx),
                                                                                            ],
                                                                                        }));
                                                                                        toast.dismiss(t.id);
                                                                                    }}
                                                                                    style={{
                                                                                        padding: "4px 10px",
                                                                                        borderRadius: "6px",
                                                                                        background: "#3b82f6",
                                                                                        color: "#fff",
                                                                                        border: "none",
                                                                                        fontWeight: 600,
                                                                                        fontSize: "12px",
                                                                                        cursor: "pointer",
                                                                                    }}
                                                                                >
                                                                                    Undo
                                                                                </button>
                                                                            </span>
                                                                        ), { duration: 4000 });
                                                                    }
                                                                };

                                                                const updateIngredientFood = (idx, foodData) => {
                                                                    setEditValues((v) => ({
                                                                        ...v,
                                                                        ingredients: v.ingredients.map((ing, i) =>
                                                                            i === idx
                                                                                ? { ...ing, foodId: foodData.foodId, foodName: foodData.foodName, foodGroupId: foodData.foodGroupId }
                                                                                : ing
                                                                        ),
                                                                    }));
                                                                };

                                                                const addEditIngredient = () => {
                                                                    if (!editNewIngredient.foodId || !editNewIngredient.grams || Number(editNewIngredient.grams) <= 0) return;
                                                                    const newName = editNewIngredient.foodName;
                                                                    setEditValues((v) => ({
                                                                        ...v,
                                                                        ingredients: [
                                                                            ...v.ingredients,
                                                                            {
                                                                                foodId: editNewIngredient.foodId,
                                                                                foodName: editNewIngredient.foodName,
                                                                                foodGroupId: editNewIngredient.foodGroupId,
                                                                                grams: Number(editNewIngredient.grams),
                                                                            },
                                                                        ],
                                                                    }));
                                                                    setEditNewIngredient({ foodId: "", foodName: "", foodGroupId: null, grams: "" });
                                                                    toast.success(`"${newName}" added`);
                                                                };

                                                                return (
                                                                    <tr key={item.id}>
                                                                        <td className="instructions-cell">
                                                                            {isEditing ? (
                                                                                <input
                                                                                    type="text"
                                                                                    value={editValues.instructions}
                                                                                    onChange={(e) => setEditValues((v) => ({ ...v, instructions: e.target.value }))}
                                                                                    aria-label={`Edit instructions for ${foodName}`}
                                                                                    placeholder="Menu/Instructions"
                                                                                />
                                                                            ) : (
                                                                                item.instructions || "-"
                                                                            )}
                                                                        </td>
                                                                        <td>
                                                                            {isEditing ? (
                                                                                <div className="edit-ingredients-panel">
                                                                                    <div className="edit-ingredients-list">
                                                                                        {editValues.ingredients.map((ing, idx) => (
                                                                                            <div key={idx} className="edit-ingredient-row">
                                                                                                <div className="edit-ingredient-food">
                                                                                                    <FoodAutocomplete
                                                                                                        value={ing.foodName}
                                                                                                        onChange={(val) => {
                                                                                                            setEditValues((v) => ({
                                                                                                                ...v,
                                                                                                                ingredients: v.ingredients.map((item, i) =>
                                                                                                                    i === idx ? { ...item, foodName: val, ...(val ? {} : { foodId: "", foodGroupId: null }) } : item
                                                                                                                ),
                                                                                                            }));
                                                                                                        }}
                                                                                                        onSelect={(selected) => updateIngredientFood(idx, { foodId: String(selected.food_id), foodName: selected.food_name, foodGroupId: selected.major_group_id })}
                                                                                                        placeholder="Search food…"
                                                                                                    />
                                                                                                </div>
                                                                                                <input
                                                                                                    type="number"
                                                                                                    min="1"
                                                                                                    value={ing.grams}
                                                                                                    onChange={(e) => updateIngredientGrams(idx, e.target.value)}
                                                                                                    className="edit-ingredient-grams"
                                                                                                    aria-label={`Grams for ${ing.foodName}`}
                                                                                                />
                                                                                                <span className="edit-ingredient-unit">g</span>
                                                                                                <button
                                                                                                    type="button"
                                                                                                    className="icon-btn danger edit-ingredient-remove"
                                                                                                    onClick={() => removeIngredient(idx)}
                                                                                                    aria-label={`Remove ${ing.foodName}`}
                                                                                                >
                                                                                                    <X size={12} />
                                                                                                </button>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                    <div className="edit-ingredient-add-row">
                                                                                        <FoodAutocomplete
                                                                                            value={editNewIngredient.foodName}
                                                                                            onChange={(val) => setEditNewIngredient((prev) => ({ ...prev, foodName: val, ...(val ? {} : { foodId: "", foodGroupId: null }) }))}
                                                                                            onSelect={(selected) => setEditNewIngredient((prev) => ({ ...prev, foodId: String(selected.food_id), foodName: selected.food_name, foodGroupId: selected.major_group_id }))}
                                                                                            placeholder="Add ingredient…"
                                                                                        />
                                                                                        <input
                                                                                            type="number"
                                                                                            min="1"
                                                                                            value={editNewIngredient.grams}
                                                                                            placeholder="g"
                                                                                            onChange={(e) => setEditNewIngredient((prev) => ({ ...prev, grams: e.target.value }))}
                                                                                            className="edit-ingredient-grams"
                                                                                            aria-label="Grams for new ingredient"
                                                                                        />
                                                                                        <button
                                                                                            type="button"
                                                                                            className="icon-btn add-ingredient-btn"
                                                                                            onClick={addEditIngredient}
                                                                                            disabled={!editNewIngredient.foodId || !editNewIngredient.grams || Number(editNewIngredient.grams) <= 0}
                                                                                            aria-label="Add ingredient"
                                                                                        >
                                                                                            <Plus size={12} />
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            ) : isComposite ? (
                                                                                <div className="ingredients-summary">
                                                                                    {item.ingredients.map((ing, idx) => (
                                                                                        <span key={idx} className="ingredients-summary__item">
                                                                                            {ing.foodName}
                                                                                            <span style={{ opacity: 0.7, marginLeft: 2 }}>({ing.grams}g)</span>
                                                                                        </span>
                                                                                    ))}
                                                                                </div>
                                                                            ) : (
                                                                                foodName
                                                                            )}
                                                                        </td>
                                                                        <td>
                                                                            {isEditing ? (
                                                                                <span className="edit-total-grams">
                                                                                    {editValues.ingredients.reduce((sum, ing) => sum + Number(ing.grams || 0), 0)}
                                                                                </span>
                                                                            ) : (
                                                                                item.grams
                                                                            )}
                                                                        </td>
                                                                        {!isPresetActive && (
                                                                            <td>
                                                                                <div className="icon-row">
                                                                                    {isEditing ? (
                                                                                        <>
                                                                                            <button type="button" className="icon-btn" onClick={saveEditing} aria-label={`Save ${foodName}`}>
                                                                                                <Check size={14} />
                                                                                            </button>
                                                                                            <button type="button" className="icon-btn" onClick={cancelEditing} aria-label="Cancel edit">
                                                                                                <X size={14} />
                                                                                            </button>
                                                                                        </>
                                                                                    ) : (
                                                                                        <>
                                                                                            <button type="button" className="icon-btn" onClick={startEditing} aria-label={`Edit ${foodName}`}>
                                                                                                <Pencil size={14} />
                                                                                            </button>
                                                                                            <button type="button" className="icon-btn danger" onClick={() => onRemoveMealItem(meal, item.id)} aria-label={`Remove ${foodName}`}>
                                                                                                <Trash2 size={14} />
                                                                                            </button>
                                                                                        </>
                                                                                    )}
                                                                                </div>
                                                                            </td>
                                                                        )}
                                                                    </tr>
                                                                );
                                                            })
                                                        ) : (
                                                            <tr>
                                                                <td colSpan={isPresetActive ? 3 : 4} className="empty-cell">
                                                                    No items for {viewDay}.
                                                                </td>
                                                            </tr>
                                                        )}

                                                        {/* Multi-ingredient add form */}
                                                        {!isPresetActive && (
                                                            <IngredientAddForm
                                                                meal={meal}
                                                                onAdd={handleAddIngredients}
                                                                disabled={isAddingFood}
                                                            />
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="reason-box" role="status" aria-live="polite">
                                                <strong>Reasons for imbalance</strong>
                                                <ul>
                                                    {mealReasons.map((reason) => (
                                                        <li key={reason}>{reason}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </Section>
    );
}

export default memo(MealBuilder);
