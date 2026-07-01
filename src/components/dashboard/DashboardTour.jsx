import { useState, useEffect } from "react";
import { Joyride, STATUS } from "react-joyride";

const TOUR_STORAGE_KEY = "diet-specifix-tour-done";

const TOUR_STEPS = [
    {
        target: ".plan-toggle",
        content: "Switch between pre-saved template plans and your own custom plans here.",
        disableBeacon: true,
        placement: "right",
    },
    {
        target: ".button-row",
        content: "Create a new plan or reset the current one. You can also copy a pre-saved plan to customize it.",
        placement: "bottom",
    },
    {
        target: ".meal-panels",
        content: "This is the Meal Builder. Add food items to each meal slot (Breakfast, Lunch, Dinner, etc.) with gram quantities.",
        placement: "top",
    },
    {
        target: ".ingredient-add-form",
        content: "Search for foods, enter the grams, and click + to add ingredients. Then click 'Add to meal' to save.",
        placement: "top",
    },
    {
        target: ".kpi-grid",
        content: "Your daily score and key metrics update in real-time as you add foods. Aim for 85+ for excellent balance!",
        placement: "bottom",
    },
    {
        target: ".nutrient-limits-strip",
        content: "Set daily nutrient limits here. You'll get warnings when you exceed them.",
        placement: "bottom",
    },
    {
        target: ".log-today-btn",
        content: "When you're happy with today's meals, click 'Log today' to save your score to the Progress page.",
        placement: "bottom",
    },
    {
        target: ".planner-nav-link",
        content: "View your full weekly plan and download it as a PDF report from the Weekly Planner.",
        placement: "bottom",
    },
];

const TOUR_STYLES = {
    options: {
        primaryColor: "#3b82f6",
        zIndex: 10000,
        arrowColor: "#fff",
        backgroundColor: "#fff",
        textColor: "#1e293b",
        overlayColor: "rgba(0, 0, 0, 0.4)",
    },
    tooltipContainer: {
        textAlign: "left",
    },
    buttonNext: {
        backgroundColor: "#3b82f6",
        borderRadius: "8px",
        fontSize: "13px",
        padding: "8px 16px",
    },
    buttonBack: {
        color: "#64748b",
        fontSize: "13px",
    },
    buttonSkip: {
        color: "#94a3b8",
        fontSize: "12px",
    },
    tooltip: {
        borderRadius: "12px",
        padding: "20px",
        fontSize: "14px",
        lineHeight: "1.5",
    },
};

/**
 * DashboardTour — Guided onboarding tour for first-time users.
 * Shows step-by-step tooltips highlighting key dashboard features.
 * Only runs once; completion is stored in localStorage.
 */
export default function DashboardTour() {
    const [run, setRun] = useState(false);

    useEffect(() => {
        // Only show tour if user hasn't completed it before
        const tourDone = localStorage.getItem(TOUR_STORAGE_KEY);
        if (!tourDone) {
            // Small delay so DOM elements are rendered
            const timer = setTimeout(() => setRun(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    function handleJoyrideCallback(data) {
        const { status } = data;
        if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
            setRun(false);
            localStorage.setItem(TOUR_STORAGE_KEY, "true");
        }
    }

    return (
        <Joyride
            steps={TOUR_STEPS}
            run={run}
            continuous
            showSkipButton
            showProgress
            scrollToFirstStep
            disableOverlayClose
            callback={handleJoyrideCallback}
            styles={TOUR_STYLES}
            locale={{
                back: "Back",
                close: "Close",
                last: "Got it!",
                next: "Next",
                skip: "Skip tour",
            }}
        />
    );
}


