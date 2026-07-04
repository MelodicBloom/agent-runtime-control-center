# 01 — Agent Operations Center V0

## Plain-language definition

The Agent Operations Center is a phone-controlled command layer for Jennipher's creative technology work. It turns short mobile commands into structured, approval-gated technical tasks across GitHub repositories, design systems, product packaging, portfolio work, research, and daily strategic planning.

It is not a vague chatbot. It is an operations surface for delegated technical work.

## Core promise

From a phone, Jennipher can ask the system to inspect a repo, plan a build, check risk, propose fixes, summarize what changed, and prepare handoff-ready next actions without silently editing code or overwriting unrelated files.

## V0 boundary

V0 is intentionally narrow.

It may:

- receive commands from a phone interface,
- parse commands into typed tasks,
- save task records,
- look up GitHub repository metadata,
- classify risk,
- produce a concise phone summary,
- recommend next actions,
- stop at approval gates.

It must not:

- autonomously edit source files,
- merge pull requests,
- deploy production systems,
- run destructive commands,
- overwrite unrelated files,
- hide reasoning, risk, or uncertainty.

## Primary user

Jennipher Troup, operating as a creative technologist, design-system builder, research synthesizer, portfolio strategist, and regenerative systems thinker.

## Primary interface

Mobile-first command intake. Telegram is the initial target because it supports short commands, webhook routing, and phone-native usage.

Future surfaces may include web dashboard, GitHub comments, email commands, Slack, iOS Shortcuts, and scheduled briefings.

## V0 command set

| Command | Purpose | Writes code? | Approval level |
|---|---|---:|---|
| `/audit owner/repo` | Inspect repo metadata and produce risk-aware summary | No | None |
| `/status owner/repo` | Report repo state, default branch, visibility, and recent known task state | No | None |
| `/plan owner/repo goal` | Produce build plan, QA gates, and safe handoff prompt | No | None |
| `/design-review owner/repo` | Propose design-system and portfolio positioning improvements | No | None |
| `/build-check owner/repo` | Prepare an install/build/test plan for a cloud runtime | No in V0 | Approval required before execution |
| `/fix owner/repo issue` | Draft a fix plan only | No in V0 | Approval required before any branch or file change |

## Task anatomy

Every task must carry:

- `id`: stable task identifier,
- `command`: raw command received,
- `intent`: normalized operation,
- `repo`: optional GitHub repository target,
- `agent`: responsible agent role,
- `reasoningMode`: how the task should think,
- `riskLevel`: none, low, medium, high, or blocked,
- `approvalRule`: when to stop and ask,
- `status`: queued, running, waiting_for_approval, complete, failed, or blocked,
- `inputs`: structured inputs,
- `outputs`: structured outputs,
- `logs`: event trail,
- `nextAction`: the recommended next move.

## Agent roles

### Repo Auditor

Inspects repository metadata, README direction, package/build signals, branch consistency, dependency risks, and documentation quality.

### Build Planner

Turns a goal into scoped implementation steps, files likely affected, commands to run, QA checks, and rollback notes.

### Design Director

Looks for visual-system consistency, semantic tokens, component strategy, motion language, portfolio framing, and distinctiveness.

### QA Steward

Defines test gates, failure modes, acceptance criteria, and review checklists.

### Strategy Synthesizer

Connects repo work to product positioning, Gumroad/package value, funding opportunities, portfolio narrative, and next leverage point.

## Approval model

The system uses default-deny permissions.

| Action | V0 policy |
|---|---|
| Read repo metadata | Allowed |
| Create task record | Allowed |
| Summarize repo | Allowed |
| Recommend next steps | Allowed |
| Create branch | Blocked unless explicit approval |
| Edit file | Blocked unless explicit approval |
| Open PR | Blocked unless explicit approval |
| Merge PR | Blocked unless explicit approval after checks |
| Deploy | Blocked |
| Delete files/data | Blocked |

## First golden path

User sends:

```txt
/audit qt314wink/nacre-os
```

System returns:

```txt
Repo detected: qt314wink/nacre-os
Task queued: audit
Risk: read-only / low
No files changed.
Next: review README, package scripts, dependency posture, design-system direction, and portfolio framing.
```

## Definition of done for V0

V0 is complete when:

- a phone command can become a typed task,
- the task is persisted,
- repo metadata can be fetched,
- risk is stated clearly,
- no code edits occur,
- a concise mobile summary is returned,
- the next action is specific enough to hand off to another agent.

## Design principle

The system should feel like a lantern, not a steering wheel. It orients the work, reveals risk, and proposes next steps, but it does not seize control without explicit approval.
