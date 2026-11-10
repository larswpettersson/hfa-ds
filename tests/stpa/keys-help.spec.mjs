import { test, expect } from "@playwright/test";
import { tool, toolExists } from "../lib/tools.mjs";
import { openTool, setEditor, getEditorJson } from "../lib/page.mjs";

// Requirements: STPA-KEYS-1, STPA-KEYS-3, STPA-VIEW-1, 3 and 4 in docs/design-stpa.md.
const T = tool("stpa-workbench");
const json = (page) => getEditorJson(page, "#editor");
const node = (page, id) => page.locator(`#diagram g.node[data-sel="${id}"]`);
const MODEL = {
  system: "Keys",
  controllers: [{ id: "c1", name: "Driver" }, { id: "e1", name: "ECU" }],
  controlled_processes: [{ id: "p1", name: "Brakes", states: [] }],
  control_actions: [{ id: "ca1", source: "c1", target: "e1", action: "Request" }, { id: "ca2", source: "e1", target: "p1", action: "Brake" }],
  feedback: [{ id: "fb1", source: "e1", target: "c1", signal: "Status" }, { id: "fb2", source: "p1", target: "e1", signal: "Speed" }],
};

test.describe("STPA workbench: keys, Delete and the help dialog", () => {
  let errors;
  test.beforeEach(async ({ page }) => {
    test.skip(!toolExists(T), `${T.file} not found in the workspace`);
    await page.setViewportSize({ width: 1400, height: 900 });
    ({ errors } = await openTool(page, T));
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector("#diagram g.node");
    await setEditor(page, "#editor", MODEL);
    await page.waitForSelector('#diagram g.node[data-sel="e1"]');
    await page.locator("body").click({ position: { x: 5, y: 5 } });
  });
  test.afterEach(() => expect(errors).toEqual([]));

  test("STPA-VIEW-1: JSON-editorn och Format finns inte i gränssnittet", async ({ page }) => {
    await expect(page.locator("#editor")).toBeHidden();
    await expect(page.getByRole("button", { name: "Format" })).toHaveCount(0);
  });

  test("STPA-KEYS-1: knapparna och tangenterna gör samma sak", async ({ page }) => {
    await node(page, "c1").click();
    await page.getByRole("button", { name: /^Add Below/ }).click();
    const viaButton = await json(page);
    await page.keyboard.press("Escape"); // leave the new block's name cell
    await page.keyboard.press("ControlOrMeta+z");
    await node(page, "c1").click();
    await page.mouse.move(2, 2);
    await page.keyboard.press("b");
    const viaKey = await json(page);
    expect(viaKey).toEqual(viaButton);
  });

  test("STPA-KEYS-3: Delete tar bort markerade block med deras länkar", async ({ page }) => {
    const before = await json(page);
    await node(page, "e1").click();
    await page.keyboard.press("Delete");
    const m = await json(page);
    expect(m.controllers.map((c) => c.id)).toEqual(["c1"]);
    expect(m.control_actions || []).toEqual([]);
    expect(m.feedback || []).toEqual([]);
    await page.keyboard.press("ControlOrMeta+z");
    expect(await json(page)).toEqual(before);
  });

  test("STPA-VIEW-3: Open example… finns i hjälpdialogen", async ({ page }) => {
    await page.keyboard.press("?");
    const dlg = page.locator("#helpDlg");
    await expect(dlg).toBeVisible();
    await expect(dlg).toContainText("The underlined letter is the key. Press it alone, without Alt.");
    const example = dlg.getByLabel("Open example…");
    expect((await example.boundingBox()).height).toBeGreaterThanOrEqual(28);
    expect((await example.boundingBox()).height).toBeLessThan(34);
    await dlg.getByRole("button", { name: "Close" }).click();
    await expect(dlg).toBeHidden();
    await page.getByRole("button", { name: "Help – Keyboard shortcuts" }).click();
    await expect(dlg).toBeVisible();
  });

  test("STPA-VIEW-4: ett exempel ersätter analysen efter bekräftelse", async ({ page }) => {
    await page.keyboard.press("?");
    const messages = [];
    page.on("dialog", (d) => { messages.push(d.message()); d.accept(); });
    await page.locator("#helpDlg").getByLabel("Open example…").selectOption({ index: 1 });
    expect(messages.join(" ")).toContain("Replace");
    await expect.poll(async () => (await json(page)).system).not.toBe("Keys");
  });
});
