# Read-Only Repository Audit Runbook v0

Status: promotion gate
Runtime mode: `read_only`
Mutation authority: none

## Purpose

Prove that the control center can inspect one explicitly allowlisted GitHub repository and produce a deterministic audit artifact without possessing or invoking repository mutation capabilities.

## Security boundary

The default policy now hard-blocks:

- `write_draft`;
- `execute_check`;
- `write_code`;
- `merge`;
- `deploy`;
- `delete`.

An approval record does not override the read-only runtime mode. Promotion to `approval_gated` requires a separate code change and Jennipher's explicit review.

## Vertical slice

```text
validated audit request
→ exact repository allowlist check
→ repo.audit.v0 action inspection
→ read-only repository adapter
→ metadata and orientation reads
→ deterministic findings
→ SHA-256 input/output receipt
→ no mutation attempted
```

## Allowed data sources

The injected adapter may expose only:

- repository metadata;
- UTF-8 file reads;
- branch listings;
- pull-request summaries;
- issue summaries.

The core audit contract contains no methods for commits, refs, branches, file writes, issue comments, workflow dispatch, merges, deployments, secrets, or deletion.

## Required request fields

- request ID;
- exact `owner/repository` target;
- explicit allowlist;
- requester identity;
- requested timestamp.

Requests outside the allowlist fail before the adapter is touched.

## Current audit findings

The first core identifies bounded signals only:

- active or archived state;
- README presence;
- `package.json` and `package-lock.json` relationship;
- main/master branch convention drift;
- open non-mergeable pull requests;
- open issue and pull-request counts.

It does not claim full code quality, security, accessibility, design-system consistency, or deployment health from these signals alone.

## Evidence requirements

Automated tests must prove:

1. all mutation capabilities are blocked by default;
2. `repo.audit.v0` contains only read actions with no side effects;
3. non-allowlisted targets fail before any repository read;
4. receipts declare `mutationAttempted: false`;
5. identical snapshots produce identical hashes;
6. unsafe repository targets are rejected;
7. audit outputs preserve evidence strings for each finding.

## Runtime credential requirements

When a real GitHub adapter is added, the GitHub App installation must have read-only permissions for:

- metadata;
- contents;
- pull requests;
- issues.

It must not receive contents-write, workflows-write, administration, deployments, secrets, or actions-write permissions.

The installation token must be short-lived and scoped to the target repository.

## Promotion criteria

The runtime must remain read-only until all of the following are demonstrated:

- a committed lockfile or equivalent frozen dependency contract;
- passing audit-core tests in CI;
- at least ten allowlisted audit runs with no policy violations;
- zero tool calls outside the read adapter;
- credential-redaction verification;
- timeout and retry behavior;
- idempotent duplicate-request handling;
- immutable receipt persistence;
- human review of false positives and missed risks;
- explicit Jennipher approval of a separate mutation-promotion PR.

The ten-run threshold is a provisional operational benchmark, not proof of universal safety.

## Stop conditions

Stop the audit and emit a blocked receipt when:

- the repository is not allowlisted;
- a requested capability is not `read` or `plan`;
- an audit workflow stage references a non-read action;
- an action declares side effects;
- credentials are missing or broader than read-only;
- a target cannot be resolved unambiguously;
- a read response contains an unhandled secret or binary payload;
- persistence would overwrite a prior receipt.

## Explicit exclusions

This PR does not:

- connect to GitHub;
- create database migrations;
- expose a public API route;
- execute builds;
- create branches or pull requests;
- apply patches;
- merge or deploy;
- add OpenAI execution;
- add Telegram or Vercel integration.

## Rollback

Close or revert this PR. The existing architecture remains, but mutation capabilities must not be enabled elsewhere without an equivalent explicit promotion decision.
