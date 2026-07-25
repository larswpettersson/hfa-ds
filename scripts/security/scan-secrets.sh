#!/usr/bin/env bash
#
# Scans full git history of all sibling hfa-* repos for committed secrets/API keys.
# Uses gitleaks (auto-downloaded if missing) plus a filename-based check for
# common secret files (.env, private keys, credentials, etc.) that regex
# scanners can miss.
#
# Usage:
#   scripts/security/scan-secrets.sh [parent-dir]
#
# parent-dir defaults to the directory containing this repo (/workspaces).
# Exit code is non-zero if gitleaks finds any leaks in any repo.

set -uo pipefail

PARENT_DIR="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)}"
GITLEAKS_VERSION="8.30.1"
CACHE_DIR="${GITLEAKS_CACHE_DIR:-$HOME/.cache/gitleaks}"
GITLEAKS_BIN="$CACHE_DIR/gitleaks-$GITLEAKS_VERSION"

SUSPICIOUS_FILENAME_PATTERN='\.(env|pem|key|p12|pfx|ppk)$|id_rsa|id_dsa|id_ecdsa|id_ed25519|credentials\.json|secrets?\.(ya?ml|json)|\.npmrc|\.pypirc|\.netrc|service[-_]?account.*\.json|\.aws/credentials'

any_findings=0

ensure_gitleaks() {
  if [ -x "$GITLEAKS_BIN" ]; then
    return
  fi

  local os arch asset
  os="$(uname -s)"
  arch="$(uname -m)"

  case "$os" in
    Linux) os="linux" ;;
    Darwin) os="darwin" ;;
    *) echo "error: unsupported OS '$os' for gitleaks auto-download" >&2; exit 2 ;;
  esac

  case "$arch" in
    x86_64|amd64) arch="x64" ;;
    aarch64|arm64) arch="arm64" ;;
    *) echo "error: unsupported arch '$arch' for gitleaks auto-download" >&2; exit 2 ;;
  esac

  asset="gitleaks_${GITLEAKS_VERSION}_${os}_${arch}.tar.gz"
  local url="https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/${asset}"

  echo "Downloading gitleaks v${GITLEAKS_VERSION}..." >&2
  mkdir -p "$CACHE_DIR"
  local tmp_tar
  tmp_tar="$(mktemp)"
  if ! curl -sL "$url" -o "$tmp_tar"; then
    echo "error: failed to download $url" >&2
    rm -f "$tmp_tar"
    exit 2
  fi
  tar -xzf "$tmp_tar" -C "$CACHE_DIR" gitleaks
  mv "$CACHE_DIR/gitleaks" "$GITLEAKS_BIN"
  chmod +x "$GITLEAKS_BIN"
  rm -f "$tmp_tar"
}

scan_repo() {
  local repo="$1"
  local name
  name="$(basename "$repo")"

  echo ""
  echo "=== $name ==="

  echo "-- gitleaks (full history) --"
  "$GITLEAKS_BIN" git -v "$repo"
  local gl_status=$?
  if [ "$gl_status" -eq 1 ]; then
    any_findings=1
  elif [ "$gl_status" -gt 1 ]; then
    echo "error: gitleaks failed on $name (exit $gl_status)" >&2
    any_findings=1
  fi

  echo "-- suspicious filenames in history --"
  local hits
  hits="$(git -C "$repo" log --all --pretty=format: --name-only --diff-filter=A 2>/dev/null \
    | sort -u \
    | grep -iE "$SUSPICIOUS_FILENAME_PATTERN" || true)"
  if [ -n "$hits" ]; then
    echo "$hits"
    any_findings=1
  else
    echo "(none found)"
  fi
}

main() {
  ensure_gitleaks

  local repos=()
  for dir in "$PARENT_DIR"/hfa-*; do
    [ -d "$dir/.git" ] && repos+=("$dir")
  done

  if [ "${#repos[@]}" -eq 0 ]; then
    echo "No hfa-* git repos found under $PARENT_DIR" >&2
    exit 2
  fi

  for repo in "${repos[@]}"; do
    scan_repo "$repo"
  done

  echo ""
  if [ "$any_findings" -eq 0 ]; then
    echo "All clear: no secrets found in any hfa-* repo history."
  else
    echo "Potential secrets found — review output above." >&2
  fi
  exit "$any_findings"
}

main
