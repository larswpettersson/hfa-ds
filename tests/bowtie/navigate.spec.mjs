import { test, expect } from "@playwright/test";
import { tool, toolExists } from "../lib/tools.mjs";
import { openTool } from "../lib/page.mjs";

// Requirements: BOWTIE-NAV-1..9 and BOWTIE-SEL-1, 2 in docs/design-bowtie.md (5.2 to 5.6 of the design principles).
const T = tool("bowtie");
const ids = (loc) => loc.evaluateAll((els) => [...new Set(els.map((e) => e.id || e.dataset.barrierId || e.className.split(" ")[0]))].sort());
const indicated = (page) => ids(page.locator(".is-keyboard-hover"));
const hover = async (page, sel) => { const l = page.locator(sel).first(); await l.scrollIntoViewIfNeeded(); const b = await l.boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 2 }); };
const press = async (page, ...ks) => { for (const k of ks) await page.keyboard.press(k); };

test.describe("Bowtie: indication, selection and arrow navigation", () => {
  let errors;
  test.beforeEach(async ({ page }) => {
    test.skip(!toolExists(T), `${T.file} not found in the workspace`);
    await page.setViewportSize({ width: 2100, height: 1000 });
    ({ errors } = await openTool(page, T));
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector("#b-p4");
    await page.mouse.move(2, 2);
  });
  test.afterEach(() => expect(errors).toEqual([]));

  test("BOWTIE-NAV-1: en pil flyttar indikeringen", async ({ page }) => {
    await hover(page, ".top-event");
    expect(await indicated(page)).toEqual(["top-event"]);
    await press(page, "ArrowRight");
    const now = await indicated(page);
    expect(now).toHaveLength(1);
    expect(now).not.toEqual(["top-event"]);
    await expect(page.locator("#zone-right .is-keyboard-hover")).not.toHaveCount(0); // to the right of the top event
    expect(await page.evaluate(() => BowtieEditor.getSelection())).toMatchObject({ ids: [], barrierIds: [] });
  });

  test("BOWTIE-NAV-2: objekt på samma rad går först", async ({ page }) => {
    await hover(page, "#c-C1");
    await press(page, "ArrowRight");
    await expect(page.locator("#zone-left .barrier.is-keyboard-hover").first()).toBeVisible(); // a barrier on C1's row, not a cause below
  });

  test("BOWTIE-NAV-3: vid kanten stannar indikeringen", async ({ page }) => {
    await hover(page, "#c-K3");
    await press(page, "ArrowDown");
    expect(await indicated(page)).toEqual(["c-K3"]);
    await press(page, "ArrowRight");
    expect(await indicated(page)).toEqual(["c-K3"]);
  });

  test("BOWTIE-NAV-4: musen tar över indikeringen", async ({ page }) => {
    await hover(page, "#c-C1");
    await press(page, "ArrowDown");
    const first = await indicated(page);
    await hover(page, "#c-K2");
    expect(await indicated(page)).toEqual(["c-K2"]);
    await press(page, "ArrowUp");
    expect(await indicated(page)).not.toEqual(first);
    expect(await indicated(page)).not.toEqual(["c-K2"]);
  });

  test("BOWTIE-NAV-5: piltangenten tar över från musen", async ({ page }) => {
    await hover(page, "#c-C1");
    await press(page, "ArrowDown");
    expect(await indicated(page)).toHaveLength(1);
    expect(await indicated(page)).not.toEqual(["c-C1"]);
  });

  test("BOWTIE-NAV-6: bara verklig musrörelse räknas", async ({ page }) => {
    await hover(page, "#c-C1");
    await press(page, "ArrowDown");
    const before = await indicated(page);
    await page.locator("#c-K2").dispatchEvent("mouseover");
    expect(await indicated(page)).toEqual(before);
  });

  test("BOWTIE-NAV-7: pilar markerar inte, och Ctrl/⌘+pil används inte", async ({ page }) => {
    await page.locator("#c-C2").click({ position: { x: 3, y: 3 } });
    await expect(page.locator("#c-C2")).toHaveClass(/is-selected/);
    await press(page, "ArrowDown");
    await expect(page.locator("#c-C2")).toHaveClass(/is-selected/);
    const was = await indicated(page);
    await press(page, "ControlOrMeta+ArrowRight");
    expect(await indicated(page)).toEqual(was);
  });

  test("BOWTIE-NAV-8: Alt/Option+pil flyttar de markerade barriärerna", async ({ page }) => {
    const col = () => page.evaluate(() => BowtieEditor.getState().left.barriers.find((b) => b.id === "P4").col);
    const before = await col();
    await page.locator("#b-p4").click({ position: { x: 3, y: 3 }, modifiers: ["Shift"] });
    await page.evaluate(() => document.activeElement?.blur());
    await press(page, "ArrowLeft");
    expect(await col()).toBe(before); // a plain arrow never moves
    await press(page, "Alt+ArrowLeft");
    expect(await col()).toBeLessThan(before);
  });

  test("BOWTIE-NAV-9: Alt/Option+pil flyttar det markerade kortet en rad", async ({ page }) => {
    const order = () => page.evaluate(() => BowtieEditor.getState().left.causes.sort((a, b) => a.row - b.row).map((c) => c.id));
    const before = await order();
    await page.locator("#c-C2").click({ position: { x: 3, y: 3 } });
    await page.evaluate(() => document.activeElement?.blur());
    await press(page, "Alt+ArrowDown");
    const after = await order();
    expect(after).not.toEqual(before);
    expect(after.indexOf(before[1])).toBe(2);
  });

  test("BOWTIE-SEL-1: Ctrl/⌘+Enter markerar det indikerade objektet", async ({ page }) => {
    await hover(page, "#c-C3");
    await press(page, "ControlOrMeta+Enter");
    await expect(page.locator("#c-C3")).toHaveClass(/is-selected/);
  });

  test("BOWTIE-SEL-2: Enter ensam går in i textredigeringsläget och markerar inte", async ({ page }) => {
    await hover(page, "#c-C3");
    await press(page, "Enter");
    expect(await page.evaluate(() => document.activeElement?.isContentEditable)).toBe(true);
    await expect(page.locator("#c-C3")).not.toHaveClass(/is-selected/);
  });
});
