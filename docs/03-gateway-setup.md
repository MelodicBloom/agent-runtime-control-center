# 03 — Gateway Setup

## What the gateway does

The gateway is the safe front door for ChatGPT, Perplexity, Telegram, dashboard clients, scheduled jobs, and future tools.

External clients call:

```txt
POST /api/gateway/commands
```

The gateway validates the caller, normalizes the command, creates a task record shape, and returns a safe task summary.

In V0 it does not execute code, merge PRs, deploy, or delete resources.

## Route location

```txt
apps/web/app/api/gateway/commands/route.ts
```

After Vercel deploys the app, the public URL becomes:

```txt
https://YOUR-VERCEL-DOMAIN.vercel.app/api/gateway/commands
```

## Required Vercel environment variables

Add these in:

```txt
Vercel → Project → Settings → Environment Variables
```

Gateway client keys:

```txt
GATEWAY_CHATGPT_KEY=<random-secret-for-chatgpt>
GATEWAY_PERPLEXITY_KEY=<random-secret-for-perplexity>
GATEWAY_TELEGRAM_KEY=<random-secret-for-telegram>
GATEWAY_DASHBOARD_KEY=<random-secret-for-dashboard>
GATEWAY_API_KEY=<general-api-gateway-secret>
```

Internal control-plane key:

```txt
CONTROL_PLANE_API_KEY=<random-internal-secret>
```

Database:

```txt
DATABASE_URL=<neon-postgres-connection-string>
```

Provider secrets, added only when each capability is wired:

```txt
OPENAI_API_KEY=
PERPLEXITY_API_KEY=
TELEGRAM_BOT_TOKEN=
GITHUB_APP_ID=
GITHUB_APP_PRIVATE_KEY=
GITHUB_INSTALLATION_ID=
```

## Generate strong secrets

Use a password manager or run:

```bash
openssl rand -hex 32
```

Use a different secret for each gateway client. Do not reuse the same key for ChatGPT, Perplexity, Telegram, and dashboard.

## Request format

```bash
curl -X POST "https://YOUR-VERCEL-DOMAIN.vercel.app/api/gateway/commands" \
  -H "Authorization: Bearer $GATEWAY_CHATGPT_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "actor": "qt314wink",
    "command": "/audit qt314wink/nacre-os",
    "callbackId": "chatgpt-thread-manual-test",
    "clientRequestId": "manual-test-001"
  }'
```

## Expected response shape

```json
{
  "accepted": true,
  "gateway": {
    "source": "chatgpt",
    "actor": "qt314wink",
    "clientRequestId": "manual-test-001"
  },
  "task": {
    "id": "uuid",
    "intent": "repo.audit",
    "target": {
      "type": "github_repo",
      "id": "qt314wink/nacre-os"
    },
    "status": "queued",
    "riskLevel": "low",
    "approvalRule": "none",
    "nextAction": "Run allowed read/plan workflow stage."
  },
  "warnings": []
}
```

## Client routing logic

The gateway identifies the caller by matching the bearer token against one of these env vars:

| Source | Secret |
|---|---|
| ChatGPT | `GATEWAY_CHATGPT_KEY` |
| Perplexity | `GATEWAY_PERPLEXITY_KEY` |
| Telegram | `GATEWAY_TELEGRAM_KEY` |
| Dashboard | `GATEWAY_DASHBOARD_KEY` |
| Generic API | `GATEWAY_API_KEY` |

## Next wiring step

After this route is deployed and tested, wire persistence:

1. Insert task into `tasks`.
2. Insert first event into `task_logs`.
3. Insert workflow run into `workflow_runs` if a workflow is selected.
4. Insert approval row if approval is required.
5. Return persisted task id instead of in-memory task id.

## Safety rule

The gateway can accept commands. It cannot bypass policy. All write, execute, merge, deploy, and delete capabilities must pass through the control-plane approval model.
