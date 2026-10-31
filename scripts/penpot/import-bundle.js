// AUTO-GENERATED from tokens.json — regenerate with: node scripts/build/embed-for-penpot.mjs
var HFA_DS_TOKEN_SETS = {
  "mode/light": [
    { "name": "radius.round", "type": "borderRadius", "value": "999", "description": "" },
    { "name": "roboto-base", "type": "fontFamilies", "value": ["Source Sans 3", "Source Sans Pro", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"], "description": "Primary UI font stack (HFA DS)." },
    { "name": "info", "type": "color", "value": "#18456D", "description": "Action/Info – dark blue. Text on neutral backgrounds (≥4.5:1)." },
    { "name": "shared_tokens.line_styles.strong", "type": "number", "value": "3", "description": "" },
    { "name": "shared_tokens.line_styles.weak", "type": "number", "value": 0.5, "description": "" },
    { "name": "shared_tokens.line_styles.normal", "type": "number", "value": 1, "description": "" },
    { "name": "success", "type": "color", "value": "#346E4E", "description": "Success/Go – dark green. Text on neutral backgrounds (≥4.5:1); lighter than error for red-green CVD." },
    { "name": "warning", "type": "color", "value": "#6D4501", "description": "Warning – dark brown, since yellow text is unreadable on light backgrounds. The yellow identity is carried by background.warning." },
    { "name": "foreground.base", "type": "color", "value": "#0D1117", "description": "Primary text." },
    { "name": "normal", "type": "borderWidth", "value": 1, "description": "" },
    { "name": "error", "type": "color", "value": "#5D1A14", "description": "Error/Stop – dark red-brown. Darker than success for red-green CVD and clearly darker than brand.primary." },
    { "name": "size.normal", "type": "fontSizes", "value": "14", "description": "" },
    { "name": "background.base", "type": "color", "value": "#EAF0F6", "description": "Base canvas." },
    { "name": "strong", "type": "borderWidth", "value": "3", "description": "" },
    { "name": "background.elevated", "type": "color", "value": "#FAFBFC", "description": "Raised surfaces (cards, modals). Off-white, the lightest layer." },
    { "name": "background.sunken", "type": "color", "value": "#E0E6EC", "description": "Nested or sunken areas (toolbars, table headers, legends). The darkest neutral layer." },
    { "name": "background.info", "type": "color", "value": "#7CB8F0", "description": "Info background (light): deeper blue tint vs base; text = foreground.base." },
    { "name": "background.success", "type": "color", "value": "#B9EDC4", "description": "Success background (light): deeper green; lighter than error (CVD); text = foreground.base." },
    { "name": "background.warning", "type": "color", "value": "#FAD153", "description": "Warning background (light): mustard gold for separation from blue/green; text = foreground.base." },
    { "name": "background.error", "type": "color", "value": "#D79A96", "description": "Error background (light): dusty red; darker than success (CVD); text = foreground.base." },
    { "name": "foreground.muted", "type": "color", "value": "#57606A", "description": "Secondary text, labels" },
    { "name": "foreground.subtle", "type": "color", "value": "#8B949E", "description": "Tertiary text, placeholders" },
    { "name": "brand.primary", "type": "color", "value": "#D70000", "description": "Profilröd; logotyp, knappar, kanter." },
    { "name": "brand.primary.subtle", "type": "color", "value": "#FFE5E5", "description": "Ljus röd ton; hover, bakgrunder." },
    { "name": "brand.on_primary", "type": "color", "value": "#FFFFFF", "description": "Text/ikoner på brand.primary." },
    { "name": "brand.secondary", "type": "color", "value": "#B30000", "description": "Stödjande röd; mindre framträdande accent." },
    { "name": "brand.on_secondary", "type": "color", "value": "#FFFFFF", "description": "Text/ikoner på brand.secondary." },
    { "name": "brand.tertiary", "type": "color", "value": "#870000", "description": "RGB 135.0.0; appikon bakgrund, vit ikon på röd (Appar-riktlinjer)." },
    { "name": "brand.on_tertiary", "type": "color", "value": "#FFFFFF", "description": "Text/ikoner på brand.tertiary." },
    { "name": "brand.inverted", "type": "color", "value": "#FF4444", "description": "Brand på mörka ytor; t.ex. knapp på Snackbar." },
    { "name": "brand.on_inverted", "type": "color", "value": "#FFFFFF", "description": "Text/ikoner på brand.inverted." }
  ],
  "mode/dark": [
    { "name": "foreground.base", "type": "color", "value": "#FAFBFC", "description": "Primary text; bright for contrast on dark." },
    { "name": "shared_tokens.line_styles.strong", "type": "number", "value": 2, "description": "" },
    { "name": "shared_tokens.line_styles.weak", "type": "number", "value": 0.5, "description": "" },
    { "name": "shared_tokens.line_styles.normal", "type": "number", "value": 1, "description": "" },
    { "name": "info", "type": "color", "value": "#94C7F5", "description": "Action/Info – light blue for dark mode." },
    { "name": "warning", "type": "color", "value": "#EBCB7B", "description": "Warning – light yellow for dark mode." },
    { "name": "error", "type": "color", "value": "#EEA090", "description": "Error/Stop – light coral for dark mode; darker than success for red-green CVD." },
    { "name": "success", "type": "color", "value": "#B7FFC6", "description": "Success/Go – light green for dark mode; lighter than error for red-green CVD." },
    { "name": "background.base", "type": "color", "value": "#272C34", "description": "Base canvas, between sunken and elevated." },
    { "name": "roboto-base", "type": "fontFamilies", "value": ["Source Sans 3", "Source Sans Pro", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"], "description": "Primary UI font stack (HFA DS)." },
    { "name": "background.elevated", "type": "color", "value": "#383D45", "description": "Raised surfaces (cards, modals). The lightest neutral layer." },
    { "name": "background.sunken", "type": "color", "value": "#191E25", "description": "Deepest layer (toolbars, table headers, legends). Not pure black." },
    { "name": "background.info", "type": "color", "value": "#133B63", "description": "Info background (dark): brighter steel blue for hue separation from base; text = foreground.base." },
    { "name": "background.success", "type": "color", "value": "#2B5945", "description": "Success background (dark): forest green; lighter than error (CVD); text = foreground.base." },
    { "name": "background.warning", "type": "color", "value": "#544A06", "description": "Warning background (dark): warm ochre/gold for clear distinction; text = foreground.base." },
    { "name": "background.error", "type": "color", "value": "#502E24", "description": "Error background (dark): wine red; darker than success (CVD); text = foreground.base." },
    { "name": "foreground.muted", "type": "color", "value": "#C9D1D9", "description": "Secondary text, labels; brighter for contrast." },
    { "name": "foreground.subtle", "type": "color", "value": "#9CA3AF", "description": "Tertiary text, placeholders; brighter for contrast." },
    { "name": "brand.primary", "type": "color", "value": "#FF4444", "description": "Profilröd; ljusare för kontrast på mörk bakgrund." },
    { "name": "brand.primary.subtle", "type": "color", "value": "#3D1515", "description": "Mörk röd ton; hover, bakgrunder." },
    { "name": "brand.on_primary", "type": "color", "value": "#FFFFFF", "description": "Text/ikoner på brand.primary." },
    { "name": "brand.secondary", "type": "color", "value": "#FF6666", "description": "Stödjande röd; mindre framträdande accent." },
    { "name": "brand.on_secondary", "type": "color", "value": "#FFFFFF", "description": "Text/ikoner på brand.secondary." },
    { "name": "brand.tertiary", "type": "color", "value": "#FF8888", "description": "Tredje accent; ljusare röd." },
    { "name": "brand.on_tertiary", "type": "color", "value": "#0D1117", "description": "Text/ikoner på brand.tertiary (mörk för kontrast)." },
    { "name": "brand.inverted", "type": "color", "value": "#D70000", "description": "Brand på ljusa ytor i dark mode; t.ex. accent på ljus dialog." },
    { "name": "brand.on_inverted", "type": "color", "value": "#FFFFFF", "description": "Text/ikoner på brand.inverted." },
    { "name": "radius.round", "type": "borderRadius", "value": "999", "description": "" },
    { "name": "size.normal", "type": "fontSizes", "value": "14", "description": "" },
    { "name": "normal", "type": "borderWidth", "value": 1, "description": "" },
    { "name": "strong", "type": "borderWidth", "value": 2, "description": "" }
  ]
};
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
