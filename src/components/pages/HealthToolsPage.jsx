import { useState, useCallback, lazy, Suspense } from "react";
import { Calculator, Droplets, Flame, Footprints, Loader2 } from "lucide-react";

const BmiCalculatorPage = lazy(() => import("./BmiCalculatorPage"));
const WaterTrackerPage = lazy(() => import("./WaterTrackerPage"));
const CalorieCalculatorPage = lazy(() => import("./CalorieCalculatorPage"));
const StepTrackerPage = lazy(() => import("./StepTrackerPage"));

const TOOLS = [
    { id: "bmi", label: "BMI Calculator", icon: Calculator, color: "#2563eb" },
    { id: "water", label: "Water Tracker", icon: Droplets, color: "#06b6d4" },
    { id: "calories", label: "Calorie Calculator", icon: Flame, color: "#f97316" },
    { id: "steps", label: "Step Tracker", icon: Footprints, color: "#10b981" },
];

function HealthToolsPage() {
    const [activeTab, setActiveTab] = useState("bmi");

    const handleTabKeyDown = useCallback((e, index) => {
        let newIndex;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            newIndex = (index + 1) % TOOLS.length;
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            newIndex = (index - 1 + TOOLS.length) % TOOLS.length;
        } else if (e.key === "Home") {
            e.preventDefault();
            newIndex = 0;
        } else if (e.key === "End") {
            e.preventDefault();
            newIndex = TOOLS.length - 1;
        }
        if (newIndex !== undefined) {
            setActiveTab(TOOLS[newIndex].id);
            const tabs = e.currentTarget.parentElement?.querySelectorAll('[role="tab"]');
            tabs?.[newIndex]?.focus();
        }
    }, []);

    return (
        <div className="health-tools-page">
            <h1 className="sr-only">Health Tools</h1>
            {/* Tab bar */}
            <div className="health-tools-tabs" role="tablist" aria-label="Health tools">
                {TOOLS.map((tool, index) => {
                    const Icon = tool.icon;
                    const isActive = activeTab === tool.id;
                    return (
                        <button
                            key={tool.id}
                            type="button"
                            role="tab"
                            id={`health-tab-${tool.id}`}
                            aria-selected={isActive}
                            aria-controls={`health-panel-${tool.id}`}
                            tabIndex={isActive ? 0 : -1}
                            className={`health-tools-tab ${isActive ? "active" : ""}`}
                            onClick={() => setActiveTab(tool.id)}
                            onKeyDown={(e) => handleTabKeyDown(e, index)}
                            style={isActive ? { "--tab-color": tool.color } : {}}
                        >
                            <Icon size={18} aria-hidden="true" />
                            <span>{tool.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Tool content */}
            <div
                className="health-tools-content"
                role="tabpanel"
                id={`health-panel-${activeTab}`}
                aria-labelledby={`health-tab-${activeTab}`}
            >
                <Suspense
                    fallback={
                        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
                            <Loader2 size={24} className="spin" style={{ color: "#3b82f6" }} />
                        </div>
                    }
                >
                    {activeTab === "bmi" && <BmiCalculatorPage />}
                    {activeTab === "water" && <WaterTrackerPage />}
                    {activeTab === "calories" && <CalorieCalculatorPage />}
                    {activeTab === "steps" && <StepTrackerPage />}
                </Suspense>
            </div>
        </div>
    );
}

export default HealthToolsPage;
