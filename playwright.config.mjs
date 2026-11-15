import { defineConfig } from "@playwright/test";

// The tools are single-file pages that work from file://, so no dev server is needed.
export default defineConfig({
  testDir: "tests",
  testMatch: "**/*.spec.mjs",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: { viewport: { width: 1280, height: 900 }, trace: "retain-on-failure" },
  // Chromium (Chrome and Edge are the same engine) runs every spec. Specs named *.cross.spec.mjs also run in WebKit (the engine of
  // Safari) and Firefox, for behaviour that browsers treat differently, such as key combinations (design principles 5.12).
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "webkit", testMatch: "**/*.cross.spec.mjs", use: { browserName: "webkit" } },
    { name: "firefox", testMatch: "**/*.cross.spec.mjs", use: { browserName: "firefox" } },
  ],
});
