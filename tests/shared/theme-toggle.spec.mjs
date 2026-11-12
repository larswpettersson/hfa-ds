import { test, expect } from "@playwright/test";
import { tool, toolExists } from "../lib/tools.mjs";
import { openTool } from "../lib/page.mjs";

// Design principle 4.10: Theme is a switch at the far right of the title bar (the component Theme in HFA DS, 44 × 24),
// with the knob at the left and a sun in the light theme, and at the right with a moon in the dark theme.
const TOOLS = [
  { id: "hta", ready: ".task", titlebar: ".header", themed: "body" },
  { id: "bowtie", ready: ".card", titlebar: ".titlebar", themed: "body" },
  { id: "stpa-workbench", ready: "#diagram g.node", titlebar: "header", themed: "html" },
];

for (const c of TOOLS) {
  const T = tool(c.id);
  test.describe(`${c.id}: the theme switch`, () => {
    let errors;
    test.beforeEach(async ({ page }) => {
      test.skip(!toolExists(T), `${T.file} not found in the workspace`);
      ({ errors } = await openTool(page, T));
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await page.waitForSelector(c.ready);
    });
    test.afterEach(() => expect(errors).toEqual([]));

    test("a 44 × 24 switch at the far right of the title bar, off in the light theme and showing a sun", async ({ page }) => {
      const bar = page.locator(c.titlebar);
      const sw = bar.locator(".theme-toggle");
      await expect(bar.getByRole("switch", { name: "Dark theme" })).toHaveCount(1);
      await expect(sw).toHaveAttribute("aria-checked", "false");
      await expect(bar.locator("button", { hasText: /^Theme$/ })).toHaveCount(0); // the old text button is gone
      const b = await sw.boundingBox(), barBox = await bar.boundingBox();
      expect(Math.round(b.width)).toBe(44);
      expect(Math.round(b.height)).toBe(24);
      expect(barBox.x + barBox.width - (b.x + b.width)).toBeLessThan(40);
      await expect(sw.locator(".sun")).toBeVisible();
      await expect(sw.locator(".moon")).toBeHidden();
    });

    test("a click switches to the dark theme: the knob moves to the right and shows a moon; a second click switches back", async ({ page }) => {
      const sw = page.locator(`${c.titlebar} .theme-toggle`);
      const knobX = () => sw.locator(".knob").evaluate((e) => e.getBoundingClientRect().left);
      const left = await knobX();
      await sw.click();
      await expect(sw).toHaveAttribute("aria-checked", "true");
      await expect(page.locator(c.themed)).toHaveAttribute("data-theme", "dark");
      await expect(sw.locator(".moon")).toBeVisible();
      await expect(sw.locator(".sun")).toBeHidden();
      await expect.poll(knobX).toBeGreaterThan(left + 15);
      await sw.click();
      await expect(sw).toHaveAttribute("aria-checked", "false");
      await expect(page.locator(c.themed)).toHaveAttribute("data-theme", "light");
      await expect.poll(knobX).toBe(left);
    });
  });
}
