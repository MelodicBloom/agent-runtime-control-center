# Foundry Studio Agent — Codex Handoff v0

Status: staged design/build handoff; no runtime behavior changed.
Target repo: MelodicBloom/agent-runtime-control-center
Target branch: docs/foundry-studio-agent-handoff-v0

## Goal

Build one Microsoft Foundry Prompt Agent / Python-callable control-plane agent that routes work across the existing MelodicBloom repository estate without replacing repository-native contracts.

The agent must:
- inspect before acting;
- respect repo-local README/AGENTS/spec/gates;
- preserve Seed Loom evidence/provenance semantics;
- use cognitive lenses SYSTEMS_ARCHITECT, HERETIC, FORGE;
- use domain roles LOOMKEEPER, VISUAL_STUDIO, PRISM_FORGE only as routing roles, never as replacements for canonical repos;
- emit reconstructable task/decision/build receipts;
- default to read/propose until a later authority expansion is explicitly approved.

## Grounded ownership

### Runtime/control
- MelodicBloom/agent-runtime-control-center
  - Canonical home for this Foundry agent adapter/runtime integration.
  - Existing V0-V3 scope is Telegram intake, task parsing, Neon task records, GitHub metadata lookup.
  - Existing docs explicitly prohibit autonomous code editing in the first milestone.
- MelodicBloom/.github
  - Organization automation control plane: shared policy, evidence, repository classification, adoption, permission boundaries.
  - Do not move runtime implementation here.

### Evidence / systemization
- qt314wink/seed-loom
  - Signal-to-System Pipeline and living evidence ledger scaffold.
  - Existing engines: Visual Grammar, Mythic Essay, Art-to-Product, Spec-to-Build.
  - Must be treated as evidence/governance source, not a generic file store.

### Visual / shader evidence
- qt314wink/svg-filter-lab
  - Production-oriented React/Next SVG filter library.
- MelodicBloom/svg-filter-lab
  - Dependency-free interactive SVG primitive/reference showcase.
  - These are currently two distinct repositories; do not declare one canonical without reconciliation.
- MelodicBloom/shader-gallery
  - Standalone WebGL/GLSL art/gallery specimens.
- MelodicBloom/nacre-inquiry-engine
  - Deterministic semantic-coordinate inquiry engine.
- MelodicBloom/nacre-orchid-atelier
  - Inquiry profile -> tokens -> shaders -> React MaterialSurface -> docs atlas.
- MelodicBloom/nacre-orchid
  - Separate narrower product/site slice; do not alias to atelier.
- MelodicBloom/Design-Fusion-Studio
  - Existing design/generative implementation source; inspect before assigning Design Language Compiler ownership.
- MelodicBloom/melodyfire
  - Portfolio/product surface with interactive/WebGL and AI-assisted visual tooling.
- qt314wink/motion
  - Large motion repository. Do not alias to "Motion Oracle" without file-level evidence.
- qt314wink/observation-ad-pipeline
  - Observation-led generation/motion experimentation and production pipeline.
- MelodicBloom/wan-artistic-pipeline
  - WAN artistic generation pipeline.
- qt314wink/prism-loom
  - Grok Build-oriented app builder workspace with repo-local AGENTS.md. Its local contract overrides generic builder behavior when targeting that repo.
- qt314wink/omni-loom
  - Deterministic fabrication compiler; stitch_plan.json is its stated universal IR.
- MelodicBloom/project-constellation
  - Portfolio/atlas system; inspect its branch/docs before cross-repo writes.
- MelodicBloom/flore-orthography-memphis-ui
  - Visual/design-system implementation with its own CI/workflow contract.

## Unresolved identifiers

Do NOT silently resolve:
- Motion Oracle -> qt314wink/motion
- Design Language Compiler -> Design-Fusion-Studio
- one svg-filter-lab repo -> the other svg-filter-lab repo

Represent these as UNRESOLVED until repository evidence supports a mapping.

## Typed integration status

Every cross-repo edge must use exactly one:
IMPLEMENTED | CONTRACTED | ACTIVE_BUILD | PLANNED | INFERRED | CONVERSATIONAL | UNRESOLVED

Never upgrade an edge based only on chat history.

## Agent routing

Cognitive lenses:
1. SYSTEMS_ARCHITECT — discover structure, contracts, ownership, interfaces, dependency graph.
2. HERETIC — adversarially test assumptions, duplication, provenance, novelty, brittleness, cost, failure modes.
3. FORGE — convert surviving conclusions into bounded executable work with files, tests, receipts, stop gates.

Domain roles:
1. LOOMKEEPER — repo/evidence discovery, Seed Loom-aware provenance, reconciliation, graph proposals.
2. VISUAL_STUDIO — visual/style/material/motion/media interpretation; must reference real visual repos and Nacre contracts.
3. PRISM_FORGE — implementation planning/execution; must obey target repo's local AGENTS/spec/gates.

Default pipeline:
SYSTEMS_ARCHITECT -> HERETIC -> FORGE -> target-repo execution -> evidence receipt.

Depth:
- FAST: one lens + one role; no broad repo sweep.
- STANDARD: architect/heretic/forge with bounded repo reads.
- DEEP: multi-repo inspection, external research if required, contradiction checks, experiments; explicit budget and stop gate required.

## Commands

/auto
/architect
/heretic
/forge
/observe
/ingest
/stage
/promote
/build
/research
/niche
/style
/shader
/experiment

Semantics:
- /observe = read/analyze only; no canonical mutation.
- /ingest = create Seed-Loom-compatible evidence/receipt or invoke Seed Loom native path if available.
- /stage = candidate artifact/graph/schema proposal; noncanonical.
- /promote = requires validation/provenance and approval appropriate to consequence.
- /build = bounded target-repo implementation; never default-branch direct write.

## Phase plan

### Phase 0 — Grounding and custody
Deliver:
- docs/foundry-studio-agent/REPO_REGISTRY.json
- docs/foundry-studio-agent/INTEGRATION_EDGES.json
- docs/foundry-studio-agent/AUTOMATION_REGISTRY.md
- docs/foundry-studio-agent/CUSTODY_LEDGER.md

Inspect actual repo files before filling ownership or integration fields.

Definition of done:
- all named repos resolved to exact owner/name;
- duplicate/ambiguous systems marked;
- no invented cross-repo edge;
- source path or GitHub URL for every asserted contract.

### Phase 1 — Portable agent definition
Deliver:
- config/foundry/agent.manifest.json
- config/foundry/SYSTEM_INSTRUCTIONS.md
- config/foundry/ROUTER_POLICY.json
- schemas/agent-task.schema.json
- schemas/agent-receipt.schema.json

This portable manifest is NOT assumed to be Microsoft's native import JSON.
Map it explicitly to current Foundry Prompt Agent fields.

### Phase 2 — Python adapter
Deliver:
- packages/foundry-agent-python/pyproject.toml
- packages/foundry-agent-python/src/studio_agent/client.py
- packages/foundry-agent-python/examples/invoke.py
- tests/foundry-agent-python/test_router.py
- tests/foundry-agent-python/test_receipts.py

Use current Foundry SDK:
- azure-ai-projects>=2.3.0
- azure-identity
Use DefaultAzureCredential for Foundry-native auth.
Support a separate direct OpenAI adapter only when explicitly configured.

Environment variables:
FOUNDRY_PROJECT_ENDPOINT
FOUNDRY_AGENT_NAME
FOUNDRY_MODEL_DEPLOYMENT_NAME
OPENAI_API_KEY              # optional direct-OpenAI adapter
OPENAI_BASE_URL             # optional; default https://api.openai.com/v1
OPENAI_MODEL                # optional exact API model id
AGENT_DEPTH=STANDARD
AGENT_WRITE_MODE=propose

Do not place secrets in repo.

### Phase 3 — Read-only GitHub/repo tools
First implementation authority:
READ + PROPOSE only.

Allowed:
- repository metadata
- README/AGENTS/spec/workflow/schema inspection
- branch/PR/issue status inspection
- task/receipt generation

Forbidden until separately approved:
- default branch writes
- merging
- releases
- deployments
- secret changes
- database migrations
- destructive asset transforms
- cross-repo writes

### Phase 4 — Seed Loom ingestion adapter
Do not copy Seed Loom logic.
Inspect Seed Loom's schemas/scripts/contracts and build an adapter that emits compatible evidence.

Required tests:
- source identity retained
- digest retained
- observation separated from interpretation/inference
- rerun is deterministic for same fixture
- no canonical promotion without validation state

### Phase 5 — repo adapters
Prioritize:
1. svg-filter-lab pair reconciliation
2. shader-gallery
3. nacre-inquiry-engine
4. nacre-orchid-atelier
5. observation-ad-pipeline
6. melodyfire
7. motion
8. Design-Fusion-Studio
9. prism-loom
10. omni-loom

Each adapter must record repo-local authority files and stop when local rules conflict with generic instructions.

## Subagent policy

Use subagents only when work is separable.

IF task is repository archaeology across 3+ repos:
- spawn read-only EXPLORE subagents per repo or coherent repo family;
- each returns only findings, source paths, confidence, contradictions, and proposed edges;
- main agent reconciles; subagents do not write.

IF task is implementation in one repo:
- one IMPLEMENT subagent may write only on the task branch;
- one VERIFY subagent independently checks diff/tests/contracts;
- HERETIC reviews failures or architecture drift.

IF task is visual/shader taxonomy:
- one VISUAL evidence subagent inspects shader/SVG/Nacre sources;
- one HERETIC subagent checks whether proposed primitives are genuinely general;
- no taxonomy mutation until both return.

IF task needs external/current research:
- a RESEARCH subagent may browse authoritative sources;
- external claims enter as staged evidence with URL/date/version;
- do not let web research overwrite repo-native facts.

IF two candidate canonical destinations remain plausible:
- STOP write;
- mark HANDOFF_REQUIRED with evidence for both;
- ask for human decision only if repository evidence cannot resolve it.

IF a destructive/publish/merge/deploy/secret/migration action appears:
- STOP and request explicit approval.

## Required receipts

Every completed work unit returns:
- task_id
- timestamp
- target_repo
- base_ref/base_sha
- branch
- agent/model
- role
- lens
- files_read
- files_changed
- commands_executed
- tests
- evidence_sources
- assumptions
- unresolved_questions
- consequence
- next_action

## QA / definition of done

Do not call this milestone complete unless:
1. repo registry is file-grounded;
2. ambiguous identities remain explicitly unresolved;
3. Foundry Prompt Agent can be created/configured from documented instructions;
4. Python invocation succeeds using DefaultAzureCredential against FOUNDRY_PROJECT_ENDPOINT;
5. FAST/STANDARD/DEEP routing tests pass;
6. read/propose authority is enforced by tests;
7. task and receipt JSON validate;
8. Seed Loom adapter fixtures preserve provenance;
9. no existing runtime V0-V3 behavior is broken;
10. npm build + existing audit tests pass where applicable.

## Stop conditions

Stop and hand off rather than improvising when:
- a repo's canonical ownership is ambiguous;
- a required repo-local AGENTS/spec/gate file is missing or contradictory;
- a write would cross repository boundaries;
- a tool requires credentials not present;
- a Foundry SDK/API behavior differs from current Microsoft documentation;
- a test reveals nondeterministic evidence output;
- implementation would exceed the read/propose authority envelope.

## Human decisions requested

Not blockers for Phase 0-2:
1. Whether this Foundry agent should later gain branch-write authority, or remain read/propose.
2. Whether the two svg-filter-lab repos should eventually be consolidated, specialized, or archived separately.
3. What repository/module "Motion Oracle" canonically refers to.
4. Whether "Design Language Compiler" is a future system, a module in an existing repo, or a repo-level identity.

Proceed without asking on all other reversible Phase 0-2 decisions; record assumptions instead.
