#!/usr/bin/env node
// Checks HFA colour tokens against the CVD and projector rules in SKILL.md.
//
//   node check-colors.mjs [tokens.json]          # default: repo tokens.json
//   node check-colors.mjs --stdin < colors.json  # {"mode/light": {"error": "#C70039", ...}, ...}
//
// Exit code 1 if any rule fails.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const RULES = {
  statusDeltaL: { light: 15, dark: 15 },     // ΔL* between error and success foregrounds
  statusBgDeltaL: { light: 15, dark: 8 },    // ΔL* between error and success backgrounds
  textContrast: 7,                           // foreground.base on every background.*
  statusTextContrast: 4.5,                   // status foregrounds on neutral backgrounds
  hueDeltaE: { light: 0.08, dark: 0.08 },    // OKLab ΔE between status foregrounds (chromatic visions)
  bgHueDeltaE: { light: 0.08, dark: 0.06 },  // OKLab ΔE between status backgrounds (chromatic visions)
};

const STATUS = ["info", "success", "warning", "error"];

// Machado, Oliveira & Fernandes (2009), severity 1.0, applied in linear RGB.
const VISIONS = {
  normal: null,
  protanopia: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  tritanopia: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
  achromatopsia: "gray",
};

const toLin = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const hexToLin = (h) => [1, 3, 5].map((i) => toLin(parseInt(h.slice(i, i + 2), 16) / 255));
const clamp = (v) => Math.min(1, Math.max(0, v));
const Y = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const Lstar = (y) => (y > 216 / 24389 ? 116 * Math.cbrt(y) - 16 : (24389 / 27) * y);
const contrast = (a, b) => {
  const [hi, lo] = [Y(a), Y(b)].sort((p, q) => q - p);
  return (hi + 0.05) / (lo + 0.05);
};
const oklab = ([r, g, b]) => {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
};
const deltaE = (a, b) => Math.hypot(...oklab(a).map((v, i) => v - oklab(b)[i]));

function simulate(lin, vision) {
  const m = VISIONS[vision];
  if (!m) return lin;
  if (m === "gray") return [Y(lin), Y(lin), Y(lin)];
  return m.map((row) => clamp(row[0] * lin[0] + row[1] * lin[1] + row[2] * lin[2]));
}

function loadModes() {
  const args = process.argv.slice(2);
  const raw = args.includes("--stdin")
    ? readFileSync(0, "utf8")
    : readFileSync(args[0] ?? resolve(dirname(fileURLToPath(import.meta.url)), "../../../tokens.json"), "utf8");
  const modes = {};
  for (const [set, tokens] of Object.entries(JSON.parse(raw))) {
    if (set.startsWith("$") || typeof tokens !== "object") continue;
    const flat = {};
    for (const [name, t] of Object.entries(tokens)) {
      const v = typeof t === "string" ? t : t?.$value;
      if (typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v)) flat[name] = v;
    }
    modes[set] = flat;
  }
  return modes;
}

let failures = 0;
const row = (ok, text) => {
  if (!ok) failures++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${text}`);
};

for (const [set, c] of Object.entries(loadModes())) {
  const theme = set.includes("dark") ? "dark" : "light";
  console.log(`\n== ${set} (${theme})`);
  const col = (name, vision) => simulate(hexToLin(c[name]), vision);

  for (const [err, ok, dl] of [
    ["error", "success", RULES.statusDeltaL[theme]],
    ["background.error", "background.success", RULES.statusBgDeltaL[theme]],
  ]) {
    if (!c[err] || !c[ok]) continue;
    console.log(` ${err} vs ${ok}`);
    for (const v of Object.keys(VISIONS)) {
      const le = Lstar(Y(col(err, v))), ls = Lstar(Y(col(ok, v)));
      const d = Math.abs(ls - le);
      row(d >= dl, `${v.padEnd(13)} L* ${le.toFixed(1)}/${ls.toFixed(1)}  |ΔL*| ${d.toFixed(1)} (≥${dl})`);
    }
  }

  if (c["foreground.base"]) {
    console.log(" foreground.base on backgrounds (worst vision)");
    for (const bg of Object.keys(c).filter((k) => k.startsWith("background."))) {
      const worst = Math.min(...Object.keys(VISIONS).map((v) => contrast(col("foreground.base", v), col(bg, v))));
      row(worst >= RULES.textContrast, `${bg.padEnd(22)} ${worst.toFixed(2)}:1 (≥${RULES.textContrast})`);
    }
  }

  const neutrals = ["background.base", "background.elevated", "background.sunken"].filter((n) => c[n]);
  if (neutrals.length) {
    console.log(" status foregrounds on neutral backgrounds (worst vision)");
    for (const s of STATUS.filter((n) => c[n]))
      for (const bg of neutrals) {
        const worst = Math.min(...Object.keys(VISIONS).map((v) => contrast(col(s, v), col(bg, v))));
        row(worst >= RULES.statusTextContrast, `${s.padEnd(8)} on ${bg.padEnd(20)} ${worst.toFixed(2)}:1 (≥${RULES.statusTextContrast})`);
      }
  }

  for (const prefix of ["", "background."]) {
    const names = STATUS.map((s) => prefix + s).filter((n) => c[n]);
    if (names.length < 2) continue;
    const minDE = (prefix ? RULES.bgHueDeltaE : RULES.hueDeltaE)[theme];
    console.log(` ${prefix || "foreground "}status colours, min OKLab ΔE per vision`);
    for (const v of Object.keys(VISIONS).filter((v) => v !== "achromatopsia")) {
      let min = Infinity, pair = "";
      for (let i = 0; i < names.length; i++)
        for (let j = i + 1; j < names.length; j++) {
          const d = deltaE(col(names[i], v), col(names[j], v));
          if (d < min) [min, pair] = [d, `${names[i]}/${names[j]}`];
        }
      row(min >= minDE, `${v.padEnd(13)} ${min.toFixed(3)} (≥${minDE})  closest: ${pair}`);
    }
  }
}

console.log(failures ? `\n${failures} failing check(s)` : "\nAll checks pass");
process.exit(failures ? 1 : 0);
