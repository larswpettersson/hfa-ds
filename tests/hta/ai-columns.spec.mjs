import { test, expect } from "@playwright/test";
import { tool, toolExists } from "../lib/tools.mjs";
import { openTool } from "../lib/page.mjs";
import { mockClaude } from "../lib/claude.mjs";
import { openPanel } from "../lib/ai-panel.mjs";

// The AI support follows the analysis' TTA columns: architecture section 8, step 3.
const T = tool("hta");
const fence = (obj) => "Proposal:\n\n```json\n" + JSON.stringify(obj, null, 2) + "\n```";
const rows = (page) => page.evaluate(() => HTAEditor.getState().ttaRecords);

/** An analysis with STPA-input columns: no HEI fields, a list column and a select column. */
const STPA_FILE = {
  version: 2,
  meta: {
    theme: "light",
    columns: [
      { id: "taskStep", label: "Task Step", order: 0 },
      { id: "controller", label: "Controller", type: "text", order: 1, description: "Who carries out the task (person, team or system)." },
      { id: "hazards", label: "Related Hazards", type: "list", order: 2, description: "Hazard ids the task can contribute to, e.g. H1." },
      { id: "severity", label: "Severity", type: "select", options: ["Low", "High"], order: 3, description: "How severe the worst outcome is." },
    ],
  },
  root: { id: "1", title: "Land", children: [{ id: "1.1", title: "Tune ILS", children: [] }, { id: "1.2", title: "Align with runway", children: [] }] },
  ttaRecords: [
    { id: "r1", taskId: "1.1", controller: "", hazards: [], severity: "" },
    { id: "r2", taskId: "1.2", controller: "PF", hazards: ["H1"], severity: "High" },
  ],
};

test.describe("HTA: AI support follows the TTA columns", () => {
  let errors;
  test.beforeEach(async ({ page }) => {
    test.skip(!toolExists(T), `${T.file} not found in the workspace`);
    ({ errors } = await openTool(page, T));
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem("hfa-ai:providers", JSON.stringify({ provider: "claude", claude_key: "test-key" })); });
    await page.reload();
    await page.waitForSelector(".task");
    await page.evaluate((f) => HTAEditor.loadState(f), STPA_FILE);
  });
  test.afterEach(() => expect(errors).toEqual([]));

  const ask = async (page, q, n = 2) => {
    await page.fill(".ai-chat textarea", q);
    await page.click(".ai-chat button[type=submit]");
    await expect(page.locator(".ai-msg.assistant")).toHaveCount(n);
  };

  test("the prompt describes the analysis' columns and the context carries their values", async ({ page }) => {
    const bodies = await mockClaude(page, "Fine.");
    await openPanel(page);
    await expect(page.locator(".ai-toggle")).toHaveAttribute("aria-label", "Hide AI panel");
    await ask(page, "Fill in");
    const sys = bodies[0].system;
    expect(sys).toContain('- "controller" (Controller; text): Who carries out the task');
    expect(sys).toContain('- "hazards" (Related Hazards; list of strings): Hazard ids');
    expect(sys).toContain('- "severity" (Severity; one of ["Low","High"])');
    expect(sys).not.toContain("humanErrorType"); // no HEI fields in an analysis without them
    expect(sys).not.toContain("SHERPA");
    const ctx = JSON.parse(sys.slice(sys.indexOf("Current HTA and TTA (JSON):") + "Current HTA and TTA (JSON):".length));
    expect(ctx.columns.map((c) => c.id)).toEqual(["controller", "hazards", "severity"]);
    expect(ctx.ttaRecords).toContainEqual({ id: "r2", taskId: "1.2", controller: "PF", hazards: ["H1"], severity: "High" });
    expect(ctx.ttaRecords).toContainEqual({ id: "r1", taskId: "1.1" }); // empty values left out
  });

  test("a patch fills custom columns, and the other rows keep their values", async ({ page }) => {
    await mockClaude(page, fence({
      patch: true,
      tasks: [{ id: "n1", parent: "1", title: "Go around" }],
      ttaRecords: [
        { id: "r1", controller: "PM", hazards: "H1, H2", severity: "Low" },
        { taskId: "n1", controller: "PF / PM", hazards: ["H2"] },
      ],
    }));
    await openPanel(page);
    await ask(page, "Fill in");
    await page.click(".ai-card .ai-apply");
    await expect(page.locator(".ai-status")).toContainText("Patch applied");
    const r = await rows(page);
    expect(r.find((x) => x.id === "r1")).toMatchObject({ controller: "PM", hazards: ["H1", "H2"], severity: "Low" });
    expect(r.find((x) => x.id === "r2")).toMatchObject({ controller: "PF", hazards: ["H1"], severity: "High" });
    expect(r.find((x) => x.taskId === "1.3")).toMatchObject({ controller: "PF / PM", hazards: ["H2"], severity: "" });
    expect(r.some((x) => "externalErrorMode" in x)).toBe(false);
  });

  test("a patch with a field that is not a column is refused and changes nothing", async ({ page }) => {
    const before = await rows(page);
    await mockClaude(page, fence({ patch: true, ttaRecords: [{ id: "r1", controller: "PM", recovery: "ATP" }] }));
    await openPanel(page);
    await ask(page, "Fill in");
    await page.click(".ai-card .ai-apply");
    await expect(page.locator(".ai-status")).toContainText('"recovery" that is not a column');
    expect(await rows(page)).toEqual(before);
  });

  test("a select value outside the column's options is refused", async ({ page }) => {
    const before = await rows(page);
    await mockClaude(page, fence({ patch: true, ttaRecords: [{ id: "r1", severity: "Medium" }] }));
    await openPanel(page);
    await ask(page, "Fill in");
    await page.click(".ai-card .ai-apply");
    await expect(page.locator(".ai-status")).toContainText('"Medium" is not one of the options of "Severity"');
    expect(await rows(page)).toEqual(before);
  });
});
