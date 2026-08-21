import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";

const schemaUrl = new URL(
  "../../memory/portfolio-registry/asset.schema.json",
  import.meta.url,
);
const schema = JSON.parse(await readFile(schemaUrl, "utf8"));
const ajv = new Ajv2020({ allErrors: true, strict: true });
const validate = ajv.compile(schema);

const unknownFact = () => ({
  value: null,
  epistemic_state: "unknown",
  evidence_source_ids: [],
  reason: null,
});

const maturityDimension = () => ({
  assessment: unknownFact(),
  evidence: {
    verification_state: "not_applicable",
    authority_source_ids: [],
    reason: "No maturity evidence is asserted in Contract Proof v0.",
  },
});

function createValidRecord() {
  return {
    schema_version: "0.1.0",
    asset_id: "asset.contract-proof-v0",
    name: "Portfolio Asset Registry - Contract Proof v0",
    canonical_location: {
      kind: "repository",
      repository: "MelodicBloom/agent-runtime-control-center",
      epistemic_state: "verified",
      evidence_source_ids: ["source.repository"],
      reason: null,
    },
    owner: {
      value: "Jennipher",
      epistemic_state: "declared",
      evidence_source_ids: ["source.handoff"],
      reason: null,
    },
    project_class: unknownFact(),
    authority_sources: [
      {
        source_id: "source.handoff",
        source_type: "decision_record",
        title: "Approved Portfolio Registry Contract Proof v0 handoff",
        semantic_authority: "decision_authority",
        epistemic_state: "declared",
        integrity: {
          verification_state: "not_applicable",
          sha256: null,
          byte_size: null,
          digest_scope: null,
          reason: "The chat handoff is not a file artifact in this registry.",
        },
      },
      {
        source_id: "source.pdf.regenerative-intelligence-architecture",
        source_type: "file",
        title: "Regenerative Intelligence Architecture.pdf",
        semantic_authority: "strategic_source",
        epistemic_state: "declared",
        integrity: {
          verification_state: "verified",
          sha256:
            "4def5b033058f8df2a8b04ae4f6199c016621cad41adbb21c1f483ce88a8f95e",
          byte_size: 22475433,
          digest_scope: "raw_bytes",
          reason: null,
        },
      },
      {
        source_id: "source.repository",
        source_type: "repository",
        title: "MelodicBloom/agent-runtime-control-center",
        semantic_authority: "repository_evidence",
        epistemic_state: "verified",
        integrity: {
          verification_state: "not_applicable",
          sha256: null,
          byte_size: null,
          digest_scope: null,
          reason: "Git identity is represented by current_git_ref.",
        },
      },
    ],
    disposition: unknownFact(),
    maturity: {
      artifact_completeness: maturityDimension(),
      engineering_reliability: maturityDimension(),
      operational_readiness: maturityDimension(),
      documentation: maturityDimension(),
      use_evidence: maturityDimension(),
    },
    dependencies: [],
    current_git_ref: {
      state: "resolved",
      commit_sha: "8fa2886b2b001b82265bcefe54d9f9bbdc15bc66",
      epistemic_state: "verified",
      evidence_source_ids: ["source.repository"],
      reason: null,
    },
    next_gate: {
      gate_id: "cross_project_audit",
      description: "Cross-project auditor reviews the contract proof evidence.",
      responsible_role: "cross_project_auditor",
      status: "pending",
      required_evidence: [
        {
          evidence_id: "implementation_receipt",
          description: "Committed implementation verification receipt.",
        },
        {
          evidence_id: "verification_results",
          description: "Passing combined local verification output.",
        },
        {
          evidence_id: "generated_report",
          description: "Fresh deterministic portfolio report.",
        },
      ],
      routing: {
        value: "Kimi",
        epistemic_state: "declared",
        evidence_source_ids: ["source.handoff"],
        reason: null,
      },
    },
    blockers: [],
    review_date: unknownFact(),
  };
}

function clonedRecord() {
  return structuredClone(createValidRecord());
}

test("closed Draft 2020-12 schema accepts the Contract Proof shape", () => {
  assert.equal(validate(createValidRecord()), true, JSON.stringify(validate.errors));
});

test("closed schema rejects an additional top-level property", () => {
  assert.equal(validate({ ...createValidRecord(), extra: true }), false);
  assert.ok(validate.errors.some((error) => error.keyword === "additionalProperties"));
});

test("schema rejects a silently missing disposition", () => {
  const record = clonedRecord();
  delete record.disposition;
  assert.equal(validate(record), false);
  assert.ok(validate.errors.some((error) => error.keyword === "required"));
});

for (const mutableRef of [
  "main",
  "HEAD",
  "feature/example",
  "origin/main",
  "refs/heads/main",
  "refs/remotes/origin/main",
  "refs/tags/v0",
  "refs/pull/1/head",
  "8fa2886",
]) {
  test(`schema rejects mutable or non-full immutable ref: ${mutableRef}`, () => {
    const record = clonedRecord();
    record.current_git_ref.commit_sha = mutableRef;
    assert.equal(validate(record), false);
  });
}

test("schema rejects malformed verified file SHA-256", () => {
  const record = clonedRecord();
  record.authority_sources[1].integrity.sha256 = "ABC123";
  assert.equal(validate(record), false);
});

test("unknown facts cannot carry a concrete value", () => {
  const record = clonedRecord();
  record.project_class.value = "platform";
  assert.equal(validate(record), false);
});

test("not-applicable facts require an explicit reason", () => {
  const record = clonedRecord();
  record.review_date.epistemic_state = "not_applicable";
  assert.equal(validate(record), false);
});

test("maturity assessment is structurally separate from evidence verification", () => {
  const record = clonedRecord();
  record.maturity.documentation = {
    value: null,
    epistemic_state: "unknown",
  };
  assert.equal(validate(record), false);
});

export { createValidRecord };
