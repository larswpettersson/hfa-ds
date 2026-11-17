import { test, expect } from "@playwright/test";
import { tool, toolExists } from "../lib/tools.mjs";
import fs from "node:fs";
import path from "node:path";
import { openTool } from "../lib/page.mjs";
import { WORKSPACE } from "../lib/tools.mjs";

// Requirements: BOWTIE-FOCUS-1, BOWTIE-EDIT-1, 2, BOWTIE-TEXT-4 to 10 and BOWTIE-FILE-1, 2 in docs/design-bowtie.md (5.11 of the design principles).
const T = tool("bowtie");
const press = async (page, ...ks) => { for (const k of ks) await page.keyboard.press(k); };
const description = (page, id) => page.evaluate((id) => BowtieEditor.getState().left.causes.find((c) => c.id === id).description, id);
const edit = async (page, id, text) => {
  await page.locator(`#c-${id} .id-tag`).click();
  await press(page, "Enter", "ControlOrMeta+a");
  await page.keyboard.type(text);
};

test.describe("Bowtie: focus, edit transitions and the longest text", () => {
  let errors;
  test.beforeEach(async ({ page }) => {
    test.skip(!toolExists(T), `${T.file} not found in the workspace`);
    await page.setViewportSize({ width: 2100, height: 1000 });
    ({ errors } = await openTool(page, T));
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector("#b-p4");
    await page.mouse.move(2, 2);
  });
  test.afterEach(() => expect(errors).toEqual([]));

  test("BOWTIE-FOCUS-1: after a click on a block's text, Enter edits the block and does not send the AI question", async ({ page }) => {
    await page.evaluate(() => localStorage.setItem("hfa-ai:providers", JSON.stringify({ provider: "claude", claude_key: "test-key" })));
    await page.reload();
    await page.waitForSelector(".card");
    const field = page.locator(".ai-chat textarea");
    await field.fill("ett utkast");
    await field.focus();
    await page.locator("#c-C1 .desc-text").click();
    await expect(page.locator("#c-C1")).toHaveClass(/is-selected/);
    await press(page, "Enter");
    expect(await page.evaluate(() => document.activeElement?.dataset.role)).toBe("description");
    await expect(field).toHaveValue("ett utkast"); // the draft is still there and nothing was sent
    await expect(page.locator(".ai-msg.user")).toHaveCount(0);
  });

  test("BOWTIE-EDIT-1: an edit that follows an Enter-confirmed edit is kept when the user clicks another block", async ({ page }) => {
    await edit(page, "C1", "Första");
    await press(page, "Enter");
    await edit(page, "C2", "Andra");
    await page.locator("#c-C3 .desc-text").click(); // a click elsewhere confirms the edit
    expect(await description(page, "C1")).toBe("Första");
    expect(await description(page, "C2")).toBe("Andra");
    await expect(page.locator("#c-C3")).toHaveClass(/is-selected/);
  });

  test("BOWTIE-EDIT-2: Tab confirms the edit and does not lose it", async ({ page }) => {
    await edit(page, "C1", "Med Tab");
    await press(page, "Tab");
    expect(await description(page, "C1")).toBe("Med Tab");
  });

  test("BOWTIE-TEXT-4: the longest text is 300 characters; a paste is cut and a warning says so", async ({ page }) => {
    await page.locator("#c-C1 .id-tag").click();
    await press(page, "Enter", "ControlOrMeta+a");
    await page.keyboard.insertText("y".repeat(400));
    await press(page, "Enter");
    expect((await description(page, "C1")).length).toBe(300);
    await expect(page.locator("#statusMessage")).toContainText("Refer to another document");
  });

  test("BOWTIE-TEXT-5: from 240 characters a warning recommends referring to another document", async ({ page }) => {
    await page.locator("#c-C1 .id-tag").click();
    await press(page, "Enter", "ControlOrMeta+a");
    await page.keyboard.insertText("z".repeat(239));
    await expect(page.locator("#statusMessage")).not.toHaveClass(/show/);
    await page.keyboard.insertText("z");
    await expect(page.locator("#statusMessage")).toHaveClass(/warning/);
    await expect(page.locator("#statusMessage")).toContainText("240 of 300");
  });

  test("BOWTIE-TEXT-6: the tooltip is an ARIA tooltip, also in link mode, and Esc dismisses it", async ({ page }) => {
    await page.evaluate(() => {
      const st = BowtieEditor.getState();
      st.left.causes[0].description = "Ord ".repeat(40).trim();
      BowtieEditor.replaceState(st);
    });
    await page.locator("#b-p3").click({ position: { x: 3, y: 3 } }); // link mode: the mouse sets no indication
    await page.locator("#c-C1").hover();
    const tip = page.locator('[role="tooltip"]');
    await expect(tip).toBeVisible();
    expect(await page.locator("#c-C1").getAttribute("aria-describedby")).toBe(await tip.getAttribute("id"));
    await press(page, "Escape");
    await expect(tip).toBeHidden();
    expect(await page.locator("#c-C1").getAttribute("aria-describedby")).toBeNull();
  });

  test("BOWTIE-TEXT-7: any element with data-tip gets a tooltip", async ({ page }) => {
    await page.evaluate(() => document.querySelector('[data-action="undo"]').setAttribute("data-tip", "Ångra senaste ändringen"));
    await page.locator('[data-action="undo"]').hover();
    await expect(page.locator('[role="tooltip"]')).toHaveText("Ångra senaste ändringen");
    await page.mouse.move(2, 2);
    await expect(page.locator('[role="tooltip"]')).toBeHidden();
  });

  const setC1 = (page, text) => page.evaluate((t) => {
    const st = BowtieEditor.getState();
    st.left.causes.find((c) => c.id === "C1").description = t;
    BowtieEditor.replaceState(st);
  }, text);
  const tip = (page) => page.locator('[role="tooltip"]');

  test("BOWTIE-TEXT-8: a text of many short lines fits: the tooltip's height is capped and it scrolls", async ({ page }) => {
    await setC1(page, "x\n".repeat(149) + "xx"); // exactly 300 characters, 150 lines
    await page.locator("#c-C1").hover({ position: { x: 10, y: 5 } });
    await expect(tip(page)).toBeVisible();
    const m = await tip(page).evaluate((e) => { const r = e.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, h: r.height, sh: e.scrollHeight, ch: e.clientHeight, vh: innerHeight }; });
    expect(m.h).toBeLessThanOrEqual(m.vh * 0.4 + 1);
    expect(m.top).toBeGreaterThanOrEqual(0);
    expect(m.bottom).toBeLessThanOrEqual(m.vh);
    expect(m.sh).toBeGreaterThan(m.ch); // the rest is reached by scrolling the tooltip
    // The card itself shows at most 5 lines with "..." and stays well inside the window.
    const card = await page.locator("#c-C1").boundingBox();
    expect(card.height).toBeLessThan(m.vh / 2);
    expect(await page.locator("#c-C1 .desc-text").textContent()).toBe("x\nx\nx\nx\nx...");
  });

  test("BOWTIE-TEXT-9: a text over 300 characters from a file is shown whole in the tooltip", async ({ page }) => {
    const long = "a".repeat(350) + "END";
    await setC1(page, long);
    await page.locator("#c-C1").hover();
    await expect(tip(page)).toHaveText(long);
  });

  test("BOWTIE-TEXT-10: the pointer can rest on the tooltip; focus leaving the element hides it; other descriptions are kept", async ({ page }) => {
    await page.evaluate(() => { const b = document.querySelector('[data-action="undo"]'); b.setAttribute("data-tip", "Ångra"); b.setAttribute("aria-describedby", "other"); });
    const undo = page.locator('[data-action="undo"]');
    await undo.hover();
    await expect(tip(page)).toBeVisible();
    expect(await undo.getAttribute("aria-describedby")).toBe("other hfaTooltip");
    const b = await tip(page).boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 4 });
    await expect(tip(page)).toBeVisible(); // still there with the pointer on it
    await page.mouse.move(2, 2);
    await expect(tip(page)).toBeHidden();
    expect(await undo.getAttribute("aria-describedby")).toBe("other");
    await undo.focus();
    await expect(tip(page)).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(tip(page)).toBeHidden();
    expect(await undo.getAttribute("aria-describedby")).toBe("other");
  });

  test("BOWTIE-FILE-1: Save writes the format note first, and opening a file with it works", async ({ page }) => {
    const [download] = await Promise.all([page.waitForEvent("download"), page.click('[data-action="exportState"]')]);
    const saved = JSON.parse(fs.readFileSync(await download.path(), "utf8"));
    expect(Object.keys(saved)[0]).toBe("$comment");
    expect(saved.$comment).toEqual(await page.evaluate(() => BowtieEditor.formatNote));
    expect(saved.$comment.join(" ")).toContain("at most 300 characters");
  });

  test("BOWTIE-FILE-2: the data files carry the same format note as the tool", async ({ page }) => {
    const note = await page.evaluate(() => BowtieEditor.formatNote);
    expect(note?.length).toBeGreaterThan(2);
    for (const dir of ["data", "fixtures"]) {
      const d = path.join(WORKSPACE, "hfa-bowtie", dir);
      for (const f of fs.readdirSync(d).filter((f) => f.endsWith(".json"))) {
        expect(JSON.parse(fs.readFileSync(path.join(d, f), "utf8")).$comment, `${dir}/${f}: run node scripts/build/format-notes.mjs`).toEqual(note);
      }
    }
  });

  test("BOWTIE-FILE-3: opening a file with a text over 300 characters warns, and keeps the text", async ({ page }) => {
    const st = await page.evaluate(() => BowtieEditor.getState());
    st.left.causes[0].description = "b".repeat(320);
    let message = "";
    page.on("dialog", (d) => { message = d.message(); d.accept(); });
    await page.setInputFiles("#import-state-file", { name: "long.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(st)) });
    await expect.poll(() => message).toContain("longest text is 300");
    await expect.poll(() => page.evaluate(() => BowtieEditor.getState().left.causes[0].description.length)).toBe(320);
  });
});
