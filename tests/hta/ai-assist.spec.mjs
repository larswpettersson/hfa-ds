import { test, expect } from "@playwright/test";
import { tool, toolExists } from "../lib/tools.mjs";
import { openTool } from "../lib/page.mjs";
import { mockClaude } from "../lib/claude.mjs";

const T = tool("hta");
const fence = (obj) => "Proposal:\n\n```json\n" + JSON.stringify(obj, null, 2) + "\n```";
const state = (page) => page.evaluate(() => {
  const s = HTAEditor.getState();
  const walk = (n) => [[n.id, n.title], ...n.children.flatMap(walk)];
  return { tasks: walk(s.root), tta: s.ttaRecords.map((r) => [r.id, r.taskId, r.externalErrorMode, r.recovery]) };
});

test.describe("HTA: AI panel", () => {
  let errors;
  test.beforeEach(async ({ page }) => {
    test.skip(!toolExists(T), `${T.file} not found in the workspace`);
    ({ errors } = await openTool(page, T));
    // Keys saved by the STPA workbench are picked up on first use.
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem("hfa-stpa:settings", JSON.stringify({ provider: "claude", claude_key: "test-key" })); });
    await page.reload();
    await page.waitForSelector(".task");
  });
  test.afterEach(() => expect(errors).toEqual([]));

  const ask = async (page, q, n = 2) => {
    await page.fill(".ai-chat textarea", q);
    await page.click(".ai-chat button[type=submit]");
    await expect(page.locator(".ai-msg.assistant")).toHaveCount(n);
  };

  test("A opens the panel; letters typed in it do not reach the editor's shortcuts", async ({ page }) => {
    await expect(page.locator(".ai-panel")).toBeHidden();
    await page.keyboard.press("a");
    await expect(page.locator(".ai-panel")).toBeVisible();
    const before = await state(page);
    await page.locator(".ai-chat textarea").pressSequentially("csd");
    expect(await state(page)).toEqual(before);
    await page.locator(".ai-chat textarea").press("Escape");
    await expect(page.locator(".ai-panel")).toBeHidden();
  });

  test("a question sends the hierarchy and TTA rows; a selected task scopes it", async ({ page }) => {
    const bodies = await mockClaude(page, "Fine.");
    await page.click(".ai-toggle");
    await page.click('.task[data-task-id="1.2"] .task-id');
    await expect(page.locator(".ai-scope strong")).toHaveText('task 1.2 "Apply Brake"');
    await ask(page, "What can go wrong?");
    const body = bodies[0];
    expect(body.model).toBe("claude-opus-5-5");
    expect(body.system).toContain('"title": "Operate Train"');
    expect(body.system).toContain('"patch": true');
    expect(body.messages).toHaveLength(1);
    expect(body.messages[0].content).toContain("I selected task 1.2");
    expect(body.messages[0].content).toMatch(/What can go wrong\?$/);
  });

  test("a patch adds, renames, moves and removes; Ctrl+Z and Revert undo it", async ({ page }) => {
    const before = await state(page);
    await mockClaude(page, fence({
      patch: true,
      tasks: [{ id: "1.2", title: "Apply brake firmly" }, { id: "n1", parent: "1", position: 0, title: "Check route", children: [{ title: "Read timetable" }] }],
      ttaRecords: [{ taskId: "n1", externalErrorMode: "Omission", consequence: "Wrong route" }, { id: "r3", recovery: "ATP" }],
      remove: ["r2"],
    }));
    await page.click(".ai-toggle");
    await ask(page, "Improve");
    await expect(page.locator(".ai-card strong")).toHaveText("HTA patch · 2 tasks, 2 TTA rows, remove r2");
    await page.click(".ai-card .ai-apply");
    await expect(page.locator(".ai-status")).toContainText("2 added, 2 changed, 1 removed");
    const after = await state(page);
    expect(after.tasks).toEqual([["1", "Operate Train"], ["1.1", "Check route"], ["1.1.1", "Read timetable"], ["1.2", "Set Speed"], ["1.3", "Apply brake firmly"]]);
    // TTA rows follow the renumbered tasks
    expect(after.tta).toContainEqual(["r1", "1.2", "Action too much", "Auto-cutout"]);
    expect(after.tta).toContainEqual(["r3", "1.3", "Omission", "ATP"]);
    expect(after.tta.some(([id]) => id === "r2")).toBe(false);
    expect(after.tta.filter(([, task, mode]) => task === "1.1" && mode === "Omission")).toHaveLength(1);

    await page.locator(".hierarchy").click({ position: { x: 5, y: 5 } });
    await page.keyboard.press("Control+z");
    expect(await state(page)).toEqual(before);
    await page.keyboard.press("Control+Shift+z");
    expect(await state(page)).toEqual(after);
    await page.click(".ai-card button:has-text('Revert')");
    expect(await state(page)).toEqual(before);
  });

  test("a complete analysis loads after confirmation", async ({ page }) => {
    await mockClaude(page, fence({ root: { id: "1", title: "Boil water", children: [{ id: "1.1", title: "Fill kettle", children: [] }, { id: "1.2", title: "Switch on", children: [] }] },
      ttaRecords: [{ id: "x1", taskId: "1.2", externalErrorMode: "Omission" }] }));
    await page.click(".ai-toggle");
    await ask(page, "Redo");
    await expect(page.locator(".ai-card strong")).toHaveText("HTA · 3 tasks, 1 TTA rows");
    page.once("dialog", (d) => d.accept());
    await page.click(".ai-card .ai-apply");
    const s = await state(page);
    expect(s.tasks).toEqual([["1", "Boil water"], ["1.1", "Fill kettle"], ["1.2", "Switch on"]]);
    expect(s.tta).toContainEqual(["x1", "1.2", "Omission", ""]);
  });

  test("a patch with an unknown parent is refused and changes nothing", async ({ page }) => {
    const before = await state(page);
    await mockClaude(page, fence({ patch: true, tasks: [{ id: "n1", parent: "9.9", title: "Lost" }] }));
    await page.click(".ai-toggle");
    await ask(page, "Add");
    await page.click(".ai-card .ai-apply");
    await expect(page.locator(".ai-status")).toContainText("Could not apply: Parent 9.9");
    expect(await state(page)).toEqual(before);
  });
});
