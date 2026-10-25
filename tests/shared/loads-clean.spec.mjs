import { test, expect } from "@playwright/test";
import { TOOLS, toolExists } from "../lib/tools.mjs";
import { openTool } from "../lib/page.mjs";

for (const t of TOOLS) {
  test(`${t.id}: loads without console errors`, async ({ page }) => {
    test.skip(!toolExists(t), `${t.file} not found in the workspace`);
    const { errors } = await openTool(page, t);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).not.toBeEmpty();
    expect(errors).toEqual([]);
  });
}
