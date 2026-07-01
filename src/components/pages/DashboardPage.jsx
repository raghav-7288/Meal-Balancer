import { useCallback } from "react";
import { useDashboardState } from "../../hooks/useDashboardState";
import Kpi from "../ui/Kpi";

import { DashboardSkeleton } from "../ui/Skeleton";
import PlanSidebar from "../dashboard/PlanSidebar";
import MealBuilder from "../dashboard/MealBuilder";
import NutrientSummary from "../dashboard/NutrientSummary";
import NutrientLimits from "../dashboard/NutrientLimits";
import "../../components/dashboard/NutrientLimits.css";
import ComparisonSection from "../dashboard/ComparisonSection";
import DaySelector from "../dashboard/DaySelector";
import CopyPlanModal from "../dashboard/CopyPlanModal";
import PlanGuidelines from "../dashboard/PlanGuidelines";
import DashboardTour from "../dashboard/DashboardTour";
import { VerificationBanner } from "../VerificationStatus";

function DashboardPage() {
    const {
        isAuthenticated,
        profile,
        presetPlans,
        userPlans,
        planView,
        setPlanView,
        activePlanId,
        setActivePlanId,
        activePlan,
        isPresetActive,
        presetLoading,
        plans,
        syncStatus,
        syncError,
        retrySync,
        viewDay,
        setViewDay,
        summaries,
        activeSummary,
        bestSummary,
        dayScore,
        scoreTone,
        nutrientLimits,
        setNutrientLimits,
        isAddingFood,
        addFood,
        updateMealItem,
        removeMealItem,
        newPlanName,
        setNewPlanName,
        saveNewPlan,
        deleteUserPlan,
        resetActivePlan,
        duplicatePresetAsUserPlan,
        copyModal,
        setCopyModal,
        copyPlanName,
        setCopyPlanName,
        confirmCopyPlan,
        copyModalRef,
        guidelines,
        setGuidelines,
        saveGuidelines,
        deleteToast,
        setDeleteToast,
        itemDeleteToast,
        setItemDeleteToast,
        visibleFatLimit,
        userGoalNames,
        logToday,
    } = useDashboardState();

    const handleChangeLimit = useCallback(
        (key, value) => {
            setNutrientLimits((prev) => ({ ...prev, [key]: value }));
        },
        [setNutrientLimits]
    );

    // Show skeleton loading state until plans are available (#30)
    if (presetLoading && plans.length === 0) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="dashboard-page">
            <DashboardTour />
            <VerificationBanner />

            {deleteToast && (
                <div className="delete-toast-popup" role="alert" aria-live="assertive">
                    <span>Plan &ldquo;{deleteToast.planName}&rdquo; deleted</span>
                    <div className="delete-toast-actions">
                        <button type="button" className="undo-btn" onClick={deleteToast.undoAction}>
                            Undo
                        </button>
                        <button
                            type="button"
                            className="close-btn"
                            onClick={() => setDeleteToast(null)}
                            aria-label="Dismiss notification"
                        >
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
                        <button
                            type="button"
                            className="close-btn"
                            onClick={() => setItemDeleteToast(null)}
                            aria-label="Dismiss notification"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            <CopyPlanModal
                copyModal={copyModal}
                setCopyModal={setCopyModal}
                copyPlanName={copyPlanName}
                setCopyPlanName={setCopyPlanName}
                confirmCopyPlan={confirmCopyPlan}
                copyModalRef={copyModalRef}
            />

            <DaySelector
                viewDay={viewDay}
                setViewDay={setViewDay}
                isAuthenticated={isAuthenticated}
                syncStatus={syncStatus}
                syncError={syncError}
                retrySync={retrySync}
                logToday={logToday}
            />

            <div className="dashboard">
                <PlanSidebar
                    presetPlans={presetPlans}
                    userPlans={userPlans}
                    planView={planView}
                    setPlanView={setPlanView}
                    activePlanId={activePlanId}
                    setActivePlanId={setActivePlanId}
                    summaries={summaries}
                    newPlanName={newPlanName}
                    setNewPlanName={setNewPlanName}
                    onCreatePlan={saveNewPlan}
                    onResetPlan={resetActivePlan}
                    onDeletePlan={deleteUserPlan}
                    onDuplicatePreset={duplicatePresetAsUserPlan}
                    visibleFatLimit={visibleFatLimit}
                    profile={profile}
                    userGoalNames={userGoalNames}
                    dayTotals={activeSummary?.dayTotals}
                />

                <div className="content" role="region" aria-label="Meal plan details">
                    {/* KPI row (#33) */}
                    <div className="kpi-grid kpi-grid--flex">
                        <Kpi
                            label={`${viewDay} score`}
                            value={dayScore}
                            tone={scoreTone}
                            hint={activeSummary?.dayScore?.band || "No band"}
                        />
                        <Kpi
                            label="Energy"
                            value={Math.round(activeSummary?.dayTotals?.kcal || 0)}
                            hint="kcal/day"
                        />
                        <Kpi
                            label="Vegetables"
                            value={Math.round(activeSummary?.dayTotals?.vegetablesG || 0)}
                            hint="g/day"
                        />
                        <Kpi
                            label="Visible fat"
                            value={Math.round(activeSummary?.dayTotals?.visibleFat || 0)}
                            hint="g/day"
                        />
                    </div>

                    <NutrientLimits
                        limits={nutrientLimits}
                        onChangeLimit={handleChangeLimit}
                        dayTotals={activeSummary?.dayTotals}
                    />

                    <MealBuilder
                        activePlan={activePlan}
                        activeSummary={activeSummary}
                        isPresetActive={isPresetActive}
                        viewDay={viewDay}
                        onAddFood={addFood}
                        isAddingFood={isAddingFood}
                        onUpdateMealItem={updateMealItem}
                        onRemoveMealItem={removeMealItem}
                    />

                    <PlanGuidelines
                        guidelines={guidelines}
                        setGuidelines={setGuidelines}
                        saveGuidelines={saveGuidelines}
                        isPresetActive={isPresetActive}
                    />

                    <NutrientSummary
                        activeSummary={activeSummary}
                        activePlan={activePlan}
                        viewDay={viewDay}
                    />

                    <ComparisonSection summaries={summaries} bestSummary={bestSummary} />
                </div>
            </div>
        </div>
    );
}

export default DashboardPage;
