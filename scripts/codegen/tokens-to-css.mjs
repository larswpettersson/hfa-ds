#!/usr/bin/env node
/**
 * Generate CSS custom properties from tokens.json (mode/light by default).
 */
import fs from "node:fs";
import path from "node:path";
import { loadTokensJson, prepareSet, REPO_ROOT } from "../build/token-utils.mjs";

const theme = process.argv[2] || "mode/light";
const tokensJson = loadTokensJson();
const flat = prepareSet(theme, tokensJson);

const cssVarName = (name) =>
  "--" + name.replace(/\./g, "-").replace(/_/g, "-");

const lines = [`/* Generated from tokens.json (${theme}) */`, ":root {"];
for (const token of flat) {
  if (token.type !== "color") continue;
  lines.push(`  ${cssVarName(token.name)}: ${token.value};`);
}
lines.push("}", "");

const outPath = path.join(REPO_ROOT, "dist", `tokens-${theme.replace("/", "-")}.css`);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, lines.join("\n"));
console.log("Wrote", outPath);
