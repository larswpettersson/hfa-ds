#!/usr/bin/env node
/** Validate tokens.json structure and print summary. */
import { loadTokensJson, prepareAllSets } from "./token-utils.mjs";

const json = loadTokensJson();
const prepared = prepareAllSets(json);

for (const setName of ["mode/light", "mode/dark"]) {
  const tokens = prepared[setName];
  const names = new Set(tokens.map((t) => t.name));
  if (names.has("foreground")) {
    console.error(`FAIL: ${setName} still has bare 'foreground'`);
    process.exit(1);
  }
  if (!names.has("foreground.base")) {
    console.error(`FAIL: ${setName} missing foreground.base`);
    process.exit(1);
  }
  if (!names.has("brand.primary.subtle")) {
    console.error(`FAIL: ${setName} missing brand.primary.subtle`);
    process.exit(1);
  }
  console.log(`${setName}: ${tokens.length} tokens OK`);
}

console.log("tokens.json validation passed");
