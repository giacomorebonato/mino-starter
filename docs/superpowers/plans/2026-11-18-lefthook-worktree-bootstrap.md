# Lefthook + Worktree Bootstrap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `.githooks/` with lefthook; guarantee every new worktree/clone gets `.env` + applied migrations via layered triggers (git hook, T3 worktree script, postinstall net).

**Architecture:** `scripts/setup-env.ts` (Bun) creates `.env` from `.env.example` with a random `BETTER_AUTH_SECRET` when missing and, because a missing `.env` marks a never-bootstrapped checkout, applies existing migrations (`prisma migrate deploy`, non-interactive). Three layers call it: (1) lefthook `post-checkout` script with null-ref guard → `bun run bootstrap`; (2) T3 project script `runOnWorktreeCreate: bun run bootstrap`; (3) `postinstall` on any `bun install` where `.env` is missing. Lefthook's pre-commit/pre-push mirror the old `.githooks` gates exactly (parity, nothing extra).

**Tech Stack:** Bun (runtime/test/fmt/lint/check), lefthook 2.x, Prisma v7, bash.

**Spec:** Approved design in thread conversation ("Proceed with the design above"): strict hook parity, layered worktree bootstrap, no extra hooks (commit-msg etc. shared as ideas only). Ruling from user: **keep it simple when in doubt**.

## Global Constraints

- Bun only (never npm/pnpm/yarn). `bunx` allowed for one-off local binary resolution.
- Conventions: no semicolons, trailing commas, single quotes, tabs (bun fmt enforced).
- `bun run test:check` must pass before claiming done.
- Unit tests co-located in `__tests__/`.
- CI sets `DATABASE_URL` env var (file:./dev.db); Docker build stage sets `ENV DATABASE_URL=file:./dev.db` and has NO `.git` (dockerignored). Bun: real process env wins over `.env` file values (verified).
- `git worktree add` fires post-checkout with `$1` = null ref (40 zeros), `$3` = 1, hook cwd = new worktree (verified against git source).
- No global lefthook on this machine → fresh-worktree hook shim may silently skip (assert_lefthook_installed stays default false so `git worktree add` never fails on it).
- Knip fails on unused deps/files; it cannot see binary usage inside shell scripts.

## Review Focus

1. Docker build (no `.git`): postinstall must succeed and not create `.env`/run migrations → install-hooks.sh skip (Task 2 smoke) + setup-env DATABASE_URL skip (Task 1 test).
2. CI: `DATABASE_URL` pre-set → setup-env no-op, CI behavior identical to today (Task 1 test).
3. Regular `git checkout`/`switch` must never trigger bootstrap: null-ref guard in hook script (Task 2/5 smoke).
4. Existing clones with `core.hooksPath=.githooks`: bootstrap must unset it or hooks break after `.githooks` removal (Task 3).
5. Fresh worktree created while lefthook binary unresolvable (no node_modules, no global): hook skips silently; T3 script / postinstall still guarantee `.env` + DB (Task 5 end-to-end).

---

### Task 1: `scripts/setup-env.ts` (TDD)

**Files:**
- Create: `scripts/setup-env.ts`
- Test: `scripts/__tests__/setup-env.test.ts`
- Modify: `package.json` (add `setup-env` script; extend `test` with `scripts` dir), `knip.json` (entry: `scripts/__tests__/*.test.ts`)

**Interfaces:**
- Produces: `setupEnv(options: { example: string; env: string; databaseUrlSet?: boolean; migrate?: (env: string) => void | Promise<void> }): Promise<'created' | 'exists' | 'database-url-set'>`, exported for tests; `import.meta.main` block runs repo-root setup with real migrate (`bun run db:deploy`).
- `databaseUrlSet` defaults to `Boolean(process.env.DATABASE_URL)`; tests always pass it explicitly (bun test auto-loads `.env`, so default is truthy locally).

- [ ] **Step 1: Write failing test** `scripts/__tests__/setup-env.test.ts` — five tests: creates `.env` from example with random `BETTER_AUTH_SECRET` (placeholder gone, non-empty value, other lines preserved); no-op returning `'exists'` when `.env` exists; returns `'database-url-set'` and writes no file when `databaseUrlSet: true`; calls `migrate` exactly once per fresh create and never on `'exists'`; two fresh runs produce different secrets. Use `mkdtempSync` temp dirs + cleanup.
- [ ] **Step 2: Verify RED** — Run: `bun test scripts` → expect import failure / `setupEnv` undefined.
- [ ] **Step 3: Implement** `scripts/setup-env.ts` per Interfaces. `import.meta.main`: resolve repo root via `new URL('../', import.meta.url)`, `process.chdir(root)`, call `setupEnv` with real paths and `migrate` = `$`bun run db:deploy`` (from `bun`'s `$`), log result.
- [ ] **Step 4: Verify GREEN** — `bun test scripts` → PASS; then `bun lint && bun fmt && bun check` clean.
- [ ] **Step 5: Wire + commit** — `package.json`: `"setup-env": "bun scripts/setup-env.ts"`; `"test": "bun test backend shared frontend scripts"`. `knip.json` entry add `"scripts/__tests__/*.test.ts"`. Commit: `feat: add setup-env script to create .env and migrate fresh checkouts`.

### Task 2: Lefthook install + config

**Files:**
- Create: `lefthook.yml`, `.lefthook/post-checkout/bootstrap-worktree.sh`, `scripts/install-hooks.sh`
- Modify: `package.json` (devDep lefthook; `postinstall`: `bash scripts/install-hooks.sh && bun run setup-env && bun run db:generate`), `knip.json` (`ignoreDependencies` add `"lefthook"`)

**Interfaces:**
- Consumes: Task 1 `setup-env` via `bun run setup-env`.
- Produces: git hooks installed in common `.git/hooks`; pre-commit (piped: `bun lint` → `bun run format:check` → `bun check`), pre-push (`bun run test:check`), post-checkout (null-ref → `bun run bootstrap`).

- [ ] **Step 1:** `bun add -D lefthook`.
- [ ] **Step 2:** `scripts/install-hooks.sh`: bash, `set -euo pipefail`; `git rev-parse --git-dir >/dev/null 2>&1 || { echo skip; exit 0; }`; `exec lefthook install`. Docker-safe.
- [ ] **Step 3:** `lefthook.yml` per Interfaces (pre-commit piped; no `assert_lefthook_installed`).
- [ ] **Step 4:** `.lefthook/post-checkout/bootstrap-worktree.sh`: guard `[ "${1:-}" = "0000000000000000000000000000000000000000" ] || exit 0`; guard `[ -f package.json ] || exit 0`; `exec bun run bootstrap`. Header comment documents silent-skip + layering.
- [ ] **Step 5:** Update `postinstall` + knip `ignoreDependencies` (knip can't see shell-script binary usage).
- [ ] **Step 6:** Run `bash scripts/install-hooks.sh`; inspect generated hook in `$(git rev-parse --git-common-dir)/hooks/post-checkout` (binary lookup logic). Smoke: `bunx lefthook run pre-commit` → green.
- [ ] **Step 7:** Non-git smoke: `cd /tmp/nongit-test2 && bash <repo>/scripts/install-hooks.sh` → exit 0, skip message.
- [ ] **Step 8:** Commit: `feat: replace .githooks with lefthook (pre-commit, pre-push, worktree bootstrap)`.

### Task 3: bootstrap.sh + remove .githooks + docs

**Files:**
- Modify: `scripts/bootstrap.sh`, `README.md:9,28`, `docs/agents/commands.md` (Scripts + Git hooks sections)
- Delete: `.githooks/pre-commit`, `.githooks/pre-push`

- [ ] **Step 1:** bootstrap.sh: add step after bun install — `bun run setup-env`; replace hooks step: `git config --unset core.hooksPath` (guarded `|| true`) + `bash scripts/install-hooks.sh`; update header comment (env + lefthook).
- [ ] **Step 2:** `git rm .githooks/pre-commit .githooks/pre-push`; verify `git config core.hooksPath` unset → `git config --unset core.hooksPath` locally too (this worktree already migrated by bootstrap run in Step 1? run `bun run bootstrap` to verify end-to-end).
- [ ] **Step 3:** Docs: README (`bun run bootstrap` description + hooks sentence), commands.md (hooks section → lefthook, bootstrap description + env step). Keep terse.
- [ ] **Step 4:** Run `bun run bootstrap` → expect all steps green, `git config core.hooksPath` now unset, `.git/hooks/*` lefthook files present.
- [ ] **Step 5:** Commit: `chore: bootstrap creates .env, migrates lefthook hooks, drops .githooks`.

### Task 4: T3 worktree setup script

- [ ] `t3_project_update` on project `mino-starter` (id `424a59f3-f6d0-46cb-b167-ddf9f4b0af5b`): scripts = `[{id: "bootstrap", name: "Bootstrap", command: "bun run bootstrap", icon: "configure", runOnWorktreeCreate: true}]`. Verify response.

### Task 5: Verification

- [ ] `bun run test:check` green (incl. knip).
- [ ] Pre-commit live: commit any doc tweak → lefthook output visible, gates run.
- [ ] Post-checkout end-to-end: `git worktree add /tmp/mino-wt-smoke -d`; then in that worktree run its common hook directly: `bash $(git -C <repo> rev-parse --git-common-dir)/hooks/post-checkout 0000000000000000000000000000000000000000 $(git rev-parse HEAD) 1` → expect bootstrap runs, `.env` + `prisma/dev.db` exist in smoke worktree. Then `git worktree remove --force /tmp/mino-wt-smoke`.
- [ ] Null-ref guard smoke: invoke hook script with non-null `$1` → exits 0 instantly, no bootstrap output.
- [ ] Final whole-branch review (executing-plans skill), then report.
