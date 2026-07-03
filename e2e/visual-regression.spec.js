import { test, expect } from "@playwright/test";

/**
 * Visual regression tests — compare page screenshots against baseline snapshots.
 * Baseline snapshots are stored in e2e/snapshots/ and committed to git.
 *
 * First run: `npx playwright test e2e/visual-regression.spec.js --update-snapshots`
 * Subsequent runs compare against the saved baselines.
 */

test.describe("Visual Regression", () => {
    test("Welcome page matches snapshot", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("networkidle");
        await expect(page).toHaveScreenshot("welcome-page.png", {
            fullPage: true,
            maxDiffPixelRatio: 0.02,
        });
    });

    test("Login page matches snapshot", async ({ page }) => {
        await page.goto("/login");
        await page.waitForLoadState("networkidle");
        await expect(page).toHaveScreenshot("login-page.png", {
            maxDiffPixelRatio: 0.02,
        });
    });

    test("Food search page matches snapshot", async ({ page }) => {
        await page.goto("/foods");
        await page.waitForLoadState("networkidle");
        await expect(page).toHaveScreenshot("food-search-page.png", {
            maxDiffPixelRatio: 0.02,
        });
    });

    test("Health tools page matches snapshot", async ({ page }) => {
        await page.goto("/health-tools");
        await page.waitForLoadState("networkidle");
        await expect(page).toHaveScreenshot("health-tools-page.png", {
            maxDiffPixelRatio: 0.02,
        });
    });
});

