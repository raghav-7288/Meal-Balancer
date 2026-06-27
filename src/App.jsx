import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate, useLocation } from "react-router-dom";
import "./App.css";
import {
    BarChart3,
    Calendar,
    Database,
    Heart,
    Home,
    Loader2,
    Menu,
    Moon,
    Sun,
    TrendingUp,
    User,
    X,
} from "lucide-react";
import { Toaster } from "react-hot-toast";
import AuthPage from "./components/AuthPage";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import RouteErrorBoundary from "./components/ui/RouteErrorBoundary";
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
const HealthToolsPage = lazyWithRetry(() => import("./components/pages/HealthToolsPage"));
const DashboardPage = lazyWithRetry(() => import("./components/pages/DashboardPage"));
const WeeklyPlannerPage = lazyWithRetry(() => import("./components/pages/WeeklyPlannerPage"));
const ProgressPage = lazyWithRetry(() => import("./components/pages/ProgressPage"));
const ProfilePage = lazyWithRetry(() => import("./components/pages/ProfilePage"));
const FoodSearchPage = lazyWithRetry(() => import("./components/FoodSearchPage"));
const PresetAdminPage = lazyWithRetry(() => import("./components/pages/PresetAdminPage"));

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
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false); // eslint-disable-line react-hooks/set-state-in-effect
    }, [location.pathname]);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [mobileMenuOpen]);

    // Redirect to home if onboarding hasn't been completed yet (mount-only)
    const hasCheckedOnboarding = useRef(false);
    useEffect(() => {
        if (hasCheckedOnboarding.current) return;
        hasCheckedOnboarding.current = true;
        const onboardingDone = localStorage.getItem("diet-specifix-onboarding-done") === "true";
        if (!onboardingDone && location.pathname !== "/") {
            navigate("/", { replace: true });
        }
    }, [location.pathname, navigate]);

    return (
        <div className="app-shell">
            {/* Skip to content link for accessibility (#35) */}
            <a href="#main-content" className="skip-to-content">
                Skip to content
            </a>

            <nav className="top-nav" role="navigation" aria-label="Main navigation">
                <div className="nav-brand">
                    <img
                        src={darkMode ? "/logo-dark.svg" : "/logo.svg"}
                        alt="Diet Specifix by Dt. Bhakti Shrivastava"
                        className="nav-logo-img"
                    />
                </div>

                {/* Hamburger toggle for mobile (#29) */}
                <button
                    className="nav-hamburger"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                    aria-expanded={mobileMenuOpen}
                >
                    {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>

                {/* Mobile overlay */}
                {mobileMenuOpen && (
                    <div
                        className="nav-mobile-overlay"
                        onClick={() => setMobileMenuOpen(false)}
                        aria-hidden="true"
                    />
                )}

                <div className={`nav-links ${mobileMenuOpen ? "nav-links--open" : ""}`}>
                    <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                        <Home size={16} /> <span>Home</span>
                    </NavLink>
                    <NavLink to="/health-tools" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                        <Heart size={16} /> <span>Health Tools</span>
                    </NavLink>
                    <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                        <BarChart3 size={16} /> <span>Dashboard</span>
                    </NavLink>
                    <NavLink to="/weekly-planner" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                        <Calendar size={16} /> <span>Planner</span>
                    </NavLink>
                    <NavLink to="/progress" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                        <TrendingUp size={16} /> <span>Progress</span>
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
                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </nav>

            {/* Global toast container (#32) */}
            <Toaster
                position="bottom-center"
                toastOptions={{
                    duration: 3000,
                    style: {
                        borderRadius: "14px",
                        padding: "12px 20px",
                        fontSize: "14px",
                        fontWeight: 600,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                    },
                    success: {
                        style: { background: "#059669", color: "#fff" },
                        iconTheme: { primary: "#fff", secondary: "#059669" },
                    },
                    error: {
                        style: { background: "#dc2626", color: "#fff" },
                        iconTheme: { primary: "#fff", secondary: "#dc2626" },
                    },
                }}
            />

            {/* aria-live region for dynamic score updates (#35) */}
            <div id="score-announcer" className="sr-only" aria-live="polite" aria-atomic="true" />

            <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                    <main id="main-content">
                        <Routes>
                            <Route path="/" element={<RouteErrorBoundary routeName="Home"><WelcomePage /></RouteErrorBoundary>} />
                            <Route path="/health-tools" element={<RouteErrorBoundary routeName="Health Tools"><HealthToolsPage /></RouteErrorBoundary>} />
                            <Route path="/dashboard" element={<RouteErrorBoundary routeName="Dashboard"><DashboardPage /></RouteErrorBoundary>} />
                            <Route path="/weekly-planner" element={<RouteErrorBoundary routeName="Weekly Planner"><WeeklyPlannerPage /></RouteErrorBoundary>} />
                            <Route path="/progress" element={<RouteErrorBoundary routeName="Progress"><ProgressPage /></RouteErrorBoundary>} />
                            <Route path="/foods" element={<RouteErrorBoundary routeName="Food Search"><FoodSearchPage /></RouteErrorBoundary>} />
                            <Route path="/preset-admin" element={<RouteErrorBoundary routeName="Preset Admin"><PresetAdminPage /></RouteErrorBoundary>} />
                            <Route path="/profile" element={<RouteErrorBoundary routeName="Profile"><ProfilePage /></RouteErrorBoundary>} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </main>
                </Suspense>
            </ErrorBoundary>

            <footer className="app-footer">
                <p>© {new Date().getFullYear()} Diet Specifix. All rights reserved.</p>
                <p className="app-footer-sub">Built with ❤️ for healthier living</p>
            </footer>
        </div>
    );
}

export default App;