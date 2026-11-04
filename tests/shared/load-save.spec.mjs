import { test, expect } from "@playwright/test";
import { tool, toolExists } from "../lib/tools.mjs";
import { openTool } from "../lib/page.mjs";

// The analysis file is handled with Load… and Save… in every tool: design principles 4.4.
for (const id of ["hta", "bowtie"]) {
  const T = tool(id);
  test(`${id}: Load… and Save… handle the analysis file, with no Import or Export buttons`, async ({ page }) => {
    test.skip(!toolExists(T), `${T.file} not found in the workspace`);
    const { errors } = await openTool(page, T);
    await expect(page.locator('[data-action="importState"]')).toHaveText("Load…");
    await expect(page.locator('[data-action="exportState"]')).toHaveText("Save…");
    // Exports to other formats (Export CSV, Export .md) keep their names.
    const names = await page.locator("button").evaluateAll((bs) => bs.map((b) => b.textContent.trim()));
    expect(names.filter((n) => /^(Import|Export)…?$/.test(n))).toEqual([]);

    // Save… downloads the analysis as JSON.
    const [download] = await Promise.all([page.waitForEvent("download"), page.click('[data-action="exportState"]')]);
    expect(download.suggestedFilename()).toMatch(/\.json$/);
    expect(errors).toEqual([]);
  });
}
