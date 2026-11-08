# Design: editing the control structure directly in the STPA diagram

**Status:** decided (2026-11-08). None of this is built. The look is drawn in Penpot in another chat; tests and the build wait until the graphics have been reviewed. Swedish version: [design-stpa.md](design-stpa.md).

The general rules are in [5.10 of the design principles](design-principles.md). This document describes what applies to STPA. The same pattern is used for HTA and Bowtie: general rules in the design principles, the tool's own requirements in `design-<tool>.md`.

## 1. Goal

The user must be able to build and change the control structure directly in the diagram, without AI, with as simple an interaction as possible. This follows from the principles in [1.2](design-principles.md): *the user does the analysis* and *AI is optional support, not the engine*. Keyboard and mouse do the same thing (5.4).

## 2. Decisions

The answers to the eight open questions, in short:

1. **Names:** *Add Above*, *Add Below* and *Add Beside*, with the keys **A**, **B** and **S**. The words *Child*, *Parent* and *Sibling* are not used in STPA.
2. **Type:** the type follows the position. A block with something below it is a *controller*, and the block at the bottom is a *controlled process*. The difference remains in the JSON, as in the Penpot design of process blocks. No type is chosen when a block is created.
3. **Actuator and sensor:** normally only control actions and feedback are used. *Convert to actuator* and *Convert to sensor* must exist for both and be easy to find.
4. **Links:** a new block always gets both a control action and a feedback, without text. The user writes the text. The links *L* and *F* are not built.
5. **Keys:** A, B and S. **A** was already the shortcut for the AI panel; it moves to **I** (see 5.4 and 4.7).
6. **Several selected:** one shared new block connected to all selected blocks.
7. **A new diagram** starts with one controller and one controlled process, connected by a control action and a feedback.
8. **Tables and JSON** stay as they are. The selection is shown in the table and the text is edited there (5.9).

Dragging to connect is not relevant for STPA. Left and right are not stored in the model: the order sideways follows the links and the list order in the JSON, and *Add Beside* does not name a side.

## 3. Requirements in Gherkin

A requirement is one sentence with an id. Below it are the scenarios that show it holds, numbered. Then describes the model and what the user sees, not how it is drawn. Each scenario gets a Playwright test in `tests/stpa/` with the scenario's id in the name of the test, for example `STPA-ADD-1: Add Below gives a block with links`.

### STPA-ADD: adding a block

**Add Above, Add Below and Add Beside add a block in relation to the selected block, connect it with a control action and a feedback without text, select it and give the name cell in the table focus. The whole addition is one undo step.**

```gherkin
Feature: Adding blocks to the control structure
  Background:
    Given STPA Workbench is open with the controller "Driver" and the process "Brakes", connected by a control action and a feedback
    And no text is being edited

  @STPA-ADD-1
  Scenario: Add Below gives a block with links
    Given "Driver" is selected
    When the user presses B
    Then the model has a new block below "Driver"
    And the model has a control action from "Driver" to the new block, without text
    And the model has a feedback from the new block to "Driver", without text
    And the new block is selected
    And the name cell on the new block's row in the table has focus

  @STPA-ADD-2
  Scenario: A chain downwards is written with the keyboard
    Given "Driver" is selected
    When the user presses B
    And types "ECU"
    And presses Enter
    And presses Esc
    And presses B
    Then the model has the block "ECU" below "Driver"
    And the model has a new block below "ECU", with links
    And the new block is selected

  @STPA-ADD-3
  Scenario: Add Above takes over the links upwards
    Given "Brakes" is selected
    When the user presses A
    Then the model has a new block between "Driver" and "Brakes"
    And the control action and the feedback that ran between "Driver" and "Brakes" now run between "Driver" and the new block, with unchanged text
    And the new block has a new control action and a new feedback to "Brakes", without text

  @STPA-ADD-4
  Scenario: Add Beside gets the same parent as the selected block
    Given "Brakes" is selected
    When the user presses S
    Then the model has a new block on the same level as "Brakes"
    And "Driver" has a control action to and a feedback from the new block, without text

  @STPA-ADD-5
  Scenario: Several selected blocks get one shared new block below them
    Given "Driver" and "Supervisor" are selected
    When the user presses B
    Then the model has exactly one new block
    And both "Driver" and "Supervisor" have a control action to and a feedback from the new block

  @STPA-ADD-6
  Scenario: Several selected blocks get one shared new block above them
    Given "Brakes" and "Steering" are selected
    When the user presses A
    Then the model has exactly one new block
    And the new block has a control action to and a feedback from both "Brakes" and "Steering"

  @STPA-ADD-7
  Scenario: Add Beside for blocks that do not belong together warns and changes nothing
    Given "Driver" and "Brakes" are selected
    When the user presses S
    Then a message says that the blocks do not have the same parent
    And the model is unchanged
    And the selection stays

  @STPA-ADD-8
  Scenario: Undo removes the block and the links in one step
    Given the user has added a block with B
    When the user presses Ctrl/⌘+Z
    Then the model lacks the new block and its links

  @STPA-ADD-9
  Scenario: Letter keys are off while typing
    Given the name cell of a new block is being edited
    When the user types "Bab"
    Then the cell contains "Bab"
    And no new blocks have been added

  @STPA-ADD-10
  Scenario: With nothing selected the keys do nothing
    Given no block is selected
    When the user presses A
    Then the model is unchanged
    And the buttons Add Above, Add Below and Add Beside are inactive
```

Esc in the name cell leaves the table but does not remove the block (5.9). A block without a name is shown with its id and can be undone with Ctrl/⌘+Z.

### STPA-TYPE: the type follows the position

**A block with something below it is a controller and the block at the bottom is a controlled process. The type changes automatically when the position changes, and the fields of the old type are kept.**

```gherkin
Feature: The type follows the position
  @STPA-TYPE-1
  Scenario: Add Below on a controlled process makes it a controller
    Given "Brakes" is a controlled process and is selected
    When the user presses B
    Then "Brakes" is a controller
    And the new block is a controlled process

  @STPA-TYPE-2
  Scenario: Removing the last block below a controller makes it a controlled process
    Given "ECU" is a controller with exactly one block below it
    When the block below "ECU" is removed
    Then "ECU" is a controlled process

  @STPA-TYPE-3
  Scenario: The fields of the old type come back
    Given "Brakes" has states as a controlled process
    When "Brakes" becomes a controller and then a controlled process again
    Then "Brakes" still has its states
```

### STPA-LINK: links without text, Convert

**Links created by an addition have no text, and can be selected and filled in in the table. *Convert to actuator* and *Convert to sensor* exist for control actions and feedback respectively and can be found even when nothing is selected.**

```gherkin
Feature: Links and conversion
  @STPA-LINK-1
  Scenario: A link without text is visible and can be selected
    Given the user has added a block with B
    Then the diagram shows the control action and the feedback without text
    And both can be selected

  @STPA-LINK-2
  Scenario: The text is written in the table
    Given the new control action is selected
    When the user types "ApplyBrakes" in its text cell and presses Enter
    Then the model has the control action with the text "ApplyBrakes"
    And the diagram shows the text

  @STPA-LINK-3
  Scenario: Convert exists for both control action and feedback
    Given a control action is selected
    Then the button Convert to actuator is visible in the toolbar and active
    And the button Convert to sensor is visible but inactive, with a tooltip that says why
```

### STPA-NEW: a new diagram

```gherkin
Feature: A new diagram
  @STPA-NEW-1
  Scenario: New gives one controller and one controlled process, connected
    When the user chooses New
    Then the model has one controller and one controlled process
    And they are connected by a control action and a feedback, without text
```

### STPA-KEYS: keys and help

**The add keys work only without Ctrl, ⌘ and Alt and when no text is being edited. Each command has a button in the toolbar above the diagram, with the key in the tooltip. The AI panel is toggled with I.**

```gherkin
Feature: Keys and buttons
  @STPA-KEYS-1
  Scenario: The buttons and the keys do the same
    Given "Driver" is selected
    When the user clicks the button Add Below
    Then the result is the same as when the user presses B

  @STPA-KEYS-2
  Scenario: The I key toggles the AI panel, A does not
    Given the AI panel is open
    When the user presses I
    Then the AI panel is hidden
    When the user presses A with nothing selected
    Then the AI panel is still hidden

  @STPA-KEYS-3
  Scenario: Delete removes the selected blocks with their links
    Given "ECU" is selected
    When the user presses Delete
    Then the model lacks "ECU" and all links that belong to it
    And Ctrl/⌘+Z restores them in one step
```

## 4. Not included

- The links *L* and *F* and dragging to connect. Links between existing blocks are changed in the tables (5.1).
- The words Child, Parent and Sibling in STPA.
- Naming left or right. The order sideways follows the links and the list.

## 5. Open points to settle during the build

- **A link without text:** the diagram shows the link's id today when the text is missing. How an empty link is drawn is to be decided in Penpot (an empty label, a marker or an id).
- **Add Above with an existing parent (STPA-ADD-3):** the new block is inserted between them and takes over the links. This is the most uncertain part, because links are moved.
- **Convert and the type of the blocks:** *Convert to actuator* today applies only to control actions that go to a controlled process. When a block in the middle is a controller, it is unclear whether conversion should be possible to it.
- **Where Convert sits:** today the buttons are only in the selection bar under the diagram, and only when something is selected. That is why they are hard to find.
- **A and I:** moving the AI toggle from A to I changes HTA and Bowtie, 4.7 and the tests `tests/shared/ai-panel-toggle.spec.mjs` and `tests/hta/ai-assist.spec.mjs`.

## 6. Next steps

1. Draw the toolbar, the inactive states and the help in Penpot (done in another chat).
2. Review the graphics.
3. Write the tests in `tests/stpa/` and build in STPA Workbench, with *Add Below* first, then *Add Beside* and *Add Above*.
4. Add the shared test that checks that every `@STPA-…` id here has a test.
