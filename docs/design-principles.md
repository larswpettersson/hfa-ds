# Design principles: HFA family

*Swedish version: [designprinciper.md](designprinciper.md)*

Design decisions shared by all HFA tools (hfa-hta, hfa-bowtie, hfa-stpa, hfa-rbd) and the **HFA DS** Penpot file. [ARCHITECTURE.md](../ARCHITECTURE.md) describes how the repositories fit together. This document describes what the tools are for, how they should look, and why.

## 1. Purpose and simplicity

### 1.1 What the tools are for

The tools are used in two situations:

- **Analysis:** an analyst or a working group builds an STPA, HTA, bowtie or RBD.
- **Meetings:** the status of safety-related sequences of events is presented and discussed, often on a projector and with participants who do not use the tool themselves.

Both situations require a tool that can be understood at once, without an introduction.

### 1.2 Principles

1. **As simple as possible.** Every feature has to earn its place. A few features that are obvious are better than many that need explaining.
2. **Intuitive.** What is on the screen can be used without reading the help. The help dialog and keyboard shortcuts are an addition, not a requirement.
3. **The user does the analysis.** The tool supports the method and makes the structure visible. The conclusions belong to the analyst and the group.
4. **AI is optional support, not the engine.** The tools are fully usable without a model. A model may review, suggest or phrase, but it does not solve the analysis for the user or take up much of the interface. Suggestions are shown in the diagram and accepted by the user (see 1.3).
5. **Works in meetings.** Diagrams and status can be read at a distance and understood by people who did not build the analysis: clear hierarchy, few colours and no clutter.
6. **The same thing looks the same in every tool.** Shared components and tokens from HFA DS.
7. **One file, no build step.** Each tool is a self-contained HTML file that can be read, changed and run without a network (see 2.2).

A new feature is tested against one question: *does it make the tool easier to use in an analysis or in a meeting?* If the answer is no, the feature does not belong in the tool.

### 1.3 Vision: an AI suggestion shows in the diagram

An AI suggestion should be *visible* before it is accepted: how it changes the HTA tree, the bowtie or the STPA control structure. The suggestion is shown in the same diagram as the analysis, not as JSON or text the user has to translate. The same view works in meetings, where the group compares the current state with the suggestion.

*Proposed design (not decided):*

- **Before / After / Difference.** A suggestion opens a review view with a three-way switch. *Before* shows the analysis as it is and *After* as it would be. *Difference* shows both in one diagram with the changes marked. The view closes with **Accept** or **Reject**.
- **Changes are marked by shape and symbol, not by colour alone** (colour blindness, projectors):

  | Change | Marking |
  |---|---|
  | Added | Dashed outline and a **+** badge |
  | Removed | Faded, with struck-through text and a **−** badge. It stays in place so the group sees what goes. |
  | Changed | Outline and a **~** badge. The old value is struck through under the new one. |
  | Unchanged | As usual, slightly dimmed in *Difference* |

  The colours are the semantic success, error and warning tokens. The marking must still read in greyscale.
- **Per tool:**
  - **HTA:** new tasks are dashed in the tree. Removed ones stay, faded. A moved task leaves a ghost at its old place. Changed TTA cells show the old and the new value. Only content is marked, not id renumbering.
  - **Bowtie:** new and removed causes, consequences and barriers are marked as above. A changed status or strength shows old → new on the barrier. New links are drawn dashed, and removed links dotted and faded.
  - **STPA:** new and removed blocks, control actions and feedback are marked the same way. A type switch (e.g. actuator → controlled process) gets a badge. Changed rows in the loss, hazard, UCA and constraint tables are marked.
- **One shared way to compute the difference.** The suggestion is applied to a copy, and the copy is compared with the current state by id. The diagram is drawn from "after" plus the removed elements, with one CSS class per kind of change. There is no separate view to maintain.

### 1.4 Consequences for work in progress (2026-10-31)

- **hfa-stpa:** the workbench has become complex. Chat, several model providers, MCP and patches have grown in, and the AI model solves much of the work for the user. It is to be reviewed against the principles above: what is needed in analysis and in meetings, and what can be removed or hidden?
- **AI in hfa-hta and hfa-bowtie** (branch `claude/ai-assistant`) and the **Hugging Face configuration** in hfa-ds have not been test-run. They are reviewed against the principles before anything is merged.

## 2. Typography

### 2.1 Basis: Trafikverket's graphic profile

Trafikverket's graphic manual ([Typografisk enkelhet](https://bransch.trafikverket.se/grafisk-profil/trafikverkets-grafiska-profil/grafisk-manual/typografi/), reviewed 2025-02-19) sets these rules:

- **Digital productions use Open Sans**, in two weights only: **Regular** and **Bold**. Whitney is for print and Arial/Georgia for MS Office.
- Keep the **number of weights and sizes as low as possible**.
- Avoid **underlined and italic** text. Use other weights only in exceptional cases.
- **Uppercase** text is acceptable in short headings when the context requires it, but never in longer headings.
- Text on images and coloured plates needs a contrast of at least 3:1. White text on coloured plates reads better with a larger size or bold weight.

### 2.2 Font stack: no embedding

```css
--font-sans: "Open Sans", Arial, sans-serif;
--font-mono: ui-monospace, Consolas, "Courier New", monospace;
```

Each tool is a single self-contained HTML file that must stay **easy to read and update**, and must run **air-gapped**. The font is therefore referenced by name only. There is no `@font-face`, no base64 font data and no build step.

| Machine | Rendered font |
|---|---|
| Open Sans installed | Open Sans, which follows the profile |
| Open Sans not installed | Arial, which is Trafikverket's Office font, ships with Windows and is still within the profile |

**Trade-off:** rendering differs slightly between machines. Arial is a little narrower, so line breaks can move. This is accepted in exchange for simple files.

**Why not Source Sans 3:** the tools previously listed `"Source Sans 3"` first. It is not part of Trafikverket's profile and, like Open Sans, is not preinstalled on Windows. In practice most users therefore saw the fallback, Segoe UI, which is not in the profile either.

**Future option:** if identical rendering everywhere becomes a requirement, embed Open Sans (Regular and Bold, Latin subset including å/ä/ö, about 25–35 kB per weight as WOFF2) only in the `*_offline.html` files, in a clearly marked block at the end of the file. The editable source files stay clean. Both Open Sans and Source Sans 3 are licensed under the SIL Open Font License, which allows embedding.

### 2.3 Type scale

Six sizes, two weights. The names match the tokens in the `mode/light` and `mode/dark` sets in Penpot **HFA DS**.

| Token | Size | Weight | Line height | Use in the tools |
|---|---|---|---|---|
| `font.size.xs` / `typography.caption`, `caption-bold` | 12 px | Regular / Bold | 1.35 | Secondary text: IDs, metadata, chips, pills, legend, hints, table headers, diagram sub-labels |
| `font.size.sm` / `typography.small` | 14 px | Regular | 1.5 | **Default UI text**: body, buttons, forms, tables, panels, status messages, diagram labels |
| `font.size.md` / `typography.body`, `body-bold` | 16 px | Regular / Bold | 1.5 | Panel and section headings (Bold), longer reading text such as help dialogs |
| `font.size.lg` / `typography.heading-3` | 20 px | Bold | 1.3 | Application title |
| `font.size.xl` / `typography.heading-2` | 24 px | Bold | 1.25 | Page headings in reports and exports |
| `font.size.2xl` / `typography.heading-1` | 32 px | Bold | 1.25 | Web and reports only, not used in the tools |

Rules:

1. **14 px is the base size in every tool.** The tools are dense work interfaces with tables, diagrams and forms. STPA and RBD already use 14 px, and so does the existing `size.normal` token.
2. **12 px is the minimum.** Do not use 10, 10.5 or 11 px. 12 px text must meet a contrast of at least 4.5:1.
3. **Only whole sizes from the scale.** Round 12.5 and 13 to 12 (secondary) or 14 (primary), and round 15 and 18 to 16.
4. **Only weights 400 and 700.** Replace 600 (semibold) with 700, and 500 with 400. There are three reasons:
   - The manual specifies two weights, Regular and Bold, and Open Sans Bold is 700.
   - The fallback font, Arial, only has 400 and 700, so on machines without Open Sans, 600 already renders as 700. Using 700 makes the tools look the same on every machine.
   - The Penpot tokens only define `font.weight.regular` and `font.weight.bold`, so design and code match.
5. **Separate hierarchy levels by weight before size.** For example, a 16 px Bold section heading over 14 px Regular text.
6. **Uppercase** is allowed only for short labels such as panel headings. Uppercase labels use 12 px Bold.
7. **Monospace** is used only for code and JSON, at 12 px.

### 2.4 CSS custom properties in the tools

Each tool declares the same variables in `:root`, named after the tokens. RBD already uses this pattern.

```css
:root {
  --font-sans: "Open Sans", Arial, sans-serif;
  --font-mono: ui-monospace, Consolas, "Courier New", monospace;
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-md: 16px;
  --font-size-lg: 20px;
  --font-size-xl: 24px;
  --font-weight-regular: 400;
  --font-weight-bold: 700;
}
body { font: var(--font-size-sm)/1.5 var(--font-sans); }
```

Rules reference the variables, not literal pixel values, for example `font-size: var(--font-size-xs)`.

### 2.5 Current state and proposed changes per tool

Survey of the main files, 2026-10-26. Unchanged values are not listed.

**All tools:**

- Change the font stack from Source Sans 3 to `"Open Sans", Arial, sans-serif`.
- Change `font-weight: 600` to 700. It is used for headings and bold text in all four tools.
- Change `font-weight: 500` to 400. It is used once each in HTA and RBD.

**hfa-hta** (`HTA.html`; `hta-editor.html` and `hta-editor2.html` follow the same pattern)

| Element | Today | Proposed |
|---|---|---|
| `body` | 16 | 14 |
| `.help-dialog`, `.help-dialog h3` | 13 | 14 (h3 Bold) |
| `.tta-table`, `.column-picker`, `.status-message` | 13 | 14 |
| `.tta-table th` | 11 | 12 Bold |
| `.task-id` | 10 | 12 |
| Editor title (`hta-editor.html`) | 24 | 20 |

**hfa-bowtie** (`Bowtie.html`)

| Element | Today | Proposed |
|---|---|---|
| `body` | 16 | 14 |
| `.desc-text` | 16 | 14 |
| `.id-tag` | 16 | 12 |
| `.legend-row` | 14 | 12 |
| `.help-dialog`, `.help-dialog h3` | 13 | 14 (h3 Bold) |

**hfa-stpa** (`workbench/index.html`)

| Element | Today | Proposed |
|---|---|---|
| `header h1` | 16 | 20 Bold |
| `.panel > .bar h2` (uppercase) | 13 | 12 Bold |
| `#issues`, `.msg table`, `#drawer label` | 13 | 14 |
| `#safetyCaseWrap summary` | 13 / 600 | 14 / 700 |
| `#safetyCaseWrap table` | 12.5 | 14 |
| `#drawer h2` | 15 | 16 Bold |
| `#diagram text` | 12 | 14 (check the diagram layout) |
| `#diagram .sub` | 10.5 | 12 |
| `.lbl-ca`, `.lbl-fb`, `.chip`, `.pill`, `.msg .meta` | 11 | 12 |
| Code view (`font: 12.5px … mono`) | 12.5 | 12 |
| Penpot text scaling, `clamp(…, 8, 22)` | 8–22 | 12–20 |

**hfa-rbd** (`styles/rbd.css`, whose size variables already match the scale)

| Element | Today | Proposed |
|---|---|---|
| `h1` | 24 | 20 |
| `.panel-heading` | 18 | 16 Bold |
| `.stack-caption` | 13 | 12 |
| `.analysis-detail` | 13 | 14 |

**Note:** going from 16 to 14 px base text in HTA and Bowtie, and from 12 to 14 px diagram text in STPA, changes the layout. Check node sizes, line breaks and diagram spacing visually when you make the change.

### 2.6 Tokens

| Location | Status |
|---|---|
| Penpot **HFA DS**, sets `mode/light` and `mode/dark` (same values in both) | `font.family.base`, `font.family.mono`, `font.weight.regular/bold`, `font.size.xs–2xl`, `typography.heading-1/2/3`, `body`, `body-bold`, `small`, `caption`, `caption-bold` and `code` are created. The legacy `roboto-base` and `size.normal` point to `{font.family.base}` and `{font.size.sm}`. The **Fonter** board shows a sample of every style. |
| `tokens.json` | Still contains the older tokens only: `roboto-base` (Source Sans 3 stack) and `size.normal` (14). It is updated through the export flow in [sync-workflow.md](sync-workflow.md). |

The legacy tokens `roboto-base` and `size.normal` can be removed once no Penpot file or tool references them.
