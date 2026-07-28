import assert from "node:assert/strict";
import test from "node:test";

import {
  RepositoryAuditPolicyError,
  assertAuditWorkflowIsReadOnly,
  runReadOnlyRepositoryAudit,
  type RepositoryReader,
} from "../../packages/core/src/audit/repository-audit";
import { decidePolicy } from "../../packages/core/src/control-plane/policy";

function createReader(): RepositoryReader {
  return {
    async getMetadata(target) {
      return {
        fullName: `${target.owner}/${target.name}`,
        defaultBranch: "main",
        visibility: "public",
        archived: false,
      };
    },
    async readTextFile(_target, path) {
      if (path === "README.md") return "# Example";
      if (path === "package.json") return '{"name":"example"}';
      return null;
    },
    async listBranches() {
      return ["main", "feature/example"];
    },
    async listPullRequests() {
      return [
        {
          number: 2,
          title: "Blocked change",
          state: "open",
          draft: true,
          mergeable: false,
        },
      ];
    },
    async listIssues() {
      return [{ number: 4, title: "Evidence gap", state: "open" }];
    },
  };
}

const request = {
  id: "audit-001",
  target: { owner: "MelodicBloom", name: "example" },
  allowlistedRepositories: ["MelodicBloom/example"],
  requestedAt: "2026-07-24T15:00:00.000Z",
  requestedBy: "jennipher",
};

test("default runtime policy hard-blocks every mutation capability", () => {
  for (const capability of [
    "write_draft",
    "execute_check",
    "write_code",
    "merge",
    "deploy",
    "delete",
  ] as const) {
    const decision = decidePolicy(capability);
    assert.equal(decision.allowed, false);
    assert.equal(decision.riskLevel, "blocked");
    assert.equal(decision.approvalRule, "blocked");
  }

  assert.equal(decidePolicy("read").allowed, true);
  assert.equal(decidePolicy("plan").allowed, true);
});

test("repo.audit.v0 contains read actions with no declared side effects", () => {
  assert.doesNotThrow(() => assertAuditWorkflowIsReadOnly());
});

test("audit rejects repositories outside the explicit allowlist before reading", async () => {
  let touched = false;
  const reader = createReader();
  const guardedReader: RepositoryReader = {
    ...reader,
    async getMetadata(target) {
      touched = true;
      return reader.getMetadata(target);
    },
  };

  await assert.rejects(
    () =>
      runReadOnlyRepositoryAudit(
        { ...request, allowlistedRepositories: ["MelodicBloom/other"] },
        guardedReader,
      ),
    RepositoryAuditPolicyError,
  );
  assert.equal(touched, false);
});

test("audit returns a read-only receipt and flags missing lockfile evidence", async () => {
  const result = await runReadOnlyRepositoryAudit(request, createReader());

  assert.equal(result.receipt.capability, "read");
  assert.equal(result.receipt.runtimeMode, "read_only");
  assert.equal(result.receipt.mutationAttempted, false);
  assert.match(result.receipt.inputHash, /^[a-f0-9]{64}$/);
  assert.match(result.receipt.outputHash, /^[a-f0-9]{64}$/);
  assert.ok(result.findings.some((finding) => finding.id === "frozen-install-unproven"));
  assert.ok(result.findings.some((finding) => finding.id === "blocked-pull-requests"));
});

test("identical repository snapshots produce identical output hashes", async () => {
  const first = await runReadOnlyRepositoryAudit(request, createReader());
  const second = await runReadOnlyRepositoryAudit(request, createReader());

  assert.equal(first.receipt.inputHash, second.receipt.inputHash);
  assert.equal(first.receipt.outputHash, second.receipt.outputHash);
});

test("invalid repository target is rejected", async () => {
  await assert.rejects(
    () =>
      runReadOnlyRepositoryAudit(
        {
          ...request,
          target: { owner: "MelodicBloom", name: "../unsafe" },
          allowlistedRepositories: ["MelodicBloom/../unsafe"],
        },
        createReader(),
      ),
    /Invalid repository target/,
  );
});
