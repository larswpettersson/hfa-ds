import { test, expect } from "@playwright/test";
import { tool, toolExists } from "../lib/tools.mjs";
import { openTool } from "../lib/page.mjs";

// Requirements: BOWTIE-KEYS-1 to 6 in docs/design-bowtie.md and 5.12 of the design principles.
// Runs in Chromium (Chrome and Edge), WebKit (Safari) and Firefox. The operating system (Windows, macOS, Linux) is simulated by
// the events it sends: on macOS Option+digit gives another character in `key` but the same `code`; AltGr on Windows and Linux
// arrives as Ctrl+Alt. Keys the browser itself takes before the page sees them (tab switching) cannot be tested here; see 5.12.
const T = tool("bowtie");
const protects = (page, id) => page.evaluate((id) => BowtieEditor.getState().left.barriers.find((b) => b.id === id).protects, id);

/** Dispatch a key event the way an operating system would, and report whether the page called preventDefault. */
const key = (page, type, init) => page.evaluate(([type, init]) => {
  const e = new KeyboardEvent(type, { bubbles: true, cancelable: true, ...init });
  document.body.dispatchEvent(e);
  return e.defaultPrevented;
}, [type, init]);
const chord = async (page, digits, { alt = "Alt", digitKey = (d) => d } = {}) => {
  await key(page, "keydown", { key: "Alt", code: "AltLeft", altKey: true });
  for (const d of digits) {
    await key(page, "keydown", { key: digitKey(d), code: `Digit${d}`, altKey: true });
    await key(page, "keyup", { key: digitKey(d), code: `Digit${d}`, altKey: true });
  }
  return key(page, "keyup", { key: "Alt", code: "AltLeft" });
};

test.describe("Bowtie: Alt+digits in every browser", () => {
  let errors;
  test.beforeEach(async ({ page }) => {
    test.skip(!toolExists(T), `${T.file} not found in the workspace`);
    await page.setViewportSize({ width: 2100, height: 1000 });
    ({ errors } = await openTool(page, T));
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector("#b-p4");
    for (let i = 0; i < 9; i++) await page.click('[data-action="addCause"]');
    await page.evaluate(() => document.activeElement?.blur());
    await page.locator("#b-p3").click({ position: { x: 3, y: 3 } });
  });
  test.afterEach(() => expect(errors).toEqual([]));

  test("BOWTIE-KEYS-1: Alt+1+2 links number 12 with real key presses", async ({ page }) => {
    await page.keyboard.down("Alt");
    await page.keyboard.press("Digit1");
    await page.keyboard.press("Digit2");
    await page.keyboard.up("Alt");
    expect(await protects(page, "P3")).toContain("id-C12");
  });

  test("BOWTIE-KEYS-2: macOS: Option gives other characters in key, and code still decides", async ({ page }) => {
    const mac = { 1: "¡", 2: "™" }; // Option+1 and Option+2 on a US Mac keyboard
    await chord(page, "12", { digitKey: (d) => mac[d] });
    expect(await protects(page, "P3")).toContain("id-C12");
  });

  test("BOWTIE-KEYS-3: the number pad works too", async ({ page }) => {
    await key(page, "keydown", { key: "Alt", code: "AltLeft", altKey: true });
    for (const d of "12") { await key(page, "keydown", { key: d, code: `Numpad${d}`, altKey: true }); await key(page, "keyup", { key: d, code: `Numpad${d}`, altKey: true }); }
    await key(page, "keyup", { key: "Alt", code: "AltLeft" });
    expect(await protects(page, "P3")).toContain("id-C12");
  });

  test("BOWTIE-KEYS-4: the page takes Alt+digit in link mode (so the browser's tab switch does not run) and Alt's release (no menu bar)", async ({ page }) => {
    await key(page, "keydown", { key: "Alt", code: "AltLeft", altKey: true });
    expect(await key(page, "keydown", { key: "1", code: "Digit1", altKey: true })).toBe(true);
    await key(page, "keyup", { key: "1", code: "Digit1", altKey: true });
    expect(await key(page, "keyup", { key: "Alt", code: "AltLeft" })).toBe(true);
  });

  test("BOWTIE-KEYS-5: the browser's own shortcuts are left alone: Ctrl/⌘+digit, Ctrl+Alt+digit (AltGr), Alt+Shift+digit", async ({ page }) => {
    const before = await protects(page, "P3");
    for (const mods of [{ ctrlKey: true }, { metaKey: true }, { ctrlKey: true, altKey: true }, { altKey: true, shiftKey: true }, { ctrlKey: true, shiftKey: true }]) {
      expect(await key(page, "keydown", { key: "1", code: "Digit1", ...mods }), JSON.stringify(mods)).toBe(false);
      await key(page, "keyup", { key: "1", code: "Digit1", ...mods });
    }
    await key(page, "keyup", { key: "Alt", code: "AltLeft" });
    expect(await protects(page, "P3")).toEqual(before);
  });

  test("BOWTIE-KEYS-6: outside link mode Alt+digit and a lone Alt are not touched", async ({ page }) => {
    await page.keyboard.press("Escape"); // leaves link mode
    expect(await key(page, "keydown", { key: "1", code: "Digit1", altKey: true })).toBe(false);
    expect(await key(page, "keyup", { key: "Alt", code: "AltLeft" })).toBe(false);
  });

  test("BOWTIE-KEYS-7: Alt+arrow still moves the barrier, and the page takes it from the browser's back/forward", async ({ page }) => {
    const col = () => page.evaluate(() => BowtieEditor.getState().left.barriers.find((b) => b.id === "P3").col);
    const was = await col();
    expect(await key(page, "keydown", { key: "ArrowLeft", code: "ArrowLeft", altKey: true })).toBe(true);
    expect(await col()).toBeLessThanOrEqual(was);
  });
});
