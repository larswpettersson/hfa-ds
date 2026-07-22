/**
 * Shared utilities: W3C design tokens JSON ↔ flat Penpot token defs.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, "../..");
export const TOKENS_PATH = path.join(REPO_ROOT, "tokens.json");

const LEGACY_RENAMES = {
  foreground: "foreground.base",
  background: "background.base",
};

export function loadTokensJson(filePath = TOKENS_PATH) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

/** Walk nested W3C token tree → flat list for one set. */
export function flattenTokenSet(setNode, prefix = "") {
  const out = [];
  for (const [key, node] of Object.entries(setNode)) {
    if (key.startsWith("$")) continue;
    const name = prefix ? `${prefix}.${key}` : key;
    if (node && typeof node === "object" && "$value" in node && "$type" in node) {
      out.push({
        name: LEGACY_RENAMES[name] ?? name,
        type: node.$type,
        value: node.$value,
        description: node.$description ?? "",
      });
    } else if (node && typeof node === "object") {
      out.push(...flattenTokenSet(node, name));
    }
  }
  return out;
}

/** Resolve `{shared_tokens.line_styles.normal}` style references within a set. */
export function resolveAliases(flatTokens) {
  const byName = new Map(flatTokens.map((t) => [t.name, t]));
  function resolveValue(value, depth = 0) {
    if (depth > 8) return value;
    if (typeof value !== "string") return value;
    const m = value.match(/^\{([^}]+)\}$/);
    if (!m) return value;
    const ref = byName.get(m[1]);
    if (!ref) return value;
    return resolveValue(ref.value, depth + 1);
  }
  return flatTokens.map((t) => ({
    ...t,
    value: resolveValue(t.value),
  }));
}

export function prepareSet(setName, tokensJson) {
  const node = tokensJson[setName];
  if (!node) throw new Error(`Missing set: ${setName}`);
  return resolveAliases(flattenTokenSet(node));
}

export function prepareAllSets(tokensJson = loadTokensJson()) {
  return {
    "mode/light": prepareSet("mode/light", tokensJson),
    "mode/dark": prepareSet("mode/dark", tokensJson),
  };
}

/** Compare Penpot-style overview map vs expected flat tokens. */
export function diffOverview(overview, prepared) {
  const drift = [];
  for (const [setName, expected] of Object.entries(prepared)) {
    const actualNames = new Set((overview[setName] && Object.values(overview[setName]).flat()) || []);
    for (const t of expected) {
      if (!actualNames.has(t.name)) {
        drift.push({ set: setName, token: t.name, issue: "missing" });
      }
    }
    if (actualNames.has("foreground")) {
      drift.push({ set: setName, token: "foreground", issue: "legacy_bare_foreground" });
    }
  }
  return drift;
}
