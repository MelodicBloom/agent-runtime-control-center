# 05 — Human Setup Runbook

This file tells Jennipher exactly what to create manually in GitHub, Vercel, Neon, OpenAI, Perplexity, Telegram, and GitHub Apps.

Do not paste real keys into GitHub files or chat. Add real values only in provider dashboards such as GitHub Secrets or Vercel Environment Variables.

## 1. GitHub repository environments

Open:

```txt
https://github.com/qt314wink/agent-runtime-control-center/settings/environments
```

Create these exact environments:

```txt
development
research
preview
staging
production
dangerous
```

### development

Purpose: CI, install, lint, build, typecheck, draft PR validation.

Settings:

```txt
Required reviewers: off
Wait timer: off
Deployment branches: All branches
```

### research

Purpose: read-only research, repo audits, source gathering.

Settings:

```txt
Required reviewers: off
Wait timer: off
Deployment branches: All branches
```

### preview

Purpose: Vercel preview deployments from feature/fix branches.

Settings:

```txt
Required reviewers: off
Wait timer: off
Deployment branches: Selected branches
Branch patterns:
feat/*
fix/*
preview/*
```

### staging

Purpose: integration testing before production.

Settings:

```txt
Required reviewers: on
Reviewer: qt314wink
Prevent self-review: off
Wait timer: off
Deployment branches: Selected branches
Branch patterns:
main
release/*
```

### production

Purpose: live deployment and production runtime.

Settings:

```txt
Required reviewers: on
Reviewer: qt314wink
Prevent self-review: off
Wait timer: 5 minutes
Deployment branches: Selected branches
Branch patterns:
main
```

### dangerous

Purpose: destructive migrations, deletes, mass rewrites, production data risk.

Settings:

```txt
Required reviewers: on
Reviewer: qt314wink
Prevent self-review: off
Wait timer: 10 minutes
Deployment branches: Selected branches
Branch patterns:
main
```

GitHub docs: https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment

## 2. GitHub repository secrets

Open:

```txt
https://github.com/qt314wink/agent-runtime-control-center/settings/secrets/actions
```

Navigation:

```txt
Repository → Settings → Secrets and variables → Actions → Secrets → New repository secret
```

For each secret:

```txt
Name: paste the variable name exactly
Secret: paste the actual key/value string only
```

Correct example:

```txt
Name: OPENAI_API_KEY
Secret: sk-proj-your-real-key-string
```

Incorrect example:

```txt
Secret: OPENAI_API_KEY=sk-proj-your-real-key-string
```

Create these repository secrets:

```txt
DATABASE_URL
CONTROL_PLANE_API_KEY
GATEWAY_API_KEY
GATEWAY_CHATGPT_KEY
GATEWAY_PERPLEXITY_KEY
GATEWAY_TELEGRAM_KEY
GATEWAY_DASHBOARD_KEY
OPENAI_API_KEY
PERPLEXITY_API_KEY
TELEGRAM_BOT_TOKEN
TELEGRAM_WEBHOOK_SECRET
ADMIN_TELEGRAM_USER_ID
GITHUB_APP_ID
GITHUB_APP_PRIVATE_KEY
GITHUB_INSTALLATION_ID
GITHUB_WEBHOOK_SECRET
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
APP_BASE_URL
DAYTONA_API_KEY
OPENHANDS_BASE_URL
DANGEROUS_OPERATION_CONFIRMATION
```

GitHub secrets docs: https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions

## 3. GitHub environment secrets

Use these only when you want environment-specific values.

Open an environment, then:

```txt
Environment → Environment secrets → Add secret
```

Recommended mapping:

### development

```txt
DATABASE_URL
CONTROL_PLANE_API_KEY
GATEWAY_API_KEY
```

### research

```txt
OPENAI_API_KEY
PERPLEXITY_API_KEY
GATEWAY_CHATGPT_KEY
GATEWAY_PERPLEXITY_KEY
```

### preview

```txt
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
DATABASE_URL
APP_BASE_URL
```

### staging

```txt
DATABASE_URL
CONTROL_PLANE_API_KEY
GITHUB_APP_ID
GITHUB_APP_PRIVATE_KEY
GITHUB_INSTALLATION_ID
GITHUB_WEBHOOK_SECRET
```

### production

```txt
DATABASE_URL
CONTROL_PLANE_API_KEY
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
APP_BASE_URL
```

### dangerous

```txt
DANGEROUS_OPERATION_CONFIRMATION
```

## 4. Vercel project environment variables

Open:

```txt
https://vercel.com/dashboard
```

Navigation:

```txt
Dashboard → select project → Settings → Environment Variables
```

Add these variables to Production, Preview, and Development unless you intentionally want different values:

```txt
DATABASE_URL
CONTROL_PLANE_API_KEY
GATEWAY_API_KEY
GATEWAY_CHATGPT_KEY
GATEWAY_PERPLEXITY_KEY
GATEWAY_TELEGRAM_KEY
GATEWAY_DASHBOARD_KEY
OPENAI_API_KEY
PERPLEXITY_API_KEY
TELEGRAM_BOT_TOKEN
TELEGRAM_WEBHOOK_SECRET
GITHUB_APP_ID
GITHUB_APP_PRIVATE_KEY
GITHUB_INSTALLATION_ID
GITHUB_WEBHOOK_SECRET
APP_BASE_URL
```

Vercel env docs: https://vercel.com/docs/environment-variables

## 5. Neon database

Open:

```txt
https://console.neon.tech/
```

Create:

```txt
Project name: agent-runtime-control-center
Database: agent_runtime
Branch: main or production
```

Copy the pooled Postgres connection string and paste it as:

```txt
Name: DATABASE_URL
Value: postgres://...sslmode=require
```

Put it in both:

```txt
Vercel → Project → Settings → Environment Variables
GitHub → Repo → Settings → Secrets and variables → Actions
```

Neon + Vercel docs: https://neon.com/docs/guides/vercel

## 6. OpenAI API key

Open:

```txt
https://platform.openai.com/api-keys
```

Create a new key, copy the actual key string, then paste it as:

```txt
Name: OPENAI_API_KEY
Secret/Value: your actual OpenAI key
```

OpenAI key page: https://platform.openai.com/api-keys

## 7. Perplexity API key

Open:

```txt
https://www.perplexity.ai/settings/api
```

Create/copy the key, then paste it as:

```txt
Name: PERPLEXITY_API_KEY
Secret/Value: your actual Perplexity key
```

Also create a separate gateway secret for Perplexity:

```txt
Name: GATEWAY_PERPLEXITY_KEY
Secret/Value: random generated string, not your Perplexity API key
```

## 8. Telegram bot

Open Telegram and message:

```txt
@BotFather
```

Create a bot:

```txt
/newbot
```

Copy the bot token into:

```txt
Name: TELEGRAM_BOT_TOKEN
Secret/Value: actual token from BotFather
```

Create a random webhook secret:

```txt
Name: TELEGRAM_WEBHOOK_SECRET
Secret/Value: random generated string
```

Telegram bot docs: https://core.telegram.org/bots/tutorial

## 9. GitHub App

Open:

```txt
https://github.com/settings/apps
```

Navigation:

```txt
Profile photo → Settings → Developer settings → GitHub Apps → New GitHub App
```

Suggested app values:

```txt
GitHub App name: Jennipher Agent Studio
Homepage URL: https://YOUR-VERCEL-DOMAIN.vercel.app
Webhook URL: https://YOUR-VERCEL-DOMAIN.vercel.app/api/github/webhook
Webhook secret: use GITHUB_WEBHOOK_SECRET
Where can this GitHub App be installed?: Only on this account
```

Minimum permissions for V0:

```txt
Contents: Read-only
Metadata: Read-only
Issues: Read-only
Pull requests: Read-only
Actions: Read-only
Checks: Read-only
```

Later, after approval-gated execution is working, upgrade carefully:

```txt
Contents: Read & write
Pull requests: Read & write
Issues: Read & write
Actions: Read & write
```

After creating the app:

```txt
GITHUB_APP_ID = App ID from the app page
GITHUB_APP_PRIVATE_KEY = full private key PEM file contents
GITHUB_INSTALLATION_ID = installation ID after installing the app
GITHUB_WEBHOOK_SECRET = the webhook secret you chose
```

GitHub App registration docs: https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app

## 10. Vercel token and project IDs

Vercel token:

```txt
https://vercel.com/account/settings/tokens
```

Add to GitHub/Vercel as:

```txt
VERCEL_TOKEN
```

To find project/org IDs, locally run after linking the project:

```bash
npx vercel link
cat .vercel/project.json
```

Copy:

```txt
orgId → VERCEL_ORG_ID
projectId → VERCEL_PROJECT_ID
```

Vercel project linking docs: https://vercel.com/docs/cli/project-linking
Vercel env CLI docs: https://vercel.com/docs/cli/env

## 11. Random gateway/control-plane keys

For these, do not use provider API keys. Generate random strings:

```txt
CONTROL_PLANE_API_KEY
GATEWAY_API_KEY
GATEWAY_CHATGPT_KEY
GATEWAY_PERPLEXITY_KEY
GATEWAY_TELEGRAM_KEY
GATEWAY_DASHBOARD_KEY
TELEGRAM_WEBHOOK_SECRET
GITHUB_WEBHOOK_SECRET
```

Generate on a computer:

```bash
openssl rand -hex 32
```

Or use a password manager random generator.

## 12. Setup Doctor test

After deploying to Vercel, open:

```txt
https://YOUR-VERCEL-DOMAIN.vercel.app/api/setup-doctor
```

Use header:

```txt
Authorization: Bearer YOUR_CONTROL_PLANE_API_KEY
```

Expected result: a checklist of configured/missing settings, with no secret values returned.

## 13. Gateway test

```bash
curl -X POST "https://YOUR-VERCEL-DOMAIN.vercel.app/api/gateway/commands" \
  -H "Authorization: Bearer YOUR_GATEWAY_CHATGPT_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "actor": "qt314wink",
    "command": "/audit qt314wink/agent-runtime-control-center",
    "callbackId": "manual-test-001",
    "clientRequestId": "manual-test-001"
  }'
```

Expected result: accepted task preview with risk, approval rule, and next action.
