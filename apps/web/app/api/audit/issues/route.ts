/**
 * GET /api/audit/issues?owner=<owner>&repo=<repo>&state=open&page=1
 *
 * L0 read-only — returns paginated issue list with labels, assignees, and age.
 * Never writes, opens, or modifies issues.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getInstallationToken } from '../../../lib/github-app-token';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');
  const state = searchParams.get('state') ?? 'open';
  const page = searchParams.get('page') ?? '1';

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
      const pat = process.env.GITHUB_TOKEN;
      if (!pat) throw new Error('No GitHub credentials configured.');
      token = pat;
    }

    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues?state=${state}&per_page=20&page=${page}&pulls=false`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        next: { revalidate: 0 },
      }
    );

    if (!res.ok) throw new Error(`GitHub API /issues -> ${res.status}`);
    const raw = await res.json();

    // Filter out PRs (GitHub issues endpoint returns both)
    const issues = (Array.isArray(raw) ? raw : []).filter((i: { pull_request?: unknown }) => !i.pull_request).map((i: {
      number: number;
      title: string;
      state: string;
      labels: Array<{ name: string; color: string }>;
      assignees: Array<{ login: string }>;
      created_at: string;
      updated_at: string;
      html_url: string;
    }) => ({
      number: i.number,
      title: i.title,
      state: i.state,
      labels: i.labels.map((l) => ({ name: l.name, color: l.color })),
      assignees: i.assignees.map((a) => a.login),
      createdAt: i.created_at,
      updatedAt: i.updated_at,
      url: i.html_url,
    }));

    return NextResponse.json({
      ok: true,
      owner,
      repo,
      state,
      page: Number(page),
      count: issues.length,
      issues,
      readOnly: true,
      gateLevel: 'L0',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
