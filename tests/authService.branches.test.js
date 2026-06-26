/**
 * Additional authService tests - covers createUserProfile branches
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

let callCount = 0;
let results = [];

function createSequentialMock() {
    const mock = {};
    const chainFn = () => mock;
    const methods = ["from", "select", "insert", "update", "upsert", "delete", "eq", "neq", "in", "ilike", "order", "limit", "not", "gt"];
    for (const m of methods) { mock[m] = vi.fn(chainFn); }
    mock.single = vi.fn(() => {
        const result = results[callCount] || results[results.length - 1];
        callCount++;
        return Promise.resolve(result);
    });
    mock.then = (resolve, reject) => mock.single().then(resolve, reject);
    mock.catch = (rej) => mock.single().catch(rej);
    return mock;
}

const mockChain = createSequentialMock();

vi.mock("../src/lib/supabaseClient", () => ({
    supabase: {
        from: vi.fn(() => mockChain),
        auth: {
            signUp: vi.fn(),
            signInWithPassword: vi.fn(),
            signOut: vi.fn(),
            getUser: vi.fn(),
            getSession: vi.fn(),
            onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
        },
    },
}));

import { createUserProfile } from "../src/services/authService";

describe("AuthService - createUserProfile branches", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        callCount = 0;
        results = [];
    });

    it("creates profile with contactNumber when provided", async () => {
        // First call: fetchUserProfile returns null (no existing profile)
        // Second call: insert returns new profile
        results = [
            { data: null, error: { code: "PGRST116", message: "Not found" } },
            { data: { user_id: "u1", username: "john", full_name: "John Doe", contact_number: "9876543210" }, error: null },
        ];

        const result = await createUserProfile("u1", "john", "John Doe", "9876543210");
        expect(result).toEqual({ user_id: "u1", username: "john", full_name: "John Doe", contact_number: "9876543210" });
    });

    it("creates profile without contactNumber when not provided", async () => {
        results = [
            { data: null, error: { code: "PGRST116", message: "Not found" } },
            { data: { user_id: "u2", username: "jane", full_name: "Jane Doe" }, error: null },
        ];

        const result = await createUserProfile("u2", "jane", "Jane Doe");
        expect(result).toEqual({ user_id: "u2", username: "jane", full_name: "Jane Doe" });
    });

    it("returns existing profile without creating new one", async () => {
        results = [
            { data: { user_id: "u3", username: "existing", full_name: "Existing User" }, error: null },
        ];

        const result = await createUserProfile("u3", "new", "New Name");
        expect(result.username).toBe("existing");
        // Should only have called single once (for fetch, not insert)
        expect(callCount).toBe(1);
    });

    it("throws error when insert fails", async () => {
        results = [
            { data: null, error: { code: "PGRST116", message: "Not found" } },
            { data: null, error: { message: "Insert constraint violation" } },
        ];

        await expect(createUserProfile("u4", "conflict", "Conflict User"))
            .rejects.toThrow("Failed to create user profile: Insert constraint violation");
    });
});

