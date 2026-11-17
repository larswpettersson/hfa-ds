import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { tool, toolExists, WORKSPACE } from "../lib/tools.mjs";
import { openTool } from "../lib/page.mjs";

// HFA Hub is the start page of the tools: one file that lists them and opens them through relative links, so that it
// works on GitHub Pages and from file:// with the tool repos next to it.
const T = tool("hub");
const LINKS = {
  hta: ["hfa-hta/HTA.html", "hfa-hta/hta_offline.html"],
  bowtie: ["hfa-bowtie/Bowtie.html", "hfa-bowtie/Bowtie_offline.html"],
  stpa: ["hfa-stpa/workbench/index.html", "hfa-stpa/workbench/stpa_offline.html"],
};

test.describe("hub", () => {
  test.beforeEach(() => test.skip(!toolExists(T), `${T.file} not found in the workspace`));

  test("starts with everything but local files blocked", async ({ page }) => {
    const attempted = [], errors = [];
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
    await page.route((url) => !/^(file|data|blob):$/.test(url.protocol), (route) => { attempted.push(route.request().url()); route.abort(); });
    await page.goto(pathToFileURL(T.path).href);
    await page.waitForSelector(".tool");
    await page.waitForTimeout(500);
    expect(attempted, "the page asked for something outside local files").toEqual([]);
    expect(errors).toEqual([]);
  });

  test("each runnable tool has a card that opens the tool and a button for its one-file version; RBD is listed without a link", async ({ page }) => {
    await openTool(page, T);
    for (const [id, [main, offline]] of Object.entries(LINKS)) {
      const card = page.locator(`.tool[data-tool="${id}"]`);
      const resolved = (loc) => loc.evaluate((a) => a.href);
      expect(await resolved(card.locator("h2 a"))).toBe(pathToFileURL(path.join(WORKSPACE, main)).href);
      expect(await resolved(card.getByRole("link", { name: "One-file version" }))).toBe(pathToFileURL(path.join(WORKSPACE, offline)).href);
      for (const f of [main, offline]) if (fs.existsSync(path.join(WORKSPACE, path.dirname(main).split("/")[0]))) expect(fs.existsSync(path.join(WORKSPACE, f)), `${f} exists`).toBe(true);
      await expect(card.locator(".pill")).toHaveText("Under development");
    }
    const rbd = page.locator('.tool[data-tool="rbd"]');
    await expect(rbd.locator("a")).toHaveCount(0);
    await expect(rbd.locator(".pill")).toHaveText("Not runnable yet");
  });

  test("a click anywhere on a card opens the tool", async ({ page }) => {
    test.skip(!fs.existsSync(path.join(WORKSPACE, LINKS.bowtie[0])), "hfa-bowtie not found in the workspace");
    await openTool(page, T);
    const b = await page.locator('.tool[data-tool="bowtie"] .what').boundingBox(); // the title's link lies over the whole card
    await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
    await expect(page).toHaveURL(pathToFileURL(path.join(WORKSPACE, LINKS.bowtie[0])).href);
  });

  test("text uses only the sizes 12, 14, 16 and 20 px and the weights 400 and 700 (design principles 2.3)", async ({ page }) => {
    await openTool(page, T);
    const used = await page.evaluate(() => {
      const sizes = new Set(), weights = new Set();
      for (const e of document.querySelectorAll("body *")) {
        if (![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
        const cs = getComputedStyle(e); sizes.add(cs.fontSize); weights.add(cs.fontWeight);
      }
      return { sizes: [...sizes].sort(), weights: [...weights].sort() };
    });
    expect(used.sizes).toEqual(["12px", "14px", "16px", "20px"]);
    expect(used.weights).toEqual(["400", "700"]);
  });

  test("the theme is remembered", async ({ page }) => {
    await openTool(page, T);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.click(".theme-toggle");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator(".theme-toggle")).toHaveAttribute("aria-checked", "true");
  });
});
