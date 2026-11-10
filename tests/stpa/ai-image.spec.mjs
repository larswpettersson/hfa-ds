import { test, expect } from "@playwright/test";
import { tool, toolExists } from "../lib/tools.mjs";
import { openTool } from "../lib/page.mjs";
import { mockClaude } from "../lib/claude.mjs";

// Requirements: STPA-AI-IMG-1..6 in docs/design-stpa.md. The panel is shared (ai-assist.js), so HTA and Bowtie get the same behaviour.
const T = tool("stpa-workbench");
const PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

/** Put an image file on the paste event of the question field, or on a drop on the form. */
const give = (page, how) => page.evaluate(([how, b64]) => {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const dt = new DataTransfer();
  dt.items.add(new File([bytes], "shot.png", { type: "image/png" }));
  if (how === "paste") document.querySelector(".ai-chat textarea").dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
  else document.querySelector(".ai-chat").dispatchEvent(new DragEvent("drop", { dataTransfer: dt, bubbles: true, cancelable: true }));
}, [how, PNG]);
const ask = async (page, text) => { await page.fill(".ai-chat textarea", text); await page.click(".ai-chat button[type=submit]"); };

test.describe("STPA workbench: images in the AI panel", () => {
  let errors;
  test.beforeEach(async ({ page }) => {
    test.skip(!toolExists(T), `${T.file} not found in the workspace`);
    await page.setViewportSize({ width: 1600, height: 900 });
    ({ errors } = await openTool(page, T));
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem("hfa-ai:providers", JSON.stringify({ provider: "claude", claude_key: "test-key" }));
    });
    await page.reload();
    await page.waitForSelector("#diagram g.node");
  });
  test.afterEach(() => expect(errors).toEqual([]));

  test("STPA-AI-IMG-1: ett inklistrat skärmklipp visas som miniatyr", async ({ page }) => {
    await page.fill(".ai-chat textarea", "What is this?");
    await give(page, "paste");
    await expect(page.locator(".ai-attach img")).toBeVisible();
    await expect(page.locator(".ai-attach button")).toBeVisible();
    await expect(page.locator(".ai-chat textarea")).toHaveValue("What is this?");
  });

  test("STPA-AI-IMG-2: en indragen bildfil visas som miniatyr", async ({ page }) => {
    await give(page, "drop");
    await expect(page.locator(".ai-attach img")).toBeVisible();
  });

  test("STPA-AI-IMG-3: ✕ tar bort bilden", async ({ page }) => {
    const bodies = await mockClaude(page, "Answer.");
    await give(page, "paste");
    await page.getByRole("button", { name: "Remove the image" }).click();
    await expect(page.locator(".ai-attach")).toBeHidden();
    await ask(page, "No image please");
    await expect(page.locator(".ai-msg.assistant").last()).toContainText("Answer.");
    expect(JSON.stringify(bodies[0].messages)).not.toContain('"image"');
  });

  test("STPA-AI-IMG-4: bilden skickas med frågan och bara den", async ({ page }) => {
    const bodies = await mockClaude(page, "Answer.");
    await give(page, "paste");
    await ask(page, "Look at this");
    await expect(page.locator(".ai-msg.assistant").last()).toContainText("Answer.");
    await expect(page.locator(".ai-attach")).toBeHidden();
    const content = bodies[0].messages.at(-1).content;
    expect(content[0]).toMatchObject({ type: "image", source: { type: "base64", media_type: "image/png" } });
    expect(content[1].text).toContain("Look at this");
    // a follow-up with earlier turns carries no image, and the export has none
    await page.check(".ai-scope input[type=checkbox]");
    await ask(page, "And now?");
    await expect(page.locator(".ai-msg.assistant")).toHaveCount(3);
    expect(JSON.stringify(bodies[1].messages)).not.toContain('"image"');
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Export .md" }).click()]);
    const text = await (await import("node:fs/promises")).readFile(await download.path(), "utf8");
    expect(text).not.toContain(PNG);
  });

  test("STPA-AI-IMG-5: det framgår vad som lämnar datorn", async ({ page }) => {
    await give(page, "paste");
    await expect(page.locator(".ai-attach .note")).toContainText("Sent to");
    await expect(page.locator(".ai-attach .note")).toContainText("Not saved");
  });

  test("STPA-AI-IMG-6: en leverantör utan bildstöd avvisar bilden", async ({ page }) => {
    await page.route("http://localhost:11434/**", (route) => route.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify({ data: [], models: [] }) }));
    await page.evaluate(() => localStorage.setItem("hfa-ai:providers", JSON.stringify({ provider: "local", local_model: "llama3.1" })));
    await page.reload();
    await page.waitForSelector("#diagram g.node");
    await give(page, "paste");
    await expect(page.locator(".ai-attach")).toBeHidden();
    await expect(page.locator(".ai-status")).toContainText("does not accept images");
  });
});
