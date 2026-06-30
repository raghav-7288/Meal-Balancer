import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { LogIn, UserPlus, Loader2, UtensilsCrossed, Sun, Moon } from "lucide-react";

function AuthPage() {
    const [mode, setMode] = useState("signin"); // "signin" | "signup"
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem("diet-specifix-dark-mode") === "true";
    });

    useEffect(() => {
        document.body.classList.toggle("dark-mode", darkMode);
        localStorage.setItem("diet-specifix-dark-mode", String(darkMode));
    }, [darkMode]);

    return (
        <div className="app-shell">
            <nav className="top-nav" role="navigation" aria-label="Main navigation">
                <div className="nav-brand">
                    <img
                        src={darkMode ? "/logo-dark.svg" : "/logo.svg"}
                        alt="Diet Specifix by Dt. Bhakti Shrivastava"
                        className="nav-logo-img"
                    />
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
            <div className="auth-page">
                <div className="auth-card">
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: "20px",
                        }}
                    >
                        <div
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "56px",
                                height: "56px",
                                borderRadius: "16px",
                                background: darkMode ? "#064e3b" : "#f0fdf4",
                                color: darkMode ? "#6ee7b7" : "#059669",
                            }}
                        >
                            <UtensilsCrossed size={28} />
                        </div>
                    </div>
                    <h1 className="auth-title" style={{ textAlign: "center" }}>
                        Diet Specifix
                    </h1>
                    <p className="auth-subtitle" style={{ textAlign: "center" }}>
                        {mode === "signin" ? "Sign in to your account" : "Create a new account"}
                    </p>

                    {mode === "signin" ? <SignInForm /> : <SignUpForm />}

                    <div className="auth-switch">
                        {mode === "signin" ? (
                            <p>
                                Don't have an account?{" "}
                                <button className="link-btn" onClick={() => setMode("signup")}>
                                    Sign up
                                </button>
                            </p>
                        ) : (
                            <p>
                                Already have an account?{" "}
                                <button className="link-btn" onClick={() => setMode("signin")}>
                                    Sign in
                                </button>
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MS = 30000; // 30 seconds

function SignInForm() {
    const { signIn } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [failCount, setFailCount] = useState(0);
    const [lockedUntil, setLockedUntil] = useState(null);
    const [lockRemaining, setLockRemaining] = useState(0);

    // Countdown timer for lockout
    useEffect(() => {
        if (!lockedUntil) return;
        const tick = () => {
            const remaining = lockedUntil - Date.now();
            if (remaining <= 0) {
                setLockedUntil(null);
                setLockRemaining(0);
                setFailCount(0);
            } else {
                setLockRemaining(Math.ceil(remaining / 1000));
            }
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [lockedUntil]);

    const isLockedOut = lockRemaining > 0;

    async function handleSubmit(e) {
        e.preventDefault();
        if (isLockedOut) return;
        setError(null);
        setLoading(true);

        try {
            await signIn(email, password);
            setFailCount(0);
        } catch (err) {
            const newCount = failCount + 1;
            setFailCount(newCount);
            if (newCount >= LOCKOUT_THRESHOLD) {
                setLockedUntil(Date.now() + LOCKOUT_DURATION_MS);
                setError(`Too many failed attempts. Please wait 30 seconds before trying again.`);
            } else {
                setError(err?.message || "Sign in failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <form className="auth-form" onSubmit={handleSubmit}>
            {error && (
                <div className="auth-error" role="alert">
                    {error}
                </div>
            )}

            <label className="auth-field">
                <span>Email</span>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    aria-label="Email address"
                    autoComplete="email"
                />
            </label>

            <label className="auth-field">
                <span>Password</span>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    aria-label="Password"
                    autoComplete="current-password"
                />
            </label>

            <button
                type="submit"
                className="auth-btn"
                disabled={loading || isLockedOut}
                aria-busy={loading}
            >
                {loading ? (
                    <Loader2 size={16} className="spin" aria-hidden="true" />
                ) : (
                    <LogIn size={16} aria-hidden="true" />
                )}
                {isLockedOut ? `Locked (${lockRemaining}s)` : loading ? "Signing in…" : "Sign in"}
            </button>
        </form>
    );
}

function SignUpForm() {
    const { signUp } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [fullName, setFullName] = useState("");
    const [contactNumber, setContactNumber] = useState("");
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        setSuccess(false);
        setLoading(true);

        try {
            const data = await signUp(email, password, username, fullName, contactNumber);

            // If email confirmation is required, user won't be auto-signed-in
            if (data.user && !data.session) {
                setSuccess(true);
            }
        } catch (err) {
            setError(err?.message || "Sign up failed. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    if (success) {
        return (
            <div className="auth-success" role="status" aria-live="polite">
                <p>
                    ✓ Account created! Please check your email to confirm your account, then sign
                    in.
                </p>
                <p style={{ fontSize: "0.85rem", marginTop: "8px", color: "#6b7280" }}>
                    You can verify your mobile number after signing in from your profile.
                </p>
            </div>
        );
    }

    return (
        <form className="auth-form" onSubmit={handleSubmit}>
            {error && (
                <div className="auth-error" role="alert">
                    {error}
                </div>
            )}

            <label className="auth-field">
                <span>Username</span>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="johndoe"
                    required
                    aria-label="Username"
                    autoComplete="username"
                />
            </label>

            <label className="auth-field">
                <span>Full name</span>
                <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                />
            </label>

            <label className="auth-field">
                <span>Email</span>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    aria-label="Email address"
                    autoComplete="email"
                />
            </label>

            <label className="auth-field">
                <span>Contact number</span>
                <input
                    type="tel"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="+91 9876543210"
                    aria-label="Contact number"
                />
            </label>

            <label className="auth-field">
                <span>Password</span>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    minLength={6}
                    required
                    aria-label="Password"
                    autoComplete="new-password"
                />
            </label>

            <button type="submit" className="auth-btn" disabled={loading} aria-busy={loading}>
                {loading ? (
                    <Loader2 size={16} className="spin" aria-hidden="true" />
                ) : (
                    <UserPlus size={16} aria-hidden="true" />
                )}
                {loading ? "Creating account…" : "Sign up"}
            </button>
        </form>
    );
}

export default AuthPage;
