# Jennipher Agent Studio

Phone-controlled creative technology agent control center for GitHub repos, repo audits, build fixes, design-system extraction, Gumroad packaging, daily strategy briefs, and approval-gated cloud execution.

## First milestone

V0-V3 only:

1. Telegram webhook receives commands.
2. Commands are parsed into tasks.
3. Tasks are saved in Neon Postgres.
4. GitHub App verifies repo access and fetches repo metadata.

No autonomous code editing is enabled in the first milestone.

## Primary command

```txt
/audit qt314wink/nacre-os
```

Expected result:

- task created
- repo metadata fetched
- no files changed
- short phone summary returned

## Setup

Read `docs/00-start-here.md` first.
