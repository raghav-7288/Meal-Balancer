import { useState } from "react";
import { Calculator, Droplets, Flame, Footprints } from "lucide-react";
import BmiCalculatorPage from "./BmiCalculatorPage";
import WaterTrackerPage from "./WaterTrackerPage";
import CalorieCalculatorPage from "./CalorieCalculatorPage";
import StepTrackerPage from "./StepTrackerPage";

const TOOLS = [
    { id: "bmi", label: "BMI Calculator", icon: Calculator, color: "#2563eb" },
    { id: "water", label: "Water Tracker", icon: Droplets, color: "#06b6d4" },
    { id: "calories", label: "Calorie Calculator", icon: Flame, color: "#f97316" },
    { id: "steps", label: "Step Tracker", icon: Footprints, color: "#10b981" },
];

function HealthToolsPage() {
    const [activeTab, setActiveTab] = useState("bmi");

    return (
        <div className="health-tools-page">
            {/* Tab bar */}
            <div className="health-tools-tabs">
                {TOOLS.map((tool) => {
                    const Icon = tool.icon;
                    return (
                        <button
                            key={tool.id}
                            className={`health-tools-tab ${activeTab === tool.id ? "active" : ""}`}
                            onClick={() => setActiveTab(tool.id)}
                            style={activeTab === tool.id ? { "--tab-color": tool.color } : {}}
                        >
                            <Icon size={18} />
                            <span>{tool.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Tool content */}
            <div className="health-tools-content">
                {activeTab === "bmi" && <BmiCalculatorPage />}
                {activeTab === "water" && <WaterTrackerPage />}
                {activeTab === "calories" && <CalorieCalculatorPage />}
                {activeTab === "steps" && <StepTrackerPage />}
            </div>
        </div>
    );
}

export default HealthToolsPage;


