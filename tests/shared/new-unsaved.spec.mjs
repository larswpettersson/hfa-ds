import { test, expect } from "@playwright/test";
import { tool, toolExists } from "../lib/tools.mjs";
import { openTool } from "../lib/page.mjs";

// New (design principles 4.3) and the question about unsaved changes before Open… (4.4), in HTA and Bowtie.
const TOOLS = [
  { id: "hta", api: "HTAEditor", newAction: "newAnalysis",
    edit: (page) => page.evaluate(() => HTAEditor.replaceState({ ...HTAEditor.getState(), root: { ...HTAEditor.getState().root, title: "Edited goal" } })),
    content: (page) => page.evaluate(() => HTAEditor.getState().root.title), example: "Reach the overall goal" },
  { id: "bowtie", api: "BowtieEditor", newAction: "newDiagram",
    edit: (page) => page.evaluate(() => { const s = BowtieEditor.getState(); s.hazard.label = "Edited hazard"; BowtieEditor.replaceState(s); }),
    content: (page) => page.evaluate(() => BowtieEditor.getState().hazard.label), example: "Hazard" },
];

for (const t of TOOLS) {
  const T = tool(t.id);
  test.describe(`${t.id}: New and unsaved changes`, () => {
    let errors;
    test.beforeEach(async ({ page }) => {
      test.skip(!toolExists(T), `${T.file} not found in the workspace`);
      ({ errors } = await openTool(page, T));
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await page.waitForFunction((api) => !!window[api], t.api);
    });
    test.afterEach(() => expect(errors).toEqual([]));

    const dialog = (page) => page.locator("dialog.confirm-dialog");
    const unsaved = (page) => page.evaluate((api) => window[api].hasUnsavedChanges(), t.api);

    test("Open… goes straight to the file chooser when nothing is unsaved", async ({ page }) => {
      expect(await unsaved(page)).toBe(false);
      const [chooser] = await Promise.all([page.waitForEvent("filechooser"), page.click('[data-action="importState"]')]);
      expect(chooser).toBeTruthy();
      await expect(dialog(page)).toHaveCount(0);
    });

    test("with unsaved changes Open… asks first: Cancel stops, Don't save opens, Save saves and opens", async ({ page }) => {
      await t.edit(page);
      expect(await unsaved(page)).toBe(true);

      await page.click('[data-action="importState"]');
      await expect(dialog(page)).toContainText("not saved");
      await dialog(page).getByRole("button", { name: "Cancel" }).click();
      await expect(dialog(page)).toHaveCount(0);

      await page.click('[data-action="importState"]');
      const [chooser] = await Promise.all([page.waitForEvent("filechooser"), dialog(page).getByRole("button", { name: "Don't save" }).click()]);
      expect(chooser).toBeTruthy();
      expect(await unsaved(page)).toBe(true); // nothing opened yet

      await page.click('[data-action="importState"]');
      const [download] = await Promise.all([page.waitForEvent("download"), page.waitForEvent("filechooser"), dialog(page).getByRole("button", { name: "Save", exact: true }).click()]);
      expect(download.suggestedFilename()).toMatch(/\.json$/);
      expect(await unsaved(page)).toBe(false);
    });

    test("New asks, replaces the analysis with the example and clears the AI conversation", async ({ page }) => {
      await page.click(".ai-toggle");
      await expect(page.locator(".ai-msg")).not.toHaveCount(0); // the welcome text
      await t.edit(page);

      await page.click(`[data-action="${t.newAction}"]`);
      await dialog(page).getByRole("button", { name: "Cancel" }).click();
      expect(await t.content(page)).not.toBe(t.example);

      await page.click(`[data-action="${t.newAction}"]`);
      await expect(dialog(page)).toContainText("not saved");
      await dialog(page).getByRole("button", { name: "Don't save" }).click();
      await expect.poll(() => t.content(page)).toBe(t.example);
      expect(await unsaved(page)).toBe(false);
      await expect(page.locator(".ai-msg")).toHaveCount(0);

      // With nothing unsaved, New still asks before it replaces the example.
      await page.click(`[data-action="${t.newAction}"]`);
      await expect(dialog(page)).toContainText("small example");
      await dialog(page).getByRole("button", { name: "New", exact: true }).click();
      await expect(dialog(page)).toHaveCount(0);
      expect(await t.content(page)).toBe(t.example);
    });
  });
}

test("hta: the example uses the whole structure, and Ctrl+Z undoes New", async ({ page }) => {
  const T = tool("hta");
  test.skip(!toolExists(T), `${T.file} not found in the workspace`);
  const { errors } = await openTool(page, T);
  const before = await page.evaluate(() => HTAEditor.getState().root.title);
  await page.click('[data-action="newAnalysis"]');
  await page.locator("dialog.confirm-dialog").getByRole("button", { name: "New", exact: true }).click();
  await expect.poll(() => page.evaluate(() => HTAEditor.getState().root.title)).toBe("Reach the overall goal");
  const s = await page.evaluate(() => HTAEditor.getState());
  expect(s.root.children.map((c) => c.id)).toEqual(["1.1", "1.2"]);
  expect(s.root.children[0].children).toHaveLength(2);
  expect(s.meta.columns.filter((c) => c.id !== "taskStep").every((c) => c.description && c.type)).toBe(true);
  expect(s.ttaRecords.filter((r) => r.externalErrorMode)).toHaveLength(1);
  await page.locator("#hierarchy").click({ position: { x: 5, y: 5 } });
  await page.keyboard.press("Control+z");
  await expect.poll(() => page.evaluate(() => HTAEditor.getState().root.title)).toBe(before);
  expect(errors).toEqual([]);
});

test("bowtie: the example uses the whole structure", async ({ page }) => {
  const T = tool("bowtie");
  test.skip(!toolExists(T), `${T.file} not found in the workspace`);
  const { errors } = await openTool(page, T);
  await page.click('[data-action="newDiagram"]');
  await page.locator("dialog.confirm-dialog").getByRole("button", { name: "New", exact: true }).click();
  await expect.poll(() => page.evaluate(() => BowtieEditor.getState().hazard.label)).toBe("Hazard");
  const s = await page.evaluate(() => BowtieEditor.getState());
  expect(s.left.causes.map((c) => c.id)).toEqual(["C1", "C2"]);
  expect(s.right.consequences.map((c) => c.id)).toEqual(["K1", "K2"]);
  expect(s.left.barriers[0]).toMatchObject({ id: "P1", protects: ["id-C1", "id-C2"], strength: "Strong" });
  expect(s.right.barriers[0]).toMatchObject({ id: "R1", protects: ["id-K1"] });
  await expect(page.locator("#c-C2")).toBeVisible();
  expect(errors).toEqual([]);
});
