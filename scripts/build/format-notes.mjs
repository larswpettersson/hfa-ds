#!/usr/bin/env node
// Writes each tool's format note (design principles 4.15) as "$comment" at the top of the tool's JSON data files, so that a
// person or an AI that writes such a file without knowing the tool sees the format and its limits. The note is read from the
// tool itself (window.<Tool>Editor.formatNote), so the files and the tool cannot drift apart; tests/shared/format-notes.spec.mjs
// checks it.   node scripts/build/format-notes.mjs [--check]
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { WORKSPACE } from "../../tests/lib/tools.mjs";

export const FORMAT_FILES = [
  { tool: "hfa-bowtie/Bowtie.html", api: "BowtieEditor", dirs: ["hfa-bowtie/data", "hfa-bowtie/fixtures"] },
  { tool: "hfa-hta/HTA.html", api: "HTAEditor", dirs: ["hfa-hta/data", "hfa-hta/fixtures"] },
];

export const jsonFiles = (dirs) => dirs.flatMap((d) => {
  const dir = path.join(WORKSPACE, d);
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => path.join(dir, f)) : [];
});

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const check = process.argv.includes("--check");
  const browser = await chromium.launch();
  let stale = 0;
  for (const t of FORMAT_FILES) {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(path.join(WORKSPACE, t.tool)).href);
    const note = await page.evaluate((api) => window[api].formatNote, t.api);
    await page.close();
    for (const file of jsonFiles(t.dirs)) {
      const text = fs.readFileSync(file, "utf8");
      const data = JSON.parse(text);
      const { $comment, ...rest } = data;
      const next = JSON.stringify({ $comment: note, ...rest }, null, 2) + "\n";
      if (next === text) continue;
      stale++;
      if (check) console.log(`stale: ${path.relative(WORKSPACE, file)}`);
      else { fs.writeFileSync(file, next); console.log(`wrote ${path.relative(WORKSPACE, file)}`); }
    }
  }
  await browser.close();
  if (check && stale) process.exit(1);
}
