# Portfolio Asset Registry v0 - Design Review Amendment Receipt

Receipt type: design-review amendment, documentation only

Decision owner: Jennipher

Builder: Codex

## Lineage

- Repository: `MelodicBloom/agent-runtime-control-center`
- Branch: `feature/portfolio-asset-registry-v0`
- Original base SHA: `8fa2886b2b001b82265bcefe54d9f9bbdc15bc66`
- Previous design SHA: `191629a2568ea97c6086f1656dd7683f158d6a21`
- Previous design commit preserved without amend, squash, reset, or replacement: yes
- Original design receipt preserved: `receipts/portfolio-asset-registry-v0-design-checkpoint.md`
- Original committed receipt SHA-256: `2f7d93cfe30d9d3be7605b8fa2d54cecd691a84e9f901d7baae12a1d2e4002ff`

## Review corrections incorporated

1. Defined `verified`, `declared`, `unverified`, `unknown`, and `not_applicable`; handoff decisions are declarations rather than independent verification.
2. Separated maturity assessment from evidence verification.
3. Structured `next_gate` with stable gate ID, description, responsible role, status, required evidence, and optional current routing; Kimi is routing rather than ontology.
4. Required verified file sources to carry raw-byte SHA-256 and byte size while keeping integrity distinct from semantic authority.
5. Required lowercase 64-hex SHA-256 syntax and semantic epistemic-consistency checks.
6. Added generated-report freshness verification against two independent fresh renders.
7. Assigned structural authority exclusively to committed JSON Schema and semantic/cross-record authority to custom validation.
8. Required `additionalProperties: false` throughout governed structures with no open v0 extension point.
9. Added immutable-ref negative fixtures for `main`, `HEAD`, ordinary branches, remote branches, refs, and short SHAs.
10. Added narrow CI parity using the same combined local verification command, with no push solely to execute CI.

## Preserved decisions

- Governed real records in Contract Proof v0: exactly one.
- Additional real projects in this tranche: prohibited.
- Existing `memory/project-registry.json`: unchanged legacy input, not governed data.
- Legacy registry pinned SHA-256: `d5ae719062059781aad722d059ed9c9780aaae39d667e5eeacbd27e8e6afe377`.
- Database construction, graph visualization, dashboard work, autonomous issue creation, scheduled mutation, cross-repository writes, and portfolio-wide scoring: excluded.

## Authorized amendment scope

Changed paths:

- `docs/superpowers/specs/2026-08-21-portfolio-asset-registry-v0-design.md`
- `receipts/portfolio-asset-registry-v0-design-review-amendment.md`

The original design checkpoint receipt remains byte-for-byte unchanged in Git history and is not part of this amendment diff.

## Verification status

- Documentation-only diff: required
- Implementation code or data: prohibited and absent
- Tests/build/typecheck/lint/format: skipped because executable behavior is unchanged
- CI: not triggered; the branch is not pushed solely for CI
- Unresolved questions: none within the requested design corrections
- Scope deviations: none
- Merge recommendation: `not_merge_ready` - amended specification still requires review and explicit implementation approval

The new full amendment commit SHA and amended design-document SHA-256 are reported in the egress response rather than embedded here, because a commit cannot contain its own stable SHA.
