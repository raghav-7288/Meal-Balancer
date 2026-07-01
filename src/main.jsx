import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/inter/900.css";
import "./index.css";
import "./styles/professional-ui.css";
import "./styles/profile-page.css";
import "./styles/print.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext";

const rootElement = document.getElementById("root");

if (!rootElement) {
    document.body.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;text-align:center;padding:2rem">' +
        '<div><h1 style="font-size:1.25rem;margin-bottom:0.5rem">Failed to load application</h1>' +
        '<p style="color:#64748b">Please refresh the page or try again later.</p></div></div>';
} else {
    createRoot(rootElement).render(
        <StrictMode>
            <AuthProvider>
                <App />
            </AuthProvider>
        </StrictMode>
    );
}
