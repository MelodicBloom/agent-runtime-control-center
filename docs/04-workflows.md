# 04 — Workflows

## Repo Audit

Inspects a repo without changing it. Runs: clone → install → build → lint → test → summarize.

Allowed: git clone, npm install, npm run build, npm test, npm run lint.
Blocked: rm -rf, sudo, curl | bash, git push origin main, vercel --prod, cat .env.

## Build Fix

Changes code only after approval. Steps: create branch → apply minimal fix → run checks → commit → open draft PR → summary.

Definition of done: branch created, files changed, build run, draft PR opened, summary sent, risk stated.

## Design-System Extraction

Outputs: tokens.json, motion.json, components.md, style-guide.md, prompt-modules.md, design-decisions.md.

## Gumroad Package

Outputs: README.md, LICENSE.txt, product-description.md, tokens.json, components/, screenshots/, pricing-notes.md.

## Chief of Staff Brief

Outputs: top 3 priorities, stale projects, blocked tasks, one money move, one creative move, one maintenance move.
