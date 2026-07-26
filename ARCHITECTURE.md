# Architecture: The HFA Family (hfa-ds, hfa-hta, hfa-bowtie)

## 1. Purpose and Structure

This document describes the architecture of three related repositories within the Human Factors Analysis (HFA) family:

- **hfa-ds** – Design system repository. Contains no runnable applications, but is the single source of truth for design tokens (colors, typography, radii, etc.) as well as build scripts and Penpot sync tools that keep a central Penpot design library and consumer projects' Penpot files in sync. Runs on Node.js (ESM), no runtime dependencies.
- **hfa-hta** – Standalone web tool for Hierarchical Task Analysis (HTA) combined with Tabular Task Analysis (TTA)/HEI fields. Pure vanilla JS/HTML/CSS without build steps, runs by opening HTML files directly in the browser.
- **hfa-bowtie** – Standalone web tool for drawing and editing bowtie diagrams (risk: causes → top event/hazard → consequences, with barriers). Also pure vanilla JS/HTML/CSS without build steps.

Shared purpose: support safety and human factors analysis through separate, focused in-browser editors, while maintaining visual consistency (colors, fonts, component appearance) via a shared design system in Penpot, sourced from `hfa-ds`.

**Important architectural characteristic:** There is **no code coupling** (no npm packages, no shared JS modules, no API calls) between the three repositories. All coupling occurs indirectly via:
1. Penpot as shared design tool – `hfa-ds` owns master tokens and syncs them to each consumer's Penpot file via MCP scripts.
2. Manually maintained design conventions (CSS variables in respective HTML files that should mirror `hfa-ds/tokens.json`).

Neither hfa-hta nor hfa-bowtie have `package.json` or any build steps – they are static pages that run directly in the browser, with Python-based smoke tests for regression testing.

## 2. Component Diagram – Communication Between Repositories

```mermaid
flowchart TB
    subgraph DS["hfa-ds (design system)"]
        tokens["tokens.json<br/>(source of truth)"]
        buildScripts["scripts/build/*<br/>validate → embed → tokens-to-css"]
        penpotScripts["scripts/penpot/*<br/>export/import/validate (MCP)"]
        dist["dist/<br/>generated CSS"]
        tokens --> buildScripts --> dist
        tokens --> penpotScripts
    end

    subgraph Penpot["Penpot (shared design tool)"]
        masterLib["HFA DS<br/>master library"]
        bowtieFile["Bowtie<br/>Penpot file"]
        htaFile["HTA<br/>Penpot file"]
        otherFiles["STPA / RBD<br/>Penpot files"]
    end

    subgraph HTA["hfa-hta (app)"]
        htaHtml["HTA.html / hta-editor2.html"]
        htaApp["scripts/hta-app.js<br/>in-memory state"]
        htaData["data/ + fixtures/<br/>JSON (HTA/TTA)"]
        htaHtml --> htaApp --> htaData
    end

    subgraph Bowtie["hfa-bowtie (app)"]
        bowtieHtml["Bowtie.html"]
        bowtieApp["scripts/penpot5-app.js<br/>in-memory state"]
        bowtieData["data/ + fixtures/<br/>JSON (bowtie diagram)"]
        bowtieHtml --> bowtieApp --> bowtieData
    end

    penpotScripts -- "push tokens (MCP execute_code)" --> masterLib
    masterLib -- "published as<br/>component library" --> bowtieFile
    masterLib -- "published as<br/>component library" --> htaFile
    masterLib -- "published as<br/>component library" --> otherFiles

    bowtieFile -. "manual translation to<br/>CSS variables" .-> bowtieHtml
    htaFile -. "manual translation to<br/>CSS variables" .-> htaHtml

    dist -. "reference during manual<br/>CSS variable updates" .-> bowtieHtml
    dist -. "reference during manual<br/>CSS variable updates" .-> htaHtml
```

**Key points in the diagram:**
- `hfa-ds` is the only node with a build pipeline (validation → packaging → CSS generation) and the only one that talks to Penpot MCP for sync.
- Penpot acts as an intermediary/hub: tokens flow in from `hfa-ds` and are published out as component libraries to each consumer file (Bowtie, HTA, STPA, RBD).
- `hfa-hta` and `hfa-bowtie` follow the same architectural pattern: a single HTML page, one large vanilla-JS file that owns all state in memory, and JSON-based import/export for persistence (no backend, no database).
- Dashed lines show manual/non-automated couplings (design → code), in contrast to script-driven MCP flows.

## 3. Sequence Diagram – Main Flow: Token Sync from hfa-ds to a Consumer App

This is the primary architectural use case: a designer/developer changes a design token in `hfa-ds` and propagates it to a consumer app (e.g., `hfa-bowtie`).

```mermaid
sequenceDiagram
    actor Dev as Developer/Designer
    participant Tokens as hfa-ds/tokens.json
    participant Build as hfa-ds build scripts
    participant MCP as Penpot MCP (execute_code)
    participant Master as Penpot: HFA DS master library
    participant AppFile as Penpot: Bowtie file
    participant Repo as hfa-bowtie (Bowtie.html)

    Dev->>Tokens: Edit token (e.g., color, radius)
    Dev->>Build: npm run build
    Build->>Build: validate-json.mjs (schema validation)
    Build->>Build: embed-for-penpot.mjs (package payload)
    Build->>Build: tokens-to-css.mjs (generate CSS variables)
    Build-->>Dev: dist/ updated + generated/import-payload.js

    Dev->>MCP: Run import-bundle.js via execute_code
    MCP->>Master: Write new tokens to master library
    Dev->>MCP: Run validate.js
    MCP-->>Dev: Confirm zero drift (tokens match)

    Master->>AppFile: Published library updates<br/>components in Bowtie file
    Dev->>AppFile: Verify visually in Penpot

    Dev->>Repo: Manually update CSS variables<br/>in Bowtie.html based on dist/ or Penpot
    Repo-->>Dev: Bowtie app renders with new tokens<br/>(state/JSON import/export unaffected)
```

**Note:** Because `hfa-hta` and `hfa-bowtie` lack build steps and package dependencies, the final step (code update) is manual – this is a deliberate design tradeoff in the project family (simple, dependency-free HTML apps) rather than incomplete integration.
