# Production Workflows and Automation

## Workflow standard

Every workflow must include:
- typed inputs
- preconditions
- context query
- policy profile
- persona and reasoning mode
- deterministic steps
- tool calls
- retry policy
- approval points
- verification gates
- output contract
- memory writeback
- rollback or containment plan

## WF-001 Repo audit

Input:
- repo
- ref, default main
- depth: quick, standard, deep

Steps:
1. verify GitHub App installation and permissions
2. create task and idempotency key
3. assemble project and repo context
4. create sandbox
5. clone exact ref
6. detect framework, package manager, and documented commands
7. install with lockfile enforcement
8. run typecheck, lint, tests, and build when present
9. inspect architecture and documentation drift
10. capture evidence
11. destroy sandbox
12. return summary and prioritized findings

Autonomy: low-risk automatic.

## WF-002 Build fix

Input:
- repo
- failure evidence or task id
- maximum patch scope

Steps:
1. reproduce failure
2. identify root-cause candidates
3. run adversarial counter-check
4. select smallest safe fix
5. create task branch
6. implement
7. run targeted and full checks
8. compare changed behavior
9. commit and open draft PR
10. request review or approval

Guardrails:
- no main push
- no secret access
- no unrelated dependency upgrades
- default changed-file ceiling: 12
- default diff ceiling: 600 lines; exceed only with explicit rationale

## WF-003 Feature implementation

Required before coding:
- requirement contract
- definition of done
- acceptance tests
- affected components
- risk assessment
- chosen approach and rejected alternatives

Output:
- code
- tests
- docs
- decision record
- draft PR

## WF-004 Design-system extraction

Inputs:
- repo, images, deck, or project genome

Outputs:
- primitive tokens
- semantic tokens
- component anatomy
- interaction states
- responsive architecture
- motion tokens
- accessibility constraints
- visual provenance map
- implementation adapters

Regenerative twist:
Detect common primitives across projects and propose shared packages rather than duplicating systems.

## WF-005 Productization

Channels:
- Gumroad
- portfolio
- client handoff
- open-source release
- case study

Checks:
- promise
- audience
- contents
- usability
- licensing
- previews
- documentation
- demo
- support expectations
- price hypothesis

## WF-006 Opportunity intelligence

Fresh retrieval required.

Outputs:
- verified opportunity
- deadline
- eligibility
- project fit
- evidence
- effort estimate
- likely upside
- next action

## WF-007 Daily Chief of Staff brief

Schedule: daily at 8:00 AM user time.

Inputs:
- active projects
- open tasks
- GitHub status
- recent decisions
- pending approvals
- release readiness
- current opportunities

Output:
- highest leverage
- fastest shippable
- blocker
- money move
- creative move
- system maintenance move
- unresolved question

## WF-008 Daily repo health

Schedule: daily at 9:00 AM.

Checks priority repos for:
- failed Actions
- dependency or build drift
- stale PRs
- unresolved issues
- documentation drift
- missing deployment evidence

Notify only on meaningful change.

## WF-009 Daily opportunity scan

Schedule: daily at 11:00 AM.

Searches:
- grants
- residencies
- creative technology roles
- calls for art or prototypes
- incubators
- client opportunities

No notification when nothing materially relevant is found.

## WF-010 Packaging pulse

Schedule: daily at 4:00 PM.

Measures every active product against release definition of done and names the smallest next step toward shipping.

## WF-011 Weekly architecture synthesis

Schedule: Monday morning.

Detects:
- duplicated code and tokens
- recurring workflow needs
- package extraction candidates
- shared narrative themes
- portfolio proof gaps
- stale architectural assumptions

## WF-012 Weekly release review

Schedule: Friday afternoon.

Returns:
- ship now
- ship after one fix
- not ready
- blocked by evidence
- blocked by packaging

## Resource and cost parameters

Defaults:
- task concurrency: 3
- per-repo write concurrency: 1
- sandbox CPU: 4 vCPU
- sandbox memory: 8 GB
- standard timeout: 30 minutes
- deep audit timeout: 90 minutes
- retry count: 2 for transient failures
- model budget per routine task: $1.50
- strategic deep review budget: $6.00
- explicit approval above configured budget

## Memory writeback

A workflow may write:
- observed facts
- accepted decisions
- test evidence
- user-approved preferences
- reusable skill candidates

A workflow may not silently promote:
- speculation
- stale external facts
- unreviewed identity claims
- low-confidence inferences

Inference lifecycle:
candidate -> reviewed -> accepted, falsified, superseded, or expired.
