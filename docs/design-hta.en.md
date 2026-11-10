# Design: HTA

**Status:** decided (2026-11-10). None of this is built. The look is drawn in Penpot (the HTA file and HFA DS); tests and the build wait until the graphics have been reviewed. Swedish version: [design-hta.md](design-hta.md).

The general rules are in the design principles ([4.10 the title bar](design-principles.md), [4.11 drag bar](design-principles.md), [4.12 views](design-principles.md), [4.13 panels](design-principles.md), [5.10](design-principles.md) and [1.6 images in the AI support](design-principles.md)). This document describes what applies to HTA. The same pattern as [design-stpa.en.md](design-stpa.en.md) and [design-bowtie.en.md](design-bowtie.en.md): general rules in the design principles, the tool's own requirements here.

## 1. Goal

HTA must have **the same structure as STPA and Bowtie**: a title bar, panels as cards with a border and a header row, drag bars between the panels and an analysis panel at the far right. Someone who knows one tool must know the others.

## 2. Decisions

1. **The screen.** The app area has the tree (*HTA Panel*, 360 px) on the left and the TTA table (*TTA Panel*) on the right, with a drag bar between (4.11). The analysis panel (*AI panel*, 420 px, titled *HTA analysis*) is in full height at the far right with a drag bar between.
2. **Panels.** *HTA Panel* and *TTA Panel* are cards: `background.elevated` on the page (`base`), a 1 px `foreground.muted` border and radius 8 (4.13).
3. **The tree's header row.** The title **HTA** comes first and the commands *Add Child*, *Add Sibling* and *Duplicate* follow it, on the same row and with the same centre line (4.13). The keys are **C**, **S** and **D**, shown as underlined letters in the button's text: Add <u>C</u>hild, Add <u>S</u>ibling and <u>D</u>uplicate (5.10). The tree is below the row.
4. **The TTA panel's header row.** The title **TTA** comes first and *Columns…*, *Filter*, *Export CSV* and *Add row* follow it. They are *Compact Button* (28 px) and have no key, so no underline.
5. **Title bar.** *Title bar* (4.10, *Tool* = *HTA*, the application name *HFA HTA*) spans the app area with *New*, *Open…*, *Save…*, *Undo* and *?* on the left and *Theme* on the right. When the analysis panel is closed the title bar spans the full width and has *Hide panel* at the far right. *Save…* has an ellipsis, since it creates a new file (4.4).
6. **The analysis panel** is the component *AI panel* from HFA DS, with the same header, scope, log and question field as in the other tools. Images can be pasted or dragged into the question field (1.6, the requirements *STPA-AI-IMG* in [design-stpa.en.md](design-stpa.en.md)), since the function is built in the shared panel.
7. **Typography.** All texts are bound to typography tokens (Open Sans). The shared TTA components in HFA DS (*TTA Table*, *TTA Row*, *TTA Column Picker* and others) are bound.

## 3. Requirements in Gherkin

A requirement is one sentence with an id. Below it are the scenarios that show it holds. Each scenario gets a Playwright test in `tests/hta/` with the scenario's id in the name of the test. Scenarios tagged `@later` are skipped.

### HTA-ADD: the commands in the tree's header row

**The tree's header row shows the title HTA followed by Add Child, Add Sibling and Duplicate on the same row. The keys C, S and D do the same as the buttons, and the key is visible as an underlined letter in the button.**

```gherkin
Feature: The commands in the tree's header row
  Background:
    Given HTA is open with a tree where the task "1" is selected

  @HTA-ADD-1
  Scenario: The header row has the title and the commands on the same row
    Then the header row shows HTA, Add Child, Add Sibling and Duplicate on the same row

  @HTA-ADD-2
  Scenario: Add Child adds a subtask
    When the user clicks Add Child
    Then the model has a new task under "1"
    And the new task is selected

  @HTA-ADD-3
  Scenario: The buttons and the keys do the same
    When the user presses C
    Then the model has one more task under "1"
    When the user presses S
    Then the model has a new task beside the selected one
    When the user presses D
    Then the model has a copy of the selected task

  @HTA-ADD-4
  Scenario: The key is shown as an underlined letter
    Then Add Child shows an underlined C, Add Sibling an underlined S and Duplicate an underlined D

  @HTA-ADD-5
  Scenario: The letter keys are off while typing
    Given a task's name is being edited
    When the user types "Cd"
    Then the field contains "Cd"
    And no new tasks have been added
```

### HTA-TTA: the TTA panel's header row

**The TTA panel's header row shows the title TTA followed by Columns…, Filter, Export CSV and Add row on the same row.**

```gherkin
Feature: The TTA panel's header row
  @HTA-TTA-1
  Scenario: The header row has the title and the commands on the same row
    When HTA is open
    Then the TTA panel's header row shows TTA, Columns…, Filter, Export CSV and Add row on the same row
    And the buttons have no underlined key
```

### HTA-AI: the analysis panel and the title bar

**The analysis panel is in full height at the far right, and the title bar spans the app area. When the panel is closed the title bar spans the full width and the panel toggle is shown in it.**

```gherkin
Feature: The analysis panel and the title bar
  @HTA-AI-1
  Scenario: The title bar spans the app area when the panel is open
    Given the analysis panel is open
    Then the title bar spans the tree and the TTA table but not the analysis panel
    And the title bar shows Theme but not Hide panel

  @HTA-AI-2
  Scenario: The title bar expands when the panel is closed
    Given the analysis panel is open
    When the user clicks the panel toggle in the panel's header
    Then the analysis panel is hidden
    And the title bar spans the full width
    And the title bar shows Theme and Hide panel at the far right

  @HTA-AI-3
  Scenario: Hide panel opens the panel again
    Given the analysis panel is closed
    When the user clicks Hide panel in the title bar
    Then the analysis panel is open
    And Hide panel is gone from the title bar
```

## 4. Not included

- Keys on the TTA buttons (*Columns…*, *Filter*, *Export CSV* and *Add row*).
- The column picker (*TTA Column Picker*) and the column dialog (*TTA Column Dialog*) are not changed, except for the typography.
- The images in the AI panel are specified in [design-stpa.en.md](design-stpa.en.md) (*STPA-AI-IMG*) and apply to HTA in the same way.

## 5. Open points to settle during the build

- **Arrow navigation.** HTA navigates by the tree today (↑ parent, ↓ next in tree order, ←/→ among siblings). That is to be replaced by 5.2 (the nearest task in the direction of the arrow on the screen), with indication and selection as in 5.3 and 5.4. The requirements exist for STPA (*STPA-NAV* and *STPA-SEL* in [design-stpa.en.md](design-stpa.en.md)) and corresponding scenarios are written for HTA when it is built.
- **Undo.** *Title bar* has *Undo* in all tools, but HTA has no undo today. Either undo is built in HTA, or the button is shown inactive until it exists.
- **The width of the TTA table.** In the open state *TTA Panel* is 746 px wide, but the six columns together are about 880 px. The table scrolls sideways or the columns shrink. This is decided at the review.
- **The key for the panel toggle.** Today it is **A**, and the plan is that it moves to **I** when *Add Above* is built (4.7). The shared panel decides this during the build.
- **The tree's placement.** The tree and the connector lines are moved 40 px down to make room for the commands. It is a drawing with free shapes, and in the build the layout places the tree.
- **Shared components.** *Legend*, *Compact Button* (with *Key*) and *AI panel* come from HFA DS and must be published for the HTA file to see the changes.

## 6. Next steps

1. Review the graphics.
2. Write the tests in `tests/hta/` and build in HTA, with the header row and the commands first.
3. Add the shared test that checks that every `@HTA-…` id here has a test. Scenarios tagged `@later` are skipped.
4. Build the image paste in the shared AI panel together with STPA.
