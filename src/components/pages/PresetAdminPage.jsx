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
} from "lucide-react";
import { MEALS, DAYS } from "../../data/presetPlans";
import { foodById } from "../../engines/nutrientEngine";
import { usePresetPlanAdmin } from "../../hooks/usePresetPlanAdmin";
import { getMajorGroups } from "../../services/databaseService";
import Section from "../ui/Section";
import FoodAutocomplete from "../dashboard/FoodAutocomplete";
import "../dashboard/FoodAutocomplete.css";

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
    const [editValues, setEditValues] = useState({ grams: "", instructions: "" });
    const [majorGroups, setMajorGroups] = useState([]);
    const [slotForms, setSlotForms] = useState(() => {
        const init = {};
        for (const m of MEALS)
            init[m] = { foodId: "", foodName: "", foodGroupId: null, grams: "", instructions: "" };
        return init;
    });

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

    const updateSlotForm = (meal, patch) => {
        setSlotForms((prev) => ({ ...prev, [meal]: { ...prev[meal], ...patch } }));
    };

    const resetSlotForm = (meal) => {
        setSlotForms((prev) => ({
            ...prev,
            [meal]: { foodId: "", foodName: "", foodGroupId: null, grams: "", instructions: "" },
        }));
    };

    const handleAddFood = (meal) => {
        const f = slotForms[meal];
        if (!f.foodName || !f.foodId || !f.grams || Number(f.grams) <= 0) return;
        const foodGroup = groupNameById(f.foodGroupId);
        addFood(meal, f.foodId, f.foodName, f.grams, f.instructions, f.foodGroupId, foodGroup);
        resetSlotForm(meal);
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
                        <button className="undo-btn" onClick={deleteToast.undoAction}>
                            Undo
                        </button>
                        <button className="close-btn" onClick={() => setDeleteToast(null)}>
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
                            <button onClick={handleCreatePlan} disabled={!newPlanName.trim()}>
                                Create
                            </button>
                            <button
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
                                        className={`plan-row ${plan.id === activePlanId ? "active" : ""}`}
                                        onClick={() => setActivePlanId(plan.id)}
                                        aria-label={`Select plan: ${plan.name}, order #${plan.displayOrder}`}
                                    >
                                        <span>{plan.name}</span>
                                        <strong>#{plan.displayOrder}</strong>
                                    </button>
                                    <div className="plan-action-btns">
                                        <button
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
                                                                    <th>Group</th>
                                                                    <th>Exchange</th>
                                                                    <th>Actions</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {items.length > 0 ? (
                                                                    items.map((item) => {
                                                                        const isEditing =
                                                                            editingItemId ===
                                                                            item.id;
                                                                        const displayGrams =
                                                                            isEditing
                                                                                ? editValues.grams
                                                                                : item.grams;
                                                                        const food = foodById(
                                                                            item.foodId
                                                                        );
                                                                        const foodGroup =
                                                                            food?.group ||
                                                                            item.foodGroup ||
                                                                            groupNameById(
                                                                                item.foodGroupId
                                                                            ) ||
                                                                            "-";
                                                                        const rawExchange = food
                                                                            ? Number(displayGrams) /
                                                                              (food.gramsPerExchange ||
                                                                                  1)
                                                                            : Number(displayGrams) /
                                                                              100;
                                                                        const exchange =
                                                                            Number.isFinite(
                                                                                rawExchange
                                                                            )
                                                                                ? rawExchange
                                                                                : 0;

                                                                        const startEditing = () => {
                                                                            setEditingItemId(
                                                                                item.id
                                                                            );
                                                                            setEditValues({
                                                                                grams: item.grams,
                                                                                instructions:
                                                                                    item.instructions ||
                                                                                    "",
                                                                            });
                                                                        };

                                                                        const saveEditing = () => {
                                                                            updateMealItem(
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
                                                                                            onChange={(
                                                                                                e
                                                                                            ) =>
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
                                                                                            aria-label={`Edit instructions for ${item.foodName || item.foodId}`}
                                                                                            placeholder="Menu/Instructions"
                                                                                        />
                                                                                    ) : (
                                                                                        item.instructions ||
                                                                                        "-"
                                                                                    )}
                                                                                </td>
                                                                                <td>
                                                                                    {item.foodName ||
                                                                                        item.foodId}
                                                                                </td>
                                                                                <td>
                                                                                    {isEditing ? (
                                                                                        <input
                                                                                            type="number"
                                                                                            min="0"
                                                                                            value={
                                                                                                editValues.grams
                                                                                            }
                                                                                            onChange={(
                                                                                                e
                                                                                            ) =>
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
                                                                                            style={{
                                                                                                width: "60px",
                                                                                            }}
                                                                                            aria-label={`Edit grams for ${item.foodName || item.foodId}`}
                                                                                        />
                                                                                    ) : (
                                                                                        displayGrams
                                                                                    )}
                                                                                </td>
                                                                                <td>{foodGroup}</td>
                                                                                <td>
                                                                                    {exchange.toFixed(
                                                                                        2
                                                                                    )}
                                                                                </td>
                                                                                <td>
                                                                                    <div className="icon-row">
                                                                                        <button
                                                                                            className="icon-btn"
                                                                                            onClick={
                                                                                                isEditing
                                                                                                    ? saveEditing
                                                                                                    : startEditing
                                                                                            }
                                                                                            aria-label={
                                                                                                isEditing
                                                                                                    ? "Save"
                                                                                                    : "Edit"
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
                                                                                            className="icon-btn danger"
                                                                                            onClick={() =>
                                                                                                removeMealItem(
                                                                                                    meal,
                                                                                                    item.id
                                                                                                )
                                                                                            }
                                                                                            aria-label={`Remove ${item.foodName || item.foodId}`}
                                                                                        >
                                                                                            <Trash2
                                                                                                size={
                                                                                                    14
                                                                                                }
                                                                                            />
                                                                                        </button>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })
                                                                ) : (
                                                                    <tr>
                                                                        <td
                                                                            colSpan={6}
                                                                            className="empty-cell"
                                                                        >
                                                                            No items for {viewDay}.
                                                                        </td>
                                                                    </tr>
                                                                )}

                                                                {/* Inline add-food row */}
                                                                <tr className="inline-add-row">
                                                                    <td>
                                                                        <input
                                                                            type="text"
                                                                            value={
                                                                                form.instructions
                                                                            }
                                                                            placeholder="Menu/Instructions"
                                                                            onChange={(e) =>
                                                                                updateSlotForm(
                                                                                    meal,
                                                                                    {
                                                                                        instructions:
                                                                                            e.target
                                                                                                .value,
                                                                                    }
                                                                                )
                                                                            }
                                                                            aria-label={`Instructions for new food in ${meal}`}
                                                                        />
                                                                    </td>
                                                                    <td>
                                                                        <FoodAutocomplete
                                                                            value={form.foodName}
                                                                            onChange={(val) => {
                                                                                updateSlotForm(
                                                                                    meal,
                                                                                    {
                                                                                        foodName:
                                                                                            val,
                                                                                    }
                                                                                );
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
                                                                                updateSlotForm(
                                                                                    meal,
                                                                                    {
                                                                                        foodId: String(
                                                                                            item.food_id
                                                                                        ),
                                                                                        foodName:
                                                                                            item.food_name,
                                                                                        foodGroupId:
                                                                                            item.major_group_id,
                                                                                    }
                                                                                );
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
                                                                                        {
                                                                                            grams: val,
                                                                                        }
                                                                                    );
                                                                            }}
                                                                            aria-label={`Grams for new food in ${meal}`}
                                                                        />
                                                                    </td>
                                                                    <td colSpan={2}></td>
                                                                    <td>
                                                                        <button
                                                                            className="icon-btn add-inline-btn"
                                                                            onClick={() =>
                                                                                handleAddFood(meal)
                                                                            }
                                                                            disabled={
                                                                                !form.foodName ||
                                                                                !form.grams ||
                                                                                Number(
                                                                                    form.grams
                                                                                ) <= 0
                                                                            }
                                                                            aria-label={`Add food to ${meal}`}
                                                                            title="Add food"
                                                                        >
                                                                            <Plus size={16} />
                                                                        </button>
                                                                    </td>
                                                                </tr>
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
