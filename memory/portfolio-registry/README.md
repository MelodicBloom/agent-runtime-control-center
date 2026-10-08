# Portfolio Asset Registry v0

This directory is the governed, file-backed Contract Proof v0 registry.

- `asset.schema.json` is the sole structural contract and is executed directly with Ajv Draft 2020-12.
- `assets/*.json` contains governed production records. This tranche contains exactly one real record.
- `scripts/portfolio-registry.mjs` owns semantic and cross-record invariants that the schema cannot establish in isolation.
- `docs/portfolio/CONTRACT_PROOF_V0.md` is generated from these records and must remain byte-fresh.

Run `node scripts/verify-portfolio-registry.mjs` for the complete local and CI verification contract. The legacy `memory/project-registry.json` is outside this registry and must remain byte-identical.
