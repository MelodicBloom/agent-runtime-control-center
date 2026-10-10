#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-$PWD}"
REF_DIR="${REF_DIR:-$ROOT/.reference-repos}"
REF_MODE="${REF_MODE:-minimal}"

need() { command -v "$1" >/dev/null 2>&1 || { echo "Missing required command: $1" >&2; exit 1; }; }

need git
need python3

echo "==> Creating Python environment"
python3 -m venv "$ROOT/.venv-foundry"
# shellcheck disable=SC1091
source "$ROOT/.venv-foundry/bin/activate"
python -m pip install --upgrade pip
python -m pip install   "azure-ai-projects>=2.3.0"   azure-identity   openai   pydantic   python-dotenv   jsonschema   pyyaml   pytest

echo "==> Installing repo dependencies without changing package manager policy"
cd "$ROOT"
if [ -f pnpm-lock.yaml ]; then
  need corepack
  corepack enable
  pnpm install --frozen-lockfile
elif [ -f package-lock.json ]; then
  npm ci
elif [ -f yarn.lock ]; then
  need corepack
  corepack enable
  yarn install --immutable
elif [ -f bun.lockb ] || [ -f bun.lock ]; then
  need bun
  bun install --frozen-lockfile
elif [ -f package.json ]; then
  echo "No lockfile found. Skipping automatic npm install to avoid creating an unreviewed dependency lockfile."
  echo "Codex should inspect package-manager history before choosing an install command."
fi

mkdir -p "$REF_DIR"

clone_ref() {
  local repo="$1"
  local name="${repo##*/}"
  local dest="$REF_DIR/$name"
  if [ -e "$dest/.git" ]; then
    echo "==> Reference already present: $repo"
    return 0
  fi
  echo "==> Cloning reference: $repo"
  git clone --filter=blob:none --depth 1 "https://github.com/$repo.git" "$dest" || {
    echo "WARN: clone failed for $repo (private repo or auth required)." >&2
    echo "      If GitHub CLI is authenticated: gh repo clone $repo $dest -- --filter=blob:none --depth 1" >&2
  }
}

CORE_REPOS=(
  "MelodicBloom/agent-runtime-control-center"
  "MelodicBloom/.github"
  "qt314wink/seed-loom"
  "qt314wink/svg-filter-lab"
  "MelodicBloom/svg-filter-lab"
  "MelodicBloom/shader-gallery"
  "MelodicBloom/nacre-inquiry-engine"
  "MelodicBloom/nacre-orchid-atelier"
)

FULL_REPOS=(
  "MelodicBloom/nacre-orchid"
  "MelodicBloom/Design-Fusion-Studio"
  "MelodicBloom/melodyfire"
  "qt314wink/motion"
  "qt314wink/observation-ad-pipeline"
  "MelodicBloom/wan-artistic-pipeline"
  "qt314wink/prism-loom"
  "qt314wink/omni-loom"
  "MelodicBloom/project-constellation"
  "MelodicBloom/flore-orthography-memphis-ui"
)

for repo in "${CORE_REPOS[@]}"; do clone_ref "$repo"; done
if [ "$REF_MODE" = "full" ]; then
  for repo in "${FULL_REPOS[@]}"; do clone_ref "$repo"; done
fi

cat <<'EOF'

Bootstrap complete.

Next:
  1. Authenticate Azure CLI: az login
  2. Set:
       FOUNDRY_PROJECT_ENDPOINT=https://<resource>.services.ai.azure.com/api/projects/<project>
       FOUNDRY_AGENT_NAME=<agent-name>
       FOUNDRY_MODEL_DEPLOYMENT_NAME=<deployment-name>
  3. Optional direct OpenAI fallback:
       OPENAI_API_KEY=...
       OPENAI_BASE_URL=https://api.openai.com/v1
       OPENAI_MODEL=gpt-5.6-sol
  4. Never commit secrets or .env.local.
  5. Start with docs/foundry-studio-agent/CODEX_HANDOFF.md.

Use REF_MODE=full to clone the broader repo evidence set.
EOF
