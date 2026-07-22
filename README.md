# HFA DS — design tokens

Canonical git home for **HFA DS design tokens** and Penpot sync tooling.

| Layer | Location |
|---|---|
| Penpot master file | **HFA DS** (Penpot cloud) — tokens + shared component library |
| Portable contract | **`tokens.json`** in this repo |
| App Penpot files | Bowtie, HTA, STPA, RBD — import copies of token sets |
| App code | Clone [hfa-ds](https://github.com/larswpettersson/hfa-ds) separately; no `tokens.json` in app repos |

Penpot token sets are **file-local**. This repo does not live-link Penpot files; scripts push `tokens.json` into each Penpot file via MCP.

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
