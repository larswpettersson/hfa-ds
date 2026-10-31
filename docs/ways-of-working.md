# Ways of working: HFA family

*Swedish version: [arbetssatt.md](arbetssatt.md)*

This document describes how we work on the HFA tools (hfa-hta, hfa-bowtie, hfa-stpa, hfa-rbd) and the **HFA DS** Penpot file. [design-principles.md](design-principles.md) describes what the tools should be and how they should look. This document describes how we get there.

Each chapter describes one way of working. More chapters are added over time.

## 1. Penpot and AI-assisted code generation

Design changes are made in Penpot. An AI assistant (for example Claude Code) reads the design and generates or changes the code in the tools. The clearer the design, the less the AI has to guess.

### 1.1 What the AI can read

| Source | What the AI gets | Assessment |
|---|---|---|
| **The Penpot file through the Penpot MCP** | Boards, layers and their names, components and variants, tokens, colours, fonts, sizes and layout (flex and grid) | Best. Exact information that translates into code. Requires the MCP server to be connected on the machine where the work is done. |
| **Screenshots and exported images** | What is shown, hierarchy and markings | A good complement. Sizes and spacing are estimates, and behaviour does not show. |
| **A prototype share link** | Almost nothing. The prototype is drawn by JavaScript in the browser. | For people, not for the AI. |
| **The prototype's interactions** ("click → go to board X") | Uncertain whether they can be read through the MCP | Do not rely on them as the only description of a flow. |

When working through the MCP, the AI starts from **what is selected** in Penpot (see [CLAUDE.md](../CLAUDE.md)). Select what should change before asking for a change.

### 1.2 Principles in Penpot

1. **Name layers and components as in the code**, for example `review-switch`, `badge/added` or `task-box`. A layer called "Rectangle 23" cannot be tied to code.
2. **Use variants for states.** A component with, for example, `change=added|removed|changed|none` and `state=default|hover|selected` maps directly to CSS classes in the tools.
3. **Use only tokens from HFA DS.** No free colour or size values. Then every value maps to `tokens.json` and the CSS custom properties.
4. **Use flex or grid layout instead of free positions.** Then the AI can read the rule ("even 8 px gap, wrap") instead of coordinates.
5. **Make one board per state in a flow**, for example "HTA – Before", "HTA – After" and "HTA – Difference". Let board names follow the sections in [design-principles.md](design-principles.md), so both people and the AI find the right one.
6. **Write notes in a text layer on the board**, prefixed `_note`. Penpot comments can probably not be read through the MCP, but a text layer on the board can.
7. **Describe what you changed.** The AI sees what the design looks like now, not what changed since last time. One sentence such as "removed badge: from red fill to struck-through text" makes sure the right thing changes in the code.

### 1.3 Describe flows and behaviour outside Penpot

Appearance is best described in Penpot. Behaviour is best described in text and data in the repository, referring to the board names.

| Description | Suited to | How well the AI reads it |
|---|---|---|
| **States and transitions in a table**: state → event → next state → what shows | Flows, for example Before/After/Difference and Accept/Reject | Very well, unambiguous |
| **Example data before and after** (JSON), with the markings that should show | Most of an implementation | Best of all. The examples can become tests directly. |
| **Scenarios in text**, such as section 1.5 of the design principles | Purpose and context | Good for understanding why something is needed, less so for details |
| **Exported images and share link** | Documentation and meetings | For people, a complement for the AI |

Example data matters most: an example of an analysis before and after a change, and which markings should show. It makes clear both what the code should do and how to test it.

### 1.4 Annotations on components

How a component should be implemented is described in its **annotation** in Penpot. This is the primary way; prototypes with linked flows are not built for now. The annotation can be read through the MCP (`LibraryComponent.annotation` in the Plugin API, checked 2026-10-31 on Action Button). A `_note` text layer on the board (1.2) is the fallback where an annotation is not enough.

Rules:

- **At most 300 characters.**
- **Write in English**, like the code.
- **Fixed order:** code mapping, states, behaviour, tokens, reference. Leave out what is not needed.

Template (134 characters):

```
Code: <class> (<tools>). States: <variant=a|b> or <state: look>. Behaviour: <what happens>. Tokens: <token names>. See: <doc section>.
```

**Example: Action Button, as it is in HFA DS today** (264 characters):

```
Toolbar button. Default: elevated + 1 px muted border. Hovered: sunken + base border. Pressed/selected: inverted (base fill, elevated text). App: 2 px info focus ring with 2 px offset on :focus-visible; tooltip and aria-label with the full name (e.g. "Add cause").
```

It describes the states briefly and clearly, and separates the look in the design from behaviour that only exists in the app (`App:`). Compared with the template, two things are missing:

- **Code mapping.** It does not say which CSS class and which tools the component corresponds to.
- **Exact token names.** "elevated", "sunken", "muted" and "base" point at tokens, but not unambiguously: is "muted border" `foreground.muted`?

**The same annotation following the template** (239 characters):

```
Code: .action-btn (HTA, Bowtie). Default: background.elevated, 1 px foreground.muted border. Hover: background.sunken, foreground.base border. Pressed/selected: inverted. Focus: 2 px info ring, 2 px offset. Tooltip + aria-label: full name.
```

### 1.5 Workflow

1. **Design in Penpot** with named components, variants and tokens, and describe the implementation in the component's annotation (1.4).
2. **Describe the flow in the repository**: a short text with a state table and example data before and after, referring to the board names and the share link.
3. **When something changes:** select the changed part in Penpot and write one sentence on what changed. The AI reads the selection through the MCP and changes the code.
4. **Check** the result in the tool and with the tests (`npm test` in hfa-ds).
5. **Document for people**: export board images to `docs/img/` and link to the prototype from the documentation.
