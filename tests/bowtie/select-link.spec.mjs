import { test, expect } from "@playwright/test";
import { tool, toolExists } from "../lib/tools.mjs";
import { openTool } from "../lib/page.mjs";

// Requirements: BOWTIE-SEL-3..5, BOWTIE-NAV-10, BOWTIE-TEXT-1 and BOWTIE-LINK-1..3 in docs/design-bowtie.md (5.11, 5.6 of the design principles).
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

  test("BOWTIE-SEL-3: a click on the text of a cause selects the cause and does not enter the text", async ({ page }) => {
    await page.locator("#c-C2 .desc-text").click();
    await expect(page.locator("#c-C2")).toHaveClass(/is-selected/);
    expect(await page.evaluate(() => document.activeElement?.isContentEditable ?? false)).toBe(false);
  });

  test("BOWTIE-SEL-4: a click on the text of the top event or a barrier selects it", async ({ page }) => {
    await page.locator(".top-event .desc-text").click();
    await expect(page.locator(".top-event")).toHaveClass(/is-selected/);
    await page.locator("#b-p2 .desc-text").click();
    await expect(page.locator("#b-p2")).toHaveClass(/is-selected/);
  });

  test("BOWTIE-SEL-5: Enter edits the text of the selected block; an id cannot be edited", async ({ page }) => {
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

  test("BOWTIE-NAV-10: the arrow keys move a selected cause up and down and a selected barrier left and right", async ({ page }) => {
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

  test("BOWTIE-TEXT-1: the viewable text is capped at 100 characters and three dots show it", async ({ page }) => {
    const long = "x".repeat(150);
    await page.locator(".top-event .desc-text").click();
    await press(page, "Enter");
    await press(page, "ControlOrMeta+a");
    await page.keyboard.type(long);
    await press(page, "Enter");
    const shown = await page.locator(".top-event .desc-text").textContent();
    expect(shown).toBe("x".repeat(100) + "...");
  });

  const manyCauses = async (page) => {
    for (let i = 0; i < 9; i++) await page.click('[data-action="addCause"]');
    await page.evaluate(() => document.activeElement?.blur());
    await page.locator("#b-p3").click({ position: { x: 3, y: 3 } });
  };

  test("BOWTIE-LINK-1: a cause above 9 is linked with Alt+digits typed while Alt is held", async ({ page }) => {
    await manyCauses(page);
    await page.keyboard.down("Alt");
    await page.keyboard.down("Digit1");
    await page.keyboard.up("Digit1");
    await page.keyboard.down("Digit2");
    await page.keyboard.up("Digit2");
    await expect(page.locator("#linkBar")).toContainText("Alt+1+2"); // the number so far is shown
    await page.keyboard.up("Alt");
    expect(await protects(page, "P3")).toContain("id-C12");
    await page.keyboard.press("Alt+Digit1"); // a single digit with Alt links number 1
    await page.keyboard.down("Alt"); await page.keyboard.down("Digit1"); await page.keyboard.up("Digit1"); await page.keyboard.down("Digit2");
    await page.keyboard.up("Digit2"); await page.keyboard.up("Alt"); // the same number again unlinks it
    expect(await protects(page, "P3")).not.toContain("id-C12");
  });

  test("BOWTIE-LINK-2: the digits 1–9 link the cause whose id ends in that number, not the row", async ({ page }) => {
    await manyCauses(page);
    await page.evaluate(() => { const s = BowtieEditor.getState(); const c = s.left.causes.find((c) => c.id === "C3"); c.row = 1; s.left.causes.filter((x) => x !== c).sort((a, b) => a.row - b.row).forEach((x, i) => { x.row = i + 2; }); });
    await page.keyboard.press("Digit3");
    expect(await protects(page, "P3")).toContain("id-C3");
  });

  test("BOWTIE-LINK-3: a bar lists the ids of what the selected barrier protects", async ({ page }) => {
    await manyCauses(page);
    const bar = page.locator("#linkBar");
    await expect(bar).toBeVisible();
    await expect(bar).toContainText("P3 protects causes:");
    await expect(bar).toContainText("causes: C4"); // P3 protects C4 in the example
    await page.keyboard.press("Digit3");
    await expect(bar).toContainText("C3, C4");
    await page.keyboard.press("Escape");
    await expect(bar).toBeHidden();
  });
});
