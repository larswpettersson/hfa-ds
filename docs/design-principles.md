# Design principles: HFA family

*Swedish version: [designprinciper.md](designprinciper.md)*

Design decisions shared by all HFA tools (hfa-hta, hfa-bowtie, hfa-stpa, hfa-rbd) and the **HFA DS** Penpot file. [ARCHITECTURE.md](ARCHITECTURE.md) describes how the repositories fit together. This document describes what the tools are for, how they should look, and why.

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

*Direction for future implementation.* None of this is built yet (2026-10-31). New code that shows AI suggestions follows the direction below, and departures from it need a reason.

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
- **Implementation: one shared way to compute the difference.** The suggestion is applied to a copy, and the copy is compared with the current state by id. The diagram is drawn from "after" plus the removed elements, with one CSS class per kind of change. There is no separate view to maintain.

### 1.4 Consequences for work in progress (2026-10-31)

- **hfa-stpa:** the workbench has become complex. Chat, several model providers, MCP and patches have grown in, and the AI model solves much of the work for the user. It is to be reviewed against the principles above: what is needed in analysis and in meetings, and what can be removed or hidden?
- **AI in hfa-hta and hfa-bowtie** (branch `claude/ai-assistant`) and the **Hugging Face configuration** in hfa-ds have not been test-run. They are reviewed against the principles before anything is merged.

### 1.5 Scenario: HTA workshop with AI as scribe

The scenario shows how the vision in 1.3 is used in a typical workshop where an HTA and its TTA are worked out in detail. The AI acts as a **technical writer**: it summarises what was said and proposes changes, but does not do analysis of its own. The changes show in the tree and the table before the group accepts them.

**Participants:** Anna (human factors specialist and facilitator, runs the tool on the projector), Erik (train driver), Maria (wagon inspector) and Johan (safety coordinator). The AI scribe gets the discussion as Anna's notes or as a transcript.

#### Phase 1: the hierarchy takes shape

Anna has prepared a rough tree: *1 Carry out brake test before departure* with 1.1 Prepare test, 1.2 Charge brake pipe, 1.3 Check brakes and 1.4 Report result.

> **Maria:** "Check brakes" is really three things. The driver applies them, I walk the train and look at each wagon, and then I signal back.
>
> **Erik:** And then the brakes are released and checked again. Analyses often forget that.
>
> **Johan:** Reporting, is that really a task of its own? It happens in the same conversation.
>
> **Maria:** No, we do it in writing. It should stay.

Anna asks the scribe for a summary. The suggestion shows in the tree in *Difference* view: 1.3.1 Apply brakes from the cab, 1.3.2 Walk the train and check each wagon's brake, 1.3.3 Signal "brakes on" to the driver and 1.4 Release brakes and check show as added (dashed outline and +). "Report result" moving from 1.4 to 1.5 is not marked, because its content is the same.

The scribe also records an **open question**: should reporting be a task of its own? Johan was doubtful and Maria wants to keep it. Nothing is changed.

The group sees at once that 1.4 "Release brakes" should be split the same way as 1.3. Anna accepts 1.3.1–1.3.3, rejects 1.4 in this form and asks for a new breakdown. The open question goes into the minutes.

#### Phase 2: TTA, one leaf at a time

Anna selects the leaf *1.3.2 Walk the train and check each wagon's brake*. Discussion and suggestions now cover that leaf only.

> **Maria:** The most common thing is skipping a wagon. Darkness, rain, being in a hurry.
>
> **Erik:** Sometimes people only walk half the train because they "know" the rest is fine.
>
> **Johan:** Both happen. The first is a lapse, the second a shortcut.
>
> **Erik:** Then a wagon with its brake cut out leaves, and braking is weaker than the driver thinks. It might show in a hard brake application, and then it is too late.

The scribe proposes two TTA rows. New rows and filled-in cells are marked in the table:

| Column | Row 1 | Row 2 |
|---|---|---|
| External Error Mode | Omission (a wagon is skipped) | Omission (part of the train is not checked) |
| Human Error Type | Lapse | Violation (shortcut) |
| Consequence | A wagon with its brake cut out leaves; braking is weaker than the driver thinks | same |
| Recovery | *No reliable recovery identified (Erik: "maybe in a hard brake application")* | same |
| PSFs | Darkness, weather, time pressure | Time pressure, routine |
| Comments | Johan: checklist and head torch should be looked at as a measure | Johan: happens, extent unknown |

The missing recovery is stated explicitly. The scribe adds no measures of its own; the one in Comments is Johan's and carries his name. The group accepts the rows and moves to the next leaf.

#### Phase 3: wrap-up

The scribe compiles the minutes: accepted and rejected changes to the hierarchy, the TTA rows filled in, open questions, and proposed measures with who raised them. The group reviews the minutes on screen. The analysis in the tool is already up to date and is the starting point for the next workshop.

#### What the scenario requires of the tool

1. **The AI is a scribe, not an analyst.** It only phrases what was said, marks disagreement and uncertainty, and leaves cells empty when the group reached no conclusion.
2. **Changes show in both tree and table**, in Before / After / Difference view (1.3).
3. **Each change is accepted or rejected on its own**, not only the suggestion as a whole.
4. **Open questions are kept as a list** and do not change the analysis.
5. **Focus on one leaf** limits discussion and suggestions to the selected task.
6. **The minutes can be exported**, with changes, decisions and open questions.
7. **Input and privacy are decided later.** The discussion can come in as notes, a transcript or both. A meeting recording sent to a cloud model is sensitive; a local model, or notes only, may be required.

#### Visualisation

The visualisation is made in Penpot (HFA DS), in the HTA tool's own layout, and linked here like this:

- **Image in the document:** boards are exported as SVG or PNG to `docs/img/` and shown with `![…](img/…)`. The image links to the prototype.
- **Link to the prototype:** a share link from Penpot's View mode (*Share → Get link*), which opens without a Penpot account. *The link is added when the prototype exists.*

### 1.6 Images in the AI support (planned)

The user should be able to give the AI an image along with the question: a photo of the whiteboard from a workshop, a screenshot of an instruction or a regulation, or a sketch of a bowtie from an earlier meeting. This fits the AI as scribe in 1.5: it phrases what the group has already worked out, for example an HTA tree drawn on the board.

- **Easy to add.** Paste a screenshot (Ctrl/⌘+V) or drag an image file into the question field. A small thumbnail with ✕ shows what will be sent.
- **Images from outside.** The tool's own structure is already sent as data, so an image of the tool's own diagram adds little.
- **The suggestion is shown and accepted like any other** (1.3). The AI interprets the image, but the group decides what goes into the analysis.
- **The image does not stay.** It is not saved in the tool or in the export, and it is not sent again with follow-up questions.
- **Clear about what leaves the computer.** A screenshot can contain more than intended. With a cloud provider this is stated at the attachment; confidential analyses require a local model that reads images.

None of this is built yet (2026-11-03). The technical solution is described in [ARCHITECTURE.md](ARCHITECTURE.md), section 7.

### 1.7 Customisable TTA columns (planned)

The TTA table in HTA serves different purposes: for example error identification with HEI (HRA, e.g. SHERPA, HEART or Railway Action Reliability Assessment), but also, for example, as input to an STPA, where it can support building the control structure with columns such as *Description of the task*, *Controller*, *Control and feedback* and *Related Hazards*. The columns must therefore be customisable, and the AI support must follow them.

- **The columns belong to the analysis.** Their names and meaning are saved in the analysis file and travel with it. There is only one place where the columns are described; the AI support has no column list of its own.
- **Each column has a short description** of what it means and how to fill it in. The description helps both people (as a tooltip on the header) and the AI.
- **The user changes the columns in the table.**
  - Click a header, or pick the column in the *Columns* panel, to change its name and description. The description shows as a tooltip on the header.
  - **+ Column** adds a column. All columns are equal and can be renamed or removed, except *Task Step*, the link to the task in the HTA tree. A new analysis starts with the HEI columns, and **Reset** brings them back.
  - Changes can be undone and are included when the analysis is exported.
- **Templates as a starting point.** A choice such as "HEI (HRA)" or "Input to STPA" fills in the columns at once. The template is only a start; the analysis can be changed afterwards.
- **The AI follows the columns, it does not decide them.** It phrases content in the columns that exist. A suggestion of new columns is shown and accepted like any other suggestion (1.3), and if so comes later.

None of this is built yet (2026-11-03). The technical solution is described in [ARCHITECTURE.md](ARCHITECTURE.md), section 8.

## 2. Typography

### 2.1 Basis: typographic simplicity

- **The tools use Open Sans**, in two weights only: **Regular** and **Bold**.
- Keep the **number of weights and sizes as low as possible**.
- Avoid **underlined and italic** text. Use other weights only in exceptional cases.
- **Uppercase** text is acceptable in short headings when the context requires it, but never in longer headings.
- Text follows WCAG AA, including on images and coloured plates: contrast of at least 4.5:1, or 3:1 for large text (at least 24 px, or 18.7 px bold). White text on coloured plates reads better with a larger size or bold weight.

### 2.2 Font stack: no embedding

```css
--font-sans: "Open Sans", Arial, sans-serif;
--font-mono: ui-monospace, Consolas, "Courier New", monospace;
```

Each tool is a single self-contained HTML file that must stay **easy to read and update**, and must run **air-gapped**. The font is therefore referenced by name only. There is no `@font-face`, no base64 font data and no build step.

| Machine | Rendered font |
|---|---|
| Open Sans installed | Open Sans |
| Open Sans not installed | Arial, which ships with Windows and has similar metrics |

**Trade-off:** rendering differs slightly between machines. Arial is a little narrower, so line breaks can move. This is accepted in exchange for simple files.

**Why not Source Sans 3:** the tools previously listed `"Source Sans 3"` first. Like Open Sans, it is not preinstalled on Windows. In practice most users therefore saw the fallback, Segoe UI.

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

## 3. Colour

### 3.1 Adaptable brand colour, accessibility first

HFA DS is an independent project. The brand colour (`brand.*`) and any complementary colours must be replaceable, so that the tools can follow an organisation's graphic profile. **The WCAG and accessibility requirements always take precedence over the profile:** a brand colour that breaks the colour rules in `.claude/skills/penpot-color-a11y` must not be used for text, status or anything else that carries information.

### 3.2 Complementary colours next to brand red

This is how a typical complementary palette, green `#005F37`, blue `#00375F`, orange `#FF5F00` and yellow `#FFD700`, differs from brand red `brand.primary` `#D70000` under simulated colour vision (Machado et al. 2009, severity 1.0, the same method as the colour rules). The values are the lightness difference ΔL\*. ⚠️ and ❌ mark where the difference falls below the HFA DS requirements (ΔL\* ≥ 15 or OKLab ΔE ≥ 0.08).

| Colour | Normal | Protanopia | Deuteranopia | Tritanopia | Greyscale |
|---|---|---|---|---|---|
| Yellow `#FFD700` | 42 | 51 | 38 | 34 | 42 |
| Blue `#00375F` | 23 | ⚠️ 9 (ΔE 0.18, distinguished by hue) | 30 | 25 | 23 |
| Orange `#FF5F00` | 16 | 19 | 15 | ❌ 6 (ΔE 0.07) | 16 |
| Green `#005F37` | 10 (ΔE 0.32) | ❌ 3 (ΔE 0.05) | 17 | 14 | ⚠️ 10 |

**Conclusions:**

- **Yellow and blue** can be used next to brand red.
- **Green `#005F37` must not be used as the opposite of red**, for example ok/error or two series in a chart. With protanopia it is almost as light as brand red. If a green is needed next to red, it must differ clearly in lightness, at least ΔL\* 15 in every simulation. Either direction works, but a lighter green is the natural choice.
- **Orange must not sit next to red.** It merges with red under tritanopia and is close even for normal vision and on a projector.
- **`error` must differ from brand red**, so that errors are not mistaken for the brand colour. `#5D1A14` does (ΔL\* ≥ 17 in every simulation). The earlier `tokens.json` values (`#C70039` light, `#E03E3E` dark) did not and were replaced (2026-10-31).
- **If the brand colour changes**, recompute the table and check the conclusions again.

### 3.3 Surface layers: base, elevated and sunken

The background tokens are used as three layers. They give grouping and hierarchy: what sits on top, what sits below and what is the background. They apply to the working interface in every tool and in Penpot, whatever the analysis model (a tree, two sides around a top event or a control structure).

| Token | Used for | The idea |
|---|---|---|
| `background.base` | The page behind everything | Only the background. Nothing else sits in `base`. |
| `background.elevated` | What you read or act on: panels, dialogs and popovers, objects in the diagram (task, card, barrier, block), buttons, table cells | What lies on top |
| `background.sunken` | What holds something or is recessed: the diagram canvas, the toolbar, input fields and editors, the table header row, the legend, a hovered row | What lies underneath |

**Check rule:** an object never has the same token as what it sits directly on. An object (`elevated`) on the diagram canvas (`sunken`) lifts, while a task (`elevated`) straight on a panel (`elevated`) is separated only by its border. Exceptions: table cells on the table's panel, where the grid separates the cells, and **controls** (buttons and fields), tables and popovers on an `elevated` panel. They are separated by their border (at least 3:1), by the hover and pressed states and, for a popover, by a shadow (see below). Without that exception the rule would hit every button on a panel.

Status backgrounds (`background.success`, `error` and so on) replace the object's fill and do not change the rules above.

**The layers are hierarchy, not delimitation.** The difference between the layers is small:

| Theme | elevated / base | elevated / sunken | base / sunken |
|---|---|---|---|
| Light (`tokens.json`) | 1.11 | 1.21 | 1.10 |
| Dark (HTA and Bowtie) | 1.17 | 1.73 | 1.49 |
| Dark (STPA) | 1.17 | 1.37 | 1.18 |

WCAG 1.4.11 requires 3:1 for what shows where a component begins. That is met by the **border** (1 px `foreground.muted` on components, `foreground.base` on dialogs and cards), not by the background. An object must therefore always have its border. On a projector the difference between the layers almost disappears.

#### No fourth background token

3:1 between backgrounds cannot be reached, however many tokens there are, as long as the colour rules require 7:1 for `foreground.base` against every background:

| Theme | Requirement on the background | Largest contrast between two backgrounds |
|---|---|---|
| Light | Luminance at least 0.34 | 2.70 |
| Dark | Luminance at most 0.095 | 2.90 |

There is also no room for a fourth in the light theme. Lighter than `elevated` (`#FAFBFC`) only `#FFFFFF` remains, a difference of 1.04. Darker than `sunken` (`#E0E6EC`) breaks rule 6: `success` on `sunken` gives 4.8:1 and on `#D3DBE3` 4.3:1, and the limit is 4.5:1. In the dark theme the steps are 1.2 to 1.7, and disappear on a projector. Every new token would also have to be checked against all colour rules in both themes and changed in `tokens.json`, in three tools and in Penpot, for a difference that is barely visible.

#### Depth beyond three layers

A dialog on top of a panel on top of the page gets its depth in other ways than with a new surface:

- **Shadow** on what lies on top: *raised* for cards and popovers, *overlay* for dialogs. In the dark theme shadows are hard to see; there the border and the fact that `elevated` is lighter than `base` carry the height.
- **A scrim behind modal dialogs.** Everything under the dialog is dimmed, for example `foreground.base` at 40–50 %, instead of the dialog getting a surface of its own. The browser's `<dialog>` already has a `::backdrop` for it. The scrim is not a background text sits on, so the colour rules for backgrounds do not apply to it.
- **Border always**, as above.

The shadows are currently fixed values in the Penpot components (for example *Process Block*). Penpot has the token type *shadow*, but HFA DS has none defined. They are introduced when needed, and then in `tokens.json` and Penpot at the same time.

#### Does not apply

- **The graphic profile** (brand red and complementary colours) is governed by Trafikverket's manual and by 3.1 and 3.2.
- **Printouts and images** of the analyses, where the background often has to be white.

**Current state (2026-11-07):**

| Tool or part | Deviation from 3.3 |
|---|---|
| Penpot: ✕ in the table | `foreground.subtle` gives 2.97:1 against `elevated` (light), 4.30:1 (dark) and 1.46:1 against a selected row. Should be `foreground.muted`. |
| HTA | The buttons are `base`; should be `elevated` |
| Bowtie | The cards and barriers are `base`; should be `elevated`. The canvas is already `sunken`. |
| STPA | The process blocks are `sunken`; should be `elevated` on a `sunken` surface |

**Tested in Example (2026-11-07):** the fixed colours in *TTA Row*, *TTA Toolbar* (now instances of *Action Button*) and *TTA Column Dialog* are replaced with tokens, and the HTA panel has a `sunken` diagram canvas with `elevated` tasks. Checked against the token values in both themes: all borders reach 3:1 against the surface below, and text in `foreground.base` reaches 7:1. The only thing that failed was the ✕ above. The rule about the same token on the same token hit buttons, the table and the column picker on an `elevated` panel, which is the reason for the exception for controls. Selected rows in the TTA table use `background.info` with a red marker, a selection marker of its own outside the three layers (5.5).

## 4. Buttons and dialogs

### 4.1 Buttons that open a dialog end with …

A button that opens a dialog, a panel or a file chooser, where the user has to do something more before anything happens, ends with **…**. That shows in advance that the button does not act directly.

| The button | Examples |
|---|---|
| Opens a dialog, panel or file chooser: ends with … | **AI…**, **Columns…**, **Settings…**, **+ Column…**, **Open…**, **Save As…** |
| Acts directly: no … | **New**, **Save**, **Export CSV**, **Add row**, **+ Child**, **Light**, **Dark**, and **Save** and **Cancel** in a dialog |

- Use the character **…** (U+2026), not three full stops, with no space before it.
- The rule applies to the button's text. Tooltips and `aria-label` are written without ….
- **Exception:** buttons that show only a symbol, such as the help button **?**, get no ….
- Introduced in the tools step by step (2026-11-03).

### 4.2 Deleting rows in tables

- **Editable tables have a ✕ at the end of each row.** It is muted but always visible, so it can be found, works on touch screens and shows for people following on the projector.
- **The tooltip says what is deleted**, including linked data, for example "Delete c1 and its control actions and feedback".
- **Undo instead of asking.** The row is deleted at once, and a status message says what was deleted and that Ctrl/⌘+Z undoes it. The tool asks first only when the deletion affects much outside the row, for example a column with values on many rows.
- **If a rule requires the row, it is cleared instead.** In HTA every task has at least one TTA row; for a task's last row the button is called *Clear*.
- **Tables derived from other data have no ✕.** They are changed where the data is, like the safety-case tables in STPA.
- **✕ is a real button**, reachable with Tab and usable from the keyboard.

The STPA workbench's structure tables already follow the principle (2026-11-03). The TTA table in HTA gets it together with the customisable columns.

### 4.3 New: a minimal, generic example

The AI support starts from the analysis that is open. If a large or domain-specific analysis is in the tool, such as a preset or an earlier project, it shapes the model's answers from the first question. Every tool therefore has a **New** button that clears the analysis and shows a **minimal, generic example** instead.

- **The example uses the whole JSON structure**, with as few elements as possible and neutral names without a domain. It shows what the tool can do, and the AI sees the data model without being coloured by a particular subject.
  - **STPA:** one loss, one hazard, one safety constraint, two controllers in a hierarchy with a process model (variables and assumptions), one controlled process, one actuator, one sensor, control actions and feedback (also through the actuator and sensor), and one UCA.
  - **HTA:** an overall goal, two sub-tasks of which one has two operations, the TTA columns with descriptions, one filled-in row and the others empty.
  - **Bowtie:** hazard, top event, two causes, two consequences, one preventive and one recovery barrier with strength and status, and one barrier that protects two paths.
- **The AI conversation is cleared at the same time**, since earlier questions and answers concern the old analysis.
- **New asks first**, because the whole analysis is replaced (4.2), and the change can be undone with Ctrl/⌘+Z. If there are unsaved changes, the question mentions **Save**.
- Examples and presets, such as ACA759 or the STPA workbench's presets, load as before. New is the neutral starting point.

### 4.4 Open… and Save in every tool

The analysis file is handled the same way in every tool, as in most programs (Windows, macOS, Office):

- **Open…** opens a file chooser and opens an analysis (JSON). It replaces the analysis that is open and asks first if there are unsaved changes. It ends with …, since it always opens a file chooser (4.1).
- **Save** saves the analysis as a JSON file, without …. In the browser this is a download today. Where the browser allows it, **Save** can write back to the same file, and **Save As…** ask for a name and place.
- The names replace **Import** and **Export** in HTA and Bowtie.
- Export to formats *other* than the analysis file is still called **Export**, for example **Export CSV** in HTA and **Export .md** for the AI conversation.
- The shortcuts Ctrl/⌘+O and Ctrl/⌘+S follow the same names, where they are introduced.

**Current state (2026-11-04):**

| Tool | Clear to example | Analysis file |
|---|---|---|
| STPA | Missing; only *Load preset…* and *New chat* (clears only the conversation) | **Open…** and **Save** |
| HTA | **New** (2026-11-04) | **Open…** and **Save**; Open… asks about unsaved changes |
| Bowtie | **New** (2026-11-04); cannot be undone, since Bowtie has no undo | **Open…** and **Save**; Open… asks about unsaved changes |
| Penpot (HFA DS) | **New** (the Action Button component) | **Open…** and **Save** (the Action Button component) |

Introduced in the tools step by step.

### 4.5 The primary button is activated with Enter

A **primary button** is a button with a red fill (`brand.primary`) and white text (`brand.on_primary`). It is what the user most often wants to do next.

- **Enter activates it.** In a question field it is *Send*, and in a dialog it is the dialog's primary button. Esc cancels or answers no.
- **There is only one active primary button in the interface at any given time.** When a dialog is open it is the dialog's button; the buttons behind it are not active and do not count.
- **If the primary button cannot be used** it is shown as disabled, in a neutral style and not red, so that another button can be primary. Without a provider, for example, *Send* is disabled and then no button is primary; *Settings…* is an ordinary button, because *Send* is what Enter activates.
- **In a dialog that warns about something the safe choice is primary**, so that Enter never does what is harder to undo. The riskier choice is made on purpose, with an ordinary button.

**To check in the tools:** that every screen and dialog has at most one red button, and that Enter activates it.

### 4.6 Question field: Enter sends, Shift+Enter gives a new line

- **Enter sends** the question, as an activation of the primary button *Send* (4.5). **Shift+Enter** gives a line break. The text in the field says so: *Ask about the analysis… (Enter sends, Shift+Enter for a new line)*.
- **An empty field sends nothing.** Enter while composing with an input method (IME, for example for Chinese or Japanese) does not send.
- **Ctrl/⌘+Enter no longer sends** (it was the rule before). That key means *select* (5.4).

**Current state (2026-11-08):** HTA, Bowtie (`ai-assist.js`) and STPA follow the rule: Enter sends, Shift+Enter gives a new line, and Ctrl/⌘+Enter does not send. An empty field sends nothing, and Enter does nothing while a reply is running (it is ended only with *Stop*) or during IME input. The test `tests/shared/enter-sends.spec.mjs` checks it in all three.

### 4.7 The AI panel: a toggle button, open by default

- **The panel is on the right and is open by default.** An icon button (a window with a panel on the right) shows and hides it. The button is in the same place on the screen in every tool: at the right end of the toolbar when the panel is hidden, and in the panel's header when it is open. It replaces ✕ and the *AI…* button.
- **The icon has only the states Hovered and Pressed**, no status state. *Pressed* is temporary: it applies while the mouse button is down, until the user releases it and the click is over. Whether the panel is open or hidden is visible from the panel itself.
- **The button has no …**, since it only shows or hides a panel and does not open a dialog (4.1). The tooltip is for example *Show AI panel* or *Hide AI panel*.
- **If there is no provider** that is clear in the panel: the provider pill shows *No provider*, a box at the top of the log says to open *Settings…*, *Settings…* is an ordinary button, and the question field and *Send* are disabled.
- **The I key shows and hides the panel** in all tools, when no text is being edited (5.4). It replaces A, which *Add Above* (5.10) is to use; until *Add Above* is built, A applies.
- **The provider pill shows the chosen provider** (for example *Local*), not whether the connection responds.

**Current state (2026-11-08):** HTA, Bowtie and STPA (`ai-assist.js`) follow 4.7: the panel is open by default, the icon button replaces *AI…* and ✕, and without a provider they show *No provider*, a warning box, *Settings…* as an ordinary button, and a disabled *Send* (primary once a provider exists) and question field. The choice made with the button is remembered. The test `tests/shared/ai-panel-toggle.spec.mjs` checks it. Since 2026-11-08 STPA uses the same panel as the others (ARCHITECTURE.md, section 10), so the toggle and the state without a provider are the same in all three. The quick actions are still in the tools, while the design in Penpot has removed them.

### 4.8 Auto: step by step or auto

- **Step by step is the default.** The AI suggests one step at a time and the user decides on each suggestion.
- **Auto is in Settings for the AI configuration**, as a switch `Auto` that is off by default. It takes no room in the panel.
- **A warning text is shown under the switch, all the time, and there is no dialog when it is turned on.** The text says that in Auto the AI produces large parts of the analysis in one go, and that you need to know the material to understand and judge the analysis model. A plain text under the switch is better than logic for when a warning is shown.
- **The warning is a box with `background.warning`** and text in `foreground.base`. Status is shown only with a fill colour (3.3).
- **Auto does not change** that the AI's suggestions are shown before and after (1.3) and can be undone.

### 4.9 Narrow button and Pill

- **The narrow action button** (for example *Compress*, *Expand*, *Clear* and *Export .md* in the AI panel) is a variant of Action Button: `Type = Narrow`, with the same states (*Default*, *Hovered*, *Pressed*) and tokens as the others. The text is 12 px (`typography.caption`), the padding 4 and 8 px and the corner radius 4.
- **Pill** is a component with the property `Status`: *Neutral*, *Info*, *Success*, *Warning* and *Error*. The status is shown only with the fill colour (`background.info`, `success`, `warning`, `error`), the text is `foreground.base`, and the border is `foreground.muted` on *Neutral* and `foreground.base` on the status variants, so that it reaches 3:1. The provider pill in the AI panel is a *Pill*: *Neutral* with the provider's name, and *Warning* with the text *No provider*.

## 5. Navigating, selecting and moving objects

The same principles apply in every tool and every kind of diagram: tasks in HTA, cards, barriers, hazard and top event in Bowtie, and blocks in STPA. The aim is that anyone who wants to can work in the diagram with the keyboard, without having to click every single object with the mouse.

### 5.1 The objects in the model are navigable

- **What can be navigated to, selected and moved are the objects in the analysis model**, that is, the boxes the diagram draws for the parts of the model.
- **Connections are not navigation targets.** Lines, arrows and edges between objects (for example control actions and feedback in STPA, the lines between tasks in HTA and the links from barriers to causes in Bowtie) are not reached with the arrow keys. They are reached and changed through the object they belong to, a table or a dialog.
- **Each tool states which objects are navigable.** The navigation in 5.2 does not need to know the model, only where the objects are.
- Tables, such as the TTA table, follow the conventions of tables and are not covered by 5.2; see 5.9.

### 5.2 The arrow keys follow the screen, not the model

An arrow moves the indication (5.3) to the nearest object in the direction the arrow points on screen. The same rule applies to every kind of diagram, whether the model is a tree, two sides around a top event or a control structure:

1. Start from the indicated object.
2. Only consider objects in the direction of the arrow.
3. **Objects in the same row or column come first**, that is, objects that overlap the current one vertically for ←/→ and horizontally for ↑/↓.
4. Pick the nearest. Distance to the side weighs more than distance ahead, so that the arrow goes straight rather than diagonally.
5. If there is nothing in the same row or column, pick the nearest in the direction of the arrow.
6. **At the edge the indication stays.** It does not wrap around to the other side.

Examples: → from a task in HTA goes to the nearest box to the right on the same level, even if it belongs to another branch. → from a barrier in Bowtie goes to whatever is nearest to the right, another barrier or the top event depending on where the barrier is.

**Ctrl/⌘+arrow jumps a larger unit in the structure**, as in text editors: for example to the parent or the first child in HTA, or to the top event or the outer edge in Bowtie. Here the model decides where the jump goes.

### 5.3 One indication for mouse and keyboard

What the mouse hovers over and what the arrow keys point out are the same thing, as in menus in Windows and macOS:

- **There is one indication.** Both the mouse and the arrows set it, and it looks the same whichever set it.
- **When the mouse passes over an object the indication moves there**, and the keyboard's indication disappears.
- **The next arrow continues from the object the mouse was last over.** If the mouse leaves the objects for empty space the indication goes out, but the starting point is kept.
- **Only real mouse movement counts.** When a key press scrolls the diagram and another object ends up under a still mouse pointer, that object must not take the indication.
- **Indication, selection and editing are separate.** The indication shows where you are, the selection what commands apply to, and editing happens in the text field. The mouse never clears the selection, only the indication.

### 5.4 The keys mirror the mouse

Every key has a mouse counterpart:

| Mouse | Keyboard |
|---|---|
| Hover | Arrow (5.2) |
| Click: select, or whatever the tool otherwise does on a click, for example link mode for a barrier | Ctrl/⌘+Enter |
| Shift+click or Ctrl/⌘+click: add to or take out of the selection | Shift+Ctrl/⌘+Enter |
| Double-click: edit | Enter or F2 |
| Drag: move | Alt/Option+arrow (5.6) |
| The toolbar buttons *Add Above*, *Add Below* and *Add Beside* (5.10) | STPA: **B**, **S** and **A** (*Add Above*, built later). HTA: **C** (child), **S** (sibling), **D** (duplicate) |
| Delete the selected objects | Delete (5.10) |
| The button that shows and hides the AI panel (4.7) | **I** (until *Add Above* is built: **A**) |
| The help button | **?** |

Arrow, Ctrl/⌘+arrow, Shift+arrow (extend the selection) and Alt/Option+arrow (move) follow the same pattern as in text editors and lists.

**The letter keys** (A, B, C, D, I, S, ?) work only when no text is being edited and not when Ctrl, ⌘ or Alt is held. Each letter has one meaning in a tool.

### 5.5 Selecting several objects

- **Shift+click and Ctrl/⌘+click** add an object to the selection or take it out. Shift+click is the convention in drawing tools and Ctrl/⌘+click in lists; both do the same, so the habit from either works. A plain click replaces the selection.
- **Selected objects look the same** in every tool: the same shadow around the object.
- **Esc or a click outside** clears the selection.
- **The selection scopes AI questions:** the whole analysis is sent as context, but the question concerns the selected objects.

### 5.6 Moving selected objects

- **Alt/Option+arrow moves all selected objects one step together**, in the direction the arrow points and following the model's structure: column for barriers, row for cards, place among siblings or level for tasks, level or order within the level for blocks. Plain arrows navigate (5.2) and never move.
- **They keep their order among themselves**, and nothing moves if one of them is already at the edge.
- **Every move can be undone** with Ctrl/⌘+Z where the tool has undo.
- Alt+←/→ means back and forward in the browser on Windows and Linux; the tool must stop that when the keys are used in the diagram.

### 5.7 Objects never overlap

- **Two objects may never take the same place**, for example two barriers in one column covering the same row. The rule applies after every change and when a file is opened.
- **The object that was just changed or moved gets its place; an object that would collide gets a place of its own right after.** If, for example, the causes a barrier protects are changed, that barrier is the one that gives way.
- **The order is kept**, for example the order along the path to and from the top event, and empty places are removed.

### 5.8 A warning when the objects do not belong together

Moving several objects must make sense as one move. If the selected objects do not belong together, for example preventive and recovery barriers, a card and a barrier, or tasks under different parent tasks, the tool **warns**:

- **The move is not carried out**, and a message says why and which objects can be moved together.
- **The selection stays**, so the user can take out what does not belong with Shift+click.
- The selection itself is allowed, since it also scopes AI questions (5.5). It is the move that warns.

### 5.9 Linked views

When the same model is shown in two views, for example the diagram and the TTA table in HTA or the diagram and the structure tables in STPA, **the selection is shared between the views, but focus stays in the view you are working in.** The other view follows by showing and scrolling to the selection. It does not take over the keyboard. This is how VS Code, Visio and File Explorer work, for example.

- **The selection follows, not the indication.** An arrow in the diagram (5.2) does not scroll the table. Selecting in the diagram selects and scrolls to the object's rows in the table. ↑/↓ to a row that belongs to another object selects that object in the diagram, just like a click on the row.
- **The other view only scrolls if the selection is not visible**, to the nearest position rather than centred, so that it does not jump at every row change. On a mouse click the object may be centred.
- **Each view is a single Tab stop.** Tab and Shift+Tab move between the views; inside a view the arrow keys are used. The fields in the diagram's objects are not reached with Tab, they are edited with Enter or F2 (5.4).
- **When you enter the table** focus lands on the first row of the selected object. **When you enter the diagram** the indication lands on the selected object.
- **In the table the conventions of tables apply:** arrows between cells when not editing, Enter or F2 (or starting to type) edits the cell. While editing, Enter saves, Esc cancels and Tab goes to the next cell. **Esc with no edit in progress** leaves the table and goes to the object in the diagram. ✕ is reached with Tab (4.2).
- **An object with several rows:** selecting in the diagram selects all its rows and focus lands on the first. ↑/↓ between rows of the same object does not change the selection in the diagram.

**Current state (2026-11-04):**

| Tool | Navigate with arrows | Mouse and keyboard | Linked views | Select several | Move several | No overlap | Warning |
|---|---|---|---|---|---|---|---|
| STPA | Missing | – | A click in the diagram shows the row in the structure table | Shift+click on blocks, control actions and feedback (connections should be reached through the table instead, 5.1) | Missing (the diagram places itself) | The diagram places itself | – |
| HTA | Follows the tree: ↑ parent, ↓ next in tree order, ←/→ only among siblings | The mouse does not clear the keyboard's indication | With the mouse in both directions; missing with the keyboard, and Tab goes between the text fields in the tasks | Missing (one task at a time) | Missing; plain arrows move a selected task | The tree places itself | – |
| Bowtie | Own rules per object type | The mouse does not clear the keyboard's indication | – (no table) | Shift+click on barriers, Ctrl/⌘+click on cards | ←/→ moves selected barriers, Alt+↑/↓ moves cards | Yes | Yes: preventive and recovery barriers are not moved together |

### 5.10 Building and changing the structure in the diagram

The user must be able to build and change the structure of the analysis directly in the diagram, with keyboard and mouse and without AI (1.2, points 3 and 4). The AI panel is a complement. The rules are common; each tool states its own requirements in `design-<tool>.md`, for STPA [design-stpa.en.md](design-stpa.en.md).

- **Three ways to add: above, below and beside the selected object.** The commands are called *Add Above*, *Add Below* and *Add Beside*. The words say where the new object ends up in the diagram, not how it relates in the model. With nothing selected the commands cannot be used.
- **One command does the whole job.** The object is added, connected according to the rules of the model, selected, and its name can be typed at once: focus goes to the name cell on the object's row in the table (5.9), not to a box in the diagram. Texts the user is meant to write are left empty; the tool does not make anything up.
- **The whole addition is one undo step** (Ctrl/⌘+Z), even when several links were created.
- **Several selected objects get one shared new object**, connected to all of them. If the selected objects do not belong together, for example for *Add Beside* when they have different parents, the tool warns as in 5.8 and changes nothing.
- **Objects and links without text show their id.** A link or object that the user has not written anything for is still visible, can be selected and shows where text is missing. The id is replaced by the text when it is written. Example: a new control action without text is shown with the label *ca3*, and with *ApplyBrakes* once filled in.
- **A tool can limit the selection to one kind of object.** Shift+click and Ctrl/⌘+click then only add objects of the same kind, and an object of another kind replaces the selection. STPA does this for blocks, control actions and feedback.
- **Delete removes the selection together with what belongs to it**, for example its links, and can be undone in one step.
- **Each command has a button in the toolbar above the diagram**, with the key in the tooltip (5.4). The button is inactive when the command cannot be used, so that it shows what is possible. They are ordinary buttons: Enter is the key of the primary button (4.5).
- **The letter keys are off while typing**, and **?** opens the help with the keys that apply.
- **Links between existing objects** are changed in the tables, not with link modes of their own (5.1).
- **Diagram and tables are two ways into the same model.** The selection is shared and the text is edited in the table (5.9).

**Current state (2026-11-08):** not built, and *Add Above* is postponed. STPA is the first tool (see [design-stpa.en.md](design-stpa.en.md)). HTA has *C*, *S* and *D* today, with the tool's own words *Child*, *Sibling* and *Duplicate*; aligning the words in all tools is a separate decision.
