// Drizzle ORM schema for Jennipher Agent Studio
// Run: npm run db:generate && npm run db:migrate

import { pgTable, text, timestamp, integer, jsonb, real } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  telegramUserId: text("telegram_user_id"),
  githubUsername: text("github_username"),
  role: text("role").default("user"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  repoOwner: text("repo_owner").notNull(),
  repoName: text("repo_name").notNull(),
  defaultBranch: text("default_branch").default("main"),
  projectType: text("project_type"),
  status: text("status").default("active"),
  priority: text("priority").default("medium"),
  genomePath: text("genome_path"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  projectId: text("project_id"),
  agentId: text("agent_id"),
  command: text("command").notNull(),
  parsedIntent: jsonb("parsed_intent"),
  status: text("status").default("queued"),
  riskLevel: text("risk_level").default("low"),
  createdFrom: text("created_from"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const taskEvents = pgTable("task_events", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull(),
  eventType: text("event_type").notNull(),
  message: text("message"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const approvals = pgTable("approvals", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull(),
  requestedAction: text("requested_action"),
  approvalType: text("approval_type"),
  status: text("status").default("pending"),
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at"),
});

export const pullRequests = pgTable("pull_requests", {
  id: text("id").primaryKey(),
  taskId: text("task_id"),
  repo: text("repo"),
  branch: text("branch"),
  prUrl: text("pr_url"),
  status: text("status").default("open"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const agentMemory = pgTable("agent_memory", {
  id: text("id").primaryKey(),
  projectId: text("project_id"),
  key: text("key").notNull(),
  value: text("value"),
  source: text("source"),
  confidence: real("confidence"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const decisions = pgTable("decisions", {
  id: text("id").primaryKey(),
  projectId: text("project_id"),
  decision: text("decision").notNull(),
  reason: text("reason"),
  alternatives: jsonb("alternatives"),
  tradeoffs: text("tradeoffs"),
  confidence: real("confidence"),
  reviewDate: text("review_date"),
  createdAt: timestamp("created_at").defaultNow(),
});
