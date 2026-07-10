/**
 * GET /api/audit?owner=<owner>&repo=<repo>
 *
 * V0 read-only audit endpoint. L0 gate — auto-pass, no WRITE_ACTIONS_ENABLED required.
 *
 * What it does:
 *   1. Fetches repo metadata from GitHub API using GitHub App installation token
 *   2. Fetches open PR count and most recent workflow run status
 *   3. Creates a task record in Neon (tasks table) with status 'pending'
 *   4. Returns a Telegram-formatted phone summary + structured JSON
 *
 * What it NEVER does:
 *   - Writes, patches, or deletes any file in the repo
 *   - Opens PRs or issues
 *   - Triggers workflow_dispatch
 *   - Reads WRITE_ACTIONS_ENABLED (not needed for L0)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getInstallationToken } from '../../lib/github-app-token';

const GITHUB_API = 'https://api.github.com';

async function ghFetch(path: string, token: string) {
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`GitHub API ${path} -> ${res.status} ${res.statusText}`);
  return res.json();
}

function telegramSummary(data: {
  owner: string;
  repo: string;
  defaultBranch: string;
  stars: number;
  openIssues: number;
  openPRs: number;
  lastCommitSha: string;
  lastCommitMsg: string;
  lastWorkflowStatus: string;
  taskId: string;
}) {
  return [
    `📡 *Audit: ${data.owner}/${data.repo}*`,
    ``,
    `🌿 Branch: \`${data.defaultBranch}\``,
    `⭐ Stars: ${data.stars}  |  🐛 Issues: ${data.openIssues}  |  🔀 PRs: ${data.openPRs}`,
    ``,
    `📦 Last commit:`,
    `\`${data.lastCommitSha.slice(0, 7)}\` — ${data.lastCommitMsg.split('\n')[0].slice(0, 72)}`,
    ``,
    `⚙️ Last workflow: ${workflowEmoji(data.lastWorkflowStatus)} ${data.lastWorkflowStatus}`,
    ``,
    `🪪 Task ID: \`${data.taskId}\``,
    `_Read-only audit — no files changed_`,
  ].join('\n');
}

function workflowEmoji(status: string) {
  if (status === 'success') return '✅';
  if (status === 'failure') return '❌';
  if (status === 'in_progress') return '🔄';
  return '⚪';
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');

  if (!owner || !repo) {
    return NextResponse.json(
      { error: 'missing_params', message: 'Provide ?owner=<owner>&repo=<repo>' },
      { status: 400 }
    );
  }

  try {
    let token: string;
    try {
      token = await getInstallationToken();
    } catch {
      // Fall back to GITHUB_TOKEN if App creds not configured yet
      const pat = process.env.GITHUB_TOKEN;
      if (!pat) throw new Error('No GitHub credentials configured. Set GITHUB_APP_* or GITHUB_TOKEN.');
      token = pat;
    }

    // Parallel fetch: repo metadata + open PRs + latest workflow run
    const [repoData, prsData, workflowsData] = await Promise.all([
      ghFetch(`/repos/${owner}/${repo}`, token),
      ghFetch(`/repos/${owner}/${repo}/pulls?state=open&per_page=1`, token),
      ghFetch(`/repos/${owner}/${repo}/actions/runs?per_page=1`, token).catch(() => ({ workflow_runs: [] })),
    ]);

    // Latest commit on default branch
    const defaultBranch = repoData.default_branch ?? 'main';
    const branchData = await ghFetch(`/repos/${owner}/${repo}/branches/${defaultBranch}`, token);
    const lastCommitSha: string = branchData.commit?.sha ?? 'unknown';
    const lastCommitMsg: string = branchData.commit?.commit?.message ?? 'unknown';

    // Open PR count (use Link header pagination hint if available, else length)
    const openPRs: number = Array.isArray(prsData) ? (prsData.length > 0 ? repoData.open_issues_count : 0) : 0;
    const lastWorkflowStatus: string = workflowsData.workflow_runs?.[0]?.conclusion ?? workflowsData.workflow_runs?.[0]?.status ?? 'unknown';

    // Create task record in Neon (fire-and-forget, non-blocking on failure)
    const taskId = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    try {
      const { db } = await import('@jennipher/db/client');
      const { tasks } = await import('@jennipher/db/schema');
      await db.insert(tasks).values({
        id: taskId,
        command: `audit ${owner}/${repo}`,
        parsedIntent: { type: 'audit', owner, repo },
        status: 'pending',
        riskLevel: 'low',
        createdFrom: 'api',
        createdBy: 'system',
      });
    } catch (dbErr) {
      // DB not yet configured is non-fatal in V0 — log and continue
      console.warn('[audit] DB insert skipped:', dbErr instanceof Error ? dbErr.message : dbErr);
    }

    const summary = telegramSummary({
      owner,
      repo,
      defaultBranch,
      stars: repoData.stargazers_count ?? 0,
      openIssues: repoData.open_issues_count ?? 0,
      openPRs,
      lastCommitSha,
      lastCommitMsg,
      lastWorkflowStatus,
      taskId,
    });

    return NextResponse.json({
      ok: true,
      taskId,
      owner,
      repo,
      defaultBranch,
      stars: repoData.stargazers_count ?? 0,
      openIssues: repoData.open_issues_count ?? 0,
      openPRs,
      lastCommitSha,
      lastCommitMsg: lastCommitMsg.split('\n')[0].slice(0, 120),
      lastWorkflowStatus,
      telegramSummary: summary,
      readOnly: true,
      gateLevel: 'L0',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
