import { test, expect } from "@playwright/test";
import { tool, toolExists } from "../lib/tools.mjs";
import { openTool } from "../lib/page.mjs";

// Design principles 4.5 and 4.7: the AI panel is open by default and has an icon toggle with only hover and pressed;
// without a provider the panel says so, and there is only one primary button.
const TOOLS = [
  { id: "hta", ready: ".task", toolbar: ".header .toolbar" },
  { id: "bowtie", ready: ".card", toolbar: ".toolbar" },
];
const PROVIDERS = { provider: "claude", claude_key: "test-key" };

for (const c of TOOLS) {
  const T = tool(c.id);
  test.describe(`${c.id}: the AI panel toggle`, () => {
    let errors;
    const load = async (page, providers) => {
      await page.evaluate((p) => { localStorage.clear(); if (p) localStorage.setItem("hfa-ai:providers", JSON.stringify(p)); }, providers);
      await page.reload();
      await page.waitForSelector(c.ready);
    };
    test.beforeEach(async ({ page }) => {
      test.skip(!toolExists(T), `${T.file} not found in the workspace`);
      ({ errors } = await openTool(page, T));
    });
    test.afterEach(() => expect(errors).toEqual([]));

    test("open by default, with the toggle in the panel header", async ({ page }) => {
      await load(page, PROVIDERS);
      const toggle = page.locator(".ai-toggle");
      await expect(page.locator(".ai-panel")).toBeVisible();
      await expect(toggle).toHaveText("");
      await expect(toggle).toHaveAttribute("aria-label", "Hide AI panel");
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      await expect(page.locator(".ai-head .ai-toggle")).toHaveCount(1);
      await expect(page.locator(".ai-head button", { hasText: "✕" })).toHaveCount(0);
    });

    test("it hides the panel and moves to the right end of the toolbar, and the choice is remembered", async ({ page }) => {
      await load(page, PROVIDERS);
      await page.click(".ai-toggle");
      await expect(page.locator(".ai-panel")).toBeHidden();
      await expect(page.locator(`${c.toolbar} > .ai-toggle`)).toHaveCount(1);
      const last = await page.locator(`${c.toolbar} > *`).last().evaluate((e) => e.classList.contains("ai-toggle"));
      expect(last).toBe(true);
      await expect(page.locator(".ai-toggle")).toHaveAttribute("aria-label", "Show AI panel");
      await expect(page.locator(".ai-toggle")).toHaveAttribute("aria-expanded", "false");
      await page.reload();
      await page.waitForSelector(c.ready);
      await expect(page.locator(".ai-panel")).toBeHidden();
      await page.click(".ai-toggle");
      await expect(page.locator(".ai-panel")).toBeVisible();
      await expect(page.locator(".ai-head .ai-toggle")).toHaveCount(1);
    });

    test("pressed is only while the mouse button is down, and there is no status look", async ({ page }) => {
      await load(page, PROVIDERS);
      const toggle = page.locator(".ai-toggle");
      const bg = () => toggle.evaluate((e) => getComputedStyle(e).backgroundColor);
      const rest = await bg();
      await toggle.hover();
      await page.mouse.down();
      const down = await bg();
      expect(down).not.toBe(rest);
      await page.mouse.up(); // the click that hides the panel
      await expect(page.locator(".ai-panel")).toBeHidden();
      await page.mouse.move(0, 0);
      expect(await bg()).toBe(rest); // the toggle looks the same whether the panel is open or hidden
    });

    test("without a provider the panel says so and there is one primary button", async ({ page }) => {
      await load(page, null);
      const panel = page.locator(".ai-panel");
      await expect(panel.locator(".ai-pill")).toHaveText("No provider");
      await expect(panel.locator(".ai-pill")).toHaveClass(/warning/);
      await expect(panel.locator(".ai-noprovider")).toContainText("Open Settings");
      await expect(panel.locator(".ai-msg.welcome")).toBeHidden();
      await expect(panel.locator('.ai-chat button[type="submit"]')).toBeDisabled();
      await expect(panel.locator(".ai-chat textarea")).toBeDisabled();
      await expect(panel.locator(".ai-chat textarea")).toHaveAttribute("placeholder", /Set up a provider in Settings/);
      await expect(panel.locator("button.primary")).toHaveCount(1);
      await expect(panel.locator("button.primary")).toHaveText("Settings…");
    });

    test("with a provider Send is the only primary button", async ({ page }) => {
      await load(page, PROVIDERS);
      const panel = page.locator(".ai-panel");
      await expect(panel.locator(".ai-pill")).toHaveText("Claude");
      await expect(panel.locator(".ai-noprovider")).toHaveCount(0);
      await expect(panel.locator("button.primary")).toHaveCount(1);
      await expect(panel.locator("button.primary")).toHaveText("Send");
    });
  });
}
