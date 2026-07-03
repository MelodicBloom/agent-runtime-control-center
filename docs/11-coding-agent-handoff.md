# 11 — Coding Agent Handoff

Paste this into Codex, OpenHands, Kimi, or another coding agent:

```txt
Build the initial version of qt314wink/agent-runtime-control-center.

Goal:
Create a Next.js + Vercel app that acts as Jennipher's phone-controlled agent control center.
Implement only V0-V3 first.

V0: Telegram webhook receives commands.
V1: Commands are parsed into tasks.
V2: Tasks are saved in Neon Postgres using Drizzle ORM.
V3: GitHub App integration verifies access to a repo and fetches repo metadata.

Required commands: /status /help /projects /audit <owner>/<repo>

Required folders:
apps/web
packages/db
packages/agents
packages/workflows
packages/integrations/github
packages/integrations/telegram
packages/policy
packages/context
docs
memory

Database tables:
users, projects, agents, tasks, task_events, approvals, pull_requests, agent_memory, decisions

Rules:
- No pushing to main.
- No production deploys from agent actions.
- No secret access from agents.
- Every task gets a status.
- Every command gets logged.
- Every risky action needs approval.
- Phone summaries must be short and listenable.

Definition of done:
- App runs locally.
- Telegram webhook route exists.
- /help returns command menu.
- /audit <owner>/<repo> creates a task.
- GitHub repo metadata is fetched.
- Task is saved in database.
- No code modification is performed.
- README explains setup.
```
