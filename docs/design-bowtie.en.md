# Design: Bowtie

**Status:** decided (2026-11-10). The title bar, the panel with the Add commands, the legend and the arrow navigation are built, and since 2026-11-14 also the barrier width and undo/redo; the rest waits. The look is drawn in Penpot (the Bowtie file); tests and the build wait until the graphics have been reviewed. Swedish version: [design-bowtie.md](design-bowtie.md).

The general rules are in the design principles ([4.10 the title bar](design-principles.md), [4.11 drag bar](design-principles.md), [4.12 views and legend](design-principles.md), [4.13 panels](design-principles.md) and [5.10](design-principles.md)). This document describes what applies to Bowtie. The same pattern as [design-stpa.en.md](design-stpa.en.md): general rules in the design principles, the tool's own requirements here.

## 1. Goal

Bowtie must have **the same structure as HTA and STPA**, so that someone who knows one tool knows the others. The diagram is in a panel with a header row, and the parts the tools share (title bar, analysis panel, drag bar, typography) are the same.

## 2. Decisions

1. **Panel.** The diagram is in the panel *Bowtie Panel* (`background.elevated`, 1 px `foreground.muted` border, radius 8) on the page (`base`). The cards and barriers are `elevated` directly on the panel and keep their border (`foreground.base`) and the barriers' status colour.
2. **Header row.** The title **Bowtie** comes first, and the Add commands *Add Cause*, *Add Preventive Barrier*, *Add Reactive Barrier* and *Add Consequence* follow it, on the same row (4.13). They used to be in a toolbar.
3. **Keys.** *Add Cause* **C**, *Add Preventive Barrier* **B**, *Add Reactive Barrier* **R** and *Add Consequence* **Q** (as in the help dialog). The key is shown as an underlined letter in the button's text (5.10).
4. **Title bar and analysis panel.** The title bar (4.10, *Tool* = *Bowtie*) spans the app area. The analysis panel (420 px, titled *Bowtie analysis*) is in full height at the far right with a drag bar between (4.11). When the panel is closed the title bar spans the full width and has *Hide panel* at the far right.
5. **The legend** is in a column of its own beside the panel, `sunken` with a border, and can be folded with ▾ (4.12). It no longer rises when the mouse passes, and it never covers the diagram.
6. **Typography.** All texts are bound to typography tokens (Open Sans).
7. **The width of a barrier follows its text.** A barrier is as wide as the longest word in its description, between **6 characters** (the mean word length in Swedish technical text, 5.7, rounded up) and **12 characters**. Words longer than 12 characters are hyphenated. There are 4 px between the border and the text sideways and 8 px vertically. The background is below the table.
8. **Undo and redo** work as in HTA and STPA: the *Undo* button in the title bar and Ctrl/⌘+Z undo, Ctrl/⌘+Shift+Z and Ctrl+Y redo. There is no button of its own for redo.

**The width of a barrier in numbers.** A character counts as 0.543 em, measured on long Swedish compounds in Open Sans (7.6 px at 14 px text). The width is the number of characters times the character width plus the side padding (2 × 4 px).

| | Characters | Penpot (14 px text) | The code (16 px text) |
|---|---|---|---|
| Minimum width | 6 | 54 px | 60 px |
| Maximum width | 12 | 100 px | 112 px |

- **Why 6 and 12.** In Swedish technical text the mean word length is 5.4–6.0 characters, 90% of the running words are at most 11 characters and 95% at most 13 (Sigurd et al. 2004; Björnsson 1968). Barrier texts are mostly technical terms and have more long words than running text, so some words are hyphenated.
- **A column is as wide as its widest barrier.** A barrier with short words in the same column as one with long words gets the same width.
- **In the code** the barrier columns are `min-content`, and the barrier has `min-width` and `max-width`. An invisible copy of the full description without hyphenation gives the width, so that the visible text can be hyphenated (`hyphens: auto`) without the barrier shrinking to the minimum width.
- **In Penpot** the main component *Barrier* (HFA DS, nine variants) has horizontal sizing *Fill* with min 54 and max 100. Penpot cannot let the width follow the longest word, see the open points.

There are no drag bars between the zones of the diagram (causes, top event, consequences), since the zones are not panels.

## 3. Requirements in Gherkin

A requirement is one sentence with an id. Below it are the scenarios that show it holds. Each scenario gets a Playwright test in `tests/bowtie/` with the scenario's id in the name of the test. Scenarios tagged `@later` are skipped.

### BOWTIE-LEGEND: the legend

**The legend can be folded and unfolded with a ▾ on its header row. It is in a column of its own and never covers the diagram, and it does not rise on hover.**

```gherkin
Feature: The legend
  Background:
    Given Bowtie is open with a diagram and the legend open

  @BOWTIE-LEGEND-1
  Scenario: The legend is folded with a click on the header row
    When the user clicks the legend's header row
    Then the legend shows only the header row
    And the arrow shows ▸
    And the diagram still has its whole area

  @BOWTIE-LEGEND-2
  Scenario: The legend is controlled with the keyboard
    Given focus is on the legend's header row
    When the user presses Enter or Space
    Then the legend opens or closes
    And the header row has aria-expanded that shows the state

  @BOWTIE-LEGEND-3
  Scenario: The choice is remembered
    Given the user has closed the legend
    When the page is reloaded
    Then the legend is still closed

  @BOWTIE-LEGEND-4
  Scenario: The legend never covers the diagram
    Given the window is narrower than the diagram and the legend together
    Then the diagram scrolls inside the panel
    And the legend stays in its own column
    And no cause, barrier or consequence is hidden by the legend

  @BOWTIE-LEGEND-5
  Scenario: The legend does not rise on hover
    When the pointer is held over the legend
    Then the legend changes neither place, size nor layer
```

### BOWTIE-ADD: the Add commands in the panel's header row

**The panel's header row shows the title Bowtie followed by the Add commands on the same row. The keys C, B, R and Q do the same as the buttons, and the key is visible on the button.**

```gherkin
Feature: The Add commands
  @BOWTIE-ADD-1
  Scenario: The header row has the title and the Add commands on the same row
    When Bowtie is open
    Then the header row shows Bowtie, Add Cause, Add Preventive Barrier, Add Reactive Barrier and Add Consequence on the same row

  @BOWTIE-ADD-2
  Scenario: The buttons and the keys do the same
    Given the diagram has a top event
    When the user clicks Add Cause
    Then the model has a new cause
    When the user presses C
    Then the model has one more cause

  @BOWTIE-ADD-3
  Scenario: The key is visible on the button
    When Bowtie is open
    Then each Add button shows its key as an underlined letter in the text (C, B, R or Q)
```

### BOWTIE-NAV: indication, selection and arrow navigation

**The arrow keys move the indication (a hovered shadow) to the nearest card, barrier, hazard or top event in the arrow's direction on the screen (5.2). The mouse and the arrow keys share the indication (5.3). Arrows do not select, Ctrl/⌘+arrow is not used, and Alt/Option+arrow moves the selected objects (5.6). Ctrl/⌘+Enter selects the indicated object and Enter alone edits it.**

```gherkin
Feature: Indication, selection and arrow navigation
  Background:
    Given Bowtie is open with the example diagram (causes C1–C4, barriers P1–P4, the hazard, the top event, R1–R3 and consequences K1–K3)

  @BOWTIE-NAV-1
  Scenario: An arrow moves the indication
    Given the indication is on the top event
    When the user presses →
    Then the indication is on an object to the right of the top event and is shown as a hovered shadow
    And the selection is unchanged

  @BOWTIE-NAV-2
  Scenario: Objects on the same row come first
    Given the indication is on the cause "C1"
    When the user presses →
    Then the indication is on a barrier on the same row as "C1"

  @BOWTIE-NAV-3
  Scenario: At the edge the indication stays
    Given the indication is on the consequence "K3", at the bottom and the far right
    When the user presses ↓ and then →
    Then the indication stays on "K3"

  @BOWTIE-NAV-4
  Scenario: The mouse takes over the indication
    Given the indication is on an object after a key press
    When the mouse moves over "K2"
    Then the indication is on "K2" and the previous object has no indication
    When the user presses ↑
    Then the indication moves from "K2"

  @BOWTIE-NAV-5
  Scenario: The arrow key takes over from the mouse
    Given the mouse is over "C1"
    When the user presses ↓
    Then the indication is on another object
    And "C1" no longer has the hovered shadow

  @BOWTIE-NAV-6
  Scenario: Only a real mouse movement counts
    Given the indication is on an object after a key press
    When another object ends up under a still pointer, for example when the diagram scrolls
    Then the indication stays

  @BOWTIE-NAV-7
  Scenario: Arrows do not select, and Ctrl/⌘+arrow is not used
    Given "C2" is selected
    When the user presses ↓
    Then the indication moves but "C2" is still selected
    When the user presses Ctrl/⌘+→
    Then the indication is unchanged

  @BOWTIE-NAV-8
  Scenario: Alt/Option+arrow moves the selected barriers
    Given the barrier "P4" is selected with Shift+click
    When the user presses ←
    Then the barrier stays
    When the user presses Alt/Option+←
    Then the barrier has moved one column to the left

  @BOWTIE-NAV-9
  Scenario: Alt/Option+arrow moves the selected card one row
    Given the cause "C2" is selected
    When the user presses Alt/Option+↓
    Then "C2" has swapped places with the cause below

  @BOWTIE-SEL-1
  Scenario: Ctrl/⌘+Enter selects the indicated object
    Given the indication is on "C3"
    When the user presses Ctrl/⌘+Enter
    Then "C3" is selected

  @BOWTIE-SEL-2
  Scenario: Enter alone starts the text editing mode and does not select
    Given the indication is on "C3" and nothing is selected
    When the user presses Enter
    Then the card's text has a text cursor
    And "C3" is not selected
```

### BOWTIE-WIDTH: the width of a barrier

**A barrier is as wide as the longest word in its description, at least 6 and at most 12 characters wide. A column is as wide as its widest barrier, and words longer than the maximum width are broken.**

```gherkin
Feature: The width of a barrier
  Background:
    Given Bowtie is open with the example diagram
    And the barrier "P4" is alone in its column

  @BOWTIE-WIDTH-1
  Scenario: The width follows the longest word
    When the description of "P4" is "Backventil på ledning"
    Then "P4" is as wide as the word "Backventil" plus side padding and border
    And the width is between the minimum and the maximum width

  @BOWTIE-WIDTH-2
  Scenario: Short words give the minimum width
    When the description of "P4" is "Lås på lucka"
    Then "P4" has the minimum width (6 characters)

  @BOWTIE-WIDTH-3
  Scenario: A word longer than the maximum width is broken
    When the description of "P4" is "Skydd vid extremvädersförhållanden"
    Then "P4" has the maximum width (12 characters)
    And the text does not stick out of the barrier sideways

  @BOWTIE-WIDTH-4
  Scenario: A column is as wide as its widest barrier
    Given "P1", "P2" and "P3" are in the same column
    When the description of "P2" is "Vakt vid port" and "P1" has a word longer than 12 characters
    Then "P1", "P2" and "P3" have the same width

  @BOWTIE-WIDTH-5
  Scenario: The width and the connectors follow while the user types
    Given the description of "P4" is "Lås på lucka"
    When the user types "Hastighetsövervakning" in the description without leaving the field
    Then "P4" has the maximum width
    And the connectors still end at the edges of the cards and the barriers
```

### BOWTIE-UNDO: undo and redo

**Every change is a step that can be undone with the Undo button or Ctrl/⌘+Z and redone with Ctrl/⌘+Shift+Z or Ctrl+Y, up to 100 steps. New and an AI proposal can be undone, Open… starts a new history, and in a text field Ctrl/⌘+Z is the field's own undo.**

```gherkin
Feature: Undo and redo
  Background:
    Given Bowtie is open with the example diagram

  @BOWTIE-UNDO-1
  Scenario: The Undo button is enabled and says when there is nothing to undo
    Then the Undo button is enabled and its tooltip is "Undo the last change (Ctrl/⌘+Z)"
    When the user clicks Undo
    Then the status message is "Nothing to undo"

  @BOWTIE-UNDO-2
  Scenario: Ctrl/⌘+Z undoes one change at a time, Ctrl/⌘+Shift+Z and Ctrl+Y redo
    Given the user has added a cause and changed the description of "P1"
    When the user presses Ctrl/⌘+Z
    Then the description of "P1" is as before and the new cause is still there
    When the user presses Ctrl/⌘+Z again
    Then the new cause is gone
    When the user presses Ctrl/⌘+Shift+Z and then Ctrl+Y
    Then both changes are back
    When the user presses Ctrl+Y again
    Then the status message is "Nothing to redo"

  @BOWTIE-UNDO-3
  Scenario: Undoing back to the opened diagram leaves no unsaved changes
    Given the user has added a cause
    When the user clicks Undo
    Then the diagram has no unsaved changes

  @BOWTIE-UNDO-4
  Scenario: A new change after an undo drops the steps to redo
    Given the user has added a cause and undone it
    When the user adds a consequence and presses Ctrl/⌘+Shift+Z
    Then the status message is "Nothing to redo"

  @BOWTIE-UNDO-5
  Scenario: In a text field Ctrl/⌘+Z is the field's own undo
    Given the user has added a cause and is typing in the description of "P1"
    When the user presses Ctrl/⌘+Z in the field
    Then the new cause is still there

  @BOWTIE-UNDO-6
  Scenario: Linking a barrier is one step
    Given the user has changed which causes "P2" protects in the link mode and applied with Enter
    When the user presses Ctrl/⌘+Z
    Then "P2" protects the same causes as before
    When the user presses Ctrl/⌘+Shift+Z
    Then the change is back

  @BOWTIE-UNDO-7
  Scenario: Ctrl/⌘+Z undoes New
    When the user clicks New
    Then the question says "Ctrl/⌘+Z undoes it"
    When the user answers New and then presses Ctrl/⌘+Z
    Then the earlier diagram is back

  @BOWTIE-UNDO-8 @later
  Scenario: An AI proposal can be undone, and Open… starts a new history
    Given the user has applied a proposal from the analysis panel
    When the user presses Ctrl/⌘+Z
    Then the diagram is as before the proposal
    When the user opens a file and presses Ctrl/⌘+Z
    Then the status message is "Nothing to undo"
```

## 4. Not included

- Drag bars between the zones of the diagram.
- The content of the help dialog beyond what is already there (*Help – Keyboard shortcuts*).
- A button of its own for redo (as in HTA and STPA).
- The theme in the undo history: light or dark theme is a setting and not a step.

## 5. Open points to settle during the build

- **The legend in HFA DS.** The component *Legend* has no header row and no states (*Expanded* and *Collapsed*) yet, and no border. That is done in HFA DS, and then the closed state is drawn in the Bowtie file.
- **Narrow windows.** Should the legend be closed by default below a certain width? A suggestion, not a decision.
- **How the key looks** is decided: an underlined letter in the button's text (5.10). *Compact Button* has an optional element, *Key*, for it. *Add Cause*, *Add Preventive Barrier*, *Add Reactive Barrier* and *Add Consequence* get an underlined **C**, **B**, **R** and **Q**.
- **The width of the screen.** The open state is 2014 px wide, since the diagram (1294 px) and the legend keep their size. That is wider than STPA and HTA. This is decided at the review.
- **The hover rise** is removed from the Bowtie code during the build.
- **Arrow navigation** is built (BOWTIE-NAV and BOWTIE-SEL above): the arrows follow the screen and only count objects in the arrow's direction (an object far to the side does not), and moving has moved from the arrows to Alt/Option+arrow, also in the link mode for barriers. The link mode is otherwise unchanged.

- **The width of a barrier in Penpot.** Penpot has no sizing rule that follows the longest word of a wrapped text, and min/max only apply when the sizing is *Fill*. In the Bowtie file the barrier columns are therefore fixed, and the width is recalculated with a script when a text changes. A request for content-based sizing with min/max has been written for the Penpot developers.
- **Text size in the barrier.** Penpot has a 14 px description and a 12 px id, the code has 16 px for both. The limits are set in characters and therefore give different pixel values (see the table in section 2). Which size applies is decided at the review.
- **Barrier tokens.** The character width 0.543 em and the limits of 6 and 12 characters are only in the Bowtie code and in the Penpot component, not in `tokens.json`.

## 6. Next steps

1. Draw *Legend* with ▾, a border and the states *Expanded* and *Collapsed* in HFA DS, and put them in the Bowtie file.
2. Review the graphics.
3. Write the tests in `tests/bowtie/` and build in Bowtie, with the legend and the header row first.
4. Add the shared test that checks that every `@BOWTIE-…` id here has a test. Scenarios tagged `@later` are skipped.
