import { test, expect } from "@playwright/test";
import { tool, toolExists } from "../lib/tools.mjs";
import { openTool, setEditor, getEditorJson } from "../lib/page.mjs";

// Requirements: STPA-ADD-1, 2, 5, 8, 9, 10 and STPA-TYPE-1 in docs/design-stpa.md (Add Below only).
// The test name starts with the scenario id; the shared id check reads it from there.
// The tests are written before the feature: they fail until Add Below is built.

const T = tool("stpa-workbench");
const json = (page) => getEditorJson(page, "#editor");
const node = (page, id) => page.locator(`#diagram g.node[data-sel="${id}"]`);
const selected = (page) => page.locator("#diagram .sel[data-sel]").evaluateAll((els) => [...new Set(els.map((e) => e.dataset.sel))].sort());
const focusedKey = (page) => page.evaluate(() => document.activeElement?.dataset?.key || null);
const addBelow = (page) => page.getByRole("button", { name: /^Add Below/ });

const MODEL = {
  system: "Add Below",
  controllers: [
    { id: "c1", name: "Driver" },
    { id: "c2", name: "Supervisor" },
  ],
  controlled_processes: [{ id: "p1", name: "Brakes", states: ["Idle", "Braking"] }],
  control_actions: [{ id: "ca1", source: "c1", target: "p1", action: "Brake" }],
  feedback: [{ id: "fb1", source: "p1", target: "c1", signal: "Speed" }],
};

/** All blocks of the model, whatever their type. */
const blocks = (m) => [...(m.controllers || []), ...(m.controlled_processes || []), ...(m.actuators || []), ...(m.sensors || [])];
const byName = (m, name) => blocks(m).find((b) => b.name === name);
/** Blocks that did not exist in MODEL. */
const added = (m) => blocks(m).filter((b) => !["c1", "c2", "p1"].includes(b.id));
const linksBetween = (m, from, to) => ({
  ca: (m.control_actions || []).filter((x) => x.source === from && x.target === to),
  fb: (m.feedback || []).filter((x) => x.source === to && x.target === from),
});
const empty = (label) => label === undefined || label === "" || (Array.isArray(label) && label.every((l) => !l));

/** Select blocks the way the tool does today: a click, then Shift+click for more. */
async function select(page, ...ids) {
  for (const [i, id] of ids.entries()) await node(page, id).click({ modifiers: i ? ["Shift"] : [] });
  await page.mouse.move(2, 2); // the mouse leaves the diagram so that keys act on the selection
}

test.describe("STPA workbench: Add Below", () => {
  let errors;
  test.beforeEach(async ({ page }) => {
    test.skip(!toolExists(T), `${T.file} not found in the workspace`);
    await page.setViewportSize({ width: 1400, height: 900 });
    ({ errors } = await openTool(page, T));
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector("#diagram g.node");
    await setEditor(page, "#editor", MODEL);
    await page.waitForSelector('#diagram g.node[data-sel="c1"]');
    await page.locator("body").click({ position: { x: 5, y: 5 } }); // nothing is being edited
  });
  test.afterEach(() => expect(errors).toEqual([]));

  test("STPA-ADD-1: Add Below ger ett block med länkar", async ({ page }) => {
    await select(page, "c1");
    await page.keyboard.press("b");
    const m = await json(page);
    expect(added(m)).toHaveLength(1);
    const [child] = added(m);
    const { ca, fb } = linksBetween(m, "c1", child.id);
    expect(ca).toHaveLength(1);
    expect(fb).toHaveLength(1);
    expect(empty(ca[0].action)).toBe(true);
    expect(empty(fb[0].signal)).toBe(true);
    expect(await selected(page)).toEqual([child.id]);
    expect(await focusedKey(page)).toBe(`${child.id}|name`);
  });

  test("STPA-ADD-2: en kedja nedåt skrivs med tangentbordet", async ({ page }) => {
    await select(page, "c1");
    await page.keyboard.press("b");
    await page.keyboard.type("ECU");
    await page.keyboard.press("Enter");
    await expect.poll(async () => byName(await json(page), "ECU")).toBeTruthy(); // the name is committed before the next key
    await page.keyboard.press("Escape");
    await page.keyboard.press("b");
    await expect.poll(async () => added(await json(page)).length).toBe(2);
    const m = await json(page);
    const ecu = byName(m, "ECU");
    expect(ecu).toBeTruthy();
    expect(linksBetween(m, "c1", ecu.id).ca).toHaveLength(1);
    const next = added(m).find((b) => b.id !== ecu.id);
    expect(next).toBeTruthy();
    expect(linksBetween(m, ecu.id, next.id).ca).toHaveLength(1);
    expect(linksBetween(m, ecu.id, next.id).fb).toHaveLength(1);
    expect(await selected(page)).toEqual([next.id]);
  });

  test("STPA-ADD-5: flera markerade får ett gemensamt nytt block under sig", async ({ page }) => {
    await select(page, "c1", "c2");
    await page.keyboard.press("b");
    const m = await json(page);
    expect(added(m)).toHaveLength(1);
    const [child] = added(m);
    for (const parent of ["c1", "c2"]) {
      const { ca, fb } = linksBetween(m, parent, child.id);
      expect(ca).toHaveLength(1);
      expect(fb).toHaveLength(1);
    }
  });

  test("STPA-ADD-8: ångra tar bort blocket och länkarna i ett steg", async ({ page }) => {
    const before = await json(page);
    await select(page, "c1");
    await page.keyboard.press("b");
    expect(added(await json(page))).toHaveLength(1);
    await page.keyboard.press("Escape"); // leave the name cell
    await page.keyboard.press("ControlOrMeta+z");
    expect(await json(page)).toEqual(before);
  });

  test("STPA-ADD-9: bokstavstangenter är avstängda medan man skriver", async ({ page }) => {
    await select(page, "c1");
    await page.keyboard.press("b");
    await page.keyboard.type("Bab");
    const m = await json(page);
    expect(added(m)).toHaveLength(1);
    await expect(page.locator(`#structureWrap [data-key="${added(m)[0].id}|name"]`)).toHaveValue("Bab");
  });

  test("STPA-ADD-10: utan markering gör tangenten ingenting och knappen är inaktiv", async ({ page }) => {
    const before = await json(page);
    expect(await selected(page)).toEqual([]);
    await page.keyboard.press("b");
    expect(await json(page)).toEqual(before);
    await expect(addBelow(page)).toBeDisabled();
  });

  test("STPA-TYPE-1: Add Below på en controlled process gör den till controller", async ({ page }) => {
    await select(page, "p1");
    await page.keyboard.press("b");
    const m = await json(page);
    expect((m.controllers || []).some((c) => c.id === "p1")).toBe(true);
    expect((m.controlled_processes || []).some((p) => p.id === "p1")).toBe(false);
    const [child] = added(m);
    expect((m.controlled_processes || []).some((p) => p.id === child.id)).toBe(true);
  });
});
