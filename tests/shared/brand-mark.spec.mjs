import { test, expect } from "@playwright/test";
import { tool, toolExists } from "../lib/tools.mjs";
import { openTool } from "../lib/page.mjs";

// The title bar of every tool starts with the red brand square, and the commands follow it from the left; only the theme switch is at the right.
for (const id of ["stpa-workbench", "hta", "bowtie"]) {
  const T = tool(id);
  test(`${id}: red brand square and left-aligned commands`, async ({ page }) => {
    test.skip(!toolExists(T), `${T.file} not found in the workspace`);
    await openTool(page, T);
    const mark = page.locator(".mark").first();
    await expect(mark).toBeVisible();
    expect(await mark.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe("rgb(215, 0, 0)");
    const title = await page.locator(".mark").first().evaluate((e) => e.closest("h1").getBoundingClientRect().right);
    const open = await page.getByRole("button", { name: "New", exact: true }).first().boundingBox();
    expect(open.x - title).toBeLessThan(40);
  });
}
