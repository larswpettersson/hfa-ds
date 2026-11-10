# Design: editing the control structure directly in the STPA diagram

**Status:** decided (2026-11-08). None of this is built, and *Add Above* is postponed to a later version. The look is drawn in Penpot in another chat; tests and the build wait until the graphics have been reviewed. Swedish version: [design-stpa.md](design-stpa.md).

The general rules are in [5.10 of the design principles](design-principles.md). This document describes what applies to STPA. The same pattern is used for HTA and Bowtie: general rules in the design principles, the tool's own requirements in `design-<tool>.md`.

## 1. Goal

The user must be able to build and change the control structure directly in the diagram, without AI, with as simple an interaction as possible. This follows from the principles in [1.2](design-principles.md): *the user does the analysis* and *AI is optional support, not the engine*. Keyboard and mouse do the same thing (5.4).

## 2. Decisions

The answers to the eight open questions, in short:

1. **Names:** *Add Above*, *Add Below* and *Add Beside*, with the keys **A**, **B** and **S**. The words *Child*, *Parent* and *Sibling* are not used in STPA.
2. **Type:** the type follows the position. A block with something below it is a *controller*, and the block at the bottom is a *controlled process*. The difference remains in the JSON, as in the Penpot design of process blocks. No type is chosen when a block is created.
3. **Actuator and sensor:** normally only control actions and feedback are used. Every control action can be converted to an actuator block and every feedback to a sensor block, whichever blocks they run between. *Convert to actuator* and *Convert to sensor* must be easy to find.
4. **Links:** a new block always gets both a control action and a feedback, without text. The user writes the text. The links *L* and *F* are not built.
5. **Keys:** A, B and S. **A** is already the shortcut for the AI panel; it moves to **I** when *Add Above* is built (see 5.4 and 4.7). Until then the AI toggle stays on A.
6. **Several selected:** one shared new block connected to all selected blocks.
7. **A new diagram** starts with one controller and one controlled process, connected by a control action and a feedback.
8. **Tables and JSON** stay as they are. The selection is shown in the table and the text is edited there (5.9).
9. **Selection and editing:** a click or Ctrl/⌘+Enter selects a block (a blurred shadow all around the block). Enter alone goes into editing. Arrows only move the indication (a hovered shadow), and Ctrl/⌘+arrow is not used (5.3, 5.4). Esc or a click outside removes the selection. Shift+click and Ctrl/⌘+click select several objects of the same kind.
10. **Links and blocks without text** show their id (principle in 5.10).
11. **Add Above** is postponed. *Add Beside* and the name field in the table are approved.
12. **Layout:** three columns with drag bars between them (4.11): the control structure (the diagram) on the left, the tables in the middle and the AI analysis on the right, as in HTA. The title bar (4.10) is at the top. The header row in the panel is removed, since the view bar *CONTROL STRUCTURE* already shows the same heading.
13. **The commands** are *Compact Button* (4.10) in the left panel: *Add Below*, *Add Beside* and *Add Above* on the same row as the view bar's title *▾ CONTROL STRUCTURE* (4.13), and *Convert to actuator*, *Convert to sensor* and *Delete* in a row below.
14. **JSON is not shown in the interface.** The JSON editor and *Format* are removed. A user who wants to see the JSON asks the AI panel to list it.
15. **Open example…** moves from the panel's header row to the help dialog (*?*), as a lower control (28 px).
16. **Views** open and close with a ▾ before the title (4.12). *Compress* and *Expand* are removed from the view bars.
17. **The key** is shown as an underlined letter in the button's text: Add <u>B</u>elow, Be<u>s</u>ide and <u>A</u>bove (5.10). *Delete* and *Convert …* have no underline. The help dialog gets a line at the top saying that the underlined letter is the key, and that it is pressed alone, without Alt.
18. **Images in the AI panel** (1.6) are part of the build: the user can paste a screenshot (Ctrl/⌘+V) or drag an image file into the question field. The function is built in the shared panel, so that HTA and Bowtie get it at the same time.

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

  # Postponed: not built in the first version
  @STPA-ADD-3 @later
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

  # Postponed: not built in the first version
  @STPA-ADD-6 @later
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
    And the buttons Add Below and Add Beside are inactive
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

**Links created by an addition have no text. A link or block without text shows its id, so that it is visible, can be selected and filled in in the table. Every control action can be converted to an actuator block and every feedback to a sensor block. *Convert to actuator* and *Convert to sensor* can be found even when nothing is selected.**

```gherkin
Feature: Links and conversion
  @STPA-LINK-1
  Scenario: A link without text is visible and can be selected
    Given the user has added a block with B
    Then the diagram shows the id as the label on the control action and on the feedback
    And both can be selected

  @STPA-LINK-2
  Scenario: The text is written in the table and replaces the id
    Given the new control action is selected
    When the user types "ApplyBrakes" in its text cell and presses Enter
    Then the model has the control action with the text "ApplyBrakes"
    And the diagram shows the text instead of the id

  @STPA-LINK-3
  Scenario: Convert exists for both control action and feedback
    Given a control action is selected
    Then the button Convert to actuator is visible in the toolbar and active
    And the button Convert to sensor is visible but inactive, with a tooltip that says why

  @STPA-LINK-4
  Scenario: Convert applies to every link, whichever blocks it runs between
    Given a control action between two controllers is selected
    When the user chooses Convert to actuator
    Then the model has an actuator block between the two blocks
    And the control action runs via the actuator block

  @STPA-LINK-5
  Scenario: A feedback becomes a sensor block
    Given a feedback is selected
    When the user chooses Convert to sensor
    Then the model has a sensor block on the path of the feedback
```

### STPA-SEL: selecting and deselecting

**A click or Ctrl/⌘+Enter on a block selects it (a blurred shadow all around the block). Enter alone does not select, but goes into editing. Esc or a click outside removes the selection. Shift+click and Ctrl/⌘+click add or remove objects of the same kind (the rule in 5.5): the blocks are one kind, the control actions one and the feedback one.**

This follows 5.4: Ctrl/⌘+Enter corresponds to a click, and Enter (or F2) edits. The first Esc in the name cell leaves the table and keeps the selection (5.9). Esc in the diagram removes the selection (5.5).

```gherkin
Feature: Selecting and deselecting
  @STPA-SEL-1
  Scenario: A click selects a block
    Given nothing is selected
    When the user clicks the block "Driver"
    Then only "Driver" is selected
    And the block has a blurred shadow all around it
    And the block's row in the table is shown as selected
    And no text is being edited

  @STPA-SEL-2
  Scenario: Ctrl/⌘+Enter selects the indicated block
    Given the indication is on "Driver"
    When the user presses Ctrl/⌘+Enter
    Then the result is the same as a click on "Driver"

  @STPA-SEL-3
  Scenario: Esc in the diagram removes the selection
    Given "Driver" is selected and focus is in the diagram
    When the user presses Esc
    Then nothing is selected

  @STPA-SEL-4
  Scenario: A click outside removes the selection
    Given "Driver" is selected
    When the user clicks an empty area of the diagram
    Then nothing is selected

  @STPA-SEL-5
  Scenario: Shift+click and Ctrl/⌘+click select several of the same kind
    Given "Driver" is selected
    When the user Shift+clicks "Brakes"
    Then "Driver" and "Brakes" are selected
    When the user Ctrl/⌘+clicks "Brakes"
    Then only "Driver" is selected

  @STPA-SEL-6
  Scenario: An object of another kind replaces the selection
    Given the block "Driver" is selected
    When the user Shift+clicks a control action
    Then only the control action is selected

  @STPA-SEL-7
  Scenario: Enter alone goes into editing and does not select
    Given the indication is on "Driver" and nothing is selected
    When the user presses Enter
    Then the name cell on the block's row has focus
    And nothing is selected
```

### STPA-NAV: arrow navigation

**The arrow keys move the indication (a hovered shadow) to the nearest block in the direction of the arrow on the screen (5.2). The mouse and the arrow keys share the same indication (5.3). Arrows do not select, and Ctrl/⌘+arrow is not used.**

```gherkin
Feature: Arrow navigation
  Background:
    Given STPA Workbench is open with the blocks "Driver", "ECU" and "Brakes", where "ECU" is below "Driver" and "Brakes" below "ECU"

  @STPA-NAV-1
  Scenario: An arrow moves the indication
    Given the indication is on "Driver"
    When the user presses ↓
    Then the indication is on "ECU" and is shown as a hovered shadow
    And "Driver" no longer has an indication
    And the selection is unchanged

  @STPA-NAV-2
  Scenario: Objects on the same row or in the same column come first
    Given "Driver" has a block "Supervisor" on the same row and a nearer block "Brakes" diagonally below
    And the indication is on "Driver"
    When the user presses →
    Then the indication is on "Supervisor"

  @STPA-NAV-3
  Scenario: At the edge the indication stops
    Given the indication is on the lowest block "Brakes"
    When the user presses ↓
    Then the indication stays on "Brakes"

  @STPA-NAV-4
  Scenario: The mouse takes over the indication
    Given the indication is on "Driver" after an arrow press
    When the mouse moves over "Brakes"
    Then the indication is on "Brakes"
    And "Driver" has no indication
    When the user presses ↑
    Then the indication is on "ECU"

  @STPA-NAV-5
  Scenario: The arrow key takes over from the mouse
    Given the mouse hovers over "Brakes"
    When the user presses ↑
    Then the indication is on "ECU"
    And "Brakes" no longer has a hovered shadow

  @STPA-NAV-6
  Scenario: Only real mouse movement counts
    Given the indication is on "Driver" after an arrow press
    When the diagram scrolls so that "Brakes" ends up under a still mouse pointer
    Then the indication stays on "Driver"

  @STPA-NAV-7
  Scenario: Arrows do not select, and Ctrl/⌘+arrow is not used
    Given "Driver" is selected
    When the user presses →
    Then the indication moves but "Driver" is still selected
    When the user presses Ctrl/⌘+→
    Then the indication is unchanged
```

### STPA-VIEW: views and examples

**The JSON editor is not shown. The user edits in the diagram and the tables, and asks the AI panel to list the JSON when they want to see it. *Open example…* is in the help dialog.**

```gherkin
Feature: Views and examples
  @STPA-VIEW-1
  Scenario: The JSON editor and Format are not in the interface
    When STPA Workbench is open
    Then no JSON editor is visible
    And there is no Format button

  @STPA-VIEW-2
  Scenario: The AI panel lists the JSON on request
    Given an analysis is open
    When the user asks the AI panel to show the JSON
    Then the answer contains the JSON of the analysis, in the same form as when it is saved

  @STPA-VIEW-3
  Scenario: Open example… is in the help dialog
    When the user presses ? or clicks the help button
    Then a dialog with the key list and Open example… is shown
    And Open example… is a control of ordinary height (28 px)

  @STPA-VIEW-4
  Scenario: An example replaces the analysis after confirmation
    Given the help dialog is open
    When the user chooses an example in Open example…
    Then a confirmation asks whether the analysis is to be replaced (4.2)
    And after confirmation the diagram and the tables show the example

  @STPA-VIEW-5
  Scenario: The title bar opens and closes a view
    Given the Safety case view is open
    When the user clicks its title bar
    Then the view is closed and the arrow shows ▸
    And the other views in the column take the free height

  @STPA-VIEW-6
  Scenario: The view bars have no Compress and Expand buttons
    When STPA Workbench is open
    Then no view bar has the buttons Compress or Expand
```

### STPA-AI-IMG: images in the AI panel

**The user can give the AI an image together with the question, by pasting a screenshot or dragging an image file into the question field. A thumbnail with ✕ shows what is sent, and the image does not stay after the question.**

```gherkin
Feature: Images in the AI panel
  Background:
    Given STPA Workbench is open with the AI panel open and a provider chosen

  @STPA-AI-IMG-1
  Scenario: A pasted screenshot is shown as a thumbnail
    Given the question field has focus and the clipboard holds an image
    When the user presses Ctrl/⌘+V
    Then a thumbnail with ✕ is shown in the question field
    And the text in the question field is unchanged

  @STPA-AI-IMG-2
  Scenario: A dragged image file is shown as a thumbnail
    When the user drags an image file to the question field
    Then a thumbnail with ✕ is shown in the question field

  @STPA-AI-IMG-3
  Scenario: ✕ removes the image
    Given a thumbnail is shown
    When the user clicks ✕
    Then the thumbnail disappears
    And the next question is sent without an image

  @STPA-AI-IMG-4
  Scenario: The image is sent with the question and only that
    Given a thumbnail is shown
    When the user sends the question
    Then the question is sent with the image
    And the thumbnail is gone afterwards
    And the image is not saved in the analysis or in the export
    And follow-up questions are sent without the image

  @STPA-AI-IMG-5
  Scenario: It is clear what leaves the computer
    Given the provider is a cloud service
    When an image is attached
    Then the attachment shows that the image is sent to the provider

  @STPA-AI-IMG-6
  Scenario: A provider without image support refuses the image
    Given the chosen model has no image support
    When the user pastes an image
    Then no image is attached
    And a message says that the model does not accept images
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

  # Postponed together with Add Above
  @STPA-KEYS-2 @later
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
- *Add Above* (and the A key) in the first version. The requirements stay, tagged `@later`.
- Selecting mixed kinds (5.5): the selection holds only one kind, so an AI question cannot be scoped to a block and a link at the same time (5.5).

## 5. Open points to settle during the build

- **Add Above with an existing parent (STPA-ADD-3):** postponed. The new block is inserted between them and takes over the links, which is the most uncertain part, because links are moved.
- **Actuator and sensor blocks in the layout:** today all actuators and sensors are drawn on one row above the process row. When a control action between two controllers is converted (STPA-LINK-4), the block must end up between the two levels. The schema today says that an actuator's target and a sensor's source is a controlled process, and that limit is to go.
- **The JSON editor in the code:** the tests read and write the model through `#editor`. When the editor is not shown the element must still exist (hidden), or the tests are rewritten. This is decided during the build.
- **The thumbnail with ✕ in the question field** and the attachment's note about what leaves the computer are not drawn in Penpot. They are drawn in *AI panel* in HFA DS (a variant of *Prompt* with an image) before the build.
- **The help dialog** is not drawn in Penpot (still the note in the STPA file), with the key list, *Open example…* and a primary button *Close*.
- **A and I:** moving the AI toggle from A to I changes HTA and Bowtie, 4.7 and the tests `tests/shared/ai-panel-toggle.spec.mjs` and `tests/hta/ai-assist.spec.mjs`. It is done when *Add Above* is built.

## 6. Next steps

1. Draw the toolbar, the inactive states and the help in Penpot (done in another chat).
2. Review the graphics.
3. Write the tests in `tests/stpa/` and build in STPA Workbench, with *Add Below* first, then *Add Beside*, the selection (STPA-SEL) and Convert. *Add Above* is built later.
4. Add the shared test that checks that every `@STPA-…` id here has a test. Scenarios tagged `@later` are skipped.
5. Build the image paste (*STPA-AI-IMG*) in the shared AI panel together with the rest of the STPA build.
