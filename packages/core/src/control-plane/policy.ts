import type { ApprovalRule, Capability, PolicyDecision, RiskLevel } from "./types";

export type RuntimeMode = "read_only" | "approval_gated";

/**
 * The runtime remains read-only until a separately reviewed promotion changes
 * the caller's mode. Approval records alone cannot bypass this default.
 */
export const DEFAULT_RUNTIME_MODE: RuntimeMode = "read_only";

const riskByCapability: Record<Capability, RiskLevel> = {
  read: "low",
  plan: "low",
  write_draft: "medium",
  execute_check: "medium",
  write_code: "high",
  merge: "high",
  deploy: "blocked",
  delete: "blocked",
};

const approvalByCapability: Record<Capability, ApprovalRule> = {
  read: "none",
  plan: "none",
  write_draft: "required_before_write",
  execute_check: "required_before_execute",
  write_code: "required_before_write",
  merge: "required_before_merge",
  deploy: "required_before_deploy",
  delete: "blocked",
};

export function decidePolicy(
  capability: Capability,
  runtimeMode: RuntimeMode = DEFAULT_RUNTIME_MODE,
): PolicyDecision {
  if (runtimeMode === "read_only" && capability !== "read" && capability !== "plan") {
    return {
      allowed: false,
      riskLevel: "blocked",
      approvalRule: "blocked",
      reason: `Capability ${capability} is disabled while the runtime is locked to read-only mode.`,
    };
  }

  const riskLevel = riskByCapability[capability];
  const approvalRule = approvalByCapability[capability];
  const blocked = approvalRule === "blocked" || riskLevel === "blocked";

  return {
    allowed: !blocked && approvalRule === "none",
    riskLevel,
    approvalRule,
    reason: blocked
      ? `Capability ${capability} is blocked by default.`
      : approvalRule === "none"
        ? `Capability ${capability} is allowed as a read/plan operation.`
        : `Capability ${capability} requires approval before execution.`,
  };
}
