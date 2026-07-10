# Telegram Bot Setup — Qt314controlbot

> Wiring guide for the Qt314controlbot Telegram webhook that drives Jennipher Agent Studio from your phone.

---

## 1. Create the Bot (if not done)

1. Open Telegram and message [@BotFather](https://t.me/BotFather)
2. Send `/newbot`
3. Name: `Jennipher Agent Studio` (or anything)
4. Username: `Qt314controlbot`
5. Copy the token — it looks like `4839574812:AAFD39kkdpWt3ywyRZergyOLMaJhac60qc`
6. Add to Vercel env: `TELEGRAM_BOT_TOKEN=<token>`

---

## 2. Get Your Chat ID

1. Send any message to `@Qt314controlbot` from your personal account
2. Open in browser:
   ```
   https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
   ```
3. Find `result[0].message.chat.id` in the JSON — that number is your Chat ID
4. Add to Vercel env: `TELEGRAM_CHAT_ID=<number>`

---

## 3. Register the Webhook

Run this once after your Vercel deployment is live. Replace `<TOKEN>` and `<APP_URL>`:

```
https://api.telegram.org/bot<TOKEN>/setWebhook?url=<APP_URL>/api/telegram
```

Expected response:
```json
{ "ok": true, "result": true, "description": "Webhook was set" }
```

Verify it's registered:
```
https://api.telegram.org/bot<TOKEN>/getWebhookInfo
```

---

## 4. Available Commands (V0)

| Command | Action | Gate |
|---------|--------|------|
| `/audit` | Repo metadata, last commit, workflow status | L0 — auto-pass |
| `/health` | Env vars, DB, GitHub App, Telegram health | L0 — auto-pass |
| `/help` | Command menu | L0 — auto-pass |

All V0 commands are read-only. No mutations, no file writes.

---

## 5. Set BotFather Command Menu (Optional but nice)

Message @BotFather:
```
/setcommands
```
Select `@Qt314controlbot`, then paste:
```
audit - Repo metadata + last commit + workflow status
health - Env vars + DB + GitHub App + Telegram status
help - Command menu
```

This adds the `/` autocomplete menu in Telegram.

---

## 6. Security Model

The webhook handler at `POST /api/telegram` only responds to messages where `chat.id === TELEGRAM_CHAT_ID`. Any other sender receives no reply and is silently ignored. This means even if someone discovers the bot username, they cannot trigger any studio action.

In V1, L1/L2 approval flows will use inline keyboard buttons (`InlineKeyboardMarkup`) so you can tap `[Approve] [Reject]` directly in the Telegram thread.
