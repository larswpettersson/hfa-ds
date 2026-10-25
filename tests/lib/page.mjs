import { pathToFileURL } from "node:url";

/** Open a tool from disk and collect console errors and uncaught exceptions. */
export async function openTool(page, t) {
  const errors = [];
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
