import { useState, useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
import { fetchUserPlans, upsertPlans, deletePlan } from "../services/planSyncService";

const LOCAL_STORAGE_KEY = "meal-balancer-user-plans";

/**
 * Read plans from localStorage.
 */
function readLocal() {
    try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (err) {
        console.error("Failed to read plans from localStorage:", err);
        return [];
    }
}

/**
 * Write plans to localStorage.
 */
function writeLocal(plans) {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(plans));
    } catch (err) {
        console.error("Failed to write plans to localStorage:", err);
    }
}

/**
 * Merge local and remote plans. Strategy:
 * - Remote plans are the source of truth for plans that exist in both places.
 * - Local-only plans (not found remotely) are pushed to Supabase.
 * - Remote-only plans are added to local state.
 */
function mergePlans(localPlans, remotePlans) {
    const remoteMap = new Map(remotePlans.map((p) => [p.id, p]));

    const merged = [];
    const toUpload = []; // local plans not in remote

    // Start with all remote plans (source of truth)
    for (const remotePlan of remotePlans) {
        merged.push({
            id: remotePlan.id,
            name: remotePlan.name,
            meals: remotePlan.meals,
            guidelines: remotePlan.guidelines || "",
        });
    }

    // Add local-only plans and queue them for upload
    for (const localPlan of localPlans) {
        if (!remoteMap.has(localPlan.id)) {
            merged.push(localPlan);
            toUpload.push(localPlan);
        }
    }

    return { merged, toUpload };
}

/**
 * A hook that syncs user plans between localStorage and Supabase.
 *
 * - When the user is NOT logged in: behaves like a simple localStorage hook.
 * - When the user IS logged in:
 *   - On mount: fetches remote plans, merges with local, pushes local-only plans to Supabase.
 *   - On mutations (add/update/delete): updates both localStorage and Supabase.
 *
 * @returns {[Array, Function, object]} [plans, setPlans, syncState]
 */
export function useSyncedPlans() {
    const { user, isAuthenticated } = useAuth();
    const [plans, setPlansInternal] = useState(readLocal);
    const [syncStatus, setSyncStatus] = useState("idle"); // idle | syncing | synced | error
    const [syncError, setSyncError] = useState(null);
    const isMounted = useRef(true);
    const syncInProgress = useRef(false);

    useEffect(() => {
        return () => { isMounted.current = false; };
    }, []);

    // Persist to localStorage whenever plans change
    useEffect(() => {
        writeLocal(plans);
    }, [plans]);

    // Initial sync when user logs in
    useEffect(() => {
        if (!isAuthenticated || !user?.id) return;
        if (syncInProgress.current) return;

        async function initialSync() {
            syncInProgress.current = true;
            setSyncStatus("syncing");
            setSyncError(null);

            try {
                const remotePlans = await fetchUserPlans(user.id);
                const localPlans = readLocal();
                const { merged, toUpload } = mergePlans(localPlans, remotePlans);

                // Upload local-only plans to Supabase
                if (toUpload.length > 0) {
                    await upsertPlans(user.id, toUpload);
                }

                if (isMounted.current) {
                    setPlansInternal(merged);
                    setSyncStatus("synced");
                }
            } catch (err) {
                console.error("Plan sync error:", err);
                if (isMounted.current) {
                    setSyncStatus("error");
                    setSyncError(err.message);
                }
            } finally {
                syncInProgress.current = false;
            }
        }

        initialSync();
    }, [isAuthenticated, user?.id]);

    // Keep a ref to the latest auth info for the setter
    const authRef = useRef({ isAuthenticated, userId: user?.id });
    useEffect(() => {
        authRef.current = { isAuthenticated, userId: user?.id };
    }, [isAuthenticated, user?.id]);

    /**
     * Wrapper around setPlans that also syncs to Supabase.
     * Accepts a new plans array or an updater function.
     */
    function setPlans(updater) {
        setPlansInternal((prev) => {
            const next = typeof updater === "function" ? updater(prev) : updater;
            const { isAuthenticated: authed, userId } = authRef.current;

            // Async Supabase sync (fire-and-forget with error logging)
            if (authed && userId) {
                syncToSupabase(prev, next, userId);
            }

            return next;
        });
    }

    return [plans, setPlans, { syncStatus, syncError }];
}

/**
 * Determine what changed between prev and next, and sync to Supabase.
 */
async function syncToSupabase(prev, next, userId) {
    try {
        const prevMap = new Map(prev.map((p) => [p.id, p]));
        const nextMap = new Map(next.map((p) => [p.id, p]));

        // Find plans to upsert (new or modified)
        const toUpsert = [];
        for (const plan of next) {
            const prevPlan = prevMap.get(plan.id);
            if (!prevPlan || JSON.stringify(prevPlan) !== JSON.stringify(plan)) {
                toUpsert.push(plan);
            }
        }

        // Find plans to delete (in prev but not in next)
        const toDelete = [];
        for (const plan of prev) {
            if (!nextMap.has(plan.id)) {
                toDelete.push(plan.id);
            }
        }

        // Execute operations
        const promises = [];
        if (toUpsert.length > 0) {
            promises.push(upsertPlans(userId, toUpsert));
        }
        for (const planId of toDelete) {
            promises.push(deletePlan(userId, planId));
        }

        if (promises.length > 0) {
            await Promise.all(promises);
        }
    } catch (err) {
        console.error("Background plan sync failed:", err);
    }
}


