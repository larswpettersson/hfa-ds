import { test, expect } from "@playwright/test";
import { tool, toolExists } from "../lib/tools.mjs";
import { openTool } from "../lib/page.mjs";

// Layout decisions 12 and 13 in docs/design-stpa.md: title bar with the app commands, three columns with drag bars,
// panels as cards with a 1 px foreground.muted border and radius 8.
const T = tool("stpa-workbench");

test.describe("STPA workbench: layout", () => {
  let errors;
  test.beforeEach(async ({ page }) => {
    test.skip(!toolExists(T), `${T.file} not found in the workspace`);
    await page.setViewportSize({ width: 1600, height: 900 });
    ({ errors } = await openTool(page, T));
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector("#diagram g.node");
  });
  test.afterEach(() => expect(errors).toEqual([]));

  test("the title bar holds the application commands, 28 px high, and no panel has a header row of its own", async ({ page }) => {
    for (const id of ["importBtn", "exportBtn", "undoBtn", "helpBtn"]) {
      const b = page.locator(`header #${id}`);
      await expect(b).toBeVisible();
      expect((await b.boundingBox()).height).toBeGreaterThanOrEqual(28);
      expect((await b.boundingBox()).height).toBeLessThan(32);
    }
    await expect(page.locator(".panel > .bar")).toHaveCount(0);
  });

  test("the control structure, the tables and the AI panel are three columns, in that order", async ({ page }) => {
    const x = async (sel) => (await page.locator(sel).boundingBox()).x;
    expect(await x("#leftPanel")).toBeLessThan(await x("#midPanel"));
    expect(await x("#midPanel")).toBeLessThan(await x("#ai-panel"));
    await expect(page.locator("#leftPanel #vDiagram")).toHaveCount(1);
    await expect(page.locator("#midPanel #vStructure")).toHaveCount(1);
  });

  test("panels are cards with a 1 px border and radius 8", async ({ page }) => {
    const css = await page.locator("#leftPanel").evaluate((el) => { const c = getComputedStyle(el); return [c.borderTopWidth, c.borderTopLeftRadius]; });
    expect(css).toEqual(["1px", "8px"]);
  });

  test("the drag bar resizes the columns with the arrow keys and keeps the width after a reload", async ({ page }) => {
    const bar = page.locator("#dragLeft");
    await expect(bar).toHaveAttribute("role", "separator");
    const w = async () => (await page.locator("#leftPanel").boundingBox()).width;
    const before = await w();
    await bar.focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    expect(await w()).toBeGreaterThan(before + 10);
    expect(await page.locator("#vDiagram").count()).toBe(1); // arrows on the bar do not move the indication
    const after = await w();
    await page.reload();
    await page.waitForSelector("#diagram g.node");
    expect(Math.abs((await w()) - after)).toBeLessThan(2);
  });

  test("dragging the bar with the mouse changes the width", async ({ page }) => {
    const b = await page.locator("#dragLeft").boundingBox();
    const before = (await page.locator("#leftPanel").boundingBox()).width;
    await page.mouse.move(b.x + 8, b.y + b.height / 2);
    await page.mouse.down();
    await page.mouse.move(b.x - 150, b.y + b.height / 2, { steps: 5 });
    await page.mouse.up();
    expect((await page.locator("#leftPanel").boundingBox()).width).toBeLessThan(before - 100);
  });
});
