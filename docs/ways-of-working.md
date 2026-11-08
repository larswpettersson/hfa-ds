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

How a component should be implemented is described in its **annotation** in Penpot. This is the primary way; prototypes with linked flows are not built for now. The annotation can be read through the MCP (`LibraryComponent.annotation` in the Plugin API, checked 2026-10-31). A `_note` text layer on the board (1.2) is the fallback where an annotation is not enough.

Rules:

- **At most 300 characters.**
- **Write in English**, like the code.
- **Design first, then `App:`.** Start with what the design shows that the component itself does not make clear, preferably with the reason (sizes, states, why). After `App:` comes what exists only in the code: behaviour, focus, tooltip, accessibility, text handling.
- **Write only what the component needs.** There is no fixed set of fields; a button describes its states, a barrier its size and text handling.

**Examples from HFA DS** (2026-10-31):

Action Button (264 characters):

```
Toolbar button. Default: elevated + 1 px muted border. Hovered: sunken + base border. Pressed/selected: inverted (base fill, elevated text). App: 2 px info focus ring with 2 px offset on :focus-visible; tooltip and aria-label with the full name (e.g. "Add cause").
```


### 1.5 Workflow

1. **Design in Penpot** with named components, variants and tokens, and describe the implementation in the component's annotation (1.4).
2. **Describe the flow in the repository**: a short text with a state table and example data before and after, referring to the board names and the share link.
3. **When something changes:** select the changed part in Penpot and write one sentence on what changed. The AI reads the selection through the MCP and changes the code.
4. **Check** the result in the tool and with the tests (`npm test` in hfa-ds).

## 2. Documentation, Gherkin and tests

This chapter describes the chain from documentation to verified code, and how an AI assistant is expected to structure its proposals. Chapter 1 is about what the AI reads in Penpot; this chapter is about what happens next.

### 2.1 The chain

The work is driven by the documentation, not by individual requests for components:

1. **Documentation.** The requirement is described or changed first in [ARCHITECTURE.md](ARCHITECTURE.md), [design-principles.md](design-principles.md) or this document. Nothing is implemented that is not documented.
2. **Plan.** The AI assistant translates the principles, and any screenshots or bug captures, into a structured plan (2.4).
3. **Gherkin.** The behaviour is written as a *Given–When–Then* scenario (2.2) before the code is written.
4. **Implementation.** HTML, CSS and JavaScript are written so that the scenario is met.
5. **Playwright.** The tests show that the code does what the scenario says, and catch anything else that has broken (2.3).

### 2.2 Gherkin as acceptance criteria

A scenario describes a behaviour, not an implementation:

```gherkin
Feature: Open a file
  Scenario: Unsaved changes ask first
    Given the analysis has unsaved changes
    When the user presses Open…
    Then a dialog asks Save, Don't save or Cancel
```

- **One scenario per behaviour.** Given sets the starting point, When an action and Then a result Playwright can check.
- **Then is what the test checks.** Write it so concretely that it can be answered yes or no: a visible dialog, a value in the model, a mark on an object.
- **Current state:** scenarios are written in the plan and in the PR description, and the names of the tests mirror them (see for example `tests/shared/new-unsaved.spec.mjs`). There are no `.feature` files and no `playwright-bdd` yet. Running the scenarios directly would be a decision of its own: they would then go in `tests/features/<name>.feature`, and the test suite would get a step that runs them.

### 2.3 The tests

- **Playwright** runs the tests against the tools in the other repositories (`npm test`, see [ARCHITECTURE.md](ARCHITECTURE.md) section 9). The pages are opened directly as files, without a web server.
- **The `.mjs` extension** makes Node read the file as an ES module, with `import` and `export`, whatever the settings. hfa-ds also has `"type": "module"` in `package.json`; `.mjs` also works in repositories that do not.
- **The number of tests:** a run currently gives about 78 tests (77 passed and 1 skipped when `hfa-rbd` is missing). That is because the shared tests run against every tool and each tool has its own tests. It is **one** browser, Chromium; the configuration has no projects for Firefox, WebKit or mobile.
- **States** such as hover, disabled and selected are tested where they change behaviour, not for every component.

### 2.4 Template for the AI assistant's plan

When an AI assistant (for example Claude Code) produces a plan or a prompt for a change, it uses this structure. The role is **AI Coding Strategist**: the bridge between visual input (screenshots, bug captures), the documentation and the coding tool. It reads the input together with the user's direction, writes the requirements as Gherkin and produces a precise, structured instruction.

```
Task: [one sentence describing the task, based on the design or architecture change]

Visual Analysis & System Context:
- [the key detail seen in the screenshot or the request]
- [which rule in arkitektur.md, designprinciper.md or arbetssatt.md is applied or changed]

Behavioral Specification (Gherkin):
Feature: [name]
  Scenario: [name]
    Given [precondition]
    When [action]
    Then [expected result, clear enough for Playwright to check]

Scope / File Suggestions:
- Which files are affected, for example the tool's HTML or script, and which test is created or changed.

Implementation Instructions:
1. [Write or update the scenario]
2. [Layout and structure]
3. [Logic, state and interaction that satisfy the steps]
4. [Styling, tokens and responsiveness]

Acceptance Criteria:
- The Playwright tests for the scenario pass.
- [a concrete signal in the interface, for example "the dialog is shown in the middle of the page"]
```

The template is in English because it is a prompt. The documentation and descriptions it refers to can be in Swedish.

### 2.5 When is the chain used?

- **New or changed behaviour:** the whole chain. Document, write the scenario, implement and test.
- **Pure appearance changes from Penpot:** chapter 1 is enough, and `npm test` checks that the colours still match `tokens.json`.
- **Small fixes** (spelling, a label): no plan is needed, but the tests are run.
