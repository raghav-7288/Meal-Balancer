import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E test configuration for Diet Specifix.
 *
 * Run with: npm run test:e2e
 * The dev server must be running (npm run dev) or use webServer config below.
 */
export default defineConfig({
    testDir: "./e2e",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: "html",
    timeout: 30_000,

    /* Snapshot configuration for visual regression tests */
    snapshotDir: "./e2e/snapshots",
    expect: {
        toHaveScreenshot: {
            maxDiffPixelRatio: 0.02,
            animations: "disabled",
        },
    },

    use: {
        baseURL: "http://localhost:5173",
        trace: "on-first-retry",
        screenshot: "only-on-failure",
    },

    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"], channel: "chrome" },
        },
    ],

    /* Start the dev server before running E2E tests */
    webServer: {
        command: "npm run dev",
        url: "http://localhost:5173",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
});

