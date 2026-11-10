import { test, expect } from "@playwright/test";
import { tool, toolExists } from "../lib/tools.mjs";
import { openTool, setEditor, getEditorJson } from "../lib/page.mjs";

// Requirements: STPA-LINK-1..5 and STPA-NEW-1 in docs/design-stpa.md.
const T = tool("stpa-workbench");
const json = (page) => getEditorJson(page, "#editor");
const node = (page, id) => page.locator(`#diagram g.node[data-sel="${id}"]`);
const selected = (page) => page.locator("#diagram .sel[data-sel]").evaluateAll((els) => [...new Set(els.map((e) => e.dataset.sel))].sort());
const label = (page, sel) => page.locator(sel).evaluate((el) => el.firstChild.nodeValue); // without the <title> tooltip
const convert = (page, which) => page.locator("#selBar").getByRole("button", { name: `Convert to ${which}` });

const MODEL = {
  system: "Links",
  controllers: [{ id: "c1", name: "Driver" }, { id: "c2", name: "ECU" }],
  controlled_processes: [{ id: "p1", name: "Brakes", states: [] }],
  control_actions: [{ id: "ca1", source: "c1", target: "c2", action: "Request" }, { id: "ca2", source: "c2", target: "p1", action: "Brake" }],
  feedback: [{ id: "fb1", source: "c2", target: "c1", signal: "Status" }, { id: "fb2", source: "p1", target: "c2", signal: "Speed" }],
};

test.describe("STPA workbench: links without text, Convert and New", () => {
  let errors;
  test.beforeEach(async ({ page }) => {
    test.skip(!toolExists(T), `${T.file} not found in the workspace`);
    await page.setViewportSize({ width: 1600, height: 900 });
    ({ errors } = await openTool(page, T));
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector("#diagram g.node");
    await setEditor(page, "#editor", MODEL);
    await page.waitForSelector('#diagram g.node[data-sel="c2"]');
    await page.locator("body").click({ position: { x: 5, y: 5 } });
  });
  test.afterEach(() => expect(errors).toEqual([]));

  test("STPA-LINK-1: en länk utan text syns och går att markera", async ({ page }) => {
    await node(page, "c1").click();
    await page.mouse.move(2, 2);
    await page.keyboard.press("b");
    const m = await json(page);
    const child = m.controlled_processes.find((p) => !["p1"].includes(p.id));
    const ca = m.control_actions.find((x) => x.target === child.id), fb = m.feedback.find((x) => x.source === child.id);
    expect(await label(page, `#diagram text.lbl-ca[data-sel="${ca.id}"]`)).toBe(ca.id);
    expect(await label(page, `#diagram text.lbl-fb[data-sel="${fb.id}"]`)).toBe(fb.id);
    await page.keyboard.press("Escape");
    await page.locator(`#diagram text.lbl-ca[data-sel="${ca.id}"]`).click();
    expect(await selected(page)).toEqual([ca.id]);
  });

  test("STPA-LINK-2: texten skrivs i tabellen och ersätter id:t", async ({ page }) => {
    await node(page, "c1").click();
    await page.mouse.move(2, 2);
    await page.keyboard.press("b");
    const m = await json(page);
    const child = m.controlled_processes.find((p) => p.id !== "p1");
    const ca = m.control_actions.find((x) => x.target === child.id);
    const cell = page.locator(`#structureWrap [data-key="${ca.id}|labels"]`);
    await cell.fill("ApplyBrakes");
    await page.locator(`#structureWrap [data-key="${ca.id}|source"]`).focus(); // leaving the field commits it
    await expect.poll(async () => (await json(page)).control_actions.find((x) => x.id === ca.id).action).toBe("ApplyBrakes");
    await expect.poll(() => label(page, `#diagram text.lbl-ca[data-sel="${ca.id}"]`)).toBe("ApplyBrakes");
  });

  test("STPA-LINK-3: Convert finns för både styråtgärd och återkoppling", async ({ page }) => {
    await page.locator('#diagram text[data-sel="ca2"]').click();
    await expect(convert(page, "actuator")).toBeEnabled();
    await expect(convert(page, "sensor")).toBeDisabled();
    expect(await convert(page, "sensor").getAttribute("title")).toMatch(/feedback/i);
  });

  test("STPA-LINK-4: Convert gäller alla länkar, oavsett vilka block de går mellan", async ({ page }) => {
    await page.locator('#diagram text[data-sel="ca1"]').click(); // Driver → ECU, two controllers
    await convert(page, "actuator").click();
    const m = await json(page);
    expect(m.actuators).toHaveLength(1);
    const a = m.actuators[0];
    expect(m.control_actions.find((x) => x.id === "ca1").target).toBe(a.id);
    expect(m.control_actions.some((x) => x.source === a.id && x.target === "c2") || a.target === "c2").toBe(true);
    await expect(page.locator("#issues")).not.toContainText("✕");
  });

  test("STPA-LINK-5: en återkoppling blir ett sensorblock", async ({ page }) => {
    await page.locator('#diagram text.lbl-fb[data-sel="fb1"]').click(); // ECU → Driver, two controllers
    await convert(page, "sensor").click();
    const m = await json(page);
    expect(m.sensors).toHaveLength(1);
    expect(m.feedback.find((x) => x.id === "fb1").source).toBe(m.sensors[0].id);
    await expect(page.locator("#issues")).not.toContainText("✕");
  });

  test("STPA-NEW-1: New ger en controller och en controlled process, kopplade", async ({ page }) => {
    page.on("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "New", exact: true }).click();
    await expect.poll(async () => (await json(page)).controllers?.length).toBe(1);
    const m = await json(page);
    expect(m.controlled_processes).toHaveLength(1);
    expect(m.control_actions).toHaveLength(1);
    expect(m.feedback).toHaveLength(1);
    expect(m.control_actions[0]).toMatchObject({ source: m.controllers[0].id, target: m.controlled_processes[0].id });
    expect(m.feedback[0]).toMatchObject({ source: m.controlled_processes[0].id, target: m.controllers[0].id });
  });
});
