import { Database } from "lucide-react";
import { usePlan } from "../../context/PlanContext";
import Kpi from "../ui/Kpi";
import { StatCard, EditableStatCard } from "../ui/StatCard";
import MealBuilder from "../dashboard/MealBuilder";
import NutrientSummary from "../dashboard/NutrientSummary";
import MacroChart from "../dashboard/MacroChart";
import Section from "../ui/Section";

function MealPlannerPage() {
    const {
        plans,
        activePlanId,
        setActivePlanId,
        activePlan,
        activeSummary,
        isPresetActive,
        vegetableTarget,
        setVegetableTarget,
        sugarLimit,
        setSugarLimit,
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
        toast,
        addFood,
        updateMealItem,
        removeMealItem,
        duplicateMealItem,
    } = usePlan();

    const dayScore = activeSummary?.dayScore?.score || 0;
    const scoreTone =
        dayScore >= 85 ? "good" : dayScore >= 70 ? "neutral" : dayScore >= 50 ? "warn" : "bad";

    return (
        <div className="dashboard-page">
            {toast && <div className="toast-popup" role="alert" aria-live="polite">{toast}</div>}

            <div className="hero-stats">
                <StatCard label="Daily score" value={dayScore} tone={scoreTone} />
                <EditableStatCard
                    label="Vegetable target"
                    value={vegetableTarget}
                    unit="g"
                    onChange={(v) => setVegetableTarget(Number(v))}
                />
                <EditableStatCard
                    label="Sugar limit"
                    value={sugarLimit}
                    unit="g"
                    onChange={(v) => setSugarLimit(Number(v))}
                />
            </div>

            <div className="planner-layout">
                <aside className="planner-selector" role="complementary" aria-label="Active plan selector">
                    <Section title="Active plan">
                        <select
                            className="plan-select-dropdown"
                            value={activePlanId}
                            onChange={(e) => setActivePlanId(e.target.value)}
                            aria-label="Select active plan"
                        >
                            <optgroup label="Pre-saved plans">
                                {plans.filter(p => p.isPreset).map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </optgroup>
                            {plans.filter(p => !p.isPreset).length > 0 && (
                                <optgroup label="My plans">
                                    {plans.filter(p => !p.isPreset).map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </optgroup>
                            )}
                        </select>
                        {isPresetActive && (
                            <p className="small-copy" style={{ marginTop: 8, fontStyle: "italic" }}>
                                Preset plans are read-only. Adding food will create a copy.
                            </p>
                        )}
                    </Section>
                </aside>

                <main className="content">
                    <div className="kpi-grid">
                        <Kpi label="Day score" value={dayScore} tone={scoreTone} hint={activeSummary?.dayScore?.band || "No band"} />
                        <Kpi label="Energy" value={Math.round(activeSummary?.dayTotals?.kcal || 0)} hint="kcal/day" />
                        <Kpi label="Vegetables" value={Math.round(activeSummary?.dayTotals?.vegetablesG || 0)} hint="g/day" />
                        <Kpi label="Visible fat" value={Math.round(activeSummary?.dayTotals?.visibleFat || 0)} hint="g/day" />
                    </div>

                    <MealBuilder
                        activePlan={activePlan}
                        activeSummary={activeSummary}
                        isPresetActive={isPresetActive}
                        selectedMeal={selectedMeal}
                        setSelectedMeal={setSelectedMeal}
                        selectedFoodId={selectedFoodId}
                        setSelectedFoodId={setSelectedFoodId}
                        grams={grams}
                        setGrams={setGrams}
                        selectedDay={selectedDay}
                        setSelectedDay={setSelectedDay}
                        instructions={instructions}
                        setInstructions={setInstructions}
                        onAddFood={addFood}
                        onUpdateMealItem={updateMealItem}
                        onRemoveMealItem={removeMealItem}
                        onDuplicateMealItem={duplicateMealItem}
                    />

                    <NutrientSummary
                        activeSummary={activeSummary}
                        activePlan={activePlan}
                        selectedMeal={selectedMeal}
                    />

                    <Section title="Macronutrient distribution" icon={<Database size={16} />}>
                        <MacroChart dayTotals={activeSummary?.dayTotals} />
                    </Section>
                </main>
            </div>
        </div>
    );
}

export default MealPlannerPage;

