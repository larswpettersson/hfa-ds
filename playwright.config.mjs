import { defineConfig } from "@playwright/test";

// The tools are single-file pages that work from file://, so no dev server is needed.
export default defineConfig({
  testDir: "tests",
  testMatch: "**/*.spec.mjs",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: { browserName: "chromium", viewport: { width: 1280, height: 900 }, trace: "retain-on-failure" },
});
