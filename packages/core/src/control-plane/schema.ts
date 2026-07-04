import { index, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const commandSource = pgEnum("command_source", [
  "chatgpt",
  "perplexity",
  "telegram",
  "github",
  "dashboard",
  "schedule",
  "api",
]);

export const capability = pgEnum("capability", [
  "read",
  "plan",
  "write_draft",
  "execute_check",
  "write_code",
  "merge",
  "deploy",
  "delete",
]);

export const riskLevel = pgEnum("risk_level", ["none", "low", "medium", "high", "blocked"]);

export const approvalRule = pgEnum("approval_rule", [
  "none",
  "required_before_write",
  "required_before_execute",
  "required_before_merge",
  "required_before_deploy",
  "blocked",
]);

export const taskStatus = pgEnum("task_status", [
  "queued",
  "running",
  "waiting_for_approval",
  "complete",
  "failed",
  "blocked",
]);

export const approvalStatus = pgEnum("approval_status", [
  "pending",
  "approved",
  "rejected",
  "expired",
]);

export const logLevel = pgEnum("log_level", ["info", "warning", "error"]);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    source: commandSource("source").notNull(),
    actor: text("actor").notNull(),
    rawInput: text("raw_input").notNull(),
    intent: text("intent").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    requestedCapability: capability("requested_capability").notNull(),
    agentId: text("agent_id").notNull(),
    workflowId: text("workflow_id"),
    riskLevel: riskLevel("risk_level").notNull(),
    approvalRule: approvalRule("approval_rule").notNull(),
    status: taskStatus("status").notNull().default("queued"),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    callback: jsonb("callback"),
    envelope: jsonb("envelope").notNull(),
    inputs: jsonb("inputs").notNull().default({}),
    outputs: jsonb("outputs").notNull().default({}),
    nextAction: text("next_action"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    sourceIdx: index("tasks_source_idx").on(table.source),
    actorIdx: index("tasks_actor_idx").on(table.actor),
    targetIdx: index("tasks_target_idx").on(table.targetType, table.targetId),
    statusIdx: index("tasks_status_idx").on(table.status),
  }),
);

export const approvals = pgTable(
  "approvals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id").notNull().references(() => tasks.id),
    capability: capability("capability").notNull(),
    reason: text("reason").notNull(),
    requestedBy: text("requested_by").notNull(),
    status: approvalStatus("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
  },
  (table) => ({
    taskIdx: index("approvals_task_idx").on(table.taskId),
    statusIdx: index("approvals_status_idx").on(table.status),
  }),
);

export const taskLogs = pgTable(
  "task_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id").notNull().references(() => tasks.id),
    level: logLevel("level").notNull().default("info"),
    event: text("event").notNull(),
    data: jsonb("data").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    taskIdx: index("task_logs_task_idx").on(table.taskId),
  }),
);

export const workflowRuns = pgTable(
  "workflow_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id").notNull().references(() => tasks.id),
    workflowId: text("workflow_id").notNull(),
    status: taskStatus("status").notNull().default("queued"),
    currentStageId: text("current_stage_id"),
    outputs: jsonb("outputs").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    taskIdx: index("workflow_runs_task_idx").on(table.taskId),
    workflowIdx: index("workflow_runs_workflow_idx").on(table.workflowId),
  }),
);

export const actionRuns = pgTable(
  "action_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id").notNull().references(() => tasks.id),
    workflowRunId: uuid("workflow_run_id").references(() => workflowRuns.id),
    actionId: text("action_id").notNull(),
    capability: capability("capability").notNull(),
    status: taskStatus("status").notNull().default("queued"),
    inputs: jsonb("inputs").notNull().default({}),
    outputs: jsonb("outputs").notNull().default({}),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    taskIdx: index("action_runs_task_idx").on(table.taskId),
    actionIdx: index("action_runs_action_idx").on(table.actionId),
  }),
);

export const artifacts = pgTable(
  "artifacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id").notNull().references(() => tasks.id),
    kind: text("kind").notNull(),
    title: text("title").notNull(),
    content: jsonb("content").notNull(),
    sourceUri: text("source_uri"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    taskIdx: index("artifacts_task_idx").on(table.taskId),
    kindIdx: index("artifacts_kind_idx").on(table.kind),
  }),
);
