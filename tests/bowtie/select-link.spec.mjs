import { test, expect } from "@playwright/test";
import { tool, toolExists } from "../lib/tools.mjs";
import { openTool } from "../lib/page.mjs";

// A click selects a block, not its text; Enter edits the text; ids cannot be edited; arrows move what is selected;
// causes numbered above 9 are linked with Alt+digits; the viewable text is capped at 100 characters.
const T = tool("bowtie");
const press = async (page, ...ks) => { for (const k of ks) await page.keyboard.press(k); };
const protects = (page, id) => page.evaluate((id) => BowtieEditor.getState().left.barriers.find((b) => b.id === id).protects, id);

test.describe("Bowtie: select, edit, move and link", () => {
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

  test("a click on the text of a cause selects the cause and does not enter the text", async ({ page }) => {
    await page.locator("#c-C2 .desc-text").click();
    await expect(page.locator("#c-C2")).toHaveClass(/is-selected/);
    expect(await page.evaluate(() => document.activeElement?.isContentEditable ?? false)).toBe(false);
  });

  test("a click on the text of the top event or a barrier selects it", async ({ page }) => {
    await page.locator(".top-event .desc-text").click();
    await expect(page.locator(".top-event")).toHaveClass(/is-selected/);
    await page.locator("#b-p2 .desc-text").click();
    await expect(page.locator("#b-p2")).toHaveClass(/is-selected/);
  });

  test("Enter edits the text of the selected block; an id cannot be edited", async ({ page }) => {
    await page.locator("#c-C2 .id-tag").click();
    await expect(page.locator("#c-C2")).toHaveClass(/is-selected/);
    expect(await page.locator("#c-C2 .id-tag").getAttribute("contenteditable")).toBeNull();
    await press(page, "Enter");
    expect(await page.evaluate(() => document.activeElement?.dataset.role)).toBe("description");
    await press(page, "ControlOrMeta+a");
    await page.keyboard.type("Ny text");
    await press(page, "Enter");
    expect(await page.evaluate(() => BowtieEditor.getState().left.causes.find((c) => c.id === "C2").description)).toBe("Ny text");
  });

  test("the arrow keys move a selected cause up and down and a selected barrier left and right", async ({ page }) => {
    const order = () => page.evaluate(() => BowtieEditor.getState().left.causes.sort((a, b) => a.row - b.row).map((c) => c.id));
    const before = await order();
    await page.locator("#c-C2 .desc-text").click();
    await press(page, "ArrowDown");
    expect((await order()).indexOf(before[1])).toBe(2);
    await press(page, "ArrowLeft"); // a cause cannot move sideways
    expect((await order()).indexOf(before[1])).toBe(2);

    const col = () => page.evaluate(() => BowtieEditor.getState().left.barriers.find((b) => b.id === "P4").col);
    const was = await col();
    await page.locator("#b-p4").click({ position: { x: 3, y: 3 } });
    await press(page, "ArrowLeft");
    expect(await col()).toBeLessThan(was);
  });

  test("the viewable text is capped at 100 characters and three dots show it", async ({ page }) => {
    const long = "x".repeat(150);
    await page.locator(".top-event .desc-text").click();
    await press(page, "Enter");
    await press(page, "ControlOrMeta+a");
    await page.keyboard.type(long);
    await press(page, "Enter");
    const shown = await page.locator(".top-event .desc-text").textContent();
    expect(shown).toBe("x".repeat(100) + "...");
  });

  test("causes above 9 are linked with Alt+digits; the bar lists the linked ids", async ({ page }) => {
    for (let i = 0; i < 9; i++) await page.click('[data-action="addCause"]');
    await page.evaluate(() => document.activeElement?.blur());
    const ids = await page.evaluate(() => BowtieEditor.getState().left.causes.sort((a, b) => a.row - b.row).map((c) => c.id));
    expect(ids.length).toBeGreaterThanOrEqual(12);
    await page.locator("#b-p3").click({ position: { x: 3, y: 3 } });
    await press(page, "Alt+Digit1");
    await page.keyboard.down("Alt");
    await page.keyboard.down("Digit1");
    await page.keyboard.up("Digit1");
    await page.keyboard.down("Digit2");
    await page.keyboard.up("Digit2");
    await expect(page.locator("#linkBar")).toContainText("Alt+1+2");
    await page.keyboard.up("Alt");
    const linked = await protects(page, "P3");
    expect(linked.some((t) => t === "id-C12")).toBe(true);
    await expect(page.locator("#linkBar")).toContainText("C12");
    await page.keyboard.press("Digit3");
    await expect(page.locator("#linkBar")).toContainText("C3");
  });
});
