#!/usr/bin/env node
// Builds a one-file version of a tool: every <script src="…"></script> on a line of its own is replaced by the script's text.
//   node scripts/build/inline-offline.mjs <tool.html> <output.html>
import fs from "node:fs";
import path from "node:path";

const [input, output] = process.argv.slice(2);
if (!input || !output) { console.error("usage: inline-offline.mjs <tool.html> <output.html>"); process.exit(2); }
const base = path.dirname(input);
const html = fs.readFileSync(input, "utf8").replace(/^([ \t]*)<script src="([^"]+)"><\/script>/gm, (_, indent, src) =>
  `${indent}<script>\n${fs.readFileSync(path.join(base, src), "utf8")}\n</script>`);
fs.writeFileSync(output, html);
console.log(`${output}: ${html.length} bytes`);
