# Project Guidelines (hfa-ds)

## Penpot MCP Rules
* Skip calling `penpot - high_level_overview` unless explicitly requested.
* Operate on canvas nodes programmatically by selection ID or name.
* Do NOT request canvas screenshots or visual renders unless specifically asked.
* Keep response payload sizes minimal to reduce token usage.

## Penpot Selection Access
**Always access the current selection first** to enable precise deictic prompts:
* Use `penpot.selection` to get the user's currently selected shape(s)
* Use `penpotUtils.shapeStructure(shape, maxDepth)` to see the hierarchy of selected elements
* Retrieve and store precise coordinates and properties for comparison with reference shapes

## Workflow Modes
* Use Plan Mode for exploring/designing before execution.

## Testing
* `npm test` runs the Playwright harness in `tests/` against the single-file tools in the sibling repos (`/workspaces/hfa-*`, override with `HFA_WORKSPACE`). Pages are opened from `file://`; no dev server.
* `tests/shared/` runs against every tool in `tests/lib/tools.mjs` (clean load, colours match `tokens.json`). Add a tool there to get both checks. Per-tool specs go in `tests/<tool>/`.
* `tokens-sync.spec.mjs` keeps a `knownDrift` list of colour differences that exist today. A new difference fails, and so does a listed one that has been fixed (remove it from the list).
* First run on a fresh machine: `npm ci && npx playwright install --with-deps chromium`.
