import { test, expect } from "@playwright/test";
import { tool, toolExists } from "../lib/tools.mjs";
import { openTool, getEditorJson } from "../lib/page.mjs";

const T = tool("stpa-workbench");
const selected = (page) => page.locator("#diagram .sel[data-sel]").evaluateAll((els) => [...new Set(els.map((e) => e.dataset.sel))].sort());
const node = (page, id) => page.locator(`#diagram g.node[data-sel="${id}"]`);

/** Answer /v1/messages with a streamed reply and record each request body. */
async function mockClaude(page, replyText) {
  const bodies = [];
  const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "POST, OPTIONS" };
  await page.route("https://api.anthropic.com/v1/messages", async (route) => {
    if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
    bodies.push(JSON.parse(route.request().postData()));
    const ev = (o) => `event: ${o.type}\ndata: ${JSON.stringify(o)}\n\n`;
    await route.fulfill({
      status: 200, headers: { ...cors, "content-type": "text/event-stream" },
      body: ev({ type: "message_start", message: { usage: { input_tokens: 100, output_tokens: 1 } } })
        + ev({ type: "content_block_start", index: 0, content_block: { type: "text", text: "" } })
        + ev({ type: "content_block_delta", index: 0, delta: { type: "text_delta", text: replyText } })
        + ev({ type: "content_block_stop", index: 0 })
        + ev({ type: "message_delta", delta: { stop_reason: "end_turn" }, usage: { output_tokens: 42 } })
        + ev({ type: "message_stop" }),
    });
  });
  return bodies;
}

test.describe("STPA workbench: selection, scope and conversions", () => {
  let errors;
  test.beforeEach(async ({ page }) => {
    test.skip(!toolExists(T), `${T.file} not found in the workspace`);
    ({ errors } = await openTool(page, T));
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem("hfa-stpa:settings", JSON.stringify({ provider: "claude", claude_key: "test-key", mcp_enabled: false }));
    });
    await page.reload();
    await page.waitForSelector("#diagram g.node");
  });
  test.afterEach(() => expect(errors).toEqual([]));

  test("Shift+click toggles blocks, control actions and feedback; a plain click does not select", async ({ page }) => {
    await node(page, "p1").click();
    expect(await selected(page)).toEqual([]);
    await node(page, "p1").click({ modifiers: ["Shift"] });
    await page.locator('#diagram text[data-sel="ca1"]').click({ modifiers: ["Shift"] });
    await page.locator('#diagram text.lbl-fb[data-sel="fb1"]').click({ modifiers: ["Shift"] });
    expect(await selected(page)).toEqual(["ca1", "fb1", "p1"]);
    await expect(page.locator("#scopeText")).toContainText("p1, ca1, fb1");
    await node(page, "p1").click({ modifiers: ["Shift"] });
    expect(await selected(page)).toEqual(["ca1", "fb1"]);
    // the selected state uses the halo filter from the Penpot "Selected" variant
    const filter = await page.locator('#diagram text[data-sel="ca1"]').evaluate((el) => getComputedStyle(el).filter);
    expect(filter).toContain("sel-halo");
  });

  test("the selection survives a reload and Clear empties it", async ({ page }) => {
    await node(page, "c1").click({ modifiers: ["Shift"] });
    await page.reload();
    await page.waitForSelector("#diagram g.node");
    expect(await selected(page)).toEqual(["c1"]);
    await page.locator("#selBar button", { hasText: "Clear" }).click();
    expect(await selected(page)).toEqual([]);
  });

  test("convert a control action to an actuator and feedback to a sensor", async ({ page }) => {
    await page.locator('#diagram text[data-sel="ca1"]').click({ modifiers: ["Shift"] });
    await page.locator('#diagram text.lbl-fb[data-sel="fb1"]').click({ modifiers: ["Shift"] });
    await page.locator("#selBar button", { hasText: "Convert to actuator" }).click();
    await page.locator("#selBar button", { hasText: "Convert to sensor" }).click();
    const m = await getEditorJson(page, "#editor");
    expect(m.actuators).toEqual([{ id: "a1", name: "ApplyBrakingForce actuator", target: "p1", actuation: "", converted_from: "ca1" }]);
    expect(m.sensors).toEqual([{ id: "s1", name: "WheelSpeedSensorData sensor", source: "p1", measures: "", converted_from: "fb1" }]);
    expect(m.control_actions.find((c) => c.id === "ca1").target).toBe("a1");
    expect(m.feedback.find((f) => f.id === "fb1").source).toBe("s1");
    expect(await selected(page)).toEqual(["a1", "s1"]);
    // the loop through actuator and sensor still counts as closed, and both get their own block
    const issues = await page.locator("#issues").innerText();
    expect(issues).not.toContain("ca1");
    expect(issues).not.toContain("error");
    await expect(node(page, "a1")).toHaveClass(/act/);
    await expect(node(page, "s1")).toHaveClass(/sens/);
    // Convert is disabled for a control action that targets a controller (ca0: Driver → AEB ECU)
    await page.locator("#selBar button", { hasText: "Clear" }).click();
    await page.locator('#diagram text[data-sel="ca0"]').click({ modifiers: ["Shift"] });
    await expect(page.locator("#selBar button", { hasText: "Convert to actuator" })).toBeDisabled();
  });

  test("a scoped question sends the selection, the chosen model and no earlier turns", async ({ page }) => {
    const bodies = await mockClaude(page, "Answer.");
    await node(page, "p1").click({ modifiers: ["Shift"] });
    await page.selectOption("#modelPick", "claude-haiku-4-5");
    await page.fill("#prompt", "First question");
    await page.click("#sendBtn");
    await expect(page.locator(".msg.assistant").last()).toContainText("Answer.");
    await page.fill("#prompt", "Second question");
    await page.click("#sendBtn");
    await expect(page.locator(".msg.assistant")).toHaveCount(3);

    expect(bodies).toHaveLength(2);
    const [first, second] = bodies;
    expect(first.model).toBe("claude-haiku-4-5");
    expect(first.stream).toBe(true);
    expect(first.max_tokens).toBe(64000);
    expect(first.output_config).toBeUndefined(); // Haiku 4.5 takes no effort
    expect(first.fallbacks).toBeUndefined();
    expect(first.system).toContain('"Vehicle Braking Subsystem"'); // whole structure as context
    expect(first.messages).toHaveLength(1);
    expect(first.messages[0].content).toContain("Analysis scope");
    expect(first.messages[0].content).toContain('"id": "p1"');
    expect(first.messages[0].content).not.toContain('"id": "c1"');
    expect(second.messages).toHaveLength(1); // earlier turns are off by default
    await expect(page.locator(".msg.assistant .meta").last()).toContainText("42 out tokens");

    await page.check("#keep_history");
    await page.selectOption("#modelPick", "claude-opus-5-5");
    await page.fill("#prompt", "Third question");
    await page.click("#sendBtn");
    await expect(page.locator(".msg.assistant")).toHaveCount(4);
    expect(bodies[2].messages).toHaveLength(5);
    expect(bodies[2].output_config).toEqual({ effort: "medium" });
    expect(bodies[2].fallbacks).toBe("default");
    expect(await page.inputValue("#claude_model")).toBe("claude-opus-5-5");
  });

  test("a structure patch in a reply merges into the editor by id", async ({ page }) => {
    const patch = {
      patch: true,
      controlled_processes: [{ id: "p1", name: "Vehicle Braking System" }],
      actuators: [{ id: "a1", name: "Hydraulic brake channel", target: "p1", actuation: "Brake pressure" }],
      control_actions: [{ id: "ca1", target: "a1" }],
      remove: ["ca2"],
    };
    await mockClaude(page, "Here:\n\n```json\n" + JSON.stringify(patch) + "\n```");
    await page.fill("#prompt", "Rename it");
    await page.click("#sendBtn");
    const card = page.locator(".struct-card").last();
    await expect(card).toContainText("Structure patch");
    await card.locator("button", { hasText: "Apply to editor" }).click();
    const m = await getEditorJson(page, "#editor");
    expect(m.controlled_processes[0]).toEqual({ id: "p1", name: "Vehicle Braking System", states: ["Disengaged", "Applying", "FullyLocked"] });
    expect(m.control_actions.map((c) => c.id)).toEqual(["ca0", "ca1"]);
    expect(m.control_actions[1]).toMatchObject({ action: "ApplyBrakingForce", target: "a1" });
    expect(m.actuators).toHaveLength(1);
  });
});
