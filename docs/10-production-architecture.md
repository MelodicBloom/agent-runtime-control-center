# Jennipher Agent Studio — Production Architecture

## 1. Mission

Jennipher Agent Studio is a phone-controlled, approval-gated creative technology operating system for GitHub repos, design systems, visual ontology, product packaging, QA, research, strategy, and deployment coordination.

It is not a single chatbot. It is a layered agent organization with explicit identity, memory, policy, workflows, execution boundaries, and human approval.

## 2. System layers

### 2.1 Control surfaces

Primary: Telegram bot.
Secondary: mobile-first Next.js dashboard.
Tertiary: CLI for power use and automation.

Input contract:
- actor identity
- command
- project or repo scope
- optional agent override
- optional reasoning mode
- optional risk tolerance
- optional output format

Example:

`/run build.fix repo=MelodicBloom/nacre-os mode=diagnostic output=phone-summary`

### 2.2 API and orchestration

Chosen: Next.js on Vercel plus durable workflows.

Responsibilities:
- authenticate user and webhook source
- parse commands into typed task intents
- classify risk
- assemble context
- select persona, reasoning mode, tools, and workflow
- persist task state
- pause for approval
- resume after approval
- stream concise updates to phone

### 2.3 Memory and knowledge

Chosen: Neon Postgres with Drizzle ORM.

Stores:
- projects and project genomes
- agents and skills
- tasks and workflow state
- approvals
- commands and execution logs
- decisions and rejected alternatives
- project preferences
- reusable prompts
- evidence and provenance
- inferred relationships and confidence

Memory is structured and versioned. Conversation history is supporting evidence, not the canonical model.

### 2.4 Context assembly

Every task receives the smallest sufficient context bundle:
- active project genome
- repo metadata
- latest relevant task history
- applicable design language
- applicable policies
- selected agent persona
- selected reasoning mode
- current user preferences
- relevant external facts

Unrelated projects and stale context are excluded by default.

### 2.5 Agent layer

Agents are roles with explicit purpose, authority, inputs, outputs, success criteria, and failure conditions.

Core agents:
- Chief of Staff
- Build Engineer
- QA and Verification
- Design Systems Architect
- Visual Ontology Compiler
- Narrative and Productization
- Funding and Opportunity Intelligence
- Release Manager
- Repo Archaeologist
- Security and Policy Reviewer

### 2.6 Reasoning layer

Reasoning modes are composable lenses, not personalities:
- diagnostic
- implementation
- adversarial
- regenerative
- synthesis
- narrative
- funding
- cleanup
- simulation
- systems ecology
- portfolio leverage

A task may run one primary mode and up to three secondary lenses.

### 2.7 Execution layer

Chosen: isolated cloud sandbox provider with OpenHands-compatible coding agent execution.

Required properties:
- ephemeral workspace per task
- repository clone from approved ref
- no direct production filesystem access
- egress restrictions
- command allowlist and denylist
- resource budgets
- full logs
- deterministic teardown

Preferred initial provider: Daytona.
Fallback: self-hosted Docker runner.

### 2.8 Source of truth

GitHub is canonical for code, branches, PRs, issues, releases, and review history.
Postgres is canonical for operational memory, decisions, task state, and approvals.
Vercel is canonical for web deployment state and preview URLs.

## 3. Production workflow contract

Every workflow must declare:
- id and version
- purpose
- accepted inputs
- required context
- agent persona
- reasoning mode
- tool permissions
- risk level
- approval gates
- timeout and retry policy
- expected outputs
- verification steps
- rollback path
- provenance fields

## 4. Risk model

Low risk:
- read repo metadata
- inspect files
- run build, lint, tests in sandbox
- summarize findings

Medium risk:
- edit files on an agent branch
- commit changes
- open draft PR
- create release draft

High risk:
- delete files or data
- modify auth or security
- alter environment variables
- deploy to production
- publish public copy
- incur cost above configured limit

High-risk actions always require explicit approval.

## 5. Regenerative design rules

1. Every completed task should improve future context quality.
2. Repeated patterns should become reusable skills or packages.
3. Duplicate logic across repos should be surfaced for consolidation.
4. Failures should update policy, tests, or documentation.
5. Every important decision records alternatives and rationale.
6. The system may preserve unresolved tensions rather than force a premature conclusion.
7. Each project should become more self-describing over time.

## 6. Socratic recursive multi-lens loop

Each strategic or ambiguous task runs:

1. Clarify the apparent objective.
2. Ask what hidden constraint or assumption matters most.
3. Examine through at least three lenses.
4. Compare conflicts and convergences.
5. Produce a provisional answer with confidence.
6. Ask what evidence would falsify it.
7. Re-run the strongest opposing lens.
8. Return decision, uncertainty, and next experiment.

Default strategic lenses:
- user value
- technical integrity
- economic leverage
- aesthetic coherence
- operational burden
- future optionality

## 7. Initial production target

The first operational release is considered useful only when it can:
- receive commands from a phone
- authenticate the user
- read registered GitHub repos
- create and track tasks
- run repo audits in an isolated sandbox
- return concise summaries
- request approvals
- apply approved changes to a branch
- open draft PRs
- run scheduled daily briefs
- retain project and decision memory
