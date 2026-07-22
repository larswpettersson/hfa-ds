#!/usr/bin/env node
/**
 * Reads tokens.json and writes scripts/penpot/generated/import-payload.js
 * for pasting into Penpot MCP execute_code together with import-from-json.js.
 */
import fs from "node:fs";
import path from "node:path";
import { prepareAllSets, REPO_ROOT } from "./token-utils.mjs";

const outDir = path.join(REPO_ROOT, "scripts/penpot/generated");
fs.mkdirSync(outDir, { recursive: true });

const prepared = prepareAllSets();
const outPath = path.join(outDir, "import-payload.js");
const body = `// AUTO-GENERATED from tokens.json — run: npm run build:penpot
var HFA_DS_TOKEN_SETS = ${JSON.stringify(prepared, null, 2)};
`;

fs.writeFileSync(outPath, body);
console.log("Wrote", outPath);
console.log("  mode/light:", prepared["mode/light"].length, "tokens");
console.log("  mode/dark:", prepared["mode/dark"].length, "tokens");
