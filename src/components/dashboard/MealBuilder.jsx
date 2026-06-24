import { Plus, Copy, Trash2 } from "lucide-react";
import { MEALS } from "../../data/presetPlans";
import { foodById } from "../../engines/nutrientEngine";
import Section from "../ui/Section";
import Field from "../ui/Field";
import FoodAutocomplete from "./FoodAutocomplete";
import "./FoodAutocomplete.css";

function MealBuilder({
    activePlan,
    activeSummary,
    isPresetActive,
    viewDay,
    selectedMeal,
    setSelectedMeal,
    setSelectedFoodId,
    selectedFoodName,
    setSelectedFoodName,
    setSelectedFoodGroupId,
    grams,
    setGrams,
    instructions,
    setInstructions,
    onAddFood,
    isAddingFood,
    onUpdateMealItem,
    onRemoveMealItem,
    onDuplicateMealItem,
}) {
    return (
        <Section title={`Meal builder — ${viewDay}`} icon={<Plus size={16} />}>
            {!isPresetActive && (
                <>
                    <div className="builder-row builder-row--no-day">
                        <Field label="Meal slot">
                            <select value={selectedMeal} onChange={(e) => setSelectedMeal(e.target.value)} aria-label="Select meal slot">
                                <option value="" disabled>Select slot</option>
                                {MEALS.map((m) => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </Field>
                        <Field label="Food item">
                            <FoodAutocomplete
                                value={selectedFoodName}
                                onChange={(val) => {
                                    setSelectedFoodName(val);
                                    if (!val) {
                                        setSelectedFoodId("");
                                        setSelectedFoodGroupId(null);
                                    }
                                }}
                                onSelect={(item) => {
                                    setSelectedFoodId(String(item.food_id));
                                    setSelectedFoodName(item.food_name);
                                    setSelectedFoodGroupId(item.major_group_id);
                                }}
                                placeholder="Type to search food..."
                            />
                        </Field>
                        <Field label="Grams">
                            <input
                                type="number"
                                min="0"
                                value={grams}
                                placeholder="Enter grams"
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "" || Number(val) >= 0) setGrams(val);
                                }}
                                aria-label="Food quantity in grams"
                            />
                        </Field>
                        <button
                            onClick={onAddFood}
                            disabled={isAddingFood || !selectedMeal || !selectedFoodName || !grams || Number(grams) <= 0}
                            aria-label="Add food to meal"
                        >
                            {isAddingFood ? "Adding..." : "Add food"}
                        </button>
                    </div>

                    <div className="builder-instructions-row">
                        <Field label="Instructions (optional)">
                            <input
                                type="text"
                                value={instructions}
                                placeholder="e.g. lightly roasted, no oil, with salt..."
                                onChange={(e) => setInstructions(e.target.value)}
                                aria-label="Cooking instructions"
                            />
                        </Field>
                    </div>
                </>
            )}

            {isPresetActive && (
                <p className="small-copy" style={{ marginBottom: "1rem", fontStyle: "italic", opacity: 0.8 }}>
                    This is a pre-saved plan. Copy it to &quot;My Plans&quot; to add or edit food items.
                </p>
            )}

            <div className="meal-panels">
                {MEALS.map((meal) => {
                    // Filter items to show only the selected day (backward compat: items without day show always)
                    const mealItems = (activePlan.meals[meal] || []).filter(
                        (i) => i.day === viewDay || !i.day
                    );
                    const mealScore = activeSummary?.mealScores?.[meal]?.score || 0;
                    const mealBand = activeSummary?.mealScores?.[meal]?.band || "Poor balance";
                    const mealReasons = activeSummary?.mealScores?.[meal]?.reasons || [];

                    return (
                        <div key={meal} className="meal-card">
                            <div className="meal-head">
                                <div>
                                    <h3>{meal}</h3>
                                    <p>{mealItems.length} item(s)</p>
                                </div>
                                <div
                                    className={`score-pill ${mealScore >= 70 ? "good" : mealScore >= 50 ? "warn" : "bad"}`}
                                    aria-label={`${meal} score: ${mealScore} out of 100, ${mealBand}`}
                                >
                                    {mealScore} / 100 · {mealBand}
                                </div>
                            </div>
                            <div className="table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Food</th><th>g</th><th>Group</th><th>Exchange</th><th>Instructions</th><th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {mealItems.length ? mealItems.map((item) => {
                                            const food = foodById(item.foodId);
                                            const foodName = food?.name || item.foodName || "-";
                                            const foodGroup = food?.group || item.foodGroup || "-";
                                            const exchange = food ? item.grams / food.gramsPerExchange : (item.grams / 100);
                                            return (
                                                <tr key={item.id}>
                                                    <td>{foodName}</td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            value={item.grams}
                                                            onChange={(e) => onUpdateMealItem(meal, item.id, e.target.value)}
                                                            disabled={isPresetActive}
                                                            aria-label={`Grams for ${foodName}`}
                                                        />
                                                    </td>
                                                    <td>{foodGroup}</td>
                                                    <td>{exchange.toFixed(2)}</td>
                                                    <td className="instructions-cell">{item.instructions || "-"}</td>
                                                    <td>
                                                        <div className="icon-row">
                                                            <button
                                                                className="icon-btn"
                                                                onClick={() => onDuplicateMealItem(meal, item)}
                                                                disabled={isPresetActive}
                                                                aria-label={`Duplicate ${foodName}`}
                                                            >
                                                                <Copy size={14} />
                                                            </button>
                                                            <button
                                                                className="icon-btn danger"
                                                                onClick={() => onRemoveMealItem(meal, item.id)}
                                                                disabled={isPresetActive}
                                                                aria-label={`Remove ${foodName}`}
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }) : (
                                            <tr><td colSpan={6} className="empty-cell">No items for {viewDay}.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="reason-box" role="status" aria-live="polite">
                                <strong>Reasons for imbalance</strong>
                                <ul>{mealReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Section>
    );
}

export default MealBuilder;
