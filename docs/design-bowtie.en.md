# Design: Bowtie

**Status:** decided (2026-11-10). None of this is built. The look is drawn in Penpot (the Bowtie file); tests and the build wait until the graphics have been reviewed. Swedish version: [design-bowtie.md](design-bowtie.md).

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

## 4. Not included

- Drag bars between the zones of the diagram.
- The content of the help dialog beyond what is already there (*Help – Keyboard shortcuts*).

## 5. Open points to settle during the build

- **The legend in HFA DS.** The component *Legend* has no header row and no states (*Expanded* and *Collapsed*) yet, and no border. That is done in HFA DS, and then the closed state is drawn in the Bowtie file.
- **Narrow windows.** Should the legend be closed by default below a certain width? A suggestion, not a decision.
- **How the key looks** is decided: an underlined letter in the button's text (5.10). *Compact Button* has an optional element, *Key*, for it. *Add Cause*, *Add Preventive Barrier*, *Add Reactive Barrier* and *Add Consequence* get an underlined **C**, **B**, **R** and **Q**.
- **The width of the screen.** The open state is 2014 px wide, since the diagram (1294 px) and the legend keep their size. That is wider than STPA and HTA. This is decided at the review.
- **The hover rise** is removed from the Bowtie code during the build.

## 6. Next steps

1. Draw *Legend* with ▾, a border and the states *Expanded* and *Collapsed* in HFA DS, and put them in the Bowtie file.
2. Review the graphics.
3. Write the tests in `tests/bowtie/` and build in Bowtie, with the legend and the header row first.
4. Add the shared test that checks that every `@BOWTIE-…` id here has a test. Scenarios tagged `@later` are skipped.
