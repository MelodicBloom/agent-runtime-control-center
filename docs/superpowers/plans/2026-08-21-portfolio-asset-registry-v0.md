# Portfolio Asset Registry v0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the single-record, file-backed Portfolio Registry Contract Proof v0 with closed JSON Schema validation, semantic invariants, deterministic/fresh report generation, and identical local/CI verification.

**Architecture:** Draft 2020-12 JSON Schema executed directly by Ajv owns structural validation. Focused Node.js ESM modules own cross-record semantics and deterministic rendering; a separate verifier runs tests, validation, two independent generation processes, freshness comparison, production-count enforcement, and the legacy hash guard.

**Tech Stack:** Node.js 24, ESM, `node:test`, Ajv Draft 2020-12, pnpm lockfile, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-08-21-portfolio-asset-registry-v0-design.md`

## Global Constraints

- Start from `a265385c3bdbfc81a4f3321e8644498b74e1ac1e` on `feature/portfolio-asset-registry-v0`.
- Add exactly one production asset record: `asset.contract-proof-v0`.
- Preserve `memory/project-registry.json` at SHA-256 `d5ae719062059781aad722d059ed9c9780aaae39d667e5eeacbd27e8e6afe377`.
- Preserve the distinct epistemic states `verified`, `declared`, `unverified`, `unknown`, and `not_applicable`.
- Use Ajv Draft 2020-12 directly against committed JSON Schema; do not duplicate structural shape in JavaScript.
- Every governed object uses `additionalProperties: false`; v0 has no open extension point.
- Resolved immutable refs accept only lowercase 40-hex commit SHAs.
- Generated Markdown contains no time, absolute path, traversal-order dependence, or environment text.
- Local and CI verification both run `node scripts/verify-portfolio-registry.mjs`.
- Do not populate, migrate, edit, or validate the four legacy registry projects.
- Do not add Postgres/Drizzle integration, graphs, dashboards, scoring, issue creation, schedules, cross-repository writes, or autonomous GitHub activity.

---

### Task 1: Schema Execution Contract

**Files:**
- Create: `memory/portfolio-registry/asset.schema.json`
- Create: `tests/portfolio-registry/portfolio-registry.test.mjs`
- Modify: `package.json`
- Create: `pnpm-lock.yaml`
- Create: `docs/superpowers/plans/2026-08-21-portfolio-asset-registry-v0.md`

**Interfaces:**
- Consumes: approved field/state definitions from the design specification.
- Produces: Draft 2020-12 schema ID `https://melodicbloom.local/schemas/portfolio-asset-v0.json`; test helper `createValidRecord()` containing a literal synthetic record; Ajv structural-validation test harness.

- [ ] **Step 1: Add the test dependency only**

Run: `pnpm add --save-dev --save-exact ajv@8.17.1`

Expected: `package.json` gains only `devDependencies.ajv`; `pnpm-lock.yaml` is created; no unrelated version changes.

- [ ] **Step 2: Write failing schema tests**

Create tests that load `memory/portfolio-registry/asset.schema.json` with `Ajv2020` from `ajv/dist/2020.js` and use literal fixtures to assert:

```js
assert.equal(validate(createValidRecord()), true);
assert.equal(validate({ ...createValidRecord(), extra: true }), false);
assert.equal(validate(withoutDisposition), false);
assert.equal(validate(withCommitSha("main")), false);
assert.equal(validate(withMalformedSha256), false);
```

The valid fixture uses `owner.epistemic_state = "declared"`, unknown project class/disposition/review date with null values, separated maturity assessment/evidence objects, verified file integrity, and structured `next_gate`.

- [ ] **Step 3: Run tests and verify RED**

Run: `node --test tests/portfolio-registry/portfolio-registry.test.mjs`

Expected: FAIL because `memory/portfolio-registry/asset.schema.json` does not exist.

- [ ] **Step 4: Add the closed Draft 2020-12 schema**

Define the complete record and nested structures with `required` arrays, conditional epistemic value rules, lowercase SHA patterns, byte-size rules, `minItems`, and `additionalProperties: false` everywhere. Use regex for ISO date syntax so `ajv-formats` is unnecessary.

- [ ] **Step 5: Run tests and verify GREEN**

Run: `node --test tests/portfolio-registry/portfolio-registry.test.mjs`

Expected: all schema tests pass with zero failures.

- [ ] **Step 6: Commit**

Stage only the plan, schema, test, `package.json`, and `pnpm-lock.yaml`.

Commit: `feat: add portfolio asset schema contract`

### Task 2: Semantic Validator and Single Production Record

**Files:**
- Create: `scripts/portfolio-registry.mjs`
- Create: `memory/portfolio-registry/README.md`
- Create: `memory/portfolio-registry/assets/contract-proof-v0.json`
- Modify: `tests/portfolio-registry/portfolio-registry.test.mjs`

**Interfaces:**
- Consumes: `asset.schema.json` and production `assets/*.json`.
- Produces:
  - `loadRegistry({ registryDir }) -> Promise<{ records, files, parseErrors }>`
  - `validateRegistry({ registryDir, schemaPath, expectedRecordCount }) -> Promise<{ valid, errors, records, files }>`
  - CLI `node scripts/portfolio-registry.mjs validate [--registry PATH] [--schema PATH] [--expected-count N]`

- [ ] **Step 1: Write failing semantic tests**

Use real temporary directories and literal JSON fixtures. Assert error codes for duplicate IDs, duplicate dependencies, self-dependency, dangling dependency, missing evidence source, impossible repo/ref state, and the wrong production count. Assert each mutable ref (`main`, `HEAD`, `feature/example`, `origin/main`, `refs/heads/main`, `refs/remotes/origin/main`, `refs/tags/v0`, `refs/pull/1/head`, `8fa2886`) is rejected.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test tests/portfolio-registry/portfolio-registry.test.mjs`

Expected: FAIL with module-not-found for `scripts/portfolio-registry.mjs` or missing semantic results.

- [ ] **Step 3: Implement semantic validation**

Execute Ajv directly for each parsed record. Map Ajv errors to deterministic `schema.<keyword>` codes. Add only cross-record and cross-field checks, sort errors by `path`, `code`, then `message`, and never infer missing values.

- [ ] **Step 4: Add the single governed record and canonical README**

Record only `asset.contract-proof-v0`. Represent Jennipher as declared, repository/ref as verified, PDF bytes as verified integrity, PDF authority as declared strategic, class/disposition/review date as unknown, five unknown maturity assessments with not-applicable evidence, zero dependencies, and a pending vendor-neutral `cross_project_audit` gate routed by declaration to Kimi.

- [ ] **Step 5: Run tests and production validation GREEN**

Run:

```text
node --test tests/portfolio-registry/portfolio-registry.test.mjs
node scripts/portfolio-registry.mjs validate --expected-count 1
```

Expected: both commands exit 0; production validation reports one record and zero errors.

- [ ] **Step 6: Commit**

Stage only validator, registry README, one record, and tests.

Commit: `feat: validate the contract proof registry`

### Task 3: Deterministic Renderer and Freshness Verification

**Files:**
- Modify: `scripts/portfolio-registry.mjs`
- Create: `scripts/verify-portfolio-registry.mjs`
- Create: `docs/portfolio/CONTRACT_PROOF_V0.md`
- Modify: `tests/portfolio-registry/portfolio-registry.test.mjs`

**Interfaces:**
- Produces:
  - `renderPortfolio(records) -> string`
  - CLI `node scripts/portfolio-registry.mjs generate --output PATH`
  - `compareFreshReport({ freshPath, committedPath }) -> Promise<{ fresh, freshSha256, committedSha256 }>`
  - combined CLI `node scripts/verify-portfolio-registry.mjs`

- [ ] **Step 1: Write failing renderer/freshness tests**

Assert a hand-written Markdown excerpt and fixed field ordering, byte-identical rendering after reversed input order, absence of absolute/current-working-directory text, and stale-report failure when committed bytes are deliberately changed in a temporary directory.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test tests/portfolio-registry/portfolio-registry.test.mjs`

Expected: FAIL because renderer and freshness interfaces are missing.

- [ ] **Step 3: Implement deterministic rendering and generation**

Sort records/source/dependency data, normalize LF, include no time/path/environment values, validate before render, and write only the requested output path.

- [ ] **Step 4: Generate the committed report**

Run: `node scripts/portfolio-registry.mjs generate --output docs/portfolio/CONTRACT_PROOF_V0.md`

Expected: generated Markdown describes exactly one record.

- [ ] **Step 5: Implement the combined verifier**

Run the test file as a child process, validate production count, spawn two separate generator child processes into separate temporary directories, assert distinct child PIDs, compare bytes and SHA-256, compare fresh bytes to the committed report, check the legacy SHA-256, and print a complete stable verification summary.

- [ ] **Step 6: Run tests and verifier GREEN**

Run:

```text
node --test tests/portfolio-registry/portfolio-registry.test.mjs
node scripts/verify-portfolio-registry.mjs
```

Expected: all tests pass; two independent hashes match; freshness is true; legacy hash matches.

- [ ] **Step 7: Commit**

Stage only renderer/verifier scripts, tests, and generated report.

Commit: `feat: generate and verify the portfolio view`

### Task 4: CI Parity, Package Commands, and Implementation Receipt

**Files:**
- Create: `.github/workflows/portfolio-registry.yml`
- Modify: `package.json`
- Create: `receipts/portfolio-asset-registry-v0-implementation.md`

**Interfaces:**
- Consumes: canonical `node scripts/verify-portfolio-registry.mjs` command.
- Produces: path-filtered CI workflow, package aliases, and final evidence receipt.

- [ ] **Step 1: Add narrow CI parity and package aliases**

Workflow triggers only for registry/schema/scripts/tests/report/package metadata/workflow paths. Its verification step is exactly:

```yaml
- name: Verify portfolio registry
  run: node scripts/verify-portfolio-registry.mjs
```

Package scripts alias validate, generate, test, and verify without changing existing scripts.

- [ ] **Step 2: Run local CI-contract review**

Inspect the workflow and confirm its command exactly equals the local command. Do not push solely to execute CI.

- [ ] **Step 3: Run the complete fresh verification gate**

Run: `node scripts/verify-portfolio-registry.mjs`

Expected: exit 0 with schema, semantics, record count, legacy hash, two-process equality, equal SHA-256, freshness, and test counts all proven.

- [ ] **Step 4: Write the implementation receipt**

Record base/start/final lineage, commits, files, dependency/lock changes, Ajv version, artifact hashes, test counts, independent-process hashes, freshness, verifier output, skipped remote CI, deviations, blockers, and `READY_FOR_HUMAN_REVIEW`.

- [ ] **Step 5: Commit CI and receipt**

Stage only workflow, package aliases, and implementation receipt.

Commit: `docs: record portfolio registry verification`

- [ ] **Step 6: Verify final repository state**

Re-run the combined verifier, confirm `git status --short` is clean, enumerate commits and changed files from the original base, and produce the complete egress receipt.
