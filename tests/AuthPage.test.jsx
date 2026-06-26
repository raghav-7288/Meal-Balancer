import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock the useAuth hook
const mockSignIn = vi.fn();
const mockSignUp = vi.fn();

vi.mock("../src/hooks/useAuth", () => ({
    useAuth: () => ({
        signIn: mockSignIn,
        signUp: mockSignUp,
        user: null,
        isAuthenticated: false,
        loading: false,
    }),
}));

import AuthPage from "../src/components/AuthPage";

describe("AuthPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it("renders sign in form by default", () => {
        render(<AuthPage />);

        expect(screen.getByText("Meal Balancer")).toBeInTheDocument();
        expect(screen.getByText("Sign in to your account")).toBeInTheDocument();
        expect(screen.getByText("Email")).toBeInTheDocument();
        expect(screen.getByText("Password")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    });

    it("switches to sign up form when clicking 'Sign up' link", () => {
        render(<AuthPage />);

        fireEvent.click(screen.getByText("Sign up"));

        expect(screen.getByText("Create a new account")).toBeInTheDocument();
        expect(screen.getByText("Username")).toBeInTheDocument();
        expect(screen.getByText("Full name")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /sign up/i })).toBeInTheDocument();
    });

    it("switches back to sign in from sign up", () => {
        render(<AuthPage />);

        // Go to signup
        fireEvent.click(screen.getByText("Sign up"));
        expect(screen.getByText("Create a new account")).toBeInTheDocument();

        // Go back to signin
        fireEvent.click(screen.getByText("Sign in"));
        expect(screen.getByText("Sign in to your account")).toBeInTheDocument();
    });

    it("calls signIn with email and password on form submit", async () => {
        mockSignIn.mockResolvedValue({ user: { id: "1" }, session: {} });

        render(<AuthPage />);

        fireEvent.change(screen.getByPlaceholderText(/you@/i), {
            target: { value: "test@example.com" },
        });
        fireEvent.change(screen.getByPlaceholderText("••••••••"), {
            target: { value: "password123" },
        });

        fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

        await waitFor(() => {
            expect(mockSignIn).toHaveBeenCalledWith("test@example.com", "password123");
        });
    });

    it("shows error message when sign in fails", async () => {
        mockSignIn.mockRejectedValue(new Error("Invalid credentials"));

        render(<AuthPage />);

        fireEvent.change(screen.getByPlaceholderText(/you@/i), {
            target: { value: "test@example.com" },
        });
        fireEvent.change(screen.getByPlaceholderText("••••••••"), {
            target: { value: "wrongpass" },
        });

        fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

        await waitFor(() => {
            expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
        });
    });

    it("calls signUp with all fields on sign up form submit", async () => {
        mockSignUp.mockResolvedValue({ user: { id: "2" }, session: {} });

        render(<AuthPage />);

        // Switch to sign up
        fireEvent.click(screen.getByText("Sign up"));

        fireEvent.change(screen.getByPlaceholderText("johndoe"), {
            target: { value: "testuser" },
        });
        fireEvent.change(screen.getByPlaceholderText("John Doe"), {
            target: { value: "Test User" },
        });
        fireEvent.change(screen.getByPlaceholderText(/you@/i), {
            target: { value: "new@example.com" },
        });
        fireEvent.change(screen.getByPlaceholderText("Min 6 characters"), {
            target: { value: "securepass" },
        });

        fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

        await waitFor(() => {
            expect(mockSignUp).toHaveBeenCalledWith("new@example.com", "securepass", "testuser", "Test User");
        });
    });

    it("shows success message when sign up requires email confirmation", async () => {
        // user exists but no session = needs confirmation
        mockSignUp.mockResolvedValue({ user: { id: "3" }, session: null });

        render(<AuthPage />);
        fireEvent.click(screen.getByText("Sign up"));

        fireEvent.change(screen.getByPlaceholderText("johndoe"), {
            target: { value: "newuser" },
        });
        fireEvent.change(screen.getByPlaceholderText(/you@/i), {
            target: { value: "confirm@example.com" },
        });
        fireEvent.change(screen.getByPlaceholderText("Min 6 characters"), {
            target: { value: "pass123456" },
        });

        fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

        await waitFor(() => {
            expect(screen.getByText(/Account created/)).toBeInTheDocument();
            expect(screen.getByText(/check your email/)).toBeInTheDocument();
        });
    });

    it("shows error message when sign up fails", async () => {
        mockSignUp.mockRejectedValue(new Error("Email already taken"));

        render(<AuthPage />);
        fireEvent.click(screen.getByText("Sign up"));

        fireEvent.change(screen.getByPlaceholderText("johndoe"), {
            target: { value: "existing" },
        });
        fireEvent.change(screen.getByPlaceholderText(/you@/i), {
            target: { value: "taken@example.com" },
        });
        fireEvent.change(screen.getByPlaceholderText("Min 6 characters"), {
            target: { value: "pass123456" },
        });

        fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

        await waitFor(() => {
            expect(screen.getByText("Email already taken")).toBeInTheDocument();
        });
    });

    it("toggles dark mode on button click", () => {
        render(<AuthPage />);

        const toggleBtn = screen.getByLabelText("Toggle dark mode");
        fireEvent.click(toggleBtn);

        expect(document.body.classList.contains("dark-mode")).toBe(true);

        fireEvent.click(toggleBtn);
        expect(document.body.classList.contains("dark-mode")).toBe(false);
    });

    it("has required attributes on email and password fields", () => {
        render(<AuthPage />);

        const emailInput = screen.getByPlaceholderText(/you@/i);
        const passwordInput = screen.getByPlaceholderText("••••••••");

        expect(emailInput).toHaveAttribute("type", "email");
        expect(emailInput).toBeRequired();
        expect(passwordInput).toHaveAttribute("type", "password");
        expect(passwordInput).toBeRequired();
    });
});

