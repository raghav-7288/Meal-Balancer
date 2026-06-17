import { Plus, Copy, Trash2 } from "lucide-react";
import { FOODS } from "../../data/foods";
import { MEALS, DAYS } from "../../data/presetPlans";
import { foodById } from "../../engines/nutrientEngine";
import Section from "../ui/Section";
import Field from "../ui/Field";

function MealBuilder({
    activePlan,
    activeSummary,
    isPresetActive,
    selectedMeal,
    setSelectedMeal,
    selectedFoodId,
    setSelectedFoodId,
    grams,
    setGrams,
    selectedDay,
    setSelectedDay,
    instructions,
    setInstructions,
    onAddFood,
    onUpdateMealItem,
    onRemoveMealItem,
    onDuplicateMealItem,
}) {
    return (
        <Section title="Meal builder" icon={<Plus size={16} />}>
            <div className="builder-row">
                <Field label="Day">
                    <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} aria-label="Select day">
                        <option value="" disabled>Select day</option>
                        {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                </Field>
                <Field label="Meal slot">
                    <select value={selectedMeal} onChange={(e) => setSelectedMeal(e.target.value)} aria-label="Select meal slot">
                        <option value="" disabled>Select slot</option>
                        {MEALS.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                </Field>
                <Field label="Food item">
                    <select value={selectedFoodId} onChange={(e) => setSelectedFoodId(e.target.value)} aria-label="Select food item">
                        <option value="" disabled>Select item</option>
                        {FOODS.map((food) => <option key={food.id} value={food.id}>{food.name}</option>)}
                    </select>
                </Field>
                <Field label="Grams">
                    <input
                        type="number"
                        value={grams}
                        placeholder="Select grams"
                        onChange={(e) => setGrams(e.target.value)}
                        aria-label="Food quantity in grams"
                    />
                </Field>
                <button onClick={onAddFood} aria-label="Add food to meal">Add food</button>
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

            <div className="meal-panels">
                {MEALS.map((meal) => {
                    const mealItems = activePlan.meals[meal] || [];
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
                                            <th>Food</th><th>g</th><th>Day</th><th>Group</th><th>Exchange</th><th>Instructions</th><th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {mealItems.length ? mealItems.map((item) => {
                                            const food = foodById(item.foodId);
                                            const exchange = food ? item.grams / food.gramsPerExchange : 0;
                                            return (
                                                <tr key={item.id}>
                                                    <td>{food?.name || "-"}</td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            value={item.grams}
                                                            onChange={(e) => onUpdateMealItem(meal, item.id, e.target.value)}
                                                            disabled={isPresetActive}
                                                            aria-label={`Grams for ${food?.name || "item"}`}
                                                        />
                                                    </td>
                                                    <td>{item.day || "-"}</td>
                                                    <td>{food?.group || "-"}</td>
                                                    <td>{exchange.toFixed(2)}</td>
                                                    <td className="instructions-cell">{item.instructions || "-"}</td>
                                                    <td>
                                                        <div className="icon-row">
                                                            <button
                                                                className="icon-btn"
                                                                onClick={() => onDuplicateMealItem(meal, item)}
                                                                disabled={isPresetActive}
                                                                aria-label={`Duplicate ${food?.name || "item"}`}
                                                            >
                                                                <Copy size={14} />
                                                            </button>
                                                            <button
                                                                className="icon-btn danger"
                                                                onClick={() => onRemoveMealItem(meal, item.id)}
                                                                disabled={isPresetActive}
                                                                aria-label={`Remove ${food?.name || "item"}`}
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }) : (
                                            <tr><td colSpan={7} className="empty-cell">No items yet.</td></tr>
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

