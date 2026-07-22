/**
 * Penpot MCP execute_code — validate connected file token names vs HFA_DS_TOKEN_SETS.
 * Paste import-payload.js before this script (same as import-from-json.js).
 */
(function validateTokens() {
  var TOKEN_SETS = typeof HFA_DS_TOKEN_SETS !== "undefined"
    ? HFA_DS_TOKEN_SETS
    : storage.hfaDsTokenSets;

  if (!TOKEN_SETS) {
    return { error: "Missing HFA_DS_TOKEN_SETS. Run npm run build:penpot first." };
  }

  var overview = penpotUtils.tokenOverview();
  var issues = [];
  var bareForegroundBindings = [];

  function scanShape(shape, path) {
    path = path || shape.name || shape.type;
    if (shape.tokens) {
      Object.keys(shape.tokens).forEach(function (prop) {
        var name = shape.tokens[prop];
        if (name === "foreground") {
          bareForegroundBindings.push(path + "." + prop);
        }
      });
    }
    if (shape.children) {
      shape.children.forEach(function (child) {
        scanShape(child, path + "/" + child.name);
      });
    }
  }

  penpotUtils.getPages().forEach(function (page) {
    penpot.openPage(page.id);
    scanShape(penpot.root, page.name);
  });

  ["mode/light", "mode/dark"].forEach(function (setName) {
    var expected = TOKEN_SETS[setName] || [];
    var actualByType = overview[setName] || {};
    var actualNames = new Set();
    Object.keys(actualByType).forEach(function (type) {
      actualByType[type].forEach(function (name) { actualNames.add(name); });
    });

    expected.forEach(function (token) {
      if (!actualNames.has(token.name)) {
        issues.push({ set: setName, token: token.name, issue: "missing_in_penpot" });
      }
    });

    if (actualNames.has("foreground")) {
      issues.push({ set: setName, token: "foreground", issue: "legacy_bare_foreground_in_set" });
    }
  });

  if (penpotUtils.findTokenByName("foreground")) {
    issues.push({ set: "catalog", token: "foreground", issue: "legacy_token_still_defined" });
  }

  return {
    file: penpot.currentFile && penpot.currentFile.name,
    step: "validate",
    pass: issues.length === 0 && bareForegroundBindings.length === 0,
    issueCount: issues.length,
    issues: issues.slice(0, 30),
    bareForegroundBindingCount: bareForegroundBindings.length,
    bareForegroundBindings: bareForegroundBindings.slice(0, 20),
    overview: overview,
  };
})();
