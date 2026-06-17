import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";
import "./App.css";
import {
    BarChart3,
    ClipboardList,
    Database,
    Home,
    Loader2,
    User,
    UtensilsCrossed,
} from "lucide-react";
import AuthPage from "./components/AuthPage";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import { useAuth } from "./hooks/useAuth";
import { ProfileProvider } from "./context/ProfileContext";
import { PlanProvider } from "./context/PlanContext";

// Retry wrapper: if a lazy chunk fails to load (stale deploy), reload the page once
function lazyWithRetry(importFn) {
    return lazy(() =>
        importFn().catch(() => {
            const hasReloaded = sessionStorage.getItem("chunk-reload");
            if (!hasReloaded) {
                sessionStorage.setItem("chunk-reload", "1");
                window.location.reload();
                return new Promise(() => {});
            }
            sessionStorage.removeItem("chunk-reload");
            return Promise.reject(new Error("Failed to load page. Please refresh."));
        })
    );
}

if (sessionStorage.getItem("chunk-reload")) {
    sessionStorage.removeItem("chunk-reload");
}

// Lazy-loaded pages for code splitting
const WelcomePage = lazyWithRetry(() => import("./components/pages/WelcomePage"));
const MealPlannerPage = lazyWithRetry(() => import("./components/pages/MealPlannerPage"));
const MyPlansPage = lazyWithRetry(() => import("./components/pages/MyPlansPage"));
const ProfilePage = lazyWithRetry(() => import("./components/pages/ProfilePage"));
const FoodSearchPage = lazyWithRetry(() => import("./components/FoodSearchPage"));

function PageLoader() {
    return (
        <div className="auth-loading-screen" role="status" aria-label="Loading page">
            <Loader2 size={32} className="spin" />
            <p>Loading…</p>
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
            <PlanProvider>
                <BrowserRouter>
                    <AppShell />
                </BrowserRouter>
            </PlanProvider>
        </ProfileProvider>
    );
}

function AppShell() {
    return (
        <div className="app-shell">
            <nav className="top-nav" role="navigation" aria-label="Main navigation">
                <div className="nav-brand">
                    <UtensilsCrossed size={20} />
                    <span>Meal Balancer</span>
                </div>
                <div className="nav-links">
                    <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                        <Home size={16} /> Home
                    </NavLink>
                    <NavLink to="/planner" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                        <BarChart3 size={16} /> Meal Planner
                    </NavLink>
                    <NavLink to="/plans" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                        <ClipboardList size={16} /> My Plans
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
                        <Route path="/planner" element={<MealPlannerPage />} />
                        <Route path="/plans" element={<MyPlansPage />} />
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