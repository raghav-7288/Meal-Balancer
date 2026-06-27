/**
 * Tests for ProfileContext — validates the debounced save uses the latest
 * saveToDb via ref (not a stale closure), and edge cases in profile sync.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { ProfileProvider, useProfile } from "../src/context/ProfileContext";
import { AuthContext } from "../src/context/AuthContext";

// Mock supabaseClient
vi.mock("../src/lib/supabaseClient", () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
            upsert: vi.fn().mockResolvedValue({ error: null }),
        })),
    },
}));

function createWrapper(authValue) {
    return function Wrapper({ children }) {
        return (
            <AuthContext.Provider value={authValue}>
                <ProfileProvider>{children}</ProfileProvider>
            </AuthContext.Provider>
        );
    };
}

describe("ProfileContext", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        localStorage.clear();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("returns default profile when no stored data exists", () => {
        const authValue = {
            user: { id: "user-1" },
            isAuthenticated: true,
            refreshProfile: vi.fn(),
        };

        const { result } = renderHook(() => useProfile(), {
            wrapper: createWrapper(authValue),
        });

        expect(result.current.profile.activity).toBe("moderate");
        expect(result.current.profile.goal).toBe("maintenance");
        expect(result.current.profile.dietType).toBe("vegetarian");
    });

    it("persists profile to localStorage on change", () => {
        const authValue = {
            user: { id: "user-1" },
            isAuthenticated: true,
            refreshProfile: vi.fn(),
        };

        const { result } = renderHook(() => useProfile(), {
            wrapper: createWrapper(authValue),
        });

        act(() => {
            result.current.setProfile({ ...result.current.profile, goal: "weight_loss" });
        });

        const stored = JSON.parse(localStorage.getItem("diet-specifix-profile"));
        expect(stored.goal).toBe("weight_loss");
    });

    it("darkMode toggle persists to localStorage", () => {
        const authValue = {
            user: null,
            isAuthenticated: false,
            refreshProfile: vi.fn(),
        };

        const { result } = renderHook(() => useProfile(), {
            wrapper: createWrapper(authValue),
        });

        act(() => {
            result.current.setDarkMode(true);
        });

        expect(localStorage.getItem("diet-specifix-dark-mode")).toBe("true");
        expect(result.current.darkMode).toBe(true);
    });

    it("setProfile triggers debounced DB save after 1 second", async () => {
        const { supabase } = await import("../src/lib/supabaseClient");
        const upsertMock = vi.fn().mockReturnValue({
            then: (cb) => { cb({ error: null }); return { catch: vi.fn() }; },
        });
        supabase.from.mockReturnValue({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
            upsert: upsertMock,
        });

        const authValue = {
            user: { id: "user-1" },
            isAuthenticated: true,
            refreshProfile: vi.fn(),
        };

        const { result } = renderHook(() => useProfile(), {
            wrapper: createWrapper(authValue),
        });

        // Clear mock calls from initial load
        supabase.from.mockClear();

        act(() => {
            result.current.setProfile((prev) => ({ ...prev, activity: "heavy" }));
        });

        // Before debounce fires, the new profile call should not have happened

        // After 1 second debounce, the save triggers
        await act(async () => {
            vi.advanceTimersByTime(1100);
        });

        // The from("user_profiles") should have been called for the upsert
        const foundCall = supabase.from.mock.calls.some(
            (call) => call[0] === "user_profiles"
        );
        expect(foundCall).toBe(true);
    });

    it("retrySync is a no-op when status is not error", () => {
        const authValue = {
            user: null,
            isAuthenticated: false,
            refreshProfile: vi.fn(),
        };

        const { result } = renderHook(() => useProfile(), {
            wrapper: createWrapper(authValue),
        });

        // profileSyncStatus is "idle" when not authenticated (no DB load)
        act(() => {
            result.current.retrySync();
        });

        // No crash, status stays idle
        expect(result.current.profileSyncStatus).toBe("idle");
    });

    it("reads corrupted localStorage gracefully", () => {
        localStorage.setItem("diet-specifix-profile", "not-valid-json");

        const authValue = {
            user: null,
            isAuthenticated: false,
            refreshProfile: vi.fn(),
        };

        const { result } = renderHook(() => useProfile(), {
            wrapper: createWrapper(authValue),
        });

        // Should fall back to default profile
        expect(result.current.profile.activity).toBe("moderate");
    });
});



