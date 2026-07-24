import { createHash } from "node:crypto";

import { actions, workflows } from "../control-plane/registry";
import { decidePolicy } from "../control-plane/policy";

export interface RepositoryTarget {
  owner: string;
  name: string;
}

export interface RepositoryMetadata {
  fullName: string;
  defaultBranch: string;
  visibility: "public" | "private" | "internal";
  archived: boolean;
  pushedAt?: string;
}

export interface RepositoryPullRequestSummary {
  number: number;
  title: string;
  state: "open" | "closed";
  draft: boolean;
  mergeable?: boolean | null;
}

export interface RepositoryIssueSummary {
  number: number;
  title: string;
  state: "open" | "closed";
}

/**
 * Intentionally contains read methods only. Mutation clients cannot satisfy this
 * interface accidentally unless they also expose an explicit read adapter.
 */
export interface RepositoryReader {
  getMetadata(target: RepositoryTarget): Promise<RepositoryMetadata>;
  readTextFile(target: RepositoryTarget, path: string): Promise<string | null>;
  listBranches(target: RepositoryTarget): Promise<string[]>;
  listPullRequests(target: RepositoryTarget): Promise<RepositoryPullRequestSummary[]>;
  listIssues(target: RepositoryTarget): Promise<RepositoryIssueSummary[]>;
}

export interface RepositoryAuditRequest {
  id: string;
  target: RepositoryTarget;
  allowlistedRepositories: string[];
  requestedAt: string;
  requestedBy: string;
}

export interface RepositoryAuditFinding {
  id: string;
  severity: "info" | "warning" | "risk";
  statement: string;
  evidence: string[];
}

export interface RepositoryAuditResult {
  schemaVersion: "agent-runtime.repo-audit.v0.1";
  request: RepositoryAuditRequest;
  metadata: RepositoryMetadata;
  files: {
    readmePresent: boolean;
    packageJsonPresent: boolean;
    packageLockPresent: boolean;
  };
  branches: string[];
  pullRequests: RepositoryPullRequestSummary[];
  issues: RepositoryIssueSummary[];
  findings: RepositoryAuditFinding[];
  receipt: {
    capability: "read";
    runtimeMode: "read_only";
    mutationAttempted: false;
    workflowId: "repo.audit.v0";
    inputHash: string;
    outputHash: string;
  };
}

export class RepositoryAuditPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RepositoryAuditPolicyError";
  }
}

export async function runReadOnlyRepositoryAudit(
  request: RepositoryAuditRequest,
  reader: RepositoryReader,
): Promise<RepositoryAuditResult> {
  validateRequest(request);
  assertAuditWorkflowIsReadOnly();

  const policy = decidePolicy("read");
  if (!policy.allowed || policy.riskLevel === "blocked") {
    throw new RepositoryAuditPolicyError(`Read capability rejected: ${policy.reason}`);
  }

  const [metadata, readme, packageJson, packageLock, branches, pullRequests, issues] =
    await Promise.all([
      reader.getMetadata(request.target),
      reader.readTextFile(request.target, "README.md"),
      reader.readTextFile(request.target, "package.json"),
      reader.readTextFile(request.target, "package-lock.json"),
      reader.listBranches(request.target),
      reader.listPullRequests(request.target),
      reader.listIssues(request.target),
    ]);

  const files = {
    readmePresent: readme !== null,
    packageJsonPresent: packageJson !== null,
    packageLockPresent: packageLock !== null,
  };

  const findings = buildFindings(metadata, files, branches, pullRequests, issues);
  const inputHash = hashCanonical(request);
  const outputWithoutReceipt = {
    schemaVersion: "agent-runtime.repo-audit.v0.1" as const,
    request,
    metadata,
    files,
    branches: [...branches].sort(),
    pullRequests: [...pullRequests].sort((left, right) => left.number - right.number),
    issues: [...issues].sort((left, right) => left.number - right.number),
    findings,
  };
  const outputHash = hashCanonical(outputWithoutReceipt);

  return {
    ...outputWithoutReceipt,
    receipt: {
      capability: "read",
      runtimeMode: "read_only",
      mutationAttempted: false,
      workflowId: "repo.audit.v0",
      inputHash,
      outputHash,
    },
  };
}

export function assertAuditWorkflowIsReadOnly(): void {
  const workflow = workflows.find((candidate) => candidate.id === "repo.audit.v0");
  if (!workflow) {
    throw new RepositoryAuditPolicyError("Workflow repo.audit.v0 is not registered.");
  }

  const actionById = new Map(actions.map((action) => [action.id, action]));
  for (const stage of workflow.stages) {
    if (stage.approvalGate !== "none") {
      throw new RepositoryAuditPolicyError(
        `Read-only audit stage ${stage.id} unexpectedly declares ${stage.approvalGate}.`,
      );
    }

    for (const actionId of stage.actionIds) {
      const action = actionById.get(actionId);
      if (!action) {
        throw new RepositoryAuditPolicyError(`Audit action ${actionId} is not registered.`);
      }
      if (action.capability !== "read") {
        throw new RepositoryAuditPolicyError(
          `Audit action ${actionId} requires forbidden capability ${action.capability}.`,
        );
      }
      if (action.expectedSideEffects.length > 0) {
        throw new RepositoryAuditPolicyError(
          `Audit action ${actionId} declares side effects: ${action.expectedSideEffects.join(", ")}.`,
        );
      }
    }
  }
}

function validateRequest(request: RepositoryAuditRequest): void {
  if (!request.id || !request.requestedBy || !request.requestedAt) {
    throw new RepositoryAuditPolicyError("Audit request identity and provenance are required.");
  }

  const fullName = `${request.target.owner}/${request.target.name}`;
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(fullName)) {
    throw new RepositoryAuditPolicyError(`Invalid repository target: ${fullName}.`);
  }

  if (!request.allowlistedRepositories.includes(fullName)) {
    throw new RepositoryAuditPolicyError(`Repository ${fullName} is not allowlisted.`);
  }

  if (Number.isNaN(Date.parse(request.requestedAt))) {
    throw new RepositoryAuditPolicyError("requestedAt must be an ISO-compatible timestamp.");
  }
}

function buildFindings(
  metadata: RepositoryMetadata,
  files: RepositoryAuditResult["files"],
  branches: string[],
  pullRequests: RepositoryPullRequestSummary[],
  issues: RepositoryIssueSummary[],
): RepositoryAuditFinding[] {
  const findings: RepositoryAuditFinding[] = [];

  findings.push({
    id: "repository-status",
    severity: metadata.archived ? "warning" : "info",
    statement: metadata.archived
      ? "Repository is archived and should not receive implementation work."
      : "Repository is active.",
    evidence: [`visibility:${metadata.visibility}`, `defaultBranch:${metadata.defaultBranch}`],
  });

  if (!files.readmePresent) {
    findings.push({
      id: "readme-missing",
      severity: "warning",
      statement: "README.md is absent, reducing orientation and portfolio clarity.",
      evidence: ["README.md:not-found"],
    });
  }

  if (files.packageJsonPresent && !files.packageLockPresent) {
    findings.push({
      id: "frozen-install-unproven",
      severity: "risk",
      statement: "package.json exists without package-lock.json; frozen npm installation is unproven.",
      evidence: ["package.json:present", "package-lock.json:not-found"],
    });
  }

  const nonCanonicalBranches = branches.filter(
    (branch) => branch !== metadata.defaultBranch && /^(main|master)$/.test(branch),
  );
  if (nonCanonicalBranches.length > 0) {
    findings.push({
      id: "branch-convention-drift",
      severity: "warning",
      statement: "Both main/master conventions are visible and should be reconciled or documented.",
      evidence: nonCanonicalBranches.map((branch) => `branch:${branch}`),
    });
  }

  const blockedPullRequests = pullRequests.filter(
    (pullRequest) => pullRequest.state === "open" && pullRequest.mergeable === false,
  );
  if (blockedPullRequests.length > 0) {
    findings.push({
      id: "blocked-pull-requests",
      severity: "warning",
      statement: `${blockedPullRequests.length} open pull request(s) are currently not mergeable.`,
      evidence: blockedPullRequests.map((pullRequest) => `pr:${pullRequest.number}`),
    });
  }

  findings.push({
    id: "workload-summary",
    severity: "info",
    statement: `${pullRequests.filter((item) => item.state === "open").length} open pull request(s) and ${issues.filter((item) => item.state === "open").length} open issue(s) were observed.`,
    evidence: [
      `pullRequests:${pullRequests.length}`,
      `issues:${issues.length}`,
      `branches:${branches.length}`,
    ],
  });

  return findings;
}

function hashCanonical(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`);
  return `{${entries.join(",")}}`;
}
