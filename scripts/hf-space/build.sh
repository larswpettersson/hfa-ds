#!/usr/bin/env bash
# Assemble the Hugging Face Space (static SDK) from the sibling tool repos.
#   scripts/hf-space/build.sh [out-dir]        default out-dir: dist/hf-space
# The tools are looked up next to hfa-ds (as in the codespace); override with HFA_WORKSPACE.
# Single-file pages are used, so the Space needs nothing but these four HTML files.
set -euo pipefail
here="$(cd "$(dirname "$0")/../.." && pwd)"
ws="${HFA_WORKSPACE:-$(dirname "$here")}"
out="${1:-$here/dist/hf-space}"

copy() { # <source> <target>
  local src="$ws/$1"
  [[ -f "$src" ]] || { echo "missing: $src" >&2; exit 1; }
  mkdir -p "$out/$(dirname "$2")"
  cp "$src" "$out/$2"
  echo "  $1 -> $2"
}

rm -rf "$out"; mkdir -p "$out"
cp "$here/huggingface/space/README.md" "$here/huggingface/space/index.html" "$out/"
copy hfa-stpa/workbench/index.html stpa/index.html
copy hfa-hta/hta_offline.html      hta/index.html
copy hfa-bowtie/Bowtie_offline.html bowtie/index.html
echo "Space files in $out"
