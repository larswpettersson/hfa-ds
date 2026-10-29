import { test, expect } from "@playwright/test";
import { tool, toolExists } from "../lib/tools.mjs";
import { openTool, setEditor, getEditorJson } from "../lib/page.mjs";

const T = tool("stpa-workbench");
const rowIds = (page, scope) => page.locator(`${scope} tr[data-id]`).evaluateAll((trs) => trs.map((tr) => tr.dataset.id));
const sorted = (a) => [...a].sort();

test.describe("STPA workbench: safety-case tables", () => {
  let errors;
  test.beforeEach(async ({ page }) => {
    test.skip(!toolExists(T), `${T.file} not found in the workspace`);
    ({ errors } = await openTool(page, T));
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector("#scLossesBody tr");
  });
  test.afterEach(() => expect(errors).toEqual([]));

  test("AEB preset fills the four tables; only the UCA section starts collapsed", async ({ page }) => {
    expect(await rowIds(page, "#scLossesBody")).toEqual(["L1", "L2"]);
    expect(await rowIds(page, "#scHazardsBody")).toEqual(["H1", "H2"]);
    expect(await rowIds(page, "#scUcasBody")).toEqual(["UCA-1", "UCA-2", "UCA-3", "UCA-4"]);
    expect(await rowIds(page, "#scConstraintsBody")).toEqual(["SC1", "SC2"]);
    for (const [id, open] of [["scLosses", true], ["scHazards", true], ["scUcas", false], ["scConstraints", true]])
      expect(await page.locator("#" + id).evaluate((d) => d.open), id).toBe(open);
  });

  test("open/closed state survives a reload", async ({ page }) => {
    await page.locator("#scUcas > summary").click();
    await page.locator("#scLosses > summary").click();
    // <details> fires "toggle" in a later task; wait until both states are stored before reloading.
    await page.waitForFunction(() => localStorage.getItem("hfa-stpa:open:scUcas") === "true" && localStorage.getItem("hfa-stpa:open:scLosses") === "false");
    await page.reload();
    await page.waitForSelector("#scLossesBody tr", { state: "attached" });
    expect(await page.locator("#scUcas").evaluate((d) => d.open)).toBe(true);
    expect(await page.locator("#scLosses").evaluate((d) => d.open)).toBe(false);
  });

  test("selecting a UCA highlights only its trace chain, not siblings sharing a loss", async ({ page }) => {
    await page.locator("#scUcas > summary").click();
    await page.locator('#scUcasBody tr[data-id="UCA-1"]').click();
    const hl = await page.locator("#safetyCaseWrap tr.hl").evaluateAll((trs) => trs.map((tr) => tr.dataset.id));
    const dim = await page.locator("#safetyCaseWrap tr.dim").evaluateAll((trs) => trs.map((tr) => tr.dataset.id));
    expect(sorted(hl)).toEqual(["H1", "L1", "L2", "UCA-1"]);
    expect(sorted(dim)).toEqual(["H2", "SC1", "SC2", "UCA-2", "UCA-3", "UCA-4"]);
  });

  test("selecting a UCA also highlights its control action in the diagram", async ({ page }) => {
    await page.locator("#scUcas > summary").click();
    await page.locator('#scUcasBody tr[data-id="UCA-1"]').click();
    const opacity = (sel) => page.locator(sel).evaluateAll((els) => els.map((e) => [e.dataset.id || e.dataset.ids, e.style.opacity]));
    for (const sel of ["#diagram path[data-ids]", "#diagram text[data-id]"])
      expect(Object.fromEntries(await opacity(sel))).toEqual({ ca0: "0.3", ca1: "1", ca2: "0.3" });
  });

  test("clicking the same row again clears every highlight", async ({ page }) => {
    await page.locator("#scUcas > summary").click();
    const row = page.locator('#scUcasBody tr[data-id="UCA-1"]');
    await row.click();
    await row.click();
    expect(await page.locator("#safetyCaseWrap tr.hl, #safetyCaseWrap tr.dim, #safetyCaseWrap .chip.hl").count()).toBe(0);
    expect(await page.locator("#diagram [style*=opacity]").count()).toBe(0);
  });

  test("a hazard chip focuses that hazard's chain independently of its row", async ({ page }) => {
    await page.locator('#scConstraintsBody tr[data-id="SC1"] .chip[data-id="H1"]').click();
    const hl = await page.locator("#safetyCaseWrap tr.hl").evaluateAll((trs) => trs.map((tr) => tr.dataset.id));
    expect(sorted(hl)).toEqual(["H1", "L1", "L2", "SC1", "UCA-1", "UCA-3"]);
  });

  test.describe("validation of ucas", () => {
    const edit = async (page, fn) => {
      const m = await getEditorJson(page, "#editor");
      fn(m);
      await setEditor(page, "#editor", m);
    };
    const issues = (page) => page.locator("#issues").innerText();

    test("a dangling hazard reference is a warning and the tables keep rendering", async ({ page }) => {
      await edit(page, (m) => { m.hazards[0].id = "H1-RENAMED"; });
      const text = await issues(page);
      expect(text).toContain('Constraint SC1 references unknown hazard "H1"');
      expect(text).toContain('UCA UCA-1 references unknown hazard "H1"');
      expect(await rowIds(page, "#scHazardsBody")).toEqual(["H1-RENAMED", "H2"]);
    });

    test("an unknown control_action is an error and the last valid tables stay", async ({ page }) => {
      await edit(page, (m) => { m.ucas[0].control_action = "nope"; });
      expect(await issues(page)).toContain('UCA UCA-1: control_action "nope" does not exist');
      expect(await rowIds(page, "#scUcasBody")).toEqual(["UCA-1", "UCA-2", "UCA-3", "UCA-4"]);
    });

    test("an invalid type is an error", async ({ page }) => {
      await edit(page, (m) => { m.ucas[1].type = "sometimes"; });
      expect(await issues(page)).toContain('UCA UCA-2: type "sometimes" must be one of');
    });

    test("a duplicate id across sections is an error", async ({ page }) => {
      await edit(page, (m) => { m.ucas[0].id = "H1"; });
      expect(await issues(page)).toContain('Duplicate id "H1"');
    });

    test("removing the ucas array empties the table without errors", async ({ page }) => {
      await edit(page, (m) => { delete m.ucas; });
      expect(await rowIds(page, "#scUcasBody")).toEqual([]);
      expect(await page.locator("#scUcasCount").innerText()).toBe("0");
    });
  });
});
