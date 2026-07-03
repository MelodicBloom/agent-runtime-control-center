# 06 — Database Schema

Use Neon Postgres with Drizzle ORM.

## Core tables

- users: id, name, telegram_user_id, github_username, role, created_at
- projects: id, name, repo_owner, repo_name, default_branch, project_type, status, priority, genome_path, created_at, updated_at
- agents: id, name, persona, default_reasoning_mode, permission_profile, enabled, created_at
- tasks: id, project_id, agent_id, command, parsed_intent, status, risk_level, created_from, created_by, created_at, completed_at
- task_events: id, task_id, event_type, message, metadata, created_at
- approvals: id, task_id, requested_action, approval_type, status, approved_by, approved_at
- sandbox_runs: id, task_id, provider, sandbox_id, repo_branch, commands_run, exit_code, logs, created_at
- pull_requests: id, task_id, repo, branch, pr_url, status, created_at
- agent_memory: id, project_id, key, value, source, confidence, created_at, updated_at
- decisions: id, project_id, decision, reason, alternatives, tradeoffs, confidence, review_date, created_at
