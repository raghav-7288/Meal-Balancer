/**
 * Tests for useAuth and useOptionalAuth hooks
 */
import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { createElement } from "react";
import { AuthContext } from "../src/context/AuthContext";
import { useAuth, useOptionalAuth } from "../src/hooks/useAuth";

describe("useAuth", () => {
    it("throws when used outside AuthProvider", () => {
        // Suppress console.error for expected error
        const spy = vi.spyOn(console, "error").mockImplementation(() => {});
        expect(() => renderHook(() => useAuth())).toThrow(
            "useAuth must be used within an AuthProvider"
        );
        spy.mockRestore();
    });

    it("returns context value when inside AuthProvider", () => {
        const mockValue = {
            user: { id: "u1", email: "test@test.com" },
            isAuthenticated: true,
            profile: null,
            session: null,
            loading: false,
            signIn: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
            updateProfile: vi.fn(),
            refreshProfile: vi.fn(),
        };

        const wrapper = ({ children }) =>
            createElement(AuthContext.Provider, { value: mockValue }, children);

        const { result } = renderHook(() => useAuth(), { wrapper });
        expect(result.current.user).toEqual({ id: "u1", email: "test@test.com" });
        expect(result.current.isAuthenticated).toBe(true);
    });
});

describe("useOptionalAuth", () => {
    it("returns default unauthenticated object when outside AuthProvider", () => {
        const { result } = renderHook(() => useOptionalAuth());
        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
    });

    it("returns context value when inside AuthProvider", () => {
        const mockValue = {
            user: { id: "u2" },
            isAuthenticated: true,
            profile: { username: "test" },
            session: {},
            loading: false,
            signIn: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
            updateProfile: vi.fn(),
            refreshProfile: vi.fn(),
        };

        const wrapper = ({ children }) =>
            createElement(AuthContext.Provider, { value: mockValue }, children);

        const { result } = renderHook(() => useOptionalAuth(), { wrapper });
        expect(result.current.user).toEqual({ id: "u2" });
        expect(result.current.isAuthenticated).toBe(true);
    });
});

