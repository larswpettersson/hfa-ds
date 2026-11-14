import { test, expect } from "@playwright/test";
import { tool, toolExists } from "../lib/tools.mjs";
import { openTool } from "../lib/page.mjs";

// Undo and redo, as in HTA and STPA: the Undo button, Ctrl/⌘+Z, Ctrl/⌘+Shift+Z and Ctrl+Y.
const T = tool("bowtie");

const summary = (page) => page.evaluate(() => {
  const s = BowtieEditor.getState();
  return { causes: s.left.causes.length, p1: s.left.barriers[0].description, p2: s.left.barriers[1].protects.length };
});
const status = (page) => page.locator("#statusMessage");
/** Leave any field, so that the keys go to the diagram. */
const keys = async (page, ...ks) => { await page.evaluate(() => document.activeElement?.blur()); for (const k of ks) await page.keyboard.press(k); };
const editP1 = async (page, text) => {
  await page.locator("#b-p1 .desc-text").click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type(text);
};

test.describe("Bowtie: undo and redo", () => {
  let errors;
  test.beforeEach(async ({ page }) => {
    test.skip(!toolExists(T), `${T.file} not found in the workspace`);
    ({ errors } = await openTool(page, T));
    await page.waitForSelector("#b-p4");
  });
  test.afterEach(() => expect(errors).toEqual([]));

  test("the Undo button is enabled and says its key; with nothing to undo it says so", async ({ page }) => {
    const btn = page.locator('[data-action="undo"]');
    await expect(btn).toBeEnabled();
    await expect(btn).toHaveAttribute("title", "Undo the last change (Ctrl/⌘+Z)");
    await btn.click();
    await expect(status(page)).toHaveText("Nothing to undo");
  });

  test("Ctrl+Z undoes one change at a time; Ctrl+Shift+Z and Ctrl+Y redo them", async ({ page }) => {
    const start = await summary(page);
    await page.click('[data-action="addCause"]');
    await editP1(page, "Edited barrier");
    await keys(page);
    expect(await summary(page)).toEqual({ ...start, causes: start.causes + 1, p1: "Edited barrier" });

    await keys(page, "Control+z");
    expect(await summary(page)).toEqual({ ...start, causes: start.causes + 1 });
    await keys(page, "Control+z");
    expect(await summary(page)).toEqual(start);
    await keys(page, "Control+z");
    await expect(status(page)).toHaveText("Nothing to undo");

    await keys(page, "Control+Shift+Z");
    expect((await summary(page)).causes).toBe(start.causes + 1);
    await keys(page, "Control+y");
    expect((await summary(page)).p1).toBe("Edited barrier");
    await keys(page, "Control+y");
    await expect(status(page)).toHaveText("Nothing to redo");
  });

  test("undoing back to the opened diagram leaves no unsaved changes", async ({ page }) => {
    await page.click('[data-action="addCause"]');
    expect(await page.evaluate(() => BowtieEditor.hasUnsavedChanges())).toBe(true);
    await keys(page);
    await page.click('[data-action="undo"]');
    expect(await page.evaluate(() => BowtieEditor.hasUnsavedChanges())).toBe(false);
  });

  test("a new change after an undo drops the redo steps", async ({ page }) => {
    await page.click('[data-action="addCause"]');
    await keys(page, "Control+z");
    await page.click('[data-action="addConsequence"]');
    await keys(page, "Control+Shift+Z");
    await expect(status(page)).toHaveText("Nothing to redo");
  });

  test("in a text field Ctrl+Z is the field's own undo and leaves the diagram alone", async ({ page }) => {
    const start = await summary(page);
    await page.click('[data-action="addCause"]');
    await editP1(page, "Typing");
    await page.keyboard.press("Control+z");
    expect((await summary(page)).causes).toBe(start.causes + 1);
  });

  test("linking a barrier is one step", async ({ page }) => {
    const start = await summary(page);
    await page.locator("#b-p2").click({ position: { x: 3, y: 3 } }); // link mode
    await keys(page, "1", "2", "Enter");
    expect((await summary(page)).p2).not.toBe(start.p2);
    await keys(page, "Control+z");
    expect(await summary(page)).toEqual(start);
    await keys(page, "Control+Shift+Z");
    expect((await summary(page)).p2).not.toBe(start.p2);
  });

  test("Ctrl+Z undoes New", async ({ page }) => {
    const before = await page.evaluate(() => BowtieEditor.getState().hazard.label);
    await page.click('[data-action="newDiagram"]');
    const dlg = page.locator("dialog.confirm-dialog");
    await expect(dlg).toContainText("Ctrl/⌘+Z undoes it");
    await dlg.getByRole("button", { name: "New", exact: true }).click();
    await expect.poll(() => page.evaluate(() => BowtieEditor.getState().hazard.label)).toBe("Hazard");
    await keys(page, "Control+z");
    expect(await page.evaluate(() => BowtieEditor.getState().hazard.label)).toBe(before);
  });
});
