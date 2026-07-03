# 08 — GitHub App Setup

Use a GitHub App, not a broad personal token.

Minimum permissions:

```txt
Repository metadata: read
Contents: read/write
Pull requests: read/write
Issues: read/write
Checks: read
Actions: read
Commit statuses: read
```

First milestone may temporarily use `GITHUB_TOKEN` for repo metadata only. Replace with GitHub App installation auth before enabling write actions.

Rules:

- Agent may create branches.
- Agent may open draft PRs.
- Agent may not push to main.
- Agent may not modify secrets.
- Agent may not delete repositories.
