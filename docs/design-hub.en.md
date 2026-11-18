# Design: HFA Hub

**Status:** the start page is built (2026-11-17) in [hfa-hub](https://github.com/larswpettersson/hfa-hub). Projects and the source library are a planned extension (decided 2026-11-18), not built or drawn. Swedish version: [design-hub.md](design-hub.md).

The general rules are in the design principles ([4.9 Pill](design-principles.md), [4.10 the title bar](design-principles.md), [3.3 surface layers](design-principles.md), [5.3 indication](design-principles.md) and [1.8 traceability](design-principles.md)). This document describes what applies to the hub. The same pattern as [design-stpa.en.md](design-stpa.en.md), [design-hta.en.md](design-hta.en.md) and [design-bowtie.en.md](design-bowtie.en.md).

## 1. Goal

The hub is the way into the HFA tools: a page that shows which tools exist and opens them. In time it also becomes the place where a project's source material is collected, so that what the AI panel brings into several models can be traced back to the same sources (1.8).

## 2. The start page (built)

1. **One file.** `index.html` holds the markup, the CSS and a few lines of script for the theme. No build step and no requests to the network.
2. **One card per tool:** name, method, a sentence about what the tool does and a *Pill* with its status. The whole card opens the tool. The button *One-file version* opens the standalone offline file.
3. **RBD is shown without a link** with the status *Not runnable yet*, until the tool runs.
4. **Relative links** (`../hfa-hta/HTA.html` and so on), so the page works on GitHub Pages and from `file://` when the repositories lie in folders next to each other.
5. **The title bar** has only the application name and Theme. The hub has no document to create, open, save or undo (the exception in 4.10).
6. **Surfaces and indication.** The page is `background.base`, the title bar and the cards `background.elevated` with a border. A card under the mouse gets `shadow.hovered`, and a card with keyboard focus gets `shadow.selected`.
7. **The only thing stored** is the chosen theme (`localStorage`, key `hfa-hub:theme`).

The colours are hand-written copies of `tokens.json`, as in the other tools. The tests in `tests/hub/` and `tests/shared/` check the page.

## 3. Projects and the source library (planned)

The hub is extended into a workspace for projects. It stays a page without a server: the project is saved as a file on the user's computer, the same way the tools save their analyses (the architecture, section 1).

- **A project** gathers the models (HTA, Bowtie, STPA) that belong to the same analysis, the source library and the project's settings.
- **The models are separate files** (decided 2026-11-18). The project file points to them with loose references and does not embed them, so each model can be opened and used in its own tool without the hub.
- **The source library** holds the sources with their segments (lines or paragraphs). Each source is added once and can be used by every model in the project.
- **Project settings:** the default level for new sources, *line* or *paragraph*. The panel suggests it when a source is added, and the user can choose the other (1.8).
- **Display of a source** with highlights on the places the models build on.
- **Reverse lookup:** select text in a source and see which elements in all the project's models build on it.
- **The hub's storage adapter** gives the AI panel the project's source library. The panel is the same as in the standalone tools; only the adapter differs (the architecture, section 11).

**Open question:**

- How does a tool opened from the hub reach the project's source library? The tools are separate pages in separate repositories, and from `file://` two pages cannot share data through the browser's storage. The alternatives are that the hub shows the tool inside itself, or that the project is opened as a file in the tool.

What the hub looks like with a project open, compared with the start page without one, is drawn in Penpot before anything is built.
