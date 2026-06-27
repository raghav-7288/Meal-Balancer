import { memo, useState } from "react";
import { Plus, Pencil, Check, Trash2, ChevronDown } from "lucide-react";
import { MEALS } from "../../data/presetPlans";
import { foodById } from "../../engines/nutrientEngine";
import Section from "../ui/Section";
import FoodAutocomplete from "./FoodAutocomplete";
import "./FoodAutocomplete.css";

/** Per-slot empty state */
const emptySlotForm = () => ({
    foodId: "",
    foodName: "",
    foodGroupId: null,
    grams: "",
    instructions: "",
});

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
    // Per-slot add-food form state
    const [slotForms, setSlotForms] = useState(() => {
        const init = {};
        for (const m of MEALS) init[m] = emptySlotForm();
        return init;
    });

    const toggleSlot = (meal) => {
        setCollapsedSlots((prev) => ({ ...prev, [meal]: !prev[meal] }));
    };

    const updateSlotForm = (meal, patch) => {
        setSlotForms((prev) => ({ ...prev, [meal]: { ...prev[meal], ...patch } }));
    };

    const resetSlotForm = (meal) => {
        setSlotForms((prev) => ({ ...prev, [meal]: emptySlotForm() }));
    };

    const handleAdd = (meal) => {
        const f = slotForms[meal];
        if (!f.foodName || !f.foodId || !f.grams || Number(f.grams) <= 0) return;
        onAddFood(meal, f.foodId, f.foodName, f.grams, f.instructions, f.foodGroupId);
        resetSlotForm(meal);
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
                            const form = slotForms[meal];

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
                                                            <th scope="col">Group</th>
                                                            <th scope="col">Exchange</th>
                                                            {!isPresetActive && (
                                                                <th scope="col">Actions</th>
                                                            )}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {mealItems.length ? (
                                                            mealItems.map((item) => {
                                                                const food = foodById(item.foodId);
                                                                const foodName =
                                                                    food?.name ||
                                                                    item.foodName ||
                                                                    "-";
                                                                const foodGroup =
                                                                    food?.group ||
                                                                    item.foodGroup ||
                                                                    "-";
                                                                const isEditing =
                                                                    editingItemId === item.id;
                                                                const displayGrams = isEditing
                                                                    ? editValues.grams
                                                                    : item.grams;
                                                                const gramsPerExchange =
                                                                    food?.gramsPerExchange || 100;
                                                                const rawExchange =
                                                                    Number(displayGrams) /
                                                                    gramsPerExchange;
                                                                const exchange = Number.isFinite(
                                                                    rawExchange
                                                                )
                                                                    ? rawExchange
                                                                    : 0;

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
                                                                        <td>{foodName}</td>
                                                                        <td>
                                                                            {isEditing ? (
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
                                                                        <td>{foodGroup}</td>
                                                                        <td>
                                                                            {exchange.toFixed(2)}
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
                                                                    colSpan={isPresetActive ? 5 : 6}
                                                                    className="empty-cell"
                                                                >
                                                                    No items for {viewDay}.
                                                                </td>
                                                            </tr>
                                                        )}

                                                        {/* Inline add-food row for this slot */}
                                                        {!isPresetActive && (
                                                            <tr className="inline-add-row">
                                                                <td>
                                                                    <input
                                                                        type="text"
                                                                        value={form.instructions}
                                                                        placeholder="Menu/Instructions"
                                                                        onChange={(e) =>
                                                                            updateSlotForm(meal, {
                                                                                instructions:
                                                                                    e.target.value,
                                                                            })
                                                                        }
                                                                        aria-label={`Instructions for new food in ${meal}`}
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <FoodAutocomplete
                                                                        value={form.foodName}
                                                                        onChange={(val) => {
                                                                            updateSlotForm(meal, {
                                                                                foodName: val,
                                                                            });
                                                                            if (!val) {
                                                                                updateSlotForm(
                                                                                    meal,
                                                                                    {
                                                                                        foodId: "",
                                                                                        foodGroupId:
                                                                                            null,
                                                                                    }
                                                                                );
                                                                            }
                                                                        }}
                                                                        onSelect={(item) => {
                                                                            updateSlotForm(meal, {
                                                                                foodId: String(
                                                                                    item.food_id
                                                                                ),
                                                                                foodName:
                                                                                    item.food_name,
                                                                                foodGroupId:
                                                                                    item.major_group_id,
                                                                            });
                                                                        }}
                                                                        placeholder="Search food…"
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        value={form.grams}
                                                                        placeholder="g"
                                                                        onChange={(e) => {
                                                                            const val =
                                                                                e.target.value;
                                                                            if (
                                                                                val === "" ||
                                                                                Number(val) >= 0
                                                                            )
                                                                                updateSlotForm(
                                                                                    meal,
                                                                                    { grams: val }
                                                                                );
                                                                        }}
                                                                        aria-label={`Grams for new food in ${meal}`}
                                                                    />
                                                                </td>
                                                                <td colSpan={2}></td>
                                                                <td>
                                                                    <button
                                                                        type="button"
                                                                        className="icon-btn add-inline-btn"
                                                                        onClick={() =>
                                                                            handleAdd(meal)
                                                                        }
                                                                        disabled={
                                                                            isAddingFood ||
                                                                            !form.foodName ||
                                                                            !form.grams ||
                                                                            Number(form.grams) <= 0
                                                                        }
                                                                        aria-label={`Add food to ${meal}`}
                                                                        title="Add food"
                                                                    >
                                                                        <Plus size={16} />
                                                                    </button>
                                                                </td>
                                                            </tr>
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
