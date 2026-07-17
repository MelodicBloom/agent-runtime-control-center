# Architecture Decision Register

Each decision records provenance, alternatives, rationale, implementation path, risks, and review triggers.

## ADR-001 — GitHub as code source of truth

Chosen: GitHub repos, branches, pull requests, issues, Actions, and releases.

Chosen against:
- storing editable code snapshots in Postgres
- agent-managed proprietary file storage
- direct edits to production servers

Rationale:
GitHub already provides versioning, review, provenance, rollback, and ecosystem integrations. Duplicating code state elsewhere would create drift.

Implementation:
Use a GitHub App with least-privilege repository permissions. Agents may write only to task branches and draft PRs by default.

Provenance:
User repeatedly requested GitHub-first handoffs, agent branches, explicit QA gates, and minimal back-and-forth.

Review trigger:
Revisit only if a required artifact cannot be represented or versioned in GitHub.

## ADR-002 — Neon Postgres for operational memory

Chosen: Neon Postgres with Drizzle ORM.

Chosen against:
- conversation history as memory
- JSON files as the only persistent store
- Firebase as primary store
- a graph database as the first database

Rationale:
The system needs relational integrity, durable workflow state, approvals, audit history, queryable decisions, and preview-environment compatibility. Postgres supports all of these while leaving room for vectors and graph-like relationship tables.

Implementation:
Start relational. Add pgvector and explicit relationship/evidence tables when retrieval quality requires them.

Provenance:
Matches MelodicBloom’s local-first knowledge architecture and the user’s repeated need for evidence, relationships, confidence, and versioning.

## ADR-003 — Telegram first, mobile dashboard second

Chosen: Telegram bot as immediate phone control surface.

Chosen against:
- building a native iOS app first
- Discord as primary
- dashboard-only interaction

Rationale:
Telegram offers fast mobile interaction, webhooks, buttons, notifications, and low implementation overhead. A mobile dashboard remains necessary for deeper review and configuration.

Implementation:
Commands, approval buttons, concise summaries, deep links to dashboard task pages and PRs.

Review trigger:
Move to a native app only when notification, offline, voice, or richer device capability justifies the cost.

## ADR-004 — Durable workflows over ad hoc API chains

Chosen: durable workflow orchestration with persisted steps, retries, waits, and resumability.

Chosen against:
- one long API route
- unmanaged background promises
- cron scripts with no state model

Rationale:
Agent work can take minutes, fail partially, wait for approval, or resume after external events. Durable workflows make state explicit and recoverable.

Implementation:
Every workflow step writes events and idempotency keys. Human approval is a first-class wait state.

## ADR-005 — Isolated sandboxes for command execution

Chosen: Daytona-compatible cloud sandboxes; Docker runner fallback.

Chosen against:
- direct shell access to Vercel runtime
- running commands on the user’s phone or laptop
- permanent shared build VM

Rationale:
Isolation reduces blast radius, improves reproducibility, and allows per-task resource and network policies.

Implementation:
One sandbox per run; clone approved ref; inject short-lived credentials; destroy or archive after log capture.

## ADR-006 — Personas separated from reasoning modes

Chosen: role persona plus composable reasoning lenses.

Chosen against:
- one universal system prompt
- role prompts that mix authority, tone, reasoning, and output format into one opaque block

Rationale:
A Build Engineer may reason diagnostically or adversarially. A Chief of Staff may reason regeneratively or economically. Separation improves reuse, testing, and explainability.

Implementation:
Task context = persona + primary mode + optional secondary lenses + output contract + policy profile.

## ADR-007 — Human approval by risk, not by every action

Chosen: risk-tiered approval gates.

Chosen against:
- full autonomy
- approval before every command

Rationale:
Full autonomy is unsafe; constant approval destroys usefulness. Read-only analysis can run automatically, while irreversible, public, security, or costly actions require approval.

Implementation:
Static rules plus dynamic risk classifier. Any uncertainty escalates rather than silently downgrades risk.

## ADR-008 — Project Genome as canonical project context

Chosen: a structured, versioned genome per project.

Chosen against:
- relying only on README files
- loading all conversation history
- letting each agent infer intent independently

Rationale:
Projects need stable identity, constraints, design DNA, definitions of done, technology preferences, unresolved questions, and relationships to other projects.

Implementation:
Store genome metadata in Postgres and a human-readable version in the project repo. Changes create decision records.

## ADR-009 — Explainable inference records

Chosen: store claim, evidence, confidence, assumptions, counterevidence, expiry, and review status.

Chosen against:
- opaque free-text recommendations
- permanent unqualified agent memory

Rationale:
The user explicitly values traceability, productive uncertainty, and decisions that can be reconstructed without the original author.

Implementation:
Inference records are candidates until accepted, observed, falsified, or expired.
