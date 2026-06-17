import { useNavigate } from "react-router-dom";
import { Activity, BarChart3, Sparkles, UtensilsCrossed } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

function WelcomePage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    return (
        <div className="welcome-page">
            <div className="welcome-card">
                <div className="welcome-icon">
                    <UtensilsCrossed size={48} />
                </div>
                <h1>Welcome{user?.email ? `, ${user.email.split("@")[0]}` : ""}!</h1>
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
                        <Activity size={20} />
                        <div>
                            <strong>Personalized Scoring</strong>
                            <p>Get scores based on your activity level, goals, and conditions</p>
                        </div>
                    </div>
                    <div className="welcome-highlight-item">
                        <BarChart3 size={20} />
                        <div>
                            <strong>Nutrient Tracking</strong>
                            <p>Monitor carbs, protein, fats, fibre, vitamins & minerals</p>
                        </div>
                    </div>
                    <div className="welcome-highlight-item">
                        <Sparkles size={20} />
                        <div>
                            <strong>Smart Recommendations</strong>
                            <p>Compare plans and get actionable improvement tips</p>
                        </div>
                    </div>
                </div>
                <button className="welcome-cta" onClick={() => navigate("/planner")}>
                    Start Planning <BarChart3 size={16} />
                </button>
            </div>
        </div>
    );
}

export default WelcomePage;

