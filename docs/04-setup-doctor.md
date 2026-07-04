# 04 — Setup Doctor

## Purpose

Setup Doctor checks whether the Agent Operations Center has the required environment variables to run safely.

It never returns secret values. It only reports whether each secret or setting is present.

## Route location

```txt
apps/web/app/api/setup-doctor/route.ts
```

After deployment:

```txt
GET https://YOUR-VERCEL-DOMAIN.vercel.app/api/setup-doctor
```

## Authorization

The route accepts either:

```txt
CONTROL_PLANE_API_KEY
```

or:

```txt
GATEWAY_DASHBOARD_KEY
```

as a bearer token.

## Test from terminal

```bash
curl "https://YOUR-VERCEL-DOMAIN.vercel.app/api/setup-doctor" \
  -H "Authorization: Bearer $CONTROL_PLANE_API_KEY"
```

## Expected response

```json
{
  "ready": false,
  "score": 44,
  "total": 16,
  "passed": 7,
  "warnings": 6,
  "failed": 3,
  "checks": [
    {
      "id": "database-url",
      "label": "Neon Postgres database URL",
      "env": "DATABASE_URL",
      "category": "database",
      "severity": "required",
      "configured": false,
      "status": "fail",
      "fixUrl": "https://console.neon.tech/",
      "instructions": "Create or open a Neon project, copy the pooled Postgres connection string, and add it as DATABASE_URL in Vercel and GitHub Actions secrets."
    }
  ],
  "nextActions": [
    "DATABASE_URL: Create or open a Neon project, copy the pooled Postgres connection string, and add it as DATABASE_URL in Vercel and GitHub Actions secrets."
  ],
  "note": "Setup Doctor reports presence/absence only. Secret values are never returned."
}
```

## What it checks

Required:

```txt
DATABASE_URL
CONTROL_PLANE_API_KEY
GATEWAY_API_KEY
```

Recommended:

```txt
GATEWAY_CHATGPT_KEY
GATEWAY_PERPLEXITY_KEY
GATEWAY_TELEGRAM_KEY
GATEWAY_DASHBOARD_KEY
GITHUB_APP_ID
GITHUB_APP_PRIVATE_KEY
GITHUB_INSTALLATION_ID
OPENAI_API_KEY
```

Optional:

```txt
PERPLEXITY_API_KEY
TELEGRAM_BOT_TOKEN
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

## Where to add values

Production runtime:

```txt
Vercel → Project → Settings → Environment Variables
```

GitHub Actions runtime:

```txt
GitHub repo → Settings → Secrets and variables → Actions
```

GitHub protected environments:

```txt
GitHub repo → Settings → Environments
```

## Secret format reminder

When GitHub or Vercel asks for a value, paste the actual secret string.

Correct:

```txt
Name: OPENAI_API_KEY
Value: sk-proj-actual-key-string
```

Incorrect:

```txt
Value: OPENAI_API_KEY=sk-proj-actual-key-string
```

## Next upgrade

After the simple env presence check works, add live connectivity checks:

1. Connect to Neon and run `select version()`.
2. Verify GitHub App authentication.
3. Verify OpenAI API call.
4. Verify Perplexity API call.
5. Verify Telegram bot identity.
6. Verify Vercel project lookup.

Keep each connectivity test read-only.
