/**
 * Centralized Supabase mock for all test files.
 * Provides chainable query builders and auth mocks.
 */
import { vi } from "vitest";

// Helper to create chainable query builder
export function createQueryBuilder(resolvedData = [], resolvedError = null) {
    const builder = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: resolvedData, error: resolvedError }),
        then: undefined, // prevents auto-resolution
    };

    // Make terminal methods resolve properly
    builder.limit.mockResolvedValue({ data: resolvedData, error: resolvedError });
    builder.order.mockResolvedValue({ data: resolvedData, error: resolvedError });
    builder.select.mockReturnValue(builder);
    builder.insert.mockReturnValue(builder);
    builder.update.mockReturnValue(builder);
    builder.upsert.mockReturnValue(builder);
    builder.delete.mockReturnValue(builder);
    builder.eq.mockReturnValue(builder);
    builder.neq.mockReturnValue(builder);
    builder.in.mockReturnValue(builder);
    builder.ilike.mockReturnValue(builder);

    return builder;
}

// Default auth mock
export const mockAuth = {
    signUp: vi.fn().mockResolvedValue({ data: { user: { id: "user-1", email: "test@test.com" }, session: { access_token: "token" } }, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: { user: { id: "user-1", email: "test@test.com" }, session: { access_token: "token" } }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1", email: "test@test.com" } }, error: null }),
    getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: "user-1", email: "test@test.com" }, access_token: "token" } }, error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
};

// Create mock supabase instance
export const supabase = {
    from: vi.fn(),
    auth: mockAuth,
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
};

export default { supabase, mockAuth, createQueryBuilder };

