import { test, expect } from "@playwright/test";
import { tool, toolExists } from "../lib/tools.mjs";
import { openTool } from "../lib/page.mjs";
import { mockClaude } from "../lib/claude.mjs";

const T = tool("bowtie");
const fence = (obj) => "Proposal:\n\n```json\n" + JSON.stringify(obj, null, 2) + "\n```";
const compact = (page) => page.evaluate(() => BowtieAssist.toCompact(BowtieEditor.getState()));
const ids = (list) => list.map((x) => x.id);

test.describe("Bowtie: AI panel", () => {
  let errors;
  test.beforeEach(async ({ page }) => {
    test.skip(!toolExists(T), `${T.file} not found in the workspace`);
    ({ errors } = await openTool(page, T));
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem("hfa-ai:providers", JSON.stringify({ provider: "claude", claude_key: "test-key" })); });
    await page.reload();
    await page.waitForSelector(".card");
  });
  test.afterEach(() => expect(errors).toEqual([]));

  const ask = async (page, q, n = 2) => {
    await page.fill(".ai-chat textarea", q);
    await page.click(".ai-chat button[type=submit]");
    await expect(page.locator(".ai-msg.assistant")).toHaveCount(n);
  };

  test("the question carries the compact bowtie; a selected card scopes it", async ({ page }) => {
    const bodies = await mockClaude(page, "Fine.");
    await page.keyboard.press("a");
    await page.locator("#c-C1").click({ position: { x: 4, y: 4 } });
    await expect(page.locator(".ai-scope strong")).toHaveText("C1");
    await ask(page, "Barriers for C1?");
    const sys = bodies[0].system;
    expect(sys).toContain('"preventiveBarriers"');
    expect(sys).not.toContain("authoredSegments");
    expect(bodies[0].messages[0].content).toContain("I selected C1");
    // the click in the panel did not clear the diagram's selection
    await expect(page.locator("#c-C1")).toHaveClass(/is-selected/);
  });

  test("a patch edits, adds and removes; a barrier left on no path goes too; Revert restores", async ({ page }) => {
    const before = await compact(page);
    await mockClaude(page, fence({
      patch: true, topEvent: { label: "OSPA" },
      causes: [{ id: "C5", description: "New cause" }],
      preventiveBarriers: [{ id: "P9", description: "Extra ATC", protects: ["C5", "C4"], strength: "strong", status: "To be implemented" }],
      reactiveBarriers: [{ id: "R1", status: "Unknown" }],
      remove: ["C3", "R2"],
    }));
    await page.click(".ai-toggle");
    await ask(page, "Improve");
    await page.click(".ai-card .ai-apply");
    await expect(page.locator(".ai-status")).toContainText("P2 only guarded removed paths");
    const after = await compact(page);
    expect(after.topEvent.label).toBe("OSPA");
    expect(ids(after.causes)).toEqual(["C1", "C2", "C4", "C5"]);
    expect(ids(after.preventiveBarriers)).toEqual(["P1", "P3", "P4", "P9"]);
    expect(after.preventiveBarriers.at(-1)).toMatchObject({ protects: ["C4", "C5"], strength: "Strong", status: "To be implemented" });
    expect(ids(after.reactiveBarriers)).toEqual(["R1", "R3"]);
    expect(after.reactiveBarriers[0].status).toBe("Unknown");
    await expect(page.locator("#c-C5")).toBeVisible();
    await page.click(".ai-card button:has-text('Revert')");
    expect(await compact(page)).toEqual(before);
  });

  test("a complete bowtie loads and is laid out with shared barrier columns", async ({ page }) => {
    await mockClaude(page, fence({
      hazard: { id: "HZ", label: "Hot water" }, topEvent: { id: "TE", label: "Scald" },
      causes: [{ id: "C1", description: "Kettle tips" }, { id: "C2", description: "Lid opens" }],
      preventiveBarriers: [{ id: "P1", description: "Stable base", protects: ["C1"] }, { id: "P2", description: "Lid lock", protects: ["C2"] }],
      consequences: [{ id: "K1", description: "Burn" }],
      reactiveBarriers: [{ id: "R1", description: "Cool water first aid", protects: ["K1"] }],
    }));
    await page.click(".ai-toggle");
    await ask(page, "New");
    await expect(page.locator(".ai-card strong")).toHaveText("Bowtie · 2 causes, 3 barriers, 1 consequences");
    page.once("dialog", (d) => d.accept());
    await page.click(".ai-card .ai-apply");
    const s = await page.evaluate(() => BowtieEditor.getState());
    expect(s.left.barriers.map((b) => [b.id, b.col])).toEqual([["P1", 2], ["P2", 2]]);
    expect(s.left.barrierCols).toBe(1);
    expect(s.right.barriers.map((b) => [b.id, b.col, b.status])).toEqual([["R1", 1, "Unknown"]]);
    await expect(page.locator(".top-event")).toContainText("Scald");
  });
});
