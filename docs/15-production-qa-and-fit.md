# Production QA and User-Fit Scorecard

## Completion principle

A feature is complete only when intent, specification, implementation, observable behavior, and evidence agree.

## Functional QA

- [ ] Telegram webhook authenticates source and rejects spoofed requests.
- [ ] Mobile dashboard authenticates the same user identity.
- [ ] Commands parse into typed intents with validation errors.
- [ ] Duplicate webhook delivery does not duplicate work.
- [ ] Tasks persist and resume after process restart.
- [ ] GitHub App tokens are short-lived and scoped to installed repos.
- [ ] Sandboxes are isolated and destroyed or archived according to policy.
- [ ] Read-only tasks cannot mutate repos.
- [ ] Write tasks use task branches and draft PRs.
- [ ] Approval state is checked immediately before a gated action.
- [ ] Build, lint, tests, and command exit codes are preserved as evidence.
- [ ] Phone summaries link to full logs and PRs.
- [ ] Scheduled jobs notify only on meaningful changes.

## Security QA

- [ ] No long-lived GitHub personal token is required.
- [ ] Secrets are never included in model context or logs.
- [ ] Environment variable values are redacted.
- [ ] Command runner uses allowlist, denylist, timeout, and resource limits.
- [ ] Network egress is restricted by workflow profile.
- [ ] Production deployment requires explicit approval.
- [ ] Destructive database migration requires backup and rollback plan.
- [ ] Cross-project context leakage tests pass.
- [ ] Prompt injection from repo content is treated as untrusted data.
- [ ] Audit events are append-only or tamper-evident.

## Reliability QA

- [ ] Every step has an idempotency key.
- [ ] Transient failures retry with bounded backoff.
- [ ] Permanent failures stop without looping.
- [ ] Partial completion is visible.
- [ ] Cancellation releases sandbox and locks.
- [ ] Per-repo write concurrency prevents conflicting branches.
- [ ] Webhook and scheduler events can be replayed safely.
- [ ] Database migrations are versioned and tested against preview branches.

## Context-awareness QA

- [ ] Project genome is loaded for project-specific tasks.
- [ ] Only relevant memories are retrieved.
- [ ] Memory includes source, confidence, and timestamp.
- [ ] Superseded decisions are not presented as current.
- [ ] Unresolved tensions remain visible.
- [ ] User-approved preferences override inferred preferences.
- [ ] Agent can explain which context changed its decision.

## Explainability QA

Every material recommendation includes:
- [ ] decision
- [ ] rationale
- [ ] evidence
- [ ] alternatives considered
- [ ] why alternatives lost
- [ ] assumptions
- [ ] confidence
- [ ] review trigger

## Agent quality QA

- [ ] Persona stays within authority.
- [ ] Reasoning mode matches task type.
- [ ] Output contract is followed.
- [ ] Agent does not claim tests it did not run.
- [ ] QA agent independently verifies builder claims.
- [ ] Low-confidence conclusions are labeled hypotheses.
- [ ] Socratic recursion stops when information gain is low.

## Listenability QA

- [ ] Result appears before process detail.
- [ ] Phone response is concise.
- [ ] No unnecessary schema or code dump interrupts narration.
- [ ] Technical terms are defined once.
- [ ] Full details remain available by link or `/explain`.
- [ ] Next action is explicit.

# Fit against Jennipher’s needs

## Current expressed needs

### Phone control
Evidence of fit:
Telegram command and approval flows; mobile dashboard deep links.

Acceptance:
A repo audit, approval, and PR review can be initiated and understood without opening a laptop.

### GitHub-first agent work
Evidence of fit:
GitHub App, branches, draft PRs, Actions evidence, and no direct main push.

### Explicit production handoffs
Evidence of fit:
Workflow contracts, decision records, definitions of done, and reproducible commands.

### Creative and technical versatility
Evidence of fit:
Separate Build, QA, Design Systems, Visual Ontology, Narrative, Funding, and Release specializations.

### Context awareness
Evidence of fit:
Project genomes, provenance-bearing memory, confidence, and minimal sufficient context assembly.

## Near-future necessary needs

### Shipping products
Supported by productization, release review, Gumroad packaging, demo evidence, and narrative workflows.

### Portfolio positioning
Supported by case-study generation, proof-gap detection, and cross-project synthesis.

### Reliable multi-repo maintenance
Supported by daily health scans, dependency drift review, package extraction, and per-repo write locks.

### Funding and opportunity capture
Supported by verified live opportunity scans with fit and deadline tracking.

## Aspirational needs

### Creative intelligence infrastructure
Supported by project genomes, knowledge relationships, provenance, inference lifecycle, and reusable context assembly.

### Explainable generative compiler
Supported by structured visual observations, rules, negative constraints, tokens, implementation adapters, and evidence links.

### Multi-niche expert studio
Supported by specialization pathways that share policy and memory but maintain domain-specific evaluation rubrics.

# Specialization pathway standard

A new niche specialization must include:
- domain glossary
- canonical sources
- required tools
- persona extension
- reasoning lenses
- input schema
- output schema
- domain QA rubric
- known failure modes
- sample gold-standard task

Initial pathway candidates:
- WebGL and shader performance
- tactile editorial UI systems
- generative art productization
- creative technology grants and residencies
- physical fabrication and deterministic output
- long-form cultural and technical essays
- design-to-code handoff
- agentic workflow architecture

# Release gates

## Alpha
Phone commands, task persistence, GitHub read access, repo audits.

## Beta
Sandbox execution, approvals, branch edits, draft PRs, daily brief.

## Production
Security review, restore tests, monitoring, cost controls, independent QA, deployment runbook, incident response, and successful end-to-end operation on at least three materially different repos.

## Full-capacity target
The system serves code, design, narrative, productization, opportunity, and strategy workflows while retaining consistent memory, provenance, risk policy, and phone-first control.
