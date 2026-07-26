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
