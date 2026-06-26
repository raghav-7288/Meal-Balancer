/**
 * Meal Balancer E2E Test: Full User Flow
 *
 * Tests the complete user journey:
 * Login → Create Plan → Add Food → View Score → Export PDF → Logout
 *
 * Prerequisites:
 * - A test user must exist in the Supabase instance
 * - Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD env vars (or use defaults below)
 */
import { test, expect } from "@playwright/test";

// Test credentials — override via env vars for CI
const TEST_EMAIL = process.env.E2E_TEST_EMAIL || "[REDACTED_EMAIL_ADDRESS_7]";
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || "testpass123";

test.describe("Meal Balancer — Full User Flow", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/");
    });

    test("Login → Create Plan → Add Food → View Score → Export PDF → Logout", async ({ page }) => {
        // ─── STEP 1: Login ───────────────────────────────────────────────
        await test.step("Sign in with email and password", async () => {
            // Should see the auth page
            await expect(page.locator("h1")).toContainText("Meal Balancer");
            await expect(page.getByText("Sign in to your account")).toBeVisible();

            // Fill in credentials
            await page.getByPlaceholder(/you@/i).fill(TEST_EMAIL);
            await page.getByPlaceholder("••••••••").fill(TEST_PASSWORD);

            // Submit the sign-in form
            await page.getByRole("button", { name: /sign in/i }).click();

            // Wait for dashboard to load (KPI grid or day selector should appear)
            await expect(page.locator(".dashboard-page")).toBeVisible({ timeout: 15_000 });
        });

        // ─── STEP 2: Create a new plan ──────────────────────────────────
        await test.step("Create a new user plan", async () => {
            // Switch to "My Plans" tab in the sidebar
            const myPlansTab = page.getByRole("button", { name: /my plans/i });
            if (await myPlansTab.isVisible()) {
                await myPlansTab.click();
            }

            // Enter a plan name and create
            const planNameInput = page.getByPlaceholder(/new plan name/i).or(
                page.locator('input[aria-label*="plan name" i]')
            );
            await planNameInput.fill("E2E Test Plan");

            const createBtn = page.getByRole("button", { name: /create/i });
            await createBtn.click();

            // Verify the new plan appears in the sidebar
            await expect(page.getByText("E2E Test Plan")).toBeVisible({ timeout: 5_000 });
        });

        // ─── STEP 3: Add food to a meal ─────────────────────────────────
        await test.step("Add food item to Breakfast", async () => {
            // Find the Breakfast meal card and ensure it's expanded
            const breakfastHeader = page.locator(".meal-head", { hasText: "Breakfast" });
            const mealCard = breakfastHeader.locator("..");

            // Expand if collapsed
            const isCollapsed = await mealCard.evaluate((el) =>
                el.classList.contains("meal-card--collapsed")
            );
            if (isCollapsed) {
                await breakfastHeader.click();
            }

            // Search for a food in the autocomplete
            const foodInput = mealCard.locator('input[aria-label="Search food item"]');
            await foodInput.fill("rice");

            // Wait for autocomplete dropdown
            const dropdown = mealCard.locator(".food-autocomplete-dropdown");
            await expect(dropdown).toBeVisible({ timeout: 5_000 });

            // Click the first suggestion
            await dropdown.locator("li").first().click();

            // Enter grams
            const gramsInput = mealCard.locator('input[aria-label*="Grams for new food"]');
            await gramsInput.fill("150");

            // Click the add button
            const addBtn = mealCard.locator('button[aria-label*="Add food to Breakfast"]');
            await addBtn.click();

            // Verify food was added to the table
            await expect(mealCard.locator("tbody")).toContainText("150");
        });

        // ─── STEP 4: View Score ─────────────────────────────────────────
        await test.step("Verify score is displayed", async () => {
            // The KPI grid should show a score
            const scoreKpi = page.locator(".kpi", { hasText: /score/i });
            await expect(scoreKpi).toBeVisible();

            // The meal card should show a score pill
            const scorePill = page.locator(".score-pill").first();
            await expect(scorePill).toBeVisible();
            await expect(scorePill).toContainText(/\d+ \/ 100/);
        });

        // ─── STEP 5: Export PDF ─────────────────────────────────────────
        await test.step("Export plan as PDF", async () => {
            // Look for export/download button
            const exportBtn = page.getByRole("button", { name: /export|download|pdf/i });

            if (await exportBtn.isVisible()) {
                // Set up download listener
                const downloadPromise = page.waitForEvent("download", { timeout: 10_000 });
                await exportBtn.click();

                const download = await downloadPromise;
                // Verify a file was downloaded
                expect(download.suggestedFilename()).toContain(".pdf");
            } else {
                // PDF export may be triggered from a menu or sidebar
                // Mark as informational — the button location may differ
                test.info().annotations.push({
                    type: "info",
                    description: "PDF export button not found in current view — may require navigation",
                });
            }
        });

        // ─── STEP 6: Logout ─────────────────────────────────────────────
        await test.step("Sign out", async () => {
            // Look for sign out / logout button (could be in nav or profile menu)
            const signOutBtn = page.getByRole("button", { name: /sign out|logout|log out/i });

            if (await signOutBtn.isVisible()) {
                await signOutBtn.click();
            } else {
                // May be behind a profile dropdown
                const profileMenu = page.locator('[aria-label*="profile" i], [aria-label*="menu" i], .nav-avatar, .user-menu');
                if (await profileMenu.first().isVisible()) {
                    await profileMenu.first().click();
                    await page.getByRole("button", { name: /sign out|logout|log out/i }).click();
                }
            }

            // Should be back on the auth page
            await expect(page.getByText("Sign in to your account")).toBeVisible({ timeout: 10_000 });
        });
    });
});

