import { test, expect } from "@playwright/test";
import { tool, toolExists } from "../lib/tools.mjs";
import { openTool } from "../lib/page.mjs";

// Requirements: BOWTIE-LEGEND-1..5 and BOWTIE-ADD-1..3 in docs/design-bowtie.md.
const T = tool("bowtie");
const cards = (page) => page.locator(".card, .barrier").count();
const sameRow = async (locs) => {
  const ys = [];
  for (const l of locs) { const b = await l.boundingBox(); ys.push(b.y + b.height / 2); }
  return Math.max(...ys) - Math.min(...ys) < 6;
};

test.describe("Bowtie: panel, header row and legend", () => {
  let errors;
  test.beforeEach(async ({ page }) => {
    test.skip(!toolExists(T), `${T.file} not found in the workspace`);
    await page.setViewportSize({ width: 1700, height: 900 });
    ({ errors } = await openTool(page, T));
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector(".card");
  });
  test.afterEach(() => expect(errors).toEqual([]));

  test("BOWTIE-LEGEND-1: legenden viks ihop med ett klick på rubrikraden", async ({ page }) => {
    const wrap = await page.locator(".bowtie-wrap").boundingBox();
    await page.locator("#legendToggle").click();
    await expect(page.locator("#legendRows")).toBeHidden();
    expect(await page.locator("#legendToggle .arrow").evaluate((e) => getComputedStyle(e, "::before").content)).toContain("▸");
    expect((await page.locator(".bowtie-wrap").boundingBox()).width).toBeGreaterThanOrEqual(wrap.width); // the diagram keeps its area
  });

  test("BOWTIE-LEGEND-2: legenden styrs med tangentbordet", async ({ page }) => {
    await page.locator("#legendToggle").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#legendToggle")).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("Space");
    await expect(page.locator("#legendToggle")).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#legendRows")).toBeVisible();
  });

  test("BOWTIE-LEGEND-3: valet sparas", async ({ page }) => {
    await page.locator("#legendToggle").click();
    await page.reload();
    await page.waitForSelector(".card");
    await expect(page.locator("#legendRows")).toBeHidden();
  });

  test("BOWTIE-LEGEND-4: legenden täcker aldrig diagrammet", async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    const legend = await page.locator("#legend").boundingBox();
    const wrap = await page.locator(".bowtie-wrap").boundingBox();
    expect(wrap.x + wrap.width).toBeLessThanOrEqual(legend.x + 1); // its own column
    expect(await page.locator(".bowtie-wrap").evaluate((e) => e.scrollWidth > e.clientWidth)).toBe(true); // the diagram scrolls inside the panel
  });

  test("BOWTIE-LEGEND-5: legenden höjer sig inte vid hover", async ({ page }) => {
    const before = await page.locator("#legend").boundingBox();
    const z = await page.locator("#legend").evaluate((e) => getComputedStyle(e).zIndex);
    await page.locator("#legend").hover();
    await page.waitForTimeout(300);
    expect(await page.locator("#legend").boundingBox()).toEqual(before);
    expect(await page.locator("#legend").evaluate((e) => getComputedStyle(e).zIndex)).toBe(z);
  });

  test("BOWTIE-ADD-1: rubrikraden har titeln och Add-kommandona på samma rad", async ({ page }) => {
    const row = page.locator(".panel-head");
    await expect(row.locator("h2")).toHaveText("Bowtie");
    const btns = row.locator("button");
    await expect(btns).toHaveText(["Add Cause", "Add Preventive Barrier", "Add Reactive Barrier", "Add Consequence"]);
    expect(await sameRow([row.locator("h2"), ...(await btns.all())])).toBe(true);
  });

  test("BOWTIE-ADD-2: knapparna och tangenterna gör samma sak", async ({ page }) => {
    const n = await cards(page);
    await page.getByRole("button", { name: "Add Cause" }).click();
    expect(await cards(page)).toBe(n + 1);
    await page.evaluate(() => document.activeElement?.blur());
    await page.keyboard.press("c");
    expect(await cards(page)).toBe(n + 2);
  });

  test("BOWTIE-ADD-3: tangenten syns på knappen", async ({ page }) => {
    for (const [name, key] of [["Add Cause", "C"], ["Add Preventive Barrier", "B"], ["Add Reactive Barrier", "R"], ["Add Consequence", "q"]]) {
      const u = page.getByRole("button", { name }).locator(".ul");
      await expect(u).toHaveText(key);
      expect(await u.evaluate((e) => getComputedStyle(e).textDecorationLine)).toContain("underline");
    }
  });
});
