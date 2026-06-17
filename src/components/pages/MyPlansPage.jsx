import { usePlan } from "../../context/PlanContext";
import PlanSidebar from "../dashboard/PlanSidebar";
import ComparisonSection from "../dashboard/ComparisonSection";

function MyPlansPage() {
    const {
        presetPlans,
        userPlans,
        planView,
        setPlanView,
        activePlanId,
        setActivePlanId,
        summaries,
        bestSummary,
        newPlanName,
        setNewPlanName,
        saveNewPlan,
        resetActivePlan,
        deleteUserPlan,
        duplicatePresetAsUserPlan,
        visibleFatLimit,
        profile,
        userGoalNames,
        toast,
    } = usePlan();

    return (
        <div className="dashboard-page">
            {toast && <div className="toast-popup" role="alert" aria-live="polite">{toast}</div>}

            <div className="my-plans-layout">
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
                />

                <main className="content">
                    <ComparisonSection summaries={summaries} bestSummary={bestSummary} />
                </main>
            </div>
        </div>
    );
}

export default MyPlansPage;

