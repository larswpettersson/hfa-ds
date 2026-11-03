import { test, expect } from "@playwright/test";
import { tool, toolExists } from "../lib/tools.mjs";
import { openTool } from "../lib/page.mjs";
import { mockHuggingFace } from "../lib/huggingface.mjs";

// The AI panel is shared by HTA and Bowtie (scripts/ai-assist.js); the provider is tested once, here.
const T = tool("hta");

test.describe("AI panel: Hugging Face provider", () => {
  let errors;
  test.beforeEach(async ({ page }) => {
    test.skip(!toolExists(T), `${T.file} not found in the workspace`);
    ({ errors } = await openTool(page, T));
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem("hfa-ai:providers", JSON.stringify({ provider: "hf", hf_key: "hf_test" })); });
  });

  test("a question goes to the router with the token, system prompt and Gemma 4 by default", async ({ page }) => {
    const requests = await mockHuggingFace(page, "## Review\n\nLooks fine.");
    await page.reload();
    await page.click(".ai-toggle");
    await expect(page.locator(".ai-head .ai-pill")).toHaveText("Hugging Face");
    // the model list comes from the router
    await expect(page.locator(".ai-chat select option")).toHaveCount(2);
    await page.fill(".ai-chat textarea", "Review");
    await page.click(".ai-chat button[type=submit]");
    await expect(page.locator(".ai-msg.assistant")).toHaveCount(2);
    const { headers, body } = requests[0];
    expect(headers.authorization).toBe("Bearer hf_test");
    expect(body.model).toBe("google/gemma-4-31B-it");
    expect(body.messages[0].role).toBe("system");
    expect(body.messages[0].content).toContain('"title": "Operate Train"');
    expect(body.messages.at(-1)).toEqual({ role: "user", content: "Review" });
    await expect(page.locator(".ai-msg.assistant .meta").last()).toContainText("google/gemma-4-31B-it");
    await expect(page.locator(".ai-msg.assistant .meta").last()).toContainText("1200 in / 80 out tokens");
    expect(errors).toEqual([]);
  });

  test("used-up credits (HTTP 402) are explained", async ({ page }) => {
    await mockHuggingFace(page, "", { status: 402 });
    await page.reload();
    await page.click(".ai-toggle");
    await page.fill(".ai-chat textarea", "Review");
    await page.click(".ai-chat button[type=submit]");
    await expect(page.locator(".ai-msg.error")).toContainText("Inference Providers credits");
  });
});
