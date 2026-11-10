import { test, expect } from "@playwright/test";
import { tool, toolExists } from "../lib/tools.mjs";
import { openTool, setEditor, getEditorJson } from "../lib/page.mjs";

// Requirements: STPA-ADD-4, STPA-ADD-7, STPA-TYPE-2, STPA-TYPE-3 in docs/design-stpa.md.
const T = tool("stpa-workbench");
const json = (page) => getEditorJson(page, "#editor");
const node = (page, id) => page.locator(`#diagram g.node[data-sel="${id}"]`);
const selected = (page) => page.locator("#diagram .sel[data-sel]").evaluateAll((els) => [...new Set(els.map((e) => e.dataset.sel))].sort());

const MODEL = {
  system: "Add Beside",
  controllers: [{ id: "c1", name: "Driver" }, { id: "c2", name: "Supervisor" }],
  controlled_processes: [{ id: "p1", name: "Brakes", states: ["Idle", "Braking"] }],
  control_actions: [{ id: "ca1", source: "c1", target: "p1", action: "Brake" }],
  feedback: [{ id: "fb1", source: "p1", target: "c1", signal: "Speed" }],
};
const blocks = (m) => [...(m.controllers || []), ...(m.controlled_processes || []), ...(m.actuators || []), ...(m.sensors || [])];
const added = (m) => blocks(m).filter((b) => !["c1", "c2", "p1"].includes(b.id));
const empty = (l) => l === undefined || l === "" || (Array.isArray(l) && l.every((x) => !x));
async function select(page, ...ids) {
  for (const [i, id] of ids.entries()) await node(page, id).click({ modifiers: i ? ["Shift"] : [] });
  await page.mouse.move(2, 2); // the mouse leaves the diagram so that keys act on the selection
}

test.describe("STPA workbench: Add Beside and type follows position", () => {
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
    await page.locator("body").click({ position: { x: 5, y: 5 } });
  });
  test.afterEach(() => expect(errors).toEqual([]));

  test("STPA-ADD-4: Add Beside får samma överordnade som det markerade blocket", async ({ page }) => {
    await select(page, "p1");
    await page.keyboard.press("s");
    const m = await json(page);
    expect(added(m)).toHaveLength(1);
    const [sib] = added(m);
    const ca = m.control_actions.filter((x) => x.source === "c1" && x.target === sib.id);
    const fb = m.feedback.filter((x) => x.source === sib.id && x.target === "c1");
    expect(ca).toHaveLength(1);
    expect(fb).toHaveLength(1);
    expect(empty(ca[0].action) && empty(fb[0].signal)).toBe(true);
    expect((m.controlled_processes || []).some((p) => p.id === "p1")).toBe(true); // the selected block keeps its type
    expect(await selected(page)).toEqual([sib.id]);
  });

  test("STPA-ADD-7: Add Beside för block som inte hör ihop varnar och ändrar inget", async ({ page }) => {
    await select(page, "c1", "p1");
    const before = await json(page);
    await page.keyboard.press("s");
    await expect(page.locator("#status")).toContainText("same parent");
    expect(await json(page)).toEqual(before);
    expect(await selected(page)).toEqual(["c1", "p1"]);
  });

  test("STPA-TYPE-2: att ta bort det sista blocket under en controller gör den till controlled process", async ({ page }) => {
    await select(page, "p1");
    await page.keyboard.press("b"); // p1 becomes a controller with one block under it
    const m = await json(page);
    const [child] = added(m);
    expect(m.controllers.some((c) => c.id === "p1")).toBe(true);
    await page.locator(`#structureWrap tr[data-row="${child.id}"] button[title^="Delete"]`).click();
    const after = await json(page);
    expect(after.controlled_processes.some((p) => p.id === "p1")).toBe(true);
    expect(after.controllers.some((c) => c.id === "p1")).toBe(false);
  });

  test("STPA-TYPE-3: fälten för den gamla typen kommer tillbaka", async ({ page }) => {
    await select(page, "p1");
    await page.keyboard.press("b");
    const [child] = added(await json(page));
    await page.locator(`#structureWrap tr[data-row="${child.id}"] button[title^="Delete"]`).click();
    const p1 = (await json(page)).controlled_processes.find((p) => p.id === "p1");
    expect(p1.states).toEqual(["Idle", "Braking"]);
  });
});
