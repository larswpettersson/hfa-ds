# Design: Bowtie

**Status:** decided (2026-11-10). The title bar, the panel with the Add commands, the legend and the arrow navigation are built, and since 2026-11-14 also the barrier width and undo/redo; the rest waits. The look is drawn in Penpot (the Bowtie file); tests and the build wait until the graphics have been reviewed. Swedish version: [design-bowtie.md](design-bowtie.md).

The general rules are in the design principles ([4.10 the title bar](design-principles.md), [4.11 drag bar](design-principles.md), [4.12 views and legend](design-principles.md), [4.13 panels](design-principles.md), [4.14 undo and redo](design-principles.md) and [5.10](design-principles.md)). This document describes what applies to Bowtie. The same pattern as [design-stpa.en.md](design-stpa.en.md): general rules in the design principles, the tool's own requirements here.

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
8. **Undo and redo** follow the general rule in the design principles ([4.14](design-principles.md)). What is specific to Bowtie: the link mode for a barrier is one step, which is kept when the links are applied or cancelled.

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

**The arrow keys move the indication (a hovered shadow) to the nearest card, barrier, hazard or top event in the arrow's direction on the screen (5.2). The mouse and the arrow keys share the indication (5.3). Arrows do not select and Ctrl/⌘+arrow is not used. When an object is selected an arrow moves it in the directions it can move, and Alt/Option+arrow does the same (5.6). A click anywhere on an object selects it, text included, and Enter edits the text (5.11). Ctrl/⌘+Enter selects the indicated object and Enter alone edits it.**

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
    Given the indication is on "C2" and nothing is selected
    When the user presses ↓
    Then the indication moves and nothing is selected
    When the user presses Ctrl/⌘+→
    Then the indication is unchanged

  @BOWTIE-NAV-8
  Scenario: Alt/Option+arrow moves the selected barriers
    Given the barrier "P4" is selected with Shift+click
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
 
  @BOWTIE-NAV-10
  Scenario: A plain arrow moves the selected object in the directions it can move
    Given the cause "C2" is selected
    When the user presses ↓
    Then "C2" has swapped places with the cause below
    When the user presses ←
    Then "C2" has not moved
    Given the barrier "P4" is selected
    When the user presses ←
    Then "P4" has moved one column to the left

  @BOWTIE-SEL-3
  Scenario: A click on the text of a card selects the card
    Given nothing is selected
    When the user clicks the text of the cause "C2"
    Then "C2" is selected
    And no text has a text cursor

  @BOWTIE-SEL-4
  Scenario: A click on the text of the top event or a barrier selects it
    When the user clicks the text of the top event
    Then the top event is selected
    When the user clicks the text of the barrier "P2"
    Then "P2" is selected

  @BOWTIE-SEL-5
  Scenario: Enter edits the text of the selected object, and an id cannot be edited
    Given the user has clicked the id of the cause "C2"
    Then "C2" is selected and its id has no text cursor and is not editable
    When the user presses Enter
    Then the text of "C2" has a text cursor
    When the user types a new text and presses Enter
    Then "C2" has the new text
```

### BOWTIE-TEXT: the viewable text

**A text is shown with at most 100 characters (5.11). A longer text ends with three dots, `...`. The full text is kept and is shown while the text is edited, and in a tooltip while the object is hovered or indicated with the arrow keys (5.11). Enter and Esc remove the tooltip. The longest text is 300 characters, with a warning from 240.**

```gherkin
Feature: The viewable text
  @BOWTIE-TEXT-1
  Scenario: A long text is capped with three dots
    Given the user has entered a text of 150 characters for the top event
    When the text editing mode ends
    Then the top event shows the first 100 characters followed by "..."
    And the saved diagram still holds all 150 characters

  @BOWTIE-TEXT-2
  Scenario: Hovering an object with a capped text shows the full text
    Given the cause "C1" has a text of 159 characters
    When the mouse is over "C1"
    Then a tooltip next to "C1" shows all 159 characters
    When the mouse leaves "C1"
    Then the tooltip is gone

  @BOWTIE-TEXT-3
  Scenario: An arrow shows the tooltip too, and Enter removes it
    Given the cause "C2" has a short text and is indicated
    Then there is no tooltip
    When the user presses ↑ and the indication reaches "C1"
    Then the tooltip with the full text of "C1" is shown
    When the user presses Enter
    Then the tooltip is gone and the text of "C1" has a text cursor

  @BOWTIE-TEXT-4
  Scenario: The longest text is 300 characters
    Given the cause "C1" is in the text editing mode
    When the user pastes 400 characters
    Then only 300 characters are inserted
    And a warning says that the longest text is 300 characters and recommends referring to another document

  @BOWTIE-TEXT-5
  Scenario: From 240 characters a warning recommends another document
    Given the text of "C1" has 239 characters in the text editing mode
    Then there is no warning
    When the user types one more character
    Then a warning says "240 of 300 characters" and recommends referring to another document for the details

  @BOWTIE-TEXT-6
  Scenario: The tooltip is an ARIA tooltip, also in link mode, and Esc dismisses it
    Given "C1" has a capped text and the barrier "P3" is selected
    When the mouse is over "C1"
    Then a tooltip with role "tooltip" shows the full text, and "C1" points at it with aria-describedby
    When the user presses Esc
    Then the tooltip is gone and "C1" no longer points at it

  @BOWTIE-TEXT-7
  Scenario: Any element with data-tip gets a tooltip
    Given a button has the attribute data-tip "Ångra senaste ändringen"
    When the mouse is over the button
    Then a tooltip shows "Ångra senaste ändringen"
    When the mouse leaves the button
    Then the tooltip is gone

  @BOWTIE-TEXT-8
  Scenario: A text of many short lines fits: the tooltip's height is capped and it scrolls
    Given "C1" has a text of exactly 300 characters in 150 lines
    When the mouse is over "C1"
    Then the tooltip is at most 40 % of the window high, inside the window, and scrolls to show the rest

  @BOWTIE-TEXT-9
  Scenario: A text over 300 characters from a file is shown whole in the tooltip
    Given "C1" has a text of 353 characters from a file, ending with "END"
    When the mouse is over "C1"
    Then the tooltip shows the whole text, "END" included

  @BOWTIE-TEXT-10
  Scenario: The pointer can rest on the tooltip, focus leaving hides it, and other descriptions are kept
    Given the Undo button has data-tip "Ångra" and aria-describedby "other"
    When the mouse is over the button and then moves onto the tooltip
    Then the tooltip stays, and the button's aria-describedby is "other hfaTooltip"
    When the mouse leaves the tooltip
    Then the tooltip is gone and aria-describedby is "other" again
    When the button gets focus with the keyboard and the user presses Tab
    Then the tooltip is gone
```

### BOWTIE-LINK: linking a barrier to causes and consequences

**A selected barrier is linked to the causes (or consequences) it protects. The numbers are the numbers in the ids (C12 is 12, K3 is 3), not the row numbers. 1–9 toggle the link at once. A number above 9 is typed with Alt/Option held: Alt+1+2, then release Alt, toggles number 12. A bar next to the Add buttons lists the ids of what the barrier protects.**

```gherkin
Feature: Linking by number
  Background:
    Given Bowtie is open with the example diagram and 9 more causes added (C5–C13)
    And the barrier "P3" is selected

  @BOWTIE-LINK-1
  Scenario: A number above 9 is typed with Alt held
    When the user holds Alt/Option, presses 1 and then 2
    Then the bar shows "Alt+1+2"
    When the user releases Alt/Option
    Then "P3" protects "C12"
    When the user does the same again
    Then "P3" no longer protects "C12"

  @BOWTIE-LINK-2
  Scenario: The digits 1–9 follow the id, not the row
    Given "C3" has been moved to the first row
    When the user presses 3
    Then "P3" protects "C3"

  @BOWTIE-LINK-3
  Scenario: A bar lists the ids of what the barrier protects
    Then the bar shows "P3 protects causes: C4"
    When the user presses 3
    Then the bar shows "C3, C4"
    When the user presses Esc
    Then the bar is hidden
```

### BOWTIE-EDIT: focus and the transitions of editing

**A click on an object moves the keys to the diagram, an edit is never lost when the user moves on, and Tab confirms (5.11).**

```gherkin
Feature: Focus and the transitions of editing
  @BOWTIE-FOCUS-1
  Scenario: Enter after a click edits the object and does not send the AI question
    Given the question field of the AI panel has the draft "ett utkast" and focus
    When the user clicks the text of the cause "C1" and presses Enter
    Then the text of "C1" has a text cursor
    And the draft is still in the question field and nothing has been sent

  @BOWTIE-EDIT-1
  Scenario: An edit after an Enter-confirmed edit is kept when the user clicks another object
    Given the user has edited "C1" and confirmed with Enter
    When the user edits "C2" and then clicks the text of "C3"
    Then both edits are kept and "C3" is selected

  @BOWTIE-EDIT-2
  Scenario: Tab confirms the edit
    Given the user is editing the text of "C1"
    When the user presses Tab
    Then the new text of "C1" is kept
```

### BOWTIE-KEYS: Alt+digits in every browser

**Alt/Option+digits is the way to a number above 9 (BOWTIE-LINK). It must work in Chrome, Edge, Safari and Firefox on Windows, macOS and Linux and must not take the browser's own shortcuts (5.12). The tests run in Chromium, WebKit and Firefox with the operating system simulated by its events; the real shortcuts are checked by hand (5.12).**

```gherkin
Feature: Alt+digits and the browser
  Background:
    Given Bowtie is open with 13 causes and the barrier "P3" is selected

  @BOWTIE-KEYS-1
  Scenario: Alt+1+2 links number 12
    When the user holds Alt, presses 1 and 2 and releases Alt
    Then "P3" protects "C12"

  @BOWTIE-KEYS-2
  Scenario: macOS Option gives other characters, and the code decides
    When the keys arrive as Option+1 ("¡") and Option+2 ("™") with the codes Digit1 and Digit2
    Then "P3" protects "C12"

  @BOWTIE-KEYS-3
  Scenario: The number pad works too
    When the user holds Alt and presses 1 and 2 on the number pad
    Then "P3" protects "C12"

  @BOWTIE-KEYS-4
  Scenario: The page takes the keys so that the browser's shortcut does not run
    When the user presses Alt+1
    Then the page has called preventDefault
    When the user releases Alt after the combination
    Then the page has called preventDefault, so that the menu bar does not get focus

  @BOWTIE-KEYS-5
  Scenario: The browser's own shortcuts are left alone
    When the user presses Ctrl+1, ⌘+1, Ctrl+Alt+1 (AltGr), Alt+Shift+1 or Ctrl+Shift+1
    Then the page has not called preventDefault
    And no link has changed

  @BOWTIE-KEYS-6
  Scenario: Outside the link mode nothing is taken
    Given no barrier is selected
    When the user presses Alt+1 and releases Alt
    Then the page has not called preventDefault

  @BOWTIE-KEYS-7
  Scenario: Alt+arrow moves the barrier and is taken from the browser's back and forward
    When the user presses Alt+←
    Then the page has called preventDefault
    And the barrier has moved one column to the left or stays at the edge
```

### BOWTIE-FILE: the file describes its format

**A saved file starts with a "$comment" that states the format and its limits (design principles 4.15). The data files in the repository carry the same note, and a file with a text over the limit is opened with a warning.**

```gherkin
Feature: The file describes its format
  @BOWTIE-FILE-1
  Scenario: Save writes the format note first
    When the user presses Save
    Then the file's first key is "$comment", equal to the tool's format note, which says that a text is at most 300 characters

  @BOWTIE-FILE-2
  Scenario: The data files carry the same note
    Then every JSON file in hfa-bowtie/data and hfa-bowtie/fixtures has the tool's format note as "$comment"

  @BOWTIE-FILE-3
  Scenario: Opening a file with a text over 300 characters warns and keeps the text
    When the user opens a file where "C1" has a text of 320 characters
    Then a warning says that the longest text is 300 characters
    And after "Open anyway" "C1" has all 320 characters
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

**Bowtie undoes and redoes by the general rule (4.14): every change is a step that can be undone with the Undo button or Ctrl/⌘+Z and redone with Ctrl/⌘+Shift+Z or Ctrl+Y, up to 100 steps. Linking a barrier is one step.**

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

## 5. Open points to settle during the build

- **The legend in HFA DS.** The component *Legend* has no header row and no states (*Expanded* and *Collapsed*) yet, and no border. That is done in HFA DS, and then the closed state is drawn in the Bowtie file.
- **Narrow windows.** Should the legend be closed by default below a certain width? A suggestion, not a decision.
- **How the key looks** is decided: an underlined letter in the button's text (5.10). *Compact Button* has an optional element, *Key*, for it. *Add Cause*, *Add Preventive Barrier*, *Add Reactive Barrier* and *Add Consequence* get an underlined **C**, **B**, **R** and **Q**.
- **The width of the screen.** The open state is 2014 px wide, since the diagram (1294 px) and the legend keep their size. That is wider than STPA and HTA. This is decided at the review.
- **The hover rise** is removed from the Bowtie code during the build.
- **Arrow navigation** is built (BOWTIE-NAV and BOWTIE-SEL above): the arrows follow the screen and only count objects in the arrow's direction (an object far to the side does not), and a selected card moves up and down and a selected barrier left and right with the arrows (Alt/Option+arrow does the same), also in the link mode for barriers, where ↑/↓ still browse the link targets. Several selected cards are not moved as a group (5.6).

- **The width of a barrier in Penpot.** Penpot has no sizing rule that follows the longest word of a wrapped text, and min/max only apply when the sizing is *Fill*. In the Bowtie file the barrier columns are therefore fixed, and the width is recalculated with a script when a text changes. A request for content-based sizing with min/max has been written for the Penpot developers.
- **Text size in the barrier.** Penpot has a 14 px description and a 12 px id, the code has 16 px for both. The limits are set in characters and therefore give different pixel values (see the table in section 2). Which size applies is decided at the review.
- **Barrier tokens.** The character width 0.543 em and the limits of 6 and 12 characters are only in the Bowtie code and in the Penpot component, not in `tokens.json`.

## 6. Next steps

1. Draw *Legend* with ▾, a border and the states *Expanded* and *Collapsed* in HFA DS, and put them in the Bowtie file.
2. Review the graphics.
3. Write the tests in `tests/bowtie/` and build in Bowtie, with the legend and the header row first.
4. Add the shared test that checks that every `@BOWTIE-…` id here has a test. Scenarios tagged `@later` are skipped.
