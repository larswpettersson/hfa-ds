import { test, expect } from "@playwright/test";
import { tool, toolExists } from "../lib/tools.mjs";
import { openTool, setEditor } from "../lib/page.mjs";

// Requirements: STPA-SEL-1..7 and STPA-NAV-1..7 in docs/design-stpa.md.
const T = tool("stpa-workbench");
const node = (page, id) => page.locator(`#diagram g.node[data-sel="${id}"]`);
const ids = (loc) => loc.evaluateAll((els) => [...new Set(els.map((e) => e.dataset.sel))].sort());
const selected = (page) => ids(page.locator("#diagram .sel[data-sel]"));
const indicated = (page) => ids(page.locator("#diagram .ind[data-sel]"));
const hover = async (page, id) => { await node(page, id).scrollIntoViewIfNeeded(); const b = await node(page, id).boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 2 }); };
const activeKey = (page) => page.evaluate(() => document.activeElement?.dataset?.key || null);

// Driver (c1) controls ECU (e1), which controls Brakes (p1); Supervisor (c2) is beside Driver on the top row.
const MODEL = {
  system: "Navigation",
  controllers: [{ id: "c1", name: "Driver" }, { id: "c2", name: "Supervisor" }, { id: "e1", name: "ECU" }],
  controlled_processes: [{ id: "p1", name: "Brakes", states: [] }],
  control_actions: [
    { id: "ca1", source: "c1", target: "e1", action: "Request" },
    { id: "ca2", source: "e1", target: "p1", action: "Brake" },
    { id: "ca3", source: "c2", target: "e1", action: "Supervise" },
  ],
  feedback: [
    { id: "fb1", source: "e1", target: "c1", signal: "Status" },
    { id: "fb2", source: "p1", target: "e1", signal: "Speed" },
    { id: "fb3", source: "e1", target: "c2", signal: "Health" },
  ],
};

test.describe("STPA workbench: selection and arrow navigation", () => {
  let errors;
  test.beforeEach(async ({ page }) => {
    test.skip(!toolExists(T), `${T.file} not found in the workspace`);
    await page.setViewportSize({ width: 1400, height: 900 });
    ({ errors } = await openTool(page, T));
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector("#diagram g.node");
    await setEditor(page, "#editor", MODEL);
    await page.waitForSelector('#diagram g.node[data-sel="e1"]');
    await page.locator("body").click({ position: { x: 5, y: 5 } });
  });
  test.afterEach(() => expect(errors).toEqual([]));

  test("STPA-SEL-1: ett klick markerar ett block", async ({ page }) => {
    await node(page, "c1").click();
    expect(await selected(page)).toEqual(["c1"]);
    expect(await node(page, "c1").locator("rect").first().evaluate((el) => getComputedStyle(el).filter)).toContain("sel-halo");
    await expect(page.locator('#structureWrap tr[data-row="c1"]')).toHaveClass(/selrow/);
    expect(await activeKey(page)).toBeNull(); // no text is edited
  });

  test("STPA-SEL-2: Ctrl/⌘+Enter markerar det indikerade blocket", async ({ page }) => {
    await hover(page, "c1");
    await page.keyboard.press("ControlOrMeta+Enter");
    expect(await selected(page)).toEqual(["c1"]);
    expect(await activeKey(page)).toBeNull();
  });

  test("STPA-SEL-3: Esc i diagrammet tar bort markeringen", async ({ page }) => {
    await node(page, "c1").click();
    await page.keyboard.press("Escape");
    expect(await selected(page)).toEqual([]);
  });

  test("STPA-SEL-4: ett klick utanför tar bort markeringen", async ({ page }) => {
    await node(page, "c1").click();
    await page.locator("#diagram").click({ position: { x: 3, y: 3 } });
    expect(await selected(page)).toEqual([]);
  });

  test("STPA-SEL-5: Shift+klick och Ctrl/⌘+klick väljer flera av samma sort", async ({ page }) => {
    await node(page, "c1").click();
    await node(page, "p1").click({ modifiers: ["Shift"] });
    expect(await selected(page)).toEqual(["c1", "p1"]);
    await node(page, "p1").click({ modifiers: ["ControlOrMeta"] });
    expect(await selected(page)).toEqual(["c1"]);
  });

  test("STPA-SEL-6: ett objekt av en annan sort ersätter markeringen", async ({ page }) => {
    await node(page, "c1").click();
    await page.locator('#diagram text[data-sel="ca2"]').click({ modifiers: ["Shift"] });
    expect(await selected(page)).toEqual(["ca2"]);
  });

  test("STPA-SEL-7: Enter ensam går in i textredigeringsläget och markerar inte", async ({ page }) => {
    await hover(page, "c1");
    await page.keyboard.press("Enter");
    expect(await activeKey(page)).toBe("c1|name");
    expect(await selected(page)).toEqual([]);
  });

  test("STPA-NAV-1: en pil flyttar indikeringen", async ({ page }) => {
    await hover(page, "c1");
    expect(await indicated(page)).toEqual(["c1"]);
    await page.keyboard.press("ArrowDown");
    expect(await indicated(page)).toEqual(["e1"]);
    expect(await selected(page)).toEqual([]);
  });

  test("STPA-NAV-2: objekt på samma rad går först", async ({ page }) => {
    await hover(page, "c1");
    await page.keyboard.press("ArrowRight");
    expect(await indicated(page)).toEqual(["c2"]);
  });

  test("STPA-NAV-3: vid kanten stannar indikeringen", async ({ page }) => {
    await hover(page, "p1");
    await page.keyboard.press("ArrowDown");
    expect(await indicated(page)).toEqual(["p1"]);
  });

  test("STPA-NAV-4: musen tar över indikeringen", async ({ page }) => {
    await hover(page, "c1");
    await page.keyboard.press("ArrowDown");
    expect(await indicated(page)).toEqual(["e1"]);
    await hover(page, "p1");
    expect(await indicated(page)).toEqual(["p1"]);
    await page.keyboard.press("ArrowUp");
    expect(await indicated(page)).toEqual(["e1"]);
  });

  test("STPA-NAV-5: piltangenten tar över från musen", async ({ page }) => {
    await hover(page, "p1");
    await page.keyboard.press("ArrowUp");
    expect(await indicated(page)).toEqual(["e1"]);
  });

  test("STPA-NAV-6: bara verklig musrörelse räknas", async ({ page }) => {
    await hover(page, "c1");
    await page.keyboard.press("ArrowDown");
    await node(page, "p1").dispatchEvent("mouseover"); // what a scroll under a still pointer produces
    expect(await indicated(page)).toEqual(["e1"]);
  });

  test("STPA-NAV-7: pilar markerar inte, och Ctrl/⌘+pil används inte", async ({ page }) => {
    await node(page, "c1").click();
    await page.keyboard.press("ArrowDown");
    expect(await indicated(page)).toEqual(["e1"]);
    expect(await selected(page)).toEqual(["c1"]);
    await page.keyboard.press("ControlOrMeta+ArrowDown");
    expect(await indicated(page)).toEqual(["e1"]);
  });
});
