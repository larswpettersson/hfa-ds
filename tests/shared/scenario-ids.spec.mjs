import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/* Every Gherkin scenario in docs/design-<tool>.md has an id (@STPA-ADD-1, …). Each one that is not tagged @later must
   have a Playwright test in tests/<tool>/ whose name starts with the id. This keeps the requirements and the tests together. */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const TOOLS = [
  { doc: "design-stpa.md", dir: "stpa", prefixes: ["STPA"] },
  { doc: "design-hta.md", dir: "hta", prefixes: ["HTA"] },
  { doc: "design-bowtie.md", dir: "bowtie", prefixes: ["BOWTIE"] },
];

/** The ids of the scenarios in a design document, with whether they are postponed. */
export function scenarioIds(text) {
  const out = [];
  for (const line of text.split("\n")) {
    const tags = line.match(/@[A-Z]+(?:-[A-Z]+)*-\d+|@later/g);
    if (tags?.some((t) => t !== "@later")) out.push({ id: tags.find((t) => t !== "@later").slice(1), later: tags.includes("@later") });
  }
  return out;
}

const read = (dir) => fs.readdirSync(dir).filter((f) => f.endsWith(".mjs")).map((f) => fs.readFileSync(path.join(dir, f), "utf8")).join("\n");

for (const t of TOOLS) {
  test(`${t.doc}: every scenario has a test`, () => {
    const ids = scenarioIds(fs.readFileSync(path.join(root, "docs", t.doc), "utf8"));
    expect(ids.length).toBeGreaterThan(0);
    const tests = read(path.join(root, "tests", t.dir));
    const missing = ids.filter((s) => !s.later && !new RegExp(`["\`']${s.id}:`).test(tests)).map((s) => s.id);
    expect(missing, `scenarios without a test (name it "<id>: …" in tests/${t.dir}/ or tag the scenario @later)`).toEqual([]);
  });
}
