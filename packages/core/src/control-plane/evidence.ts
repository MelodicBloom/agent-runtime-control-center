import { z } from "zod";

const sha256 = z.string().regex(/^[a-f0-9]{64}$/, "expected a lowercase SHA-256 digest");
const repository = z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/, "expected owner/repository");
const revision = z.string().regex(/^[a-f0-9]{40}$/, "expected a full Git revision");
const relativePath = z.string().min(1).refine(
  (value) => !value.startsWith("/") && !value.includes("\\") && !value.split("/").includes(".."),
  "expected a repository-relative, forward-slash path",
);

export const sourceRecordSchema = z.object({
  repository,
  revision,
  path: relativePath,
  sha256,
  authority: z.enum(["primary", "official", "repository", "review", "derived", "unverified"]),
  accessBoundary: z.enum(["public", "private_authorized", "restricted", "unknown"]),
});

export const evidenceRecordSchema = z.object({
  id: z.string().regex(/^evidence:[a-z0-9][a-z0-9._:-]+$/),
  source: sourceRecordSchema,
  observedAt: z.string().datetime({ offset: true }),
  facts: z.array(z.string().min(1)),
  inferences: z.array(z.string().min(1)),
  unknowns: z.array(z.string().min(1)),
  assumptions: z.array(z.string().min(1)),
  counterevidence: z.array(z.string().min(1)),
  limitations: z.array(z.string().min(1)),
  custody: z.enum(["immutable_source", "derived_record", "projection", "unknown"]),
});

export const decisionRecordSchema = z.object({
  id: z.string().regex(/^decision:[a-z0-9][a-z0-9._:-]+$/),
  evidenceIds: z.array(z.string().regex(/^evidence:/)).min(1),
  question: z.string().min(12),
  alternatives: z.array(z.object({ id: z.string().min(1), description: z.string().min(1) })).min(2),
  selectedAlternativeId: z.string().min(1).nullable(),
  rationale: z.string().min(1),
  falsifier: z.string().min(1),
  status: z.enum(["proposed", "approved", "held", "superseded", "rejected"]),
  owner: z.string().min(1),
  reviewTrigger: z.string().min(1),
}).superRefine((record, context) => {
  if (record.status === "approved" && record.selectedAlternativeId === null) {
    context.addIssue({ code: "custom", path: ["selectedAlternativeId"], message: "approved decisions require a selected alternative" });
  }
  if (record.selectedAlternativeId !== null && !record.alternatives.some((alternative) => alternative.id === record.selectedAlternativeId)) {
    context.addIssue({ code: "custom", path: ["selectedAlternativeId"], message: "selected alternative must be listed" });
  }
});

export const executionGateSchema = z.object({
  id: z.string().regex(/^gate:[a-z0-9][a-z0-9._:-]+$/),
  repository,
  branch: z.string().min(1),
  capability: z.enum(["read", "plan", "write_draft", "execute_check", "write_code", "merge", "deploy", "delete"]),
  allowedPaths: z.array(relativePath).min(1),
  forbiddenPaths: z.array(relativePath).min(1),
  validationSteps: z.array(z.string().min(1)).min(1),
  rollback: z.string().min(1),
  approvalRule: z.enum(["none", "required_before_write", "required_before_execute", "required_before_merge", "required_before_deploy", "blocked"]),
  executed: z.literal(false),
}).superRefine((gate, context) => {
  if (["write_draft", "execute_check", "write_code", "merge", "deploy", "delete"].includes(gate.capability) && gate.approvalRule === "none") {
    context.addIssue({ code: "custom", path: ["approvalRule"], message: "mutating or external actions require an explicit non-none approval rule" });
  }
});

export const verificationReceiptSchema = z.object({
  id: z.string().regex(/^receipt:[a-z0-9][a-z0-9._:-]+$/),
  sourceEvidenceIds: z.array(z.string().regex(/^evidence:/)).min(1),
  decisionId: z.string().regex(/^decision:/),
  expectedResult: z.string().min(1),
  checks: z.array(z.object({ command: z.string().min(1), result: z.enum(["pass", "fail", "not_run"]), outputSha256: sha256.nullable() })).min(1),
  negativeControl: z.object({ description: z.string().min(1), result: z.enum(["rejected", "failed_to_reject", "not_run"]) }),
  outcome: z.enum(["passed", "failed", "inconclusive"]),
  environment: z.object({ runtime: z.string().min(1), operatingSystem: z.string().min(1) }),
}).superRefine((receipt, context) => {
  if (receipt.outcome === "passed" && receipt.checks.some((check) => check.result !== "pass")) {
    context.addIssue({ code: "custom", path: ["outcome"], message: "a passing receipt requires every declared check to pass" });
  }
  if (receipt.outcome === "passed" && receipt.negativeControl.result !== "rejected") {
    context.addIssue({ code: "custom", path: ["negativeControl", "result"], message: "a passing receipt requires a rejected negative control" });
  }
});

export const patternCandidateSchema = z.object({
  id: z.string().regex(/^pattern:[a-z0-9][a-z0-9._:-]+$/),
  statement: z.string().min(12),
  applicability: z.string().min(1),
  falsifier: z.string().min(1),
  supportingCases: z.array(z.object({ repository, jobId: z.string().min(1), receiptId: z.string().regex(/^receipt:/) })).min(2),
  status: z.enum(["candidate", "approved", "expired", "rejected"]),
  reviewAt: z.string().datetime({ offset: true }),
}).superRefine((candidate, context) => {
  if (new Set(candidate.supportingCases.map((entry) => `${entry.repository}:${entry.jobId}`)).size < 2) {
    context.addIssue({ code: "custom", path: ["supportingCases"], message: "a reusable pattern requires two independent jobs" });
  }
});

export type EvidenceRecord = z.infer<typeof evidenceRecordSchema>;
export type DecisionRecord = z.infer<typeof decisionRecordSchema>;
export type ExecutionGate = z.infer<typeof executionGateSchema>;
export type VerificationReceipt = z.infer<typeof verificationReceiptSchema>;
export type PatternCandidate = z.infer<typeof patternCandidateSchema>;
