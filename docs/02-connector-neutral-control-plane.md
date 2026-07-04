# 02 — Connector-Neutral Control Plane

## Purpose

The Agent Operations Center must work from ChatGPT, Perplexity, Telegram, GitHub, scheduled briefings, and future interfaces without becoming a separate product for every surface.

The solution is a connector-neutral control plane: every external interface becomes an adapter that reads from and writes to the same tasks, approvals, agents, workflows, actions, artifacts, and logs.

## Core rule

No channel owns the work.

ChatGPT, Perplexity, Telegram, GitHub comments, web dashboard, and scheduled automations are only command surfaces. The control plane owns state, permissions, workflow status, and audit history.

## System layers

### 1. Command surfaces

These receive human intent.

- ChatGPT conversation
- Perplexity thread
- Telegram mobile command
- GitHub issue or PR comment
- Web dashboard
- Scheduled nightly briefing
- Future: Slack, email, iOS Shortcut, voice note

### 2. Adapter layer

Adapters normalize each surface into a shared command envelope.

Each adapter must output:

- `source`: where the command came from,
- `actor`: who requested it,
- `rawInput`: original command text,
- `intent`: normalized intent,
- `target`: repo, project, agent, workflow, or action target,
- `requestedCapability`: read, plan, write, execute, merge, deploy,
- `callback`: where results should be returned,
- `idempotencyKey`: duplicate protection.

### 3. Control plane

The control plane validates, routes, persists, gates, and logs work.

It owns:

- task records,
- agent registry,
- workflow registry,
- action registry,
- approval gates,
- execution runs,
- artifacts,
- event logs,
- policy checks,
- provenance.

### 4. Execution layer

Execution must be replaceable.

Initial execution targets:

- GitHub connector for repo metadata and file operations,
- GitHub Actions for install/build/test,
- Vercel deployments and workflows,
- Neon Postgres for state,
- future sandbox runtime for isolated code execution.

### 5. Return surfaces

Results are sent back to the requester using the original channel when possible.

Examples:

- ChatGPT returns summary and PR link.
- Perplexity returns research-backed implementation plan.
- Telegram returns short phone-friendly status.
- GitHub comment replies with task status.
- Dashboard shows full logs and approvals.

## Required interoperability

### ChatGPT support

ChatGPT should be able to:

- create tasks,
- inspect task status,
- update task plans,
- request approvals,
- summarize logs,
- call GitHub connector actions when explicitly approved,
- write documents/specs/PRs through the control plane.

### Perplexity support

Perplexity should be treated as a research and planning adapter.

It should be able to:

- submit research findings,
- update a task with citations or source notes,
- propose implementation options,
- attach a handoff brief,
- request build-plan approval,
- never silently execute code unless routed through the control plane.

### Agent support

Agents are not magic personas. They are registered capabilities with boundaries.

Each agent must declare:

- name,
- purpose,
- allowed inputs,
- allowed outputs,
- allowed actions,
- risk ceiling,
- approval requirements,
- fallback behavior,
- owner-facing summary format.

### Workflow support

Workflows are repeatable sequences of actions with gates.

Each workflow must declare:

- trigger,
- inputs,
- stages,
- actions,
- approval gates,
- rollback or stop conditions,
- artifacts produced,
- definition of done.

### Action support

Actions are the smallest executable units.

An action must declare:

- action id,
- capability type,
- read/write/execute level,
- required permissions,
- required approval,
- expected side effects,
- success condition,
- failure condition,
- log fields.

## Permission model

The control plane uses explicit capability levels.

| Capability | Meaning | Default |
|---|---|---|
| `read` | Inspect metadata, files, logs, docs, repo state | Allowed for trusted adapters |
| `plan` | Produce instructions, specs, task plans, QA gates | Allowed |
| `write_draft` | Create docs, branches, draft files, draft PRs | Approval required |
| `execute_check` | Run install/build/test/lint in cloud runtime | Approval required |
| `write_code` | Modify source code | Approval required per task |
| `merge` | Merge pull request | Approval required after checks |
| `deploy` | Deploy production system | Blocked in V0 |
| `delete` | Delete files/data/resources | Blocked by default |

## Canonical command envelope

```json
{
  "source": "chatgpt | perplexity | telegram | github | dashboard | schedule",
  "actor": "qt314wink",
  "rawInput": "/audit qt314wink/nacre-os",
  "intent": "repo.audit",
  "target": {
    "type": "github_repo",
    "id": "qt314wink/nacre-os"
  },
  "requestedCapability": "read",
  "callback": {
    "type": "chatgpt_thread | perplexity_thread | telegram_chat | github_comment | dashboard",
    "id": "external-thread-or-chat-id"
  },
  "idempotencyKey": "source:actor:timestamp-or-hash"
}
```

## Canonical task lifecycle

1. Receive command.
2. Normalize command envelope.
3. Validate actor and target.
4. Classify intent and capability.
5. Create task.
6. Attach agent and workflow.
7. Apply policy gate.
8. Run allowed read/plan steps.
9. Stop before write/execute if approval is missing.
10. Return summary, artifacts, and next action.
11. Log everything.

## V0 implementation target

V0 should implement the shared types and route every adapter through them, even if only ChatGPT and Telegram are active at first.

Minimum V0 deliverables:

- shared TypeScript contracts,
- command envelope type,
- task type,
- approval type,
- agent registry type,
- workflow registry type,
- action registry type,
- adapter interface,
- policy guard,
- mock adapter examples for ChatGPT and Perplexity,
- read-only GitHub repo audit action.

## Design principle

Adapters are interchangeable. Tasks are durable. Approvals are explicit. Actions are logged. Agents are bounded. Workflows are repeatable. Nothing important happens invisibly.
