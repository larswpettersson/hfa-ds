import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { tool, toolExists } from "../lib/tools.mjs";

/* The tools must start and work for their basic functions with nothing but local files: no outside scripts, fonts,
   stylesheets, images or services (architecture requirement, docs/ARCHITECTURE.md). Everything except file:, data:
   and blob: is blocked; a tool that asks for anything else fails the test. Without a provider configured the AI panel
   makes no calls, so the start is silent. */
const CASES = [
  { id: "stpa-workbench", ready: "#diagram g.node", offline: "workbench/stpa_offline.html", repo: "hfa-stpa" },
  { id: "hta", ready: ".task", offline: "hta_offline.html", repo: "hfa-hta" },
  { id: "bowtie", ready: ".card", offline: "Bowtie_offline.html", repo: "hfa-bowtie" },
];

for (const c of CASES) {
  const T = tool(c.id);
  const files = [
    { name: `${c.id}`, file: T.path },
    { name: `${c.id} (one-file version)`, file: path.join(path.dirname(T.path).replace(/workbench$/, ""), c.offline) },
  ];
  for (const f of files) {
    test(`${f.name}: starts with everything but local files blocked`, async ({ page }) => {
      test.skip(!toolExists(T) || !fs.existsSync(f.file), `${f.file} not found in the workspace`);
      const attempted = [], errors = [];
      page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
      page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
      await page.route((url) => !/^(file|data|blob):$/.test(url.protocol), (route) => { attempted.push(route.request().url()); route.abort(); });
      await page.goto(pathToFileURL(f.file).href);
      await page.waitForSelector(c.ready);
      await page.waitForTimeout(1500); // late requests, such as a model list, show up here
      expect(attempted, "the page asked for something outside local files").toEqual([]);
      expect(errors).toEqual([]);
    });
  }
}
