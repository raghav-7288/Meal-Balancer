import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * Route-level ErrorBoundary (#72).
 * Each lazy-loaded route gets its own boundary so one page crash
 * doesn't nuke the entire app. Shows route-specific recovery UI.
 */
class RouteErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error(
            `[RouteErrorBoundary] ${this.props.routeName || "Unknown"} crashed:`,
            error,
            errorInfo
        );
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div
                    className="error-boundary"
                    style={{ textAlign: "center", padding: "3rem 1.5rem" }}
                >
                    <AlertTriangle size={48} style={{ color: "#f59e0b", marginBottom: "1rem" }} />
                    <h2 style={{ marginBottom: "0.5rem" }}>
                        {this.props.routeName || "This page"} encountered an error
                    </h2>
                    <p
                        style={{
                            color: "#64748b",
                            marginBottom: "1.5rem",
                            maxWidth: 420,
                            margin: "0 auto 1.5rem",
                        }}
                    >
                        {this.state.error?.message ||
                            "An unexpected error occurred. The rest of the app is still working."}
                    </p>
                    <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
                        <button
                            onClick={this.handleRetry}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                padding: "0.625rem 1.25rem",
                                borderRadius: "0.5rem",
                                background: "#3b82f6",
                                color: "#fff",
                                border: "none",
                                cursor: "pointer",
                                fontWeight: 600,
                                fontSize: "0.875rem",
                            }}
                        >
                            <RefreshCw size={16} /> Try again
                        </button>
                        <button
                            onClick={() => (window.location.href = "/")}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                padding: "0.625rem 1.25rem",
                                borderRadius: "0.5rem",
                                background: "#f1f5f9",
                                color: "#334155",
                                border: "1px solid #e2e8f0",
                                cursor: "pointer",
                                fontWeight: 600,
                                fontSize: "0.875rem",
                            }}
                        >
                            Go Home
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default RouteErrorBoundary;
