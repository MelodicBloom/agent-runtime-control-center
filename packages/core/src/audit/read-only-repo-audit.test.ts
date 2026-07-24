import assert from 'node:assert/strict';
import test from 'node:test';

import type { TaskRecord } from '../control-plane/types.js';
import {
  READ_ONLY_AUDIT_PATHS,
  ReadOnlyAuditViolation,
  createStrictReadOnlyGitHubAuditPort,
  executeReadOnlyRepoAudit,
  parseRepositoryTarget,
} from './read-only-repo-audit.js';

function createTask(overrides: Partial<TaskRecord> = {}): TaskRecord {
  const base: TaskRecord = {
    id: 'task_audit_001',
    envelope: {
      source: 'api',
      actor: 'test-actor',
      rawInput: '/audit MelodicBloom/example',
      intent: 'repo.audit',
      target: { type: 'github_repo', id: 'MelodicBloom/example' },
      requestedCapability: 'read',
      idempotencyKey: 'audit-example-001',
      receivedAt: '2026-07-24T00:00:00.000Z',
    },
    agentId: 'repo-auditor',
    workflowId: 'repo.audit.v0',
    riskLevel: 'low',
    approvalRule: 'none',
    status: 'queued',
    inputs: {},
    outputs: {},
    logs: [],
    createdAt: '2026-07-24T00:00:00.000Z',
    updatedAt: '2026-07-24T00:00:00.000Z',
  };

  return { ...base, ...overrides };
}

test('executes only the allowlisted read surface and omits source contents', async () => {
  const calls: string[] = [];
  const secretMarker = 'SOURCE_CONTENT_MUST_NOT_ESCAPE';
  const files = new Map([
    ['README.md', `# Example\n\nSetup, verification, and license. ${secretMarker}`],
    ['package.json', JSON.stringify({ scripts: { build: 'build', test: 'test', lint: 'lint' } })],
  ]);

  const port = createStrictReadOnlyGitHubAuditPort({
    async getRepositoryMetadata(target) {
      calls.push(`metadata:${target.owner}/${target.repo}`);
      return {
        repository: 'MelodicBloom/example',
        defaultBranch: 'main',
        visibility: 'private',
        archived: false,
      };
    },
    async readTextFile(_target, path, ref) {
      calls.push(`file:${path}@${ref}`);
      const text = files.get(path);
      if (text === undefined) return null;
      return {
        path,
        ref,
        sha: 'abcdef1234567890',
        text,
        byteLength: new TextEncoder().encode(text).byteLength,
      };
    },
  });

  assert.deepEqual(Reflect.ownKeys(port).filter((key) => typeof key === 'string'), [
    'getRepositoryMetadata',
    'readTextFile',
  ]);

  const artifact = await executeReadOnlyRepoAudit(createTask(), port, {
    now: () => '2026-07-24T12:00:00.000Z',
  });

  assert.deepEqual(calls, [
    'metadata:MelodicBloom/example',
    ...READ_ONLY_AUDIT_PATHS.map((path) => `file:${path}@main`),
  ]);
  assert.deepEqual(artifact.authority.mutationSurface, []);
  assert.equal(artifact.authority.sourceContentsReturned, false);
  assert.equal(JSON.stringify(artifact).includes(secretMarker), false);
  assert.equal(artifact.files.find((file) => file.path === 'README.md')?.status, 'present');
  assert.equal(artifact.files.find((file) => file.path === 'README')?.status, 'missing');
});

test('rejects every capability other than read before calling the port', async () => {
  let called = false;
  const port = createStrictReadOnlyGitHubAuditPort({
    async getRepositoryMetadata() {
      called = true;
      throw new Error('must not be called');
    },
    async readTextFile() {
      called = true;
      throw new Error('must not be called');
    },
  });

  const task = createTask({
    envelope: {
      ...createTask().envelope,
      requestedCapability: 'write_draft',
    },
  });

  await assert.rejects(
    executeReadOnlyRepoAudit(task, port),
    ReadOnlyAuditViolation,
  );
  assert.equal(called, false);
});

test('rejects non-audit workflows and non-repository targets', async () => {
  const port = createStrictReadOnlyGitHubAuditPort({
    async getRepositoryMetadata() {
      throw new Error('must not be called');
    },
    async readTextFile() {
      throw new Error('must not be called');
    },
  });

  await assert.rejects(
    executeReadOnlyRepoAudit(
      createTask({ workflowId: 'repo.build_check.plan.v0' }),
      port,
    ),
    ReadOnlyAuditViolation,
  );

  const task = createTask();
  task.envelope.target = { type: 'github_pr', id: 'MelodicBloom/example#1' };
  await assert.rejects(executeReadOnlyRepoAudit(task, port), ReadOnlyAuditViolation);
});

test('repository parser rejects URLs, refs, traversal, and query strings', () => {
  assert.deepEqual(parseRepositoryTarget('MelodicBloom/example'), {
    owner: 'MelodicBloom',
    repo: 'example',
  });

  for (const invalid of [
    'https://github.com/MelodicBloom/example',
    'MelodicBloom/example/tree/main',
    'MelodicBloom/example?ref=main',
    'MelodicBloom/..',
    'MelodicBloom/example@main',
  ]) {
    assert.throws(() => parseRepositoryTarget(invalid), ReadOnlyAuditViolation);
  }
});

test('rejects mismatched paths, refs, byte lengths, and repository metadata', async () => {
  const task = createTask();

  const mismatchedRepo = createStrictReadOnlyGitHubAuditPort({
    async getRepositoryMetadata() {
      return {
        repository: 'MelodicBloom/other',
        defaultBranch: 'main',
        visibility: 'private',
        archived: false,
      };
    },
    async readTextFile() {
      return null;
    },
  });
  await assert.rejects(executeReadOnlyRepoAudit(task, mismatchedRepo), ReadOnlyAuditViolation);

  const escapedRead = createStrictReadOnlyGitHubAuditPort({
    async getRepositoryMetadata() {
      return {
        repository: 'MelodicBloom/example',
        defaultBranch: 'main',
        visibility: 'private',
        archived: false,
      };
    },
    async readTextFile(_target, path) {
      return {
        path,
        ref: 'other-branch',
        sha: 'abcdef1234567890',
        text: 'x',
        byteLength: 1,
      };
    },
  });
  await assert.rejects(executeReadOnlyRepoAudit(task, escapedRead), ReadOnlyAuditViolation);
});
