import { useState, useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
import { fetchUserPlans, upsertPlans, deletePlan } from "../services/planSyncService";

const LOCAL_STORAGE_KEY = "diet-specifix-user-plans";

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
            meals: remotePlan.meals || {},
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
    const plansRef = useRef(plans);
    const syncDebounceRef = useRef(null);

    useEffect(() => {
        return () => {
            isMounted.current = false;
            if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current);
        };
    }, []);

    // Keep plansRef in sync with latest state
    useEffect(() => {
        plansRef.current = plans;
    }, [plans]);

    // Persist to localStorage whenever plans change
    useEffect(() => {
        writeLocal(plans);
    }, [plans]);

    // Initial sync when user logs in
    useEffect(() => {
        if (!isAuthenticated || !user?.id) {
            // Reset sync flag when user logs out so next login isn't blocked
            syncInProgress.current = false;
            return;
        }
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

    // Refs for status setters accessible in syncToSupabase
    const setSyncStatusRef = useRef(setSyncStatus);
    const setSyncErrorRef = useRef(setSyncError);
    useEffect(() => {
        setSyncStatusRef.current = setSyncStatus;
        setSyncErrorRef.current = setSyncError;
    }, [setSyncStatus, setSyncError]);

    /**
     * Retry the last failed sync manually.
     */
    function retrySync() {
        if (!isAuthenticated || !user?.id) return;
        const currentPlans = plansRef.current;
        setSyncStatus("syncing");
        setSyncError(null);
        syncToSupabase([], currentPlans, user.id, setSyncStatusRef, setSyncErrorRef, isMounted);
    }

    /**
     * Wrapper around setPlans that also syncs to Supabase.
     * Accepts a new plans array or an updater function.
     */
    function setPlans(updater) {
        setPlansInternal((prev) => {
            const next = typeof updater === "function" ? updater(prev) : updater;
            const { isAuthenticated: authed, userId } = authRef.current;

            // Debounce Supabase sync — coalesce rapid mutations into a single call
            if (authed && userId) {
                if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current);
                const capturedPrev = prev;
                const capturedNext = next;
                syncDebounceRef.current = setTimeout(() => {
                    syncToSupabase(
                        capturedPrev,
                        capturedNext,
                        userId,
                        setSyncStatusRef,
                        setSyncErrorRef,
                        isMounted
                    );
                }, 300);
            }

            return next;
        });
    }

    return [plans, setPlans, { syncStatus, syncError, retrySync }];
}

/**
 * Determine what changed between prev and next, and sync to Supabase.
 * Updates syncStatus/syncError via refs so mutation callers get feedback.
 *
 * Uses a reference-equality check (prevPlan === plan) to detect changes.
 * Since the setPlans wrapper always creates new plan objects on mutation,
 * reference inequality reliably indicates a changed plan without JSON.stringify.
 */
async function syncToSupabase(prev, next, userId, setSyncStatusRef, setSyncErrorRef, isMounted) {
    try {
        if (isMounted.current) {
            setSyncStatusRef.current("syncing");
            setSyncErrorRef.current(null);
        }

        const prevMap = new Map(prev.map((p) => [p.id, p]));
        const nextMap = new Map(next.map((p) => [p.id, p]));

        // Find plans to upsert (new or modified via reference inequality)
        const toUpsert = [];
        for (const plan of next) {
            const prevPlan = prevMap.get(plan.id);
            if (!prevPlan || prevPlan !== plan) {
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

        if (isMounted.current) {
            setSyncStatusRef.current("synced");
        }
    } catch (err) {
        console.error("Background plan sync failed:", err);
        if (isMounted.current) {
            setSyncStatusRef.current("error");
            setSyncErrorRef.current(err.message);
        }
    }
}
