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

Source integrity and semantic authority are separate claims. A file can have verified bytes without being executable authority, and an approved handoff can declare a decision without independently verifying the underlying fact. The registry will represent both dimensions explicitly.

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
  verify-portfolio-registry.mjs
tests/portfolio-registry/
  portfolio-registry.test.mjs
docs/portfolio/
  CONTRACT_PROOF_V0.md
receipts/
  portfolio-asset-registry-v0-implementation.md
.github/workflows/
  portfolio-registry.yml
```

`package.json` will expose commands for validation, report generation, tests, and the combined verification gate. The implementation will use Node.js, `node:test`, and one narrowly scoped development dependency that executes the committed JSON Schema. It will not add an application runtime service or database.

### Alternatives rejected

1. In-place migration of `memory/project-registry.json` was rejected because it would either govern projects absent from this handoff or discard existing information without authority.
2. Drizzle/Postgres integration was rejected because ontology validation must precede platform construction.
3. A graph model, dashboard, and cross-repository automation were rejected as explicit non-goals.

## Contract authority boundaries

The committed JSON Schema is the sole authority for structural shape. It owns object types, required fields, enums, string patterns, array bounds, and `additionalProperties` policy. A standards-compliant JSON Schema validator will execute that schema directly; custom validator code will not maintain a parallel copy of structural rules.

The custom validator owns only invariants that JSON Schema cannot determine from one record in isolation or that require semantic relationships, including duplicate IDs, dependency resolution, self-dependencies, exact production-record count, and epistemic consistency across fields.

All governed objects and nested governed structures use `additionalProperties: false`. Contract Proof v0 defines no open extension object. Any future extension point requires a schema-version decision rather than accepting silent fields.

## Epistemic states

Fields that express knowledge use these distinct states:

- `verified`: directly checked against cited evidence appropriate to the field. For file integrity, the raw bytes were independently hashed and sized. For a Git ref, the full commit was resolved in the authenticated repository.
- `declared`: asserted by an identified decision owner in an approved handoff. The declaration is authoritative as a decision input but is not independent verification of the underlying fact.
- `unverified`: a concrete value or claim exists, but its required evidence check has not been completed or did not establish verification.
- `unknown`: no usable value or claim is available.
- `not_applicable`: the field has no meaning for this record and the reason is explicit.

An approved handoff does not by itself turn a declaration into `verified`. State/value consistency is enforced: `verified`, `declared`, and `unverified` require a concrete value; `unknown` requires no concrete value; `not_applicable` requires no value plus an explicit reason. A `verified` semantic claim must cite at least one authority source, and a `verified` file-integrity claim must also satisfy the integrity rules below.

## Record contract

The JSON Schema will describe one asset record. Every governed record must include:

- `schema_version`;
- stable `asset_id`;
- human-readable `name`;
- `canonical_location`, expressed as a repository full name or explicit `unrepoed`;
- `owner` with a value and epistemic state;
- `project_class` with a value and epistemic state;
- non-empty `authority_sources` with source identity, semantic authority, integrity metadata, and epistemic state;
- `disposition` with a value and epistemic state;
- all five `maturity` dimensions;
- `dependencies`, containing only stable governed asset IDs;
- `current_git_ref`, expressed only as a full commit SHA, explicit `unresolved`, or `not_applicable` for an unrepoed asset;
- structured `next_gate` data;
- `blockers`;
- structured `review_date`, whose value is an ISO date when present and whose epistemic state may explicitly be unknown or unverified.

Unknown and unverified are first-class states, not missing values. The validator will reject omitted required fields even when an explicit unknown value would have been valid.

### Authority sources and artifact integrity

Each authority source identifies its semantic role independently from byte integrity. A source includes `source_id`, `source_type`, title or description, `semantic_authority`, and `epistemic_state`.

A verified file source additionally requires an `integrity` object with:

- `verification_state: "verified"`;
- lowercase, 64-character hexadecimal `sha256`;
- non-negative integer `byte_size`;
- a statement that the digest covers the raw source bytes.

If file bytes are unavailable, integrity must be `unverified`, `unknown`, or `not_applicable` as appropriate and must not carry a verified digest claim. A valid SHA-256 proves byte identity only; it does not elevate strategic material into executable authority.

### Disposition

`disposition.value` accepts:

- `anchor`;
- `incubate`;
- `connect`;
- `merge`;
- `archive`;
- `retire`.

`disposition.epistemic_state` uses the common epistemic vocabulary. Contract Proof v0 will use `value: null` and `epistemic_state: "unknown"` because the handoff supplies vocabulary but does not assign a bucket.

### Maturity

The record will include these dimensions without computing a portfolio score:

- `artifact_completeness`;
- `engineering_reliability`;
- `operational_readiness`;
- `documentation`;
- `use_evidence`.

Maturity assessment and evidence verification are separate. Each dimension contains:

- `assessment`, with an assessment value or explicit unknown/not-applicable state and its own epistemic state;
- `evidence`, with independent verification state and referenced authority source IDs.

Verifying an evidence artifact does not automatically verify the maturity assessment derived from it. Conversely, a declared assessment does not claim its evidence has been verified. Contract Proof v0 starts with every assessment `unknown` and every evidence state `not_applicable` because no maturity evidence is asserted in this tranche.

### Next gate

`next_gate` is a governed structure with:

- stable `gate_id`;
- human-readable `description`;
- ontology-level `responsible_role`;
- `status`;
- non-empty `required_evidence` entries;
- optional current routing with its own epistemic state.

The Contract Proof v0 role is `cross_project_auditor`. Kimi is the current declared routing for that role, not a vendor- or person-coupled ontology value. The gate remains pending until its required implementation receipt, verification results, and generated-report evidence exist.

### Contract Proof v0 record

The single governed record will use only supplied or directly verified facts:

- asset ID: `asset.contract-proof-v0`;
- name: `Portfolio Asset Registry - Contract Proof v0`;
- repository: `MelodicBloom/agent-runtime-control-center`;
- owner: Jennipher, declared by the decision owner in the approved handoff;
- project class: explicit unknown;
- semantic authority: declared strategic material from the handoff;
- source integrity: verified PDF SHA-256 and byte size over the raw bytes;
- disposition: explicit unknown;
- dependencies: none;
- current Git ref: verified resolved commit `8fa2886b2b001b82265bcefe54d9f9bbdc15bc66`;
- next gate: pending `cross_project_audit`, owned by the `cross_project_auditor` role and currently routed by declaration to Kimi;
- blockers: none at record creation time;
- review date: explicit unknown because no date was declared.

No additional real project will be populated in this tranche.

## Validator design

The validator will discover `assets/*.json`, parse files in lexicographic path order, and emit errors in deterministic path/code/message order. A non-empty error set returns a nonzero exit status.

Required failures include:

- invalid JSON or schema version;
- structurally invalid data reported by direct execution of the committed JSON Schema;
- undeclared properties rejected by `additionalProperties: false`;
- duplicate asset IDs;
- malformed commit SHA;
- a branch name or other mutable ref used where a commit is required;
- malformed SHA-256 or invalid verified-file byte size;
- epistemic state/value/evidence contradictions;
- missing disposition;
- self-dependency or duplicate dependency;
- dangling dependency references;
- impossible repository/ref combinations;
- a repo-backed record lacking either a full commit SHA or explicit `unresolved`;
- an unrepoed record carrying a Git commit;
- missing maturity dimensions or silently omitted unknown states.

Impossible-state checks will be narrow and explainable. The validator will not invent lifecycle policy beyond the handoff.

A resolved immutable Git ref accepts only a lowercase, 40-character hexadecimal commit SHA. No branch, tag, symbolic name, short SHA, or `refs/*` spelling is accepted as a resolved immutable ref.

Epistemic-consistency checks include rejecting verified claims without required evidence, verified file integrity without both a valid SHA-256 and byte size, unknown/not-applicable fields that still carry concrete values, declarations mislabeled as independent verification, and maturity assessment states conflated with evidence verification states.

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

Determinism alone does not prove the committed view is current. The combined verifier will launch two independent Node.js generation processes into separate temporary directories, compare those byte streams to each other, and then compare the fresh bytes to committed `docs/portfolio/CONTRACT_PROOF_V0.md`. Any difference marks the generated report stale and fails verification. The verifier does not repair stale output; regeneration is a separate explicit command.

## Test strategy

Implementation follows test-first red/green/refactor cycles. Tests will exercise the public validator and renderer using temporary fixture directories rather than mocks.

The suite will prove:

- the approved single record validates;
- duplicate IDs fail;
- malformed SHAs fail;
- immutable-ref negative fixtures reject `main`, `HEAD`, ordinary branch names, `origin/main`, `refs/heads/main`, `refs/remotes/origin/main`, `refs/tags/v0`, `refs/pull/1/head`, and short SHAs;
- missing disposition fails;
- repo-backed records accept only a full SHA or explicit unresolved state;
- impossible repo/ref combinations fail;
- self and dangling dependencies fail;
- valid declared, verified, unverified, unknown, and not-applicable states are accepted in their permitted contexts;
- invalid epistemic combinations and malformed SHA-256 values fail;
- maturity assessment and evidence verification remain independent;
- report ordering is stable;
- two independent generations are byte-identical;
- a stale committed report fails freshness verification;
- synthetic negative fixtures never count as production records.

Negative fixtures are created only in operating-system temporary directories. The production registry directory must contain exactly one real JSON record, and the combined verifier counts that directory independently from synthetic test data.

## Local and CI parity

`node scripts/verify-portfolio-registry.mjs` is the single combined verification command. It runs the test suite, direct JSON Schema validation, semantic and cross-record validation, exactly-one-real-record enforcement, two-process determinism checks, and generated-report freshness verification.

A narrow `.github/workflows/portfolio-registry.yml` workflow will use path filters for the governed registry, its schema, validator/generator/verifier scripts, portfolio tests, generated report, relevant package metadata, and the workflow itself. CI invokes the exact same combined command: `node scripts/verify-portfolio-registry.mjs`.

Local verification is required before commit. The branch will not be pushed solely to execute CI; CI evidence is collected only when the branch or a pull request is otherwise intentionally published for review.

## Verification gate

The implementation checkpoint is eligible for review only when:

- duplicate asset IDs: `0`;
- silently missing disposition: `0`;
- accepted branch names as immutable refs: `0`;
- repo-backed active entries without a commit SHA or explicit unresolved state: `0`;
- dangling dependency references: `0`;
- deterministic report generation: `2/2` independent-process exact match;
- generated report freshness: committed bytes exactly match both fresh renders;
- governed real records in this tranche: exactly `1`;
- synthetic negative fixtures counted as governed real records: `0`;
- legacy `memory/project-registry.json` SHA-256 remains `d5ae719062059781aad722d059ed9c9780aaae39d667e5eeacbd27e8e6afe377`;
- local and CI verification entrypoint: identical `node scripts/verify-portfolio-registry.mjs` command;
- autonomous issue creation, scheduled mutation, Postgres, graph visualization, and portfolio-wide scoring: absent.

## Error handling and safety

Validation and generation are local, read-only with respect to external systems, and require no credentials or network calls. Generation may replace only the designated generated Markdown report after successful validation. It will not mutate registry records.

No autonomous issue creation, cross-repository write, scheduled mutation, database migration, dashboard, graph visualization, or aggregate scoring is part of this design.

## Implementation sequence after design approval

1. Write failing validator tests and confirm expected failures.
2. Add the closed JSON Schema and execute it directly with the selected standards-compliant validator.
3. Add only the semantic and cross-record validator rules that are outside structural-schema authority.
4. Add the single governed Contract Proof v0 record.
5. Write failing deterministic-renderer and stale-report tests and confirm expected failures.
6. Add the Markdown generator, generated report, and combined verification entrypoint.
7. Add narrow CI parity and package scripts without pushing solely to obtain CI.
8. Run independent generation twice, freshness verification, the full local gate, and the legacy-registry hash guard.
9. Commit the implementation receipt with the verified final state.
