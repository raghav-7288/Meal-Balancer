import { lazy, Suspense, useState, useEffect } from "react";
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

// Retry wrapper: if a lazy chunk fails to load (stale deploy), reload the page once
function lazyWithRetry(importFn) {
    return lazy(() =>
        importFn().catch(() => {
            // If chunk load fails, it's likely a stale deploy — reload once
            const hasReloaded = sessionStorage.getItem("chunk-reload");
            if (!hasReloaded) {
                sessionStorage.setItem("chunk-reload", "1");
                window.location.reload();
                return new Promise(() => {}); // never resolves, page is reloading
            }
            sessionStorage.removeItem("chunk-reload");
            // If already reloaded once and still failing, show error
            return Promise.reject(new Error("Failed to load page. Please refresh."));
        })
    );
}

// Clear the reload flag on successful load
if (sessionStorage.getItem("chunk-reload")) {
    sessionStorage.removeItem("chunk-reload");
}

// Lazy-loaded pages for code splitting
const WelcomePage = lazyWithRetry(() => import("./components/pages/WelcomePage"));
const DashboardPage = lazyWithRetry(() => import("./components/pages/DashboardPage"));
const ProfilePage = lazyWithRetry(() => import("./components/pages/ProfilePage"));
const FoodSearchPage = lazyWithRetry(() => import("./components/FoodSearchPage"));

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

    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem("meal-balancer-dark-mode") === "true";
    });

    useEffect(() => {
        document.body.classList.toggle("dark-mode", darkMode);
        localStorage.setItem("meal-balancer-dark-mode", String(darkMode));
    }, [darkMode]);

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
                        <Route path="/profile" element={<ProfilePage profile={profile} setProfile={setProfile} darkMode={darkMode} setDarkMode={setDarkMode} />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Suspense>
            </ErrorBoundary>
        </div>
    );
}

export default App;