# Control Center Command Grammar

## Canonical syntax

`/run <domain>.<action> key=value key=value --flag`

Required fields are inferred only when confidence is high. Otherwise the task is created in `needs_input` state.

Common parameters:
- `repo=owner/name`
- `project=slug`
- `agent=persona-id`
- `mode=reasoning-mode`
- `lenses=a,b,c`
- `output=phone-summary|full-report|pr-comment|artifact`
- `risk=auto|low|medium|high`
- `approval=auto-low|always|never` (`never` forbidden for high risk)
- `budget_usd=number`
- `timeout_min=number`
- `branch=ref`
- `dry_run=true|false`

## Phone-first aliases

`/audit repo`
Maps to: `/run repo.audit repo=<repo> agent=repo-archaeologist mode=diagnostic output=phone-summary`

`/fix repo issue`
Maps to: `/run build.fix repo=<repo> agent=build-engineer mode=diagnostic approval=auto-low`

`/qa repo`
Maps to: `/run qa.verify repo=<repo> agent=qa mode=adversarial`

`/chief today`
Maps to: `/run strategy.daily project=portfolio agent=chief-of-staff mode=regenerative`

`/design-system repo`
Maps to: `/run design.extract repo=<repo> agent=design-systems mode=synthesis`

`/package project gumroad`
Maps to: `/run release.package project=<project> channel=gumroad agent=release-manager`

`/funding project`
Maps to: `/run opportunity.scan project=<project> agent=funding mode=funding`

## Control center menu

### NOW
- Today’s brief
- Active tasks
- Waiting approvals
- Failed runs
- Ready-to-ship artifacts

### PROJECTS
- Register project
- View project genome
- Update definition of done
- Compare projects
- Find duplicated capability
- Identify reusable packages

### BUILD
- Audit repo
- Fix build
- Implement feature
- Refactor module
- Upgrade dependency
- Open draft PR

### DESIGN
- Extract visual language
- Generate token specification
- Audit component states
- Specify motion system
- Compare visual systems
- Produce Figma handoff

### VERIFY
- Run build/lint/test
- Accessibility audit
- Performance audit
- Security review
- Documentation drift review
- Release readiness

### NARRATIVE
- README
- Case study
- Product page
- Portfolio entry
- Proposal
- Social excerpts

### INTELLIGENCE
- Funding scan
- Market signal scan
- Tool/library change scan
- Strategic synthesis
- Simulation
- Socratic review

### ADMIN
- Agent registry
- Skill registry
- Workflow registry
- Approval policy
- Cost budgets
- Integration health
- Memory review

## Approval responses

`/approve task=<id> scope=<single-step|workflow|pr|deploy>`

`/reject task=<id> reason="..."`

`/revise task=<id> instruction="..."`

`/explain task=<id> depth=brief|decision|technical|evidence`

`/simulate task=<id> lenses=technical,economic,portfolio`

## Output contracts

### Phone summary
Maximum 900 characters unless failure needs more.

Fields:
- task
- status
- result
- evidence
- risk
- next action
- approval choices

### Full report
- executive summary
- context used
- actions taken
- commands and exit codes
- files changed
- verification evidence
- risks and uncertainties
- decisions and alternatives
- follow-up tasks

### Listenability rules
- lead with the result
- use short paragraphs
- explain code by function, not by dumping it
- expand logs only on request
- define unfamiliar terms once
- state uncertainty plainly
