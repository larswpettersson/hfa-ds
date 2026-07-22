/**
 * Penpot MCP execute_code — export active token sets to W3C-style JSON in storage.
 * Connect HFA DS, run, then copy storage.hfaDsExport to tokens.json and commit.
 */
(function exportToJson() {
  function tokenToNode(token) {
    return {
      $value: token.value,
      $type: token.type,
      $description: token.description || "",
    };
  }

  function nestToken(name, node, bucket) {
    var parts = name.split(".");
    var cur = bucket;
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i];
      if (i === parts.length - 1) {
        cur[part] = node;
        return;
      }
      if (!cur[part]) cur[part] = {};
      cur = cur[part];
    }
  }

  function exportSet(set) {
    var bucket = {};
    set.tokens.forEach(function (token) {
      nestToken(token.name, tokenToNode(token), bucket);
    });
    return bucket;
  }

  var catalog = penpot.library.local.tokens;
  var out = {
    "$metadata": {
      tokenSetOrder: catalog.sets.map(function (s) { return s.name; }),
      activeSets: catalog.sets.filter(function (s) { return s.active; }).map(function (s) { return s.name; }),
      activeThemes: catalog.themes.filter(function (t) { return t.active; }).map(function (t) { return t.name; }),
      exportedFrom: penpot.currentFile && penpot.currentFile.name,
      exportedAt: new Date().toISOString(),
    },
  };

  catalog.sets.forEach(function (set) {
    if (set.name === "Global") return;
    out[set.name] = exportSet(set);
  });

  storage.hfaDsExport = out;
  return {
    file: penpot.currentFile && penpot.currentFile.name,
    step: "export-to-json",
    setNames: catalog.sets.map(function (s) { return s.name; }),
    tokenCounts: catalog.sets.map(function (s) {
      return { name: s.name, count: s.tokens.length };
    }),
    hint: "Copy storage.hfaDsExport JSON into hfa-ds/tokens.json, then run npm run build:penpot",
  };
})();
