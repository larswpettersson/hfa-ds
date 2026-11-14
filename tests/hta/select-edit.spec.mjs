import { test, expect } from "@playwright/test";
import { tool, toolExists } from "../lib/tools.mjs";
import { openTool } from "../lib/page.mjs";

// Requirements: HTA-SEL-3, HTA-SEL-4 and HTA-NAV-9 in docs/design-hta.md (5.11, 5.6 of the design principles).
// A click anywhere on a task, its text included, selects the task; Enter edits the text; plain arrows move the selected task.
const T = tool("hta");
const task = (page, id) => page.locator(`.task[data-task-id="${id}"]`);

test.describe("HTA: select by click, edit with Enter", () => {
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

  test("HTA-SEL-3: a click on the text selects the task and does not start editing", async ({ page }) => {
    await task(page, "1.1").locator(".desc-text").click();
    await expect(task(page, "1.1")).toHaveClass(/selected/);
    expect(await page.evaluate(() => document.activeElement?.classList.contains("desc-text") ?? false)).toBe(false);
  });

  test("HTA-SEL-4: Enter edits the text of the selected task; the id is not editable", async ({ page }) => {
    await task(page, "1.1").locator(".task-id").click();
    expect(await task(page, "1.1").locator(".task-id").getAttribute("contenteditable")).toBeNull();
    await page.keyboard.press("Enter");
    expect(await page.evaluate(() => document.activeElement?.classList.contains("desc-text"))).toBe(true);
  });

  test("HTA-NAV-9: a plain arrow moves the selected task", async ({ page }) => {
    await task(page, "1.1").locator(".desc-text").click();
    await page.keyboard.press("ArrowRight");
    await expect(task(page, "1.2").locator(".desc-text")).toHaveText(/Set Speed/);
  });
});
