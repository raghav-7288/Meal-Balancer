import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { LogIn, UserPlus, Loader2, UtensilsCrossed, Sun, Moon } from "lucide-react";

function AuthPage() {
    const [mode, setMode] = useState("signin"); // "signin" | "signup"
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem("meal-balancer-dark-mode") === "true";
    });

    useEffect(() => {
        document.body.classList.toggle("dark-mode", darkMode);
        localStorage.setItem("meal-balancer-dark-mode", String(darkMode));
    }, [darkMode]);

    return (
        <div className="app-shell">
            <nav className="top-nav" role="navigation" aria-label="Main navigation">
                <div className="nav-brand">
                    <img
                        src={darkMode ? "/logo-dark.svg" : "/logo.svg"}
                        alt="Meal Balancer by Dt. Bhakti Shrivastava"
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '56px',
                            height: '56px',
                            borderRadius: '16px',
                            background: '#f0fdf4',
                            color: '#059669'
                        }}>
                            <UtensilsCrossed size={28} />
                        </div>
                    </div>
                    <h1 className="auth-title" style={{ textAlign: 'center' }}>Meal Balancer</h1>
                    <p className="auth-subtitle" style={{ textAlign: 'center' }}>
                        {mode === "signin"
                            ? "Sign in to your account"
                            : "Create a new account"}
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

function SignInForm() {
    const { signIn } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await signIn(email, password);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="auth-error">{error}</div>}

            <label className="auth-field">
                <span>Email</span>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
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
                />
            </label>

            <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? <Loader2 size={16} className="spin" /> : <LogIn size={16} />}
                {loading ? "Signing in…" : "Sign in"}
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
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        setSuccess(false);
        setLoading(true);

        try {
            const data = await signUp(email, password, username, fullName);

            // If email confirmation is required, user won't be auto-signed-in
            if (data.user && !data.session) {
                setSuccess(true);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    if (success) {
        return (
            <div className="auth-success">
                <p>
                    ✓ Account created! Please check your email to confirm your account,
                    then sign in.
                </p>
            </div>
        );
    }

    return (
        <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="auth-error">{error}</div>}

            <label className="auth-field">
                <span>Username</span>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="johndoe"
                    required
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
                    placeholder="you@example.com"
                    required
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
                />
            </label>

            <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? <Loader2 size={16} className="spin" /> : <UserPlus size={16} />}
                {loading ? "Creating account…" : "Sign up"}
            </button>
        </form>
    );
}

export default AuthPage;


