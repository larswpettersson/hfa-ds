import { test, expect } from "@playwright/test";
import { tool, toolExists } from "../lib/tools.mjs";
import { openTool } from "../lib/page.mjs";

const T = tool("stpa-workbench");

test.describe("STPA workbench: expanded diagram view", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!toolExists(T), `${T.file} not found in the workspace`);
    await openTool(page, T);
    await page.waitForSelector("#diagram g.node");
  });

  test("Expand fills the page and Esc restores it", async ({ page }) => {
    const vp = page.viewportSize();
    const before = await page.locator("#diagramWrap").boundingBox();
    await page.click("#expandBtn");
    await expect(page.locator("#expandBtn")).toHaveAttribute("aria-pressed", "true");
    const pane = await page.locator("#diagramPane").boundingBox();
    expect(pane).toMatchObject({ x: 0, y: 0, width: vp.width, height: vp.height });
    const wrap = await page.locator("#diagramWrap").boundingBox();
    expect(wrap.height).toBeGreaterThan(before.height);
    // The diagram stays interactive while expanded.
    await page.locator("#diagram g.node[data-sel]").first().click({ modifiers: ["Shift"] });
    await expect(page.locator("#selBar .selchip")).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(page.locator("#expandBtn")).toHaveAttribute("aria-pressed", "false");
    expect((await page.locator("#diagramWrap").boundingBox()).height).toBeCloseTo(before.height, 0);
  });
});
