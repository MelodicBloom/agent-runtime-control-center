import { decidePolicy } from "./policy";
import { agents, workflows } from "./registry";
import type { CommandEnvelope, TaskRecord, TaskStatus } from "./types";

function pickAgentId(intent: string): string {
  if (intent.includes("audit") || intent.includes("status")) return "repo-auditor";
  if (intent.includes("design")) return "design-director";
  if (intent.includes("build")) return "build-planner";
  if (intent.includes("fix")) return "build-planner";
  return "strategy-synthesizer";
}

function pickWorkflowId(intent: string): string | undefined {
  if (intent === "repo.audit" || intent === "repo.status") return "repo.audit.v0";
  if (intent === "repo.build_check") return "repo.build_check.plan.v0";
  return undefined;
}

function initialStatus(policy: ReturnType<typeof decidePolicy>): TaskStatus {
  if (policy.riskLevel === "blocked" || policy.approvalRule === "blocked") return "blocked";
  if (!policy.allowed) return "waiting_for_approval";
  return "queued";
}

export function createTaskRecord(envelope: CommandEnvelope): TaskRecord {
  const policy = decidePolicy(envelope.requestedCapability);
  const agentId = pickAgentId(envelope.intent);
  const workflowId = pickWorkflowId(envelope.intent);
  const now = new Date().toISOString();

  const agentExists = agents.some((agent) => agent.id === agentId);
  const workflowExists = workflowId ? workflows.some((workflow) => workflow.id === workflowId) : true;

  return {
    id: crypto.randomUUID(),
    envelope,
    agentId: agentExists ? agentId : "strategy-synthesizer",
    workflowId: workflowExists ? workflowId : undefined,
    riskLevel: policy.riskLevel,
    approvalRule: policy.approvalRule,
    status: initialStatus(policy),
    inputs: {
      target: envelope.target,
      requestedCapability: envelope.requestedCapability,
    },
    outputs: {},
    logs: [
      {
        at: now,
        level: policy.allowed ? "info" : policy.riskLevel === "blocked" ? "error" : "warning",
        event: "task.created",
        data: {
          source: envelope.source,
          intent: envelope.intent,
          target: envelope.target,
          policy,
        },
      },
    ],
    nextAction: policy.allowed
      ? "Run allowed read/plan workflow stage."
      : policy.approvalRule === "blocked"
        ? "Stop. This capability is blocked by default."
        : `Request approval: ${policy.approvalRule}.`,
    createdAt: now,
    updatedAt: now,
  };
}
