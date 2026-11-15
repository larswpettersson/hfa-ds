import { test, expect } from "@playwright/test";
import { tool, toolExists } from "../lib/tools.mjs";
import { openTool } from "../lib/page.mjs";

// Requirements: HTA-SEL-3 to 5, HTA-FOCUS-1, HTA-EDIT-1, 2 and HTA-NAV-9 in docs/design-hta.md (5.11, 5.6 of the design principles).
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

  const press = async (page, ...ks) => { for (const k of ks) await page.keyboard.press(k); };
  const title = (page, id) => page.evaluate((id) => { const f = (n) => n.id === id ? n : (n.children || []).map(f).find(Boolean); return f(HTAEditor.getState().root)?.title; }, id);
  const edit = async (page, id, text) => {
    await task(page, id).locator(".task-id").click();
    await press(page, "Enter", "ControlOrMeta+a");
    await page.keyboard.type(text);
  };

  test("HTA-FOCUS-1: after a click on a task's text, Enter edits the task and does not send the AI question", async ({ page }) => {
    await page.evaluate(() => localStorage.setItem("hfa-ai:providers", JSON.stringify({ provider: "claude", claude_key: "test-key" })));
    await page.reload();
    await page.waitForSelector(".task");
    const field = page.locator(".ai-chat textarea");
    await field.fill("ett utkast");
    await field.focus();
    await task(page, "1.1").locator(".desc-text").click();
    await press(page, "Enter");
    expect(await page.evaluate(() => document.activeElement?.classList.contains("desc-text"))).toBe(true);
    await expect(field).toHaveValue("ett utkast");
    await expect(page.locator(".ai-msg.user")).toHaveCount(0);
  });

  test("HTA-EDIT-1: an edit that follows an Enter-confirmed edit is kept when the user clicks another task", async ({ page }) => {
    await edit(page, "1.1", "Första");
    await press(page, "Enter");
    await edit(page, "1.2", "Andra");
    await task(page, "1").locator(".task-id").click();
    expect(await title(page, "1.1")).toBe("Första");
    expect(await title(page, "1.2")).toBe("Andra");
  });

  test("HTA-SEL-5: a click on another task's id while a text is edited confirms the edit and selects that task", async ({ page }) => {
    await edit(page, "1.1", "Ändrad");
    await task(page, "1.2").locator(".task-id").click();
    expect(await title(page, "1.1")).toBe("Ändrad");
    await expect(task(page, "1.2")).toHaveClass(/selected/);
  });

  test("HTA-EDIT-2: Ctrl+Z while a text is edited is the field's own undo and leaves the tasks alone", async ({ page }) => {
    await task(page, "1.1").locator(".task-id").click();
    await press(page, "d"); // duplicate: 1.1 is copied to 1.2, and the old 1.2 becomes 1.3
    const before = await title(page, "1.3");
    await edit(page, "1.2", "Typing");
    await press(page, "ControlOrMeta+z");
    expect(await title(page, "1.3")).toBe(before);
    await press(page, "Enter");
    expect(await title(page, "1.3")).toBe(before); // "Typing" did not end up on another task
  });
});
