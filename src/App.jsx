import { lazy, Suspense, useState } from "react";
import { BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";
import "./App.css";
import {
    BarChart3,
    Database,
    Home,
    Loader2,
    User,
    UtensilsCrossed,
} from "lucide-react";
import AuthPage from "./components/AuthPage";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import { useAuth } from "./hooks/useAuth";

// Lazy-loaded pages for code splitting
const WelcomePage = lazy(() => import("./components/pages/WelcomePage"));
const DashboardPage = lazy(() => import("./components/pages/DashboardPage"));
const ProfilePage = lazy(() => import("./components/pages/ProfilePage"));
const FoodSearchPage = lazy(() => import("./components/FoodSearchPage"));

function PageLoader() {
    return (
        <div className="auth-loading-screen">
            <Loader2 size={32} className="spin" />
            <p>Loading…</p>
        </div>
    );
}

function App() {
    const { isAuthenticated, loading: authLoading } = useAuth();

    if (authLoading) {
        return (
            <div className="auth-loading-screen">
                <div className="auth-loading-spinner" />
                <p>Loading…</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <AuthPage />;
    }

    return (
        <BrowserRouter>
            <AppShell />
        </BrowserRouter>
    );
}

function AppShell() {
    const [profile, setProfile] = useState({
        activity: "moderate",
        goal: "maintenance",
        dietType: "vegetarian",
        sex: "female",
        bmiTarget: "22",
    });

    return (
        <div className="app-shell">
            <nav className="top-nav">
                <div className="nav-brand">
                    <UtensilsCrossed size={20} />
                    <span>Meal Balancer</span>
                </div>
                <div className="nav-links">
                    <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                        <Home size={16} /> Home
                    </NavLink>
                    <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                        <BarChart3 size={16} /> Dashboard
                    </NavLink>
                    <NavLink to="/foods" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                        <Database size={16} /> Food Explorer
                    </NavLink>
                    <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                        <User size={16} /> Profile
                    </NavLink>
                </div>
            </nav>

            <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                    <Routes>
                        <Route path="/" element={<WelcomePage />} />
                        <Route path="/dashboard" element={<DashboardPage profile={profile} />} />
                        <Route path="/foods" element={<FoodSearchPage />} />
                        <Route path="/profile" element={<ProfilePage profile={profile} setProfile={setProfile} />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Suspense>
            </ErrorBoundary>
        </div>
    );
}

export default App;