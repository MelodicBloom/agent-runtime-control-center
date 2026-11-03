#!/usr/bin/env bash
# Source this helper with REF_DIR set. Never overwrite an existing checkout.
clone_ref() {
  local repo="$1" dest="$REF_DIR/$1" actual root
  if [ -e "$dest" ]; then
    root="$(git -C "$dest" rev-parse --show-toplevel 2>/dev/null)" || {
      echo "ERROR: reference path is not a Git checkout: $dest" >&2; return 1;
    }
    if [ "$(cd "$root" && pwd -P)" != "$(cd "$dest" && pwd -P)" ]; then
      echo "ERROR: reference path is not a repository root: $dest" >&2; return 1
    fi
    actual="$(git -C "$dest" remote get-url origin 2>/dev/null)" || {
      echo "ERROR: reference has no origin: $dest" >&2; return 1;
    }
    case "$actual" in
      "https://github.com/$repo"|"https://github.com/$repo.git"|"git@github.com:$repo"|"git@github.com:$repo.git"|"ssh://git@github.com/$repo"|"ssh://git@github.com/$repo.git") ;;
      *) echo "ERROR: origin does not match expected repository $repo at $dest" >&2; return 1 ;;
    esac
    echo "==> Verified existing reference: $repo"
    return 0
  fi
  mkdir -p "$(dirname "$dest")"
  echo "==> Cloning reference: $repo"
  git clone --filter=blob:none --depth 1 "https://github.com/$repo.git" "$dest" || {
    echo "WARN: clone failed for $repo (private repo or auth required)." >&2
    return 1
  }
}
