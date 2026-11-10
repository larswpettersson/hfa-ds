import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TOOLS, toolExists } from "../lib/tools.mjs";
import { openTool } from "../lib/page.mjs";

/* Every tool sets its text in the font of the token font.family.base (Open Sans, Arial, sans-serif), also in buttons,
   fields and the AI panel, and its code in font.family.mono. */
const tokens = JSON.parse(fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../tokens.json"), "utf8"));
const base = tokens["mode/light"]["font.family.base"].$value;
const family = (list) => list.map((f) => (/\s/.test(f) ? `"${f}"` : f)).join(", ");

for (const t of TOOLS.filter((x) => ["stpa-workbench", "hta", "bowtie"].includes(x.id))) {
  test(`${t.id}: text is set in the token font`, async ({ page }) => {
    test.skip(!toolExists(t), `${t.file} not found in the workspace`);
    await openTool(page, t);
    await page.waitForTimeout(400);
    const fonts = await page.evaluate(() => {
      const f = (sel) => { const el = [...document.querySelectorAll(sel)].find((e) => e.offsetParent !== null); return el ? getComputedStyle(el).fontFamily : null; };
      return { body: f("body"), button: f("button"), field: f("textarea, input[type=text], select"), ai: f(".ai-panel") };
    });
    for (const [where, value] of Object.entries(fonts)) {
      if (value === null) continue;
      expect(value, `${t.id}: ${where}`).toBe(family(base));
    }
  });
}
