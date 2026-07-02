import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    ArrowLeft,
    Plus,
    Save,
    Trash2,
    Eye,
    EyeOff,
    Loader2,
    ChevronDown,
    Pencil,
    Check,
    Settings,
    X,
} from "lucide-react";
import toast from "react-hot-toast";
import { MEALS, DAYS } from "../../data/presetPlans";
import { usePresetPlanAdmin } from "../../hooks/usePresetPlanAdmin";
import { getMajorGroups } from "../../services/databaseService";
import Section from "../ui/Section";
import IngredientAddForm from "../dashboard/IngredientAddForm";
import FoodAutocomplete from "../dashboard/FoodAutocomplete";
import "../dashboard/FoodAutocomplete.css";
import "../dashboard/IngredientAddForm.css";

function PresetAdminPage() {
    const {
        plans,
        isLoading,
        error,
        activePlanId,
        setActivePlanId,
        activePlan,
        saving,
        isDirty,
        deleteToast,
        setDeleteToast,
        itemDeleteToast,
        setItemDeleteToast,
        viewDay,
        setViewDay,
        createPlan,
        savePlan,
        removePlan,
        toggleActive,
        updatePlanField,
        addFood,
        updateMealItem,
        removeMealItem,
    } = usePresetPlanAdmin();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newPlanName, setNewPlanName] = useState("");
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
    const [majorGroups, setMajorGroups] = useState([]);

    // Fetch major groups for resolving group IDs to names
    useEffect(() => {
        getMajorGroups()
            .then(setMajorGroups)
            .catch(() => {});
    }, []);

    const groupNameById = (groupId) => {
        if (!groupId) return "";
        const group = majorGroups.find((g) => g.major_group_id === groupId);
        return group?.group_name || "";
    };

    const toggleSlot = (meal) => {
        setCollapsedSlots((prev) => ({ ...prev, [meal]: !prev[meal] }));
    };

    /** Handler for IngredientAddForm submit */
    const handleAddIngredients = (meal, instructions, ingredients) => {
        if (!ingredients || ingredients.length === 0) return;
        // Resolve foodGroup names from majorGroups for each ingredient
        const enriched = ingredients.map((ing) => ({
            ...ing,
            foodGroup: groupNameById(ing.foodGroupId),
        }));
        addFood(meal, instructions, enriched);
    };

    const handleCreatePlan = () => {
        if (!newPlanName.trim()) return;
        createPlan(newPlanName);
        setNewPlanName("");
        setShowCreateModal(false);
    };

    const handleSavePlan = () => {
        if (activePlan) savePlan(activePlan);
    };

    if (isLoading) {
        return (
            <div className="dashboard-page">
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: "300px",
                        gap: "12px",
                        color: "#64748b",
                    }}
                >
                    <Loader2 size={32} className="spin" />
                    <p>Loading preset plans…</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-page">
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: "200px",
                        gap: "12px",
                    }}
                >
                    <p className="error-text">Failed to load preset plans: {error}</p>
                    <Link to="/dashboard" className="planner-nav-link">
                        <ArrowLeft size={14} /> Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    // Get items for the active plan's active day in each slot
    const getDayItems = (meal) => {
        if (!activePlan) return [];
        return (activePlan.meals[meal] || []).filter((item) => item.day === viewDay);
    };

    return (
        <div className="dashboard-page">
            {deleteToast && (
                <div className="delete-toast-popup" role="alert" aria-live="assertive">
                    <span>Plan &ldquo;{deleteToast.planName}&rdquo; deleted</span>
                    <div className="delete-toast-actions">
                        <button type="button" className="undo-btn" onClick={deleteToast.undoAction}>
                            Undo
                        </button>
                        <button type="button" className="close-btn" onClick={() => setDeleteToast(null)}>
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {itemDeleteToast && (
                <div className="delete-toast-popup" role="alert" aria-live="assertive">
                    <span>🗑️ Removed &ldquo;{itemDeleteToast.foodLabel}&rdquo;</span>
                    <div className="delete-toast-actions">
                        <button type="button" className="undo-btn" onClick={itemDeleteToast.undoAction}>
                            Undo
                        </button>
                        <button type="button" className="close-btn" onClick={() => setItemDeleteToast(null)} aria-label="Dismiss">
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* Create plan modal — same pattern as CopyPlanModal */}
            {showCreateModal && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowCreateModal(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Create preset plan"
                >
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Create new preset plan:</h3>
                        <input
                            type="text"
                            className="modal-input"
                            value={newPlanName}
                            onChange={(e) => setNewPlanName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleCreatePlan()}
                            autoFocus
                            placeholder="Enter plan name"
                        />
                        <div className="modal-actions">
                            <button type="button" onClick={handleCreatePlan} disabled={!newPlanName.trim()}>
                                Create
                            </button>
                            <button
                                type="button"
                                className="secondary"
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setNewPlanName("");
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Day selector row — same as dashboard */}
            <div className="day-selector-row">
                <div className="day-chips" role="tablist" aria-label="Select day to view">
                    {DAYS.map((d) => (
                        <button
                            type="button"
                            key={d}
                            className={`day-chip ${viewDay === d ? "active" : ""}`}
                            onClick={() => setViewDay(d)}
                            role="tab"
                            aria-selected={viewDay === d}
                        >
                            {d.slice(0, 3)}
                        </button>
                    ))}
                </div>
                <div className="planner-nav-actions">
                    <Link to="/dashboard" className="planner-nav-link">
                        <ArrowLeft size={14} /> Dashboard
                    </Link>
                </div>
            </div>

            <div className="dashboard">
                {/* Sidebar — same structure as dashboard */}
                <aside
                    className="sidebar"
                    role="complementary"
                    aria-label="Preset plan controls sidebar"
                >
                    <Section title="Preset Plans" icon={<Settings size={16} />}>
                        <p
                            className="small-copy"
                            style={{ marginBottom: "0.5rem", fontStyle: "italic", opacity: 0.8 }}
                        >
                            Manage system-wide preset meal plans
                        </p>
                        <div className="button-row">
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(true)}
                                disabled={saving}
                                aria-label="Create new preset plan"
                                style={{ width: "100%", justifyContent: "center" }}
                            >
                                <Plus size={14} /> Create New Plan
                            </button>
                        </div>

                        <div className="saved-plans" role="list" aria-label="Preset plans">
                            {plans.length === 0 && (
                                <p
                                    className="small-copy"
                                    style={{ textAlign: "center", padding: "1rem 0" }}
                                >
                                    No preset plans yet. Create one above.
                                </p>
                            )}
                            {plans.map((plan) => (
                                <div
                                    key={plan.id}
                                    className={`plan-row-wrapper ${plan.id === activePlanId ? "active" : ""}`}
                                    role="listitem"
                                    style={!plan.isActive ? { opacity: 0.55 } : undefined}
                                >
                                    <button
                                        type="button"
                                        className={`plan-row ${plan.id === activePlanId ? "active" : ""}`}
                                        onClick={() => setActivePlanId(plan.id)}
                                        aria-label={`Select plan: ${plan.name}, order #${plan.displayOrder}`}
                                    >
                                        <span>{plan.name}</span>
                                        <strong>#{plan.displayOrder}</strong>
                                    </button>
                                    <div className="plan-action-btns">
                                        <button
                                            type="button"
                                            className="download-btn tooltip-btn"
                                            data-tooltip={plan.isActive ? "Deactivate" : "Activate"}
                                            onClick={() => toggleActive(plan.id)}
                                            aria-label={
                                                plan.isActive
                                                    ? `Deactivate ${plan.name}`
                                                    : `Activate ${plan.name}`
                                            }
                                        >
                                            {plan.isActive ? (
                                                <Eye size={18} />
                                            ) : (
                                                <EyeOff size={18} />
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            className="delete-btn tooltip-btn"
                                            data-tooltip="Delete Plan"
                                            onClick={() => removePlan(plan.id)}
                                            aria-label={`Delete plan: ${plan.name}`}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Section>
                </aside>

                {/* Main content */}
                <main className="content">
                    {!activePlan ? (
                        <Section title="No plan selected" icon={<Settings size={16} />}>
                            <p
                                className="small-copy"
                                style={{ textAlign: "center", padding: "2rem 0" }}
                            >
                                Select a plan from the sidebar or create a new one.
                            </p>
                        </Section>
                    ) : (
                        <>
                            {/* Plan metadata section */}
                            <Section
                                title={`Editing: ${activePlan.name}`}
                                icon={<Pencil size={16} />}
                                headerRight={
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "10px",
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: "12px",
                                                color: saving
                                                    ? "#f59e0b"
                                                    : isDirty
                                                      ? "#ef4444"
                                                      : "#10b981",
                                                fontWeight: 500,
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {saving
                                                ? "Saving…"
                                                : isDirty
                                                  ? "Unsaved changes"
                                                  : "All changes saved"}
                                        </span>
                                        <button
                                            type="button"
                                            className="log-today-btn"
                                            onClick={handleSavePlan}
                                            disabled={saving}
                                            style={{
                                                margin: 0,
                                                padding: "6px 14px",
                                                fontSize: "13px",
                                            }}
                                        >
                                            {saving ? (
                                                <Loader2 size={14} className="spin" />
                                            ) : (
                                                <Save size={14} />
                                            )}
                                            Save Plan
                                        </button>
                                    </div>
                                }
                            >
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr auto",
                                        gap: "12px",
                                        marginBottom: "12px",
                                    }}
                                >
                                    <div>
                                        <label
                                            className="small-copy"
                                            style={{
                                                display: "block",
                                                marginBottom: "4px",
                                                fontWeight: 600,
                                            }}
                                        >
                                            Plan Name
                                        </label>
                                        <input
                                            type="text"
                                            value={activePlan.name}
                                            onChange={(e) =>
                                                updatePlanField("name", e.target.value)
                                            }
                                            className="plan-name-input"
                                            style={{ marginBottom: 0 }}
                                        />
                                    </div>
                                    <div>
                                        <label
                                            className="small-copy"
                                            style={{
                                                display: "block",
                                                marginBottom: "4px",
                                                fontWeight: 600,
                                            }}
                                        >
                                            Order
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={activePlan.displayOrder}
                                            onChange={(e) =>
                                                updatePlanField(
                                                    "displayOrder",
                                                    Number(e.target.value)
                                                )
                                            }
                                            className="plan-name-input"
                                            style={{ marginBottom: 0, width: "80px" }}
                                        />
                                    </div>
                                </div>
                            </Section>

                            {/* Meal builder section — same pattern as dashboard MealBuilder */}
                            <Section title={`Meal builder — ${viewDay}`} icon={<Plus size={16} />}>
                                <div className="meal-panels">
                                    {MEALS.map((meal) => {
                                        const items = getDayItems(meal);

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
                                                            <p>{items.length} item(s)</p>
                                                        </div>
                                                    </div>
                                                    <div className="score-pill">
                                                        {items.length} items
                                                    </div>
                                                </div>
                                                {!collapsedSlots[meal] && (
                                                    <div className="table-wrap">
                                                        <table>
                                                            <thead>
                                                                <tr>
                                                                    <th>Menu/Instructions</th>
                                                                    <th>Food</th>
                                                                    <th>g</th>
                                                                    <th>Actions</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {items.length > 0 ? (
                                                                    items.map((item) => {
                                                                        const isComposite =
                                                                            item.ingredients &&
                                                                            item.ingredients.length > 0;
                                                                        const isEditing =
                                                                            editingItemId ===
                                                                            item.id;

                                                                        const startEditing = () => {
                                                                            setEditingItemId(item.id);
                                                                            const initialIngredients = isComposite
                                                                                ? [...item.ingredients]
                                                                                : [{
                                                                                    foodId: item.foodId || "",
                                                                                    foodName: item.foodName || "",
                                                                                    foodGroupId: item.foodGroupId || null,
                                                                                    grams: item.grams || 0,
                                                                                }];
                                                                            setEditValues({
                                                                                grams: item.grams,
                                                                                instructions: item.instructions || "",
                                                                                ingredients: initialIngredients,
                                                                                foodId: item.foodId || "",
                                                                                foodName: item.foodName || "",
                                                                                foodGroupId: item.foodGroupId || null,
                                                                            });
                                                                            setEditNewIngredient({ foodId: "", foodName: "", foodGroupId: null, grams: "" });
                                                                        };

                                                                        const saveEditing = () => {
                                                                            const updates = { instructions: editValues.instructions };
                                                                            if (editValues.ingredients.length > 1) {
                                                                                updates.ingredients = editValues.ingredients;
                                                                                updates.grams = editValues.ingredients.reduce(
                                                                                    (sum, ing) => sum + Number(ing.grams), 0
                                                                                );
                                                                            } else if (editValues.ingredients.length === 1) {
                                                                                const single = editValues.ingredients[0];
                                                                                updates.grams = Number(single.grams);
                                                                                updates.foodId = single.foodId;
                                                                                updates.foodName = single.foodName;
                                                                                updates.foodGroupId = single.foodGroupId;
                                                                                updates.ingredients = null;
                                                                            } else {
                                                                                updates.grams = 0;
                                                                            }
                                                                            updateMealItem(meal, item.id, updates);
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
                                                                                            aria-label={`Edit instructions for ${item.foodName || item.foodId}`}
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
                                                                                        item.foodName || item.foodId
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
                                                                                <td>
                                                                                    <div className="icon-row">
                                                                                        {isEditing ? (
                                                                                            <>
                                                                                                <button type="button" className="icon-btn" onClick={saveEditing} aria-label="Save">
                                                                                                    <Check size={14} />
                                                                                                </button>
                                                                                                <button type="button" className="icon-btn" onClick={cancelEditing} aria-label="Cancel edit">
                                                                                                    <X size={14} />
                                                                                                </button>
                                                                                            </>
                                                                                        ) : (
                                                                                            <>
                                                                                                <button type="button" className="icon-btn" onClick={startEditing} aria-label="Edit">
                                                                                                    <Pencil size={14} />
                                                                                                </button>
                                                                                                <button type="button" className="icon-btn danger" onClick={() => removeMealItem(meal, item.id)} aria-label={`Remove ${item.foodName || item.foodId}`}>
                                                                                                    <Trash2 size={14} />
                                                                                                </button>
                                                                                            </>
                                                                                        )}
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })
                                                                ) : (
                                                                    <tr>
                                                                        <td colSpan={4} className="empty-cell">
                                                                            No items for {viewDay}.
                                                                        </td>
                                                                    </tr>
                                                                )}

                                                                {/* Multi-ingredient add form */}
                                                                <IngredientAddForm
                                                                    meal={meal}
                                                                    onAdd={handleAddIngredients}
                                                                    disabled={saving}
                                                                />
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </Section>

                            {/* Guidelines section — after meal builder, same as dashboard */}
                            <Section title="Plan Guidelines" icon={<Pencil size={16} />}>
                                <textarea
                                    value={activePlan.guidelines}
                                    onChange={(e) => updatePlanField("guidelines", e.target.value)}
                                    rows={3}
                                    placeholder="Optional guidelines for this plan…"
                                    className="preset-guidelines-textarea"
                                />
                            </Section>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}

export default PresetAdminPage;
