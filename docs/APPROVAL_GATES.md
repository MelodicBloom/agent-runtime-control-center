# Approval Gates

> Maps every action class in Jennipher Agent Studio to its required approval tier, enforcement mechanism, and rollback posture.

---

## Gate Tiers

| Tier | Name | Who Approves | Response Window | Enforcement |
|------|------|-------------|----------------|-------------|
| **L0** | Auto-pass | System | Instant | `WRITE_ACTIONS_ENABLED` not required |
| **L1** | Soft gate | Owner (Telegram tap) | 10 min timeout → cancel | `APPROVAL_REQUIRED=true` env check |
| **L2** | Hard gate | Owner (explicit confirm) | 30 min timeout → cancel | Requires `APPROVAL_TOKEN` in request body |
| **L3** | Manual-only | Owner (local CLI / direct GitHub) | No timeout | Agent never executes; returns instruction |

A request that times out without approval is **cancelled and logged** — never silently executed.

---

## Action Matrix

### Audit & Read Actions (L0 — Auto-pass)

These actions read state and produce summaries. They never change files, trigger builds, or affect deployed services.

| Action | Description | API Route |
|--------|-------------|----------|
| Fetch repo metadata | Stars, forks, open PRs, last commit | `GET /api/audit` |
| List open issues | Paginated issue list with labels | `GET /api/audit/issues` |
| Read file contents | Retrieve source file for review | `GET /api/audit/file` |
| Health check | Env vars, Neon, GitHub App, Telegram | `GET /api/setup-doctor` |
| Daily brief | Summarize PRs, issues, build status | `GET /api/brief` |
| List workflows | GitHub Actions runs, statuses | `GET /api/audit/workflows` |

### Task Creation (L1 — Soft gate)

These actions create records (GitHub issues, task queue entries, Telegram messages) but do not modify source code or trigger deployments.

| Action | Description | Approval Mechanism |
|--------|-------------|-------------------|
| Create GitHub issue | Open a new issue from audit finding | Telegram tap — "Create issue? [Yes/Skip]" |
| Queue build task | Add task to approval queue | Telegram tap — "Queue task? [Yes/Skip]" |
| Send Telegram brief | Post daily/weekly summary | Auto-send after L1 confirmation on first run |
| Add issue comment | Append comment to existing issue | Telegram tap |

### Build & Code Actions (L2 — Hard gate)

These actions write files, commit code, open PRs, or trigger CI/CD pipelines. They require an explicit `APPROVAL_TOKEN` from the owner.

| Action | Description | Approval Mechanism |
|--------|-------------|-------------------|
| Commit lockfile | `pnpm install` → commit `pnpm-lock.yaml` | Telegram confirm + `APPROVAL_TOKEN` |
| Open pull request | Agent opens PR from branch | Telegram confirm + `APPROVAL_TOKEN` |
| Apply design-system patch | Write extracted tokens to repo | Telegram confirm + `APPROVAL_TOKEN` |
| Trigger GitHub Actions workflow | `workflow_dispatch` via API | Telegram confirm + `APPROVAL_TOKEN` |
| Gumroad package build | Bundle and stage for upload | Telegram confirm + `APPROVAL_TOKEN` |
| Run Drizzle migrate | Apply pending DB migrations | Telegram confirm + `APPROVAL_TOKEN` |

### Deploy & Destructive Actions (L3 — Manual-only)

The agent **never** executes these autonomously. It returns a plain-language instruction with the exact command or URL for the owner to run manually.

| Action | Description | Agent Behavior |
|--------|-------------|---------------|
| Vercel production deploy | Push to production environment | Returns: "Run `vercel --prod` or trigger via Vercel dashboard" |
| Delete branch | Remove a merged or stale branch | Returns: "Run `git push origin --delete <branch>`" |
| Drop database table | Destructive schema change | Returns: "Run migration manually after backup" |
| Revoke API token / secret | Rotate or delete credentials | Returns: "Rotate via provider dashboard" |
| Transfer repository ownership | Change org or owner | Returns: "Use GitHub Settings > Transfer" |
| Publish npm/Gumroad product | Live public release | Returns: "Confirm and publish manually" |

---

## Enforcement Implementation

### Environment Lock

```ts
// In any write-action handler:
if (process.env.WRITE_ACTIONS_ENABLED !== 'true') {
  return Response.json(
    { error: 'write_actions_disabled', message: 'Set WRITE_ACTIONS_ENABLED=true and provide APPROVAL_TOKEN to unlock.' },
    { status: 403 }
  );
}
```

### Approval Token Check (L2)

```ts
const token = request.headers.get('x-approval-token');
if (token !== process.env.APPROVAL_TOKEN) {
  return Response.json({ error: 'approval_required' }, { status: 403 });
}
```

### Telegram Gate Flow (L1/L2)

1. Agent sends Telegram message: `"[Action]: <description>\n\nApprove? /yes_<taskId> or /no_<taskId>"`
2. Owner taps `/yes_<taskId>`
3. Telegram webhook sets `approvals.<taskId> = true` in task queue
4. Background job re-runs action handler with approved flag
5. If no response in window → task status set to `cancelled`

---

## V0 Constraints (Current)

In the current V0 phase (`WRITE_ACTIONS_ENABLED=false`):

- All L1, L2, L3 actions are **disabled at the route level**
- Only L0 audit/read routes are active
- `/api/audit` creates a task record and returns a phone-readable summary — no files changed
- The approval gate infrastructure (tokens, Telegram webhook handler) is **scaffolded but not wired**
- See `docs/05-permissions-and-approval.md` for the V0 → V1 unlock checklist
