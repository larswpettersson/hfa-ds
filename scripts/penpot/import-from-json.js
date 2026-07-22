/**
 * Penpot MCP execute_code — import mode/light + mode/dark from HFA_DS_TOKEN_SETS.
 *
 * Usage:
 *   1. npm run build:penpot   (generates import-payload.js from tokens.json)
 *   2. Connect target Penpot file (HFA DS first, then Bowtie → HTA → STPA → RBD)
 *   3. Paste into execute_code: contents of generated/import-payload.js + this file
 *
 * Or set storage.hfaDsTokenSets manually before running this script only.
 */
function importFromJson() {
  var TOKEN_SETS = typeof HFA_DS_TOKEN_SETS !== "undefined"
    ? HFA_DS_TOKEN_SETS
    : storage.hfaDsTokenSets;

  if (!TOKEN_SETS) {
    return {
      error: "Missing HFA_DS_TOKEN_SETS. Run npm run build:penpot and paste import-payload.js first.",
    };
  }

  function removeLegacyTokens(set) {
    var removed = [];
    ["foreground", "background"].forEach(function (legacyName) {
      var legacy = set.tokens.find(function (t) {
        return t.name === legacyName && (t.type === "color" || !t.type);
      });
      if (legacy) {
        try {
          legacy.remove();
          removed.push(legacyName);
        } catch (_) {}
      }
    });
    return removed;
  }

  function ensureSet(name) {
    var catalog = penpot.library.local.tokens;
    var set = catalog.sets.find(function (s) { return s.name === name; });
    if (!set) set = catalog.addSet({ name: name });
    if (!set.active) set.toggleActive();
    return set;
  }

  function upsertTokens(set, defs) {
    var added = [];
    var updated = [];
    var skipped = [];
    for (var i = 0; i < defs.length; i++) {
      var def = defs[i];
      var t = set.tokens.find(function (x) {
        return x.name === def.name && x.type === def.type;
      });
      if (!t) {
        try {
          set.addToken({ type: def.type, name: def.name, value: def.value });
          added.push(def.name);
        } catch (e) {
          skipped.push({ name: def.name, type: def.type, error: String(e).slice(0, 140) });
        }
      } else {
        var next = def.value;
        var cur = t.value;
        if (JSON.stringify(cur) !== JSON.stringify(next)) {
          t.value = next;
          updated.push(def.name);
        }
      }
    }
    return { added: added, updated: updated, skipped: skipped };
  }

  function ensureThemes(lightSet, darkSet) {
    var catalog = penpot.library.local.tokens;
    var lightTheme = catalog.themes.find(function (t) { return t.name === "Light"; });
    var darkTheme = catalog.themes.find(function (t) { return t.name === "Dark"; });
    if (!lightTheme) lightTheme = catalog.addTheme("Mode", "Light");
    if (!darkTheme) darkTheme = catalog.addTheme("Mode", "Dark");
    try { lightTheme.addSet(lightSet); } catch (_) {}
    try { darkTheme.addSet(darkSet); } catch (_) {}
    if (darkSet.active) darkSet.toggleActive();
    if (!lightSet.active) lightSet.toggleActive();
    if (!lightTheme.active) lightTheme.toggleActive();
  }

  var lightSet = ensureSet("mode/light");
  var darkSet = ensureSet("mode/dark");
  var legacyRemoved = {
    light: removeLegacyTokens(lightSet),
    dark: removeLegacyTokens(darkSet),
  };
  var lightResult = upsertTokens(lightSet, TOKEN_SETS["mode/light"]);
  var darkResult = upsertTokens(darkSet, TOKEN_SETS["mode/dark"]);

  var globalSet = penpot.library.local.tokens.sets.find(function (s) { return s.name === "Global"; });
  if (globalSet && globalSet.active) globalSet.toggleActive();

  ensureThemes(lightSet, darkSet);

  return {
    file: penpot.currentFile && penpot.currentFile.name,
    step: "import-from-json",
    legacyRemoved: legacyRemoved,
    lightResult: lightResult,
    darkResult: darkResult,
    globalDeactivated: !!globalSet,
    activeSets: penpot.library.local.tokens.sets.filter(function (s) { return s.active; }).map(function (s) { return s.name; }),
    tokenOverview: penpotUtils.tokenOverview(),
  };
}

return importFromJson();
