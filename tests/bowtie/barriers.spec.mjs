import { test, expect } from "@playwright/test";
import { tool, toolExists } from "../lib/tools.mjs";
import { openTool } from "../lib/page.mjs";

// Barriers never overlap in a column, and several barriers move together (Shift+click, as in the STPA workbench).
const T = tool("bowtie");

const layout = (page) => page.evaluate(() => {
  const s = BowtieEditor.getState();
  const rowsOf = (b, leaves) => new Set(b.protects.map((t) => leaves.find((c) => c.idTagId === t)?.row).filter(Boolean));
  const overlaps = [];
  [["left", s.left.causes], ["right", s.right.consequences]].forEach(([side, leaves]) => {
    const bs = s[side].barriers;
    bs.forEach((a, i) => bs.slice(i + 1).forEach((b) => {
      if (a.col === b.col && [...rowsOf(a, leaves)].some((r) => rowsOf(b, leaves).has(r))) overlaps.push(`${a.id}/${b.id}`);
    }));
  });
  return { cols: Object.fromEntries(s.left.barriers.map((b) => [b.id, b.col])), leftCols: s.left.barrierCols, overlaps };
});
/** Click a barrier outside its id and description (those start editing). */
const clickBarrier = (page, id, modifiers = []) => page.locator(`#b-${id}`).click({ position: { x: 3, y: 3 }, modifiers });
const keys = async (page, ...ks) => { await page.evaluate(() => document.activeElement?.blur()); for (const k of ks) await page.keyboard.press(k); };

test.describe("Bowtie: barrier layout and moving several barriers", () => {
  let errors;
  test.beforeEach(async ({ page }) => {
    test.skip(!toolExists(T), `${T.file} not found in the workspace`);
    ({ errors } = await openTool(page, T));
    await page.waitForSelector("#b-p4");
  });
  test.afterEach(() => expect(errors).toEqual([]));

  test("moving a barrier into a column with several barriers swaps with all it would overlap", async ({ page }) => {
    // OSPA example: P1, P2, P3 share column 2; P4 (all causes) is column 3.
    expect((await layout(page)).cols).toEqual({ P1: 2, P2: 2, P3: 2, P4: 3 });
    await clickBarrier(page, "p4");
    await keys(page, "ArrowLeft", "Enter");
    const l = await layout(page);
    expect(l.overlaps).toEqual([]);
    expect(l.cols).toEqual({ P1: 3, P2: 3, P3: 3, P4: 2 });
  });

  test("a barrier that is made to protect more causes gives way instead of overlapping", async ({ page }) => {
    await clickBarrier(page, "p2"); // protects C3
    await keys(page, "1", "Enter"); // also C1, which P1 covers in the same column
    const l = await layout(page);
    expect(l.overlaps).toEqual([]);
    expect(l.cols.P1).toBe(2);
    expect(l.cols.P2).toBe(3); // a column of its own, right after
    expect(l.cols.P4).toBe(4);
  });

  test("Shift+click selects several barriers; ←/→ move them together; Esc clears", async ({ page }) => {
    await clickBarrier(page, "p1", ["Shift"]);
    await clickBarrier(page, "p3", ["Shift"]);
    expect((await page.evaluate(() => BowtieEditor.getSelection())).barrierIds.sort()).toEqual(["p1", "p3"]);
    await expect(page.locator(".barrier.is-multi-selected")).toHaveCount(2);

    await keys(page, "ArrowRight");
    let l = await layout(page);
    expect(l.overlaps).toEqual([]);
    expect(l.cols.P1).toBe(l.cols.P3);
    expect(l.cols.P1).toBeGreaterThan(l.cols.P4); // moved past P4, which they overlap
    expect(l.cols.P2).toBe(2);

    await keys(page, "ArrowLeft");
    l = await layout(page);
    expect(l.overlaps).toEqual([]);
    expect(l.cols.P1).toBeLessThan(l.cols.P4);

    await clickBarrier(page, "p3", ["Shift"]); // take one out again
    expect((await page.evaluate(() => BowtieEditor.getSelection())).barrierIds).toEqual(["p1"]);
    await keys(page, "Escape");
    await expect(page.locator(".barrier.is-multi-selected")).toHaveCount(0);
  });

  test("moving barriers from both sides of the top event warns and moves nothing (principle 5.4)", async ({ page }) => {
    const before = await page.evaluate(() => BowtieEditor.getState());
    await clickBarrier(page, "p1", ["Shift"]);
    await clickBarrier(page, "r1", ["Shift"]);
    await keys(page, "ArrowRight");
    await expect(page.locator("#statusMessage")).toHaveClass(/show warning/);
    await expect(page.locator("#statusMessage")).toContainText("cannot be moved together");
    const after = await page.evaluate(() => BowtieEditor.getState());
    expect(after.left.barriers.map((b) => b.col)).toEqual(before.left.barriers.map((b) => b.col));
    expect(after.right.barriers.map((b) => b.col)).toEqual(before.right.barriers.map((b) => b.col));
    // The selection stays, so the barrier that does not belong can be taken out.
    expect((await page.evaluate(() => BowtieEditor.getSelection())).barrierIds.sort()).toEqual(["p1", "r1"]);
    await clickBarrier(page, "r1", ["Shift"]);
    await keys(page, "ArrowRight");
    expect((await layout(page)).cols.P1).toBeGreaterThan(2);
  });

  test("a file with overlapping barriers is laid out when it is opened", async ({ page }) => {
    await page.evaluate(() => {
      const s = BowtieEditor.getState();
      s.left.barriers.find((b) => b.id === "P2").protects = ["id-C1", "id-C3"]; // overlaps P1 in column 2
      BowtieEditor.replaceState(s);
    });
    const l = await layout(page);
    expect(l.overlaps).toEqual([]);
    expect(l.leftCols).toBe(3);
  });
});
