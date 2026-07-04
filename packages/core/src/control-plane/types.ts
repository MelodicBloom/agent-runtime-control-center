export type CommandSource =
  | "chatgpt"
  | "perplexity"
  | "telegram"
  | "github"
  | "dashboard"
  | "schedule"
  | "api";

export type Capability =
  | "read"
  | "plan"
  | "write_draft"
  | "execute_check"
  | "write_code"
  | "merge"
  | "deploy"
  | "delete";

export type RiskLevel = "none" | "low" | "medium" | "high" | "blocked";

export type TaskStatus =
  | "queued"
  | "running"
  | "waiting_for_approval"
  | "complete"
  | "failed"
  | "blocked";

export type ApprovalRule =
  | "none"
  | "required_before_write"
  | "required_before_execute"
  | "required_before_merge"
  | "required_before_deploy"
  | "blocked";

export type CallbackType =
  | "chatgpt_thread"
  | "perplexity_thread"
  | "telegram_chat"
  | "github_comment"
  | "dashboard"
  | "webhook";

export interface CommandTarget {
  type:
    | "github_repo"
    | "github_pr"
    | "github_issue"
    | "workflow"
    | "agent"
    | "project"
    | "document"
    | "unknown";
  id: string;
  metadata?: Record<string, unknown>;
}

export interface CommandCallback {
  type: CallbackType;
  id: string;
  url?: string;
}

export interface CommandEnvelope {
  source: CommandSource;
  actor: string;
  rawInput: string;
  intent: string;
  target: CommandTarget;
  requestedCapability: Capability;
  callback?: CommandCallback;
  idempotencyKey: string;
  receivedAt: string;
}

export interface AgentDefinition {
  id: string;
  name: string;
  purpose: string;
  allowedInputs: string[];
  allowedOutputs: string[];
  allowedActions: string[];
  riskCeiling: RiskLevel;
  approvalRequirements: ApprovalRule[];
  summaryFormat: "phone" | "brief" | "full" | "handoff";
}

export interface ActionDefinition {
  id: string;
  description: string;
  capability: Capability;
  requiredApproval: ApprovalRule;
  expectedSideEffects: string[];
  successCondition: string;
  failureCondition: string;
  logFields: string[];
}

export interface WorkflowStage {
  id: string;
  name: string;
  actionIds: string[];
  approvalGate: ApprovalRule;
  stopCondition?: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  trigger: string;
  inputs: string[];
  stages: WorkflowStage[];
  artifactsProduced: string[];
  definitionOfDone: string[];
}

export interface TaskRecord {
  id: string;
  envelope: CommandEnvelope;
  agentId: string;
  workflowId?: string;
  riskLevel: RiskLevel;
  approvalRule: ApprovalRule;
  status: TaskStatus;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  logs: TaskLogEntry[];
  nextAction?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskLogEntry {
  at: string;
  level: "info" | "warning" | "error";
  event: string;
  data?: Record<string, unknown>;
}

export interface ApprovalRequest {
  id: string;
  taskId: string;
  capability: Capability;
  reason: string;
  requestedBy: string;
  status: "pending" | "approved" | "rejected" | "expired";
  createdAt: string;
  decidedAt?: string;
}

export interface AdapterResult {
  envelope: CommandEnvelope;
  warnings: string[];
}

export interface CommandAdapter {
  source: CommandSource;
  normalize(input: unknown): Promise<AdapterResult> | AdapterResult;
}

export interface PolicyDecision {
  allowed: boolean;
  riskLevel: RiskLevel;
  approvalRule: ApprovalRule;
  reason: string;
}
