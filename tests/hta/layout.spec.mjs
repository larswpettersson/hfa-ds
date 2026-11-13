import { test, expect } from "@playwright/test";
import { tool, toolExists } from "../lib/tools.mjs";
import { openTool } from "../lib/page.mjs";

// Requirements: HTA-ADD-1..5, HTA-TTA-1 and HTA-AI-1..3 in docs/design-hta.md.
const T = tool("hta");
const count = (page) => page.evaluate(() => { const walk = (n) => 1 + n.children.reduce((a, c) => a + walk(c), 0); return walk(HTAEditor.getState().root); });
const selectedTask = (page) => page.evaluate(() => { const s = HTAEditor.getState(); return s.selectedId ?? null; });
const sameRow = async (locs) => {
  const ys = [];
  for (const l of locs) { const b = await l.boundingBox(); ys.push(b.y + b.height / 2); }
  return Math.max(...ys) - Math.min(...ys) < 6;
};

test.describe("HTA: panel header rows and title bar", () => {
  let errors;
  test.beforeEach(async ({ page }) => {
    test.skip(!toolExists(T), `${T.file} not found in the workspace`);
    await page.setViewportSize({ width: 1600, height: 900 });
    ({ errors } = await openTool(page, T));
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector(".task");
    await page.locator(".task").first().click();
  });
  test.afterEach(() => expect(errors).toEqual([]));

  test("HTA-ADD-1: rubrikraden har titeln och kommandona på samma rad", async ({ page }) => {
    const row = page.locator(".hta-header");
    await expect(row.locator("h2")).toHaveText("HTA");
    const btns = row.locator("button");
    await expect(btns).toHaveText([/Add Child/, /Add Sibling/, /Duplicate/]);
    expect(await sameRow([row.locator("h2"), ...(await btns.all())])).toBe(true);
  });

  test("HTA-ADD-2: Add Child lägger till en underuppgift", async ({ page }) => {
    const before = await count(page);
    await page.getByRole("button", { name: "Add Child" }).click();
    expect(await count(page)).toBe(before + 1);
  });

  test("HTA-ADD-3: knapparna och tangenterna gör samma sak", async ({ page }) => {
    const n = await count(page);
    await page.evaluate(() => document.activeElement?.blur()); // a click puts the focus in the task; keys act when no text has it
    await page.keyboard.press("c");
    expect(await count(page)).toBe(n + 1);
    await page.keyboard.press("s");
    expect(await count(page)).toBe(n + 2);
    await page.keyboard.press("d");
    expect(await count(page)).toBe(n + 3);
  });

  test("HTA-ADD-4: tangenten syns som en understruken bokstav", async ({ page }) => {
    for (const [name, key] of [["Add Child", "C"], ["Add Sibling", "S"], ["Duplicate", "D"]]) {
      const u = page.getByRole("button", { name }).locator(".ul");
      await expect(u).toHaveText(key);
      expect(await u.evaluate((e) => getComputedStyle(e).textDecorationLine)).toContain("underline");
    }
  });

  test("HTA-ADD-5: bokstavstangenterna är avstängda medan man skriver", async ({ page }) => {
    await page.locator(".task").first().dblclick();
    const n = await count(page);
    await page.keyboard.type("Cd");
    expect(await count(page)).toBe(n);
  });

  test("HTA-TTA-1: TTA-panelens rubrikrad har titeln och kommandona på samma rad, utan understrykning", async ({ page }) => {
    const row = page.locator(".tta-header");
    await expect(row.locator("h2")).toHaveText("TTA");
    const btns = row.locator("button");
    await expect(btns).toHaveText(["Columns…", "Filter", "Export CSV", "Add row"]);
    expect(await sameRow([row.locator("h2"), ...(await btns.all())])).toBe(true);
    await expect(row.locator(".ul")).toHaveCount(0);
  });

  test("HTA-AI-1: titelraden går över hela bredden och panelen ligger under den", async ({ page }) => {
    const header = await page.locator(".header").boundingBox();
    const panel = await page.locator(".ai-panel").boundingBox();
    expect(header.x + header.width).toBeGreaterThanOrEqual(panel.x + panel.width - 1);
    expect(panel.y).toBeGreaterThanOrEqual(header.y + header.height);
    await expect(page.locator(".header").getByRole("switch", { name: "Dark theme" })).toBeVisible();
    await expect(page.locator(".header .ai-toggle")).toHaveCount(0);
    await expect(page.locator(".ai-head .ai-toggle")).toHaveCount(1);
  });

  test("HTA-AI-2: när panelen stängs tar appytan hela bredden och panelväxlingen står kvar på samma plats", async ({ page }) => {
    const before = await page.locator(".ai-head .ai-toggle").boundingBox();
    await page.locator(".ai-head .ai-toggle").click();
    await expect(page.locator(".ai-panel")).toBeHidden();
    const content = await page.locator(".main-content").boundingBox();
    expect(content.x + content.width).toBeGreaterThan(1500);
    const after = await page.locator(".ai-toggle").boundingBox();
    expect(Math.abs(after.x - before.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(1);
    await expect(page.locator(".header .ai-toggle")).toHaveCount(0);
    await expect(page.locator(".header").getByRole("switch", { name: "Dark theme" })).toBeVisible();
  });

  test("HTA-AI-3: panelväxlingen öppnar panelen igen", async ({ page }) => {
    await page.locator(".ai-head .ai-toggle").click();
    await page.locator(".ai-toggle").click();
    await expect(page.locator(".ai-panel")).toBeVisible();
    await expect(page.locator(".ai-head .ai-toggle")).toHaveCount(1);
  });
});
