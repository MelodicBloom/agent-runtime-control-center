/**
 * POST /api/telegram
 *
 * Webhook handler for Qt314controlbot.
 * Telegram pushes every update here after setWebhook is called.
 *
 * Security: only responds to messages from TELEGRAM_CHAT_ID.
 * All commands in V0 are L0 read-only — no mutations.
 *
 * Register webhook once:
 *   https://api.telegram.org/bot<TOKEN>/setWebhook?url=<APP_URL>/api/telegram
 */

import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? '';

async function sendMessage(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    }),
  });
}

async function handleCommand(text: string, chatId: number): Promise<string> {
  const cmd = text.split(' ')[0].toLowerCase();

  switch (cmd) {
    case '/audit': {
      const res = await fetch(
        `${BASE_URL}/api/audit?owner=MelodicBloom&repo=agent-runtime-control-center`,
        { next: { revalidate: 0 } }
      );
      const data = await res.json();
      return data.telegramSummary ?? '⚠️ Audit failed — check /health';
    }

    case '/health': {
      const res = await fetch(`${BASE_URL}/api/setup-doctor`, { next: { revalidate: 0 } });
      const data = await res.json();
      const icon = data.ok ? '✅' : '⚠️';
      const rows = (data.checks ?? []).map((c: { name: string; status: string }) => {
        const dot = c.status === 'ok' ? '🟢' : c.status === 'disabled' ? '🔒' : '🔴';
        return `${dot} ${c.name}`;
      });
      return [`${icon} *Setup Doctor*`, ``, data.summary, ``, ...rows].join('\n');
    }

    case '/help': {
      return [
        '🤖 *Qt314controlbot — Jennipher Agent Studio*',
        '',
        '`/audit` — Repo metadata + last commit + workflow status _(L0)_',
        '`/health` — Env vars + DB + GitHub App + Telegram status _(L0)_',
        '`/help` — This menu',
        '',
        '_All V0 commands are read-only. Mutations locked._',
      ].join('\n');
    }

    default:
      return `Unknown command: \`${cmd}\`\n\nSend /help for available commands.`;
  }
}

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    const msg = update?.message ?? update?.edited_message;
    if (!msg?.text) return NextResponse.json({ ok: true });

    const chatId: number = msg.chat.id;
    const allowedChatId = process.env.TELEGRAM_CHAT_ID;

    // Security gate — only respond to your own chat
    if (!allowedChatId || String(chatId) !== allowedChatId) {
      return NextResponse.json({ ok: true });
    }

    const reply = await handleCommand(msg.text.trim(), chatId);
    await sendMessage(chatId, reply);
  } catch (err) {
    console.error('[telegram webhook]', err);
  }

  // Always return 200 — Telegram will retry on non-2xx
  return NextResponse.json({ ok: true });
}
