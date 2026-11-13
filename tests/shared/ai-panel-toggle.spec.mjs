import { test, expect } from "@playwright/test";
import { tool, toolExists } from "../lib/tools.mjs";
import { openTool } from "../lib/page.mjs";

// Design principles 4.5, 4.7, 4.9 and 4.10: the AI panel is a card under the title bar, open by default, with an icon toggle
// that has only hover and pressed and sits at the same place on the screen whether the panel is open (in its header) or
// hidden (the top right of the content area); the buttons are compact, the log actions narrow; without a provider the
// panel says so, and Send is the only primary button. The design is "Example AI-panel" in Penpot.
const TOOLS = [
  { id: "hta", ready: ".task", titlebar: ".header", content: ".main-content" },
  { id: "bowtie", ready: ".card", titlebar: ".titlebar", content: ".bowtie-application" },
  { id: "stpa-workbench", ready: "#diagram g.node", titlebar: "header", content: "#midPanel" },
];
const PROVIDERS = { provider: "claude", claude_key: "test-key" };

for (const c of TOOLS) {
  const T = tool(c.id);
  test.describe(`${c.id}: the AI panel toggle`, () => {
    let errors;
    const load = async (page, providers) => {
      await page.evaluate((p) => { localStorage.clear(); if (p) localStorage.setItem("hfa-ai:providers", JSON.stringify(p)); }, providers);
      await page.reload();
      await page.waitForSelector(c.ready);
    };
    test.beforeEach(async ({ page }) => {
      test.skip(!toolExists(T), `${T.file} not found in the workspace`);
      ({ errors } = await openTool(page, T));
    });
    test.afterEach(() => expect(errors).toEqual([]));

    test("open by default, with the toggle in the panel header", async ({ page }) => {
      await load(page, PROVIDERS);
      const toggle = page.locator(".ai-toggle");
      await expect(page.locator(".ai-panel")).toBeVisible();
      await expect(toggle).toHaveText("");
      await expect(toggle).toHaveAttribute("aria-label", "Hide AI panel");
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      await expect(page.locator(".ai-head .ai-toggle")).toHaveCount(1);
      await expect(page.locator(".ai-head button", { hasText: "✕" })).toHaveCount(0);
    });

    test("it hides the panel and floats at the top right of the content area, in the same place as in the panel header; the choice is remembered", async ({ page }) => {
      await load(page, PROVIDERS);
      const toggle = page.locator(".ai-toggle");
      const inHeader = await toggle.boundingBox();
      await toggle.click();
      await expect(page.locator(".ai-panel")).toBeHidden();
      await expect(page.locator(".ai-head .ai-toggle")).toHaveCount(0);
      await expect(page.locator(`${c.titlebar} .ai-toggle`)).toHaveCount(0);
      await expect(toggle).toHaveClass(/floating/);
      const floating = await toggle.boundingBox();
      expect(Math.abs(floating.x - inHeader.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(floating.y - inHeader.y)).toBeLessThanOrEqual(1);
      await expect(page.locator(".ai-toggle")).toHaveAttribute("aria-label", "Show AI panel");
      await expect(page.locator(".ai-toggle")).toHaveAttribute("aria-expanded", "false");
      await page.reload();
      await page.waitForSelector(c.ready);
      await expect(page.locator(".ai-panel")).toBeHidden();
      await page.click(".ai-toggle");
      await expect(page.locator(".ai-panel")).toBeVisible();
      await expect(page.locator(".ai-head .ai-toggle")).toHaveCount(1);
    });

    test("the panel is a card under the title bar, which spans the full width; the content ends before the panel", async ({ page }) => {
      await load(page, PROVIDERS);
      const box = (sel) => page.locator(sel).boundingBox();
      const bar = await box(c.titlebar), panel = await box(".ai-panel"), content = await box(c.content);
      expect(panel.y).toBeGreaterThanOrEqual(bar.y + bar.height);
      expect(bar.x + bar.width).toBeGreaterThanOrEqual(panel.x + panel.width - 1);
      expect(content.x + content.width).toBeLessThanOrEqual(panel.x);
      expect(panel.x + panel.width).toBeLessThan(page.viewportSize().width); // the host's gutter stays to the right of the card
      expect(await page.locator(".ai-panel").evaluate((e) => getComputedStyle(e).borderTopWidth)).toBe("1px");
    });

    test("Settings…, Send and the toggle are compact (28 px); Compress, Expand, Clear and Export .md are narrow (12 px text)", async ({ page }) => {
      await load(page, PROVIDERS);
      const panel = page.locator(".ai-panel");
      for (const b of [panel.locator("button", { hasText: "Settings…" }), panel.locator("button", { hasText: /^Send$/ }), panel.locator(".ai-toggle")]) {
        expect(Math.round((await b.boundingBox()).height)).toBe(28);
      }
      const narrow = panel.locator(".ai-scope .folds button");
      await expect(narrow).toHaveText(["Compress", "Expand", "Clear", "Export .md"]);
      for (const b of await narrow.all()) {
        expect((await b.boundingBox()).height).toBeLessThan(28);
        expect(await b.evaluate((e) => getComputedStyle(e).fontSize)).toBe("12px");
      }
    });

    test("while hidden, the content card has a notch in its top-right corner around the toggle, in the colours of the card and the page", async ({ page }) => {
      await load(page, PROVIDERS);
      await expect(page.locator(".ai-notch")).toHaveCount(0);
      await page.click(".ai-toggle");
      const notch = page.locator(".ai-notch");
      await expect(notch).toHaveCount(1);
      const box = (sel) => page.locator(sel).boundingBox();
      const n = await box(".ai-notch"), content = await box(c.content), toggle = await box(".ai-toggle");
      expect(Math.abs(n.x + n.width - (content.x + content.width))).toBeLessThanOrEqual(1); // on the card's corner
      expect(Math.abs(n.y - content.y)).toBeLessThanOrEqual(1);
      expect(toggle.x).toBeGreaterThan(n.x + 8); // the toggle sits inside the 60 x 48 notch
      expect(toggle.y + toggle.height).toBeLessThan(n.y + 48);
      for (const dark of [false, true]) {
        if (dark) await page.click(".theme-toggle");
        const colours = await page.evaluate((sel) => {
          const cs = (e) => getComputedStyle(e), opaque = (col) => col && col !== "transparent" && !/^rgba\(.*,\s*0\)$/.test(col);
          let behind = document.querySelector(sel).parentElement; while (behind && !opaque(cs(behind).backgroundColor)) behind = behind.parentElement;
          const svg = document.querySelector(".ai-notch svg");
          return { page: cs(svg.querySelector(".page")).fill, behind: cs(behind).backgroundColor, line: cs(svg.querySelector(".line")).stroke, card: cs(svg.querySelector(".card")).fill };
        }, c.content);
        expect(colours.page).toBe(colours.behind);
        expect(colours.line).not.toBe(colours.card);
      }
    });

    test("on a narrow screen the panel lies over the content as the same card, and the toggle keeps its place", async ({ page }) => {
      await page.setViewportSize({ width: 600, height: 900 });
      await load(page, PROVIDERS);
      const box = (sel) => page.locator(sel).boundingBox();
      const bar = await box(c.titlebar), panel = await box(".ai-panel"), inHeader = await box(".ai-toggle");
      expect(panel.y).toBeGreaterThanOrEqual(bar.y + bar.height);
      expect(panel.x + panel.width).toBeLessThan(600); // the host's gutter stays
      expect(panel.x).toBeGreaterThan(8);
      expect(await page.locator(".ai-panel").evaluate((e) => getComputedStyle(e).borderTopRightRadius)).toBe("8px");
      expect(await page.locator(c.content).evaluate((e) => getComputedStyle(e).marginRight)).toBe("0px"); // over the content, not beside it
      await page.click(".ai-toggle");
      await expect(page.locator(".ai-panel")).toBeHidden();
      const floating = await box(".ai-toggle");
      expect(Math.abs(floating.x - inHeader.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(floating.y - inHeader.y)).toBeLessThanOrEqual(1);
    });

    test("pressed is only while the mouse button is down, and there is no status look", async ({ page }) => {
      await load(page, PROVIDERS);
      const toggle = page.locator(".ai-toggle");
      const bg = () => toggle.evaluate((e) => getComputedStyle(e).backgroundColor);
      const rest = await bg();
      await toggle.hover();
      await page.mouse.down();
      const down = await bg();
      expect(down).not.toBe(rest);
      await page.mouse.up(); // the click that hides the panel
      await expect(page.locator(".ai-panel")).toBeHidden();
      await page.mouse.move(0, 0);
      expect(await bg()).toBe(rest); // the toggle looks the same whether the panel is open or hidden
    });

    test("without a provider the panel says so, Send is disabled and nothing is primary", async ({ page }) => {
      await load(page, null);
      const panel = page.locator(".ai-panel");
      await expect(panel.locator(".ai-pill")).toHaveText("No provider");
      await expect(panel.locator(".ai-pill")).toHaveClass(/warning/);
      await expect(panel.locator(".ai-noprovider")).toContainText("Open Settings");
      await expect(panel.locator(".ai-msg.welcome")).toBeHidden();
      await expect(panel.locator('.ai-chat button[type="submit"]')).toBeDisabled();
      await expect(panel.locator(".ai-chat textarea")).toBeDisabled();
      await expect(panel.locator(".ai-chat textarea")).toHaveAttribute("placeholder", /Set up a provider in Settings/);
      await expect(panel.locator("button.primary")).toHaveCount(0); // Settings… is an ordinary button; Enter sends, and Send is the primary one
    });

    test("with a provider Send is the only primary button", async ({ page }) => {
      await load(page, PROVIDERS);
      const panel = page.locator(".ai-panel");
      await expect(panel.locator(".ai-pill")).toHaveText("Claude");
      await expect(panel.locator(".ai-noprovider")).toHaveCount(0);
      await expect(panel.locator("button.primary")).toHaveCount(1);
      await expect(panel.locator("button.primary")).toHaveText("Send");
    });
  });
}
