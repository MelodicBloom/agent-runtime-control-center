# Evidence Constitution Foundation

Status: proposed, non-enforcing foundation.  This document preserves a cross-repository remediation case and defines the smallest contract needed before runtime enforcement is enabled.

## Authority boundary

| Plane | Canonical home | Responsibility |
| --- | --- | --- |
| Research source, observations, research runs, and domain patterns | `qt314wink/seed-loom` | Retain immutable inputs and domain-specific canonical records. |
| Agent decision process, approvals, reusable workflows, task receipts, and cross-repository learning | `MelodicBloom/agent-runtime-control-center` | Govern how agents assess, transform, test, promote, and learn from work across repositories. |
| Repository-local implementation | Target repository | Own executable code, tests, deployment, and local acceptance rules. |

The control center must reference source records by repository, immutable revision, path, and SHA-256. It must not replace Seed Loom's source evidence or declare a domain record canonical on its own.

## Preserved case: Seed Loom September 10 intake

The September 10 nightly intake entered Seed Loom main through merge commit `84959b1db821c49adedde2c827235dcf846adf39`. The original material remains immutable:

| Artifact | SHA-256 |
| --- | --- |
| `knowledge/intake/nightly/2026-09-10/nightly-run-bundle-2026-09-10.json` | `35723cf256d336eece3f9b3c3ffa14d9db56d12e403a34c9d4040403d858ab3c` |
| `knowledge/runs/run-nightly-2026-09-10.json` | `0d151a0cb612bc4b3bd235d3db3297e254ee4aa54e45f81b8e6602c8d8f4c28a` |
| `knowledge/receipts/run-nightly-2026-09-10-ingest.json` | `2e3a5503607c5b2a360f99d88e1c5acaf0b9c9c615f8a22f147a6988ac137c52` |

Observed defects were: nested stage acknowledgements were omitted from direct-only walkers; record identity could collide on shared `runId`; a legacy ingest receipt did not retain a distinct graph identity; opportunity references used a noncanonical namespace; and repository-action proposals lacked required operational boundaries.

The first remediation commit is `d1f865d1fe2eeaeb040f68c777a6cfb63198b062` on `qt314wink/seed-loom:codex/sep10-provenance-reconciliation`. It recursively validates and indexes acknowledgements, fails duplicate identities closed, separates legacy ingest receipt projection identity, and adds a regression test. It does not rewrite the three source artifacts above.

## Constitution model

Every cross-repository task produces an immutable decision record with these planes:

1. `source`: repository, revision, path, SHA-256, authority class, access boundary.
2. `observation`: fact, inference, uncertainty, counterevidence, and time boundary.
3. `decision`: question, alternatives, chosen path, rationale, owner, and review trigger.
4. `execution`: allowed scope, forbidden scope, action capability, approval gate, rollback, and idempotency key.
5. `verification`: expected result, test command, negative control, measured output, environment, and receipt digest.
6. `learning`: reusable pattern, applicability, confidence, falsifier, expiry, and links to future jobs.

A plane may be `unknown`; absence must never be represented as verified, approved, or not applicable.

## Gate sequence

```text
source custody → interpretation boundary → contract validation → bounded change
  → independent QA → approval-aware promotion → decision receipt → weekly pattern review
```

An agent stops and records a hold when a source is unidentified, an interpretation lacks evidence, a contract fails, an action exceeds approval/scope, a negative control fails, or a result cannot be reproduced.

## Minimal implementation roadmap

### Phase 1 — typed records, no automatic enforcement

- Add Zod contracts for `EvidenceRecord`, `DecisionRecord`, `ExecutionGate`, `VerificationReceipt`, and `PatternCandidate` under `packages/core/src/control-plane`.
- Add fixture tests for immutable source preservation, absent-versus-unknown handling, approval escalation, source-to-receipt traceability, and failed negative controls.
- Store proposed records as task artifacts; do not add database migrations until the shapes and review flow are proven.

### Phase 2 — workflow integration

- Add an `evidence_reconciliation` workflow with stages `collect`, `classify`, `decide`, `implement`, `verify`, `review`, and `learn`.
- Require a receipt before a task can transition from `running` to `complete`.
- Make `merge`, `deploy`, `delete`, and source-mutating transformations explicit gates, never inferred from a passing test.

### Phase 3 — operational persistence and weekly review

- Add relational tables only after Phase 1 contracts are stable: `evidence_records`, `decision_records`, `verification_receipts`, `pattern_candidates`, and `pattern_reviews`.
- Schedule a weekly read-only pattern review that deduplicates comparable cases, scores applicability and evidence strength, and emits candidates rather than automatically changing policy.
- Promote a pattern to reusable guidance only after human review, a documented falsifier, and examples from at least two independent jobs or repositories.

## Non-negotiable constraints

- Git remains the canonical source for code and versioned evidence.
- Source bytes are preserved; derivations receive their own identity and relation.
- Passing tests prove only their declared checks.
- Generated projections, summaries, embeddings, and rankings are disposable unless independently versioned as evidence.
- Agent memory may suggest a pattern but cannot widen repository scope, permissions, approval authority, source policy, or evidence requirements.
- Every destructive, public, credentialed, or irreversible operation retains a specific approval record and rollback posture.

## Definition of ready for enforcement

The constitution is ready to move from proposed documentation to runtime enforcement only when contracts parse, fixtures cover positive and negative paths, approval transitions are tested, receipts link to immutable source revisions, and a weekly review produces no silent policy mutation.
