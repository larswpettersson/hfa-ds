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
  // Neutrals and status colours were updated in HFA DS on 2026-10-31; stpa-workbench still has the old values.
  knownDrift: {
    light: {
      "--bg": { tool: "#F0F6FC", token: "#EAF0F6" },
      "--bg-elev": { tool: "#FFFFFF", token: "#FAFBFC" },
      "--bg-sunken": { tool: "#E6EDF3", token: "#E0E6EC" },
      "--info": { tool: "#007FFF", token: "#18456D" },
      "--success": { tool: "#228B22", token: "#346E4E" },
      "--warning": { tool: "#B38600", token: "#6D4501" },
      "--error": { tool: "#C70039", token: "#5D1A14" },
      "--bg-error": { tool: "#FBE3E8", token: "#D79A96" },
      "--bg-warning": { tool: "#FFF6D6", token: "#FAD153" },
      "--bg-success": { tool: "#E3F3E8", token: "#B9EDC4" },
    },
    dark: {
      "--bg": { tool: "#2D333B", token: "#272C34" },
      "--bg-sunken": { tool: "#22272E", token: "#191E25" },
      "--info": { tool: "#58A6FF", token: "#94C7F5" },
      "--success": { tool: "#3FB950", token: "#B7FFC6" },
      "--warning": { tool: "#FFC300", token: "#EBCB7B" },
      "--error": { tool: "#E03E3E", token: "#EEA090" },
      "--bg-error": { tool: "#602A36", token: "#502E24" },
      "--bg-warning": { tool: "#6B5414", token: "#544A06" },
      "--bg-success": { tool: "#1A5A42", token: "#2B5945" },
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
