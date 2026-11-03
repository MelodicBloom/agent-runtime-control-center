#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
REF_DIR="$tmp/refs"
source "$SCRIPT_DIR/foundry-reference-repos.sh"
for owner in qt314wink MelodicBloom; do
  dir="$REF_DIR/$owner/svg-filter-lab"
  mkdir -p "$dir"
  git -C "$dir" init -q
  git -C "$dir" remote add origin "https://github.com/$owner/svg-filter-lab.git"
  clone_ref "$owner/svg-filter-lab"
done
git -C "$REF_DIR/MelodicBloom/svg-filter-lab" remote set-url origin https://github.com/qt314wink/svg-filter-lab.git
if clone_ref MelodicBloom/svg-filter-lab; then
  echo 'ERROR: mismatched origin was accepted' >&2
  exit 1
fi
test -d "$REF_DIR/qt314wink/svg-filter-lab/.git"
test -d "$REF_DIR/MelodicBloom/svg-filter-lab/.git"
echo 'PASS: owner-qualified paths remain distinct and mismatched origin fails closed'
