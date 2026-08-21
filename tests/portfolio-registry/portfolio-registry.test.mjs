import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import {
  renderPortfolio,
  validateRegistry,
} from "../../scripts/portfolio-registry.mjs";
import { compareFreshReport } from "../../scripts/verify-portfolio-registry.mjs";

const schemaUrl = new URL(
  "../../memory/portfolio-registry/asset.schema.json",
  import.meta.url,
);
const productionRecordUrl = new URL(
  "../../memory/portfolio-registry/assets/contract-proof-v0.json",
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

async function withTemporaryRegistry(records, callback, expectedRecordCount = records.length) {
  const registryDir = await mkdtemp(join(tmpdir(), "portfolio-registry-test-"));
  const assetsDir = join(registryDir, "assets");
  await mkdir(assetsDir);

  try {
    for (const [index, record] of records.entries()) {
      await writeFile(
        join(assetsDir, `${String(index).padStart(2, "0")}.json`),
        `${JSON.stringify(record, null, 2)}\n`,
        "utf8",
      );
    }

    return await callback(
      await validateRegistry({ registryDir, expectedRecordCount }),
    );
  } finally {
    await rm(registryDir, { recursive: true, force: true });
  }
}

function hasError(result, code) {
  return result.errors.some((error) => error.code === code);
}

test("semantic validation rejects duplicate asset IDs", async () => {
  await withTemporaryRegistry(
    [createValidRecord(), createValidRecord()],
    (result) => {
      assert.equal(result.valid, false);
      assert.equal(hasError(result, "registry.duplicate_asset_id"), true);
    },
    2,
  );
});

test("schema execution reports duplicate dependencies without handwritten shape rules", async () => {
  const record = clonedRecord();
  record.dependencies = ["asset.dependency", "asset.dependency"];

  await withTemporaryRegistry([record], (result) => {
    assert.equal(result.valid, false);
    assert.equal(hasError(result, "schema.uniqueItems"), true);
  });
});

test("semantic validation rejects a self-dependency", async () => {
  const record = clonedRecord();
  record.dependencies = [record.asset_id];

  await withTemporaryRegistry([record], (result) => {
    assert.equal(result.valid, false);
    assert.equal(hasError(result, "registry.self_dependency"), true);
  });
});

test("semantic validation rejects a dangling dependency", async () => {
  const record = clonedRecord();
  record.dependencies = ["asset.missing"];

  await withTemporaryRegistry([record], (result) => {
    assert.equal(result.valid, false);
    assert.equal(hasError(result, "registry.dangling_dependency"), true);
  });
});

test("semantic validation rejects missing authority-source references", async () => {
  const record = clonedRecord();
  record.owner.evidence_source_ids = ["source.missing"];

  await withTemporaryRegistry([record], (result) => {
    assert.equal(result.valid, false);
    assert.equal(hasError(result, "record.missing_authority_source"), true);
  });
});

test("semantic validation rejects an unrepoed asset carrying a Git commit", async () => {
  const record = clonedRecord();
  record.canonical_location = {
    kind: "unrepoed",
    repository: null,
    epistemic_state: "declared",
    evidence_source_ids: ["source.handoff"],
    reason: null,
  };

  await withTemporaryRegistry([record], (result) => {
    assert.equal(result.valid, false);
    assert.equal(hasError(result, "record.impossible_repository_ref"), true);
  });
});

test("semantic validation rejects a repository with a not-applicable Git ref", async () => {
  const record = clonedRecord();
  record.current_git_ref = {
    state: "not_applicable",
    commit_sha: null,
    epistemic_state: "not_applicable",
    evidence_source_ids: [],
    reason: "Synthetic impossible state.",
  };

  await withTemporaryRegistry([record], (result) => {
    assert.equal(result.valid, false);
    assert.equal(hasError(result, "record.impossible_repository_ref"), true);
  });
});

test("semantic validation enforces the expected production record count", async () => {
  await withTemporaryRegistry(
    [createValidRecord()],
    (result) => {
      assert.equal(result.valid, false);
      assert.equal(hasError(result, "registry.record_count"), true);
    },
    2,
  );
});

test("production record preserves the approved epistemic distinctions", async () => {
  const record = JSON.parse(await readFile(productionRecordUrl, "utf8"));
  const pdfSource = record.authority_sources.find(
    (source) =>
      source.source_id ===
      "source.pdf.regenerative-intelligence-architecture",
  );

  assert.equal(record.owner.value, "Jennipher");
  assert.equal(record.owner.epistemic_state, "declared");
  assert.equal(record.canonical_location.epistemic_state, "verified");
  assert.equal(record.current_git_ref.epistemic_state, "verified");
  assert.equal(pdfSource.epistemic_state, "declared");
  assert.equal(pdfSource.integrity.verification_state, "verified");
  assert.equal(record.project_class.epistemic_state, "unknown");
  assert.equal(record.disposition.epistemic_state, "unknown");
  assert.equal(record.review_date.epistemic_state, "unknown");
  assert.equal(record.next_gate.responsible_role, "cross_project_auditor");
  assert.equal(record.next_gate.routing.value, "Kimi");
  assert.equal(record.next_gate.routing.epistemic_state, "declared");
});

test("renderer emits the governed fields in a fixed human-readable order", () => {
  const rendered = renderPortfolio([createValidRecord()]);
  const expectedExcerpt = [
    "## Portfolio Asset Registry - Contract Proof v0",
    "",
    "- Asset ID: `asset.contract-proof-v0`",
    "- Canonical location: `MelodicBloom/agent-runtime-control-center` (`verified`)",
    "- Owner: Jennipher (`declared`)",
    "- Project class: unknown (`unknown`)",
    "- Disposition: unknown (`unknown`)",
    "- Current immutable Git ref: `8fa2886b2b001b82265bcefe54d9f9bbdc15bc66` (`verified`)",
  ].join("\n");

  assert.ok(rendered.includes(expectedExcerpt));
  assert.ok(rendered.endsWith("\n"));
  assert.equal(rendered.includes("\r"), false);
});

test("renderer output is byte-identical regardless of input traversal order", () => {
  const alpha = createValidRecord();
  const zeta = createValidRecord();
  zeta.asset_id = "asset.zeta";
  zeta.name = "Zeta Asset";

  assert.equal(
    renderPortfolio([zeta, alpha]),
    renderPortfolio([alpha, zeta]),
  );
});

test("renderer contains no current working directory or wall-clock marker", () => {
  const rendered = renderPortfolio([createValidRecord()]);
  assert.equal(rendered.includes(process.cwd()), false);
  assert.equal(rendered.includes(new Date().getFullYear().toString()), false);
  assert.equal(rendered.includes("Generated at"), false);
});

test("freshness comparison fails for a deliberately stale report", async () => {
  const directory = await mkdtemp(join(tmpdir(), "portfolio-report-test-"));
  const freshPath = join(directory, "fresh.md");
  const committedPath = join(directory, "committed.md");

  try {
    await writeFile(freshPath, "fresh bytes\n", "utf8");
    await writeFile(committedPath, "stale bytes\n", "utf8");
    const comparison = await compareFreshReport({ freshPath, committedPath });
    assert.equal(comparison.fresh, false);
    assert.notEqual(comparison.freshSha256, comparison.committedSha256);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

export { createValidRecord };
