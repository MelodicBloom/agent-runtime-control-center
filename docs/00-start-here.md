# 00 — Start Here

Jennipher Agent Studio is a phone-controlled creative technology agent runtime.

It exists to coordinate GitHub repos, repo audits, build fixes, design-system extraction, Gumroad packaging, daily strategy briefs, and approval-gated cloud execution.

## Build principle

Do not build a vague chatbot. Build an operating system for delegated technical work.

Every task must have:

- command
- agent
- reasoning mode
- risk level
- approval rule
- logs
- output format
- next action

## V0-V3 scope

Build only this first:

1. Telegram command intake.
2. Task parsing.
3. Neon Postgres task records.
4. GitHub repo metadata lookup.

Do not enable autonomous code editing yet.

## Definition of done

From your phone, you can type:

```txt
/audit qt314wink/nacre-os
```

And receive:

- repo detected
- task queued
- risk stated
- no files changed
- short summary returned
