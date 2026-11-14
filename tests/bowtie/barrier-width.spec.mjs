import { test, expect } from "@playwright/test";
import { tool, toolExists } from "../lib/tools.mjs";
import { openTool } from "../lib/page.mjs";

// A barrier is as wide as the longest word in its description, between 6 and 12 characters (docs/design-bowtie.md, BOWTIE-WIDTH).
const T = tool("bowtie");

/** Width of a barrier, its min and max width, and the width its longest word asks for (word + side padding + border). */
const measure = (page, id) => page.evaluate((id) => {
  const el = document.getElementById(`b-${id}`);
  const desc = el.querySelector(".desc-text");
  const cs = getComputedStyle(el);
  const ds = getComputedStyle(desc);
  const cv = document.createElement("canvas").getContext("2d");
  cv.font = `${ds.fontWeight} ${ds.fontSize} ${ds.fontFamily}`;
  const word = Math.max(...(desc.dataset.full || "").split(/\s+/).map((w) => cv.measureText(w).width));
  const px = (v) => parseFloat(v) || 0;
  const frame = px(cs.paddingLeft) + px(cs.paddingRight) + px(cs.borderLeftWidth) + px(cs.borderRightWidth);
  return { width: el.getBoundingClientRect().width, min: px(cs.minWidth), max: px(cs.maxWidth), wanted: word + frame,
    overflows: desc.scrollWidth > desc.clientWidth + 1 };
}, id);
const type = async (page, id, text) => {
  await page.locator(`#b-${id} .desc-text`).click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type(text);
};
const describe = async (page, id, text) => { await type(page, id, text); await page.evaluate(() => document.activeElement?.blur()); };

test.describe("Bowtie: the width of a barrier", () => {
  let errors;
  test.beforeEach(async ({ page }) => {
    test.skip(!toolExists(T), `${T.file} not found in the workspace`);
    await page.setViewportSize({ width: 1700, height: 900 });
    ({ errors } = await openTool(page, T));
    await page.waitForSelector("#b-p4"); // P4 is alone in its column
  });
  test.afterEach(() => expect(errors).toEqual([]));

  test("BOWTIE-WIDTH-1: the width follows the longest word", async ({ page }) => {
    await describe(page, "p4", "Backventil på ledning");
    const m = await measure(page, "p4");
    expect(Math.abs(m.width - m.wanted)).toBeLessThan(1.5);
    expect(m.width).toBeGreaterThan(m.min + 1);
    expect(m.width).toBeLessThan(m.max - 1);
  });

  test("BOWTIE-WIDTH-2: short words give the minimum width", async ({ page }) => {
    await describe(page, "p4", "Lås på lucka");
    const m = await measure(page, "p4");
    expect(m.wanted).toBeLessThan(m.min);
    expect(Math.abs(m.width - m.min)).toBeLessThan(0.5);
  });

  test("BOWTIE-WIDTH-3: a word longer than the maximum width is broken", async ({ page }) => {
    await describe(page, "p4", "Skydd vid extremvädersförhållanden");
    const m = await measure(page, "p4");
    expect(m.wanted).toBeGreaterThan(m.max);
    expect(Math.abs(m.width - m.max)).toBeLessThan(0.5);
    expect(m.overflows).toBe(false);
  });

  test("BOWTIE-WIDTH-4: a column is as wide as its widest barrier", async ({ page }) => {
    await describe(page, "p2", "Vakt vid port");
    const [p1, p2, p3] = [await measure(page, "p1"), await measure(page, "p2"), await measure(page, "p3")];
    expect(p2.wanted).toBeLessThan(p2.min); // alone it would have the minimum width
    expect(p1.wanted).toBeGreaterThan(p1.max);
    expect(Math.abs(p2.width - p1.width)).toBeLessThan(0.5);
    expect(Math.abs(p3.width - p1.width)).toBeLessThan(0.5);
  });

  test("BOWTIE-WIDTH-5: the width and the connectors follow while the user types", async ({ page }) => {
    await describe(page, "p4", "Lås på lucka");
    await type(page, "p4", "Hastighetsövervakning"); // the field keeps focus
    await expect.poll(async () => { const m = await measure(page, "p4"); return Math.abs(m.width - m.max) < 0.5; }).toBe(true);
    // The connectors are already where a full recalculation (as on a window resize) puts them.
    const lines = () => page.evaluate(() => [...document.querySelectorAll(".bowtie svg line")]
      .map((l) => ["x1", "y1", "x2", "y2"].map((a) => Math.round(Number(l.getAttribute(a)))).join(",")));
    await expect.poll(async () => {
      const shown = await lines();
      await page.evaluate(() => window.dispatchEvent(new Event("resize")));
      return JSON.stringify(await lines()) === JSON.stringify(shown);
    }).toBe(true);
    const before = await lines();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type("Lås"); // back to the minimum width: the columns move again
    await expect.poll(async () => JSON.stringify(await lines()) !== JSON.stringify(before)).toBe(true);
  });
});
