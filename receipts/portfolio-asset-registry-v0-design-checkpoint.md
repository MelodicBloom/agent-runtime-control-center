# Portfolio Asset Registry v0 - Design Decision Receipt

Receipt type: design-only checkpoint

Decision owner: Jennipher

Builder: Codex

Cross-project auditor after implementation: Kimi

## Ingress

- Repository: `MelodicBloom/agent-runtime-control-center`
- Origin: `https://github.com/MelodicBloom/agent-runtime-control-center.git`
- Branch: `feature/portfolio-asset-registry-v0`
- Original base SHA: `8fa2886b2b001b82265bcefe54d9f9bbdc15bc66`
- Pre-design HEAD: `8fa2886b2b001b82265bcefe54d9f9bbdc15bc66`
- Base matched local HEAD: yes
- Remote `main` matched requested base: yes
- Worktree was clean before design authoring: yes
- Existing PR: none

## Verified source

- File: `Regenerative Intelligence Architecture.pdf`
- Availability: verified locally
- Size: `22475433` bytes
- SHA-256: `4def5b033058f8df2a8b04ae4f6199c016621cad41adbb21c1f483ce88a8f95e`
- Authority level: strategic source material, not executable authority

## Approved decision

- Tranche name: Contract Proof v0
- Governed real records to be implemented: exactly one
- Record target: `MelodicBloom/agent-runtime-control-center`
- Additional real projects: prohibited in this tranche
- Storage: file-backed JSON records plus JSON Schema
- Validation: deterministic local Node.js validator
- View: deterministic generated Markdown
- Database, graph, dashboard, autonomous issue creation, scheduled mutation, cross-repository writes, and portfolio-wide scoring: excluded

## Repository-context decision

The existing `memory/project-registry.json` is an informal legacy list. It will not be migrated, deleted, or silently treated as governed data in this tranche. The approved governed surface will be additive under `memory/portfolio-registry/` and will explicitly document its canonical status for Contract Proof v0.

## Alternatives rejected

1. Migrating the existing four informal project entries, because those projects are absent from this handoff.
2. Deleting or rewriting the legacy list, because no destructive migration was authorized.
3. Building on Drizzle/Postgres, because the ontology must survive file-backed use first.

## Checkpoint scope

Changed paths in this checkpoint:

- `docs/superpowers/specs/2026-08-21-portfolio-asset-registry-v0-design.md`
- `receipts/portfolio-asset-registry-v0-design-checkpoint.md`

Implementation artifacts intentionally absent:

- schema;
- governed record;
- validator;
- generator;
- generated portfolio report;
- test suite;
- package scripts.

## Verification status

- Documentation-only diff: required
- Tests: skipped because no executable behavior is introduced
- Build/typecheck/lint/format: skipped because no executable or formatted source is changed
- CI: not triggered at local design checkpoint
- Unresolved questions: none for the approved single-record design
- Scope deviations: none
- Merge recommendation: `not_merge_ready` - implementation and its verification receipt remain pending

The full checkpoint commit SHA is intentionally reported in the egress response rather than embedded here, because a commit cannot contain its own stable SHA.
