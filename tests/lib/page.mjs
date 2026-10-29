import { pathToFileURL } from "node:url";

// Model ids the mocked providers report; they include the ids the specs pick in the model picker.
export const MOCK_MODELS = {
  claude: [
    { id: "claude-opus-5-5", display_name: "Claude Opus 5.5" },
    { id: "claude-sonnet-5-5", display_name: "Claude Sonnet 5.5" },
    { id: "claude-haiku-4-5", display_name: "Claude Haiku 4.5" },
  ],
  gemini: [{ name: "models/gemini-2.5-pro", displayName: "Gemini 2.5 Pro", supportedGenerationMethods: ["generateContent"] }],
};

/** Answer the providers' model-list endpoints, which a tool may call on load, so tests never reach the network. */
export async function mockModelLists(page) {
  const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "GET, OPTIONS" };
  const reply = (body) => async (route) => route.request().method() === "OPTIONS"
    ? route.fulfill({ status: 204, headers: cors })
    : route.fulfill({ status: 200, headers: { ...cors, "content-type": "application/json" }, body: JSON.stringify(body) });
  await page.route("https://api.anthropic.com/v1/models?*", reply({ data: MOCK_MODELS.claude, has_more: false }));
  await page.route("https://generativelanguage.googleapis.com/v1beta/models?*", reply({ models: MOCK_MODELS.gemini }));
}

/** Open a tool from disk and collect console errors and uncaught exceptions. */
export async function openTool(page, t) {
  const errors = [];
  await mockModelLists(page);
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  await page.goto(pathToFileURL(t.path).href);
  return { errors };
}

/** Replace the contents of a JSON editor textarea and wait for the tool's debounced refresh. */
export async function setEditor(page, selector, obj, settleMs = 400) {
  await page.evaluate(([sel, text]) => {
    const ta = document.querySelector(sel);
    ta.value = text;
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  }, [selector, typeof obj === "string" ? obj : JSON.stringify(obj, null, 2)]);
  await page.waitForTimeout(settleMs);
}

/** Read the editor textarea back as parsed JSON. */
export const getEditorJson = (page, selector) => page.evaluate((sel) => JSON.parse(document.querySelector(sel).value), selector);
