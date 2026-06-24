import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";
import "./App.css";
import {
    BarChart3,
    Calculator,
    Database,
    Home,
    Loader2,
    Moon,
    Sun,
    User,
    UtensilsCrossed,
} from "lucide-react";
import AuthPage from "./components/AuthPage";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import { useAuth } from "./hooks/useAuth";
import { ProfileProvider, useProfile } from "./context/ProfileContext";

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
const BmiCalculatorPage = lazyWithRetry(() => import("./components/pages/BmiCalculatorPage"));
const DashboardPage = lazyWithRetry(() => import("./components/pages/DashboardPage"));
const ProfilePage = lazyWithRetry(() => import("./components/pages/ProfilePage"));
const FoodSearchPage = lazyWithRetry(() => import("./components/FoodSearchPage"));

function PageLoader() {
    return (
        <div className="auth-loading-screen" role="status" aria-label="Loading page">
            <Loader2 size={32} className="spin" style={{ color: '#3b82f6' }} />
            <p style={{ fontSize: '14px', fontWeight: 500, color: '#64748b' }}>Loading…</p>
        </div>
    );
}

function App() {
    const { isAuthenticated, loading: authLoading } = useAuth();

    if (authLoading) {
        return (
            <div className="auth-loading-screen" role="status" aria-label="Authenticating">
                <div className="auth-loading-spinner" />
                <p>Loading…</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <AuthPage />;
    }

    return (
        <ProfileProvider>
            <BrowserRouter>
                <AppShell />
            </BrowserRouter>
        </ProfileProvider>
    );
}

function AppShell() {
    const { darkMode, setDarkMode } = useProfile();

    return (
        <div className="app-shell">
            <nav className="top-nav" role="navigation" aria-label="Main navigation">
                <div className="nav-brand">
                    <UtensilsCrossed size={20} />
                    <div className="nav-brand-text">
                        <span>Meal Balancer</span>
                        <small>by Dt. Bhakti Shrivastava</small>
                    </div>
                </div>
                <div className="nav-links">
                    <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                        <Home size={16} /> <span>Home</span>
                    </NavLink>
                    <NavLink to="/bmi-calculator" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                        <Calculator size={16} /> <span>BMI</span>
                    </NavLink>
                    <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                        <BarChart3 size={16} /> <span>Dashboard</span>
                    </NavLink>
                    <NavLink to="/foods" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                        <Database size={16} /> <span>Foods</span>
                    </NavLink>
                    <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                        <User size={16} /> <span>Profile</span>
                    </NavLink>
                </div>
                <button
                    className="nav-theme-toggle"
                    onClick={() => setDarkMode(!darkMode)}
                    aria-label="Toggle dark mode"
                    data-tooltip={darkMode ? "Light mode" : "Dark mode"}
                >
                    {darkMode ? <Sun size={34} /> : <Moon size={34} />}
                </button>
            </nav>

            <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                    <Routes>
                        <Route path="/" element={<WelcomePage />} />
                        <Route path="/bmi-calculator" element={<BmiCalculatorPage />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/foods" element={<FoodSearchPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Suspense>
            </ErrorBoundary>
        </div>
    );
}

export default App;