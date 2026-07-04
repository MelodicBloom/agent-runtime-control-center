# 03 — API Gateway Setup

## Purpose

The API Gateway is the secure front door for ChatGPT, Perplexity, Telegram, iOS Shortcuts, GitHub comments, scheduled jobs, and future clients.

Clients should not call internal control-plane routes directly with the master `CONTROL_PLANE_API_KEY`. Instead, each client receives a separate client key. The gateway validates that client key, maps the request to a known source, and then forwards the command into the control plane.

## Why this exists

A gateway lets Jennipher:

- rotate one client key without breaking every integration,
- separate ChatGPT, Perplexity, Telegram, and dashboard permissions,
- rate-limit or disable a single surface,
- keep the internal control-plane key private,
- log every incoming command consistently,
- add new surfaces without changing the core task engine.

## Endpoint layout

These are the public gateway endpoints:

```txt
POST /api/gateway/commands
GET  /api/gateway/health
```

These remain internal/control-plane endpoints:

```txt
POST /api/commands
GET  /api/tasks/:id
POST /api/approvals/:id/decide
```

## Client keys

Add these environment variables in Vercel:

```txt
GATEWAY_CHATGPT_KEY=long-random-secret
GATEWAY_PERPLEXITY_KEY=long-random-secret
GATEWAY_TELEGRAM_KEY=long-random-secret
GATEWAY_DASHBOARD_KEY=long-random-secret
CONTROL_PLANE_API_KEY=separate-long-random-internal-secret
```

Each external client calls the gateway with:

```http
Authorization: Bearer <client-specific-key>
```

The gateway identifies the source from the matching key and normalizes it into a control-plane command envelope.

## Client capability defaults

| Client | Source | Default capability |
|---|---|---|
| ChatGPT | `chatgpt` | read + plan |
| Perplexity | `perplexity` | research + plan |
| Telegram | `telegram` | command intake + status |
| Dashboard | `dashboard` | review + approve |
| Schedule | `schedule` | recurring read/plan summaries |

## Request format

```json
{
  "rawInput": "/audit qt314wink/nacre-os",
  "actor": "qt314wink",
  "callbackId": "chat-thread-or-client-id",
  "callbackUrl": "optional-return-url"
}
```

## Gateway response format

```json
{
  "accepted": true,
  "source": "chatgpt",
  "task": {
    "id": "...",
    "intent": "repo.audit",
    "status": "queued",
    "riskLevel": "low",
    "approvalRule": "none",
    "nextAction": "Run allowed read/plan workflow stage."
  },
  "warnings": []
}
```

## Security rules

1. Never commit gateway keys.
2. Never expose `CONTROL_PLANE_API_KEY` to ChatGPT, Perplexity, Telegram, or browser clients.
3. Use separate client keys per surface.
4. Rotate a client key if it is pasted into a public thread.
5. Treat `deploy`, `delete`, `merge`, and direct `write_code` as blocked or approval-gated.
6. Log every command source, actor, target, and requested capability.

## V0 behavior

V0 gateway behavior is intentionally simple:

1. Validate client key.
2. Identify source.
3. Normalize command.
4. Create task record in memory or Neon.
5. Return task summary.
6. Stop before any write/execute/merge/deploy action unless approval exists.

## Definition of done

The gateway is working when ChatGPT, Perplexity, and Telegram can all submit the same command shape and receive a consistent task result without knowing the internal control-plane key.
