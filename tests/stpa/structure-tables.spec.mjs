import { test, expect } from "@playwright/test";
import { tool, toolExists } from "../lib/tools.mjs";
import { openTool, getEditorJson } from "../lib/page.mjs";
import { mockClaude } from "../lib/claude.mjs";

const T = tool("stpa-workbench");
const node = (page, id) => page.locator(`#diagram g.node[data-sel="${id}"]`);
const field = (page, key) => page.locator(`#structureWrap [data-key="${key}"]`);
/** The label texts of a diagram element (without the <title> tooltip). */
const labelTexts = (loc) => loc.evaluateAll((els) => els.map((el) => el.firstChild.nodeValue));
const json = (page) => getEditorJson(page, "#editor");
const focusedKey = (page) => page.evaluate(() => document.activeElement?.dataset?.key || null);
const panelShare = async (page) => {
  const [l, r] = await Promise.all(["#leftPanel", "#rightPanel"].map((s) => page.locator(s).boundingBox()));
  return l.width / (l.width + r.width);
};

test.describe("STPA workbench: structure tables, type switches and layout", () => {
  let errors;
  test.beforeEach(async ({ page }) => {
    test.skip(!toolExists(T), `${T.file} not found in the workspace`);
    await page.setViewportSize({ width: 1400, height: 900 });
    ({ errors } = await openTool(page, T));
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem("hfa-stpa:settings", JSON.stringify({ provider: "claude", claude_key: "test-key", mcp_enabled: false }));
    });
    await page.reload();
    await page.waitForSelector("#diagram g.node");
  });
  test.afterEach(() => expect(errors).toEqual([]));

  test("clicking a block focuses its row; a new name goes to the JSON and the diagram", async ({ page }) => {
    await node(page, "p1").click();
    expect(await focusedKey(page)).toBe("p1|name");
    await expect(page.locator('#structureWrap tr[data-row="p1"]')).toHaveClass(/cur/);
    await expect(node(page, "p1")).toHaveClass(/editing/);
    await page.keyboard.press("ControlOrMeta+A");
    await page.keyboard.type("Brakes");
    await page.keyboard.press("Enter");
    await expect(node(page, "p1")).toContainText("Brakes");
    expect((await getEditorJson(page, "#editor")).controlled_processes[0].name).toBe("Brakes");
    expect(await focusedKey(page)).toBe("p1|name"); // the re-rendered row keeps the focus
    await page.click("#undoBtn");
    expect((await getEditorJson(page, "#editor")).controlled_processes[0].name).toBe("Vehicle Braking Subsystem");
  });

  test("control actions and feedback take several labels, one per line", async ({ page }) => {
    await page.locator('#diagram text[data-sel="ca1"]').click();
    expect(await focusedKey(page)).toBe("ca1|labels");
    await field(page, "ca1|labels").fill("ApplyBrakingForce\nHoldBrakingForce\n");
    await field(page, "ca1|source").focus(); // leaving the field commits it
    await expect.poll(async () => (await json(page)).control_actions.find((c) => c.id === "ca1").action).toEqual(["ApplyBrakingForce", "HoldBrakingForce"]);
    await field(page, "fb1|labels").fill("WheelSpeedSensorData\nYawRate");
    await field(page, "fb1|latency").focus();
    await expect.poll(async () => (await json(page)).feedback.find((f) => f.id === "fb1").signal).toEqual(["WheelSpeedSensorData", "YawRate"]);
    expect(await labelTexts(page.locator('#diagram text.lbl-ca[data-sel="ca1"]'))).toEqual(["ApplyBrakingForce", "HoldBrakingForce"]);
    expect(await labelTexts(page.locator('#diagram text.lbl-fb[data-sel="fb1"]'))).toEqual(["WheelSpeedSensorData", "YawRate"]);
    await expect(page.locator("#issues")).not.toContainText("error");
    // one line is stored as a plain string again
    await field(page, "ca1|labels").fill("ApplyBrakingForce");
    await field(page, "ca1|source").focus();
    await expect.poll(async () => (await json(page)).control_actions.find((c) => c.id === "ca1").action).toBe("ApplyBrakingForce");
  });

  test("add a process and a control action to it from the selection, then delete the process with its links", async ({ page }) => {
    await page.locator("#stBlocksAdd button", { hasText: "+ Controlled process" }).click();
    expect(await focusedKey(page)).toBe("p2|name");
    await page.keyboard.type("Trailer brakes");
    await page.keyboard.press("Enter");
    await node(page, "c1").click({ modifiers: ["Shift"] });
    await node(page, "p2").click({ modifiers: ["Shift"] });
    await page.locator("#stCasAdd button").click();
    expect(await focusedKey(page)).toBe("ca3|labels");
    await page.keyboard.type("ApplyTrailerBrake");
    await field(page, "ca3|source").focus();
    await expect.poll(async () => (await json(page)).control_actions.find((c) => c.id === "ca3")?.action).toBe("ApplyTrailerBrake");
    let m = await json(page);
    expect(m.controlled_processes.find((p) => p.id === "p2")).toEqual({ id: "p2", name: "Trailer brakes", states: [] });
    expect(m.control_actions.find((c) => c.id === "ca3")).toEqual({ id: "ca3", source: "c1", target: "p2", action: "ApplyTrailerBrake" });
    expect(await labelTexts(page.locator('#diagram text[data-sel="ca3"]'))).toEqual(["ApplyTrailerBrake"]);
    await page.locator('#structureWrap tr[data-row="p2"] button.del').click();
    m = await getEditorJson(page, "#editor");
    expect(m.controlled_processes.map((p) => p.id)).toEqual(["p1"]);
    expect(m.control_actions.map((c) => c.id)).toEqual(["ca0", "ca1", "ca2"]);
    await expect(node(page, "p2")).toHaveCount(0);
  });

  test("the Type column switches a block", async ({ page }) => {
    await page.locator('#diagram text[data-sel="ca1"]').click({ modifiers: ["Shift"] });
    await page.locator("#selBar button", { hasText: "Convert to actuator" }).click();
    await field(page, "a1|type").focus();
    await field(page, "a1|type").selectOption("controlled_processes");
    await expect(node(page, "a1")).toHaveClass(/proc/);
    expect(await focusedKey(page)).toBe("a1|type");
    await field(page, "a1|states").fill("Idle\nPressurised");
    await field(page, "a1|name").focus();
    await expect.poll(async () => (await json(page)).controlled_processes.find((p) => p.id === "a1").states).toEqual(["Idle", "Pressurised"]);
  });

  test("a patch from the model can add an actuator and later switch it to a controlled process", async ({ page }) => {
    const add = { patch: true, actuators: [{ id: "a1", name: "Hydraulic unit", target: "p1", actuation: "Brake pressure" }], control_actions: [{ id: "ca1", target: "a1" }] };
    const sw = { patch: true, remove: ["a1"], controlled_processes: [{ id: "a1", name: "Hydraulic unit", states: ["Idle", "Pressurised"] }] };
    await mockClaude(page, "Add:\n\n```json\n" + JSON.stringify(add) + "\n```\n\nSwitch:\n\n```json\n" + JSON.stringify(sw) + "\n```");
    await page.fill("#prompt", "Add a hydraulic actuator");
    await page.click("#sendBtn");
    const cards = page.locator(".struct-card");
    await expect(cards).toHaveCount(2);
    await cards.nth(0).locator("button", { hasText: "Apply to editor" }).click();
    await expect(node(page, "a1")).toHaveClass(/act/);
    await cards.nth(1).locator("button", { hasText: "Apply to editor" }).click();
    const m = await getEditorJson(page, "#editor");
    expect(m.actuators).toEqual([]);
    expect(m.controlled_processes.find((p) => p.id === "a1")).toEqual(sw.controlled_processes[0]);
    expect(m.control_actions.find((c) => c.id === "ca1").target).toBe("a1");
    await expect(node(page, "a1")).toHaveClass(/proc/);
  });

  test("the control structure panel expands to ⅔ and ¾ and the split survives a reload", async ({ page }) => {
    expect(await panelShare(page)).toBeCloseTo(0.5, 2);
    const expand = page.locator('#leftPanel .wbtn[data-dir="1"]');
    await expand.click();
    expect(await panelShare(page)).toBeCloseTo(2 / 3, 2);
    await expand.click();
    expect(await panelShare(page)).toBeCloseTo(3 / 4, 2);
    await expect(expand).toBeDisabled();
    await page.reload();
    await page.waitForSelector("#diagram g.node");
    expect(await panelShare(page)).toBeCloseTo(3 / 4, 2);
    await page.locator('#rightPanel .wbtn[data-dir="1"]').click(); // expanding the analysis compresses the structure
    expect(await panelShare(page)).toBeCloseTo(2 / 3, 2);
    await page.locator("#splitter").focus();
    await page.keyboard.press("Home");
    expect(await panelShare(page)).toBeCloseTo(1 / 4, 2);
  });

  test("views compress and expand, keep their state after a reload, and edits stay undoable with the JSON compressed", async ({ page }) => {
    const json = page.locator("#vJson");
    await json.locator(".vcomp").click();
    await expect(json).toHaveClass(/compressed/);
    expect(await json.locator(".vbody").evaluate((el) => el.getBoundingClientRect().height)).toBe(0);
    expect((await json.boundingBox()).height).toBeLessThan(40); // only the bar is left
    await page.locator("#vDiagram .vexp").click();
    await expect(page.locator("#vDiagram")).toHaveClass(/expanded/);
    expect(await page.locator("#diagramWrap").evaluate((el) => getComputedStyle(el).maxHeight)).toBe("none");
    await page.reload();
    await page.waitForSelector("#diagram g.node");
    await expect(json).toHaveClass(/compressed/);
    await expect(page.locator("#vDiagram")).toHaveClass(/expanded/);

    await node(page, "c0").click();
    await page.keyboard.press("ControlOrMeta+A");
    await page.keyboard.type("Human driver");
    await page.keyboard.press("Enter");
    await expect(node(page, "c0")).toContainText("Human driver");
    await page.click("#undoBtn");
    await expect(node(page, "c0")).toContainText("Driver");
    await expect(node(page, "c0")).not.toContainText("Human");

    // compressing the structure tables does not stop a diagram click from opening the row
    await page.locator("#vStructure .vtitle").click();
    await expect(page.locator("#vStructure")).toHaveClass(/compressed/);
    await node(page, "p1").click();
    await expect(page.locator("#vStructure")).not.toHaveClass(/compressed/);
    expect(await focusedKey(page)).toBe("p1|name");
  });
});
