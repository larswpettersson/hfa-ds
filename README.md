# Human Factors Analysis Design System (HFA DS) — design token

Canonical git home for **HFA DS design tokens** and Penpot sync tooling.

| Layer | Location |
|---|---|
| Penpot master file | **HFA DS** (Penpot cloud) — tokens + shared component library |
| Portable contract | **`tokens.json`** in this repo |
| App Penpot files | Bowtie, HTA, STPA, RBD — import copies of token sets |
| App code | Clone [hfa-ds](https://github.com/larswpettersson/hfa-ds) separately; no `tokens.json` in app repos |

Penpot token sets are **file-local**. This repo does not live-link Penpot files; scripts push `tokens.json` into each Penpot file via MCP.

## The HFA tools

Human Factors Analysis (HFA) tools for safety and human factors work. Each tool is a separate repository and runs in the browser without installation, a server or an account. Nothing leaves the browser unless you export it, and the tools also work in isolated (air-gapped) environments through their single-file offline versions. All tools are under development; file formats may change.

| Tool | What it does | Links |
|---|---|---|
| **HTA** | Hierarchical Task Analysis with Tabular Task Analysis (TTA / HEI fields): a task tree and a linked table, JSON and CSV export. | [Open](https://larswpettersson.github.io/hfa-hta/HTA.html) · [offline file](https://larswpettersson.github.io/hfa-hta/hta_offline.html) · [repository](https://github.com/larswpettersson/hfa-hta) |
| **Bowtie** | Bowtie diagrams: causes, preventive and reactive barriers, top event and consequences, with printing to one A4 page. | [Open](https://larswpettersson.github.io/hfa-bowtie/Bowtie.html) · [offline file](https://larswpettersson.github.io/hfa-bowtie/Bowtie_offline.html) · [repository](https://github.com/larswpettersson/hfa-bowtie) |
| **STPA Workbench** | System-Theoretic Process Analysis: a control-structure diagram built directly in the diagram, tables for losses, hazards, unsafe control actions and safety constraints, and optional AI support. | [Open](https://larswpettersson.github.io/hfa-stpa/workbench/) · [offline file](https://larswpettersson.github.io/hfa-stpa/workbench/stpa_offline.html) · [repository](https://github.com/larswpettersson/hfa-stpa) |
| **RBD (Reliability Block Diagram)** | Reliability block diagrams. Early design stage, not runnable yet. | [repository](https://github.com/larswpettersson/hfa-rbd) |
| **HFA DS *(this repository)*** | The design system: design tokens, the Penpot library, the design principles and the shared automated tests. Contains no runnable application. | [repository](https://github.com/larswpettersson/hfa-ds) · [architecture](https://github.com/larswpettersson/hfa-ds/blob/main/docs/ARCHITECTURE.md) · [design principles](https://github.com/larswpettersson/hfa-ds/blob/main/docs/design-principles.md) |

The AI support in the tools is optional. With a local model (Ollama, LM Studio, LocalAI) no data leaves the computer; a cloud provider (Claude, Gemini, Hugging Face) receives the analysis and any attached image. The full picture is in the [architecture](https://github.com/larswpettersson/hfa-ds/blob/main/docs/ARCHITECTURE.md).

## Quick start

```bash
npm install   # optional — no runtime deps
npm run validate
npm run build:penpot
```

### Sync Penpot → git (after editing tokens in HFA DS)

1. Connect **HFA DS** in Penpot MCP
2. Paste `scripts/penpot/export-to-json.js` into execute_code
3. Copy `storage.hfaDsExport` → `tokens.json`, commit
4. Run `npm run build:penpot`

### Sync git → Penpot (after editing tokens.json)

1. `npm run build:penpot` (or use committed `scripts/penpot/import-bundle.js`)
2. Connect target Penpot file (**HFA DS first**, then Bowtie → HTA → STPA → RBD)
3. Paste into execute_code **one of**:
   - `scripts/penpot/import-from-github.js` (fetches `tokens.json` from GitHub; needs network)
   - `scripts/penpot/import-bundle.js` (offline; full payload embedded)
4. Paste `scripts/penpot/validate.js` (with import-payload) to confirm zero drift
5. Deactivate legacy sets (`Global` in STPA, duplicate locals)

### Publish library

In Penpot **HFA DS**: File → Publish as shared library. Consumer files connect **HFA DS** under Assets → Libraries.

## Repo layout

```
tokens.json
scripts/penpot/import-from-json.js
scripts/penpot/export-to-json.js
scripts/penpot/validate.js
scripts/penpot/generated/import-payload.js   # generated
scripts/build/embed-for-penpot.mjs
docs/sync-workflow.md
docs/design-principles.md                    # design principles (sv: docs/designprinciper.md)
```

## GitHub

```bash
gh auth login
gh repo create larswpettersson/hfa-ds --public --source=. --remote=origin --push
```

## Consumer repos

Bowtie, HTA, RBD, and STPA do **not** contain `tokens.json`. Clone this repo alongside them, or import into Penpot via MCP scripts.

```bash
git clone https://github.com/larswpettersson/hfa-ds.git
```

Penpot sync: paste `scripts/penpot/import-bundle.js` with each Penpot file connected in MCP.

## Hugging Face Space

`scripts/hf-space/build.sh` and `scripts/hf-space/deploy.py` publish STPA, HTA and Bowtie as a static Space (`larswpettersson/hfa-tools`); the workflow **Deploy Hugging Face Space** does both from GitHub (secret `HF_TOKEN`). The AI panel in HTA and Bowtie can call Hugging Face Inference Providers (e.g. `google/gemma-4-31B-it`) with your own token. See [docs/hugging-face.md](docs/hugging-face.md).

## License

[MIT](LICENSE) © 2026 Lars Pettersson
