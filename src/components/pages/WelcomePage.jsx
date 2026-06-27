import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, ArrowRight, BarChart3, Sparkles, UtensilsCrossed } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import OnboardingFlow from "./OnboardingFlow";

function WelcomePage() {
    const navigate = useNavigate();
    const { profile } = useAuth();

    const [showOnboarding, setShowOnboarding] = useState(() => {
        return localStorage.getItem("diet-specifix-onboarding-done") !== "true";
    });

    if (showOnboarding) {
        return <OnboardingFlow onComplete={() => setShowOnboarding(false)} />;
    }

    return (
        <div className="welcome-page">
            <div className="welcome-card">
                <div className="welcome-icon" aria-hidden="true">
                    <UtensilsCrossed size={48} />
                </div>
                <h1>Welcome{profile?.username ? `, ${profile.username}` : profile?.full_name ? `, ${profile.full_name}` : ""}!</h1>
                <p className="welcome-subtitle">
                    Your personal Indian diet planning dashboard
                </p>
                <p className="welcome-desc">
                    Build meals in grams, convert them into exchange-style categories, and score
                    your dietary pattern with transparent reasons. Track your nutrition across the week
                    with personalized targets.
                </p>
                <div className="welcome-highlights">
                    <div className="welcome-highlight-item">
                        <Activity size={20} aria-hidden="true" />
                        <div>
                            <strong>Personalized Scoring</strong>
                            <p>Get scores based on your activity level, goals, and conditions</p>
                        </div>
                    </div>
                    <div className="welcome-highlight-item">
                        <BarChart3 size={20} aria-hidden="true" />
                        <div>
                            <strong>Nutrient Tracking</strong>
                            <p>Monitor carbs, protein, fats, fibre, vitamins & minerals</p>
                        </div>
                    </div>
                    <div className="welcome-highlight-item">
                        <Sparkles size={20} aria-hidden="true" />
                        <div>
                            <strong>Smart Recommendations</strong>
                            <p>Compare plans and get actionable improvement tips</p>
                        </div>
                    </div>
                </div>
                <button type="button" className="welcome-cta" onClick={() => navigate("/dashboard")}>
                    Go to Dashboard <ArrowRight size={16} aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}

export default WelcomePage;
