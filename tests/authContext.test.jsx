/**
 * Context Tests - AuthContext
 * Tests the React context provider with mocked services
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { useContext } from "react";

// Mock auth service - define mock functions INSIDE the factory
vi.mock("../src/services/authService", () => ({
    getSession: vi.fn(),
    fetchUserProfile: vi.fn(),
    updateUserProfile: vi.fn(),
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    createUserProfile: vi.fn(),
    onAuthStateChange: vi.fn(() => ({ unsubscribe: vi.fn() })),
}));

import {
    getSession,
    fetchUserProfile,
    signIn as authSignIn,
    signUp as authSignUp,
    signOut as authSignOut,
    createUserProfile,
    onAuthStateChange,
} from "../src/services/authService";

import { AuthContext, AuthProvider } from "../src/context/AuthContext";

// Test component that consumes the context
function TestConsumer() {
    const ctx = useContext(AuthContext);
    if (!ctx) return <div>No context</div>;
    return (
        <div>
            <span data-testid="loading">{String(ctx.loading)}</span>
            <span data-testid="authenticated">{String(ctx.isAuthenticated)}</span>
            <span data-testid="user-email">{ctx.user?.email || "none"}</span>
            <span data-testid="profile-name">{ctx.profile?.full_name || "none"}</span>
        </div>
    );
}

describe("AuthContext", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        // Default: onAuthStateChange returns subscription
        onAuthStateChange.mockReturnValue({ unsubscribe: vi.fn() });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("should start in loading state", () => {
        getSession.mockImplementation(() => new Promise(() => {})); // Never resolves

        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );
        expect(screen.getByTestId("loading").textContent).toBe("true");
    });

    it("should set loading to false after init even with no session", async () => {
        getSession.mockResolvedValue(null);

        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );

        await act(async () => {
            await vi.runAllTimersAsync();
        });

        expect(screen.getByTestId("loading").textContent).toBe("false");
        expect(screen.getByTestId("authenticated").textContent).toBe("false");
    });

    it("should set user and profile when session exists", async () => {
        const mockSession = { user: { id: "u1", email: "[REDACTED_EMAIL_ADDRESS_7]" }, access_token: "t" };
        const mockProfile = { user_id: "u1", username: "john", full_name: "John Doe" };

        getSession.mockResolvedValue(mockSession);
        fetchUserProfile.mockResolvedValue(mockProfile);

        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );

        await act(async () => {
            await vi.runAllTimersAsync();
        });

        expect(screen.getByTestId("loading").textContent).toBe("false");
        expect(screen.getByTestId("authenticated").textContent).toBe("true");
        expect(screen.getByTestId("user-email").textContent).toBe("[REDACTED_EMAIL_ADDRESS_7]");
        expect(screen.getByTestId("profile-name").textContent).toBe("John Doe");
    });

    it("should handle session init error gracefully", async () => {
        getSession.mockRejectedValue(new Error("Network error"));

        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );

        await act(async () => {
            await vi.runAllTimersAsync();
        });

        expect(screen.getByTestId("loading").textContent).toBe("false");
        expect(screen.getByTestId("authenticated").textContent).toBe("false");
    });

    it("should stop loading after 5s safety timeout", async () => {
        getSession.mockImplementation(() => new Promise(() => {})); // Never resolves

        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );

        expect(screen.getByTestId("loading").textContent).toBe("true");

        await act(async () => {
            vi.advanceTimersByTime(5001);
        });

        expect(screen.getByTestId("loading").textContent).toBe("false");
    });

    it("should provide signIn function that updates state", async () => {
        getSession.mockResolvedValue(null);

        const mockSignInData = { user: { id: "u2", email: "[REDACTED_EMAIL_ADDRESS_8]" }, session: { access_token: "t2" } };
        authSignIn.mockResolvedValue(mockSignInData);
        fetchUserProfile.mockResolvedValue({ user_id: "u2", full_name: "Jane" });

        let contextValue;
        function Spy() {
            contextValue = useContext(AuthContext);
            return null;
        }

        render(
            <AuthProvider>
                <Spy />
            </AuthProvider>
        );

        await act(async () => {
            await vi.runAllTimersAsync();
        });

        expect(contextValue.loading).toBe(false);

        await act(async () => {
            await contextValue.signIn("[REDACTED_EMAIL_ADDRESS_8]", "pass123");
        });

        expect(contextValue.isAuthenticated).toBe(true);
        expect(contextValue.user.email).toBe("[REDACTED_EMAIL_ADDRESS_8]");
    });

    it("should provide signOut function that clears state", async () => {
        const mockSession = { user: { id: "u1", email: "[REDACTED_EMAIL_ADDRESS_7]" }, access_token: "t" };
        getSession.mockResolvedValue(mockSession);
        fetchUserProfile.mockResolvedValue({ user_id: "u1", full_name: "John" });
        authSignOut.mockResolvedValue(undefined);

        let contextValue;
        function Spy() {
            contextValue = useContext(AuthContext);
            return null;
        }

        render(
            <AuthProvider>
                <Spy />
            </AuthProvider>
        );

        await act(async () => {
            await vi.runAllTimersAsync();
        });

        expect(contextValue.isAuthenticated).toBe(true);

        await act(async () => {
            await contextValue.signOut();
        });

        expect(contextValue.isAuthenticated).toBe(false);
        expect(contextValue.user).toBeNull();
        expect(contextValue.profile).toBeNull();
    });
});
