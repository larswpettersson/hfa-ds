#!/usr/bin/env node
// Copies the AI panel (scripts/ai-panel/ai-assist.js) into every tool that uses it.
//   node scripts/ai-panel/sync.mjs           copy it
//   node scripts/ai-panel/sync.mjs --check   only compare; exit 1 if a copy differs
// The tools are found next to hfa-ds, or under HFA_WORKSPACE. A tool that is not there is skipped.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const source = path.join(here, "ai-assist.js");
const workspace = process.env.HFA_WORKSPACE || path.resolve(here, "../../..");

// Add a tool here when it starts using the panel.
export const TARGETS = [
  { repo: "hfa-hta", file: "scripts/ai-assist.js" },
  { repo: "hfa-bowtie", file: "scripts/ai-assist.js" },
  { repo: "hfa-stpa", file: "workbench/ai-assist.js" },
].map((t) => ({ ...t, path: path.join(workspace, t.repo, t.file) }));

const check = process.argv.includes("--check");
const canonical = fs.readFileSync(source, "utf8");
let differs = 0;
for (const t of TARGETS) {
  if (!fs.existsSync(path.dirname(t.path))) { console.log(`skipped  ${t.repo} (not found in ${workspace})`); continue; }
  const same = fs.existsSync(t.path) && fs.readFileSync(t.path, "utf8") === canonical;
  if (same) { console.log(`equal    ${t.repo}/${t.file}`); continue; }
  if (check) { differs++; console.log(`DIFFERS  ${t.repo}/${t.file}`); continue; }
  fs.writeFileSync(t.path, canonical);
  console.log(`copied   ${t.repo}/${t.file}`);
}
if (check && differs) { console.error(`\n${differs} copy/copies differ from scripts/ai-panel/ai-assist.js. Run: npm run sync:ai-panel`); process.exit(1); }
