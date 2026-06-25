/**
 * End-to-End Integration Tests
 * Tests the full data flow from services through engines to scoring,
 * simulating real app usage patterns.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { clearCache } from "../src/utils/queryCache";

// ─── Mock Supabase for all services ─────────────────────────────────────────
let terminalResult;
let authMockResult;

function createChainableMock() {
    const mock = {};
    const chainFn = () => mock;
    const methods = ["from","select","insert","update","upsert","delete","eq","neq","in","ilike","order","limit","not","gt"];
    for (const m of methods) { mock[m] = chainFn; }
    mock.single = () => Promise.resolve(terminalResult);
    mock.then = (resolve, reject) => Promise.resolve(terminalResult).then(resolve, reject);
    mock.catch = (rej) => Promise.resolve(terminalResult).catch(rej);
    return mock;
}

vi.mock("../src/lib/supabaseClient", () => ({
    supabase: {
        from: vi.fn(() => createChainableMock()),
        auth: {
            signUp: vi.fn((...args) => Promise.resolve(authMockResult)),
            signInWithPassword: vi.fn((...args) => Promise.resolve(authMockResult)),
            signOut: vi.fn((...args) => Promise.resolve(authMockResult)),
            getUser: vi.fn((...args) => Promise.resolve(authMockResult)),
            getSession: vi.fn((...args) => Promise.resolve(authMockResult)),
            onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
        },
    },
}));

// Import all services and engines
import { signUp, signIn, signOut, fetchUserProfile, createUserProfile } from "../src/services/authService";
import { getHealthGoals, getMajorGroups, getFoodsByGroup, getFoodNutrients } from "../src/services/databaseService";
import { searchFoodItems, fetchFoodNutrients } from "../src/services/foodSearchService";
import { fetchMealHistory, upsertMealHistoryEntry, dbRowToEntry } from "../src/services/mealHistoryService";
import { fetchUserPlans, upsertPlan, deletePlan } from "../src/services/planSyncService";
import { fetchPresetPlans } from "../src/services/presetPlanService";
import { fetchDailyHealthData, upsertDailyHealth, dbRowsToWaterData, dbRowsToStepData } from "../src/services/dailyHealthService";
import { aggregateMeal, combineDay, foodById } from "../src/engines/nutrientEngine";
import { scoreMeal, scoreDay } from "../src/engines/scoringEngine";

describe("End-to-End Integration Tests", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        clearCache();
        terminalResult = { data: null, error: null };
        authMockResult = { data: null, error: null };
    });

    // ─── Full User Registration + Profile Flow ───────────────────────
    describe("User Registration → Profile Setup → Login Flow", () => {
        it("should complete full registration flow", async () => {
            // Step 1: Sign up
            authMockResult = { data: { user: { id: "new-user-1", email: "[REDACTED_EMAIL_ADDRESS_1]" }, session: { access_token: "tok-1" } }, error: null };
            const signUpResult = await signUp("[REDACTED_EMAIL_ADDRESS_1]", "securePass123");
            expect(signUpResult.user.id).toBe("new-user-1");

            // Step 2: Create profile - first fetchUserProfile returns null (PGRST116)
            terminalResult = { data: null, error: { code: "PGRST116", message: "Not found" } };
            // fetchUserProfile returns null for PGRST116
            const existingProfile = await fetchUserProfile("new-user-1");
            expect(existingProfile).toBeNull();

            // Step 3: Sign in
            authMockResult = { data: { user: { id: "new-user-1", email: "[REDACTED_EMAIL_ADDRESS_1]" }, session: { access_token: "tok-1" } }, error: null };
            const signInResult = await signIn("[REDACTED_EMAIL_ADDRESS_1]", "securePass123");
            expect(signInResult.session.access_token).toBe("tok-1");

            // Step 4: Fetch profile after creation
            terminalResult = { data: { user_id: "new-user-1", username: "john", full_name: "John Doe", height_cm: null }, error: null };
            const fetchedProfile = await fetchUserProfile("new-user-1");
            expect(fetchedProfile.username).toBe("john");
        });
    });

    // ─── Full Meal Building + Scoring Flow ───────────────────────────
    describe("Food Search → Meal Building → Scoring Flow", () => {
        it("should search food, build meal, aggregate nutrients, and score", async () => {
            // Step 1: Search for food
            const searchResults = [
                { food_id: 101, food_code: "A001", food_name: "Cooked Rice", major_group_id: 1 },
                { food_id: 102, food_code: "A002", food_name: "Rice Flakes", major_group_id: 1 },
            ];
            terminalResult = { data: searchResults, error: null };
            const foods = await searchFoodItems("Rice");
            expect(foods).toHaveLength(2);

            // Step 2: Get nutrient data for selected food
            const nutrientData = [
                { value: 130, nutrient_definitions: { nutrient_name: "Energy", nutrient_code: "ENER", unit: "kcal" } },
                { value: 28, nutrient_definitions: { nutrient_name: "Carbohydrate", nutrient_code: "CARB", unit: "g" } },
                { value: 2.5, nutrient_definitions: { nutrient_name: "Protein", nutrient_code: "PROT", unit: "g" } },
                { value: 0.3, nutrient_definitions: { nutrient_name: "Fat", nutrient_code: "FAT", unit: "g" } },
                { value: 0.4, nutrient_definitions: { nutrient_name: "Fibre", nutrient_code: "FIB", unit: "g" } },
            ];
            terminalResult = { data: nutrientData, error: null };
            const nutrients = await fetchFoodNutrients(101);
            expect(nutrients.nutrients.kcal).toBe(130);

            // Step 3: Build a balanced meal
            const mealItems = [
                { foodId: "db-rice", grams: 200, nutrients: nutrients.nutrients, foodGroup: "cereals" },
                { foodId: "mixedveg", grams: 150 }, // Local food
                { foodId: "dal", grams: 75 },       // Local food
            ];

            // Step 4: Aggregate meal nutrients
            const mealTotals = aggregateMeal(mealItems);
            expect(mealTotals.kcal).toBeGreaterThan(0);
            expect(mealTotals.vegetablesG).toBe(150);

            // Step 5: Score the meal
            const { score, band } = scoreMeal(mealTotals);
            expect(score).toBeGreaterThan(0);
            expect(score).toBeLessThanOrEqual(100);
            expect(["Excellent balance", "Good balance", "Moderate imbalance", "Poor balance"]).toContain(band);
        });

        it("should build a full day plan and score it", () => {
            // Build meals using local foods
            const breakfastItems = [
                { foodId: "roti", grams: 60 },
                { foodId: "egg", grams: 50 },
                { foodId: "banana", grams: 100 },
            ];
            const lunchItems = [
                { foodId: "rice", grams: 200 },
                { foodId: "dal", grams: 150 },
                { foodId: "mixedveg", grams: 150 },
                { foodId: "curd", grams: 100 },
            ];
            const dinnerItems = [
                { foodId: "roti", grams: 90 },
                { foodId: "dal", grams: 75 },
                { foodId: "mixedveg", grams: 150 },
            ];

            const breakfast = aggregateMeal(breakfastItems);
            const lunch = aggregateMeal(lunchItems);
            const dinner = aggregateMeal(dinnerItems);

            expect(breakfast.kcal).toBeGreaterThan(0);
            expect(lunch.kcal).toBeGreaterThan(0);
            expect(dinner.kcal).toBeGreaterThan(0);

            // Combine day
            const dayTotals = combineDay({ breakfast, lunch, dinner });
            expect(dayTotals.kcal).toBe(breakfast.kcal + lunch.kcal + dinner.kcal);
            expect(dayTotals.vegetablesG).toBe(breakfast.vegetablesG + lunch.vegetablesG + dinner.vegetablesG);

            // Score the day
            const { score, band, reasons } = scoreDay(dayTotals);
            expect(score).toBeGreaterThanOrEqual(0);
            expect(score).toBeLessThanOrEqual(100);
            expect(typeof band).toBe("string");
            expect(Array.isArray(reasons)).toBe(true);
        });
    });

    // ─── Plan Sync Flow ──────────────────────────────────────────────
    describe("Plan Create → Save → Fetch → Delete Flow", () => {
        it("should complete full plan CRUD lifecycle", async () => {
            const userId = "user-1";
            const plan = {
                id: "plan-uuid-1",
                name: "My Balanced Day",
                meals: { breakfast: [{ foodId: "rice", grams: 100 }], lunch: [{ foodId: "dal", grams: 75 }] },
                guidelines: "Focus on vegetables",
            };

            // Create plan
            terminalResult = { data: { ...plan, user_id: userId }, error: null };
            const created = await upsertPlan(userId, plan);
            expect(created.name).toBe("My Balanced Day");

            // Fetch plans
            terminalResult = { data: [{ ...plan, user_id: userId, created_at: "2024-01-01", updated_at: "2024-01-01" }], error: null };
            const plans = await fetchUserPlans(userId);
            expect(plans).toHaveLength(1);
            expect(plans[0].name).toBe("My Balanced Day");

            // Delete plan
            terminalResult = { error: null };
            await expect(deletePlan(userId, "plan-uuid-1")).resolves.toBeUndefined();
        });
    });

    // ─── Meal History Tracking Flow ──────────────────────────────────
    describe("Score Day → Log History → Fetch History Flow", () => {
        it("should log a scored day and fetch it back", async () => {
            // Build and score a day
            const mealItems = [
                { foodId: "rice", grams: 200 },
                { foodId: "dal", grams: 150 },
                { foodId: "mixedveg", grams: 200 },
            ];
            const mealTotals = aggregateMeal(mealItems);
            const dayTotals = combineDay({ lunch: mealTotals });
            const { score, band } = scoreDay(dayTotals);

            // Log it
            const entry = {
                id: "entry-uuid-1",
                date: "2024-06-25",
                timestamp: Date.now(),
                planName: "Today's Plan",
                score,
                band,
                kcal: Math.round(dayTotals.kcal),
                protein: Math.round(dayTotals.protein),
                carbs: Math.round(dayTotals.carbs),
                fat: Math.round(dayTotals.fat),
                fibre: Math.round(dayTotals.fibre),
                vegetablesG: Math.round(dayTotals.vegetablesG),
                visibleFat: Math.round(dayTotals.visibleFat),
            };

            const savedRow = {
                id: entry.id, user_id: "user-1", date: entry.date, timestamp: entry.timestamp,
                plan_name: entry.planName, score: entry.score, band: entry.band,
                kcal: entry.kcal, protein: entry.protein, carbs: entry.carbs,
                fat: entry.fat, fibre: entry.fibre, vegetables_g: entry.vegetablesG, visible_fat: entry.visibleFat,
            };
            terminalResult = { data: savedRow, error: null };
            const saved = await upsertMealHistoryEntry("user-1", entry);
            expect(saved.score).toBe(score);

            // Fetch it back
            terminalResult = { data: [savedRow], error: null };
            const history = await fetchMealHistory("user-1");
            expect(history).toHaveLength(1);

            // Convert DB row to client entry
            const clientEntry = dbRowToEntry(history[0]);
            expect(clientEntry.planName).toBe("Today's Plan");
            expect(clientEntry.score).toBe(score);
        });
    });

    // ─── Daily Health Tracking Flow ──────────────────────────────────
    describe("Water + Steps Tracking → Fetch → Convert Flow", () => {
        it("should track water and steps, then convert for UI", async () => {
            const userId = "user-1";
            const today = "2024-06-25";

            // Track water intake
            terminalResult = { data: { user_id: userId, date: today, water_glasses: 6, water_target: 8, steps: null }, error: null };
            const waterResult = await upsertDailyHealth(userId, today, { water_glasses: 6, water_target: 8 });
            expect(waterResult.water_glasses).toBe(6);

            // Track steps
            terminalResult = { data: { user_id: userId, date: today, water_glasses: 6, water_target: 8, steps: 8500, step_target: 10000 }, error: null };
            const stepsResult = await upsertDailyHealth(userId, today, { steps: 8500, step_target: 10000 });
            expect(stepsResult.steps).toBe(8500);

            // Fetch all health data
            const rows = [
                { date: "2024-06-25", water_glasses: 6, steps: 8500 },
                { date: "2024-06-24", water_glasses: 8, steps: 10000 },
                { date: "2024-06-23", water_glasses: 7, steps: 9500 },
            ];
            terminalResult = { data: rows, error: null };
            const healthData = await fetchDailyHealthData(userId);
            expect(healthData).toHaveLength(3);

            // Convert to UI format
            const waterMap = dbRowsToWaterData(healthData);
            const stepMap = dbRowsToStepData(healthData);

            expect(waterMap["2024-06-25"]).toBe(6);
            expect(waterMap["2024-06-24"]).toBe(8);
            expect(stepMap["2024-06-25"]).toBe(8500);
            expect(stepMap["2024-06-24"]).toBe(10000);
        });
    });

    // ─── Preset Plans Loading Flow ───────────────────────────────────
    describe("Preset Plans → Load → Display Flow", () => {
        it("should load preset plans and verify they have correct structure", async () => {
            const mockPlans = [
                { id: "preset-1", name: "Balanced Indian Diet", meals: { breakfast: [], lunch: [], dinner: [] }, guidelines: "Follow NIN guidelines", display_order: 1, created_at: "2024-01-01" },
                { id: "preset-2", name: "High Protein Plan", meals: { breakfast: [], lunch: [], snack: [], dinner: [] }, guidelines: "60g+ protein daily", display_order: 2, created_at: "2024-01-02" },
            ];
            terminalResult = { data: mockPlans, error: null };

            const plans = await fetchPresetPlans();
            expect(plans).toHaveLength(2);
            expect(plans[0].isPreset).toBe(true);
            expect(plans[1].isPreset).toBe(true);
            expect(plans[0].name).toBe("Balanced Indian Diet");
        });
    });

    // ─── Health Goals Flow ───────────────────────────────────────────
    describe("Health Goals Fetch → Select → Save Flow", () => {
        it("should fetch goals and verify structure", async () => {
            const mockGoals = [
                { health_goal_id: 1, goal_code: "weight_loss", goal_name: "Weight Loss", description: "Lose weight safely", is_active: true, display_order: 1 },
                { health_goal_id: 2, goal_code: "muscle_gain", goal_name: "Muscle Gain", description: "Build lean muscle", is_active: true, display_order: 2 },
                { health_goal_id: 3, goal_code: "heart_health", goal_name: "Heart Health", description: "Improve cardiovascular", is_active: true, display_order: 3 },
            ];
            terminalResult = { data: mockGoals, error: null };

            const goals = await getHealthGoals();
            expect(goals).toHaveLength(3);
            expect(goals[0].goal_code).toBe("weight_loss");
            expect(goals.every((g) => g.is_active)).toBe(true);
        });
    });

    // ─── Food Groups + Foods Browsing Flow ───────────────────────────
    describe("Browse Groups → Select Group → View Foods Flow", () => {
        it("should browse food groups and then foods within a group", async () => {
            // Fetch major groups
            const groups = [
                { major_group_id: 1, group_code: "01", group_name: "Cereals and Millets" },
                { major_group_id: 2, group_code: "02", group_name: "Pulses and Legumes" },
                { major_group_id: 3, group_code: "03", group_name: "Vegetables" },
            ];
            terminalResult = { data: groups, error: null };
            const majorGroups = await getMajorGroups();
            expect(majorGroups).toHaveLength(3);

            // Fetch foods in "Cereals and Millets" group
            clearCache();
            const foods = [
                { food_id: 1, major_group_id: 1, food_code: "A001", food_name: "Rice, raw, milled" },
                { food_id: 2, major_group_id: 1, food_code: "A002", food_name: "Wheat flour" },
                { food_id: 3, major_group_id: 1, food_code: "A003", food_name: "Ragi" },
            ];
            terminalResult = { data: foods, error: null };
            const groupFoods = await getFoodsByGroup(1);
            expect(groupFoods).toHaveLength(3);
            expect(groupFoods[0].food_name).toBe("Rice, raw, milled");
        });
    });

    // ─── Error Recovery Scenarios ────────────────────────────────────
    describe("Error Recovery Scenarios", () => {
        it("should handle network timeout gracefully in food search", async () => {
            terminalResult = { data: null, error: { message: "Timeout" } };
            const result = await searchFoodItems("rice");
            expect(result).toEqual([]);
        });

        it("should handle DB connection error in health goals", async () => {
            terminalResult = { data: null, error: { message: "Connection refused" } };
            await expect(getHealthGoals()).rejects.toThrow("Connection refused");
        });

        it("should handle sign-in with wrong credentials", async () => {
            authMockResult = { data: null, error: { message: "Invalid login credentials" } };
            await expect(signIn("[REDACTED_EMAIL_ADDRESS_2]", "wrongpass")).rejects.toThrow("Invalid login credentials");
        });

        it("should handle sign-out network errors", async () => {
            authMockResult = { error: { message: "Network error" } };
            await expect(signOut()).rejects.toThrow("Network error");
        });

        it("should handle plan save failure", async () => {
            terminalResult = { data: null, error: { message: "Quota exceeded" } };
            await expect(upsertPlan("user-1", { id: "p1", name: "x", meals: {} })).rejects.toThrow("Failed to save plan: Quota exceeded");
        });
    });

    // ─── Data Consistency Checks ─────────────────────────────────────
    describe("Data Consistency", () => {
        it("should ensure local food data is consistent", () => {
            const foods = ["rice", "roti", "dal", "curd", "egg", "mixedveg", "banana"];
            for (const id of foods) {
                const food = foodById(id);
                expect(food).toBeDefined();
                expect(food.gramsPerExchange).toBeGreaterThan(0);
                expect(food.kcal).toBeGreaterThan(0);
                expect(food.group).toBeTruthy();
                expect(food.name).toBeTruthy();
                expect(food.carbs).toBeDefined();
                expect(food.protein).toBeDefined();
                expect(food.fat).toBeDefined();
                expect(food.fibre).toBeDefined();
                expect(food.vitamins).toBeDefined();
                expect(food.minerals).toBeDefined();
            }
        });

        it("should ensure meal aggregation preserves energy balance", () => {
            const items = [
                { foodId: "rice", grams: 100 },
                { foodId: "dal", grams: 75 },
                { foodId: "mixedveg", grams: 75 },
            ];
            const totals = aggregateMeal(items);
            const estimatedKcal = (totals.carbs + totals.protein) * 4 + totals.fat * 9;
            expect(Math.abs(totals.kcal - estimatedKcal)).toBeLessThan(50);
        });

        it("should ensure day totals equal sum of meal totals", () => {
            const meal1 = aggregateMeal([{ foodId: "rice", grams: 100 }]);
            const meal2 = aggregateMeal([{ foodId: "dal", grams: 75 }]);
            const day = combineDay({ meal1, meal2 });

            expect(day.kcal).toBeCloseTo(meal1.kcal + meal2.kcal);
            expect(day.protein).toBeCloseTo(meal1.protein + meal2.protein);
            expect(day.carbs).toBeCloseTo(meal1.carbs + meal2.carbs);
            expect(day.fat).toBeCloseTo(meal1.fat + meal2.fat);
        });

        it("should ensure scoring is deterministic", () => {
            const totals = { cerealEnergyPct: 45, vegetablesG: 200, protein: 25, fibre: 10, addedSugar: 5, visibleFat: 7, carbs: 80, fat: 20 };
            const result1 = scoreMeal(totals);
            const result2 = scoreMeal(totals);
            expect(result1.score).toBe(result2.score);
            expect(result1.band).toBe(result2.band);
            expect(result1.reasons).toEqual(result2.reasons);
        });
    });
});
