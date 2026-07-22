/**
 * Penpot MCP execute_code — file-aware sync orchestrator.
 * Connect each file in order: HFA DS → Bowtie → HTA → STPA → RBD
 * Requires import-payload.js pasted before this file.
 */
(function orchestrate() {
  var file = penpot.currentFile && penpot.currentFile.name;
  var report = { file: file, steps: [] };

  if (typeof importFromJson === "function") {
    report.import = importFromJson();
    report.steps.push("import-from-json");
  } else if (typeof HFA_DS_TOKEN_SETS !== "undefined") {
    report.steps.push("paste import-from-json.js after import-payload.js");
  } else {
    return {
      error: "Paste scripts/penpot/generated/import-payload.js then import-from-json.js",
    };
  }

  if (file === "HFA DS") {
    report.next = "Publish HFA DS as shared library (File → Publish). Then connect Bowtie and re-run.";
  } else if (file === "Bowtie" || file === "HTA" || file === "STPA" || file === "RBD") {
    report.next = "Run validate.js. Deactivate/delete legacy sets (Global, duplicate mode/*). Connect next file.";
  } else {
    report.next = "Connect HFA DS, Bowtie, HTA, STPA, or RBD.";
  }

  report.pages = penpotUtils.getPages().map(function (p) { return p.name; });
  return report;
})();
