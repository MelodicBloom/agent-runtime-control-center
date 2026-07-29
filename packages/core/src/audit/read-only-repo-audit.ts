import type { TaskRecord } from '../control-plane/types.js';

const READ_ONLY_PORT = Symbol('agent-runtime.read-only-audit-port');

export const READ_ONLY_AUDIT_WORKFLOW_ID = 'repo.audit.v0' as const;
export const READ_ONLY_AUDIT_ACTION_IDS = Object.freeze([
  'github.repo.read_metadata',
  'github.file.read_readme',
  'github.file.read_package',
] as const);
export const READ_ONLY_AUDIT_PATHS = Object.freeze([
  'README.md',
  'README',
  'package.json',
] as const);

export interface RepositoryTarget {
  owner: string;
  repo: string;
}

export interface RepositoryMetadata {
  repository: string;
  defaultBranch: string;
  visibility: 'public' | 'private' | 'internal' | 'unknown';
  archived: boolean;
  disabled?: boolean;
  permissions?: Readonly<Record<string, boolean>>;
}

export interface ReadTextFileResult {
  path: string;
  ref: string;
  sha: string;
  text: string;
  byteLength: number;
}

export interface ReadOnlyGitHubReaders {
  getRepositoryMetadata(target: Readonly<RepositoryTarget>): Promise<RepositoryMetadata>;
  readTextFile(
    target: Readonly<RepositoryTarget>,
    path: (typeof READ_ONLY_AUDIT_PATHS)[number],
    ref: string,
  ): Promise<ReadTextFileResult | null>;
}

export interface StrictReadOnlyGitHubAuditPort {
  readonly [READ_ONLY_PORT]: true;
  readonly getRepositoryMetadata: ReadOnlyGitHubReaders['getRepositoryMetadata'];
  readonly readTextFile: ReadOnlyGitHubReaders['readTextFile'];
}

export interface AuditReadReceipt {
  actionId: (typeof READ_ONLY_AUDIT_ACTION_IDS)[number];
  target: string;
  path?: (typeof READ_ONLY_AUDIT_PATHS)[number];
  ref?: string;
  status: 'read' | 'missing' | 'rejected';
  sha?: string;
  byteLength?: number;
  note?: string;
}

export interface RepoAuditArtifact {
  schemaVersion: 'agent-runtime.repo-audit.v0';
  workflowId: typeof READ_ONLY_AUDIT_WORKFLOW_ID;
  taskId: string;
  repository: string;
  generatedAt: string;
  authority: {
    requestedCapability: 'read';
    allowedActionIds: readonly (typeof READ_ONLY_AUDIT_ACTION_IDS)[number][];
    portMethods: readonly ['getRepositoryMetadata', 'readTextFile'];
    mutationSurface: readonly [];
    sourceContentsReturned: false;
  };
  metadata: Omit<RepositoryMetadata, 'permissions'> & {
    permissionsDeclared: boolean;
  };
  files: Array<{
    path: (typeof READ_ONLY_AUDIT_PATHS)[number];
    status: 'present' | 'missing' | 'rejected';
    sha?: string;
    byteLength?: number;
    signals: string[];
  }>;
  risks: string[];
  nextActions: string[];
  receipts: AuditReadReceipt[];
}

export interface RepoAuditOptions {
  maxFileBytes?: number;
  now?: () => string;
}

export class ReadOnlyAuditViolation extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReadOnlyAuditViolation';
  }
}

/**
 * Creates a branded capability port from two read functions only. The executor
 * never receives an Octokit/client object, generic request function, token, or
 * any mutation method.
 */
export function createStrictReadOnlyGitHubAuditPort(
  readers: ReadOnlyGitHubReaders,
): StrictReadOnlyGitHubAuditPort {
  if (typeof readers.getRepositoryMetadata !== 'function') {
    throw new TypeError('getRepositoryMetadata reader is required.');
  }
  if (typeof readers.readTextFile !== 'function') {
    throw new TypeError('readTextFile reader is required.');
  }

  return Object.freeze({
    [READ_ONLY_PORT]: true as const,
    getRepositoryMetadata: readers.getRepositoryMetadata.bind(readers),
    readTextFile: readers.readTextFile.bind(readers),
  });
}

export async function executeReadOnlyRepoAudit(
  task: Readonly<TaskRecord>,
  port: StrictReadOnlyGitHubAuditPort,
  options: RepoAuditOptions = {},
): Promise<RepoAuditArtifact> {
  assertAuthorizedTask(task);
  assertStrictPort(port);

  const target = parseRepositoryTarget(task.envelope.target.id);
  const repository = `${target.owner}/${target.repo}`;
  const maxFileBytes = options.maxFileBytes ?? 256 * 1024;
  const now = options.now ?? (() => new Date().toISOString());

  if (!Number.isSafeInteger(maxFileBytes) || maxFileBytes <= 0) {
    throw new RangeError('maxFileBytes must be a positive safe integer.');
  }

  const receipts: AuditReadReceipt[] = [];
  const metadata = await port.getRepositoryMetadata(target);

  if (metadata.repository.toLowerCase() !== repository.toLowerCase()) {
    throw new ReadOnlyAuditViolation(
      `Reader returned metadata for ${metadata.repository}; expected ${repository}.`,
    );
  }

  receipts.push({
    actionId: 'github.repo.read_metadata',
    target: repository,
    status: 'read',
    note: 'Metadata only; no repository mutation authority was exposed.',
  });

  const files: RepoAuditArtifact['files'] = [];

  for (const path of READ_ONLY_AUDIT_PATHS) {
    const actionId = path === 'package.json'
      ? 'github.file.read_package'
      : 'github.file.read_readme';

    const result = await port.readTextFile(target, path, metadata.defaultBranch);

    if (!result) {
      files.push({ path, status: 'missing', signals: [] });
      receipts.push({
        actionId,
        target: repository,
        path,
        ref: metadata.defaultBranch,
        status: 'missing',
      });
      continue;
    }

    assertExactRead(result, path, metadata.defaultBranch, maxFileBytes);
    const signals = inspectSignals(path, result.text);

    files.push({
      path,
      status: 'present',
      sha: result.sha,
      byteLength: result.byteLength,
      signals,
    });
    receipts.push({
      actionId,
      target: repository,
      path,
      ref: metadata.defaultBranch,
      status: 'read',
      sha: result.sha,
      byteLength: result.byteLength,
      note: 'Source content inspected in-memory and omitted from the artifact.',
    });
  }

  const risks = deriveRisks(metadata, files);
  const nextActions = deriveNextActions(risks);

  return Object.freeze({
    schemaVersion: 'agent-runtime.repo-audit.v0',
    workflowId: READ_ONLY_AUDIT_WORKFLOW_ID,
    taskId: task.id,
    repository,
    generatedAt: now(),
    authority: Object.freeze({
      requestedCapability: 'read',
      allowedActionIds: READ_ONLY_AUDIT_ACTION_IDS,
      portMethods: Object.freeze(['getRepositoryMetadata', 'readTextFile'] as const),
      mutationSurface: Object.freeze([]),
      sourceContentsReturned: false,
    }),
    metadata: {
      repository: metadata.repository,
      defaultBranch: metadata.defaultBranch,
      visibility: metadata.visibility,
      archived: metadata.archived,
      ...(metadata.disabled === undefined ? {} : { disabled: metadata.disabled }),
      permissionsDeclared: metadata.permissions !== undefined,
    },
    files,
    risks,
    nextActions,
    receipts,
  });
}

export function parseRepositoryTarget(id: string): RepositoryTarget {
  const match = /^(?<owner>[A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))\/(?<repo>[A-Za-z0-9._-]{1,100})$/.exec(id.trim());
  if (!match?.groups) {
    throw new ReadOnlyAuditViolation(
      'Repository target must be the exact owner/repo form; URLs, refs, paths, and query strings are rejected.',
    );
  }

  if (match.groups.repo === '.' || match.groups.repo === '..') {
    throw new ReadOnlyAuditViolation('Repository name cannot be a path segment.');
  }

  return Object.freeze({ owner: match.groups.owner, repo: match.groups.repo });
}

function assertAuthorizedTask(task: Readonly<TaskRecord>): void {
  if (task.workflowId !== READ_ONLY_AUDIT_WORKFLOW_ID) {
    throw new ReadOnlyAuditViolation(
      `Expected workflow ${READ_ONLY_AUDIT_WORKFLOW_ID}; received ${String(task.workflowId)}.`,
    );
  }
  if (task.envelope.requestedCapability !== 'read') {
    throw new ReadOnlyAuditViolation(
      `Read-only audit rejects capability ${task.envelope.requestedCapability}.`,
    );
  }
  if (task.envelope.target.type !== 'github_repo') {
    throw new ReadOnlyAuditViolation('Read-only audit accepts github_repo targets only.');
  }
  if (task.status === 'blocked' || task.status === 'waiting_for_approval') {
    throw new ReadOnlyAuditViolation(`Task status ${task.status} is not executable.`);
  }
}

function assertStrictPort(
  port: StrictReadOnlyGitHubAuditPort,
): asserts port is StrictReadOnlyGitHubAuditPort {
  if (!port || port[READ_ONLY_PORT] !== true || !Object.isFrozen(port)) {
    throw new ReadOnlyAuditViolation(
      'Executor requires a frozen port created by createStrictReadOnlyGitHubAuditPort().',
    );
  }
  const keys = Reflect.ownKeys(port);
  const allowed = new Set<PropertyKey>([
    READ_ONLY_PORT,
    'getRepositoryMetadata',
    'readTextFile',
  ]);
  const unexpected = keys.filter((key) => !allowed.has(key));
  if (unexpected.length > 0) {
    throw new ReadOnlyAuditViolation('Read-only port exposes an unexpected authority surface.');
  }
}

function assertExactRead(
  result: ReadTextFileResult,
  expectedPath: (typeof READ_ONLY_AUDIT_PATHS)[number],
  expectedRef: string,
  maxFileBytes: number,
): void {
  if (result.path !== expectedPath || result.ref !== expectedRef) {
    throw new ReadOnlyAuditViolation('Reader returned content outside the requested path/ref boundary.');
  }
  if (!Number.isSafeInteger(result.byteLength) || result.byteLength < 0) {
    throw new ReadOnlyAuditViolation('Reader returned an invalid byte length.');
  }
  if (result.byteLength > maxFileBytes) {
    throw new ReadOnlyAuditViolation(
      `${expectedPath} exceeds the ${maxFileBytes}-byte audit limit.`,
    );
  }
  if (new TextEncoder().encode(result.text).byteLength !== result.byteLength) {
    throw new ReadOnlyAuditViolation('Reader byteLength does not match returned UTF-8 content.');
  }
  if (!/^[a-f0-9]{7,64}$/i.test(result.sha)) {
    throw new ReadOnlyAuditViolation('Reader returned an invalid source SHA.');
  }
}

function inspectSignals(
  path: (typeof READ_ONLY_AUDIT_PATHS)[number],
  text: string,
): string[] {
  if (path !== 'package.json') {
    return [
      /install|setup/i.test(text) ? 'setup-guidance-present' : 'setup-guidance-absent',
      /test|verification|qa/i.test(text) ? 'verification-guidance-present' : 'verification-guidance-absent',
      /license/i.test(text) ? 'license-guidance-present' : 'license-guidance-absent',
    ];
  }

  try {
    const pkg = JSON.parse(text) as {
      scripts?: Record<string, unknown>;
      dependencies?: Record<string, unknown>;
      devDependencies?: Record<string, unknown>;
    };
    const scripts = pkg.scripts ?? {};
    return [
      typeof scripts.build === 'string' ? 'build-script-present' : 'build-script-absent',
      typeof scripts.test === 'string' ? 'test-script-present' : 'test-script-absent',
      typeof scripts.lint === 'string' ? 'lint-script-present' : 'lint-script-absent',
      `dependency-count:${Object.keys(pkg.dependencies ?? {}).length}`,
      `dev-dependency-count:${Object.keys(pkg.devDependencies ?? {}).length}`,
    ];
  } catch {
    return ['package-json-invalid'];
  }
}

function deriveRisks(
  metadata: RepositoryMetadata,
  files: RepoAuditArtifact['files'],
): string[] {
  const risks: string[] = [];
  if (metadata.archived) risks.push('repository-archived');
  if (metadata.disabled) risks.push('repository-disabled');

  const readme = files.find((file) => file.path === 'README.md')
    ?? files.find((file) => file.path === 'README');
  const pkg = files.find((file) => file.path === 'package.json');

  if (!readme || readme.status !== 'present') risks.push('orientation-readme-missing');
  if (pkg?.signals.includes('package-json-invalid')) risks.push('package-json-invalid');
  if (pkg?.signals.includes('build-script-absent')) risks.push('build-script-not-declared');
  if (pkg?.signals.includes('test-script-absent')) risks.push('test-script-not-declared');
  if (pkg?.signals.includes('lint-script-absent')) risks.push('lint-script-not-declared');

  return risks;
}

function deriveNextActions(risks: readonly string[]): string[] {
  if (risks.length === 0) {
    return ['Review the read receipts and decide whether a separately approved build-check plan is warranted.'];
  }
  return risks.map((risk) => `Create a bounded, approval-gated follow-up for: ${risk}.`);
}
