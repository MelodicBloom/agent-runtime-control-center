# Portfolio Asset Registry v0 - Contract Proof Design

Status: Approved for design checkpoint

Decision owner: Jennipher

Builder: Codex

Cross-project auditor after implementation: Kimi

Approved base: `8fa2886b2b001b82265bcefe54d9f9bbdc15bc66`

Approved branch: `feature/portfolio-asset-registry-v0`

## Purpose

Build the smallest file-backed portfolio registry that proves a governed asset record can answer, without relying on chat history:

- what the project is;
- where it is located;
- which sources are authoritative and at what authority level;
- which immutable Git commit is in scope;
- what it may depend on;
- what is blocked;
- what gate comes next.

This tranche is a contract proof, not an inventory program. It will contain exactly one real governed record: Contract Proof v0 for `MelodicBloom/agent-runtime-control-center`.

## Source authority

The source PDF, `Regenerative Intelligence Architecture.pdf`, is strategic material rather than executable authority. Its verified raw-byte identity is:

- size: `22475433` bytes;
- SHA-256: `4def5b033058f8df2a8b04ae4f6199c016621cad41adbb21c1f483ce88a8f95e`.

Three concepts inform this design:

1. Source provenance, asset registry, and evidence ledger are distinct concerns.
2. Maturity is described across artifact completeness, engineering reliability, operational readiness, documentation, and use evidence.
3. Filing vocabulary includes anchor, incubate, connect, merge, archive, and retire.

The PDF does not authorize a database, automatic mutation, scoring, or inferred facts. The handoff controls this implementation.

## Existing repository context

The repository already contains informal lists in `memory/project-registry.json` and `memory/workflow-registry.json`, plus runtime definitions under `packages/core/src/control-plane/`. Those files do not express the governed contract required here.

This tranche will not migrate, delete, validate, score, or silently promote the four projects in the existing informal project list. The new governed registry will live under `memory/portfolio-registry/`, whose README will state that it is the canonical governed Contract Proof v0 surface. The older file remains legacy, non-authoritative input until a separate migration decision is approved.

## Chosen architecture

The implementation will be additive and dependency-free at runtime:

```text
memory/portfolio-registry/
  README.md
  asset.schema.json
  assets/
    contract-proof-v0.json
scripts/
  portfolio-registry.mjs
tests/portfolio-registry/
  portfolio-registry.test.mjs
docs/portfolio/
  CONTRACT_PROOF_V0.md
receipts/
  portfolio-asset-registry-v0-implementation.md
```

`package.json` will expose commands for validation, report generation, tests, and the combined verification gate. The implementation will use Node.js standard-library APIs and `node:test`; it will not require a new package or database.

### Alternatives rejected

1. In-place migration of `memory/project-registry.json` was rejected because it would either govern projects absent from this handoff or discard existing information without authority.
2. Drizzle/Postgres integration was rejected because ontology validation must precede platform construction.
3. A graph model, dashboard, and cross-repository automation were rejected as explicit non-goals.

## Record contract

The JSON Schema will describe one asset record. Every governed record must include:

- `schema_version`;
- stable `asset_id`;
- human-readable `name`;
- `canonical_location`, expressed as a repository full name or explicit `unrepoed`;
- `owner` with a value and verification state;
- `project_class` with a value and verification state;
- non-empty `authority_sources` with source identity, authority level, and verification state;
- `disposition` with a value and verification state;
- all five `maturity` dimensions;
- `dependencies`, containing only stable governed asset IDs;
- `current_git_ref`, expressed only as a full commit SHA, explicit `unresolved`, or `not_applicable` for an unrepoed asset;
- `next_gate`;
- `blockers`;
- `review_date`, expressed as an ISO date or explicit `unverified`.

Unknown and unverified are first-class states, not missing values. The validator will reject omitted required fields even when an explicit unknown value would have been valid.

### Disposition

`disposition.value` accepts:

- `anchor`;
- `incubate`;
- `connect`;
- `merge`;
- `archive`;
- `retire`;
- `unknown`.

`disposition.verification` accepts `verified` or `unverified`. Contract Proof v0 will use `unknown` and `unverified` because the handoff supplies vocabulary but does not assign a bucket.

### Maturity

The record will include these dimensions without computing a portfolio score:

- `artifact_completeness`;
- `engineering_reliability`;
- `operational_readiness`;
- `documentation`;
- `use_evidence`.

Each dimension has a state of `verified`, `unverified`, or `unknown` and an evidence list. Contract Proof v0 starts with all five dimensions `unverified` and no inferred evidence.

### Contract Proof v0 record

The single governed record will use only supplied or directly verified facts:

- asset ID: `asset.contract-proof-v0`;
- name: `Portfolio Asset Registry - Contract Proof v0`;
- repository: `MelodicBloom/agent-runtime-control-center`;
- owner: Jennipher, verified from the handoff;
- project class: explicit unknown/unverified;
- strategic authority: the verified PDF hash and size;
- disposition: explicit unknown/unverified;
- dependencies: none;
- current Git ref: resolved commit `8fa2886b2b001b82265bcefe54d9f9bbdc15bc66`;
- next gate: Kimi cross-project audit after implementation;
- blockers: none at record creation time;
- review date: explicit unverified.

No additional real project will be populated in this tranche.

## Validator design

The validator will discover `assets/*.json`, parse files in lexicographic path order, and emit errors in deterministic path/code/message order. A non-empty error set returns a nonzero exit status.

Required failures include:

- invalid JSON or schema version;
- duplicate asset IDs;
- malformed commit SHA;
- a branch name or other mutable ref used where a commit is required;
- missing disposition;
- self-dependency or duplicate dependency;
- dangling dependency references;
- impossible repository/ref combinations;
- a repo-backed record lacking either a full commit SHA or explicit `unresolved`;
- an unrepoed record carrying a Git commit;
- missing maturity dimensions or silently omitted unknown states.

Impossible-state checks will be narrow and explainable. The validator will not invent lifecycle policy beyond the handoff.

## Deterministic portfolio view

The generator will validate before rendering. It will sort records by `asset_id`, use a fixed field order, normalize output to UTF-8 with LF endings, and omit wall-clock timestamps and environment-specific paths.

The Markdown report will show:

- asset identity and canonical location;
- owner and project class states;
- authority sources and verification;
- disposition;
- five maturity dimensions;
- dependencies;
- immutable Git ref;
- blockers;
- next gate and review date.

Generation will be run twice against unchanged input, and the two byte streams and SHA-256 hashes must match exactly.

## Test strategy

Implementation follows test-first red/green/refactor cycles. Tests will exercise the public validator and renderer using temporary fixture directories rather than mocks.

The suite will prove:

- the approved single record validates;
- duplicate IDs fail;
- malformed SHAs fail;
- branch names are rejected as immutable refs;
- missing disposition fails;
- repo-backed records accept only a full SHA or explicit unresolved state;
- impossible repo/ref combinations fail;
- self and dangling dependencies fail;
- explicitly unknown and unverified values are accepted;
- report ordering is stable;
- two generations are byte-identical.

## Verification gate

The implementation checkpoint is eligible for review only when:

- duplicate asset IDs: `0`;
- silently missing disposition: `0`;
- accepted branch names as immutable refs: `0`;
- repo-backed active entries without a commit SHA or explicit unresolved state: `0`;
- dangling dependency references: `0`;
- deterministic report generation: `2/2` exact match;
- governed real records in this tranche: exactly `1`;
- autonomous issue creation, scheduled mutation, Postgres, graph visualization, and portfolio-wide scoring: absent.

## Error handling and safety

Validation and generation are local, read-only with respect to external systems, and require no credentials or network calls. Generation may replace only the designated generated Markdown report after successful validation. It will not mutate registry records.

No autonomous issue creation, cross-repository write, scheduled mutation, database migration, dashboard, graph visualization, or aggregate scoring is part of this design.

## Implementation sequence after design approval

1. Write failing validator tests and confirm expected failures.
2. Add the schema and minimal validator required to pass.
3. Add the single governed Contract Proof v0 record.
4. Write failing deterministic-renderer tests and confirm expected failures.
5. Add the Markdown generator and generated report.
6. Add package scripts and run the full verification gate.
7. Run generation twice, compare bytes and hashes, and record evidence.
8. Commit the implementation receipt with the verified final state.
