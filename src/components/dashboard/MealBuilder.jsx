import { memo, useState } from "react";
import { Plus, Pencil, Check, Trash2, ChevronDown } from "lucide-react";
import { MEALS } from "../../data/presetPlans";
import { foodById } from "../../engines/nutrientEngine";
import Section from "../ui/Section";
import IngredientAddForm from "./IngredientAddForm";
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
    const [editValues, setEditValues] = useState({ grams: "", instructions: "" });

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
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 8,
                                            }}
                                        >
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
                                                                    : food?.name ||
                                                                      item.foodName ||
                                                                      "-";
                                                                const isEditing =
                                                                    editingItemId === item.id;
                                                                const displayGrams = isEditing
                                                                    ? editValues.grams
                                                                    : item.grams;

                                                                const startEditing = () => {
                                                                    setEditingItemId(item.id);
                                                                    setEditValues({
                                                                        grams: item.grams,
                                                                        instructions:
                                                                            item.instructions || "",
                                                                    });
                                                                };

                                                                const saveEditing = () => {
                                                                    onUpdateMealItem(
                                                                        meal,
                                                                        item.id,
                                                                        {
                                                                            grams: Number(
                                                                                editValues.grams
                                                                            ),
                                                                            instructions:
                                                                                editValues.instructions,
                                                                        }
                                                                    );
                                                                    setEditingItemId(null);
                                                                };

                                                                return (
                                                                    <tr key={item.id}>
                                                                        <td className="instructions-cell">
                                                                            {isEditing ? (
                                                                                <input
                                                                                    type="text"
                                                                                    value={
                                                                                        editValues.instructions
                                                                                    }
                                                                                    onChange={(e) =>
                                                                                        setEditValues(
                                                                                            (
                                                                                                v
                                                                                            ) => ({
                                                                                                ...v,
                                                                                                instructions:
                                                                                                    e
                                                                                                        .target
                                                                                                        .value,
                                                                                            })
                                                                                        )
                                                                                    }
                                                                                    aria-label={`Edit instructions for ${foodName}`}
                                                                                    placeholder="Menu/Instructions"
                                                                                />
                                                                            ) : (
                                                                                item.instructions ||
                                                                                "-"
                                                                            )}
                                                                        </td>
                                                                        <td>
                                                                            {isComposite ? (
                                                                                <div className="ingredients-summary">
                                                                                    {item.ingredients.map(
                                                                                        (ing, idx) => (
                                                                                            <span
                                                                                                key={idx}
                                                                                                className="ingredients-summary__item"
                                                                                            >
                                                                                                {ing.foodName}
                                                                                                <span style={{ opacity: 0.7, marginLeft: 2 }}>
                                                                                                    ({ing.grams}g)
                                                                                                </span>
                                                                                            </span>
                                                                                        )
                                                                                    )}
                                                                                </div>
                                                                            ) : (
                                                                                foodName
                                                                            )}
                                                                        </td>
                                                                        <td>
                                                                            {isEditing && !isComposite ? (
                                                                                <input
                                                                                    type="number"
                                                                                    min="0"
                                                                                    value={
                                                                                        editValues.grams
                                                                                    }
                                                                                    onChange={(e) =>
                                                                                        setEditValues(
                                                                                            (
                                                                                                v
                                                                                            ) => ({
                                                                                                ...v,
                                                                                                grams: e
                                                                                                    .target
                                                                                                    .value,
                                                                                            })
                                                                                        )
                                                                                    }
                                                                                    aria-label={`Edit grams for ${foodName}`}
                                                                                    style={{
                                                                                        width: "60px",
                                                                                    }}
                                                                                />
                                                                            ) : (
                                                                                item.grams
                                                                            )}
                                                                        </td>
                                                                        {!isPresetActive && (
                                                                            <td>
                                                                                <div className="icon-row">
                                                                                    <button
                                                                                        type="button"
                                                                                        className="icon-btn"
                                                                                        onClick={
                                                                                            isEditing
                                                                                                ? saveEditing
                                                                                                : startEditing
                                                                                        }
                                                                                        aria-label={
                                                                                            isEditing
                                                                                                ? `Save ${foodName}`
                                                                                                : `Edit ${foodName}`
                                                                                        }
                                                                                    >
                                                                                        {isEditing ? (
                                                                                            <Check
                                                                                                size={
                                                                                                    14
                                                                                                }
                                                                                            />
                                                                                        ) : (
                                                                                            <Pencil
                                                                                                size={
                                                                                                    14
                                                                                                }
                                                                                            />
                                                                                        )}
                                                                                    </button>
                                                                                    <button
                                                                                        type="button"
                                                                                        className="icon-btn danger"
                                                                                        onClick={() =>
                                                                                            onRemoveMealItem(
                                                                                                meal,
                                                                                                item.id
                                                                                            )
                                                                                        }
                                                                                        aria-label={`Remove ${foodName}`}
                                                                                    >
                                                                                        <Trash2
                                                                                            size={
                                                                                                14
                                                                                            }
                                                                                        />
                                                                                    </button>
                                                                                </div>
                                                                            </td>
                                                                        )}
                                                                    </tr>
                                                                );
                                                            })
                                                        ) : (
                                                            <tr>
                                                                <td
                                                                    colSpan={isPresetActive ? 3 : 4}
                                                                    className="empty-cell"
                                                                >
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
                                            <div
                                                className="reason-box"
                                                role="status"
                                                aria-live="polite"
                                            >
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
