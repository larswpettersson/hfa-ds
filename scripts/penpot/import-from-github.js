/**
 * Penpot MCP execute_code — import tokens from published hfa-ds GitHub repo.
 * Connect HFA DS, Bowtie, HTA, STPA, or RBD and paste this file.
 */
function flattenSet(setNode, prefix) {
  var out = [];
  prefix = prefix || "";
  Object.keys(setNode).forEach(function (key) {
    if (key.charAt(0) === "$") return;
    var name = prefix ? prefix + "." + key : key;
    var node = setNode[key];
    if (node && typeof node === "object" && "$value" in node && "$type" in node) {
      if (name === "foreground") name = "foreground.base";
      if (name === "background") name = "background.base";
      out.push({ name: name, type: node.$type, value: node.$value });
    } else if (node && typeof node === "object") {
      out.push.apply(out, flattenSet(node, name));
    }
  });
  return out;
}

function resolveAliases(flat) {
  var byName = {};
  flat.forEach(function (t) { byName[t.name] = t; });
  function resolve(value, depth) {
    depth = depth || 0;
    if (depth > 8 || typeof value !== "string") return value;
    var m = value.match(/^\{([^}]+)\}$/);
    if (!m) return value;
    var ref = byName[m[1]];
    return ref ? resolve(ref.value, depth + 1) : value;
  }
  return flat.map(function (t) {
    return { name: t.name, type: t.type, value: resolve(t.value) };
  });
}

function importFromJson(TOKEN_SETS) {
  function removeLegacyTokens(set) {
    var removed = [];
    ["foreground", "background"].forEach(function (legacyName) {
      var legacy = set.tokens.find(function (t) {
        return t.name === legacyName;
      });
      if (legacy) {
        try { legacy.remove(); removed.push(legacyName); } catch (_) {}
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
    var added = [], updated = [], skipped = [];
    defs.forEach(function (def) {
      var t = set.tokens.find(function (x) {
        return x.name === def.name && x.type === def.type;
      });
      if (!t) {
        try {
          set.addToken({ type: def.type, name: def.name, value: def.value });
          added.push(def.name);
        } catch (e) {
          skipped.push({ name: def.name, error: String(e).slice(0, 120) });
        }
      } else if (JSON.stringify(t.value) !== JSON.stringify(def.value)) {
        t.value = def.value;
        updated.push(def.name);
      }
    });
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
    step: "import-from-github",
    legacyRemoved: legacyRemoved,
    lightResult: lightResult,
    darkResult: darkResult,
    bareForegroundStillDefined: !!penpotUtils.findTokenByName("foreground"),
    foregroundBase: penpotUtils.findTokenByName("foreground.base"),
    brandPrimarySubtle: penpotUtils.findTokenByName("brand.primary.subtle"),
    activeSets: penpot.library.local.tokens.sets.filter(function (s) { return s.active; }).map(function (s) { return s.name; }),
    tokenOverview: penpotUtils.tokenOverview(),
  };
}

var TOKENS_URL = "https://raw.githubusercontent.com/larswpettersson/hfa-ds/main/tokens.json";

return fetch(TOKENS_URL)
  .then(function (r) {
    if (!r.ok) throw new Error("Fetch failed: " + r.status);
    return r.json();
  })
  .then(function (json) {
    var TOKEN_SETS = {
      "mode/light": resolveAliases(flattenSet(json["mode/light"])),
      "mode/dark": resolveAliases(flattenSet(json["mode/dark"])),
    };
    storage.hfaDsTokenSets = TOKEN_SETS;
    return importFromJson(TOKEN_SETS);
  })
  .catch(function (e) {
    if (storage.hfaDsTokenSets) return importFromJson(storage.hfaDsTokenSets);
    return { error: String(e.message || e), hint: "Paste import-bundle.js offline or reconnect network" };
  });
