import { test, expect } from "@playwright/test";
import { tool, toolExists } from "../lib/tools.mjs";
import { openTool } from "../lib/page.mjs";
import { mockClaude } from "../lib/claude.mjs";
import { openPanel } from "../lib/ai-panel.mjs";

// Design principle 4.6: in the question field Enter sends and Shift+Enter gives a new line.
// An empty field sends nothing, and Ctrl/⌘+Enter no longer sends.
const TOOLS = [
  {
    id: "hta", ready: ".task", prompt: ".ai-chat textarea", answers: ".ai-msg.assistant",
    storage: ["hfa-ai:providers", { provider: "claude", claude_key: "test-key" }],
    open: (page) => openPanel(page),
  },
  {
    id: "bowtie", ready: ".card", prompt: ".ai-chat textarea", answers: ".ai-msg.assistant",
    storage: ["hfa-ai:providers", { provider: "claude", claude_key: "test-key" }],
    open: (page) => openPanel(page),
  },
  {
    id: "stpa-workbench", ready: "#diagram g.node", prompt: ".ai-chat textarea", answers: ".ai-msg.assistant",
    storage: ["hfa-ai:providers", { provider: "claude", claude_key: "test-key" }],
    open: (page) => openPanel(page),
  },
];

for (const c of TOOLS) {
  const T = tool(c.id);
  test.describe(`${c.id}: Enter sends, Shift+Enter gives a new line`, () => {
    let errors, bodies;
    test.beforeEach(async ({ page }) => {
      test.skip(!toolExists(T), `${T.file} not found in the workspace`);
      ({ errors } = await openTool(page, T));
      await page.evaluate(([k, v]) => { localStorage.clear(); localStorage.setItem(k, JSON.stringify(v)); }, c.storage);
      await page.reload();
      await page.waitForSelector(c.ready);
      bodies = await mockClaude(page, "Fine.");
      await c.open(page);
    });
    test.afterEach(() => expect(errors).toEqual([]));

    test("the field says so", async ({ page }) => {
      await expect(page.locator(c.prompt)).toHaveAttribute("placeholder", /Enter sends, Shift\+Enter for a new line/);
    });

    test("Enter sends the question and empties the field", async ({ page }) => {
      const answers = await page.locator(c.answers).count();
      await page.fill(c.prompt, "What can go wrong?");
      await page.press(c.prompt, "Enter");
      await expect(page.locator(c.answers)).toHaveCount(answers + 1);
      expect(bodies).toHaveLength(1);
      expect(JSON.stringify(bodies[0].messages)).toContain("What can go wrong?");
      await expect(page.locator(c.prompt)).toHaveValue("");
    });

    test("Shift+Enter gives a new line and sends nothing", async ({ page }) => {
      await page.fill(c.prompt, "first");
      await page.press(c.prompt, "Shift+Enter");
      await page.keyboard.type("second");
      await expect(page.locator(c.prompt)).toHaveValue("first\nsecond");
      expect(bodies).toHaveLength(0);
    });

    test("an empty field and Ctrl+Enter send nothing", async ({ page }) => {
      await page.press(c.prompt, "Enter");
      await page.fill(c.prompt, "   ");
      await page.press(c.prompt, "Enter");
      await page.fill(c.prompt, "Held back");
      await page.press(c.prompt, "Control+Enter");
      await page.waitForTimeout(200);
      expect(bodies).toHaveLength(0);
      await expect(page.locator(c.prompt)).toHaveValue("Held back");
    });
  });
}
