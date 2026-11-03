import { test, expect } from "@playwright/test";
import { tool, toolExists } from "../lib/tools.mjs";
import { openTool } from "../lib/page.mjs";

// ✕ at the end of a TTA row: design principles 4.2.
const T = tool("hta");

const rows = (page) => page.evaluate(() => HTAEditor.getState().ttaRecords);
const rowDel = (page, id) => page.locator(`#ttaTbody tr[data-record-id="${id}"] .tta-row-del`);

test.describe("HTA: deleting TTA rows", () => {
  let errors;
  test.beforeEach(async ({ page }) => {
    test.skip(!toolExists(T), `${T.file} not found in the workspace`);
    ({ errors } = await openTool(page, T));
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector("#ttaTbody tr");
  });
  test.afterEach(() => expect(errors).toEqual([]));

  test("every row ends with a ✕ button, visible without hovering", async ({ page }) => {
    const n = await page.locator("#ttaTbody tr").count();
    await expect(page.locator("#ttaTbody .tta-row-del")).toHaveCount(n);
    await expect(rowDel(page, "r2")).toBeVisible();
  });

  test("✕ deletes a row without asking; Ctrl+Z brings it back", async ({ page }) => {
    // Task 1.1 has two rows (r1, r2) in the sample.
    await expect(rowDel(page, "r2")).toHaveAttribute("title", /^Delete this row of 1\.1/);
    page.on("dialog", (d) => { throw new Error("unexpected dialog: " + d.message()); });
    await rowDel(page, "r2").click();
    expect((await rows(page)).map((r) => r.id)).not.toContain("r2");
    await expect(page.locator("#statusMessage")).toContainText("Row deleted");
    await expect(rowDel(page, "r1")).toHaveAttribute("title", /^Clear this row/); // now 1.1's only row

    await page.locator("#hierarchy").click({ position: { x: 5, y: 5 } });
    await page.keyboard.press("Control+z");
    expect((await rows(page)).map((r) => r.id)).toContain("r2");
  });

  test("a task's only row is cleared, not deleted", async ({ page }) => {
    // Task 1.2 has one row (r3).
    await expect(rowDel(page, "r3")).toHaveAttribute("title", /^Clear this row/);
    await expect(rowDel(page, "r3")).toHaveAttribute("aria-label", /^Clear row/);
    await rowDel(page, "r3").click();
    const r3 = (await rows(page)).find((r) => r.id === "r3");
    expect(r3).toMatchObject({ taskId: "1.2", externalErrorMode: "", recovery: "", psf: [] });
    await expect(page.locator("#statusMessage")).toContainText("Row cleared");
  });

  test("✕ works from the keyboard and does not select the task", async ({ page }) => {
    await rowDel(page, "r2").focus();
    await page.keyboard.press("Enter");
    expect((await rows(page)).map((r) => r.id)).not.toContain("r2");
    await expect(page.locator(".task.selected")).toHaveCount(0);
    await expect(page.locator("#ttaTbody tr.is-selected")).toHaveCount(0);
  });
});
