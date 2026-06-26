/**
 * ProfileContext Tests
 * Tests the profile context provider with preferences sync
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { ProfileProvider, useProfile } from "../src/context/ProfileContext";

// Mock the auth hook
vi.mock("../src/hooks/useAuth", () => ({
    useAuth: vi.fn(),
}));

// Mock supabase
const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    then: vi.fn(),
};

vi.mock("../src/lib/supabaseClient", () => ({
    supabase: {
        from: vi.fn(() => mockQueryBuilder),
    },
}));

import { useAuth } from "../src/hooks/useAuth";

function TestConsumer() {
    const { profile, setProfile, darkMode, setDarkMode, profileSyncStatus, retrySync } = useProfile();
    return (
        <div>
            <span data-testid="activity">{profile.activity}</span>
            <span data-testid="goal">{profile.goal}</span>
            <span data-testid="diet-type">{profile.dietType}</span>
            <span data-testid="sex">{profile.sex}</span>
            <span data-testid="dark-mode">{String(darkMode)}</span>
            <span data-testid="sync-status">{profileSyncStatus}</span>
            <button data-testid="change-activity" onClick={() => setProfile((p) => ({ ...p, activity: "heavy" }))}>
                Change Activity
            </button>
            <button data-testid="toggle-dark" onClick={() => setDarkMode((d) => !d)}>
                Toggle Dark
            </button>
            <button data-testid="retry-sync" onClick={retrySync}>
                Retry
            </button>
        </div>
    );
}

describe("ProfileContext", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
        useAuth.mockReturnValue({ user: null, isAuthenticated: false, refreshProfile: vi.fn() });
        mockQueryBuilder.select.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.update.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.upsert.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.eq.mockReturnValue(mockQueryBuilder);
    });

    it("should provide default profile values when no localStorage data", () => {
        render(
            <ProfileProvider>
                <TestConsumer />
            </ProfileProvider>
        );
        expect(screen.getByTestId("activity").textContent).toBe("moderate");
        expect(screen.getByTestId("goal").textContent).toBe("maintenance");
        expect(screen.getByTestId("diet-type").textContent).toBe("vegetarian");
        expect(screen.getByTestId("sex").textContent).toBe("female");
    });

    it("should read profile from localStorage on mount", () => {
        localStorage.setItem("meal-balancer-profile", JSON.stringify({
            activity: "heavy",
            goal: "weight_loss",
            dietType: "non-vegetarian",
            sex: "male",
            bmiTarget: "24",
            height: "180",
            weight: "80",
        }));

        render(
            <ProfileProvider>
                <TestConsumer />
            </ProfileProvider>
        );
        expect(screen.getByTestId("activity").textContent).toBe("heavy");
        expect(screen.getByTestId("goal").textContent).toBe("weight_loss");
        expect(screen.getByTestId("sex").textContent).toBe("male");
    });

    it("should persist profile changes to localStorage", async () => {
        render(
            <ProfileProvider>
                <TestConsumer />
            </ProfileProvider>
        );

        act(() => {
            screen.getByTestId("change-activity").click();
        });

        await waitFor(() => {
            expect(screen.getByTestId("activity").textContent).toBe("heavy");
        });

        const stored = JSON.parse(localStorage.getItem("meal-balancer-profile"));
        expect(stored.activity).toBe("heavy");
    });

    it("should handle dark mode toggle", () => {
        render(
            <ProfileProvider>
                <TestConsumer />
            </ProfileProvider>
        );

        expect(screen.getByTestId("dark-mode").textContent).toBe("false");

        act(() => {
            screen.getByTestId("toggle-dark").click();
        });

        expect(screen.getByTestId("dark-mode").textContent).toBe("true");
        expect(localStorage.getItem("meal-balancer-dark-mode")).toBe("true");
    });

    it("should read dark mode preference from localStorage", () => {
        localStorage.setItem("meal-balancer-dark-mode", "true");

        render(
            <ProfileProvider>
                <TestConsumer />
            </ProfileProvider>
        );

        expect(screen.getByTestId("dark-mode").textContent).toBe("true");
    });

    it("should load profile from Supabase when authenticated", async () => {
        useAuth.mockReturnValue({ user: { id: "u1" }, isAuthenticated: true, refreshProfile: vi.fn() });
        mockQueryBuilder.single.mockResolvedValue({
            data: {
                activity: "sedentary",
                goal: "muscle_gain",
                diet_type: "vegan",
                sex: "male",
                bmi_target: "23",
                height_cm: 170,
                weight_kg: 65,
            },
            error: null,
        });

        render(
            <ProfileProvider>
                <TestConsumer />
            </ProfileProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId("activity").textContent).toBe("sedentary");
        });
        expect(screen.getByTestId("goal").textContent).toBe("muscle_gain");
        expect(screen.getByTestId("diet-type").textContent).toBe("vegan");
        expect(screen.getByTestId("sex").textContent).toBe("male");
    });

    it("should handle Supabase profile load error gracefully", async () => {
        useAuth.mockReturnValue({ user: { id: "u1" }, isAuthenticated: true, refreshProfile: vi.fn() });
        mockQueryBuilder.single.mockResolvedValue({
            data: null,
            error: { code: "42501", message: "Permission denied" },
        });

        render(
            <ProfileProvider>
                <TestConsumer />
            </ProfileProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId("sync-status").textContent).toBe("error");
        });
        // Should still show default/local values
        expect(screen.getByTestId("activity").textContent).toBe("moderate");
    });

    it("should throw error when useProfile is used outside provider", () => {
        // Suppress console.error for this test
        const spy = vi.spyOn(console, "error").mockImplementation(() => {});

        expect(() => {
            render(<TestConsumer />);
        }).toThrow("useProfile must be used within a ProfileProvider");

        spy.mockRestore();
    });
});

