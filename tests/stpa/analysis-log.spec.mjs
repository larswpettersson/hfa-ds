import { test, expect } from "@playwright/test";
import { tool, toolExists } from "../lib/tools.mjs";
import { openTool } from "../lib/page.mjs";
import { mockClaude } from "../lib/claude.mjs";

const T = tool("stpa-workbench");
// Long enough to be taller than the log, with a table wider than the panel.
const LONG = "## Loss scenarios\n\n"
  + "| ID | Scenario | Process-model flaw | Feedback | Other factors |\n|---|---|---|---|---|\n"
  + Array.from({ length: 40 }, (_, i) => `| S-${i + 1} | ${"Controller believes the plan is in force while the process has diverged ".repeat(2)} | Stale state | 2 s latency | Manual override |`).join("\n");

/** Entries that scroll inside themselves instead of growing with their content. */
const scrollingEntries = (page) => page.locator(".ai-log > *").evaluateAll((els) => els.filter((e) => e.scrollHeight > e.clientHeight + 1).length);

test.describe("STPA workbench: analysis log", () => {
  let errors;
  test.beforeEach(async ({ page }) => {
    test.skip(!toolExists(T), `${T.file} not found in the workspace`);
    ({ errors } = await openTool(page, T));
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem("hfa-ai:providers", JSON.stringify({ provider: "claude", claude_key: "test-key" }));
    });
    await page.reload();
    await page.waitForSelector("#diagram g.node");
    await mockClaude(page, LONG);
  });
  test.afterEach(() => expect(errors).toEqual([]));

  const ask = async (page, q, n) => {
    await page.fill(".ai-chat textarea", q);
    await page.click(".ai-chat button[type=submit]");
    await expect(page.locator(".ai-msg.assistant")).toHaveCount(n);
  };

  test("the log scrolls as one column and a new answer opens at its first line", async ({ page }) => {
    await ask(page, "First", 2);
    await ask(page, "Second", 3);
    expect(await scrollingEntries(page)).toBe(0);
    const log = page.locator(".ai-log");
    expect(await log.evaluate((l) => l.scrollHeight > l.clientHeight)).toBe(true);
    // the heading of the latest answer is in view once scrolling settles
    const heading = page.locator(".ai-msg.assistant").last().locator("h2, h3, h4").first();
    await expect(heading).toBeInViewport();
  });

  test("the caret folds an answer to one line; the line opens it again", async ({ page }) => {
    await ask(page, "First", 2);
    const msg = page.locator(".ai-msg.assistant").last();
    const fold = msg.locator(".meta .fold");
    await expect(fold).toHaveAttribute("aria-expanded", "true");
    await fold.click();
    await expect(msg).toHaveClass(/folded/);
    await expect(msg.locator(".body")).toBeHidden();
    await expect(msg.locator(".gist")).toContainText("Loss scenarios");
    expect(await msg.evaluate((m) => m.getBoundingClientRect().height)).toBeLessThan(80);
    await msg.locator(".gist").click();
    await expect(msg.locator(".body")).toBeVisible();
    await expect(fold).toHaveAttribute("aria-expanded", "true");
    // the welcome text has no meta line and no caret
    await expect(page.locator(".ai-msg.assistant").first().locator(".fold")).toHaveCount(0);
  });

  test("Compress folds every answer and Expand opens them all", async ({ page }) => {
    await ask(page, "First", 2);
    await ask(page, "Second", 3);
    const answers = page.locator(".ai-msg.assistant:has(.fold)");
    await expect(answers).toHaveCount(2);
    await answers.first().locator(".fold").click(); // one folded by hand first
    await page.click(".ai-scope .folds button:nth-child(1)");
    await expect(page.locator(".ai-msg.assistant.folded")).toHaveCount(2);
    await expect(answers.locator(".fold[aria-expanded=false]")).toHaveCount(2);
    expect(await scrollingEntries(page)).toBe(0);
    await page.click(".ai-scope .folds button:nth-child(2)");
    await expect(page.locator(".ai-msg.assistant.folded")).toHaveCount(0);
    await expect(answers.locator(".body").first()).toBeVisible();
  });

  test("↓ shows while scrolled up and jumps to the latest entry", async ({ page }) => {
    await ask(page, "First", 2);
    const log = page.locator(".ai-log");
    await log.evaluate((l) => l.scrollTo({ top: l.scrollHeight }));
    await expect(page.locator(".ai-tobottom")).toBeHidden();
    await log.evaluate((l) => l.scrollTo({ top: 0 }));
    await expect(page.locator(".ai-tobottom")).toBeVisible();
    await page.click(".ai-tobottom");
    await expect(page.locator(".ai-tobottom")).toBeHidden();
    expect(await log.evaluate((l) => l.scrollHeight - l.scrollTop - l.clientHeight)).toBeLessThan(40);
  });
});
