import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Sibling repos live next to hfa-ds in the codespace (/workspaces/<repo>); CI checks them out the same way.
export const WORKSPACE = process.env.HFA_WORKSPACE || path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

export const TOOLS = [
  { id: "stpa-workbench", file: "hfa-stpa/workbench/index.html" },
  { id: "hta", file: "hfa-hta/HTA.html" },
  { id: "hta-editor", file: "hfa-hta/hta-editor.html" },
  { id: "hta-editor2", file: "hfa-hta/hta-editor2.html" },
  { id: "bowtie", file: "hfa-bowtie/Bowtie.html" },
  { id: "rbd", file: "hfa-rbd/RBD.html" },
].map((t) => ({ ...t, path: path.join(WORKSPACE, t.file) }));

export const tool = (id) => TOOLS.find((t) => t.id === id);
export const toolExists = (t) => fs.existsSync(t.path);
