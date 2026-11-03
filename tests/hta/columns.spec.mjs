import { test, expect } from "@playwright/test";
import { tool, toolExists } from "../lib/tools.mjs";
import { openTool } from "../lib/page.mjs";

// Customisable TTA columns: design principles 1.7, architecture section 8 (step 2).
const T = tool("hta");

const columns = (page) => page.evaluate(() => HTAEditor.getState().meta.columns);
const column = async (page, id) => (await columns(page)).find((c) => c.id === id);
const header = (page, id) => page.locator(`#ttaThead th[data-col="${id}"]`);

/** A file whose built-in columns are relabelled for STPA, with one custom column that has a description. */
const STPA_FILE = {
  version: 2,
  meta: {
    theme: "light",
    columns: [
      { id: "taskStep", label: "Control Action / Task Step", order: 0 },
      { id: "externalErrorMode", label: "Unsafe Control Action (UCA)", order: 1 },
      { id: "hazards", label: "Related Hazards", order: 2, type: "list", description: "Hazard ids the UCA can lead to, e.g. H1." },
      { id: "comments", label: "Comments", order: 3 },
    ],
  },
  root: { id: "1", title: "Operate train", children: [{ id: "1.1", title: "Set speed", children: [] }] },
  ttaRecords: [{ id: "r1", taskId: "1.1", externalErrorMode: "Omission", hazards: ["H1"] }],
};

test.describe("HTA: customisable TTA columns", () => {
  let errors;
  test.beforeEach(async ({ page }) => {
    test.skip(!toolExists(T), `${T.file} not found in the workspace`);
    ({ errors } = await openTool(page, T));
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector("#ttaThead th");
  });
  test.afterEach(() => expect(errors).toEqual([]));

  test("built-in columns have descriptions, shown as header tooltips", async ({ page }) => {
    const cols = await columns(page);
    expect(cols.every((c) => c.description)).toBe(true);
    await expect(header(page, "recovery")).toHaveAttribute("title", /noticed and corrected[\s\S]*Click to edit the column/);
  });

  test("a relabelled built-in column drops the default description; a description in the file is kept", async ({ page }) => {
    await page.evaluate((f) => HTAEditor.loadState(f), STPA_FILE);
    expect((await column(page, "externalErrorMode")).description).toBe("");
    expect((await column(page, "comments")).description).toMatch(/Notes/);
    expect((await column(page, "hazards")).description).toBe("Hazard ids the UCA can lead to, e.g. H1.");
    await expect(header(page, "hazards")).toHaveAttribute("title", /Hazard ids the UCA/);
  });

  test("clicking a header edits name and description; Ctrl+Z and Ctrl+Shift+Z undo and redo it", async ({ page }) => {
    await header(page, "consequence").click();
    const dlg = page.locator("#column-dialog");
    await expect(dlg).toBeVisible();
    await expect(page.locator("#column-delete")).toBeHidden(); // built-in: hide, not delete
    await page.fill("#column-label", "Hazard / Loss");
    await page.fill("#column-description", "The hazard or loss the error leads to.");
    await dlg.locator('button[value="save"]').click();
    await expect(dlg).toBeHidden();
    await expect(header(page, "consequence")).toHaveText("Hazard / Loss");
    await expect(header(page, "consequence")).toHaveAttribute("title", /The hazard or loss/);
    expect(await column(page, "consequence")).toMatchObject({ label: "Hazard / Loss", description: "The hazard or loss the error leads to." });

    await page.locator("#hierarchy").click({ position: { x: 5, y: 5 } });
    await page.keyboard.press("Control+z");
    await expect(header(page, "consequence")).toHaveText("Consequence");
    await page.keyboard.press("Control+Shift+z");
    await expect(header(page, "consequence")).toHaveText("Hazard / Loss");
  });

  test("Cancel changes nothing, and a column needs a name", async ({ page }) => {
    await header(page, "psf").click();
    await page.fill("#column-label", "Changed");
    await page.locator('#column-dialog button[value="cancel"]').click();
    await expect(page.locator("#column-dialog")).toBeHidden();
    await expect(header(page, "psf")).toHaveText("PSFs");

    await header(page, "psf").click();
    await page.fill("#column-label", "   ");
    await page.locator('#column-dialog button[value="save"]').click();
    await expect(page.locator("#column-dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(header(page, "psf")).toHaveText("PSFs");
  });

  test("+ Column adds a custom column whose values are saved; it can be deleted with its values", async ({ page }) => {
    await page.click('[data-action="toggleColumnPicker"]');
    await page.click('[data-action="addColumn"]');
    await page.fill("#column-label", "Control and feedback");
    await page.fill("#column-description", "Control actions and feedback for the task.");
    await page.locator('#column-dialog button[value="save"]').click();

    expect(await column(page, "controlAndFeedback")).toMatchObject({ label: "Control and feedback", type: "text", visible: true });
    await expect(header(page, "controlAndFeedback")).toHaveText("Control and feedback");
    const cell = page.locator('#ttaTbody td[data-col="controlAndFeedback"]').first();
    await cell.click();
    await page.keyboard.type("Brake demand");
    await page.locator("#hierarchy").click({ position: { x: 5, y: 5 } });
    const rows = await page.evaluate(() => HTAEditor.getState().ttaRecords.map((r) => r.controlAndFeedback));
    expect(rows).toContain("Brake demand");

    // A second column with the same name gets its own id.
    await page.click('[data-action="toggleColumnPicker"]');
    await page.click('[data-action="addColumn"]');
    await page.fill("#column-label", "Control and feedback");
    await page.locator('#column-dialog button[value="save"]').click();
    expect(await column(page, "controlAndFeedback2")).toBeTruthy();

    await header(page, "controlAndFeedback").click();
    await expect(page.locator("#column-delete")).toBeVisible();
    page.once("dialog", (d) => { expect(d.message()).toMatch(/values in 1 row/); d.accept(); });
    await page.click("#column-delete");
    expect(await column(page, "controlAndFeedback")).toBeUndefined();
    await expect(header(page, "controlAndFeedback")).toHaveCount(0);
    const left = await page.evaluate(() => HTAEditor.getState().ttaRecords.filter((r) => "controlAndFeedback" in r).length);
    expect(left).toBe(0);
  });

  test("Reset restores the built-in columns and keeps custom ones", async ({ page }) => {
    await page.evaluate((f) => HTAEditor.loadState(f), STPA_FILE);
    await page.click('[data-action="toggleColumnPicker"]');
    await page.click('[data-action="resetColumns"]');
    expect(await column(page, "externalErrorMode")).toMatchObject({ label: "External Error Mode", description: expect.stringMatching(/go wrong/) });
    expect(await column(page, "hazards")).toMatchObject({ label: "Related Hazards", visible: true });
    // Custom column values are kept (custom list columns are stored as text today).
    const values = await page.evaluate(() => HTAEditor.getState().ttaRecords.find((r) => r.id === "r1").hazards);
    expect(String(values)).toBe("H1");
  });
});
