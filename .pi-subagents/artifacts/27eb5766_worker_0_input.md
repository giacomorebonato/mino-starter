# Task for worker

You are a delegated subagent running from a fork of the parent session. Treat the inherited conversation as reference-only context, not a live thread to continue. Do not continue or answer prior messages as if they are waiting for a reply. Your sole job is to execute the task below and return a focused result for that task using your tools.

Task:
Implement Task 1: Project scaffolding + config

## Task Description

Read your task brief first: /Users/giacomorebonato/Code/mino-starter/.superpowers/sdd/2026-07-20-mino-starter/task-1-brief.md
It contains the full task text from the plan.

## Context

This is the first task of a reusable full-stack starter (Bun + React + tRPC + better-auth + Prisma + daisyUI). You are setting up package.json, tsconfig, biome, gitignore, env example, and README skeleton. No application code yet. Later tasks depend on these config files and installed deps.

Global constraints (bind this task):
- Bun only: runtime, package manager, bundler, test runner. No Vite, no Express/Fastify/Hono/Elysia, no npm/pnpm.
- Biome: no semicolons (asNeeded), trailing comma all, single quotes.
- No vendor-specific filenames (e.g., CLAUDE.md). Use AGENTS.md later.
- Latest stable packages via `bun add` (pins exact versions in package.json).
- Path aliases: `@backend/*`, `@frontend/*`, `@shared/*`.
- Root-level dirs: `frontend/`, `backend/`, `shared/`, `prisma/`. No `src/`.

Note: `bun init -y` may create a default index.ts; remove it if present since this project uses frontend/index.html as entry. Ensure `bun.lockb` is generated.

## Your Job

1. Implement exactly what the task specifies
2. Verify with `bun install` and `bun run typecheck`
3. Commit your work
4. Self-review
5. Report back

Work from: /Users/giacomorebonato/Code/mino-starter

While iterating, run focused commands; run full verification once before committing.

## Report Format

Write your full report to /Users/giacomorebonato/Code/mino-starter/.superpowers/sdd/2026-07-20-mino-starter/task-1-report.md

Then report back with ONLY:
- Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
- Commits created (short SHA + subject)
- One-line test summary
- Your concerns, if any
- The report file path

## Acceptance Contract
Acceptance level: checked
Completion is not accepted from prose alone. End with a structured acceptance report.

Criteria:
- criterion-1: Implement the requested change without widening scope

Required evidence: changed-files, tests-added, commands-run, residual-risks, no-staged-files

Finish with a fenced JSON block tagged `acceptance-report` in this shape:
Use empty arrays when no items apply; array fields contain strings unless object entries are shown.
`criteriaSatisfied[].status` must be exactly one of: satisfied, not-satisfied, not-applicable.
`commandsRun[].result` must be exactly one of: passed, failed, not-run.
`manualNotes` and `notes` are optional strings; an empty string means no note and does not satisfy `manual-notes` evidence.
```acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
      "status": "satisfied",
      "evidence": "specific proof"
    }
  ],
  "changedFiles": [
    "src/file.ts"
  ],
  "testsAddedOrUpdated": [
    "test/file.test.ts"
  ],
  "commandsRun": [
    {
      "command": "command",
      "result": "passed",
      "summary": "short result"
    }
  ],
  "validationOutput": [
    "validation output or concise summary"
  ],
  "residualRisks": [
    "none"
  ],
  "noStagedFiles": true,
  "diffSummary": "short description of the diff",
  "reviewFindings": [
    "blocker: file.ts:12 - issue found, or no blockers"
  ],
  "manualNotes": "anything else the parent should know"
}
```