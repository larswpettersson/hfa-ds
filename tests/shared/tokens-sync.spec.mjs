import { test, expect } from "@playwright/test";
import { tool, toolExists } from "../lib/tools.mjs";
import { openTool } from "../lib/page.mjs";
import { colourTokens } from "../lib/tokens.mjs";

/* Tools copy the HFA DS colours into their own CSS variables. This compares those copies with tokens.json.
   `map` is tool variable → token variable; variables without a token (e.g. --border) are left out.
   KNOWN_DRIFT records differences that exist today, so the suite starts green: a NEW difference fails,
   and so does an entry that has been fixed (delete it from the list). */
const SYNC = [{
  tool: "stpa-workbench",
  map: {
    "--bg": "--background-base", "--bg-elev": "--background-elevated", "--bg-sunken": "--background-sunken",
    "--fg": "--foreground-base", "--fg-muted": "--foreground-muted", "--fg-subtle": "--foreground-subtle",
    "--brand": "--brand-primary", "--brand-subtle": "--brand-primary-subtle", "--on-brand": "--brand-on-primary",
    "--info": "--info", "--success": "--success", "--warning": "--warning", "--error": "--error",
    "--bg-error": "--background-error", "--bg-warning": "--background-warning", "--bg-success": "--background-success",
  },
  knownDrift: {
    light: {
      "--warning": { tool: "#B38600", token: "#FFC300" },
      "--bg-error": { tool: "#FBE3E8", token: "#C96B6B" },
      "--bg-warning": { tool: "#FFF6D6", token: "#D4BD52" },
      "--bg-success": { tool: "#E3F3E8", token: "#6BAF8A" },
    },
    dark: {
      "--bg-sunken": { tool: "#22272E", token: "#000000" },
    },
  },
}];

for (const s of SYNC) {
  for (const [mode, setName] of [["light", "mode/light"], ["dark", "mode/dark"]]) {
    test(`${s.tool}: ${mode} colours match tokens.json`, async ({ page }) => {
      const t = tool(s.tool);
      test.skip(!toolExists(t), `${t.file} not found in the workspace`);
      await openTool(page, t);
      const actual = await page.evaluate(([theme, vars]) => {
        document.documentElement.dataset.theme = theme;
        const cs = getComputedStyle(document.documentElement);
        return Object.fromEntries(vars.map((v) => [v, cs.getPropertyValue(v).trim().toUpperCase()]));
      }, [mode, Object.keys(s.map)]);

      const tokens = colourTokens(setName);
      const drift = {};
      for (const [toolVar, tokenVar] of Object.entries(s.map)) {
        expect(tokens[tokenVar], `${tokenVar} is missing from tokens.json (${setName})`).toBeTruthy();
        if (actual[toolVar] !== tokens[tokenVar]) drift[toolVar] = { tool: actual[toolVar], token: tokens[tokenVar] };
      }
      expect(drift).toEqual(s.knownDrift[mode]);
    });
  }
}
