/**
 * GET /api/setup-doctor
 *
 * Read-only environment and infrastructure health check.
 * Returns the status of all required env vars, Neon DB connectivity,
 * GitHub App credentials, Telegram token, and write-action lock state.
 *
 * This route NEVER writes, mutates, or triggers any side effects.
 * It is always L0 (auto-pass) per APPROVAL_GATES.md.
 */

import { NextResponse } from 'next/server';

type CheckStatus = 'ok' | 'missing' | 'error' | 'disabled';

interface HealthCheck {
  name: string;
  status: CheckStatus;
  detail?: string;
}

function envCheck(key: string, label: string, sensitive = true): HealthCheck {
  const val = process.env[key];
  if (!val || val.trim() === '') {
    return { name: label, status: 'missing', detail: `${key} is not set` };
  }
  return {
    name: label,
    status: 'ok',
    detail: sensitive ? `${key} = [redacted, ${val.length} chars]` : `${key} = ${val}`,
  };
}

async function neonCheck(): Promise<HealthCheck> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return { name: 'Neon DB', status: 'missing', detail: 'DATABASE_URL is not set' };
  }
  try {
    // Lightweight connectivity check — import dynamically to avoid build errors if pkg absent
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(url);
    await sql`SELECT 1`;
    return { name: 'Neon DB', status: 'ok', detail: 'Connection successful' };
  } catch (err) {
    return {
      name: 'Neon DB',
      status: 'error',
      detail: err instanceof Error ? err.message : 'Unknown connection error',
    };
  }
}

function writeActionLockCheck(): HealthCheck {
  const enabled = process.env.WRITE_ACTIONS_ENABLED === 'true';
  return {
    name: 'Write-Action Lock',
    status: enabled ? 'disabled' : 'ok',
    detail: enabled
      ? 'WRITE_ACTIONS_ENABLED=true — write/build/deploy actions are UNLOCKED'
      : 'WRITE_ACTIONS_ENABLED is not true — all mutations are locked (V0 safe mode)',
  };
}

export async function GET() {
  const checks: HealthCheck[] = [
    // Core env
    envCheck('DATABASE_URL', 'Neon DB URL'),
    envCheck('GITHUB_APP_ID', 'GitHub App ID', false),
    envCheck('GITHUB_APP_PRIVATE_KEY', 'GitHub App Private Key'),
    envCheck('GITHUB_APP_INSTALLATION_ID', 'GitHub App Installation ID', false),
    envCheck('TELEGRAM_BOT_TOKEN', 'Telegram Bot Token'),
    envCheck('TELEGRAM_CHAT_ID', 'Telegram Chat ID', false),
    envCheck('APPROVAL_TOKEN', 'Approval Token'),
    // Optional but tracked
    envCheck('NEXT_PUBLIC_APP_URL', 'App URL', false),
    // Write-action lock state
    writeActionLockCheck(),
  ];

  // Async checks
  const neon = await neonCheck();
  // Replace the placeholder env check with the live connectivity result
  const dbIdx = checks.findIndex((c) => c.name === 'Neon DB URL');
  if (dbIdx !== -1) checks.splice(dbIdx, 1, neon);

  const allOk = checks.every((c) => c.status === 'ok' || c.status === 'disabled');
  const summary = allOk
    ? 'All systems nominal'
    : `${checks.filter((c) => c.status !== 'ok' && c.status !== 'disabled').length} check(s) need attention`;

  return NextResponse.json(
    {
      ok: allOk,
      summary,
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allOk ? 200 : 207 }
  );
}
