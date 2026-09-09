# Personal Codex extraction

Status: refined extraction package; local document and contract validation only.

Start with `codex-system.md`. Use `handoff.schema.json` with the code and design JSON templates. `workflow-assignments.json` assigns responsibilities to logical roles, without dispatching agents or authorizing external actions. `source-register.json` records the evidence boundary. `validation-receipt.json` records the checks and comparison against the preceding chat draft.

From the repository root run `pnpm install --frozen-lockfile`, `pnpm test`, and `pnpm validate` using Node 22 or newer. `pnpm verify:receipt` checks the recorded file hashes without regenerating the receipt. `pnpm validate:handoff outputs/code-handoff.template.json` validates a handoff; use the design template path for design work. Ajv is a development-only JSON Schema validator; there are no runtime services or production dependencies. The lockfile pins dependency resolution. The validation command refreshes the test log and receipt; commit those refreshed files together with any changes.

Workflow assignments cover evidence extraction, contract design, code handoff, design handoff, QA, and local release. Roles define responsibilities and acceptance gates; no people or external agents have been assigned or contacted. Contract compatibility means compatibility between this package's version 1.0.0 schema, templates, and validator. Existing external project schemas were not migrated or tested.

This package does not claim an exhaustive repository survey, a measured 80% naming frequency, a rendered application, a shader benchmark, or approval of historical draft architectures. Templates are newly synthesized from the inspected records; they are not recovered verbatim historical contracts. Role assignments are declarative.
