import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Automated accessibility tests using axe-core.
 * Checks WCAG 2.1 Level AA compliance on key pages.
 *
 * Run with: npm run test:e2e
 */

test.describe("Accessibility (a11y)", () => {
    test("Welcome page has no critical a11y violations", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        const results = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
            .exclude(".recharts-wrapper") // Charts have known a11y limitations
            .analyze();

        expect(results.violations.filter((v) => v.impact === "critical")).toHaveLength(0);
        expect(results.violations.filter((v) => v.impact === "serious")).toHaveLength(0);
    });

    test("Login page has no critical a11y violations", async ({ page }) => {
        await page.goto("/login");
        await page.waitForLoadState("networkidle");

        const results = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa"])
            .analyze();

        expect(results.violations.filter((v) => v.impact === "critical")).toHaveLength(0);
        expect(results.violations.filter((v) => v.impact === "serious")).toHaveLength(0);
    });

    test("Food search page has no critical a11y violations", async ({ page }) => {
        await page.goto("/foods");
        await page.waitForLoadState("networkidle");

        const results = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa"])
            .exclude(".recharts-wrapper")
            .analyze();

        expect(results.violations.filter((v) => v.impact === "critical")).toHaveLength(0);
        expect(results.violations.filter((v) => v.impact === "serious")).toHaveLength(0);
    });

    test("Health tools page has no critical a11y violations", async ({ page }) => {
        await page.goto("/health-tools");
        await page.waitForLoadState("networkidle");

        const results = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa"])
            .analyze();

        expect(results.violations.filter((v) => v.impact === "critical")).toHaveLength(0);
        expect(results.violations.filter((v) => v.impact === "serious")).toHaveLength(0);
    });
});

