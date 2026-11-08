import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test, expect } from "@playwright/test";
import { WORKSPACE } from "../lib/tools.mjs";

// The AI panel has one source, hfa-ds/scripts/ai-panel/ai-assist.js. Every tool holds a copy (npm run sync:ai-panel);
// a tool differs only in how it mounts the panel (docs/arkitektur.md, "AI-panelen").
const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../scripts/ai-panel/ai-assist.js");
const COPIES = ["hfa-hta/scripts/ai-assist.js", "hfa-bowtie/scripts/ai-assist.js", "hfa-stpa/workbench/ai-assist.js"];

for (const rel of COPIES) {
  test(`${rel} is identical to the source`, () => {
    const file = path.join(WORKSPACE, rel);
    test.skip(!fs.existsSync(file), `${rel} not found in the workspace`);
    expect(fs.readFileSync(file, "utf8"), "run `npm run sync:ai-panel` in hfa-ds").toBe(fs.readFileSync(source, "utf8"));
  });
}
