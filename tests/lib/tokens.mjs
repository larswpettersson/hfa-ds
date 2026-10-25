import { loadTokensJson, prepareSet } from "../../scripts/build/token-utils.mjs";

const cssVarName = (name) => "--" + name.replace(/\./g, "-").replace(/_/g, "-");

/** { "--info": "#007FFF", … } for the colour tokens of one set ("mode/light" | "mode/dark"). */
export function colourTokens(setName) {
  const out = {};
  for (const t of prepareSet(setName, loadTokensJson())) if (t.type === "color") out[cssVarName(t.name)] = String(t.value).toUpperCase();
  return out;
}
