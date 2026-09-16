import assert from "node:assert/strict";
import test from "node:test";

import {
  decisionRecordSchema,
  evidenceRecordSchema,
  executionGateSchema,
  patternCandidateSchema,
  verificationReceiptSchema,
} from "../../packages/core/src/control-plane/evidence";
import { workflows } from "../../packages/core/src/control-plane/registry";

const evidence = {
  id: "evidence:seed-loom:sep10",
  source: {
    repository: "qt314wink/seed-loom",
    revision: "84959b1db821c49adedde2c827235dcf846adf39",
    path: "knowledge/intake/nightly/2026-09-10/nightly-run-bundle-2026-09-10.json",
    sha256: "35723cf256d336eece3f9b3c3ffa14d9db56d12e403a34c9d4040403d858ab3c",
    authority: "repository",
    accessBoundary: "public",
  },
  observedAt: "2026-09-16T00:00:00Z",
  facts: ["The September 10 bundle is present on the cited revision."],
  inferences: ["A derived reconciliation is safer than rewriting the raw source."],
  unknowns: ["Whether a second isolated replay will reproduce a corrected derived record."],
  assumptions: ["The cited revision remains reachable from the remote."],
  counterevidence: [],
  limitations: ["This fixture does not establish source-content truth beyond repository custody."],
  custody: "immutable_source",
};

const decision = {
  id: "decision:seed-loom:sep10-reconciliation",
  evidenceIds: [evidence.id],
  question: "How should the September 10 intake be reconciled without rewriting source evidence?",
  alternatives: [
    { id: "rewrite", description: "Rewrite the historical bundle in place." },
    { id: "derive", description: "Preserve the source and create a derived reconciliation record." },
  ],
  selectedAlternativeId: "derive",
  rationale: "Preserving raw source bytes keeps later audit and replay possible.",
  falsifier: "A derived record cannot preserve a stable source-to-output trace.",
  status: "approved",
  owner: "repository owner",
  reviewTrigger: "Two isolated reconciliation runs disagree.",
};

test("evidence constitution accepts an immutable source with explicit unknowns", () => {
  assert.deepEqual(evidenceRecordSchema.parse(evidence), evidence);
  assert.deepEqual(decisionRecordSchema.parse(decision), decision);
});

test("evidence constitution rejects unsafe paths and unrecorded uncertainty", () => {
  assert.throws(() => evidenceRecordSchema.parse({ ...evidence, source: { ...evidence.source, path: "../secret" } }));
  const { unknowns: _unknowns, ...missingUnknowns } = evidence;
  assert.throws(() => evidenceRecordSchema.parse(missingUnknowns));
});

test("execution gates cannot mark work executed or waive approval for mutations", () => {
  const gate = {
    id: "gate:seed-loom:reconciliation",
    repository: "qt314wink/seed-loom",
    branch: "codex/sep10-provenance-reconciliation",
    capability: "write_code",
    allowedPaths: ["scripts/knowledge/build-index.mjs"],
    forbiddenPaths: [".github/workflows/deploy.yml"],
    validationSteps: ["node scripts/knowledge/test-pipeline.mjs"],
    rollback: "Revert the bounded commit on the feature branch.",
    approvalRule: "required_before_write",
    executed: false,
  };
  assert.equal(executionGateSchema.parse(gate).executed, false);
  assert.throws(() => executionGateSchema.parse({ ...gate, approvalRule: "none" }));
  assert.throws(() => executionGateSchema.parse({ ...gate, executed: true }));
});

test("verification receipts require passing checks and a rejected negative control", () => {
  const receipt = {
    id: "receipt:seed-loom:sep10-fixture",
    sourceEvidenceIds: [evidence.id],
    decisionId: decision.id,
    expectedResult: "Nested acknowledgements are indexed exactly once.",
    checks: [{ command: "node scripts/knowledge/test-pipeline.mjs", result: "pass", outputSha256: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" }],
    negativeControl: { description: "Duplicate acknowledgement ID must fail.", result: "rejected" },
    outcome: "passed",
    environment: { runtime: "node 24", operatingSystem: "windows" },
  };
  assert.equal(verificationReceiptSchema.parse(receipt).outcome, "passed");
  assert.throws(() => verificationReceiptSchema.parse({ ...receipt, negativeControl: { ...receipt.negativeControl, result: "failed_to_reject" } }));
});

test("patterns require two independent job receipts and the workflow stays non-mutating", () => {
  const candidate = {
    id: "pattern:immutable-derived-reconciliation",
    statement: "Preserve raw source and give every reconciliation output a distinct identity.",
    applicability: "Repository-backed evidence pipelines with post-merge remediation.",
    falsifier: "A source mutation is required to reproduce the reconciled output.",
    supportingCases: [
      { repository: "qt314wink/seed-loom", jobId: "seed-loom-sep10", receiptId: "receipt:seed-loom:sep10-fixture" },
      { repository: "MelodicBloom/agent-runtime-control-center", jobId: "constitution-fixture", receiptId: "receipt:control-center:fixture" },
    ],
    status: "candidate",
    reviewAt: "2026-10-01T00:00:00Z",
  };
  assert.equal(patternCandidateSchema.parse(candidate).supportingCases.length, 2);
  assert.throws(() => patternCandidateSchema.parse({ ...candidate, supportingCases: [candidate.supportingCases[0], { ...candidate.supportingCases[0], receiptId: "receipt:seed-loom:repeat" }] }));
  const workflow = workflows.find((entry) => entry.id === "evidence.reconciliation.v0");
  assert.ok(workflow);
  assert.ok(workflow.definitionOfDone.some((entry) => entry.includes("No repository mutation")));
});
