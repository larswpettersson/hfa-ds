import { test, expect } from "@playwright/test";
import { tool, toolExists } from "../lib/tools.mjs";
import { openTool } from "../lib/page.mjs";

// Requirements: HTA-NAV-1..8 and HTA-SEL-1, 2 in docs/design-hta.md (5.2 to 5.6 of the design principles).
// The example: task 1 with 1.1 and 1.2 side by side below it.
const T = tool("hta");
const task = (page, id) => page.locator(`.task[data-task-id="${id}"]`);
const box = (page, id) => task(page, id).locator(".task-box");
const ids = (loc) => loc.evaluateAll((els) => els.map((e) => e.dataset.taskId).sort());
const indicated = (page) => ids(page.locator(".task.is-keyboard-hover"));
const selected = (page) => ids(page.locator(".task.selected"));
const pick = (page, id) => task(page, id).locator(".task-id").click(); // a click outside the text selects the task
const hover = async (page, id) => { const b = await box(page, id).boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 2 }); };

test.describe("HTA: indication, selection and arrow navigation", () => {
  let errors;
  test.beforeEach(async ({ page }) => {
    test.skip(!toolExists(T), `${T.file} not found in the workspace`);
    await page.setViewportSize({ width: 1600, height: 900 });
    ({ errors } = await openTool(page, T));
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector(".task");
    await page.mouse.move(2, 2);
  });
  test.afterEach(() => expect(errors).toEqual([]));

  test("HTA-NAV-1: en pil flyttar indikeringen", async ({ page }) => {
    await hover(page, "1");
    expect(await indicated(page)).toEqual(["1"]);
    await page.keyboard.press("ArrowDown");
    expect((await indicated(page)).length).toBe(1);
    expect(await indicated(page)).not.toEqual(["1"]);
    expect(await selected(page)).toEqual([]);
  });

  test("HTA-NAV-2: uppgifter på samma rad går först", async ({ page }) => {
    await hover(page, "1.1");
    await page.keyboard.press("ArrowRight");
    expect(await indicated(page)).toEqual(["1.2"]);
    await page.keyboard.press("ArrowLeft");
    expect(await indicated(page)).toEqual(["1.1"]);
  });

  test("HTA-NAV-3: vid kanten stannar indikeringen", async ({ page }) => {
    await hover(page, "1.2");
    await page.keyboard.press("ArrowRight");
    expect(await indicated(page)).toEqual(["1.2"]);
    await page.keyboard.press("ArrowDown");
    expect(await indicated(page)).toEqual(["1.2"]);
  });

  test("HTA-NAV-4: musen tar över indikeringen", async ({ page }) => {
    await hover(page, "1.1");
    await page.keyboard.press("ArrowRight");
    expect(await indicated(page)).toEqual(["1.2"]);
    await hover(page, "1");
    expect(await indicated(page)).toEqual(["1"]);
    await page.keyboard.press("ArrowDown");
    expect((await indicated(page)).length).toBe(1);
  });

  test("HTA-NAV-5: piltangenten tar över från musen", async ({ page }) => {
    await hover(page, "1.1");
    await page.keyboard.press("ArrowRight");
    expect(await indicated(page)).toEqual(["1.2"]); // the task under the pointer no longer has it
  });

  test("HTA-NAV-6: bara verklig musrörelse räknas", async ({ page }) => {
    await hover(page, "1.1");
    await page.keyboard.press("ArrowRight");
    await task(page, "1.1").dispatchEvent("mouseover");
    expect(await indicated(page)).toEqual(["1.2"]);
  });

  test("HTA-NAV-7: pilar markerar inte, och Ctrl/⌘+pil används inte", async ({ page }) => {
    await pick(page, "1");
    expect(await selected(page)).toEqual(["1"]);
    await page.keyboard.press("ArrowDown");
    expect(await selected(page)).toEqual(["1"]);
    const was = await indicated(page);
    await page.keyboard.press("ControlOrMeta+ArrowRight");
    expect(await indicated(page)).toEqual(was);
  });

  test("HTA-NAV-8: Alt+pil flyttar den markerade uppgiften", async ({ page }) => {
    await pick(page, "1.1");
    await page.evaluate(() => document.activeElement?.blur());
    await page.keyboard.press("Alt+ArrowRight");
    await expect(task(page, "1.2").locator(".desc-text")).toHaveText(/Set Speed/); // it swapped places with its sibling
  });

  test("HTA-SEL-1: Ctrl/⌘+Enter markerar den indikerade uppgiften", async ({ page }) => {
    await hover(page, "1.1");
    await page.keyboard.press("ControlOrMeta+Enter");
    expect(await selected(page)).toEqual(["1.1"]);
  });

  test("HTA-SEL-2: Enter ensam går in i textredigeringsläget och markerar inte", async ({ page }) => {
    await hover(page, "1.1");
    await page.keyboard.press("Enter");
    expect(await selected(page)).toEqual([]);
    expect(await page.evaluate(() => document.activeElement?.classList.contains("desc-text"))).toBe(true);
  });
});
